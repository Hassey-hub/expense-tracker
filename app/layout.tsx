import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dépenses — Suivi personnel",
  description: "Gérez vos dépenses depuis le web ou Telegram",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
