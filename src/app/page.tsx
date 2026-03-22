export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1
          className="text-[length:var(--text-2xl)] font-bold tracking-[0.05em] uppercase"
          style={{ color: "var(--text-primary)" }}
        >
          C
          <span style={{ color: "var(--accent-primary)" }}>i</span>
          TARE
        </h1>
        <p
          className="mt-4 text-[length:var(--text-base)]"
          style={{ color: "var(--text-secondary)" }}
        >
          AI Search Intelligence Platform
        </p>
        <div
          className="mt-8 inline-block rounded-lg px-4 py-2 text-[length:var(--text-sm)]"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-body)",
          }}
        >
          Phase 0 — Project scaffolding complete
        </div>
      </div>
    </main>
  );
}
