"use client";

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
    const { user: clerkUser, isLoaded, isSignedIn } = useUser();
    const { authUser, checkAuth, clearAuth, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoaded) return; // Wait for Clerk to load

        if (isSignedIn && clerkUser) {
            // User is signed in, sync with our database
            checkAuth();
        } else {
            // User is not signed in, clear our auth state
            clearAuth();
        }
    }, [isLoaded, isSignedIn, clerkUser, checkAuth, clearAuth]);

    return {
        user: authUser,
        isAuthenticated: isSignedIn && !!authUser,
        isLoading: !isLoaded || isLoading,
        clerkUser,
    };
}
