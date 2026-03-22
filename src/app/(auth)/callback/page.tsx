"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Handle the OAuth callback — Supabase exchanges the code automatically
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.push("/overview");
        router.refresh();
      }
    });
  }, [router]);

  return (
    <div className="text-center">
      <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
        Completing sign in...
      </p>
    </div>
  );
}
