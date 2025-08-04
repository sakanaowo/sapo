"use client";

import { useClerk, useUser } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function LogoutButton() {
    const { signOut } = useClerk();
    const { user } = useUser();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (!user) {
            router.push("/login");
            return;
        }

        setIsLoggingOut(true);

        try {
            await signOut();
            toast.success('Đăng xuất thành công');
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Có lỗi xảy ra khi đăng xuất");
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="justify-start gap-2 px-2 w-full"
        >
            {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <LogOut className="h-4 w-4" />
            )}
            {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </Button>
    );
}