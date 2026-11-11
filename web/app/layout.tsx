import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BFit Pulse — Know before you go",
  description: "A student-built crowd reporting pilot for Bruin Fitness Center. Find your moment to move.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
