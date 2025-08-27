import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/common/AuthProvider";
import { RealtimeProvider } from "@/components/common/RealtimeProvider";
import { AppShell } from "@/components/common/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Itineraries - Smart Daily Companion",
  description: "Execute your day efficiently with time-blocked schedules and smart checklists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <RealtimeProvider>
            <AppShell>
              {children}
            </AppShell>
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}