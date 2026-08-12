import { asc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { accounts } from "../../../db/schema";

type AccountPayload = Record<string, unknown>;

async function ensureAccountsTable() {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    positioning TEXT NOT NULL,
    color TEXT NOT NULL,
    weekly_target INTEGER NOT NULL DEFAULT 4,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

function normalizeAccount(payload: AccountPayload, fallback?: typeof accounts.$inferSelect) {
  const name = String(payload.name ?? fallback?.name ?? "").trim();
  const shortName = String(payload.shortName ?? fallback?.shortName ?? name.slice(0, 1)).trim().slice(0, 2);
  const positioning = String(payload.positioning ?? fallback?.positioning ?? "待补充账号定位").trim();
  const color = String(payload.color ?? fallback?.color ?? "#e45a3b").trim();
  const weeklyTarget = Number(payload.weeklyTarget ?? fallback?.weeklyTarget ?? 4);

  if (!name) throw new Error("账号名称不能为空");
  if (!shortName) throw new Error("账号简称不能为空");
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("请选择有效的账号颜色");
  if (!Number.isInteger(weeklyTarget) || weeklyTarget < 1 || weeklyTarget > 30) throw new Error("周更目标需为 1–30 条");

  return { name, shortName, positioning: positioning || "待补充账号定位", color, weeklyTarget };
}

async function hasDuplicateName(name: string, exceptId?: number) {
  const rows = await getDb().select({ id: accounts.id, name: accounts.name }).from(accounts);
  return rows.some((row) => row.name.trim().toLocaleLowerCase("zh-CN") === name.toLocaleLowerCase("zh-CN") && row.id !== exceptId);
}

export async function GET() {
  try {
    await ensureAccountsTable();
    const rows = await getDb().select().from(accounts).orderBy(asc(accounts.id));
    return Response.json({ accounts: rows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取账号失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureAccountsTable();
    const payload = (await request.json()) as AccountPayload;
    const values = normalizeAccount(payload);
    if (await hasDuplicateName(values.name)) return Response.json({ error: "已经有同名账号" }, { status: 409 });
    const [account] = await getDb().insert(accounts).values(values).returning();
    return Response.json({ account }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "新增账号失败" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureAccountsTable();
    const payload = (await request.json()) as AccountPayload;
    const id = Number(payload.id);
    if (!Number.isInteger(id)) return Response.json({ error: "缺少账号编号" }, { status: 400 });

    const db = getDb();
    const [existing] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    if (!existing) return Response.json({ error: "账号不存在" }, { status: 404 });

    const values = normalizeAccount(payload, existing);
    if (await hasDuplicateName(values.name, id)) return Response.json({ error: "已经有同名账号" }, { status: 409 });
    const [account] = await db.update(accounts).set(values).where(eq(accounts.id, id)).returning();
    return Response.json({ account });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "更新账号失败" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureAccountsTable();
    const payload = (await request.json()) as AccountPayload;
    const id = Number(payload.id);
    const transferToAccountId = payload.transferToAccountId === undefined ? null : Number(payload.transferToAccountId);
    if (!Number.isInteger(id)) return Response.json({ error: "缺少账号编号" }, { status: 400 });

    const accountRows = await getDb().select().from(accounts).orderBy(asc(accounts.id));
    if (!accountRows.some((account) => account.id === id)) return Response.json({ error: "账号不存在" }, { status: 404 });
    if (accountRows.length <= 1) return Response.json({ error: "不能删除最后一个账号" }, { status: 409 });

    const contentTable = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'content_items'").first<{ name: string }>();
    const countRow = contentTable ? await env.DB.prepare("SELECT COUNT(*) AS total FROM content_items WHERE account_id = ?").bind(id).first<{ total: number }>() : null;
    const contentCount = Number(countRow?.total ?? 0);
    if (contentCount > 0) {
      const targetExists = Number.isInteger(transferToAccountId) && transferToAccountId !== id && accountRows.some((account) => account.id === transferToAccountId);
      if (!targetExists) {
        return Response.json({ error: `该账号还有 ${contentCount} 条内容，请先选择移交账号`, requiresTransfer: true, contentCount }, { status: 409 });
      }
    }

    const statements = [];
    if (contentCount > 0 && transferToAccountId !== null) {
      statements.push(env.DB.prepare("UPDATE content_items SET account_id = ?, updated_at = CURRENT_TIMESTAMP WHERE account_id = ?").bind(transferToAccountId, id));
    }
    statements.push(env.DB.prepare("DELETE FROM accounts WHERE id = ?").bind(id));
    await env.DB.batch(statements);

    return Response.json({ deletedId: id, transferredToAccountId: contentCount > 0 ? transferToAccountId : null, contentCount });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "删除账号失败" }, { status: 500 });
  }
}
