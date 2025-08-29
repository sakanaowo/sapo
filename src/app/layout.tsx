import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

import { ClerkProvider } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Not SAPO",
  icons: "/shopping-bag.png",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <ClerkProvider>
      <html lang="vi" suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <main className="flex-1 overflow-auto">
                  {children}
                </main>
              </SidebarInset>
              <Toaster
                position="bottom-center"
                toastOptions={{
                  duration: 3000,
                  removeDelay: 1000,
                  style: {
                    borderRadius: "10px",
                    background: "var(--popover)",
                    border: "1px solid green",
                  },
                  error: {
                    style: {
                      borderRadius: "10px",
                      border: "1px solid var(--destructive)",
                    },
                  }
                }}
              />
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}