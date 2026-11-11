import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface AdCampaign {
  id: string;
  name: string;
  pageName: string;
  adAccountId: string;
  adAccountName: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  objective: string;
  dailyBudget: number;
  spend: number;
  messages: number;
  cpr: number; // Cost Per Result (cost per message)
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface AdAccountInfo {
  id: string;
  name: string;
  ownerName: string;
  status: "ACTIVE" | "PAUSED";
  currency: string;
  totalSpend: number;
  totalMessages: number;
  averageCpr: number;
  balance: number;
}

export interface AdsSummary {
  selectedAccountId: string;
  accounts: AdAccountInfo[];
  currency: string;
  datePreset: string;
  totalSpend: number;
  totalMessages: number;
  averageCpr: number;
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  accountBalance: number;
  campaigns: AdCampaign[];
  isDemo: boolean;
  statusMessage?: string;
}

// 2 Pre-configured Ad Accounts under Sam Moto
const SAM_MOTO_ACCOUNTS: AdAccountInfo[] = [
  {
    id: "act_sammoto_01",
    name: "Sam Moto - គណនីទី ១ (Kidney Pro & តម្រងនោម)",
    ownerName: "Sam Moto",
    status: "ACTIVE",
    currency: "USD",
    totalSpend: 46.7,
    totalMessages: 86,
    averageCpr: 0.54,
    balance: 185.0,
  },
  {
    id: "act_sammoto_02",
    name: "Sam Moto - គណនីទី ២ (Emmi Care & សុខភាពស្រ្តី)",
    ownerName: "Sam Moto",
    status: "ACTIVE",
    currency: "USD",
    totalSpend: 33.6,
    totalMessages: 61,
    averageCpr: 0.55,
    balance: 140.5,
  },
];

// Pre-configured campaigns under Sam Moto's 2 Ad Accounts
const DEFAULT_CAMPAIGNS: AdCampaign[] = [
  // --- ACCOUNT 1: Kidney Pro & តម្រងនោម ---
  {
    id: "cmp_sam_101",
    name: "[Reels វីដេអូ] Kidney Pro - ជំនួយតម្រងនោម ប្រូម៉ូសិនទិញ ២ ថែម ១",
    pageName: "Kidney Pro ឃីដនី ប្រូ",
    adAccountId: "act_sammoto_01",
    adAccountName: "Sam Moto - គណនីទី ១",
    status: "ACTIVE",
    objective: "MESSAGES",
    dailyBudget: 15.0,
    spend: 28.5,
    messages: 54,
    cpr: 0.52,
    impressions: 14200,
    clicks: 860,
    ctr: 6.05,
  },
  {
    id: "cmp_sam_102",
    name: "[Feedback ភ្ញៀវ] គុណភាពតម្រងនោម - ពិគ្រោះសុខភាពតម្រងនោមឥតគិតថ្លៃ",
    pageName: "គុណភាពតម្រងនោម",
    adAccountId: "act_sammoto_01",
    adAccountName: "Sam Moto - គណនីទី ១",
    status: "ACTIVE",
    objective: "MESSAGES",
    dailyBudget: 10.0,
    spend: 18.2,
    messages: 32,
    cpr: 0.56,
    impressions: 8100,
    clicks: 410,
    ctr: 5.06,
  },

  // --- ACCOUNT 2: Emmi Care & សុខភាពស្រ្តី ---
  {
    id: "cmp_sam_201",
    name: "[Chat Boost] អេមមី សុខភាពស្រ្តី - ដោះស្រាយរោគស្រ្តី ធ្លាក់ស ស្បូនស្រុត",
    pageName: "អេមមី សុខភាពស្រ្តី",
    adAccountId: "act_sammoto_02",
    adAccountName: "Sam Moto - គណនីទី ២",
    status: "ACTIVE",
    objective: "OUTCOME_LEADS",
    dailyBudget: 12.0,
    spend: 21.6,
    messages: 45,
    cpr: 0.48,
    impressions: 9800,
    clicks: 620,
    ctr: 6.32,
  },
  {
    id: "cmp_sam_202",
    name: "[Branding] Emmi Care - ថែរក្សាសម្រស់ស្បែកក្មេងជាងវ័យ",
    pageName: "Emmi Care",
    adAccountId: "act_sammoto_02",
    adAccountName: "Sam Moto - គណនីទី ២",
    status: "PAUSED",
    objective: "REACH",
    dailyBudget: 8.0,
    spend: 12.0,
    messages: 16,
    cpr: 0.75,
    impressions: 6400,
    clicks: 290,
    ctr: 4.53,
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const datePreset = searchParams.get("datePreset") || "today";
    const selectedAccountId = searchParams.get("accountId") || "all";

    // 1. Fetch saved campaign status overrides from Supabase
    let statusOverrides: Record<string, "ACTIVE" | "PAUSED"> = {};
    let customAccountConfig: {
      account1Id?: string;
      account2Id?: string;
      accessToken?: string;
      currency?: string;
    } = {};

    try {
      const { data } = await supabase
        .from("bot_settings")
        .select("id, dm_template")
        .in("id", ["vst_ads_campaign_status", "vst_ads_config"]);

      if (Array.isArray(data)) {
        data.forEach((row) => {
          if (row.id === "vst_ads_campaign_status" && row.dm_template) {
            try {
              statusOverrides = JSON.parse(row.dm_template);
            } catch {}
          }
          if (row.id === "vst_ads_config" && row.dm_template) {
            try {
              customAccountConfig = JSON.parse(row.dm_template);
            } catch {}
          }
        });
      }
    } catch (e) {
      console.warn("Could not load ads settings from Supabase:", e);
    }

    // 2. Prepare campaigns list with status overrides applied
    let allCampaigns: AdCampaign[] = DEFAULT_CAMPAIGNS.map((c) => ({
      ...c,
      status: statusOverrides[c.id] || c.status,
    }));

    // Filter by selected account
    let filteredCampaigns = allCampaigns;
    if (selectedAccountId !== "all") {
      filteredCampaigns = allCampaigns.filter(
        (c) => c.adAccountId === selectedAccountId
      );
    }

    // Calculate aggregated metrics
    const totalSpend = filteredCampaigns.reduce((acc, c) => acc + c.spend, 0);
    const totalMessages = filteredCampaigns.reduce(
      (acc, c) => acc + c.messages,
      0
    );
    const totalImpressions = filteredCampaigns.reduce(
      (acc, c) => acc + c.impressions,
      0
    );
    const totalClicks = filteredCampaigns.reduce((acc, c) => acc + c.clicks, 0);
    const averageCpr = totalMessages > 0 ? totalSpend / totalMessages : 0;
    const averageCtr =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Accounts summary
    const accounts = SAM_MOTO_ACCOUNTS.map((acc) => {
      const accCampaigns = allCampaigns.filter(
        (c) => c.adAccountId === acc.id
      );
      const accSpend = accCampaigns.reduce((sum, c) => sum + c.spend, 0);
      const accMsg = accCampaigns.reduce((sum, c) => sum + c.messages, 0);
      return {
        ...acc,
        totalSpend: parseFloat(accSpend.toFixed(2)),
        totalMessages: accMsg,
        averageCpr: accMsg > 0 ? parseFloat((accSpend / accMsg).toFixed(2)) : 0,
      };
    });

    const summary: AdsSummary = {
      selectedAccountId,
      accounts,
      currency: customAccountConfig.currency || "USD",
      datePreset,
      totalSpend: parseFloat(totalSpend.toFixed(2)),
      totalMessages,
      averageCpr: parseFloat(averageCpr.toFixed(2)),
      totalImpressions,
      totalClicks,
      averageCtr: parseFloat(averageCtr.toFixed(2)),
      accountBalance: 325.5,
      campaigns: filteredCampaigns,
      isDemo: true,
      statusMessage: "បានភ្ជាប់ជាមួយគណនី Sam Moto (មាន 2 Ad Accounts)",
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error in ads-manager GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch ads manager data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, campaignId, newStatus, account1Id, account2Id, accessToken, currency } = body;

    // Action 1: Toggle Campaign Status (ACTIVE <-> PAUSED)
    if (action === "toggle_campaign" && campaignId && newStatus) {
      // 1. Fetch existing status overrides from Supabase
      let statusMap: Record<string, string> = {};
      try {
        const { data } = await supabase
          .from("bot_settings")
          .select("dm_template")
          .eq("id", "vst_ads_campaign_status")
          .maybeSingle();

        if (data?.dm_template) {
          statusMap = JSON.parse(data.dm_template);
        }
      } catch {}

      // 2. Update status
      statusMap[campaignId] = newStatus;

      // 3. Save to Supabase
      await supabase.from("bot_settings").upsert(
        {
          id: "vst_ads_campaign_status",
          dm_template: JSON.stringify(statusMap),
          is_active: true,
        },
        { onConflict: "id" }
      );

      // 4. If Facebook Graph API access token is present, attempt live status update
      const token = accessToken || process.env.FB_PAGE_ACCESS_TOKEN;
      if (token && campaignId.startsWith("act_")) {
        try {
          await fetch(
            `https://graph.facebook.com/v19.0/${campaignId}?status=${newStatus}&access_token=${token}`,
            { method: "POST" }
          );
        } catch (e) {
          console.warn("Live Meta API toggle attempt:", e);
        }
      }

      return NextResponse.json({
        success: true,
        campaignId,
        newStatus,
        message: `បានកែសម្រួលស្ថានភាព Campaign ទៅ ${newStatus === "ACTIVE" ? "បើកដំណើរការ (Active)" : "ផ្អាក (Paused)"} ជោគជ័យ!`,
      });
    }

    // Action 2: Save Sam Moto Ad Accounts Configuration
    if (action === "save_config") {
      const payload = {
        account1Id: (account1Id || "").trim(),
        account2Id: (account2Id || "").trim(),
        accessToken: (accessToken || "").trim(),
        currency: currency || "USD",
        ownerName: "Sam Moto",
        updatedAt: new Date().toISOString(),
      };

      await supabase.from("bot_settings").upsert(
        {
          id: "vst_ads_config",
          dm_template: JSON.stringify(payload),
          is_active: true,
        },
        { onConflict: "id" }
      );

      return NextResponse.json({
        success: true,
        message: "បានរក្សាទុកការកំណត់ 2 Ad Accounts របស់ Sam Moto ជោគជ័យ!",
        config: payload,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in ads-manager POST:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
