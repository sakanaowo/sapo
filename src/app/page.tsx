import { currentUser } from "@/actions/user.action";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic'; // Ensure this page is always server-rendered

export default async function Home() {
  try {
    const user = await currentUser();

    // console.log("Home page user check:", !!user);

    // Nếu user đã đăng nhập, redirect đến dashboard
    if (user && user.adminId) {
      // console.log("User authenticated, redirecting to dashboard");
      return redirect("/dashboard");
    }

    // Nếu chưa đăng nhập, redirect đến login
    // console.log("No user found, redirecting to login");
    return redirect("/login");

  } catch (error) {
    console.error("Home page authentication error:", error);
    return redirect("/login?error=auth_failed");
  }
}