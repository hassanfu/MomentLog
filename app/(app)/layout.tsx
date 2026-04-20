import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <AppNav user={user} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
