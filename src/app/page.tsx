// "use client"
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// export const dynamic = 'force-dynamic';

export default async function Home() {
  const auth = await currentUser();
  // console.log("Home page auth user:", auth);

  // Nếu user đã đăng nhập, redirect đến dashboard
  if (auth) {
    // console.log("User authenticated, redirecting to dashboard");
    return redirect("/dashboard");
  }

  // Nếu chưa đăng nhập, redirect đến login
  // console.log("No authenticated user, redirecting to login");
  return redirect("/login");
}