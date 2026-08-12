import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContentFlow｜视频号矩阵工作台",
  description: "把选题、脚本、拍摄、剪辑、发布、数据回收与复盘放进同一个内容经营系统。",
  openGraph: {
    title: "ContentFlow｜视频号矩阵工作台",
    description: "从选题到复盘，让每条内容都有下一步。",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "ContentFlow 视频号矩阵工作台" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
