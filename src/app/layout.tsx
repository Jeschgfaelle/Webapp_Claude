import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freelancer Finance Cockpit",
  description:
    "Financial management dashboard for Swiss freelancers – income, expenses, taxes, cashflow forecasting and runway tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
