import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type AdminRole = "owner" | "editor" | "viewer";
export type StaffRole = "owner" | "editor";

export type AdminSession =
  | {
      mode: "supabase";
      email: string;
      role: AdminRole;
      userId: string;
    }
  | {
      mode: "token-fallback";
      email: null;
      role: "owner";
      userId: null;
    };

const roleRank: Record<AdminRole, number> = {
  viewer: 1,
  editor: 2,
  owner: 3
};

export function hasSupabaseAdminEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  if (!hasSupabaseAdminEnv()) {
    return {
      mode: "token-fallback",
      email: null,
      role: "owner",
      userId: null
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const staff = await readStaffMember(supabase, user.id);
  if (staff.state === "active") {
    return {
      mode: "supabase",
      email: staff.email ?? user.email ?? "",
      role: staff.role,
      userId: user.id
    };
  }
  if (staff.state === "inactive") return null;

  const { data: adminUser, error: adminError } = await supabase.from("admin_users").select("role,email").eq("id", user.id).maybeSingle();
  if (adminError || !adminUser?.role || !isAdminRole(adminUser.role)) return null;

  return {
    mode: "supabase",
    email: adminUser.email ?? user.email ?? "",
    role: adminUser.role,
    userId: user.id
  };
}

export async function requireAdmin(minRole: AdminRole = "viewer") {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (roleRank[admin.role] < roleRank[minRole]) redirect("/admin/forbidden");
  return admin;
}

function isAdminRole(value: unknown): value is AdminRole {
  return value === "owner" || value === "editor" || value === "viewer";
}


async function readStaffMember(supabase: any, userId: string): Promise<{ state: "active"; role: StaffRole; email: string | null } | { state: "inactive" } | { state: "missing" }> {
  const { data, error } = await supabase.from("staff_members").select("role,email,is_active").eq("user_id", userId).maybeSingle();
  if (error || !data?.role) return { state: "missing" };
  if (data.is_active === false) return { state: "inactive" };
  if (data.role !== "owner" && data.role !== "editor") return { state: "missing" };
  return { state: "active", role: data.role, email: data.email ?? null };
}
