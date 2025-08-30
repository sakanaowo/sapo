"use client"

import React from "react";
import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
        isActive?: boolean
        items?: {
            title: string
            url: string
        }[]
    }[]
}) {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    // return (
    //     <SidebarGroup>
    //         <SidebarGroupLabel>Chung</SidebarGroupLabel>
    //         <SidebarMenu>
    //             {items.map((item) => (
    //                 item.items && item.items.length > 0 ? (
    //                     <Collapsible
    //                         key={item.title}
    //                         asChild
    //                         defaultOpen={item.isActive}
    //                         className="group/collapsible"
    //                     >
    //                         <SidebarMenuItem>
    //                             <CollapsibleTrigger asChild>
    //                                 <SidebarMenuButton tooltip={item.title}>
    //                                     {item.icon && <item.icon />}
    //                                     <span>{item.title}</span>
    //                                     <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
    //                                 </SidebarMenuButton>
    //                             </CollapsibleTrigger>
    //                             <CollapsibleContent>
    //                                 <SidebarMenuSub>
    //                                     {item.items?.map((subItem) => (
    //                                         <SidebarMenuSubItem key={subItem.title}>
    //                                             <SidebarMenuSubButton asChild>
    //                                                 <Link href={subItem.url}>
    //                                                     <span>{subItem.title}</span>
    //                                                 </Link>
    //                                             </SidebarMenuSubButton>
    //                                         </SidebarMenuSubItem>
    //                                     ))}
    //                                 </SidebarMenuSub>
    //                             </CollapsibleContent>
    //                         </SidebarMenuItem>
    //                     </Collapsible>
    //                 ) : (
    //                     <SidebarMenuItem key={item.title}>
    //                         <SidebarMenuButton tooltip={item.title} asChild>
    //                             <Link href={item.url}>
    //                                 {item.icon && <item.icon />}
    //                                 <span>{item.title}</span>
    //                             </Link>
    //                         </SidebarMenuButton>
    //                     </SidebarMenuItem>
    //                 )
    //             ))}
    //         </SidebarMenu>
    //     </SidebarGroup>
    // )

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const hasChildren = item.items && item.items.length > 0

                    // ----- 1) Mục không có submenu: giữ nguyên -----
                    if (!hasChildren) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    tooltip={item.title}
                                    asChild
                                    className="group hover:bg-sidebar-accent/80 transition-all duration-200"
                                >
                                    <Link href={item.url ?? "#"}>
                                        {item.icon && <item.icon className="group-hover:scale-110 transition-transform duration-200" />}
                                        <span className="font-medium">{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    }

                    // ----- 2) Khi sidebar COLLAPSE: dùng Popover mở sang phải -----
                    if (isCollapsed) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            className="group hover:bg-sidebar-accent/80 transition-all duration-200"
                                        >
                                            {item.icon && <item.icon className="group-hover:scale-110 transition-transform duration-200" />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto group-hover:translate-x-0.5 transition-transform duration-200" />
                                        </SidebarMenuButton>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        side="right"
                                        align="start"
                                        sideOffset={12}
                                        className="p-2 w-64 bg-background/95 backdrop-blur-sm border shadow-lg rounded-lg"
                                    >
                                        <div className="space-y-1">
                                            <div className="px-3 py-2 border-b border-border/50">
                                                <h4 className="font-medium text-sm text-foreground/90 flex items-center gap-2">
                                                    {item.icon && <item.icon className="size-4" />}
                                                    {item.title}
                                                </h4>
                                            </div>
                                            <div className="py-1">
                                                {item.items!.map((sub) => (
                                                    <Link
                                                        key={sub.title}
                                                        href={sub.url}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:translate-x-1 group"
                                                    >
                                                        <div className="relative w-4 h-4 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 group-hover:bg-primary transition-all duration-200 group-hover:opacity-0" />
                                                            <ChevronRight className="absolute size-3 text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-0 group-hover:translate-x-0.5" />
                                                        </div>
                                                        <span className="font-medium">{sub.title}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </SidebarMenuItem>
                        )
                    }

                    // ----- 3) Khi sidebar mở rộng: Collapsible như cũ -----
                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={item.isActive}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        className="group hover:bg-sidebar-accent/80 transition-all duration-200"
                                    >
                                        {item.icon && <item.icon className="group-hover:scale-110 transition-transform duration-200" />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-all duration-200 group-data-[state=open]/collapsible:rotate-90 group-hover:translate-x-0.5" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-200">
                                    <SidebarMenuSub className="ml-4 border-l-2 border-sidebar-border/50 pl-4">
                                        {item.items!.map((sub) => (
                                            <SidebarMenuSubItem key={sub.title}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    className="hover:bg-sidebar-accent/60 hover:translate-x-1 transition-all duration-200 group relative"
                                                >
                                                    <Link href={sub.url} className="flex items-center gap-2">
                                                        <div className="relative w-4 h-4 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-sidebar-accent-foreground/40 group-hover:bg-primary transition-all duration-200 group-hover:opacity-0" />
                                                            <ChevronRight className="absolute size-3 text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-0 group-hover:translate-x-0.5" />
                                                        </div>
                                                        <span className="font-medium">{sub.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )

}
