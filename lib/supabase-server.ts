import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ServerSupabaseClientOptions = {
  pkceCodeVerifier?: string;
};

export async function createServerSupabaseClient(options: ServerSupabaseClientOptions = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  const codeVerifierCookieName = getCodeVerifierCookieName(url);

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        const allCookies = cookieStore.getAll();
        if (!options.pkceCodeVerifier || allCookies.some((cookie) => cookie.name === codeVerifierCookieName)) {
          return allCookies;
        }
        return [
          ...allCookies,
          {
            name: codeVerifierCookieName,
            value: JSON.stringify(options.pkceCodeVerifier)
          }
        ];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }
    }
  });
}

function getCodeVerifierCookieName(supabaseUrl: string) {
  return `${getSupabaseAuthStorageKey(supabaseUrl)}-code-verifier`;
}

export function getSupabaseAuthStorageKey(supabaseUrl: string) {
  const url = new URL(supabaseUrl);
  return `sb-${url.hostname.split(".")[0]}-auth-token`;
}

export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
