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
import { useSidebarStore, type User } from "@/store/sidebar-store"

export function NavUser({ user }: { user: User | null }) {
    const { isMobile } = useSidebar();
    const {
        getUserDisplayName,
        getUserEmail,
        getUserAvatar,
        getUserInitials,
        isAuthenticated,
        theme,
        handleThemeChange,
        handleAccountClick,
        handleLogout,
        handleLoginClick,
        isLoggingOut,
        isNavigating,
    } = useSidebarStore({ user });

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
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
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