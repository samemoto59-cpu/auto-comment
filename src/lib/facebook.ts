/**
 * Facebook Graph API helper for sending comment replies and private messages
 */

export interface FBCommentReplyOptions {
  pageAccessToken: string;
  commentId: string;
  message: string;
}

export interface FBPrivateMessageOptions {
  pageAccessToken: string;
  recipientId: string;
  message: string;
}

/**
 * React (Heart/Like) to a Facebook comment before replying
 */
export async function reactToComment({
  pageAccessToken,
  commentId,
}: {
  pageAccessToken: string;
  commentId: string;
}) {
  try {
    // 1. Try LOVE reaction first
    const loveRes = await fetch(
      `https://graph.facebook.com/v21.0/${commentId}/reactions?type=LOVE&access_token=${pageAccessToken}`,
      { method: "POST" }
    );
    const loveData = await loveRes.json();
    if (loveData?.success) {
      return { success: true, type: "LOVE" };
    }
  } catch {}

  try {
    // 2. Fallback to standard Page Like on comment
    const likeRes = await fetch(
      `https://graph.facebook.com/v21.0/${commentId}/likes?access_token=${pageAccessToken}`,
      { method: "POST" }
    );
    const likeData = await likeRes.json();
    return { success: Boolean(likeData?.success), type: "LIKE" };
  } catch (err) {
    console.error("reactToComment error:", err);
    return { success: false };
  }
}

/**
 * Reply directly to a Facebook comment
 */
export async function replyToComment({
  pageAccessToken,
  commentId,
  message,
}: FBCommentReplyOptions) {
  // Remove m.me links from comment replies because Facebook's anti-spam filter (code 368)
  // blocks comments that combine an @[psid] mention tag with a URL link.
  const cleanMessage = message.replace(/\s*👉?\s*https?:\/\/m\.me\/\S+/gi, " ✨").trim();
  const url = `https://graph.facebook.com/v21.0/${commentId}/comments?fields=id,message,message_tags&access_token=${pageAccessToken}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: cleanMessage }),
  });
  return res.json();
}

/**
 * Update an existing comment reply (e.g. to inject @[psid] mention once PSID is resolved)
 * and return the updated message + message_tags (which contains the resolved customer name)
 */
export async function updateCommentReplyWithMention({
  pageAccessToken,
  replyId,
  message,
}: {
  pageAccessToken: string;
  replyId: string;
  message: string;
}) {
  try {
    await fetch(
      `https://graph.facebook.com/v21.0/${replyId}?access_token=${pageAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      }
    );
    const checkRes = await fetch(
      `https://graph.facebook.com/v21.0/${replyId}?fields=id,message,message_tags&access_token=${pageAccessToken}`
    );
    return await checkRes.json();
  } catch (err) {
    console.error("updateCommentReplyWithMention error:", err);
    return null;
  }
}

/**
 * Send a Private Message (DM) to customer via Messenger
 */
export interface FBPrivateReplyOptions {
  pageAccessToken: string;
  commentId: string;
  message: string;
}

/**
 * Send a Private Reply directly into the commenter's Messenger inbox
 * using Facebook's Send API with recipient.comment_id
 */
export async function sendPrivateReply({
  pageAccessToken,
  commentId,
  message,
}: FBPrivateReplyOptions) {
  try {
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: {
          comment_id: commentId,
        },
        message: {
          text: message,
        },
      }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("sendPrivateReply fetch error:", error);
    return { error: String(error) };
  }
}

/**
 * Send a Private Message (DM) to customer via Messenger PSID
 */
export async function sendMessengerMessage({
  pageAccessToken,
  recipientId,
  message,
}: FBPrivateMessageOptions) {
  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
    }),
  });
  return res.json();
}
