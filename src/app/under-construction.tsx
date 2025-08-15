import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function Under_Construction({ title }: { title: string }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <main className="grid min-h-full place-items-center bg-background px-6 py-24 sm:py-32 lg:px-8">
                <div className="text-center">
                    <p className="text-lg font-semibold text-primary">404</p>
                    <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-foreground sm:text-7xl">
                        Page under construction
                    </h1>
                    <p className="mt-6 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
                        {title} page is currently under construction. We are working hard to bring it back online.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Button asChild>
                            <Link href="/">
                                Go back home
                            </Link>
                        </Button>
                        <Link href="https://github.com/sakanaowo/sapo/issues/new" className="text-sm font-semibold text-foreground">
                            Contact support <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                </div>
            </main>
        </ThemeProvider>
    )
}