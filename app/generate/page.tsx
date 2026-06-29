import { GeneratorForm } from "@/components/generator-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GeneratePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-canvas px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <GeneratorForm isLoggedIn={Boolean(user)} />
      </div>
    </main>
  );
}
