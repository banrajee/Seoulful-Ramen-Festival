import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seoulful Ramen Festival Menu",
  description: "The independent Seoulful Ramen festival menu."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

