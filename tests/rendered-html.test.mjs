import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the complete seven-stage history production workflow", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  for (const label of ["来源与选题", "文案确认", "配音与分镜", "成片交付", "发布授权", "数据快照", "实验复盘"]) {
    assert.match(page, new RegExp(label));
  }
  assert.match(page, /ContentFlow/);
  assert.match(page, /\/api\/workspace/);
});

test("supports link extraction before an idea enters the pipeline", async () => {
  const [page, extractor] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/api/extract/route.ts", root), "utf8"),
  ]);
  assert.match(page, /读取网页/);
  assert.match(page, /完整口播稿/);
  assert.match(extractor, /needs_transcript/);
  assert.match(extractor, /isPrivateHost/);
});

test("aligns the production packet with the history skill and durable media boundary", async () => {
  const [page, schema, media, hosting] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("app/api/media/route.ts", root), "utf8"),
    readFile(new URL(".openai/hosting.json", root), "utf8"),
  ]);
  for (const label of ["入口与证据包", "原创文案与第一次确认", "10 + 10 + 10", "语义分镜与第二次确认", "成片、封面与交付", "分发授权", "24h / 72h / 7d 数据快照"]) assert.match(page, new RegExp(label.replace(/[+]/g, "\\+")));
  for (const gate of ["G01", "O01", "G02", "C01", "V01", "G03", "G04", "G06", "G09"]) assert.match(page, new RegExp(gate));
  assert.match(page, /produce-wechat-book-video-history/);
  assert.match(page, /history-scholar-male-locked-v1/);
  assert.match(schema, /voiceReferenceUrl/);
  assert.match(schema, /originalityStatus/);
  assert.match(schema, /publicationStatus/);
  assert.match(media, /25 \* 1024 \* 1024/);
  assert.match(hosting, /"r2": "MEDIA"/);
});

test("implements the two history-skill intake branches and publication boundary", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  for (const label of ["历史二创", "成稿直出", "文字/链接双入口", "文皮皮", "正式发布仍需单独授权", "原创声明", "含有AI生成内容"]) assert.match(page, new RegExp(label));
  assert.match(page, /runMode/);
  assert.match(page, /direct_final/);
  assert.match(page, /sourceText/);
});

test("uses durable workspace storage and production metadata", async () => {
  const [hosting, schema, layout] = await Promise.all([
    readFile(new URL(".openai/hosting.json", root), "utf8"),
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(schema, /contentItems/);
  assert.match(schema, /metric|views/i);
  assert.match(layout, /视频号矩阵工作台/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
});

test("manages accounts as safe parent nodes", async () => {
  const [page, accountApi, workspaceApi] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/api/accounts/route.ts", root), "utf8"),
    readFile(new URL("app/api/workspace/route.ts", root), "utf8"),
  ]);
  for (const label of ["添加一个父级账号", "管理账号资料", "移交到", "不会删除"]) assert.match(page, new RegExp(label));
  assert.match(page, /\/api\/accounts/);
  assert.match(accountApi, /不能删除最后一个账号/);
  assert.match(accountApi, /UPDATE content_items SET account_id/);
  assert.doesNotMatch(accountApi, /DELETE FROM content_items/);
  assert.match(workspaceApi, /所属账号不存在，请先添加父级账号/);
});

test("links overview signals to focused workflow and growth analysis", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  for (const label of ["今日对标雷达", "查看今天进度", "账号增长控制台", "内容增长漏斗", "账号健康度", "本周期复盘动作"]) {
    assert.match(page, new RegExp(label));
  }
  assert.match(page, /openPipeline\(stage\.id\)/);
  assert.match(page, /stageFilter/);
  assert.match(page, /analysisPeriod/);
  assert.match(page, /当前为演示雷达，尚未连接真实采集源/);
});
