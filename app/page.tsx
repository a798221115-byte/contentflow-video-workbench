"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Account = { id: number; name: string; shortName: string; positioning: string; color: string; weeklyTarget: number };
type ContentItem = {
  id: number; accountId: number; title: string; topic: string; stage: string; hook: string; script: string;
  shotNotes: string; publishCopy: string; publishDate: string; owner: string; priority: string;
  views: number; likes: number; comments: number; shares: number; follows: number; review: string; nextAction: string;
  sourceUrl: string; sourceScript: string; structureTemplate: string; adaptationNotes: string;
  estimatedMinutes: number; imageCount: number; visualPlan: string; openingAnimation: string;
  voiceProfile: string; voiceStatus: string; voiceReferenceUrl: string; audioUrl: string;
  editTool: string; editPlan: string; metricsScreenshotUrl: string;
  workflowProfile: string; intakeMode: string; runMode: string; bookTitle: string; bookAuthor: string;
  evidenceStatus: string; evidenceNotes: string; originalityStatus: string; originalitySimilarity: string;
  scriptApproval: string; complianceStatus: string; titlesStatus: string; titleCandidates: string;
  selectedLongTitle: string; selectedShortTitle: string; selectedTopics: string;
  styleSampleStatus: string; imagesApproval: string; deliveryStatus: string; publicationStatus: string; analyticsHorizon: string;
};

const stages = [
  { id: "idea", label: "来源与选题", short: "来源", hint: "待取证" },
  { id: "script", label: "文案确认", short: "文案", hint: "G02" },
  { id: "shoot", label: "配音与分镜", short: "分镜", hint: "V01·G04" },
  { id: "edit", label: "成片交付", short: "成片", hint: "G05·C02" },
  { id: "publish", label: "发布授权", short: "发布", hint: "G07·G08" },
  { id: "published", label: "数据快照", short: "快照", hint: "24h·72h·7d" },
  { id: "review", label: "实验复盘", short: "复盘", hint: "G09" },
];

const historyNodes = [
  { id: "G01", label: "证据包锁定", field: "evidenceStatus", ready: ["locked", "not_required"] },
  { id: "O01", label: "原创度检测", field: "originalityStatus", ready: ["passed", "not_required"] },
  { id: "G02", label: "文案确认", field: "scriptApproval", ready: ["approved"] },
  { id: "C01", label: "发布前文案审核", field: "complianceStatus", ready: ["passed"] },
  { id: "V01", label: "男声与真实时间轴", field: "voiceStatus", ready: ["audio_ready"] },
  { id: "T01", label: "10+10+10 标题话题", field: "titlesStatus", ready: ["selected"] },
  { id: "G03", label: "风格样图质检", field: "styleSampleStatus", ready: ["passed"] },
  { id: "G04", label: "全部图片确认", field: "imagesApproval", ready: ["approved"] },
  { id: "G06", label: "成片交付登记", field: "deliveryStatus", ready: ["registered"] },
] as const;

const statusLabels: Record<string, string> = {
  pending: "待开始", running: "执行中", blocked: "已阻塞", locked: "已锁定", not_required: "不适用",
  passed: "已通过", approved: "已确认", selected: "已采用", reference_ready: "参考就绪", audio_ready: "配音就绪",
  registered: "已登记", authorized: "已授权", draft_ready: "草稿已传", published: "已发布",
};

const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN", { notation: value > 9999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value || 0);

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [activeAccount, setActiveAccount] = useState<number | "all">("all");
  const [section, setSection] = useState("overview");
  const [stageFilter, setStageFilter] = useState<string | "all">("all");
  const [analysisPeriod, setAnalysisPeriod] = useState<"day" | "week" | "month">("week");
  const [analysisMetric, setAnalysisMetric] = useState<"views" | "interactions" | "follows">("views");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [accountEditor, setAccountEditor] = useState<Account | "new" | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<number[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [transferToAccountId, setTransferToAccountId] = useState<number | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [createRunMode, setCreateRunMode] = useState<"derivative" | "direct_final">("derivative");
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<{ original: string; script: string; title: string; kind: string; notes: string } | null>(null);
  const [extractError, setExtractError] = useState("");

  async function loadWorkspace() {
    const response = await fetch("/api/workspace", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "读取失败");
    setAccounts(data.accounts); setItems(data.items); setLoading(false);
  }

  useEffect(() => { loadWorkspace().catch((e) => { setNotice(e.message); setLoading(false); }); }, []);

  const visibleItems = useMemo(() => activeAccount === "all" ? items : items.filter((item) => item.accountId === activeAccount), [items, activeAccount]);
  const totalViews = visibleItems.reduce((sum, item) => sum + item.views, 0);
  const totalInteractions = visibleItems.reduce((sum, item) => sum + item.likes + item.comments + item.shares, 0);
  const publishedCount = visibleItems.filter((item) => ["published", "review"].includes(item.stage)).length;
  const inProgressCount = visibleItems.filter((item) => !["idea", "published", "review"].includes(item.stage)).length;
  const pipelineItems = useMemo(() => stageFilter === "all" ? visibleItems : visibleItems.filter((item) => item.stage === stageFilter), [visibleItems, stageFilter]);
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dateLabel = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(today);

  function openPipeline(stage: string | "all" = "all") { setStageFilter(stage); setSection("pipeline"); }
  function openToday() { setStageFilter("today"); setSection("pipeline"); }
  function openAnalytics(metric: "views" | "interactions" | "follows" = "views") { setAnalysisMetric(metric); setSection("analytics"); }
  const displayedPipelineItems = stageFilter === "today" ? visibleItems.filter((item) => item.publishDate === todayIso) : pipelineItems;
  const analysisScale = analysisPeriod === "day" ? 0.18 : analysisPeriod === "month" ? 3.7 : 1;
  const analysisSeries = {
    day: [38, 46, 43, 55, 62, 58, 74],
    week: [31, 42, 38, 57, 51, 66, 81],
    month: [24, 34, 29, 45, 53, 67, 78],
  }[analysisPeriod];
  const metricSeries = analysisSeries.map((value) => analysisMetric === "interactions" ? Math.max(18, value - 13) : analysisMetric === "follows" ? Math.max(12, value - 25) : value);
  const metricTotal = analysisMetric === "views" ? Math.round(totalViews * analysisScale) : analysisMetric === "interactions" ? Math.round(totalInteractions * analysisScale) : Math.round(visibleItems.reduce((sum, item) => sum + item.follows, 0) * analysisScale);

  async function updateItem(id: number, updates: Partial<ContentItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
    setSelected((current) => current?.id === id ? { ...current, ...updates } : current);
    const response = await fetch("/api/workspace", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    if (!response.ok) { await loadWorkspace(); setNotice("保存失败，已恢复原数据"); }
    else { const data = await response.json(); setItems((current) => current.map((item) => item.id === id ? data.item : item)); setNotice("已保存"); setTimeout(() => setNotice(""), 1400); }
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawText = sourceText.trim() || extractResult?.original || "";
    const workingText = createRunMode === "direct_final" ? rawText : (extractResult?.script ?? rawText);
    const payload = { ...Object.fromEntries(form.entries()), sourceUrl, sourceScript: rawText, script: workingText, intakeMode: rawText ? "user_supplied_text" : "video_link", runMode: createRunMode, workflowProfile: "history-v3.11.0" };
    const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (response.ok) { const data = await response.json(); setItems((current) => [data.item, ...current]); setShowCreate(false); setSourceUrl(""); setSourceText(""); setCreateRunMode("derivative"); setExtractResult(null); setExtractError(""); setNotice(createRunMode === "direct_final" ? "成稿直出项目已建立，下一步运行 C01" : "历史二创项目已进入证据取证阶段"); }
  }

  function openAccountEditor(account: Account | "new") {
    setAccountEditor(account);
    setDeleteMode(false);
    setTransferToAccountId(account === "new" ? null : (accounts.find((candidate) => candidate.id !== account.id)?.id ?? null));
  }

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAccount(true);
    try {
      const form = new FormData(event.currentTarget);
      const payload = Object.fromEntries(form.entries());
      const editing = accountEditor !== "new" && accountEditor !== null;
      const response = await fetch("/api/accounts", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: accountEditor.id, ...payload } : payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存账号失败");
      setAccounts((current) => editing ? current.map((account) => account.id === data.account.id ? data.account : account) : [...current, data.account]);
      if (!editing) { setExpandedAccounts((current) => [...current, data.account.id]); setActiveAccount(data.account.id); }
      setAccountEditor(null);
      setNotice(editing ? "账号资料已更新" : "新账号已加入矩阵");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "保存账号失败");
    } finally {
      setSavingAccount(false);
    }
  }

  async function deleteAccount(account: Account) {
    setSavingAccount(true);
    try {
      const childCount = items.filter((item) => item.accountId === account.id).length;
      const response = await fetch("/api/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: account.id, transferToAccountId: childCount > 0 ? transferToAccountId : undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "删除账号失败");
      setAccounts((current) => current.filter((candidate) => candidate.id !== account.id));
      if (data.transferredToAccountId) {
        setItems((current) => current.map((item) => item.accountId === account.id ? { ...item, accountId: data.transferredToAccountId } : item));
      }
      if (activeAccount === account.id) setActiveAccount(data.transferredToAccountId ?? "all");
      setExpandedAccounts((current) => current.filter((id) => id !== account.id));
      setAccountEditor(null);
      setDeleteMode(false);
      setNotice(data.contentCount ? `账号已删除，${data.contentCount} 条内容已安全移交` : "账号已删除");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "删除账号失败");
    } finally {
      setSavingAccount(false);
    }
  }

  function toggleAccount(accountId: number) {
    setExpandedAccounts((current) => current.includes(accountId) ? current.filter((id) => id !== accountId) : [...current, accountId]);
  }

  async function extractSource() {
    setExtracting(true); setExtractError(""); setExtractResult(null);
    try {
      const response = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: sourceUrl }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "提取失败");
      setExtractResult(data);
    } catch (error) { setExtractError(error instanceof Error ? error.message : "提取失败"); }
    finally { setExtracting(false); }
  }

  async function uploadMedia(file: File, purpose: "metrics" | "voice" | "audio") {
    if (!selected) return;
    const form = new FormData(); form.set("file", file); form.set("contentId", String(selected.id)); form.set("purpose", purpose);
    setNotice("正在上传…");
    const response = await fetch("/api/media", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) { setNotice(data.error || "上传失败"); return; }
    if (purpose === "metrics") await updateItem(selected.id, { metricsScreenshotUrl: data.url });
    else if (purpose === "voice") await updateItem(selected.id, { voiceReferenceUrl: data.url, voiceStatus: "reference_ready" });
    else await updateItem(selected.id, { audioUrl: data.url, voiceStatus: "audio_ready" });
    setNotice(purpose === "metrics" ? "数据截图已保存，请确认识别结果" : purpose === "voice" ? "参考音色已保存，等待 VoxCPM 生成" : "生成的配音已保存");
  }

  function nodeState(item: ContentItem, node: typeof historyNodes[number]) {
    const value = String(item[node.field] || "pending");
    return { value, ready: node.ready.includes(value as never), label: statusLabels[value] || value };
  }

  function workflowProgress(item: ContentItem) {
    return historyNodes.filter((node) => nodeState(item, node).ready).length;
  }

  async function copyHistoryTask(item: ContentItem) {
    const input = item.sourceScript?.trim() || item.sourceUrl?.trim() || item.title;
    const modeLine = item.runMode === "direct_final"
      ? "这是成稿直出：逐字保留用户成稿，不做二创；将本指令视为 G02 已确认，直接从 C01 开始。"
      : "这是正常历史二创：先建立 G01 证据包，必须通过文皮皮 O01 原创检测后再等待 G02 文案确认。";
    const task = `请使用 produce-wechat-book-video-history v3.11.0 继续这个历史视频项目。\n\n项目：${item.bookTitle || item.title}\n账号：${accountFor(item.accountId)?.name || "未指定"}\n流程：${modeLine}\n来源：${input}\n\n请复用同一个 Codex 任务；严格执行两次人工确认（G02 文案、G04 全部图片），历史学者型合成男声为默认，正式发布必须另行取得本次任务授权。`;
    await navigator.clipboard.writeText(task);
    setNotice("历史赛道 Skill 任务已复制，可粘贴到 Codex 运行");
  }

  async function setGate(item: ContentItem, updates: Partial<ContentItem>, message: string) {
    await updateItem(item.id, updates);
    setNotice(message);
  }

  function accountFor(id: number) { return accounts.find((account) => account.id === id); }
  function goNext(item: ContentItem) { const index = stages.findIndex((stage) => stage.id === item.stage); if (index < stages.length - 1) updateItem(item.id, { stage: stages[index + 1].id }); }

  if (loading) return <div className="loading-screen"><div className="loading-mark">CF</div><p>正在整理你的内容工作台…</p></div>;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">CF</div><div><strong>ContentFlow</strong><span>视频号矩阵工作台</span></div></div>
        <nav className="nav-list" aria-label="主要导航">
          <button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><i>⌂</i>经营总览</button>
          <button className={section === "pipeline" ? "active" : ""} onClick={() => openPipeline("all")}><i>▦</i>内容流水线<span className="nav-count">{inProgressCount}</span></button>
          <button className={section === "analytics" ? "active" : ""} onClick={() => setSection("analytics")}><i>⌁</i>经营分析</button>
          <button className={section === "metrics" ? "active" : ""} onClick={() => setSection("metrics")}><i>↗</i>数据回收</button>
          <button className={section === "review" ? "active" : ""} onClick={() => setSection("review")}><i>◎</i>复盘中心</button>
        </nav>
        <div className="sidebar-section"><div className="matrix-heading"><p>我的矩阵</p><button onClick={() => openAccountEditor("new")} aria-label="添加账号">＋ 添加</button></div>
          <button className={`account-filter ${activeAccount === "all" ? "active" : ""}`} onClick={() => setActiveAccount("all")}><span className="all-dot">{accounts.length}</span><b>全部账号</b><em>{items.length}</em></button>
          <div className="account-tree">
            {accounts.map((account) => { const children = items.filter((item) => item.accountId === account.id); const expanded = expandedAccounts.includes(account.id); return <div className={`account-node ${activeAccount === account.id ? "active" : ""}`} key={account.id}>
              <div className="account-parent">
                <button className="tree-toggle" onClick={() => toggleAccount(account.id)} aria-label={expanded ? `收起${account.name}` : `展开${account.name}`}>{expanded ? "⌄" : "›"}</button>
                <button className="account-filter" onClick={() => { setActiveAccount(account.id); if (!expanded) toggleAccount(account.id); }}><span style={{ background: account.color }}>{account.shortName}</span><b>{account.name}</b><em>{children.length}</em></button>
                <button className="account-manage" onClick={() => openAccountEditor(account)} aria-label={`管理${account.name}`}>•••</button>
              </div>
              {expanded && <div className="account-children">{children.length ? children.slice(0, 4).map((item) => <button key={item.id} onClick={() => { setActiveAccount(account.id); setSelected(item); }}><i /> <span>{item.title}</span><em>{stages.find((stage) => stage.id === item.stage)?.short}</em></button>) : <p>还没有内容，先新建一个选题</p>}{children.length > 4 && <button className="more-children" onClick={() => { setActiveAccount(account.id); openPipeline("all"); }}>查看全部 {children.length} 条 →</button>}</div>}
            </div>; })}
          </div>
        </div>
        <div className="sidebar-foot"><span className="status-dot" />本地数据已连接<small>刚刚自动保存</small></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><button className="date-jump" onClick={openToday}>{dateLabel}<span>查看今天进度 →</span></button><h1>{section === "overview" ? "早上好，今天把内容往前推一步。" : section === "pipeline" ? "内容流水线" : section === "analytics" ? "经营分析" : section === "metrics" ? "数据回收" : "复盘中心"}</h1></div>
          <div className="top-actions"><button className="quiet-button" onClick={() => setNotice("全部内容已是最新状态")}>↻ 同步状态</button><button className="primary-button" onClick={() => setShowCreate(true)}>＋ 新建选题</button></div>
        </header>

        {notice && <div className="toast">{notice}</div>}

        {section === "overview" && <>
          <section className="focus-strip benchmark-focus">
            <div><span className="focus-label">BENCHMARK RADAR · 今日对标雷达</span><h2>张居正题材升温：3 个对标账号在 24 小时内连续发布</h2><p>建议切入“改革为什么得罪所有人” · 当前为演示雷达，尚未连接真实采集源</p></div>
            <button onClick={() => setNotice("对标采集将在下一阶段接入；当前先建立账号清单和每日快照")}>查看来源 <span>→</span></button>
          </section>
          <section className="kpi-grid overview-actions">
            <button onClick={() => openAnalytics("views")}><span>本周已发布</span><strong>{publishedCount}<small> 条</small></strong><p><b className="up">↑ 2</b> 较上周同期</p><em>查看经营分析 →</em></button>
            <button onClick={() => openPipeline("all")}><span>生产进行中</span><strong>{inProgressCount}<small> 条</small></strong><p>{visibleItems.filter(i => i.priority === "high" && !["published", "review"].includes(i.stage)).length} 条高优先级</p><em>查看流水线 →</em></button>
            <button onClick={() => openAnalytics("views")}><span>累计播放</span><strong>{formatNumber(totalViews)}</strong><p><b className="up">↑ 18.4%</b> 本周内容</p><em>查看趋势 →</em></button>
            <button onClick={() => openAnalytics("interactions")}><span>累计互动</span><strong>{formatNumber(totalInteractions)}</strong><p>互动率 {totalViews ? ((totalInteractions / totalViews) * 100).toFixed(1) : 0}%</p><em>查看转化 →</em></button>
          </section>
          <section className="skill-status-strip"><div><span className="section-kicker">HISTORY PRODUCTION OS</span><h3>历史赛道 Skill v3.11.0 已对齐</h3><p>文字/链接双入口 · G01 证据链 · O01 原创检测 · 两次人工确认 · 历史男声 · 授权发布 · 24h/72h/7d 复盘</p></div><button onClick={() => openPipeline("all")}>查看生产节点 →</button></section>
          <section className="overview-grid">
            <article className="panel pipeline-summary"><div className="panel-head"><div><span className="section-kicker">FLOW · HISTORY SKILL</span><h3>生产进度</h3></div><button onClick={() => openPipeline("all")}>查看全部</button></div>
              <div className="stage-rail">{stages.slice(0, 6).map((stage, index) => { const count = visibleItems.filter(i => i.stage === stage.id).length; return <button className="stage-node" key={stage.id} onClick={() => openPipeline(stage.id)}><div><span>{String(index + 1).padStart(2, "0")}</span><b>{stage.label}</b></div><strong>{count}</strong><small>{stage.hint}</small><em>打开 →</em></button>; })}</div>
            </article>
            <article className="panel schedule-panel"><div className="panel-head"><div><span className="section-kicker">NEXT</span><h3>接下来发布</h3></div></div>
              <div className="schedule-list">{visibleItems.filter(i => i.publishDate).sort((a,b) => a.publishDate.localeCompare(b.publishDate)).slice(0,4).map(item => <button key={item.id} onClick={() => setSelected(item)}><time>{item.publishDate.slice(5).replace("-", "/")}</time><span className="mini-account" style={{ background: accountFor(item.accountId)?.color }}>{accountFor(item.accountId)?.shortName}</span><div><b>{item.title}</b><small>{stages.find(s => s.id === item.stage)?.label} · {item.topic}</small></div><em>›</em></button>)}</div>
            </article>
          </section>
          <section className="account-performance"><div className="section-title"><div><span className="section-kicker">MATRIX</span><h2>账号经营状态</h2></div><p>先看更新节奏，再看结果</p></div>
            <div className="account-cards">{accounts.filter(a => activeAccount === "all" || a.id === activeAccount).map(account => { const own = items.filter(i => i.accountId === account.id); const views = own.reduce((s,i)=>s+i.views,0); return <article key={account.id}><header><span style={{background: account.color}}>{account.shortName}</span><div><h3>{account.name}</h3><p>{account.positioning}</p></div><i className="healthy">稳定</i></header><div className="account-stats"><div><small>本周内容</small><b>{own.filter(i => ["published","review"].includes(i.stage)).length} / {account.weeklyTarget}</b></div><div><small>累计播放</small><b>{formatNumber(views)}</b></div><div><small>进行中</small><b>{own.filter(i => !["published","review"].includes(i.stage)).length}</b></div></div><div className="progress"><span style={{width: `${Math.min(100,(own.filter(i => ["published","review"].includes(i.stage)).length/account.weeklyTarget)*100)}%`,background: account.color}} /></div></article>; })}</div>
          </section>
        </>}

        {section === "pipeline" && <section className="kanban-wrap"><div className="section-title pipeline-title"><div><span className="section-kicker">PRODUCTION</span><h2>{stageFilter === "today" ? "今天的任务进度" : stageFilter === "all" ? "从选题到复盘，每条内容都有下一步" : `${stages.find((stage) => stage.id === stageFilter)?.label}阶段`}</h2></div><p>{displayedPipelineItems.length} 条内容</p></div><div className="stage-filter-bar"><button className={stageFilter === "all" ? "active" : ""} onClick={() => setStageFilter("all")}>全部</button><button className={stageFilter === "today" ? "active" : ""} onClick={() => setStageFilter("today")}>今天</button>{stages.map((stage) => <button key={stage.id} className={stageFilter === stage.id ? "active" : ""} onClick={() => setStageFilter(stage.id)}>{stage.label}<span>{visibleItems.filter((item) => item.stage === stage.id).length}</span></button>)}</div>{displayedPipelineItems.length === 0 ? <div className="empty-pipeline"><b>这个筛选下还没有内容</b><p>可以新建选题，或者切换到其他阶段继续查看。</p><button className="primary-button" onClick={() => setShowCreate(true)}>＋ 新建选题</button></div> : <div className={`kanban ${stageFilter !== "all" ? "kanban-filtered" : ""}`}>{stages.filter((stage) => stageFilter === "all" || stageFilter === "today" || stage.id === stageFilter).map(stage => <div className="kanban-column" key={stage.id}><header><span>{stage.label}</span><b>{displayedPipelineItems.filter(i => i.stage === stage.id).length}</b></header><div>{displayedPipelineItems.filter(i => i.stage === stage.id).map(item => <button className={`content-card ${item.priority === "high" ? "priority" : ""}`} key={item.id} onClick={() => setSelected(item)}><div className="card-top"><span style={{background: accountFor(item.accountId)?.color}}>{accountFor(item.accountId)?.shortName}</span><small>{item.topic || "未分类"}</small></div><h3>{item.title}</h3>{item.hook && <p>{item.hook}</p>}<footer><time>{item.publishDate ? item.publishDate.slice(5).replace("-", "/") : "待排期"}</time><span>{item.owner}</span></footer></button>)}</div></div>)}</div>}</section>}

        {section === "analytics" && <section className="analytics-page"><div className="analytics-toolbar"><div><span className="section-kicker">GROWTH CONTROL ROOM</span><h2>账号增长控制台</h2><p>不只看涨跌，还要知道问题出在哪一环、下一条该改什么。</p></div><div className="period-tabs">{(["day","week","month"] as const).map((period) => <button key={period} className={analysisPeriod === period ? "active" : ""} onClick={() => setAnalysisPeriod(period)}>{({day:"日",week:"周",month:"月"})[period]}</button>)}</div></div><div className="data-provenance"><b>数据口径说明</b><span>播放、互动、涨粉来自当前已回收内容；曝光、完播、环比和健康分目前用于展示分析模型，接入每日数据快照后将由真实数据自动计算。</span><em>演示模型</em></div>
          <div className="analysis-summary"><article><span>{analysisPeriod === "day" ? "今日" : analysisPeriod === "week" ? "本周" : "本月"}播放</span><strong>{formatNumber(Math.round(totalViews * analysisScale))}</strong><p><b>↑ 18.4%</b> 较上一周期</p></article><article><span>互动率</span><strong>{totalViews ? ((totalInteractions / totalViews) * 100).toFixed(1) : 0}%</strong><p><b>↑ 0.8pp</b> 评论贡献提高</p></article><article><span>净增关注</span><strong>+{formatNumber(Math.round(visibleItems.reduce((sum,item)=>sum+item.follows,0)*analysisScale))}</strong><p><b>↑ 12.6%</b> 较上一周期</p></article><article><span>更新达成</span><strong>{Math.min(100, Math.round(publishedCount / Math.max(1, accounts.reduce((sum,account)=>sum+account.weeklyTarget,0)) * 100 * (analysisPeriod === "week" ? 1 : analysisPeriod === "month" ? .28 : 7)))}%</strong><p><i>需关注</i> 历史讲堂断更</p></article></div>
          <div className="analytics-grid"><article className="analysis-panel trend-panel"><header><div><span className="section-kicker">TREND</span><h3>增长趋势</h3></div><div className="metric-tabs"><button className={analysisMetric === "views" ? "active" : ""} onClick={() => setAnalysisMetric("views")}>播放</button><button className={analysisMetric === "interactions" ? "active" : ""} onClick={() => setAnalysisMetric("interactions")}>互动</button><button className={analysisMetric === "follows" ? "active" : ""} onClick={() => setAnalysisMetric("follows")}>涨粉</button></div></header><div className="trend-total"><strong>{analysisMetric === "follows" ? "+" : ""}{formatNumber(metricTotal)}</strong><span>↑ 18.4% 环比</span></div><div className="bar-chart">{metricSeries.map((value,index)=><div key={index}><span style={{height:`${value}%`}}/><small>{analysisPeriod === "day" ? `${index*4+1}时` : analysisPeriod === "week" ? `周${"一二三四五六日"[index]}` : `${index+1}周`}</small></div>)}</div><footer><span>数据源：已回收的内容指标</span><button onClick={() => setSection("metrics")}>补充数据 →</button></footer></article>
            <article className="analysis-panel funnel-panel"><header><div><span className="section-kicker">FUNNEL</span><h3>内容增长漏斗</h3></div><small>本周</small></header><div className="funnel-row"><span>曝光</span><div><i style={{width:"100%"}}/></div><b>12.4万</b><em>100%</em></div><div className="funnel-row"><span>播放</span><div><i style={{width:"65%"}}/></div><b>8.1万</b><em>65.3%</em></div><div className="funnel-row warning"><span>完播</span><div><i style={{width:"27%"}}/></div><b>2.2万</b><em>27.1%</em></div><div className="funnel-row"><span>互动</span><div><i style={{width:"12%"}}/></div><b>6,424</b><em>7.9%</em></div><div className="funnel-row"><span>关注</span><div><i style={{width:"5%"}}/></div><b>+305</b><em>0.38%</em></div><p className="diagnosis-note"><b>当前瓶颈：完播</b> 开头有人停留，但中段信息密度下降。下一条优先压缩背景铺垫 15–20 秒。</p></article>
          </div>
          <section className="account-health"><div className="section-title"><div><span className="section-kicker">ACCOUNT HEALTH</span><h2>账号健康度</h2></div><p>节奏 × 内容效率 × 互动 × 关注转化</p></div><div className="health-table"><div className="health-row health-head"><span>账号</span><span>增长得分</span><span>更新达成</span><span>播放环比</span><span>完播率</span><span>关注转化</span><span>当前问题</span></div>{accounts.map((account,index)=>{const own=items.filter(item=>item.accountId===account.id);const score=[62,86,78][index]??72;return <button className="health-row" key={account.id} onClick={()=>{setActiveAccount(account.id);setSection("review")}}><span><i style={{background:account.color}}>{account.shortName}</i><b>{account.name}</b></span><span><strong>{score}</strong><small>/100</small></span><span>{own.filter(item=>["published","review"].includes(item.stage)).length}/{account.weeklyTarget}</span><span className={index===0?"down":"up"}>{index===0?"↓ 8.2%":index===1?"↑ 24.1%":"↑ 11.6%"}</span><span>{[21.8,36.2,31.4][index]??28}%</span><span>{[.22,.51,.43][index]??.35}%</span><span><em className={index===0?"risk":"stable"}>{index===0?"更新断档":index===1?"表现健康":"选题波动"}</em></span></button>})}</div></section>
          <div className="analytics-grid lower"><article className="analysis-panel content-ranking"><header><div><span className="section-kicker">CONTENT</span><h3>内容效率排行</h3></div><small>播放不是唯一指标</small></header>{visibleItems.filter(item=>item.views>0).sort((a,b)=>b.views-a.views).map((item,index)=><button key={item.id} onClick={()=>setSelected(item)}><span>{String(index+1).padStart(2,"0")}</span><div><b>{item.title}</b><small>{accountFor(item.accountId)?.name} · {formatNumber(item.views)} 播放</small></div><em>{item.views?((item.likes+item.comments+item.shares)/item.views*100).toFixed(1):0}% 互动</em></button>)}</article><article className="analysis-panel action-panel"><header><div><span className="section-kicker">NEXT ACTION</span><h3>本周期复盘动作</h3></div></header><ol><li><b>先修复更新节奏</b><p>历史讲堂本周 0/5，明天前至少推进 1 条到发布。</p><button onClick={()=>{setActiveAccount(accounts[0]?.id??"all");openPipeline("all")}}>查看待办 →</button></li><li><b>验证完播问题</b><p>下一条将背景铺垫压缩 20 秒，其他变量保持不变。</p><button onClick={()=>setSection("review")}>写入复盘 →</button></li><li><b>放大有效选题</b><p>人物逆境类转发明显高于均值，连续测试 2 条相邻题材。</p><button onClick={()=>setShowCreate(true)}>建立选题 →</button></li></ol></article></div>
        </section>}

        {section === "metrics" && <section><div className="section-title"><div><span className="section-kicker">METRICS</span><h2>发布后数据回收</h2></div><p>点击一条内容录入最新数据</p></div><div className="data-table"><div className="table-row table-head"><span>内容</span><span>账号</span><span>播放</span><span>点赞</span><span>评论</span><span>转发</span><span>涨粉</span></div>{visibleItems.filter(i => ["published","review"].includes(i.stage)).map(item => <button className="table-row" key={item.id} onClick={() => setSelected(item)}><span><b>{item.title}</b><small>{item.publishDate}</small></span><span>{accountFor(item.accountId)?.name}</span><strong>{formatNumber(item.views)}</strong><span>{formatNumber(item.likes)}</span><span>{formatNumber(item.comments)}</span><span>{formatNumber(item.shares)}</span><span>+{formatNumber(item.follows)}</span></button>)}</div></section>}

        {section === "review" && <section><div className="section-title"><div><span className="section-kicker">LEARNING</span><h2>把一次表现，变成下一次判断</h2></div><p>{visibleItems.filter(i => i.review).length} 条已形成结论</p></div><div className="review-grid">{visibleItems.filter(i => i.stage === "review" || i.review).map(item => <article key={item.id}><div className="review-meta"><span style={{background: accountFor(item.accountId)?.color}}>{accountFor(item.accountId)?.shortName}</span><small>{item.topic}</small><em>{formatNumber(item.views)} 播放</em></div><h3>{item.title}</h3><div className="insight"><small>这次学到什么</small><p>{item.review || "还没有写下复盘结论。"}</p></div><div className="next-test"><small>下一次验证</small><p>{item.nextAction || "等待补充下一步动作。"}</p></div><button onClick={() => setSelected(item)}>完善复盘 →</button></article>)}</div></section>}
      </section>

      {showCreate && <div className="modal-backdrop" onMouseDown={() => setShowCreate(false)}><form className="create-modal create-modal-wide history-intake-modal" onSubmit={createItem} onMouseDown={e=>e.stopPropagation()}><header><div><span className="section-kicker">HISTORY SKILL · v3.11.0</span><h2>建立一个历史视频项目</h2><p className="modal-intro">可以只给链接，也可以直接粘贴完整口播稿；两种输入会走不同的证据链。</p></div><button type="button" onClick={()=>setShowCreate(false)}>×</button></header>
        <div className="run-mode-tabs"><button type="button" className={createRunMode === "derivative" ? "active" : ""} onClick={()=>setCreateRunMode("derivative")}><b>历史二创</b><small>取证 → 原创检测 → 文案确认</small></button><button type="button" className={createRunMode === "direct_final" ? "active" : ""} onClick={()=>setCreateRunMode("direct_final")}><b>成稿直出</b><small>逐字保留 → 直接进入 C01</small></button></div>
        <div className="history-intake-grid"><div className="source-box"><label>来源链接（可选）<div className="source-input-row"><input type="url" value={sourceUrl} onChange={e=>{setSourceUrl(e.target.value);setExtractError("");}} placeholder="抖音视频、公众号文章或博客链接"/><button type="button" className="extract-button" disabled={!sourceUrl || extracting} onClick={extractSource}>{extracting ? "正在提取…" : "读取网页"}</button></div></label>{extractError && <div className="extract-message error">{extractError}</div>}{extractResult && <div className="extract-message success">网页文字已读取。视频只有页面字幕时才会成功；抖音链接正式生产仍按 Skill 使用 TikHub + Whisper。</div>}</div><label className="source-text-input">完整口播稿（可选，优先于链接）<textarea value={sourceText || extractResult?.original || ""} onChange={e=>setSourceText(e.target.value)} placeholder={createRunMode === "direct_final" ? "粘贴已经确认、需要逐字直出的完整成稿" : "粘贴参考口播稿；系统会保留原文，只做最小校正后进入取证与二创"}/></label></div>
        <div className="intake-routing"><span className={(sourceText || extractResult?.original) ? "done" : "active"}>01 判定文字/链接入口</span><i>→</i><span>02 核验书名与版本</span><i>→</i><span>{createRunMode === "direct_final" ? "03 C01 文案审核" : "03 O01 原创检测"}</span><i>→</i><span>04 两次确认后交付</span></div>
        <label>项目标题<input name="title" required autoFocus placeholder="识别到书名后，项目会以书名为主标题" defaultValue={extractResult?.title ?? ""} key={extractResult?.title}/></label>
        <div className="form-row"><label>书名<input name="bookTitle" placeholder="例如：万历十五年" /></label><label>作者（可后补）<input name="bookAuthor" placeholder="用于版本与封面核验" /></label></div>
        <div className="form-row"><label>所属账号<select name="accountId">{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label>内容栏目<input name="topic" placeholder="历史人物 / 制度史 / 战争史" /></label></div><div className="form-row"><label>计划日期<input name="publishDate" type="date" /></label><label>优先级<select name="priority"><option value="normal">普通</option><option value="high">高优先级</option></select></label></div><input type="hidden" name="stage" value={createRunMode === "direct_final" ? "script" : "idea"}/><div className="skill-contract"><b>工作台会遵守</b><span>正常二创必须通过文皮皮 O01 才能请你确认文案</span><span>只在 G02 文案、G04 全图两处等你</span><span>正式发布仍需单独授权</span></div><footer><button type="button" className="quiet-button" onClick={()=>setShowCreate(false)}>取消</button><button className="primary-button">建立历史项目</button></footer></form></div>}

      {accountEditor && <div className="modal-backdrop" onMouseDown={() => setAccountEditor(null)}><form className="create-modal account-modal" onSubmit={saveAccount} onMouseDown={(event) => event.stopPropagation()}><header><div><span className="section-kicker">ACCOUNT</span><h2>{accountEditor === "new" ? "添加一个父级账号" : "管理账号资料"}</h2><p className="modal-intro">账号是父级；选题、脚本、成片和数据都归在它下面。</p></div><button type="button" onClick={() => setAccountEditor(null)}>×</button></header>
        <div className="account-identity-preview"><span style={{ background: accountEditor === "new" ? "#e45a3b" : accountEditor.color }}>{accountEditor === "new" ? "新" : accountEditor.shortName}</span><div><b>{accountEditor === "new" ? "新视频号" : accountEditor.name}</b><small>{accountEditor === "new" ? "建立后即可接收选题" : `${items.filter((item) => item.accountId === accountEditor.id).length} 条子内容`}</small></div><em>父级</em></div>
        <div className="form-row"><label>账号名称<input name="name" required maxLength={30} defaultValue={accountEditor === "new" ? "" : accountEditor.name} placeholder="例如：历史讲堂" /></label><label>头像简称<input name="shortName" required maxLength={2} defaultValue={accountEditor === "new" ? "" : accountEditor.shortName} placeholder="1–2 个字" /></label></div>
        <label>账号定位<input name="positioning" required maxLength={80} defaultValue={accountEditor === "new" ? "" : accountEditor.positioning} placeholder="这个账号主要讲什么、面向谁" /></label>
        <div className="form-row"><label>账号颜色<input name="color" type="color" defaultValue={accountEditor === "new" ? "#e45a3b" : accountEditor.color} /></label><label>每周发布目标<input name="weeklyTarget" type="number" min="1" max="30" defaultValue={accountEditor === "new" ? 4 : accountEditor.weeklyTarget} /></label></div>
        {accountEditor !== "new" && <section className={`delete-account-zone ${deleteMode ? "open" : ""}`}>{!deleteMode ? <><div><b>删除这个父级账号</b><p>有子内容时不会直接删除，必须先整体移交。</p></div><button type="button" disabled={accounts.length <= 1} onClick={() => setDeleteMode(true)}>{accounts.length <= 1 ? "最后一个账号不可删" : "删除账号"}</button></> : <><div><b>确认删除「{accountEditor.name}」</b><p>{items.filter((item) => item.accountId === accountEditor.id).length ? `下面 ${items.filter((item) => item.accountId === accountEditor.id).length} 条内容将原样移交，不会删除。` : "这个账号下面没有内容，可以安全删除。"}</p></div>{items.some((item) => item.accountId === accountEditor.id) && <label>移交到<select value={transferToAccountId ?? ""} onChange={(event) => setTransferToAccountId(Number(event.target.value))}>{accounts.filter((account) => account.id !== accountEditor.id).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>}<div className="delete-actions"><button type="button" onClick={() => setDeleteMode(false)}>返回</button><button type="button" className="danger-button" disabled={savingAccount || (items.some((item) => item.accountId === accountEditor.id) && !transferToAccountId)} onClick={() => deleteAccount(accountEditor)}>确认删除</button></div></>}</section>}
        {!deleteMode && <footer><button type="button" className="quiet-button" onClick={() => setAccountEditor(null)}>取消</button><button className="primary-button" disabled={savingAccount}>{savingAccount ? "正在保存…" : accountEditor === "new" ? "添加到矩阵" : "保存账号资料"}</button></footer>}
      </form></div>}

      {selected && <div className="drawer-backdrop" onMouseDown={() => setSelected(null)}><aside className="detail-drawer production-drawer history-drawer" onMouseDown={e=>e.stopPropagation()}><header><div className="drawer-account"><span style={{background: accountFor(selected.accountId)?.color}}>{accountFor(selected.accountId)?.shortName}</span><div><small>{accountFor(selected.accountId)?.name} · HISTORY SKILL v3.11.0</small><b>{selected.bookTitle || selected.title}</b></div></div><button onClick={()=>setSelected(null)}>×</button></header><div className="drawer-body">
        <section className="workflow-banner"><div><span>{selected.runMode === "direct_final" ? "成稿直出" : "正常历史二创"}</span><b>{workflowProgress(selected)} / {historyNodes.length} 个内部节点已完成</b><small>人工只确认 G02 文案与 G04 全部图片；发布另行授权</small></div><button type="button" onClick={()=>copyHistoryTask(selected)}>在 Codex 继续生产</button></section>
        <div className="gate-map">{historyNodes.map((node)=>{const state=nodeState(selected,node);return <div className={state.ready ? "done" : state.value === "blocked" ? "blocked" : ""} key={node.id}><i>{node.id}</i><span><b>{node.label}</b><small>{state.label}</small></span></div>})}</div>

        <section className="work-card"><header><span>01</span><div><b>入口与证据包 · G01</b><small>文字优先；只有链接时才走 TikHub + Whisper</small></div><i className={`status-chip ${["locked","not_required"].includes(selected.evidenceStatus) ? "ready" : ""}`}>{selected.evidenceStatus === "not_required" ? "直出不需要" : statusLabels[selected.evidenceStatus] || "待取证"}</i></header><div className="form-row"><label>项目标题<input value={selected.title} onChange={e=>setSelected({...selected,title:e.target.value})} onBlur={()=>updateItem(selected.id,{title:selected.title})}/></label><label>流程分支<select value={selected.runMode} onChange={e=>{const runMode=e.target.value;setSelected({...selected,runMode,scriptApproval:runMode === "direct_final" ? "approved" : "pending",originalityStatus:runMode === "direct_final" ? "not_required" : "pending"});updateItem(selected.id,{runMode,scriptApproval:runMode === "direct_final" ? "approved" : "pending",originalityStatus:runMode === "direct_final" ? "not_required" : "pending"})}}><option value="derivative">正常历史二创</option><option value="direct_final">成稿直出</option></select></label></div><div className="form-row"><label>书名<input value={selected.bookTitle} placeholder="识别后项目以书名命名" onChange={e=>setSelected({...selected,bookTitle:e.target.value})} onBlur={()=>updateItem(selected.id,{bookTitle:selected.bookTitle})}/></label><label>作者 / 译者<input value={selected.bookAuthor} placeholder="用于版本与封面核验" onChange={e=>setSelected({...selected,bookAuthor:e.target.value})} onBlur={()=>updateItem(selected.id,{bookAuthor:selected.bookAuthor})}/></label></div><label>来源链接<input value={selected.sourceUrl} placeholder="抖音等视频链接或文章链接" onChange={e=>setSelected({...selected,sourceUrl:e.target.value})} onBlur={()=>updateItem(selected.id,{sourceUrl:selected.sourceUrl})}/></label><label>完整参考原稿<textarea className="tall" value={selected.sourceScript} placeholder="必须保留原始文字；只做可追溯的最小校正" onChange={e=>setSelected({...selected,sourceScript:e.target.value})} onBlur={()=>updateItem(selected.id,{sourceScript:selected.sourceScript})}/></label><label>证据说明<textarea value={selected.evidenceNotes} placeholder="微信读书准确版本、前 10 条热门划线、引文边界；无匹配时仅可用豆瓣补元数据和封面" onChange={e=>setSelected({...selected,evidenceNotes:e.target.value})} onBlur={()=>updateItem(selected.id,{evidenceNotes:selected.evidenceNotes})}/></label><div className="work-actions"><button type="button" className="quiet-button visible" onClick={()=>setGate(selected,{evidenceStatus:selected.runMode === "direct_final" ? "not_required" : "locked"},selected.runMode === "direct_final" ? "已记录：成稿直出不要求 G01" : "G01 证据包已锁定")}>{selected.runMode === "direct_final" ? "记录 G01 不适用" : "锁定 G01 证据包"}</button><span>豆瓣只补书名、版本和封面，不能代替微信读书原文证据</span></div></section>

        <section className="work-card"><header><span>02</span><div><b>原创文案与第一次确认 · O01 / G02</b><small>正常二创先过文皮皮；成稿直出逐字保留</small></div><i className={`status-chip ${selected.scriptApproval === "approved" ? "ready" : ""}`}>{selected.scriptApproval === "approved" ? "文案已确认" : "等待第一次确认"}</i></header><label>{selected.runMode === "direct_final" ? "最终成稿（不得改写）" : "历史二创口播稿"}<textarea className="tall" value={selected.script} placeholder={selected.runMode === "direct_final" ? "与用户成稿逐字一致" : "只复用钩子功能、信息顺序、情绪曲线和收束功能；事实来自核验材料"} onChange={e=>setSelected({...selected,script:e.target.value})} onBlur={()=>updateItem(selected.id,{script:selected.script})}/></label>{selected.runMode === "derivative" && <div className="originality-row"><label>文皮皮状态<select value={selected.originalityStatus} onChange={e=>{setSelected({...selected,originalityStatus:e.target.value});updateItem(selected.id,{originalityStatus:e.target.value})}}><option value="pending">待检测</option><option value="running">检测中</option><option value="passed">鉴定结果：原创</option><option value="blocked">检测阻塞</option></select></label><label>原始相似度<input value={selected.originalitySimilarity} placeholder="例如 18%（按网站原值）" onChange={e=>setSelected({...selected,originalitySimilarity:e.target.value})} onBlur={()=>updateItem(selected.id,{originalitySimilarity:selected.originalitySimilarity})}/></label></div>}<div className="approval-actions"><button type="button" className="quiet-button visible" onClick={()=>setGate(selected,{scriptApproval:"pending"},"G02 已退回，可修改文案并重跑后续节点")}>退回修改</button><button type="button" className="primary-button" disabled={selected.runMode === "derivative" && selected.originalityStatus !== "passed"} onClick={()=>setGate(selected,{scriptApproval:"approved",stage:"script"},"第一次确认完成：G02 文案已锁定")}>确认 G02 文案</button></div><p className="rule-note warning">文皮皮页面刚打开时显示的“0% / 原创”是占位，不算通过；必须有完整结果、耗时、相似度和截图。</p></section>

        <section className="work-card"><header><span>03</span><div><b>C01 后并行：标题话题 + 历史男声</b><small>两条分支都完成后才能规划分镜</small></div><i className={`status-chip ${selected.complianceStatus === "passed" ? "ready" : ""}`}>{selected.complianceStatus === "passed" ? "C01 已通过" : "C01 待检查"}</i></header><div className="work-actions gate-action-row"><button type="button" className="quiet-button visible" disabled={selected.scriptApproval !== "approved"} onClick={()=>setGate(selected,{complianceStatus:"passed"},"C01 文案风险检查已记录通过")}>记录 C01 PASS</button><span>通过后可并行生成 T01 与 V01</span></div><div className="parallel-branches"><article><header><i>T01</i><div><b>10 + 10 + 10</b><small>长标题 · 短标题 · 话题组</small></div></header><label>采用的长标题<input value={selected.selectedLongTitle} onChange={e=>setSelected({...selected,selectedLongTitle:e.target.value})} onBlur={()=>updateItem(selected.id,{selectedLongTitle:selected.selectedLongTitle})}/></label><label>采用的短标题<input value={selected.selectedShortTitle} onChange={e=>setSelected({...selected,selectedShortTitle:e.target.value})} onBlur={()=>updateItem(selected.id,{selectedShortTitle:selected.selectedShortTitle})}/></label><label>采用的 7 个话题<textarea value={selected.selectedTopics} placeholder="#读书 #好书推荐 … #《当前书名》" onChange={e=>setSelected({...selected,selectedTopics:e.target.value})} onBlur={()=>updateItem(selected.id,{selectedTopics:selected.selectedTopics})}/></label><button type="button" disabled={selected.complianceStatus !== "passed"} onClick={()=>setGate(selected,{titlesStatus:"selected"},"标题与话题已采用；完整 10+10+10 仍需保留在 titles.json")}>标记已采用</button></article><article><header><i>V01</i><div><b>历史学者型合成男声</b><small>VoxCPM2 · 0.96× · seed 42</small></div></header><label>锁定音色<input value={selected.voiceProfile || "history-scholar-male-locked-v1"} onChange={e=>setSelected({...selected,voiceProfile:e.target.value})} onBlur={()=>updateItem(selected.id,{voiceProfile:selected.voiceProfile})}/></label><label className="upload-card">上传完整配音（临时手动入口）<input type="file" accept="audio/wav,audio/mpeg,audio/mp4" onChange={e=>e.target.files?.[0]&&uploadMedia(e.target.files[0],"audio")}/><span>{selected.audioUrl ? "配音文件已保存，真实时长作为唯一时间轴" : "正式流程由 Skill 调用本地 VoxCPM 后回传"}</span></label>{selected.audioUrl && <audio controls src={selected.audioUrl}/>}<p>默认男声必须使用原创合成角色，不得使用王立群或其他真实人物录音做克隆参考。</p></article></div></section>

        <section className="work-card"><header><span>04</span><div><b>语义分镜与第二次确认 · G03 / G04</b><small>图片数量由语义变化决定，约 8 秒仅作节奏检查</small></div><i className={`status-chip ${selected.imagesApproval === "approved" ? "ready" : ""}`}>{selected.imagesApproval === "approved" ? "全部图片已确认" : "等待第二次确认"}</i></header><label>语义分镜计划<textarea className="tall" value={selected.visualPlan} placeholder="每一镜记录：口播区间、叙事功能、人物是否必要、景别、面向、构图安全区和真实配音起止时间" onChange={e=>setSelected({...selected,visualPlan:e.target.value})} onBlur={()=>updateItem(selected.id,{visualPlan:selected.visualPlan})}/></label><div className="visual-contract"><span>G03 只生成 1 张样图并自动质检</span><span>通过样图后生成其余图片</span><span>背景无文字，统一暖金文学电影感</span><span>人物、空镜、静物、建筑、天气按语义混合</span></div><div className="approval-actions"><button type="button" className="quiet-button visible" disabled={selected.titlesStatus !== "selected" || selected.voiceStatus !== "audio_ready"} onClick={()=>setGate(selected,{styleSampleStatus:"passed"},"G03 样图已通过自动质检")}>记录 G03 样图通过</button><button type="button" className="primary-button" disabled={selected.styleSampleStatus !== "passed"} onClick={()=>setGate(selected,{imagesApproval:"approved",stage:"shoot"},"第二次确认完成：G04 全部图片已锁定")}>确认 G04 全部图片</button></div></section>

        <section className="work-card"><header><span>05</span><div><b>成片、封面与交付 · G05 / C02 / G06</b><small>第二次确认后自动完成，不再增加第三个生产确认</small></div><i className={`status-chip ${selected.deliveryStatus === "registered" ? "ready" : ""}`}>{selected.deliveryStatus === "registered" ? "交付已登记" : "等待后期"}</i></header><div className="delivery-spec"><article><b>成片</b><span>1080×1920 · 60fps</span><small>固定男版片头 + 双语字幕 + 单向轻运镜</small></article><article><b>字幕</b><span>中文 68 / 英文 30</span><small>中英独立样式，按真实配音时间对齐</small></article><article><b>封面</b><span>1080×1260</span><small>独立文件，保留核验原版书封</small></article></div><label>后期与校验记录<textarea value={selected.editPlan} placeholder="G05 技术校验、C02 发布风险、MP4/封面/titles.json/delivery-manifest 路径" onChange={e=>setSelected({...selected,editPlan:e.target.value})} onBlur={()=>updateItem(selected.id,{editPlan:selected.editPlan})}/></label><button type="button" className="delivery-register" disabled={selected.imagesApproval !== "approved"} onClick={()=>setGate(selected,{deliveryStatus:"registered",stage:"edit"},"G06 交付包已登记")}>记录 C02 PASS 与 G06 交付登记</button></section>

        <section className="work-card publication-card"><header><span>06</span><div><b>分发授权 · G07 / G08</b><small>草稿箱与正式发布是两件不同的事</small></div><i className={`status-chip ${selected.publicationStatus === "published" ? "ready" : ""}`}>{statusLabels[selected.publicationStatus] || "未授权"}</i></header><div className="distribution-options"><button type="button" disabled={selected.deliveryStatus !== "registered"} onClick={()=>setGate(selected,{publicationStatus:"draft_ready",stage:"publish"},"已记录 G07 草稿上传请求；不会自动正式发布")}><b>上传视频号草稿</b><small>明确请求 + 已登录账号</small></button><button type="button" disabled={selected.deliveryStatus !== "registered" || selected.publicationStatus !== "authorized"} onClick={()=>setGate(selected,{publicationStatus:"published",stage:"published",analyticsHorizon:"24h"},"G08 正式发布结果已记录，开始 24h 数据回收")}><b>执行正式发布</b><small>需先在本次任务里选账号并明确授权</small></button></div><button type="button" className="authorization-button" disabled={selected.deliveryStatus !== "registered"} onClick={()=>setGate(selected,{publicationStatus:"authorized"},"已记录本次任务发布授权；执行前仍需校验原创与 AI 内容声明")}>记录本次任务明确授权</button><p className="rule-note warning">视频号正式发布前必须机器验证“原创声明”和“含有AI生成内容”均已选择；任一无法验证就停止，不点击发表。</p></section>

        {["published","review"].includes(selected.stage) && <section className="work-card"><header><span>07</span><div><b>24h / 72h / 7d 数据快照 · G09</b><small>每个时间点单独保存，不覆盖前一次</small></div><i className="status-chip">{selected.analyticsHorizon || "待 24h"}</i></header><div className="snapshot-tabs">{["24h","72h","7d"].map(h=><button type="button" key={h} className={selected.analyticsHorizon===h?"active":""} onClick={()=>updateItem(selected.id,{analyticsHorizon:h})}>{h}</button>)}</div><label className="upload-card screenshot-upload">上传当前时间点的视频号数据截图<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>e.target.files?.[0]&&uploadMedia(e.target.files[0],"metrics")}/><span>OCR 接入前先保存截图并人工确认；后续按时间点形成独立快照</span></label>{selected.metricsScreenshotUrl && <img className="metrics-shot" src={selected.metricsScreenshotUrl} alt="视频号数据截图"/>}<div className="metrics-editor"><h3>确认当前快照数据</h3><div className="metric-inputs">{(["views","likes","comments","shares","follows"] as const).map(key=><label key={key}>{({views:"播放",likes:"点赞",comments:"评论",shares:"转发",follows:"涨粉"})[key]}<input type="number" value={selected[key]} onChange={e=>setSelected({...selected,[key]:Number(e.target.value)})} onBlur={()=>updateItem(selected.id,{[key]:selected[key]})}/></label>)}</div></div><label>这次学到什么<textarea value={selected.review} placeholder="钩子留存、完播、转发、收藏、关注转化分别说明了什么" onChange={e=>setSelected({...selected,review:e.target.value})} onBlur={()=>updateItem(selected.id,{review:selected.review})}/></label><label>下一条单变量实验<textarea value={selected.nextAction} placeholder="只改变一个可验证变量，保留其他条件" onChange={e=>setSelected({...selected,nextAction:e.target.value})} onBlur={()=>updateItem(selected.id,{nextAction:selected.nextAction})}/></label></section>}
      </div><footer><select value={selected.stage} onChange={e=>updateItem(selected.id,{stage:e.target.value})}>{stages.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select><button className="primary-button" disabled={selected.stage === "review"} onClick={()=>goNext(selected)}>{selected.stage === "review" ? "流程已完成" : `推进到${stages[stages.findIndex(s=>s.id===selected.stage)+1]?.label}`} →</button></footer></aside></div>}
    </main>
  );
}
