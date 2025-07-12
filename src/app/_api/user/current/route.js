import { currentUser } from '@/actions/user.action';

export async function GET() {
    try {
        // Call currentUser action to get user details
        const user = await currentUser();

        if (user) {
            return Response.json(
                {
                    success: true,
                    user: user
                },
                { status: 200 }
            );
        } else {
            return Response.json(
                {
                    success: false,
                    message: 'User not found'
                },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('Current User API error:', error);
        return Response.json(
            {
                success: false,
                message: 'Internal server error'
            },
            { status: 500 }
        );
    }
}