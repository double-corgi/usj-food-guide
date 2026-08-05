"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type StaffPublicConfig = {
  staffEnabled: boolean;
  supabaseUrl: string;
  supabasePublishableKey: string;
  apiBaseUrl: string;
};

type MemoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type StaffSecureSessionPlugin = {
  authenticate?: (options?: { reason?: string }) => Promise<void>;
  has?: () => Promise<{ value?: boolean }>;
  get: () => Promise<{ value?: string | null }>;
  set: (options: { value: string }) => Promise<void>;
  remove: () => Promise<void>;
};

type WindowWithStaffSecureSession = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    Plugins?: {
      StaffSecureSession?: StaffSecureSessionPlugin;
    };
  };
};

let client: SupabaseClient<Database> | null | undefined;
let clientConfigKey: string | null = null;
let staffPublicConfig: StaffPublicConfig | null | undefined;
let staffPublicConfigPromise: Promise<StaffPublicConfig | null> | null = null;
const memory = new Map<string, string>();

const memoryStorage: MemoryStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => {
    memory.set(key, value);
  },
  removeItem: (key) => {
    memory.delete(key);
  }
};

function staffSessionStorage(): MemoryStorage {
  if (typeof window === "undefined") return memoryStorage;
  try {
    const storage = window.sessionStorage;
    const testKey = "__unicolle_staff_session_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return memoryStorage;
  }
}

function staffSecureSessionPlugin() {
  if (typeof window === "undefined") return null;
  const nativeWindow = window as WindowWithStaffSecureSession;
  if (!nativeWindow.Capacitor?.isNativePlatform?.()) return null;
  return nativeWindow.Capacitor.Plugins?.StaffSecureSession ?? null;
}

function normalizeStaffPublicConfig(value: Partial<StaffPublicConfig> | null | undefined): StaffPublicConfig | null {
  const staffEnabled = value?.staffEnabled === true;
  const supabaseUrl = String(value?.supabaseUrl ?? "").trim();
  const supabasePublishableKey = String(value?.supabasePublishableKey ?? "").trim();
  const apiBaseUrl = String(value?.apiBaseUrl ?? "").trim();

  if (!staffEnabled) return null;
  if (!supabaseUrl.startsWith("https://")) return null;
  if (!supabasePublishableKey) return null;
  if (!apiBaseUrl.startsWith("https://")) return null;

  return { staffEnabled, supabaseUrl, supabasePublishableKey, apiBaseUrl };
}

function envStaffPublicConfig() {
  return normalizeStaffPublicConfig({
    staffEnabled: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://unicolle.vercel.app"
  });
}

async function loadStaffPublicConfig() {
  if (staffPublicConfig !== undefined) return staffPublicConfig;
  if (staffPublicConfigPromise) return staffPublicConfigPromise;

  staffPublicConfigPromise = (async () => {
    const fromEnv = envStaffPublicConfig();
    if (fromEnv) {
      staffPublicConfig = fromEnv;
      return fromEnv;
    }

    if (typeof window === "undefined" || typeof window.fetch !== "function") {
      staffPublicConfig = null;
      return null;
    }

    try {
      const response = await window.fetch("/unicolle-ios-public-config.json", { cache: "no-store" });
      if (!response.ok) {
        staffPublicConfig = null;
        return null;
      }
      const json = await response.json();
      staffPublicConfig = normalizeStaffPublicConfig(json);
      return staffPublicConfig;
    } catch {
      staffPublicConfig = null;
      return null;
    }
  })();

  return staffPublicConfigPromise;
}

export function getStaffApiBaseUrl(config?: StaffPublicConfig | null) {
  return (config ?? staffPublicConfig ?? envStaffPublicConfig())?.apiBaseUrl ?? "https://unicolle.vercel.app";
}

export function resolveStaffApiUrl(path: string, config?: StaffPublicConfig | null) {
  const apiBaseUrl = getStaffApiBaseUrl(config);
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  return new URL(normalizedPath, apiBaseUrl).toString();
}

export function createStaffSupabaseClient(config?: StaffPublicConfig | null) {
  const resolvedConfig = config ?? envStaffPublicConfig();
  const url = resolvedConfig?.supabaseUrl;
  const anonKey = resolvedConfig?.supabasePublishableKey;
  if (!url || !anonKey || !resolvedConfig?.staffEnabled) {
    client = null;
    clientConfigKey = null;
    return null;
  }

  const nextConfigKey = url + ":" + anonKey.slice(0, 16);
  if (client && clientConfigKey === nextConfigKey) return client;

  client = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage: staffSessionStorage()
    }
  });
  clientConfigKey = nextConfigKey;
  return client;
}

export async function createStaffSupabaseClientAsync() {
  const config = await loadStaffPublicConfig();
  return createStaffSupabaseClient(config);
}

export type StaffAuthDebugSnapshot = {
  currentLevel: string;
  nextLevel: string;
  verifiedTotpFactors: number;
  hasSession: boolean;
  accessTokenAal: string | null;
  storage: "keychain+sessionStorage" | "sessionStorage" | "memory";
  lastAuthEvent: string;
};

type MfaVerifySession = {
  access_token?: string;
  refresh_token?: string;
};

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  if (typeof window === "undefined" || typeof window.atob !== "function") return "";
  return window.atob(padded);
}

export function readJwtAalClaim(token: string | null | undefined) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const claims = JSON.parse(base64UrlDecode(payload));
    return typeof claims.aal === "string" ? claims.aal : null;
  } catch {
    return null;
  }
}

export function staffAuthStorageName() {
  if (staffSecureSessionPlugin()) return "keychain+sessionStorage" as const;
  if (typeof window === "undefined") return "memory" as const;
  try {
    const testKey = "__unicolle_staff_storage_name_test__";
    window.sessionStorage.setItem(testKey, "1");
    window.sessionStorage.removeItem(testKey);
    return "sessionStorage" as const;
  } catch {
    return "memory" as const;
  }
}

export async function restoreStaffSessionFromSecureStorage(supabase: SupabaseClient<Database>) {
  const plugin = staffSecureSessionPlugin();
  if (!plugin) return false;
  try {
    const result = await plugin.get();
    if (!result.value) return false;
    const parsed = JSON.parse(result.value) as MfaVerifySession;
    if (!parsed.access_token || !parsed.refresh_token) return false;
    const setResult = await supabase.auth.setSession({ access_token: parsed.access_token, refresh_token: parsed.refresh_token });
    return !setResult.error;
  } catch {
    return false;
  }
}

export async function hasStaffSessionInSecureStorage() {
  const plugin = staffSecureSessionPlugin();
  if (!plugin) return false;
  try {
    if (plugin.has) return Boolean((await plugin.has()).value);
    return Boolean((await plugin.get()).value);
  } catch {
    return false;
  }
}

export async function authenticateStaffDeviceOwner() {
  const plugin = staffSecureSessionPlugin();
  if (!plugin) return true;
  try {
    if (!plugin.authenticate) return false;
    await plugin.authenticate({ reason: "運営管理機能を開くために本人確認を行います。" });
    return true;
  } catch {
    return false;
  }
}

export async function persistStaffSessionToSecureStorage(supabase: SupabaseClient<Database>) {
  const plugin = staffSecureSessionPlugin();
  if (!plugin) return;
  try {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.access_token || !session.refresh_token) return;
    await plugin.set({
      value: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      })
    });
  } catch {
    // Keychain persistence is a convenience layer; the active session still lives in memory/sessionStorage.
  }
}

export async function clearStaffSessionFromSecureStorage() {
  const plugin = staffSecureSessionPlugin();
  if (!plugin) return;
  try {
    await plugin.remove();
  } catch {
    // Logout should continue even if the native secure-store cleanup reports a transient error.
  }
}

export async function getAuthenticatorAssuranceLevel(supabase: SupabaseClient<Database>) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const result = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(token);
  if (result.error) return { currentLevel: "aal1", nextLevel: "aal1" };
  return {
    currentLevel: result.data?.currentLevel ?? "aal1",
    nextLevel: result.data?.nextLevel ?? "aal1"
  };
}

export async function syncVerifiedStaffMfaSession(supabase: SupabaseClient<Database>, data: MfaVerifySession | null | undefined) {
  if (!data?.access_token || !data.refresh_token) return { ok: false, currentLevel: "aal1", accessTokenAal: null };

  const setResult = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
  if (setResult.error) return { ok: false, currentLevel: "aal1", accessTokenAal: null };

  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(token);
  if (assurance.error) return { ok: false, currentLevel: "aal1", accessTokenAal: readJwtAalClaim(token) };

  const ok = assurance.data?.currentLevel === "aal2" && readJwtAalClaim(token) === "aal2";
  if (ok) await persistStaffSessionToSecureStorage(supabase);

  return {
    ok,
    currentLevel: assurance.data?.currentLevel ?? "aal1",
    accessTokenAal: readJwtAalClaim(token)
  };
}

export async function getStaffAuthDebugSnapshot(supabase: SupabaseClient<Database>, lastAuthEvent = "unknown"): Promise<StaffAuthDebugSnapshot> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(token);
  const factors = await supabase.auth.mfa.listFactors();
  return {
    currentLevel: assurance.data?.currentLevel ?? "aal1",
    nextLevel: assurance.data?.nextLevel ?? "aal1",
    verifiedTotpFactors: factors.data?.totp?.filter((factor) => factor.status === "verified").length ?? 0,
    hasSession: Boolean(session.data.session),
    accessTokenAal: readJwtAalClaim(token),
    storage: staffAuthStorageName(),
    lastAuthEvent
  };
}
