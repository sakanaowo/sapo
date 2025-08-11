"use server";

import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function syncUser() {
    try {
        const { userId } = await auth();
        const clerkUser = await currentUser();

        if (!userId || !clerkUser) {
            return null;
        }

        // console.log('Syncing user:', userId);

        // Check existing user
        const existingUser = await prisma.admin.findUnique({
            where: { clerkId: userId }
        });

        if (existingUser) {
            // console.log('User found:', existingUser.username);
            return {
                ...existingUser,
                adminId: existingUser.adminId.toString(),
            };
        }

        // Create new user
        const newUser = await prisma.admin.create({
            data: {
                clerkId: userId,
                username: clerkUser.username ?? clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] ?? `user_${userId.slice(-8)}`,
                email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
                name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
                avatar: clerkUser.imageUrl ?? null,
            }
        });

        // console.log('New user created:', newUser.username);
        return {
            ...newUser,
            adminId: newUser.adminId.toString(),
        };

    } catch (error) {
        console.error('Error syncing user from Clerk:', error);
        return null;
    }
}

export async function getUserById(clerkId: string) {
    try {
        const user = await prisma.admin.findUnique({
            where: { clerkId }
        });

        if (!user) return null;

        return {
            ...user,
            adminId: user.adminId.toString(),
        };
    } catch (error) {
        console.error('Error getting user by ID:', error);
        return null;
    }
}

export async function updateUserProfile(data: {
    name?: string;
    email?: string;
    avatar?: string;
}) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, message: 'Not authenticated' };

        const user = await prisma.admin.update({
            where: { clerkId: userId },
            data: {
                ...data,
                updatedAt: new Date(),
            }
        });

        return {
            success: true,
            user: {
                ...user,
                adminId: user.adminId.toString(),
            }
        };
    } catch (error) {
        console.error('Error updating user profile:', error);
        return { success: false, message: 'Update failed' };
    }
}
