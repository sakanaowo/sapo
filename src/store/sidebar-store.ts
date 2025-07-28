import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { logout } from '@/actions/user.action';

export interface User {
    adminId: string;
    username: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface UseSidebarStoreProps {
    user: User | null;
}

export function useSidebarStore({ user }: UseSidebarStoreProps) {
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    // State for UI interactions
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Navigation handlers
    const handleAccountClick = useCallback(() => {
        if (isNavigating) return;
        setIsNavigating(true);
        router.push("/account");
        // Reset after navigation
        setTimeout(() => setIsNavigating(false), 500);
    }, [router, isNavigating]);

    const handleLoginClick = useCallback(() => {
        if (isNavigating) return;
        setIsNavigating(true);
        router.push("/login");
        setTimeout(() => setIsNavigating(false), 500);
    }, [router, isNavigating]);

    // Logout handler
    const handleLogout = useCallback(async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        try {
            const result = await logout();
            if (result.success) {
                toast.success(result.message || 'Đăng xuất thành công');
                router.push("/login");
            } else {
                toast.error(result.message || 'Có lỗi xảy ra khi đăng xuất');
            }
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Có lỗi xảy ra khi đăng xuất");
        } finally {
            setIsLoggingOut(false);
        }
    }, [router, isLoggingOut]);

    // Theme handlers
    const handleThemeChange = useCallback((newTheme: string) => {
        setTheme(newTheme);
        toast.success(`Đã chuyển sang theme ${newTheme === 'light' ? 'sáng' : newTheme === 'dark' ? 'tối' : 'hệ thống'}`);
    }, [setTheme]);

    // User info getters
    const getUserDisplayName = useCallback(() => {
        if (!user) return "Unknown User";
        return user.username || "Unknown User";
    }, [user]);

    const getUserEmail = useCallback(() => {
        if (!user) return "";
        return user.email || "";
    }, [user]);

    const getUserAvatar = useCallback(() => {
        if (!user) return '/unauth-avatar.jpg';
        return user.avatar || '/avatar.svg';
    }, [user]);

    const getUserInitials = useCallback(() => {
        if (!user) return "CN";
        if (user.firstName && user.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        if (user.username) {
            return user.username.charAt(0).toUpperCase();
        }
        return "CN";
    }, [user]);

    // Authentication state
    const isAuthenticated = useCallback(() => {
        return user !== null && user.adminId !== undefined;
    }, [user]);

    // Theme helpers
    const getThemeIcon = useCallback(() => {
        switch (theme) {
            case 'light':
                return 'Sun';
            case 'dark':
                return 'Moon';
            default:
                return 'Monitor';
        }
    }, [theme]);

    const getThemeDisplayName = useCallback((themeValue: string) => {
        switch (themeValue) {
            case 'light':
                return 'Sáng';
            case 'dark':
                return 'Tối';
            case 'system':
                return 'Hệ thống';
            default:
                return themeValue;
        }
    }, []);

    // Menu items configuration
    const getMenuItems = useCallback(() => {
        const items = [];

        // Theme submenu
        items.push({
            type: 'submenu',
            key: 'theme',
            label: 'Theme',
            icon: getThemeIcon(),
            items: [
                {
                    key: 'light',
                    label: 'Light',
                    icon: 'Sun',
                    active: theme === 'light',
                    action: () => handleThemeChange('light')
                },
                {
                    key: 'dark',
                    label: 'Dark',
                    icon: 'Moon',
                    active: theme === 'dark',
                    action: () => handleThemeChange('dark')
                },
                {
                    key: 'system',
                    label: 'System',
                    icon: 'Monitor',
                    active: theme === 'system',
                    action: () => handleThemeChange('system')
                }
            ]
        });

        // Settings
        items.push({
            type: 'item',
            key: 'settings',
            label: 'Settings',
            icon: 'Settings',
            action: () => toast.info('Settings coming soon...')
        });

        return items;
    }, [theme, getThemeIcon, handleThemeChange]);

    const getAccountItems = useCallback(() => {
        if (!isAuthenticated()) {
            return [];
        }

        return [
            {
                type: 'item',
                key: 'account',
                label: 'Account',
                icon: 'BadgeCheck',
                action: handleAccountClick,
                disabled: isNavigating
            }
        ];
    }, [isAuthenticated, handleAccountClick, isNavigating]);

    const getAuthItems = useCallback(() => {
        if (isAuthenticated()) {
            return [
                {
                    type: 'item',
                    key: 'logout',
                    label: 'Log out',
                    icon: 'LogOut',
                    action: handleLogout,
                    disabled: isLoggingOut,
                    loading: isLoggingOut
                }
            ];
        } else {
            return [
                {
                    type: 'item',
                    key: 'login',
                    label: 'Login',
                    icon: 'LogIn',
                    action: handleLoginClick,
                    disabled: isNavigating
                }
            ];
        }
    }, [isAuthenticated, handleLogout, handleLoginClick, isLoggingOut, isNavigating]);

    return {
        // User data
        user,
        getUserDisplayName,
        getUserEmail,
        getUserAvatar,
        getUserInitials,
        isAuthenticated,

        // Theme
        theme,
        getThemeIcon,
        getThemeDisplayName,
        handleThemeChange,

        // Navigation
        handleAccountClick,
        handleLoginClick,
        handleLogout,

        // State
        isLoggingOut,
        isNavigating,

        // Menu configuration
        getMenuItems,
        getAccountItems,
        getAuthItems,
    };
}

export type SidebarStore = ReturnType<typeof useSidebarStore>;