"use server"

import prisma from "@/lib/prisma";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

// Thêm logging để debug
export async function currentUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('notsapo-auth-token')?.value;

        // console.log('🔍 Debug currentUser:');
        // console.log('- Token exists:', !!token);
        // console.log('- Token value:', token ? `${token.substring(0, 20)}...` : 'null');

        if (!token) {
            // console.log('❌ No token found');
            return null;
        }

        // Thêm validation cho JWT_SECRET
        if (!process.env.JWT_SECRET) {
            // console.error('❌ JWT_SECRET is not defined');
            return null;
        }

        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
        // console.log('✅ Token decoded:', { adminId: payload.adminId });

        const user = await prisma.admin.findUnique({
            where: {
                adminId: BigInt(payload.adminId as string)
            }
        });

        // console.log('👤 User found:', !!user);
        return user ? {
            ...user,
            adminId: user.adminId.toString()
        } : null;
    } catch (error) {
        console.error('❌ Error in currentUser:', error);
        return null;
    }
}

export async function login(username: string, password: string) {
    try {
        const admin = await prisma.admin.findFirst({
            where: {
                username: username,
            },
        });
        // console.log("Admin found:", admin);

        if (!admin) {
            return {
                success: false,
                message: "User not found",
            };
        }

        // const isValidPassword = await bcrypt.compare(password, admin.password);
        const isValidPassword = password === admin.password; // For simplicity, assuming password is stored in plain text
        if (!isValidPassword) {
            return {
                success: false,
                message: "Invalid password",
            };
        }

        const token = await new SignJWT({ adminId: admin.adminId.toString() })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('365d')
            .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

        // console.log("🔐 Token created:", token ? "✅" : "❌");

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set("notsapo-auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        // console.log("🍪 Cookie set successfully");

        return {
            success: true,
            message: "Đăng nhập thành công"
        };
    } catch (error) {
        console.error("Login error:", error);
        return {
            success: false,
            message: "Có lỗi xảy ra trong quá trình đăng nhập"
        };
    }
}

export async function logout() {
    try {
        (await cookies()).delete("notsapo-auth-token");
        return {
            success: true,
            message: "Đăng xuất thành công"
        };
    } catch (error) {
        console.error("Error during logout:", error);
        return {
            success: false,
            message: "Có lỗi xảy ra trong quá trình đăng xuất"
        };
    }
}