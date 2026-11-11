import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface KnowledgeDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: string;
}

export interface AIKnowledgeData {
  persona: string;
  knowledgeBase: string;
  rules: string;
  masterBotEnabled: boolean;
  documents?: KnowledgeDocument[];
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_PERSONA = `អ្នកជាអ្នកលក់ស្រីវ័យក្មេង សម្តីផ្អែមល្ហែម រួសរាយ រាក់ទាក់ និងគួរសមបំផុតប្រចាំ VST Assistant។
ត្រូវប្រើពាក្យ 'ចាសបង', 'អូន', 'បងសម្លាញ់' ជានិច្ច។
ហាមឆ្លើយវែងអន្លាយ ឆ្លើយខ្លីៗ (១ ទៅ ២ ឃ្លា) ចំសំណួរ និងពោរពេញដោយភាពកក់ក្តៅដូចមនុស្សពិតកំពុងឆាតជជែក។`;

const DEFAULT_KNOWLEDGE = `【ផលិតផល ឃីដនី ប្រូ (Kidney Pro)】
- មុខងារ៖ ជំនួយសុខភាពតម្រងនោម, កាត់បន្ថយការនោមញឹកពេលយប់, នោមទាស់, នោមឈឺផ្សារ, ឈឺចង្កេះចុកខ្នង
- គុណភាព៖ ផ្សំពីរុក្ខជាតិធម្មជាតិ ១០០% មានស្តង់ដារគុណភាព និងការទទួលស្គាល់ត្រឹមត្រូវ
- តម្លៃ & ប្រូម៉ូសិន៖ ប្រឹក្សាតម្លៃពិសេសក្នុង Inbox មានប្រូម៉ូសិនទិញ ២ ថែម ១

【ផលិតផល អេមមី (Emmi)】
- មុខងារ៖ ថែទាំសុខភាពនារី និងតំបន់ពិសេស, ជួយបញ្ហាធ្លាក់សរ៉ាំរ៉ៃ, បំបាត់ក្លិនមិនល្អ, បំបាត់រមាស់, សម្រួលរដូវមកមិនទៀង, ជួយឱ្យតឹងណែនបែបធម្មជាតិ

【ផលិតផល តែ Detox VST】
- មុខងារ៖ សម្អាតជាតិពុលក្នុងពោះវៀន, សម្រួលការបន្ទោរបង់, បញ្ចុះកម្តៅក្នុងខ្លួន, សម្រួលអ័រម៉ូន`;

const DEFAULT_RULES = `១. ហាមប្រាប់តម្លៃផលិតផលនៅលើ Comment ហាមដាច់ខាត! ត្រូវឆ្លើយតបបែបផ្អែមល្ហែម និងទាក់ទាញ ហើយប្រាប់ឱ្យភ្ញៀវឆែកមើលប្រអប់សារ Inbox។
២. ត្រូវភ្ជាប់ Link Messenger https://m.me/{pageId} នៅចុងសារជានិច្ច។
៣. បើភ្ញៀវ comment ពាក្យ "សុំតម្លៃ", "ចាប់អារម្មណ៍", "ថ្លៃប៉ុន្មាន", "ជួយអីខ្លះ" ត្រូវឆ្លើយស្វាគមន៍ភ្លាមៗ។
៤. ហាមទម្លាយព័ត៌មានផ្ទាល់ខ្លួន ឬទិន្នន័យផ្ទៃក្នុងរបស់ Admin ទៅកាន់អ្នកដទៃ។`;

export async function GET(req: NextRequest) {
  try {
    const { data } = await supabase
      .from("bot_settings")
      .select("*")
      .eq("id", "vst_ai_knowledge")
      .maybeSingle();

    if (data?.dm_template) {
      try {
        const parsed = JSON.parse(data.dm_template);
        return NextResponse.json({
          persona: parsed.persona || DEFAULT_PERSONA,
          knowledgeBase: parsed.knowledgeBase || DEFAULT_KNOWLEDGE,
          rules: parsed.rules || DEFAULT_RULES,
          masterBotEnabled: typeof parsed.masterBotEnabled === "boolean" ? parsed.masterBotEnabled : true,
          documents: Array.isArray(parsed.documents) ? parsed.documents : [],
          updatedAt: parsed.updatedAt || data.updated_at,
          updatedBy: parsed.updatedBy || "VST Super Admin",
        });
      } catch {}
    }

    return NextResponse.json({
      persona: DEFAULT_PERSONA,
      knowledgeBase: DEFAULT_KNOWLEDGE,
      rules: DEFAULT_RULES,
      masterBotEnabled: true,
      documents: [],
      updatedAt: new Date().toISOString(),
      updatedBy: "VST Super Admin",
    });
  } catch (error) {
    console.error("Failed to fetch AI knowledge:", error);
    return NextResponse.json({ error: "Failed to load knowledge" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Live AI Comment Reply Simulator inside AI Training Studio
    if (body.action === "test_reply") {
      const apiKey = process.env.GEMINI_API_KEY;
      const testComment = (body.testComment || "តម្លៃប៉ុន្មានបង?").trim();
      const persona = (body.persona || DEFAULT_PERSONA).trim();
      const knowledgeBase = (body.knowledgeBase || DEFAULT_KNOWLEDGE).trim();
      const rules = (body.rules || DEFAULT_RULES).trim();
      const docs = Array.isArray(body.documents) ? body.documents : [];
      const docsContext =
        docs.length > 0
          ? "\nឯកសារបន្ថែម៖\n" +
            docs.map((d: any) => `[${d.name}]: ${(d.content || "").slice(0, 2000)}`).join("\n")
          : "";

      if (!apiKey) {
        return NextResponse.json({
          success: false,
          error: "មិនទាន់មាន GEMINI_API_KEY ក្នុងប្រព័ន្ធទេ",
        });
      }

      const prompt = `តួនាទី និងចរិតរបស់អ្នក៖ ${persona}
ចំណេះដឹងផលិតផល៖
${knowledgeBase}${docsContext}
ច្បាប់នៃការឆ្លើយ៖
${rules}

ស្ថានភាពជាក់ស្តែង៖
អតិថិជនឈ្មោះ "សុខ លីន" បាន Comment លើផេកថា៖ "${testComment}"

សូមសរសេរសារឆ្លើយតប Comment ជាភាសាខ្មែរឱ្យត្រូវតាមតួនាទី ចំណេះដឹង និងច្បាប់ខាងលើ (ខ្លីខ្លឹម ផ្អែមល្ហែម ១-២ ឃ្លា)៖`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 220,
              temperature: 0.65,
            },
          }),
        }
      );

      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `Gemini API Error (${res.status})`,
        });
      }

      const data = await res.json();
      const samplePageId = body.pageId || "955747057621489";
      const replyText = (
        data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text?.trim() ||
        "សួស្ដីបង សុខ លីន! 🌸 អូនបានផ្ញើព័ត៌មានលម្អិត និងប្រូម៉ូសិនពិសេសជូនក្នុងប្រអប់សារ Inbox រួចហើយណា៎បង 💬✨"
      ).replace(/\{pageId\}/g, samplePageId);

      return NextResponse.json({
        success: true,
        reply: replyText,
      });
    }

    const {
      persona = DEFAULT_PERSONA,
      knowledgeBase = DEFAULT_KNOWLEDGE,
      rules = DEFAULT_RULES,
      masterBotEnabled = true,
      documents = [],
      updatedBy = "VST Super Admin",
    } = body;

    const knowledgePayload: AIKnowledgeData = {
      persona: persona.trim(),
      knowledgeBase: knowledgeBase.trim(),
      rules: rules.trim(),
      masterBotEnabled: Boolean(masterBotEnabled),
      documents: Array.isArray(documents) ? documents : [],
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    const { error } = await supabase.from("bot_settings").upsert({
      id: "vst_ai_knowledge",
      is_active: masterBotEnabled,
      dm_template: JSON.stringify(knowledgePayload),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: knowledgePayload,
    });
  } catch (error) {
    console.error("Failed to save AI knowledge:", error);
    return NextResponse.json({ error: "Failed to save knowledge" }, { status: 500 });
  }
}
