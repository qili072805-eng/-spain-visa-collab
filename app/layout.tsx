import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "西班牙签证协作台",
  description: "两人协作准备签证、行程、材料和费用"
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
