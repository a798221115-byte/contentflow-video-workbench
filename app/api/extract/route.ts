const VIDEO_HOSTS = ["weixin.qq.com", "channels.weixin.qq.com", "douyin.com", "bilibili.com", "youtube.com", "youtu.be", "xiaohongshu.com"];

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "0.0.0.0" || host === "::1" || host.endsWith(".local") || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /^169\.254\./.test(host);
}

function decodeHtml(value: string) {
  return value.replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;|&#34;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function htmlToText(html: string) {
  const main = html.match(/<(?:article|main)[^>]*>([\s\S]*?)<\/(?:article|main)>/i)?.[1] ?? html;
  return decodeHtml(main).replace(/<(script|style|svg|nav|footer|header|aside)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/blockquote)>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function polishScript(text: string) {
  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\s+([，。！？；：、])/g, "$1").replace(/([，。！？；：、])(?=[，。！？；：、])/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const sentences = normalized.split(/(?<=[。！？!?；])/).map(item => item.trim()).filter(Boolean);
  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 3) paragraphs.push(sentences.slice(index, index + 3).join(""));
  return paragraphs.join("\n\n") || normalized;
}

function pageTitle(html: string) {
  const raw = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  return decodeHtml(raw.replace(/<[^>]+>/g, "").trim()).slice(0, 100);
}

export async function POST(request: Request) {
  try {
    const { url: rawUrl } = await request.json() as { url?: string };
    if (!rawUrl) return Response.json({ error: "请先粘贴内容链接" }, { status: 400 });
    const url = new URL(rawUrl.trim());
    if (!["http:", "https:"].includes(url.protocol) || isPrivateHost(url.hostname)) return Response.json({ error: "只支持公开的 http/https 内容链接" }, { status: 400 });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, { signal: controller.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 ContentFlow/0.2", Accept: "text/html,application/xhtml+xml,text/plain" } });
    clearTimeout(timer);
    if (!response.ok) return Response.json({ error: `来源网站拒绝读取（${response.status}）` }, { status: 422 });
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/")) return Response.json({ error: "这个链接不是可直接读取的文字页面" }, { status: 422 });
    const html = (await response.text()).slice(0, 2_000_000);
    const original = htmlToText(html).slice(0, 30_000);
    const isVideo = VIDEO_HOSTS.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)) || /video|视频/i.test(contentType + html.slice(0, 5000));
    if (original.length < 80 || (isVideo && original.length < 300)) return Response.json({ kind: isVideo ? "video" : "article", title: pageTitle(html), status: "needs_transcript", error: isVideo ? "已识别为视频链接，但页面没有可读取的字幕。需要接入视频下载与语音转写服务后才能生成完整口播稿。" : "页面可见正文太少，可能需要登录或专用抓取服务（如 Firecrawl）。" }, { status: 422 });
    return Response.json({ kind: isVideo ? "video" : "article", title: pageTitle(html), status: "ready", original, script: polishScript(original), notes: "已完成基础清理、标点规范和分段。错别字与语义级润色将在接入 AI 校对后进一步增强。" });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "读取超时，请稍后重试" : "无法读取这个链接，请检查链接是否公开可访问";
    return Response.json({ error: message }, { status: 422 });
  }
}
