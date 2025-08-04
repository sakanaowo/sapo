// "use client"

// import {
//     BadgeCheck,
//     Check,
//     ChevronsUpDown,
//     LogIn,
//     LogOut,
//     Monitor,
//     Moon,
//     Settings,
//     Sun,
// } from "lucide-react"

// import {
//     Avatar,
//     AvatarFallback,
//     AvatarImage,
// } from "@/components/ui/avatar"
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuGroup,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuSub,
//     DropdownMenuSubContent,
//     DropdownMenuSubTrigger,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import {
//     SidebarMenu,
//     SidebarMenuButton,
//     SidebarMenuItem,
//     useSidebar,
// } from "@/components/ui/sidebar"
// import { useTheme } from "next-themes"
// import { useRouter } from "next/navigation"
// import { useState } from "react"
// import { toast } from "sonner"

// type User = {
//     adminId: string;
//     username: string;
//     email: string | null;
//     name: string | null;
//     avatar: string | null;
//     createdAt: Date;
//     updatedAt: Date;
// } | null;

// export function NavUser({ user }: { user?: User }) {
//     const { isMobile } = useSidebar();
//     const { theme, setTheme } = useTheme();
//     const router = useRouter();
//     const [isLoggingOut, setIsLoggingOut] = useState(false);
//     const [isNavigating, setIsNavigating] = useState(false);

//     const getUserDisplayName = () => {
//         if (!user) return "Guest";
//         return user.username || "Unknown User";
//     };

//     const getUserEmail = () => {
//         if (!user) return "";
//         return user.email || "";
//     };

//     const getUserAvatar = () => {
//         if (!user) return '/unauth-avatar.jpg';
//         return user.avatar || '/avatar.svg';
//     };

//     const getUserInitials = () => {
//         if (!user) return "G";
//         if (user.name) {
//             return user.name.charAt(0).toUpperCase();
//         }
//         if (user.username) {
//             return user.username.charAt(0).toUpperCase();
//         }
//         return "U";
//     };

//     const handleThemeChange = (newTheme: string) => {
//         setTheme(newTheme);
//         toast.success(`Đã chuyển sang theme ${newTheme === 'light' ? 'sáng' : newTheme === 'dark' ? 'tối' : 'hệ thống'}`);
//     };

//     const handleAccountClick = () => {
//         if (isNavigating) return;
//         setIsNavigating(true);
//         router.push("/account");
//         setTimeout(() => setIsNavigating(false), 500);
//     };

//     const handleLoginClick = () => {
//         if (isNavigating) return;
//         setIsNavigating(true);
//         router.push("/login");
//         setTimeout(() => setIsNavigating(false), 500);
//     };

//     const handleLogout = async () => {
//         if (isLoggingOut) return;
//         setIsLoggingOut(true);
//         try {
//             // Simple logout - just redirect to login

//             toast.success('Đăng xuất thành công');
//             router.push("/login");
//         } catch (error) {
//             console.error("Logout error:", error);
//             toast.error("Có lỗi xảy ra khi đăng xuất");
//         } finally {
//             setIsLoggingOut(false);
//         }
//     };

//     const getThemeIcon = (themeValue: string) => {
//         switch (themeValue) {
//             case 'light':
//                 return <Sun className="h-4 w-4" />;
//             case 'dark':
//                 return <Moon className="h-4 w-4" />;
//             default:
//                 return <Monitor className="h-4 w-4" />;
//         }
//     };

//     const isAuthenticated = () => {
//         return user !== null && user?.adminId !== undefined;
//     };

//     return (
//         <SidebarMenu>
//             <SidebarMenuItem>
//                 <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                         <SidebarMenuButton
//                             size="lg"
//                             className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
//                         >
//                             <Avatar className="h-8 w-8 rounded-lg">
//                                 <AvatarImage
//                                     src={getUserAvatar()}
//                                     alt={getUserDisplayName()}
//                                 />
//                                 <AvatarFallback className="rounded-lg">
//                                     {getUserInitials()}
//                                 </AvatarFallback>
//                             </Avatar>
//                             <div className="grid flex-1 text-left text-sm leading-tight">
//                                 <span className="truncate font-medium">
//                                     {getUserDisplayName()}
//                                 </span>
//                                 <span className="truncate text-xs">
//                                     {getUserEmail()}
//                                 </span>
//                             </div>
//                             <ChevronsUpDown className="ml-auto size-4" />
//                         </SidebarMenuButton>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent
//                         className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
//                         side={isMobile ? "bottom" : "right"}
//                         align="end"
//                         sideOffset={4}
//                     >
//                         <DropdownMenuLabel className="p-0 font-normal">
//                             <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
//                                 <Avatar className="h-8 w-8 rounded-lg">
//                                     <AvatarImage
//                                         src={getUserAvatar()}
//                                         alt={getUserDisplayName()}
//                                     />
//                                     <AvatarFallback className="rounded-lg">
//                                         {getUserInitials()}
//                                     </AvatarFallback>
//                                 </Avatar>
//                                 <div className="grid flex-1 text-left text-sm leading-tight">
//                                     <span className="truncate font-medium">
//                                         {getUserDisplayName()}
//                                     </span>
//                                     <span className="truncate text-xs">
//                                         {getUserEmail()}
//                                     </span>
//                                 </div>
//                             </div>
//                         </DropdownMenuLabel>
//                         <DropdownMenuSeparator />

//                         <DropdownMenuGroup>
//                             <DropdownMenuSub>
//                                 <DropdownMenuSubTrigger>
//                                     {getThemeIcon(theme || 'light')}
//                                     <span className="ml-2">Theme</span>
//                                 </DropdownMenuSubTrigger>
//                                 <DropdownMenuSubContent>
//                                     <DropdownMenuItem onClick={() => handleThemeChange("light")}>
//                                         <Sun className="h-4 w-4" />
//                                         <span>Light</span>
//                                         {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
//                                     </DropdownMenuItem>
//                                     <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
//                                         <Moon className="h-4 w-4" />
//                                         <span>Dark</span>
//                                         {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
//                                     </DropdownMenuItem>
//                                     <DropdownMenuItem onClick={() => handleThemeChange("system")}>
//                                         <Monitor className="h-4 w-4" />
//                                         <span>System</span>
//                                         {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
//                                     </DropdownMenuItem>
//                                 </DropdownMenuSubContent>
//                             </DropdownMenuSub>

//                             <DropdownMenuItem>
//                                 <Settings className="h-4 w-4" />
//                                 Settings
//                             </DropdownMenuItem>
//                         </DropdownMenuGroup>

//                         <DropdownMenuSeparator />

//                         {isAuthenticated() && (
//                             <DropdownMenuGroup>
//                                 <DropdownMenuItem
//                                     onClick={handleAccountClick}
//                                     disabled={isNavigating}
//                                 >
//                                     <BadgeCheck className="h-4 w-4" />
//                                     Account
//                                 </DropdownMenuItem>
//                             </DropdownMenuGroup>
//                         )}

//                         <DropdownMenuSeparator />

//                         {isAuthenticated() ? (
//                             <DropdownMenuItem
//                                 onClick={handleLogout}
//                                 disabled={isLoggingOut}
//                             >
//                                 <LogOut className="h-4 w-4" />
//                                 {isLoggingOut ? 'Đang đăng xuất...' : 'Log out'}
//                             </DropdownMenuItem>
//                         ) : (
//                             <DropdownMenuItem
//                                 onClick={handleLoginClick}
//                                 disabled={isNavigating}
//                             >
//                                 <LogIn className="h-4 w-4" />
//                                 Login
//                             </DropdownMenuItem>
//                         )}
//                     </DropdownMenuContent>
//                 </DropdownMenu>
//             </SidebarMenuItem>
//         </SidebarMenu>
//     );
// }
"use client"

import {
    BadgeCheck,
    Check,
    ChevronsUpDown,
    LogIn,
    LogOut,
    Monitor,
    Moon,
    Settings,
    Sun,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useSidebarActions } from "@/store/sidebar-store"

type User = {
    adminId: string;
    username: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
} | null;

export function NavUser({ user }: { user?: User }) {
    const { isMobile } = useSidebar();

    const {
        theme,
        handleThemeChange,
        handleAccountClick,
        handleLoginClick,
        handleLogout,
        isLoggingOut,
        isNavigating,
    } = useSidebarActions();

    const getUserDisplayName = () => {
        if (!user) return "Guest";
        return user.username || "Unknown User";
    };

    const getUserEmail = () => {
        if (!user) return "";
        return user.email || "";
    };

    const getUserAvatar = () => {
        if (!user) return '/unauth-avatar.jpg';
        return user.avatar || '/avatar.svg';
    };

    const getUserInitials = () => {
        if (!user) return "G";
        if (user.name) {
            return user.name.charAt(0).toUpperCase();
        }
        if (user.username) {
            return user.username.charAt(0).toUpperCase();
        }
        return "U";
    };

    const getThemeIcon = (themeValue: string) => {
        switch (themeValue) {
            case 'light':
                return <Sun className="h-4 w-4" />;
            case 'dark':
                return <Moon className="h-4 w-4" />;
            default:
                return <Monitor className="h-4 w-4" />;
        }
    };

    const isAuthenticated = () => {
        return user !== null && user?.adminId !== undefined;
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={getUserAvatar()}
                                    alt={getUserDisplayName()}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {getUserInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {getUserDisplayName()}
                                </span>
                                <span className="truncate text-xs">
                                    {getUserEmail()}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={getUserAvatar()}
                                        alt={getUserDisplayName()}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {getUserDisplayName()}
                                    </span>
                                    <span className="truncate text-xs">
                                        {getUserEmail()}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    {getThemeIcon(theme || 'light')}
                                    <span className="ml-2">Theme</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                                        <Sun className="h-4 w-4" />
                                        <span>Light</span>
                                        {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                                        <Moon className="h-4 w-4" />
                                        <span>Dark</span>
                                        {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                                        <Monitor className="h-4 w-4" />
                                        <span>System</span>
                                        {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuItem>
                                <Settings className="h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        {isAuthenticated() && (
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    onClick={handleAccountClick}
                                    disabled={isNavigating}
                                >
                                    <BadgeCheck className="h-4 w-4" />
                                    Account
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        )}

                        <DropdownMenuSeparator />

                        {isAuthenticated() ? (
                            <DropdownMenuItem
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                <LogOut className="h-4 w-4" />
                                {isLoggingOut ? 'Đang đăng xuất...' : 'Log out'}
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                onClick={handleLoginClick}
                                disabled={isNavigating}
                            >
                                <LogIn className="h-4 w-4" />
                                Login
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}