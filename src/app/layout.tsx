import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glyph",
  description: "Music generation with provenance and rights infrastructure."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <main className="min-h-dvh">{children}</main>
      </body>
    </html>
  );
}
