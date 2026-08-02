import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "ThinkFlow", description: "Deliberate pattern-recognition practice" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
