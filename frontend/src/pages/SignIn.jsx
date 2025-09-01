import GoogleSignInButton from "@/components/google-sign-in-button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router";

export default function SignInPage() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen flex flex-col items-center justify-between bg-background">
      <div className="w-full ">
        <header className="w-full border-b border-border">
          <div className="mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-md bg-primary/10 ring-1 ring-primary/20"
                aria-hidden
              />
              <span className="font-semibold">Finance Tracker</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user && (
                <Link
                  to="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  View dashboard
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-5xl px-4 py-10 md:py-16">
          <div className="flex flex-col gap-6">
            <h1 className="text-pretty text-3xl font-semibold leading-tight md:text-4xl">
              Track your money with clarity
            </h1>
            <p className="text-muted-foreground">
              Securely connect and manage your finances in one place. Sign in
              with Google to get started in seconds.
            </p>

            <div className="flex flex-col gap-3">
              <GoogleSignInButton />
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link
                  to="#"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  to="#"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-muted-foreground ">
        © {new Date().getFullYear()} Finance Tracker
      </footer>
    </main>
  );
}
