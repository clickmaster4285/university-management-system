import { Outlet, Link, useRouter } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

export function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center gradient-mesh px-4">
      <div className="max-w-md text-center glass rounded-2xl p-10">
        <h1 className="text-7xl font-bold gradient-brand-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md gradient-brand text-white px-4 py-2 text-sm font-medium">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ErrorComponent({ error, reset }: { error: Error; reset?: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center glass rounded-2xl p-8">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset?.();
            }}
            className="inline-flex items-center justify-center rounded-md gradient-brand text-white px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default RootLayout;
