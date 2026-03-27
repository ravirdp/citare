"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/onboarding";

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <Card
      className="border"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <CardHeader className="text-center pb-2">
        <h1
          className="text-[length:var(--text-xl)] font-bold tracking-[0.05em] uppercase"
          style={{ color: "var(--text-primary)" }}
        >
          C<span style={{ color: "var(--accent-primary)" }}>i</span>TARE
        </h1>
        <p
          className="mt-1 text-[length:var(--text-sm)]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Create your account
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google OAuth */}
        <Button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="w-full font-medium"
          style={{
            background: "#fff",
            color: "#1f2937",
            border: "1px solid var(--border-default)",
            fontSize: "var(--text-sm)",
          }}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {googleLoading ? "Redirecting..." : "Sign up with Google"}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
          <span
            className="text-[length:var(--text-xs)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            or sign up with email
          </span>
          <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}
            >
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="border"
              style={{
                background: "var(--bg-tertiary)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="email"
              style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="border"
              style={{
                background: "var(--bg-tertiary)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="password"
              style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="border"
              style={{
                background: "var(--bg-tertiary)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}
            >
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="border"
              style={{
                background: "var(--bg-tertiary)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {error && (
            <p
              className="text-[length:var(--text-sm)]"
              style={{ color: "var(--status-red)" }}
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-medium"
            style={{
              background: "var(--accent-primary)",
              color: "var(--text-inverse)",
              fontSize: "var(--text-sm)",
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p
          className="text-center text-[length:var(--text-sm)]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Already have an account?{" "}
          <a href="/login" style={{ color: "var(--accent-primary)" }}>
            Log in
          </a>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
