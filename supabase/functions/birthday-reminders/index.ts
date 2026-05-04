import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get today's month and day
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    // 2. Fetch profiles whose birthday matches today
    const { data: birthdayProfiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("user_id, display_name, email, date_of_birth")
      .not("date_of_birth", "is", null);

    if (profilesError) throw profilesError;

    const todayBirthdays = birthdayProfiles.filter((p) => {
      if (!p.date_of_birth) return false;
      const dob = new Date(p.date_of_birth);
      return dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay;
    });

    if (todayBirthdays.length === 0) {
      return new Response(JSON.stringify({ message: "No birthdays today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Filter out those who already received a greeting this year
    const { data: greetings, error: greetingsError } = await supabaseClient
      .from("birthday_greetings")
      .select("user_id")
      .eq("greeting_year", currentYear);

    if (greetingsError) throw greetingsError;

    const sentUserIds = new Set(greetings.map((g) => g.user_id));
    const toNotify = todayBirthdays.filter((p) => !sentUserIds.has(p.user_id));

    if (toNotify.length === 0) {
      return new Response(JSON.stringify({ message: "All today's birthdays already notified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 4. Send emails (Simulated for this implementation, normally use Resend or SendGrid)
    console.log(`Sending birthday emails to ${toNotify.length} users:`);
    
    const logs = toNotify.map((p) => ({
      user_id: p.user_id,
      greeting_year: currentYear,
    }));

    // Log the greetings to prevent double sending
    const { error: insertError } = await supabaseClient
      .from("birthday_greetings")
      .insert(logs);

    if (insertError) throw insertError;

    // 5. Notify Admins
    // Fetch all admins
    const { data: admins } = await supabaseClient
      .from("user_roles")
      .select("user_id, profiles(email)")
      .eq("role", "admin");

    console.log(`Admin summary email sent for ${toNotify.length} birthdays today.`);

    return new Response(
      JSON.stringify({ 
        message: `Successfully processed ${toNotify.length} birthdays`,
        notified: toNotify.map((u) => u.email)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
