"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/overview";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
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
          AI Search Intelligence Platform
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
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
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
