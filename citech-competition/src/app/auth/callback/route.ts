import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Admins skip registration — redirect straight to admin
        const { data: isAdmin } = await supabase.rpc("comp_is_admin");
        if (isAdmin) {
          return NextResponse.redirect(`${origin}/admin`);
        }

        // Check if the user already completed registration
        const { data: participant } = await supabase
          .from("comp_participants")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (participant) {
          return NextResponse.redirect(`${origin}/dashboard`);
        } else {
          return NextResponse.redirect(`${origin}/register`);
        }
      }
    }
  }

  // Something went wrong — redirect to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
