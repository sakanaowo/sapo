"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/actions/user.action";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        const response = await logout();
        if (response.success) {
            router.push("/login");
        } else {
            alert(response.message);
        }
    }

    return (
        <Button variant="outline" onClick={handleLogout}>
            Logout
        </Button>
    );
}