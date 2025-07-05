"use client"

import * as React from "react"
import {
    AudioWaveform,
    BarChart2,
    FileText,
    GalleryVerticalEnd,
    HomeIcon,
    Package,
    Settings,
    ShoppingCart,
    Store,
    Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
// import { TeamSwitcher } from "@/components/team-switcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"

// Component for Home button that acts as sidebar trigger
function HomeButton() {
    const { toggleSidebar } = useSidebar()

    return (
        <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={toggleSidebar}
        >
            <HomeIcon className="w-4 h-4" />
        </Button>
    )
}

// Sample data for sidebar
const data = {
    user: {
        name: "Admin User",
        email: "admin@example.com",
        avatar: "/avatars/admin.jpg",
    },
    teams: [
        {
            name: "Công ty ABC",
            logo: GalleryVerticalEnd,
            plan: "Doanh nghiệp",
        },
        {
            name: "Cửa hàng XYZ",
            logo: AudioWaveform,
            plan: "Cơ bản",
        },
    ],
    navMain: [
        {
            title: "Tổng quan",
            url: "/dashboard",
            icon: BarChart2,
            isActive: true,
        },
        {
            title: "Đơn hàng",
            url: "/orders",
            icon: ShoppingCart,
            items: [
                {
                    title: "Tạo đơn",
                    url: "/orders/create",
                },
                {
                    title: "Danh sách đơn hàng",
                    url: "/orders",
                },
            ],
        },
        {
            title: "Sản phẩm",
            url: "/products",
            icon: Package,
            items: [
                {
                    title: "Danh sách sản phẩm",
                    url: "/products",
                },
                {
                    title: "Quản lý kho",
                    url: "/products/inventory",
                },
                {
                    title: "Đặt hàng nhập",
                    url: "/products/purchase-orders",
                },
                {
                    title: "Nhập hàng",
                    url: "/products/receive",
                },
                {
                    title: "Kiểm hàng",
                    url: "/products/inspect",
                },
                {
                    title: "Chuyển hàng",
                    url: "/products/transfer",
                },
                {
                    title: "Nhà cung cấp",
                    url: "/products/suppliers",
                },
                {
                    title: "Điều chỉnh giá vốn",
                    url: "/products/cost-adjustments",
                },
            ],
        },
        {
            title: "Khách hàng",
            url: "/customers",
            icon: Users,
            items: [
                {
                    title: "Danh sách khách hàng",
                    url: "/customers",
                },
                {
                    title: "Nhóm khách hàng",
                    url: "/customers/groups",
                },
            ],
        },
        {
            title: "Báo cáo",
            url: "/reports",
            icon: FileText,
            items: [
                {
                    title: "Báo cáo bán hàng",
                    url: "/reports/sales",
                },
                {
                    title: "Báo cáo nhập hàng",
                    url: "/reports/purchases",
                },
                {
                    title: "Báo cáo kho",
                    url: "/reports/inventory",
                },
                {
                    title: "Báo cáo tài chính",
                    url: "/reports/financial",
                },
                {
                    title: "Báo cáo khách hàng",
                    url: "/reports/customers",
                },
            ],
        },
    ],
    projects: [
        {
            name: "POS",
            url: "/pos",
            icon: Store,
        },
        {
            name: "Cấu hình",
            url: "/settings",
            icon: Settings,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                {/* <TeamSwitcher teams={data.teams} /> */}
                <HomeButton />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavProjects projects={data.projects} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}