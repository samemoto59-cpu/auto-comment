import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DEFAULT_PAGES = [
  {
    id: "101267342561819",
    name: "Emmi អេមមី",
    category: "ផលិតផលនារី (Women Care)",
    ownerName: "VST Super Admin",
    isActive: true,
  },
  {
    id: "985673367962860",
    name: "Emmi By CEO",
    category: "អាជីវកម្មផ្លូវការ (Official Brand)",
    ownerName: "VST Super Admin",
    isActive: true,
  },
];

function isEmmiPage(name?: string): boolean {
  const n = (name || "").toLowerCase();
  return n.includes("emmi") || n.includes("អេមមី");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get("owner");
    const isAdmin = searchParams.get("isAdmin") !== "false";
    const userId = searchParams.get("userId");

    // 1. Fetch bot_settings statuses & member pages from Supabase
    const { data: settingsData } = await supabase
      .from("bot_settings")
      .select("id, is_active, dm_template");

    const statusMap = new Map<
      string,
      { isActive: boolean; disabledByAdmin: boolean }
    >();
    const memberPagesMap = new Map<
      string,
      { id: string; name: string; ownerName: string; category?: string; userId?: string }
    >();

    if (Array.isArray(settingsData)) {
      settingsData.forEach((row) => {
        if (row.id === "vst_members") {
          try {
            const members = JSON.parse(row.dm_template);
            if (Array.isArray(members)) {
              members.forEach((m: any) => {
                if (Array.isArray(m.pages)) {
                  m.pages.forEach((p: any) => {
                    const isSamMoto = (m.name || "").toLowerCase().includes("sam moto");
                    if ((isSamMoto && isEmmiPage(p.name)) || p.keepInPrivateApp === true) {
                      memberPagesMap.set(p.id, {
                        id: p.id,
                        name: p.name,
                        ownerName: m.name || m.email || "Sam Moto",
                        userId: m.id || "",
                        category: p.category || "ផលិតផលនារី (Women Care)",
                      });
                    }
                  });
                }
              });
            }
          } catch {}
        } else if (row.id !== "default") {
          statusMap.set(row.id, {
            isActive: row.is_active !== false,
            disabledByAdmin: row.dm_template === "LOCKED_BY_ADMIN",
          });
        }
      });
    }

    // Build list of pages
    const pagesMap = new Map<string, any>();

    // 2. Add Super Admin pages ONLY if user is Admin or specifically requesting Admin pages
    if (isAdmin || (owner && owner.toLowerCase().includes("admin"))) {
      DEFAULT_PAGES.forEach((p) => {
        const pageStatus = statusMap.get(p.id);
        pagesMap.set(p.id, {
          ...p,
          isActive: pageStatus ? pageStatus.isActive : p.isActive,
          disabledByAdmin: pageStatus ? pageStatus.disabledByAdmin : false,
        });
      });
    }

    // 3. Add member pages
    memberPagesMap.forEach((p, pageId) => {
      const pageStatus = statusMap.get(pageId);
      if (pagesMap.has(pageId)) {
        const existing = pagesMap.get(pageId);
        existing.ownerName = `${existing.ownerName} / ${p.ownerName}`;
      } else {
        pagesMap.set(pageId, {
          id: p.id,
          name: p.name,
          category: p.category || "Facebook Page (Member)",
          ownerName: p.ownerName,
          userId: p.userId,
          isActive: pageStatus ? pageStatus.isActive : true,
          disabledByAdmin: pageStatus ? pageStatus.disabledByAdmin : false,
        });
      }
    });

    let allPages = Array.from(pagesMap.values());

    // 4. Strict isolation: If NOT admin, user ONLY sees their own pages
    if (!isAdmin) {
      if (!owner && !userId) {
        // If regular user has no identifier or hasn't connected anything, return empty list!
        return NextResponse.json({
          success: true,
          pages: [],
          totalPages: 0,
        });
      }

      allPages = allPages.filter((p) => {
        const matchOwner = owner && p.ownerName?.toLowerCase().includes(owner.toLowerCase());
        const matchUser = userId && p.userId && p.userId === userId;
        return matchOwner || matchUser;
      });
    } else if (owner && owner !== "all") {
      // Admin filtering by specific owner
      allPages = allPages.filter((p) =>
        p.ownerName?.toLowerCase().includes(owner.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      pages: allPages,
      totalPages: allPages.length,
    });
  } catch (err) {
    console.error("GET /api/pages error:", err);
    return NextResponse.json({
      success: true,
      pages: [],
      totalPages: 0,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, pageId, isActive, isAdmin, name, category, ownerName, userId, accessToken } = body;

    // A. Connect / Register a New Page (Manual, 1-Click, or FB)
    if (action === "connect" || (pageId && name && ownerName)) {
      if (!pageId || !name) {
        return NextResponse.json(
          { success: false, error: "Missing pageId or page name" },
          { status: 400 }
        );
      }

      // 1. Fetch current vst_members from bot_settings
      const { data: memberData } = await supabase
        .from("bot_settings")
        .select("dm_template")
        .eq("id", "vst_members")
        .maybeSingle();

      let membersList: any[] = [];
      if (memberData && memberData.dm_template) {
        try {
          membersList = JSON.parse(memberData.dm_template);
        } catch {}
      }

      const targetOwner = ownerName || "VST Member";
      const targetUserId = userId || `user_${Date.now()}`;

      let mIndex = membersList.findIndex(
        (m: any) =>
          (userId && m.id === userId) ||
          (m.name && m.name.toLowerCase() === targetOwner.toLowerCase())
      );

      // Look up working accessToken from existing pool if not provided
      let tokenToUse = accessToken;
      if (!tokenToUse) {
        for (const m of membersList) {
          if (Array.isArray(m.pages)) {
            const foundP = m.pages.find((p: any) => p.id === String(pageId).trim() && p.accessToken);
            if (foundP?.accessToken) {
              tokenToUse = foundP.accessToken;
              break;
            }
          }
        }
      }

      const newPageObj = {
        id: String(pageId).trim(),
        name: String(name).trim(),
        category: category || "Facebook Connected Page",
        accessToken: tokenToUse || undefined,
        isActive: true,
        keepInPrivateApp: true,
      };

      if (mIndex >= 0) {
        const existingMember = membersList[mIndex];
        const existingPages = Array.isArray(existingMember.pages) ? existingMember.pages : [];
        const pageIdx = existingPages.findIndex((p: any) => p.id === newPageObj.id);
        if (pageIdx >= 0) {
          existingPages[pageIdx] = { ...existingPages[pageIdx], ...newPageObj };
        } else {
          existingPages.push(newPageObj);
        }
        existingMember.pages = existingPages;
        existingMember.pagesCount = existingPages.length;
        existingMember.lastLogin = new Date().toISOString();
        membersList[mIndex] = existingMember;
      } else {
        // Create new member entry
        membersList.push({
          id: targetUserId,
          name: targetOwner,
          email: targetOwner.includes("@") ? targetOwner : null,
          role: "Member",
          loginType: "Custom / Manual",
          pagesCount: 1,
          pages: [newPageObj],
          lastLogin: new Date().toISOString(),
          status: "Active",
          botEnabled: true,
        });
      }

      // Save updated members with new page into Supabase
      await supabase.from("bot_settings").upsert({
        id: "vst_members",
        is_active: true,
        dm_template: JSON.stringify(membersList),
        updated_at: new Date().toISOString(),
      });

      // Also upsert default bot_settings for this new page
      await supabase.from("bot_settings").upsert(
        {
          id: newPageObj.id,
          is_active: true,
          reply_templates: [
            `សួស្ដី {name}! 😊 អរគុណសម្រាប់ការទាក់ទងមកកាន់ទំព័រ ${newPageObj.name}។ យើងខ្ញុំបានផ្ញើព័ត៌មានលម្អិតជូនក្នុង Inbox ហើយបង 💬✨`,
          ],
          auto_dm_enabled: true,
          dm_template: `សូមស្វាគមន៍មកកាន់ទំព័រ ${newPageObj.name} 🌸! តើបងមានចម្ងល់ ឬចង់ដឹងតម្លៃផលិតផលណាដែរ? ខ្ញុំអាចជួយផ្ដល់ការប្រឹក្សាជូនភ្លាមៗណា!`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      return NextResponse.json({
        success: true,
        page: {
          ...newPageObj,
          ownerName: targetOwner,
          isActive: true,
        },
      });
    }

    // B. Disconnect Page
    if (action === "disconnect" && pageId) {
      const { data: memberData } = await supabase
        .from("bot_settings")
        .select("dm_template")
        .eq("id", "vst_members")
        .maybeSingle();

      let membersList: any[] = [];
      if (memberData?.dm_template) {
        try {
          membersList = JSON.parse(memberData.dm_template);
        } catch {}
      }

      const targetId = String(pageId).trim();
      membersList = membersList.map((m: any) => {
        const existingPages = Array.isArray(m.pages) ? m.pages : [];
        const filteredPages = existingPages.filter((p: any) => p.id !== targetId);
        return {
          ...m,
          pages: filteredPages,
          pagesCount: filteredPages.length,
        };
      });

      await supabase.from("bot_settings").upsert({
        id: "vst_members",
        is_active: true,
        dm_template: JSON.stringify(membersList),
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({ success: true, disconnectedPageId: pageId });
    }

    // C. Toggle Page Active Status
    if (!pageId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Missing pageId or isActive" },
        { status: 400 }
      );
    }

    // 1. Check existing settings for Admin Lock
    const { data: existingRow } = await supabase
      .from("bot_settings")
      .select("dm_template")
      .eq("id", pageId)
      .maybeSingle();

    const isLockedByAdmin = existingRow?.dm_template === "LOCKED_BY_ADMIN";

    // 2. Member trying to enable a page that was locked/disabled by Admin
    if (!isAdmin && isLockedByAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ទំព័រនេះត្រូវបានផ្អាកដោយ Super Admin។ មានតែ Admin ប៉ុណ្ណោះដែលអាចបើកដំណើរការ Bot ឡើងវិញបាន!",
          locked: true,
        },
        { status: 403 }
      );
    }

    // 3. Upsert into Supabase bot_settings
    const updatePayload: any = {
      id: pageId,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    // If Super Admin is explicitly disabling, record the Admin Lock
    if (isAdmin) {
      updatePayload.dm_template = isActive ? "" : "LOCKED_BY_ADMIN";
    }

    await supabase.from("bot_settings").upsert(updatePayload, { onConflict: "id" });

    return NextResponse.json({
      success: true,
      pageId,
      isActive,
      disabledByAdmin: isAdmin ? !isActive : isLockedByAdmin,
    });
  } catch (err) {
    console.error("POST /api/pages error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
