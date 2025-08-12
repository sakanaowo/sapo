import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function Example() {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <main className="grid min-h-full place-items-center bg-background px-6 py-24 sm:py-32 lg:px-8">
                <div className="text-center">
                    <p className="text-base font-semibold text-primary">404</p>
                    <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-foreground sm:text-7xl">
                        Page not found
                    </h1>
                    <p className="mt-6 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
                        Sorry, we couldn’t find the page you’re looking for.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Button asChild>
                            <Link href="/">
                                Go back home
                            </Link>
                        </Button>
                        <Link href="https://github.com/sakanaowo/sapo/issues" className="text-sm font-semibold text-foreground">
                            Contact support <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                </div>
            </main>
        </ThemeProvider>
    )
}