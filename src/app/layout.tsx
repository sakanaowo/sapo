import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { currentUser } from "@/actions/user.action";
// import LoginPage from "./login/page";


export const metadata: Metadata = {
  title: "Not SAPO"
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar-open")?.value === "true";

  const user = await currentUser();
  console.log("Current User:", user);



  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar user={user} />
            <SidebarInset>
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </SidebarInset>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}