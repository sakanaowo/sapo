
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
    const params = await searchParams;
    const user = await currentUser();
    if (user) redirect(params?.redirect ?? '/dashboard');


    return !user ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
            <div className="w-full max-w-md">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">NOT SAPO</CardTitle>
                        <CardDescription>
                            Đăng nhập vào tài khoản của bạn
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SignInButton mode="modal">
                            <Button className='w-full' variant="default">
                                Login
                            </Button>
                        </SignInButton>
                        <SignUpButton mode='modal'>
                            <Button className='w-full mt-2' variant="outline">
                                Sign Up
                            </Button>
                        </SignUpButton>
                    </CardContent>
                </Card>
            </div>
        </div>
    ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
            <div className="w-full max-w-md">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Chào mừng trở lại</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/">
                                Go back home
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}