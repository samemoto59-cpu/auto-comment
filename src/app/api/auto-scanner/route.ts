import { NextRequest, NextResponse } from "next/server";
import {
  reactToComment,
  replyToComment,
  sendPrivateReply,
  updateCommentReplyWithMention,
} from "@/lib/facebook";
import { supabase } from "@/lib/supabase";
import { generateSmartCommentReply } from "@/lib/gemini";

const DEFAULT_PAGE_ID = process.env.FACEBOOK_PAGE_ID || "101267342561819";
const DEFAULT_PAGE_TOKEN =
  process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
  process.env.FB_PAGE_ACCESS_TOKEN ||
  "";

export interface CommentActivity {
  commentId: string;
  postId: string;
  pageId: string;
  pageName: string;
  senderName: string;
  senderId?: string;
  message: string;
  createdTime: string;
  hasReplied: boolean;
  replyText?: string;
  permalink?: string;
}

const repliedCommentIds = new Set<string>();

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch all page settings and active statuses from Supabase
    const { data: allSettings } = await supabase.from("bot_settings").select("*");

    const settingsMap = new Map<string, any>();
    let memberPages: Array<{ id: string; name: string; accessToken?: string }> = [];

    if (Array.isArray(allSettings)) {
      allSettings.forEach((row) => {
        if (row.id === "vst_members") {
          try {
            const members = JSON.parse(row.dm_template);
            if (Array.isArray(members)) {
              members.forEach((m: any) => {
                if (Array.isArray(m.pages)) {
                  m.pages.forEach((p: any) => {
                    const isSamMoto = (m.name || "").toLowerCase().includes("sam moto");
                    const pNameLower = (p.name || "").toLowerCase();
                    const isEmmi = pNameLower.includes("emmi") || pNameLower.includes("អេមមី");
                    if (p.accessToken && ((isSamMoto && isEmmi) || p.keepInPrivateApp === true)) {
                      memberPages.push({
                        id: p.id,
                        name: p.name,
                        accessToken: p.accessToken,
                      });
                    }
                  });
                }
              });
            }
          } catch {}
        } else {
          settingsMap.set(row.id, row);
        }
      });
    }

    // Master kill switch check: "default" row
    const defaultSetting = settingsMap.get("default");
    const masterActive = defaultSetting ? defaultSetting.is_active !== false : true;

    if (!masterActive) {
      return NextResponse.json({
        status: "BOT_PAUSED",
        message: "Bot is globally paused by Master Switch",
        activities: [],
        repliesSent: 0,
        totalComments: 0,
      });
    }

    // Check AI smart comment reply settings
    const aiSettingsRow = settingsMap.get("vst_ai_settings");
    let aiReplyMap: Record<string, boolean> = {};
    if (aiSettingsRow?.dm_template) {
      try {
        aiReplyMap = JSON.parse(aiSettingsRow.dm_template);
      } catch {}
    }

    // Check trigger keywords settings
    const keywordsRow = settingsMap.get("vst_keywords");
    let keywordsMap: Record<string, string> = {};
    if (keywordsRow?.dm_template) {
      try {
        keywordsMap = JSON.parse(keywordsRow.dm_template);
      } catch {}
    }

    // 2. Build list of pages to scan (Emmi pages only)
    const pagesToScan: Array<{
      id: string;
      name: string;
      accessToken: string;
      isActive: boolean;
      replyTemplate?: string;
      dmTemplate?: string;
      autoDm?: boolean;
      aiReplyEnabled?: boolean;
      keywords?: string;
    }> = [];

    // Add all connected Emmi pages with their individual tokens and toggle states
    for (const mp of memberPages) {
      const pageSetting = settingsMap.get(mp.id);
      const isPageActive = pageSetting ? pageSetting.is_active !== false : true;
      if (mp.accessToken) {
        pagesToScan.push({
          id: mp.id,
          name: mp.name,
          accessToken: mp.accessToken,
          isActive: isPageActive,
          replyTemplate:
            pageSetting?.reply_templates?.[0] ||
            settingsMap.get("default")?.reply_templates?.[0] ||
            `សួស្ដី {name}! 😊 អរគុណសម្រាប់ការចាប់អារម្មណ៍លើទំព័រ ${mp.name}។ ខ្ញុំបានផ្ញើព័ត៌មានលម្អិតជូនបងហើយណា 💬👉 https://m.me/${mp.id}`,
          dmTemplate:
            pageSetting?.dm_template ||
            settingsMap.get("default")?.dm_template ||
            `សួស្ដីបង {name}! 🌸 អរគុណដែលបាន comment លើទំព័រ ${mp.name}។ តើបងចង់ដឹងព័ត៌មានលម្អិត ឬតម្លៃផលិតផលដែរទេ? ខ្ញុំអាចជួយផ្ដល់ការប្រឹក្សាជូនបងបានភ្លាមៗណា! 💬✨`,
          autoDm: pageSetting?.auto_dm_enabled !== false,
          aiReplyEnabled:
            typeof aiReplyMap[mp.id] === "boolean"
              ? aiReplyMap[mp.id]
              : typeof aiReplyMap["default"] === "boolean"
              ? aiReplyMap["default"]
              : false,
          keywords:
            typeof keywordsMap[mp.id] === "string"
              ? keywordsMap[mp.id]
              : keywordsMap["default"] || "",
        });
      }
    }

    const allActivities: CommentActivity[] = [];
    let repliesSent = 0;
    let totalComments = 0;
    let repliedComments = 0;

    const activePagesToScan = pagesToScan.filter((p) => p.isActive);

    // Helper to scan a single page (Feed Posts + Videos/Reels + Promotable/Ad Posts)
    const scanSinglePage = async (page: (typeof pagesToScan)[0]) => {
      try {
        const postsList: any[] = [];
        const seenCommentIds = new Set<string>();

        const endpoints = [
          `https://graph.facebook.com/v21.0/${page.id}/feed?fields=id,permalink_url,comments.order(reverse_chronological).limit(30){id,message,from,created_time,comments{id,message,from,message_tags,created_time}}&limit=30&access_token=${page.accessToken}`,
          `https://graph.facebook.com/v21.0/${page.id}/videos?fields=id,permalink_url,comments.order(reverse_chronological).limit(30){id,message,from,created_time,comments{id,message,from,message_tags,created_time}}&limit=30&access_token=${page.accessToken}`,
        ];

        const endpointResults = await Promise.allSettled(
          endpoints.map(async (epUrl) => {
            const r = await fetch(epUrl, { cache: "no-store" });
            return r.json();
          })
        );

        for (const resItem of endpointResults) {
          if (resItem.status === "fulfilled" && Array.isArray(resItem.value?.data)) {
            postsList.push(...resItem.value.data);
          }
        }

        if (postsList.length === 0) {
          return;
        }

        for (const post of postsList) {
          if (post.comments && Array.isArray(post.comments.data)) {
            for (const c of post.comments.data) {
              const commentId = c.id;
              if (!commentId || seenCommentIds.has(commentId)) continue;
              seenCommentIds.add(commentId);

              // Skip if comment is from page itself
              if (c.from?.id === page.id) continue;

              totalComments++;

              // Check if page already replied
              const pageReplyObj = c.comments?.data?.find(
                (subC: { from?: { id?: string } }) => subC.from?.id === page.id
              );
              const hasPageReply = Boolean(pageReplyObj) || repliedCommentIds.has(commentId);

              // Try to extract real customer name & ID from message_tags or reply if FB hid c.from
              let senderId = c.from?.id || pageReplyObj?.message_tags?.[0]?.id;
              let senderName = c.from?.name || pageReplyObj?.message_tags?.[0]?.name || "";
              if (!senderName && pageReplyObj?.message) {
                const matchGreeting = pageReplyObj.message.match(/^សួស្ដី,?\s*([^!😊🌸❤️\n]+)[!😊🌸❤️]/);
                if (matchGreeting && matchGreeting[1]) {
                  const candidate = matchGreeting[1].trim();
                  if (candidate !== "បង") senderName = candidate;
                }
              }
              if (!senderName) {
                senderName = "អតិថិជន Facebook";
              }

              const messageText = c.message || "(ស្ទីគ័រ / រូបភាព)";
              const commentAgeSec = (Date.now() - new Date(c.created_time).getTime()) / 1000;

              // Sync lead into Supabase customers (even if FB hid c.from.id, use a deterministic ID per page+name)
              if (senderName && senderName !== "Customer" && senderName !== "អតិថិជន" && senderName !== "អតិថិជន Facebook") {
                try {
                  const effectiveFbUserId =
                    senderId ||
                    `fb_${page.id}_${senderName.trim().toLowerCase().replace(/\s+/g, "_")}`;
                  await supabase.from("customers").upsert(
                    {
                      fb_user_id: effectiveFbUserId,
                      name: senderName,
                      source_page_id: page.id,
                      last_activity_at: c.created_time || new Date().toISOString(),
                    },
                    { onConflict: "fb_user_id" }
                  );
                } catch {}
              }

              let finalHasReplied = hasPageReply;
              let finalReplyText = pageReplyObj?.message || (repliedCommentIds.has(commentId) ? "បានឆ្លើយតបដោយ Bot" : undefined);

              // Check keyword filter if configured for this page
              const keywordList = (page.keywords || "")
                .split(",")
                .map((k) => k.trim().toLowerCase())
                .filter(Boolean);
              const matchesKeywords =
                keywordList.length === 0 ||
                keywordList.some((kw) => messageText.toLowerCase().includes(kw));

              // Reply if no reply yet, older than 2s, and matches trigger keywords
              if (!hasPageReply && commentAgeSec > 2 && matchesKeywords) {
                const userTag = senderId
                  ? `@[${senderId}]`
                  : senderName && senderName !== "Customer" && senderName !== "អតិថិជន" && senderName !== "អតិថិជន Facebook"
                  ? `@${senderName}`
                  : "បង";

                const replyTextTemplate =
                  page.replyTemplate ||
                  `សួស្ដី {name}! ❤️🌸 អរគុណសម្រាប់ការចាប់អារម្មណ៍លើទំព័រ ${page.name}។ ខ្ញុំបានផ្ញើព័ត៌មានលម្អិតជូនបងក្នុងប្រអប់សារ Inbox រួចហើយណាបង 💬👉 https://m.me/${page.id}`;

                let replyMessage = "";
                if (page.aiReplyEnabled) {
                  try {
                    const aiReply = await generateSmartCommentReply({
                      pageName: page.name,
                      pageId: page.id,
                      senderName: senderName,
                      senderId: senderId,
                      userComment: messageText,
                    });
                    if (aiReply) {
                      replyMessage = aiReply;
                    }
                  } catch (aiErr) {
                    console.error("[Auto-Scanner] Gemini AI error, falling back to static template:", aiErr);
                  }
                }

                if (!replyMessage) {
                  replyMessage = replyTextTemplate
                    .replace(/{name}/g, userTag)
                    .replace(/\{pageId\}/g, page.id);
                }

                // STEP 2: Reply to the comment on the Page
                const replyRes = await replyToComment({
                  pageAccessToken: page.accessToken,
                  commentId: commentId,
                  message: replyMessage,
                });

                if (replyRes.id) {
                  repliedCommentIds.add(commentId);
                  repliesSent++;
                  finalHasReplied = true;
                  finalReplyText = replyRes.message || replyMessage;

                  if (replyRes.message_tags?.[0]?.name) {
                    senderName = replyRes.message_tags[0].name;
                    senderId = replyRes.message_tags[0].id || senderId;
                  }

                  // STEP 3: Continue by chatting/DMing the customer in Messenger
                  if (page.autoDm) {
                    try {
                      const dmTextTemplate =
                        page.dmTemplate ||
                        `សួស្ដីបង {name}! 🌸 អរគុណដែលបាន comment លើទំព័រ ${page.name}។ តើបងចង់ដឹងព័ត៌មានលម្អិត ឬតម្លៃផលិតផលដែរទេ? ខ្ញុំអាចជួយផ្ដល់ការប្រឹក្សាជូនបងបានភ្លាមៗណា! 💬✨`;
                      const dmDisplayName =
                        senderName && senderName !== "អតិថិជន Facebook" ? senderName : "បង";
                      const dmMessage = dmTextTemplate
                        .replace(/{name}/g, dmDisplayName)
                        .replace(/\{pageId\}/g, page.id);
                      const dmRes = await sendPrivateReply({
                        pageAccessToken: page.accessToken,
                        commentId: commentId,
                        message: dmMessage,
                      });

                      // If FB initially hid c.from.id on the comment, sendPrivateReply returns recipient_id (PSID)!
                      // Immediately upgrade the comment reply with @[recipient_id] so it shows a real blue @mention tag!
                      if (!senderId && dmRes?.recipient_id) {
                        senderId = dmRes.recipient_id;
                        const upgradedMessage = replyTextTemplate
                          .replace(/{name}/g, `@[${dmRes.recipient_id}]`)
                          .replace(/\{pageId\}/g, page.id);
                        const upgradedReply = await updateCommentReplyWithMention({
                          pageAccessToken: page.accessToken,
                          replyId: replyRes.id,
                          message: upgradedMessage,
                        });
                        if (upgradedReply?.message) {
                          finalReplyText = upgradedReply.message;
                        }
                        if (upgradedReply?.message_tags?.[0]?.name) {
                          senderName = upgradedReply.message_tags[0].name;
                        }
                      }
                    } catch (dmErr) {
                      console.error(`Scanner Private Reply error on ${page.name}:`, dmErr);
                    }
                  }

                  // Save real resolved customer lead into Supabase customers
                  if (senderName && senderName !== "អតិថិជន Facebook") {
                    try {
                      await supabase.from("customers").upsert(
                        {
                          fb_user_id: senderId || `fb_${page.id}_${senderName}`,
                          name: senderName,
                          source_page_id: page.id,
                          last_activity_at: c.created_time || new Date().toISOString(),
                        },
                        { onConflict: "fb_user_id" }
                      );
                    } catch {}
                  }

                  // Save to Supabase comments
                  try {
                    await supabase.from("comments").upsert({
                      id: commentId,
                      post_id: post.id,
                      fb_user_id: senderId || null,
                      sender_name: senderName,
                      message: messageText,
                      reply_message: finalReplyText,
                      created_time: c.created_time,
                      permalink: post.permalink_url,
                    });
                  } catch {}
                }
              }

              if (finalHasReplied) {
                repliedComments++;
              }

              allActivities.push({
                commentId,
                postId: post.id,
                pageId: page.id,
                pageName: page.name,
                senderName,
                senderId,
                message: messageText,
                createdTime: c.created_time,
                hasReplied: finalHasReplied,
                replyText: finalReplyText,
                permalink: post.permalink_url,
              });
            }
          }
        }
      } catch (pageErr) {
        console.error(`Error scanning page ${page.name} (${page.id}):`, pageErr);
      }
    };

    // 3. Scan active pages in parallel batches of 8 for fast response
    const BATCH_SIZE = 8;
    for (let i = 0; i < activePagesToScan.length; i += BATCH_SIZE) {
      const batch = activePagesToScan.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((page) => scanSinglePage(page)));
    }

    // Sort activities newest first (real-time chronological order)
    allActivities.sort(
      (a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
    );

    return NextResponse.json({
      status: "SUCCESS",
      scannedPages: pagesToScan.length,
      activePages: activePagesToScan.length,
      totalComments,
      repliedComments,
      pendingComments: Math.max(0, totalComments - repliedComments),
      repliesSent,
      activities: allActivities.slice(0, 50),
      lastScanned: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Auto-scanner error:", error);
    return NextResponse.json({ status: "ERROR", error: "Auto scanner failed" }, { status: 500 });
  }
}
