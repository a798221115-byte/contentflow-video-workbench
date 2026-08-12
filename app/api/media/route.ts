import { env } from "cloudflare:workers";

const allowedTypes: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp",
  "audio/wav": "wav", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a",
};

export async function POST(request: Request) {
  try {
    if (!env.MEDIA) return Response.json({ error: "媒体存储尚未连接" }, { status: 503 });
    const form = await request.formData();
    const file = form.get("file");
    const purpose = String(form.get("purpose") ?? "media").replace(/[^a-z0-9_-]/gi, "");
    const contentId = Number(form.get("contentId"));
    if (!(file instanceof File) || !Number.isFinite(contentId)) return Response.json({ error: "请选择文件和对应内容" }, { status: 400 });
    const extension = allowedTypes[file.type];
    if (!extension) return Response.json({ error: "只支持 PNG、JPG、WebP、WAV、MP3 或 M4A" }, { status: 415 });
    if (file.size > 25 * 1024 * 1024) return Response.json({ error: "文件不能超过 25MB" }, { status: 413 });
    const key = `content/${contentId}/${purpose}-${crypto.randomUUID()}.${extension}`;
    await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { originalName: file.name } });
    return Response.json({ url: `/api/media?key=${encodeURIComponent(key)}`, name: file.name, type: file.type });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "上传失败" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !key.startsWith("content/") || !env.MEDIA) return new Response("Not found", { status: 404 });
  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(object.body, { headers });
}
