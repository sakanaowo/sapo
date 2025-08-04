// src/store/sidebar-actions.ts
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';

export function useSidebarActions() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { user } = useUser();
    console.log("User from sidebar store:", user);
    const { signOut } = useClerk();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Navigation handlers
    const handleAccountClick = () => {
        if (isNavigating) return;
        setIsNavigating(true);
        router.push("/account");
        setTimeout(() => setIsNavigating(false), 500);
    };

    const handleLoginClick = () => {
        if (isNavigating) return;
        setIsNavigating(true);
        router.push("/login");
        setTimeout(() => setIsNavigating(false), 500);
    };

    // Simple logout handler
    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        try {
            if (!user) {
                router.push("/login");
                return;
            }

            await signOut();
            router.push("/login");
            toast.success('Đăng xuất thành công');
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Có lỗi xảy ra khi đăng xuất");
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Theme handlers
    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        toast.success(`Đã chuyển sang theme ${newTheme === 'light' ? 'sáng' : newTheme === 'dark' ? 'tối' : 'hệ thống'}`);
    };

    return {
        // Theme
        theme,
        handleThemeChange,

        // Navigation
        handleAccountClick,
        handleLoginClick,
        handleLogout,

        // State
        isLoggingOut,
        isNavigating,
    };
}