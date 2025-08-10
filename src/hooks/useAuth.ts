"use client";

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
    const { user: clerkUser, isLoaded, isSignedIn } = useUser();
    const { authUser, checkAuth, clearAuth, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoaded) return; // Wait for Clerk to load
        if (isSignedIn && clerkUser && !authUser && !isLoading) {
            checkAuth();
        } else if (!isSignedIn) {
            clearAuth();
        }
    }, [isLoaded, isSignedIn, clerkUser, checkAuth, clearAuth, authUser, isLoading]);

    return {
        user: authUser,
        isAuthenticated: isSignedIn && !!authUser,
        isLoading: !isLoaded || isLoading,
        clerkUser,
    };
}
