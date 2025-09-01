import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleClick() {
    try {
      setLoading(true);

      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        ux_mode: "popup",
        // redirect_uri: "http://localhost:5173/dashboard",
        callback: async (res) => {
          if (res.error) {
            toast.error("Google sign-in failed");
            setLoading(false);
            return;
          }

          try {
            const result = await loginWithGoogle(res.code);
            if (result.success) {
              toast.success("Google sign-in successful");
              navigate("/dashboard");
            } else {
              toast.error("Google sign-in failed");
            }
          } catch (err) {
            console.error("Google sign-in failed", err);
            toast.error("Google sign-in failed");
          } finally {
            setLoading(false);
          }
        },
      });

      client.requestCode();
    } catch (err) {
      console.error("Google sign-in failed", err);
      toast.error("Google sign-in failed");
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant="outline"
      className="h-11 w-full justify-center gap-2 border-border bg-card text-foreground transition hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2"
      aria-label="Sign in with Google"
      aria-busy={loading}
    >
      <GoogleIcon className="h-5 w-5" />
      {loading ? "Redirecting..." : "Sign in with Google"}
    </Button>
  );
}

function GoogleIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="24px"
      height="24px"
      {...props}
    >
      <path
        fill="#4285F4"
        d="M24 9.5c3.54 0 6.07 1.54 7.48 2.84l5.5-5.5C33.63 3.9 29.18 2 24 2 14.82 2 7.08 7.58 3.65 15.27l6.85 5.32C12.3 13.62 17.64 9.5 24 9.5z"
      />
      <path
        fill="#34A853"
        d="M46.5 24.5c0-1.64-.15-3.2-.43-4.7H24v9.02h12.7c-.55 2.83-2.2 5.22-4.7 6.82l7.35 5.7C43.59 37.19 46.5 31.36 46.5 24.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.91a13.9 13.9 0 0 1 0-9.82L3.65 13.77a22.01 22.01 0 0 0 0 20.46l6.85-5.32z"
      />
      <path
        fill="#EA4335"
        d="M24 46c5.9 0 10.84-1.96 14.45-5.31l-7.35-5.7C29.3 36.6 26.83 37.5 24 37.5c-6.36 0-11.7-4.12-13.5-9.73l-6.85 5.32C7.08 40.42 14.82 46 24 46z"
      />
    </svg>
  );
}
