import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Profile — Citare",
};

/**
 * Minimal public layout for presence pages.
 * No auth, no dashboard shell. Lightweight.
 */
export default function PresenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Powered by{" "}
        <a
          href="https://citare.ai"
          className="text-gray-500 hover:text-gray-700"
        >
          Citare
        </a>
      </footer>
    </div>
  );
}
