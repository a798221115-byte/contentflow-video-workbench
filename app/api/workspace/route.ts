import { asc, desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { accounts, contentItems } from "../../../db/schema";

const seedAccounts = [
  { name: "历史讲堂", shortName: "史", positioning: "历史人物与经典故事", color: "#e45a3b", weeklyTarget: 5 },
  { name: "读书有解", shortName: "读", positioning: "好书拆解与认知提升", color: "#3478f6", weeklyTarget: 4 },
  { name: "人物志", shortName: "人", positioning: "人物命运与时代选择", color: "#8b5cf6", weeklyTarget: 3 },
];

const seedItems = [
  { accountId: 1, title: "王阳明最难熬的三年", topic: "历史人物", stage: "script", hook: "真正改变王阳明的，不是功成名就，而是被所有人抛弃的三年。", publishDate: "2026-08-12", priority: "high" },
  { accountId: 2, title: "为什么读完一本书却什么都记不住", topic: "读书方法", stage: "shoot", script: "问题不是记性差，而是从来没有给知识安排一个出口。", shotNotes: "正面口播；书桌补景；前三秒大字问题。", publishDate: "2026-08-11" },
  { accountId: 3, title: "张居正一生最冒险的决定", topic: "人物选择", stage: "edit", shotNotes: "已拍主口播，补改革前后地图和奏折特写。", publishDate: "2026-08-11", priority: "high" },
  { accountId: 1, title: "大明王朝真正的财政困局", topic: "历史制度", stage: "publish", publishCopy: "一个王朝的崩塌，往往先从账本开始。", publishDate: "2026-08-10" },
  { accountId: 2, title: "《被讨厌的勇气》真正想说什么", topic: "心理成长", stage: "published", publishDate: "2026-08-09", views: 28640, likes: 1372, comments: 186, shares: 411, follows: 94 },
  { accountId: 3, title: "苏轼为什么总能重新开始", topic: "人物韧性", stage: "review", publishDate: "2026-08-07", views: 52380, likes: 3186, comments: 342, shares: 927, follows: 211, review: "高转发来自“重新开始”的普适情绪，不是单纯的人物知识。", nextAction: "沿用逆境开场，换用曾国藩做下一次验证。" },
  { accountId: 1, title: "古人如何应对人生低谷", topic: "历史方法", stage: "idea", publishDate: "2026-08-14" },
  { accountId: 2, title: "三步搭建个人阅读系统", topic: "读书方法", stage: "idea", publishDate: "2026-08-15" },
];

async function ensureSeeded() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      positioning TEXT NOT NULL,
      color TEXT NOT NULL,
      weekly_target INTEGER NOT NULL DEFAULT 4,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS content_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT '',
      stage TEXT NOT NULL DEFAULT 'idea',
      hook TEXT NOT NULL DEFAULT '',
      script TEXT NOT NULL DEFAULT '',
      shot_notes TEXT NOT NULL DEFAULT '',
      publish_copy TEXT NOT NULL DEFAULT '',
      publish_date TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL DEFAULT '我',
      priority TEXT NOT NULL DEFAULT 'normal',
      views INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      comments INTEGER NOT NULL DEFAULT 0,
      shares INTEGER NOT NULL DEFAULT 0,
      follows INTEGER NOT NULL DEFAULT 0,
      review TEXT NOT NULL DEFAULT '',
      next_action TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      source_script TEXT NOT NULL DEFAULT '',
      structure_template TEXT NOT NULL DEFAULT '',
      adaptation_notes TEXT NOT NULL DEFAULT '',
      estimated_minutes INTEGER NOT NULL DEFAULT 2,
      image_count INTEGER NOT NULL DEFAULT 4,
      visual_plan TEXT NOT NULL DEFAULT '',
      opening_animation TEXT NOT NULL DEFAULT '',
      voice_profile TEXT NOT NULL DEFAULT '历史讲解固定音色',
      voice_status TEXT NOT NULL DEFAULT 'not_configured',
      voice_reference_url TEXT NOT NULL DEFAULT '',
      audio_url TEXT NOT NULL DEFAULT '',
      edit_tool TEXT NOT NULL DEFAULT '待确认',
      edit_plan TEXT NOT NULL DEFAULT '',
      metrics_screenshot_url TEXT NOT NULL DEFAULT '',
      workflow_profile TEXT NOT NULL DEFAULT 'history-v3.11.0',
      intake_mode TEXT NOT NULL DEFAULT 'video_link',
      run_mode TEXT NOT NULL DEFAULT 'derivative',
      book_title TEXT NOT NULL DEFAULT '',
      book_author TEXT NOT NULL DEFAULT '',
      evidence_status TEXT NOT NULL DEFAULT 'pending',
      evidence_notes TEXT NOT NULL DEFAULT '',
      originality_status TEXT NOT NULL DEFAULT 'pending',
      originality_similarity TEXT NOT NULL DEFAULT '',
      script_approval TEXT NOT NULL DEFAULT 'pending',
      compliance_status TEXT NOT NULL DEFAULT 'pending',
      titles_status TEXT NOT NULL DEFAULT 'pending',
      title_candidates TEXT NOT NULL DEFAULT '',
      selected_long_title TEXT NOT NULL DEFAULT '',
      selected_short_title TEXT NOT NULL DEFAULT '',
      selected_topics TEXT NOT NULL DEFAULT '',
      style_sample_status TEXT NOT NULL DEFAULT 'pending',
      images_approval TEXT NOT NULL DEFAULT 'pending',
      delivery_status TEXT NOT NULL DEFAULT 'pending',
      publication_status TEXT NOT NULL DEFAULT 'locked',
      analytics_horizon TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_content_items_account_stage ON content_items(account_id, stage)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_content_items_updated_at ON content_items(updated_at)"),
  ]);
  const columns = (await env.DB.prepare("PRAGMA table_info(content_items)").all()).results.map(row => String(row.name));
  const additions = [
    ["source_url", "TEXT NOT NULL DEFAULT ''"], ["source_script", "TEXT NOT NULL DEFAULT ''"],
    ["structure_template", "TEXT NOT NULL DEFAULT ''"], ["adaptation_notes", "TEXT NOT NULL DEFAULT ''"],
    ["estimated_minutes", "INTEGER NOT NULL DEFAULT 2"], ["image_count", "INTEGER NOT NULL DEFAULT 4"],
    ["visual_plan", "TEXT NOT NULL DEFAULT ''"], ["opening_animation", "TEXT NOT NULL DEFAULT ''"],
    ["voice_profile", "TEXT NOT NULL DEFAULT '历史讲解固定音色'"], ["voice_status", "TEXT NOT NULL DEFAULT 'not_configured'"],
    ["voice_reference_url", "TEXT NOT NULL DEFAULT ''"],
    ["audio_url", "TEXT NOT NULL DEFAULT ''"], ["edit_tool", "TEXT NOT NULL DEFAULT '待确认'"],
    ["edit_plan", "TEXT NOT NULL DEFAULT ''"], ["metrics_screenshot_url", "TEXT NOT NULL DEFAULT ''"],
    ["workflow_profile", "TEXT NOT NULL DEFAULT 'history-v3.11.0'"], ["intake_mode", "TEXT NOT NULL DEFAULT 'video_link'"],
    ["run_mode", "TEXT NOT NULL DEFAULT 'derivative'"], ["book_title", "TEXT NOT NULL DEFAULT ''"],
    ["book_author", "TEXT NOT NULL DEFAULT ''"], ["evidence_status", "TEXT NOT NULL DEFAULT 'pending'"],
    ["evidence_notes", "TEXT NOT NULL DEFAULT ''"], ["originality_status", "TEXT NOT NULL DEFAULT 'pending'"],
    ["originality_similarity", "TEXT NOT NULL DEFAULT ''"], ["script_approval", "TEXT NOT NULL DEFAULT 'pending'"],
    ["compliance_status", "TEXT NOT NULL DEFAULT 'pending'"], ["titles_status", "TEXT NOT NULL DEFAULT 'pending'"],
    ["title_candidates", "TEXT NOT NULL DEFAULT ''"], ["selected_long_title", "TEXT NOT NULL DEFAULT ''"],
    ["selected_short_title", "TEXT NOT NULL DEFAULT ''"], ["selected_topics", "TEXT NOT NULL DEFAULT ''"],
    ["style_sample_status", "TEXT NOT NULL DEFAULT 'pending'"], ["images_approval", "TEXT NOT NULL DEFAULT 'pending'"],
    ["delivery_status", "TEXT NOT NULL DEFAULT 'pending'"], ["publication_status", "TEXT NOT NULL DEFAULT 'locked'"],
    ["analytics_horizon", "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [name, definition] of additions) {
    if (!columns.includes(name)) await env.DB.prepare(`ALTER TABLE content_items ADD COLUMN ${name} ${definition}`).run();
  }
  const db = getDb();
  const existing = await db.select().from(accounts).limit(1);
  if (existing.length === 0) {
    await db.insert(accounts).values(seedAccounts);
  }
  const existingItems = await db.select().from(contentItems).limit(1);
  if (existingItems.length === 0) {
    for (const item of seedItems) {
      await db.insert(contentItems).values(item);
    }
  }
}

export async function GET() {
  try {
    await ensureSeeded();
    const db = getDb();
    const [accountRows, itemRows] = await Promise.all([
      db.select().from(accounts).orderBy(asc(accounts.id)),
      db.select().from(contentItems).orderBy(desc(contentItems.updatedAt), desc(contentItems.id)),
    ]);
    return Response.json({ accounts: accountRows, items: itemRows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取工作台失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const title = String(payload.title ?? "").trim();
    const accountId = Number(payload.accountId);
    if (!title || !Number.isFinite(accountId)) {
      return Response.json({ error: "标题和账号不能为空" }, { status: 400 });
    }
    const db = getDb();
    const [parentAccount] = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, accountId)).limit(1);
    if (!parentAccount) return Response.json({ error: "所属账号不存在，请先添加父级账号" }, { status: 400 });
    const [item] = await db.insert(contentItems).values({
      accountId,
      title,
      topic: String(payload.topic ?? ""),
      stage: String(payload.stage ?? "idea"),
      publishDate: String(payload.publishDate ?? ""),
      priority: String(payload.priority ?? "normal"),
      script: String(payload.script ?? ""),
      sourceUrl: String(payload.sourceUrl ?? ""),
      sourceScript: String(payload.sourceScript ?? payload.script ?? ""),
      workflowProfile: String(payload.workflowProfile ?? "history-v3.11.0"),
      intakeMode: String(payload.intakeMode ?? (payload.sourceScript ? "user_supplied_text" : "video_link")),
      runMode: String(payload.runMode ?? "derivative"),
      bookTitle: String(payload.bookTitle ?? ""),
      bookAuthor: String(payload.bookAuthor ?? ""),
      scriptApproval: String(payload.runMode === "direct_final" ? "approved" : "pending"),
      originalityStatus: String(payload.runMode === "direct_final" ? "not_required" : "pending"),
    }).returning();
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "新增失败" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const id = Number(payload.id);
    if (!Number.isFinite(id)) return Response.json({ error: "缺少内容编号" }, { status: 400 });

    const allowed = ["accountId", "title", "topic", "stage", "hook", "script", "shotNotes", "publishCopy", "publishDate", "owner", "priority", "views", "likes", "comments", "shares", "follows", "review", "nextAction", "sourceUrl", "sourceScript", "structureTemplate", "adaptationNotes", "estimatedMinutes", "imageCount", "visualPlan", "openingAnimation", "voiceProfile", "voiceStatus", "voiceReferenceUrl", "audioUrl", "editTool", "editPlan", "metricsScreenshotUrl", "workflowProfile", "intakeMode", "runMode", "bookTitle", "bookAuthor", "evidenceStatus", "evidenceNotes", "originalityStatus", "originalitySimilarity", "scriptApproval", "complianceStatus", "titlesStatus", "titleCandidates", "selectedLongTitle", "selectedShortTitle", "selectedTopics", "styleSampleStatus", "imagesApproval", "deliveryStatus", "publicationStatus", "analyticsHorizon"] as const;
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const key of allowed) {
      if (key in payload) updates[key] = payload[key];
    }
    const db = getDb();
    if ("accountId" in updates) {
      const accountId = Number(updates.accountId);
      const [parentAccount] = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, accountId)).limit(1);
      if (!parentAccount) return Response.json({ error: "目标父级账号不存在" }, { status: 400 });
      updates.accountId = accountId;
    }
    const [item] = await db.update(contentItems).set(updates).where(eq(contentItems.id, id)).returning();
    return Response.json({ item });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "更新失败" }, { status: 500 });
  }
}
