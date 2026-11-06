import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Renderly — AI Visual Creation Studio",
  description: "Create, iterate, and organize visuals with an open-source AI agent."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
