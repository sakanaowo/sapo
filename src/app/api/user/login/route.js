import { login } from '@/actions/user.action'

export async function POST(request) {
    try {
        // Parse request body
        const body = await request.json()
        const { username, password } = body

        // Validate required fields
        if (!username || !password) {
            return Response.json(
                {
                    success: false,
                    message: 'Username và password là bắt buộc'
                },
                { status: 400 }
            )
        }

        // Call login action - sửa cách gọi function
        const result = await login(username, password)
        console.log('Login result:', result)

        if (result.success) {
            return Response.json(
                {
                    success: true,
                    message: 'Đăng nhập thành công',
                    user: result.user
                },
                { status: 200 }
            )
        } else {
            return Response.json(
                {
                    success: false,
                    message: result.message || 'Đăng nhập thất bại'
                },
                { status: 401 }
            )
        }
    } catch (error) {
        console.error('Login API error:', error)
        return Response.json(
            {
                success: false,
                message: 'Lỗi server nội bộ'
            },
            { status: 500 }
        )
    }
}