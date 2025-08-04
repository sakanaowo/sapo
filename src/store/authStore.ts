// src/store/authStore.ts
import { create } from 'zustand';
import { syncUser } from '@/actions/user.action';

interface AuthUser {
    adminId: string;
    username: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface AuthStore {
    authUser: AuthUser | null;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    authUser: null,
    isLoading: false,
    checkAuth: async () => {
        const { isLoading } = get();
        if (isLoading) return; // Prevent concurrent calls

        set({ isLoading: true });
        try {
            const user = await syncUser();
            set({ authUser: user });
        } catch (error) {
            console.error('Error syncing user:', error);
            set({ authUser: null });
        } finally {
            set({ isLoading: false });
        }
    },
    clearAuth: () => {
        set({ authUser: null, isLoading: false });
    }
}))