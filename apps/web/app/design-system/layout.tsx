import type { Metadata } from "next";

import "@/styles/tokens.css";
import "./preview.css";

export const metadata: Metadata = {
  title: "Renderly — Design system preview / Demo",
  robots: { index: false, follow: false },
};

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return <div className="renderly-theme">{children}</div>;
}
