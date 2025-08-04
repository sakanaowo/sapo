"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function AuthSync() {
    const { user, isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        console.log("AuthSync - User:", user);
        console.log("AuthSync - IsAuthenticated:", isAuthenticated);
        console.log("AuthSync - IsLoading:", isLoading);
    }, [user, isAuthenticated, isLoading]);

    return null; // This component doesn't render anything
}
