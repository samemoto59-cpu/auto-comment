import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface PageCaptionItem {
  pageId: string;
  pageName: string;
  category?: string;
  caption: string;
  status?: "pending" | "uploading" | "success" | "error";
  postId?: string;
  errorMessage?: string;
}

export interface VideoPostRecord {
  id: string;
  title: string;
  videoUrl?: string;
  mediaType?: "video" | "photo" | "text";
  postType: "reels" | "video";
  captionStyle: string;
  targetPagesCount: number;
  publishedAt: string;
  status: "completed" | "partial" | "failed";
  results: {
    pageId: string;
    pageName: string;
    status: "success" | "error";
    postId?: string;
    captionPreview: string;
  }[];
}

// 8 Official Company Pages definition with distinct niche identities
const OFFICIAL_COMPANY_PAGES = [
  {
    id: "955747057621489",
    name: "Kidney Pro ឃីដនី ប្រូ",
    category: "សុខភាព & សម្រស់ (Health/Beauty)",
    niche: "kidney_pro",
    description: "ផ្តោតលើផលិតផលជំនួយសុខភាពតម្រងនោម នោមទាស់ នោមញឹក ឈឺចង្កេះ",
  },
  {
    id: "1039779202551647",
    name: "អេមមី សុខភាពស្រ្តី",
    category: "សុខភាពស្ត្រី (Women Health)",
    niche: "women_health",
    description: "ផ្តោតលើសុខភាពស្បូនស្រ្តី រដូវមិនទៀង ធ្លាក់ស ក្លិនមិនល្អ",
  },
  {
    id: "827063453815073",
    name: "គុណភាពតម្រងនោម",
    category: "សុខភាពតម្រងនោម (Kidney Care)",
    niche: "kidney_care",
    description: "ការអប់រំ និងការពារជំងឺតម្រងនោម ការថែទាំជាតិពុលក្នុងឈាម",
  },
  {
    id: "928036717066754",
    name: "Emmi Cambodia",
    category: "សម្រស់ & ថែទាំ (Beauty/Care)",
    niche: "emmi_cambodia",
    description: "ចែកចាយទូទាំងប្រទេស ប្រូម៉ូសិនកញ្ចប់ធំ និងសេវាកម្មរហ័ស",
  },
  {
    id: "923321100873981",
    name: "Emmi",
    category: "ផលិតផលផ្លូវការ (Official)",
    niche: "emmi_official",
    description: "ផលិតផលដើមសុទ្ធ ១០០% របៀបប្រើប្រាស់ត្រឹមត្រូវ និងប្រសិទ្ធភាព",
  },
  {
    id: "985673367962860",
    name: "Emmi By CEO",
    category: "ម៉ាកយីហោ (Brand)",
    niche: "emmi_ceo",
    description: "ការធានាផ្ទាល់ពី CEO គុណភាពលំដាប់ VIP និងកិត្តិយសម៉ាកយីហោ",
  },
  {
    id: "997410203461527",
    name: "Emmi Care",
    category: "ថែទាំសម្រស់ (Care/Beauty)",
    niche: "emmi_care",
    description: "ការថែរក្សាស្បែក និងសម្រស់ក្មេងជាងវ័យ ទំនុកចិត្តនារីសម័យថ្មី",
  },
  {
    id: "101267342561819",
    name: "Emmi អេមមី",
    category: "វីដេអូ & Reel (Reel Creator)",
    niche: "emmi_reels",
    description: "Reels វីដេអូខ្លីៗទាក់ទាញ ការកម្សាន្ត និងចំណេះដឹងរហ័ស",
  },
];

// Master Deep-Thinking Unique Caption Generator per Page & Style
function generateUniqueCaptionByNiche(
  pageId: string,
  pageName: string,
  style: string,
  baseTopic: string
): string {
  const extraNote = baseTopic.trim() ? `\n📌 ${baseTopic.trim()}` : "";

  // --- 1. Kidney Pro & គុណភាពតម្រងនោម (955747057621489 & 827063453815073) ---
  if (
    pageId === "955747057621489" ||
    pageId === "827063453815073" ||
    pageName.includes("Kidney") ||
    pageName.includes("តម្រងនោម")
  ) {
    if (style === "education" || style === "question") {
      return `បងប្អូនជាច្រើនអាចជួបប្រទះបញ្ហាដូចជា៖
🌿 នោមញឹកពេលយប់លើសពី ២-៣ ដង
🌿 នោមទាស់ នោមរអាក់រអួល ឬឈឺផ្សា
🌿 ចុកចង្កេះ ចុករួយខ្នង ងើបមិនចង់រួច
🌿 អស់កម្លាំងល្ហិតល្ហៃ គេងមិនលក់ស្រួល
🌿 សញ្ញាជាតិពុលកើនឡើងក្នុងតម្រងនោម${extraNote}

🛡️ Kidney Pro (ឃីដនី ប្រូ) ជំនួយតម្រងនោម និងបន្សុទ្ធជាតិពុល ផ្សំពីរុក្ខជាតិឱសថធម្មជាតិ៖
✅ សម្រួលការបត់ជើងតូចឱ្យស្រួល គេងលក់ពេញមួយយប់
✅ បំបាត់អាការៈចុកចង្កេះ និងអស់កម្លាំង
✅ ជំនួយកោសិកាតម្រងនោមឱ្យរឹងមាំយូរអង្វែង
✅ គុណភាពស្ដង់ដារ ទុកចិត្តបាន ១០០%

📩 ឆាតមកកាន់យើងខ្ញុំឥឡូវនេះ ដើម្បីទទួលបានការប្រឹក្សាសុខភាពដោយឥតគិតថ្លៃ!

#KidneyPro #គុណភាពតម្រងនោម #សុខភាពតម្រងនោម #ថែទាំសុខភាព`;
    }

    return `នោមញឹកពេលយប់ នោមទាស់ ចុកចង្កេះ... ឈប់បារម្ភទៀតទៅ!
Kidney Pro ជំនួយការពិសេសសម្រាប់សុខភាពតម្រងនោម។ ផលិតផលដែលរួមផ្សំឡើងពីឱសថធម្មជាតិ ជួយដោះស្រាយបញ្ហា៖
✅ នោមញឹក នោមទាស់ នោមក្រហាយ
✅ ឈឺចុកចាប់ចង្កេះ និងខ្នង
✅ បញ្ចុះជាតិពុល និងអាស៊ីតក្នុងឈាម
✅ អស់កម្លាំង ល្ហិតល្ហៃ គេងមិនលក់${extraNote}

🛡️ ជួយឱ្យគេងលក់ស្រួលពេញមួយយប់ មានកម្លាំងមាំមួន និងសុខភាពល្អពីខាងក្នុង!
👉 ឆាតមកយើងឥឡូវនេះដើម្បីទទួលបានការប្រឹក្សាយោបល់ឥតគិតថ្លៃ!

#KidneyPro #ថែរក្សាតម្រងនោម #សុខភាពបុរសស្រ្តី`;
  }

  // --- 2. អេមមី សុខភាពស្រ្តី (1039779202551647) & Emmi Care (997410203461527) ---
  if (
    pageId === "1039779202551647" ||
    pageId === "997410203461527" ||
    pageName.includes("សុខភាពស្រ្តី") ||
    pageName.includes("Care")
  ) {
    if (style === "promotion" || style === "branding") {
      return `ធ្លាក់ស រដូវមកមិនទៀង មានក្លិនមិនល្អ... ឈប់បារម្ភទៀតទៅ! 
Emmi ជំនួយការពិសេសសម្រាប់សុខភាពស្ត្រី។ ផលិតផលដែលរួមផ្សំឡើងពីគ្រឿងផ្សំធម្មជាតិជិត ២០មុខ ជួយដោះស្រាយបញ្ហា៖
✅ រដូវមកមិនទៀង និងឈឺចាប់ខ្លាំង
✅ ធ្លាក់/ស រមាស់ និងមានក្លិន
✅ ផ្សិតក្នុងទ្វារ.មាស
✅ សិរមាន់ HVP
✅ ស្ងួតទ្វា.មាស់
✅ បញ្ហាស្បូន...${extraNote}

🛡️ ជួយឱ្យរដូវមកទៀងទាត់ ផ្តល់ទំនុកចិត្ត និងសុខភាពល្អពីខាងក្នុង! ឃើញប្រសិទ្ធភាពលឿន...
👉 ឆាតមកយើងឥឡូវនេះដើម្បីទទួលបានការប្រឹក្សាយោបល់ឥតគិតថ្លៃ!

#Emmi #អេមមីសុខភាពស្រ្តី #ថែរក្សាស្បូន #ទំនុកចិត្តនារី`;
    }

    // Default style / daily care
    return `ស្ត្រីជាច្រើនអាចជួបប្រទះបញ្ហាដូចជា៖
💗 អារម្មណ៍មិនស្រួលនៅតំបន់សម្ងាត់
💗 ក្លិនមិនស្រស់ស្រាយ
💗 សំណើម ឬទឹករំអិលប្រែប្រួល
💗 អារម្មណ៍រមាស់ ឬរំខាន
💗 ភាពស្ងួត និងមិនស្រួលខ្លួន
💗 ការប្រែប្រួលដែលកើតឡើងតាមវ័យ និងរបៀបរស់នៅ${extraNote}

🇰🇷 Emmi (អេមមី) ជាផលិតផលថែរក្សាសុខភាពនារី ស្តង់ដារកូរ៉េសម្រាប់ថែរក្សាខ្លួនប្រចាំថ្ងៃ។
✨ ងាយស្រួលប្រើ
✨ សម្រាប់ការថែរក្សាប្រចាំថ្ងៃ
✨ គុណភាពតាមស្តង់ដារកូរ៉េ
✨ ជួយឲ្យការថែរក្សាខ្លួនកាន់តែងាយស្រួល

📩 ចង់ដឹងព័ត៌មានលម្អិត របៀបប្រើ និងតម្លៃ សូមផ្ញើសារមក Page

#Emmi #អេមមី #ស្តង់ដារកូរ៉េ #សុខភាពស្ត្រី`;
  }

  // --- 3. Emmi By CEO (985673367962860) ---
  if (pageId === "985673367962860" || pageName.includes("CEO")) {
    return `👑 [សារផ្ទាល់ពី CEO] ការប្តេជ្ញាចិត្តខ្ពស់បំផុតចំពោះគុណភាព និងសុខភាពរបស់បងប្អូន! 💎✨

ធ្លាក់ស រដូវមកមិនទៀង មានក្លិនមិនល្អ... ឈប់បារម្ភទៀតទៅ! 
🇰🇷 Emmi (អេមមី) ជាផលិតផលថែរក្សាសុខភាពនារី ស្តង់ដារកូរ៉េ រួមផ្សំពីគ្រឿងផ្សំធម្មជាតិជិត ២០មុខ៖
✅ រដូវមកមិនទៀង និងឈឺចាប់ខ្លាំង
✅ ធ្លាក់/ស រមាស់ និងមានក្លិន
✅ ផ្សិតក្នុងទ្វារ.មាស និងស្ងួតទ្វា.មាស់
✅ ផ្តល់ទំនុកចិត្ត និងសុខភាពល្អពីខាងក្នុង${extraNote}

✨ គុណភាពជាកិត្តិយស ទំនុកចិត្តពិត ១០០%!
📩 ចង់ដឹងព័ត៌មានលម្អិត របៀបប្រើ និងតម្លៃ សូមផ្ញើសារមកកាន់ Page ឬទម្លាក់លេខទូរស័ព្ទខាងក្រោម!

#EmmiByCEO #Emmi #ស្តង់ដារកូរ៉េ #គុណភាពជាចម្បង`;
  }

  // --- 4. Emmi Cambodia (928036717066754) & Emmi (923321100873981) ---
  if (
    pageId === "928036717066754" ||
    pageId === "923321100873981" ||
    pageName.includes("Cambodia") ||
    pageName.includes("Emmi")
  ) {
    return `ធ្លាក់ស រដូវមកមិនទៀង មានក្លិនមិនល្អ... ឈប់បារម្ភទៀតទៅ! 
🇰🇷 Emmi ជំនួយការពិសេសសម្រាប់សុខភាពស្ត្រី ស្តង់ដារកូរ៉េ រួមផ្សំពីធម្មជាតិជិត ២០មុខ ជួយដោះស្រាយបញ្ហា៖
✅ រដូវមកមិនទៀង និងឈឺចាប់ខ្លាំង
✅ ធ្លាក់/ស រមាស់ និងមានក្លិន
✅ ផ្សិតក្នុងទ្វារ.មាស
✅ សិរមាន់ HVP
✅ ស្ងួតទ្វា.មាស់${extraNote}

🛡️ ជួយឱ្យរដូវមកទៀងទាត់ ផ្តល់ទំនុកចិត្ត និងសុខភាពល្អពីខាងក្នុង!
🚚 ដឹកជញ្ជូនរហ័សទូទាំង ២៥ ខេត្ត/ក្រុង!
👉 ឆាតមកយើងឥឡូវនេះដើម្បីទទួលបានការប្រឹក្សាយោបល់ឥតគិតថ្លៃ!

#EmmiCambodia #Emmi #សុខភាពស្ត្រី #ស្តង់ដារកូរ៉េ`;
  }

  // Default fallback for any other page
  return `ស្ត្រីជាច្រើនអាចជួបប្រទះបញ្ហាដូចជា៖
💗 អារម្មណ៍មិនស្រួលនៅតំបន់សម្ងាត់
💗 ក្លិនមិនស្រស់ស្រាយ
💗 សំណើម ឬទឹករំអិលប្រែប្រួល
💗 អារម្មណ៍រមាស់ ឬរំខាន
💗 ភាពស្ងួត និងមិនស្រួលខ្លួន${extraNote}

🇰🇷 Emmi (អេមមី) ជាផលិតផលថែរក្សាសុខភាពនារី ស្តង់ដារកូរ៉េសម្រាប់ថែរក្សាខ្លួនប្រចាំថ្ងៃ។
✨ ងាយស្រួលប្រើ
✨ សម្រាប់ការថែរក្សាប្រចាំថ្ងៃ
✨ គុណភាពតាមស្តង់ដារកូរ៉េ

📩 ចង់ដឹងព័ត៌មានលម្អិត របៀបប្រើ និងតម្លៃ សូមផ្ញើសារមក Page

#Emmi #${pageName.replace(/\s+/g, "")} #ស្តង់ដារកូរ៉េ`;
}

// Helper to convert Google Drive / Dropbox sharing links into direct stream URLs for Facebook (Supports 5GB+)
function convertToDirectMediaUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();
  // Google Drive
  const gdriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://drive.usercontent.google.com/download?id=${gdriveMatch[1]}&export=download&authuser=0`;
  }
  // Dropbox
  if (trimmed.includes("dropbox.com") && trimmed.includes("dl=0")) {
    return trimmed.replace("dl=0", "dl=1");
  }
  return trimmed;
}

// Helper to fetch individual Page Access Tokens from Supabase vst_members & env
async function getPageTokensMap(): Promise<Record<string, string>> {
  const tokenMap: Record<string, string> = {};

  try {
    const { data: memberData } = await supabase
      .from("bot_settings")
      .select("dm_template")
      .eq("id", "vst_members")
      .maybeSingle();

    if (memberData?.dm_template) {
      const members = JSON.parse(memberData.dm_template);
      if (Array.isArray(members)) {
        for (const m of members) {
          if (Array.isArray(m.pages)) {
            for (const p of m.pages) {
              const token = p.accessToken || p.access_token;
              if (p.id && token) {
                tokenMap[p.id] = token;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error reading page tokens from vst_members:", err);
  }

  // Fallback to individual page rows in bot_settings if any
  try {
    const { data: pageRows } = await supabase
      .from("bot_settings")
      .select("id, dm_template")
      .neq("id", "vst_members")
      .neq("id", "vst_video_posts");

    if (pageRows) {
      for (const row of pageRows) {
        if (row.dm_template && row.dm_template.startsWith("EAA")) {
          tokenMap[row.id] = row.dm_template;
        }
      }
    }
  } catch {}

  // Environment fallback
  const envToken = process.env.FB_PAGE_ACCESS_TOKEN;
  if (envToken && !tokenMap["955747057621489"]) {
    tokenMap["955747057621489"] = envToken;
  }

  return tokenMap;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("action") === "tokens") {
      const tokenMap = await getPageTokensMap();
      return NextResponse.json({ success: true, tokens: tokenMap });
    }

    if (searchParams.get("action") === "pages") {
      const isAdmin = searchParams.get("isAdmin") === "true";
      const userId = searchParams.get("userId");
      const userName = searchParams.get("userName") || searchParams.get("owner");

      const { data: memberData } = await supabase
        .from("bot_settings")
        .select("dm_template")
        .eq("id", "vst_members")
        .maybeSingle();

      const members = memberData?.dm_template ? JSON.parse(memberData.dm_template) : [];
      const pagesList: any[] = [];
      const tokenMap = await getPageTokensMap();

      for (const m of members) {
        // Strict Isolation: Non-admin users ONLY get their own connected pages!
        if (!isAdmin) {
          const matchId = userId && (String(m.id) === String(userId) || String(m.facebookId) === String(userId));
          const matchName = userName && m.name?.toLowerCase() === userName.toLowerCase();
          if (!matchId && !matchName) {
            continue; // Skip pages belonging to other members
          }
        }

        for (const p of m.pages || []) {
          if (p.id && !pagesList.some((existing) => existing.id === p.id)) {
            pagesList.push({
              id: p.id,
              name: p.name,
              category: p.category || "Facebook Page",
              memberName: m.name,
              userId: m.id,
              role: m.role,
              hasToken: !!tokenMap[p.id],
            });
          }
        }
      }

      // If Super Admin, also include official company pages if not already in list
      if (isAdmin) {
        for (const p of OFFICIAL_COMPANY_PAGES) {
          if (!pagesList.some((existing) => existing.id === p.id)) {
            pagesList.push({
              id: p.id,
              name: p.name,
              category: p.category || "Facebook Page (Official)",
              memberName: "VST Super Admin",
              userId: "admin",
              role: "owner",
              hasToken: !!tokenMap[p.id],
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        pages: pagesList,
      });
    }

    if (searchParams.get("action") === "get_upload_url") {
      const fileName = searchParams.get("fileName") || `upload_${Date.now()}`;
      const ext = fileName.split(".").pop() || "bin";
      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = `uploads/${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from("vst-media")
        .createSignedUploadUrl(filePath);

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message || "Failed to create upload URL" },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("vst-media").getPublicUrl(filePath);

      return NextResponse.json({
        success: true,
        signedUrl: data.signedUrl,
        path: filePath,
        publicUrl,
      });
    }

    const { data } = await supabase
      .from("bot_settings")
      .select("dm_template")
      .eq("id", "vst_video_posts")
      .maybeSingle();

    let history: VideoPostRecord[] = [];
    if (data?.dm_template) {
      try {
        history = JSON.parse(data.dm_template);
      } catch (e) {
        console.error("Error parsing video post history:", e);
      }
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching video publisher history:", error);
    return NextResponse.json({ history: [] });
  }
}

async function uploadFacebookVideoThumbnail(
  postId: string,
  pageToken: string,
  thumbnail: File | string | Blob
): Promise<boolean> {
  try {
    let sourceBlob: Blob;
    if (typeof thumbnail === "string") {
      if (thumbnail.startsWith("data:")) {
        const base64Data = thumbnail.replace(/^data:image\/\w+;base64,/, "");
        sourceBlob = new Blob([Buffer.from(base64Data, "base64")], { type: "image/jpeg" });
      } else if (thumbnail.startsWith("http")) {
        const res = await fetch(thumbnail);
        const arrayBuf = await res.arrayBuffer();
        sourceBlob = new Blob([arrayBuf], { type: "image/jpeg" });
      } else {
        sourceBlob = new Blob([Buffer.from(thumbnail, "base64")], { type: "image/jpeg" });
      }
    } else {
      sourceBlob = thumbnail;
    }

    const fbFormData = new FormData();
    fbFormData.append("source", sourceBlob, "thumbnail.jpg");
    fbFormData.append("is_preferred", "true");
    fbFormData.append("access_token", pageToken);

    const res = await fetch(`https://graph.facebook.com/v19.0/${postId}/thumbnails`, {
      method: "POST",
      body: fbFormData,
    });
    const data = await res.json();
    return !!data?.success;
  } catch (e) {
    console.warn(`[Thumbnail] Error uploading thumbnail for video ${postId}:`, e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. MULTIPART FORM-DATA: Server-side direct media publishing & chunk transfer
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const action = formData.get("action");

      // Handle Resumable Transfer Chunk
      if (action === "resumable_transfer") {
        const pageId = formData.get("pageId") as string;
        const uploadSessionId = formData.get("upload_session_id") as string;
        const startOffset = formData.get("start_offset") as string;
        const chunk = formData.get("chunk") as File | Blob | null;

        if (!pageId || !uploadSessionId || !chunk) {
          return NextResponse.json({ error: "Missing required chunk transfer parameters" }, { status: 400 });
        }

        const tokenMap = await getPageTokensMap();
        const pageToken = tokenMap[pageId] || process.env.FB_PAGE_ACCESS_TOKEN;
        if (!pageToken) {
          return NextResponse.json({ error: `No access token found for page ${pageId}` }, { status: 400 });
        }

        const fbForm = new FormData();
        fbForm.append("upload_phase", "transfer");
        fbForm.append("upload_session_id", uploadSessionId);
        fbForm.append("start_offset", startOffset || "0");
        fbForm.append("access_token", pageToken);
        fbForm.append("video_file_chunk", chunk, "chunk.mp4");

        const fbRes = await fetch(`https://graph-video.facebook.com/v19.0/${pageId}/videos`, {
          method: "POST",
          body: fbForm,
        });
        const fbData = await fbRes.json();
        return NextResponse.json(fbData, { status: fbRes.status });
      }

      const mediaType = (formData.get("mediaType") as "video" | "photo" | "text") || "video";
      const file = formData.get("file") as File | null;
      const title = (formData.get("title") as string) || "";
      const postType = (formData.get("postType") as "reels" | "video") || "reels";
      const captionStyle = (formData.get("captionStyle") as string) || "promotion";
      const rawPageCaptions = formData.get("pageCaptions") as string;
      const thumbnailFile = formData.get("thumbnail") as File | null;
      const thumbnailData = formData.get("thumbnailData") as string | null;

      let pageCaptions: PageCaptionItem[] = [];
      try {
        pageCaptions = JSON.parse(rawPageCaptions || "[]");
      } catch (err) {
        return NextResponse.json({ error: "Invalid pageCaptions format" }, { status: 400 });
      }

      if (pageCaptions.length === 0) {
        return NextResponse.json({ error: "No target pages provided" }, { status: 400 });
      }

      const tokenMap = await getPageTokensMap();
      const defaultToken = process.env.FB_PAGE_ACCESS_TOKEN;
      const results: {
        pageId: string;
        pageName: string;
        status: "success" | "error";
        postId?: string;
        captionPreview: string;
        message?: string;
      }[] = [];

      for (const item of pageCaptions) {
        const pageToken = tokenMap[item.pageId] || defaultToken;
        if (!pageToken) {
          results.push({
            pageId: item.pageId,
            pageName: item.pageName,
            status: "error",
            captionPreview: item.caption.slice(0, 70) + "...",
            message: "ពុំមាន Access Token សម្រាប់ Page នេះទេ",
          });
          continue;
        }

        try {
          let fbRes: Response;
          let fbData: any;

          if (mediaType === "video" && file) {
            // Upload directly to graph-video.facebook.com from Node.js server
            const fbFormData = new FormData();
            fbFormData.append("source", file, file.name || "video.mp4");
            fbFormData.append("description", item.caption);
            fbFormData.append("title", title || "Video Post");
            fbFormData.append("access_token", pageToken);
            fbFormData.append("published", "true");

            fbRes = await fetch(`https://graph-video.facebook.com/v19.0/${item.pageId}/videos`, {
              method: "POST",
              body: fbFormData,
            });
            fbData = await fbRes.json();
          } else if (mediaType === "photo" && file) {
            // Upload directly to graph.facebook.com/photos from Node.js server
            const fbFormData = new FormData();
            fbFormData.append("source", file, file.name || "photo.jpg");
            fbFormData.append("caption", item.caption);
            fbFormData.append("access_token", pageToken);
            fbFormData.append("published", "true");

            fbRes = await fetch(`https://graph.facebook.com/v19.0/${item.pageId}/photos`, {
              method: "POST",
              body: fbFormData,
            });
            fbData = await fbRes.json();
          } else {
            // Pure text post to feed
            fbRes = await fetch(`https://graph.facebook.com/v19.0/${item.pageId}/feed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: item.caption,
                access_token: pageToken,
              }),
            });
            fbData = await fbRes.json();
          }

          if (fbRes.ok && (fbData?.id || fbData?.post_id)) {
            const realPostId = fbData.id || fbData.post_id;

            // Upload thumbnail if available
            const thumbToUpload = thumbnailFile || thumbnailData;
            if (thumbToUpload && mediaType === "video") {
              await uploadFacebookVideoThumbnail(realPostId, pageToken, thumbToUpload);
            }

            results.push({
              pageId: item.pageId,
              pageName: item.pageName,
              status: "success",
              postId: realPostId,
              captionPreview: item.caption.slice(0, 70) + "...",
              message: "បានផុសទៅកាន់ Facebook Page ផ្ទាល់ជោគជ័យ!" + (thumbToUpload ? " (រួមទាំង Thumbnail)" : ""),
            });
          } else {
            const errMsg = fbData?.error?.message || "Facebook Graph API returned an error";
            results.push({
              pageId: item.pageId,
              pageName: item.pageName,
              status: "error",
              captionPreview: item.caption.slice(0, 70) + "...",
              message: `Facebook Error: ${errMsg}`,
            });
          }
        } catch (postErr: any) {
          results.push({
            pageId: item.pageId,
            pageName: item.pageName,
            status: "error",
            captionPreview: item.caption.slice(0, 70) + "...",
            message: postErr.message || "Failed to communicate with Facebook",
          });
        }
      }

      // Save to Supabase History
      const newRecord: VideoPostRecord = {
        id: `vpost_${Date.now()}`,
        title: title || (mediaType === "video" ? "វីដេអូផ្សព្វផ្សាយ" : mediaType === "photo" ? "រូបភាពផ្សព្វផ្សាយ" : "អត្ថបទផ្សព្វផ្សាយ"),
        videoUrl: file ? `[Uploaded ${mediaType === "video" ? "Video" : "Photo"} File]` : "[Text Post]",
        mediaType,
        postType,
        captionStyle,
        targetPagesCount: pageCaptions.length,
        publishedAt: new Date().toISOString(),
        status: results.every((r) => r.status === "success") ? "completed" : "partial",
        results,
      };

      try {
        const { data: existingData } = await supabase
          .from("bot_settings")
          .select("dm_template")
          .eq("id", "vst_video_posts")
          .maybeSingle();

        let historyList: VideoPostRecord[] = [];
        if (existingData?.dm_template) {
          try {
            historyList = JSON.parse(existingData.dm_template);
          } catch {}
        }

        historyList.unshift(newRecord);
        if (historyList.length > 30) historyList = historyList.slice(0, 30);

        await supabase.from("bot_settings").upsert(
          {
            id: "vst_video_posts",
            dm_template: JSON.stringify(historyList),
            is_active: true,
          },
          { onConflict: "id" }
        );
      } catch (histErr) {
        console.warn("Failed to persist history to Supabase:", histErr);
      }

      return NextResponse.json({
        success: true,
        record: newRecord,
        results,
      });
    }

    // 2. JSON REQUESTS
    const body = await req.json();
    const { action } = body;

    // ACTION: Resumable Upload Phase 1 - Start
    if (action === "resumable_start") {
      const { pageId, fileSize } = body as { pageId: string; fileSize: number };
      if (!pageId || !fileSize) {
        return NextResponse.json({ error: "pageId and fileSize are required" }, { status: 400 });
      }

      const tokenMap = await getPageTokensMap();
      const pageToken = tokenMap[pageId] || process.env.FB_PAGE_ACCESS_TOKEN;
      if (!pageToken) {
        return NextResponse.json({ error: `ពុំមាន Access Token សម្រាប់ Page ID ${pageId} ទេ (សូម Re-authorize តាម Facebook Login)` }, { status: 400 });
      }

      const params = new URLSearchParams({
        upload_phase: "start",
        file_size: fileSize.toString(),
        access_token: pageToken,
      });

      const fbRes = await fetch(`https://graph-video.facebook.com/v19.0/${pageId}/videos`, {
        method: "POST",
        body: params,
      });
      const fbData = await fbRes.json();
      return NextResponse.json(fbData, { status: fbRes.status });
    }

    // ACTION: Resumable Upload Phase 3 - Finish
    if (action === "resumable_finish") {
      const { pageId, upload_session_id, title, description, thumbnail } = body as {
        pageId: string;
        upload_session_id: string;
        title?: string;
        description?: string;
        thumbnail?: string;
      };

      if (!pageId || !upload_session_id) {
        return NextResponse.json({ error: "pageId and upload_session_id are required" }, { status: 400 });
      }

      const tokenMap = await getPageTokensMap();
      const pageToken = tokenMap[pageId] || process.env.FB_PAGE_ACCESS_TOKEN;
      if (!pageToken) {
        return NextResponse.json({ error: `ពុំមាន Access Token សម្រាប់ Page ID ${pageId} ទេ` }, { status: 400 });
      }

      const params = new URLSearchParams({
        upload_phase: "finish",
        upload_session_id,
        title: title || "Video Post",
        description: description || "",
        published: "true",
        access_token: pageToken,
      });

      const fbRes = await fetch(`https://graph-video.facebook.com/v19.0/${pageId}/videos`, {
        method: "POST",
        body: params,
      });
      const fbData = await fbRes.json();

      const finalVideoId = fbData.id || fbData.video_id;

      // Upload thumbnail if provided
      if (thumbnail && finalVideoId) {
        try {
          await uploadFacebookVideoThumbnail(finalVideoId, pageToken, thumbnail);
        } catch (thErr) {
          console.warn("Could not attach thumbnail to finished video:", thErr);
        }
      }

      return NextResponse.json(
        {
          success: fbData.success || !!finalVideoId,
          id: finalVideoId,
          ...fbData,
        },
        { status: fbRes.status }
      );
    }

    // ACTION: Check Video Processing Status & Fetch CDN URL
    if (action === "check_video_status") {
      const { pageId, videoId } = body as { pageId: string; videoId: string };
      if (!pageId || !videoId) {
        return NextResponse.json({ error: "pageId and videoId required" }, { status: 400 });
      }

      const tokenMap = await getPageTokensMap();
      const pageToken = tokenMap[pageId] || process.env.FB_PAGE_ACCESS_TOKEN;
      if (!pageToken) {
        return NextResponse.json({ error: "No token found" }, { status: 400 });
      }

      try {
        const fbRes = await fetch(
          `https://graph.facebook.com/v19.0/${videoId}?fields=source,status,title&access_token=${pageToken}`
        );
        const fbData = await fbRes.json();
        return NextResponse.json({
          source: fbData?.source || null,
          status: fbData?.status || null,
          fbData,
        });
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    }

    // ACTION 1: Generate evidence-grounded AI captions
    if (action === "generate_captions") {
      const {
        videoTitle = "",
        userNotes = "",
        styleExample = "",
        baseTopic = "",
        mediaType = "video",
        captionStyle = "promotion",
        pages,
        videoFrames = [],
      } = body as {
        videoTitle?: string;
        userNotes?: string;
        styleExample?: string;
        baseTopic?: string;
        mediaType?: "video" | "photo" | "text";
        captionStyle: "promotion" | "education" | "question" | "testimonial" | "branding";
        pages: { id: string; name: string; category?: string }[];
        videoFrames?: string[];
      };

      if (!Array.isArray(pages) || pages.length === 0) {
        return NextResponse.json({ error: "No pages selected" }, { status: 400 });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "AI caption service is not configured", code: "AI_NOT_CONFIGURED" },
          { status: 503 }
        );
      }

      const visualParts = videoFrames.slice(0, 4).flatMap((frame) => {
        if (typeof frame !== "string") return [];
        const match = frame.match(
          /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i
        );
        if (!match || match[2].length < 50) return [];
        return [{
          inlineData: {
            mimeType: match[1].toLowerCase(),
            data: match[2],
          },
        }];
      });

      if (mediaType !== "text" && visualParts.length === 0) {
        return NextResponse.json(
          {
            error: "AI could not read this media. Upload the file directly or add clear media notes.",
            code: "MEDIA_EVIDENCE_REQUIRED",
          },
          { status: 422 }
        );
      }

      const confirmedNotes = (userNotes || baseTopic).trim();
      const styleGuidance = styleExample.trim();
      const pagesPromptList = pages
        .map(
          (page, index) =>
            String(index + 1) + ". Page ID: " + JSON.stringify(page.id) +
            ", Name: " + JSON.stringify(page.name) +
            ", Category: " + JSON.stringify(page.category || "Facebook Page")
        )
        .join("\n");

      const prompt = [
        "You write clear Khmer Facebook captions grounded in supplied evidence.",
        "",
        "GROUNDING RULES:",
        "- Treat attached images and CONFIRMED USER NOTES as factual evidence.",
        "- The style example controls tone and structure only. Never copy factual claims from it.",
        "- Never invent prices, discounts, delivery promises, medical benefits, testimonials, certifications, ingredients, or guarantees.",
        "- If evidence is unclear, use cautious wording and do not guess.",
        "- Tailor tone to each page while keeping the underlying facts consistent.",
        "",
        "MEDIA TYPE: " + mediaType,
        "VISUAL EVIDENCE: " + visualParts.length + " sampled image(s)",
        "VIDEO/MEDIA TITLE: " + JSON.stringify(videoTitle || "វីដេអូផ្សព្វផ្សាយ"),
        "CONFIRMED USER NOTES: " + JSON.stringify(confirmedNotes || "No additional notes"),
        "OPTIONAL STYLE EXAMPLE (style only, not facts): " + JSON.stringify(styleGuidance || "No style example"),
        "CHOSEN CAPTION STRATEGY: " + captionStyle,
        "",
        "TARGET PAGES:",
        pagesPromptList,
        "",
        "Return ONLY valid JSON mapping every requested Page ID to a non-empty Khmer caption.",
      ].join("\n");

      const parts: any[] = [...visualParts, { text: prompt }];
      const candidateModels = Array.from(new Set([
        process.env.GEMINI_CAPTION_MODEL || "gemini-3.8-flash",
        "gemini-3.5-flash-lite",
      ]));
      const requestedIds = new Set(pages.map((page) => page.id));
      let lastFailure = "AI returned no usable caption data";

      for (const modelName of candidateModels) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 22000);
        try {
          const geminiRes = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/" +
              modelName +
              ":generateContent?key=" +
              apiKey,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.55,
                  maxOutputTokens: Math.min(8192, Math.max(1024, pages.length * 350)),
                },
              }),
              signal: controller.signal,
            }
          );

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const rawJson = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawJson) {
              const parsed = JSON.parse(rawJson);
              const valid =
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed) &&
                Object.keys(parsed).length === requestedIds.size &&
                Object.keys(parsed).every((id) => requestedIds.has(id)) &&
                pages.every(
                  (page) =>
                    typeof parsed[page.id] === "string" &&
                    parsed[page.id].trim().length >= 10
                );

              if (valid) {
                return NextResponse.json({
                  success: true,
                  captions: parsed,
                  captionStyle,
                  source: "ai",
                  usedAi: true,
                  model: modelName,
                  evidence: {
                    visualFrames: visualParts.length,
                    hasUserNotes: Boolean(confirmedNotes),
                  },
                });
              }
              lastFailure = "AI output did not include a valid caption for every selected page";
            }
          } else {
            lastFailure = "AI provider returned status " + geminiRes.status;
          }
        } catch (modelErr) {
          lastFailure =
            modelErr instanceof Error && modelErr.name === "AbortError"
              ? "AI caption request timed out"
              : "AI caption response could not be read";
        } finally {
          clearTimeout(timeout);
        }
      }

      return NextResponse.json(
        { error: lastFailure, code: "AI_CAPTION_FAILED" },
        { status: lastFailure.includes("timed out") ? 504 : 502 }
      );
    }

    // ACTION: Save post record to history (when published directly from browser)
    if (action === "save_history") {
      const { record } = body as { record: VideoPostRecord };
      if (record) {
        try {
          const { data: existingData } = await supabase
            .from("bot_settings")
            .select("dm_template")
            .eq("id", "vst_video_posts")
            .maybeSingle();

          let historyList: VideoPostRecord[] = [];
          if (existingData?.dm_template) {
            try {
              historyList = JSON.parse(existingData.dm_template);
            } catch {}
          }

          historyList.unshift(record);
          if (historyList.length > 30) historyList = historyList.slice(0, 30);

          await supabase.from("bot_settings").upsert(
            {
              id: "vst_video_posts",
              dm_template: JSON.stringify(historyList),
              is_active: true,
            },
            { onConflict: "id" }
          );
        } catch (e) {
          console.error("Error saving history:", e);
        }
      }
      return NextResponse.json({ success: true });
    }

    // ACTION 2: Publish video / photo / text to multiple Facebook pages
    if (action === "publish_video") {
      const {
        title,
        videoUrl,
        thumbnail,
        mediaType = "video",
        postType = "reels",
        captionStyle = "promotion",
        pageCaptions,
      } = body as {
        title: string;
        videoUrl?: string;
        thumbnail?: string;
        mediaType?: "video" | "photo" | "text";
        postType: "reels" | "video";
        captionStyle?: string;
        pageCaptions: PageCaptionItem[];
      };

      if (!Array.isArray(pageCaptions) || pageCaptions.length === 0) {
        return NextResponse.json(
          { error: "No target pages provided" },
          { status: 400 }
        );
      }

      const results: {
        pageId: string;
        pageName: string;
        status: "success" | "error";
        postId?: string;
        captionPreview: string;
        message?: string;
        needsReauth?: boolean;
      }[] = [];

      const tokenMap = await getPageTokensMap();
      const defaultToken = process.env.FB_PAGE_ACCESS_TOKEN;

      // Process and dispatch to each page with genuine Meta API calls
      for (const item of pageCaptions) {
        const pageToken = tokenMap[item.pageId] || defaultToken;

        if (!pageToken) {
          results.push({
            pageId: item.pageId,
            pageName: item.pageName,
            status: "error",
            captionPreview: item.caption.slice(0, 70) + "...",
            message: "ពុំមាន Access Token សម្រាប់ Page នេះទេ (សូម Re-authorize តាម Facebook Login)",
            needsReauth: true,
          });
          continue;
        }

        try {
          const directMediaUrl = convertToDirectMediaUrl(videoUrl || "");
          const isRemoteVideoUrl =
            directMediaUrl &&
            (directMediaUrl.startsWith("http://") || directMediaUrl.startsWith("https://")) &&
            !directMediaUrl.includes("localhost") &&
            !directMediaUrl.startsWith("blob:");

          let fbRes: Response;
          let fbData: any;

          if (mediaType === "photo" && isRemoteVideoUrl) {
            // 1. Post Photo via /photos Graph API
            fbRes = await fetch(
              `https://graph.facebook.com/v19.0/${item.pageId}/photos`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  url: directMediaUrl,
                  caption: item.caption,
                  access_token: pageToken,
                }),
              }
            );
            fbData = await fbRes.json();
          } else if (isRemoteVideoUrl) {
            // 2. Post Video or Reel via /videos Graph API
            fbRes = await fetch(
              `https://graph-video.facebook.com/v19.0/${item.pageId}/videos`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  file_url: directMediaUrl,
                  description: item.caption,
                  title: title || "Video Post",
                  access_token: pageToken,
                  published: true,
                }),
              }
            );
            fbData = await fbRes.json();
          } else {
            // 3. Post directly to Page Feed (/feed) for text posts
            fbRes = await fetch(
              `https://graph.facebook.com/v19.0/${item.pageId}/feed`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  message: item.caption,
                  access_token: pageToken,
                }),
              }
            );
            fbData = await fbRes.json();
          }

          if (fbRes.ok && (fbData?.id || fbData?.post_id)) {
            const realPostId = fbData.id || fbData.post_id;

            // Upload custom thumbnail to Facebook if provided for video
            if (thumbnail && mediaType === "video") {
              await uploadFacebookVideoThumbnail(realPostId, pageToken, thumbnail);
            }

            results.push({
              pageId: item.pageId,
              pageName: item.pageName,
              status: "success",
              postId: realPostId,
              captionPreview: item.caption.slice(0, 70) + "...",
              message: "បានផុសទៅកាន់ Facebook Page ផ្ទាល់ជោគជ័យ!" + (thumbnail ? " (រួមទាំង Thumbnail)" : ""),
            });
          } else {
            const errObj = fbData?.error;
            const errCode = errObj?.code;
            const errMsg = errObj?.message || "Meta API returned an error";
            const isPermError =
              errCode === 200 ||
              errCode === 190 ||
              errMsg.includes("pages_manage_posts") ||
              errMsg.includes("requires both pages_read_engagement");

            results.push({
              pageId: item.pageId,
              pageName: item.pageName,
              status: "error",
              captionPreview: item.caption.slice(0, 70) + "...",
              message: isPermError
                ? "Facebook ទាមទារសិទ្ធិ 'pages_manage_posts' (សូមចុចប៊ូតុង 'ភ្ជាប់សិទ្ធិឡើងវិញ')"
                : `Facebook Error: ${errMsg}`,
              needsReauth: isPermError,
            });
          }
        } catch (e: any) {
          results.push({
            pageId: item.pageId,
            pageName: item.pageName,
            status: "error",
            captionPreview: item.caption.slice(0, 70) + "...",
            message: e.message || "Failed to communicate with Facebook",
          });
        }
      }

      // Save to Supabase History
      const newRecord: VideoPostRecord = {
        id: `vpost_${Date.now()}`,
        title: title || "វីដេអូផ្សព្វផ្សាយថ្មី",
        videoUrl: videoUrl?.startsWith("data:") ? "[Uploaded Video File]" : videoUrl,
        mediaType,
        postType,
        captionStyle,
        targetPagesCount: pageCaptions.length,
        publishedAt: new Date().toISOString(),
        status: results.every((r) => r.status === "success")
          ? "completed"
          : "partial",
        results,
      };

      try {
        const { data: existingData } = await supabase
          .from("bot_settings")
          .select("dm_template")
          .eq("id", "vst_video_posts")
          .maybeSingle();

        let historyList: VideoPostRecord[] = [];
        if (existingData?.dm_template) {
          try {
            historyList = JSON.parse(existingData.dm_template);
          } catch {}
        }

        historyList.unshift(newRecord);
        if (historyList.length > 30) historyList = historyList.slice(0, 30);

        await supabase.from("bot_settings").upsert(
          {
            id: "vst_video_posts",
            dm_template: JSON.stringify(historyList),
            is_active: true,
          },
          { onConflict: "id" }
        );
      } catch (histErr) {
        console.warn("Failed to persist history to Supabase:", histErr);
      }

      return NextResponse.json({
        success: true,
        record: newRecord,
        results,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in video-publisher POST:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
