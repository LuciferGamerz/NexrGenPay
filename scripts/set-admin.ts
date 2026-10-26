import { loadEnvConfig } from "@next/env";
import { createAdminClient } from "../lib/supabase/admin";

loadEnvConfig(process.cwd());

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run admin:set -- user@example.com");
  process.exitCode = 1;
} else {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("set_user_admin", { p_email: email });
    if (error) throw error;
    if (!data) throw new Error("No verified account exists with that email address.");
    console.log(`Promoted ${email} to ADMIN.`);
  } catch (error) {
    console.error("Could not promote admin account:", error);
    process.exitCode = 1;
  }
}
