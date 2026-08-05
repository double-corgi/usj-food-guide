"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ListChecks, MapPinned, Search, Store, Tags, Users } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authenticateStaffDeviceOwner, clearStaffSessionFromSecureStorage, createStaffSupabaseClientAsync, getAuthenticatorAssuranceLevel, getStaffAuthDebugSnapshot, hasStaffSessionInSecureStorage, persistStaffSessionToSecureStorage, readJwtAalClaim, resolveStaffApiUrl, restoreStaffSessionFromSecureStorage, syncVerifiedStaffMfaSession, type StaffAuthDebugSnapshot } from "@/lib/staff-auth-client";
import { STAFF_MFA_REQUIRED_MESSAGE, isStaffAal2Snapshot, visibleStaffMessage } from "@/lib/staff-auth-state";
import type { Database } from "@/types/database";

type WindowWithCapacitor = Window & { Capacitor?: { isNativePlatform?: () => boolean } };

function isNativeShell() {
  if (typeof window === "undefined") return false;
  return Boolean((window as WindowWithCapacitor).Capacitor?.isNativePlatform?.());
}

function staffApiUrl(path: string) {
  return resolveStaffApiUrl(path);
}

function resetStaffViewportState() {
  if (typeof window === "undefined") return;
  const active = document.activeElement;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) {
    active.blur();
  }
  const root = document.documentElement;
  const body = document.body;
  root.scrollLeft = 0;
  body.scrollLeft = 0;
  if (document.scrollingElement instanceof HTMLElement) {
    document.scrollingElement.scrollLeft = 0;
  }
  window.scrollTo({ top: Math.max(window.scrollY, root.scrollTop, body.scrollTop), left: 0, behavior: "auto" });
  window.requestAnimationFrame(() => {
    root.scrollLeft = 0;
    body.scrollLeft = 0;
    if (document.scrollingElement instanceof HTMLElement) {
      document.scrollingElement.scrollLeft = 0;
    }
    const laterActive = document.activeElement;
    if (laterActive instanceof HTMLInputElement || laterActive instanceof HTMLTextAreaElement || laterActive instanceof HTMLSelectElement) {
      laterActive.blur();
    }
  });
}


type StaffMember = Database["public"]["Tables"]["staff_members"]["Row"];
type StaffInviteMode = "email" | "link";
type InviteLinkState = { url: string; email: string; linkType?: string | null };
type ManualFood = Database["public"]["Tables"]["manual_foods"]["Row"];
type FoodMembership = Database["public"]["Tables"]["food_collection_memberships"]["Row"];
type PublicationMetadata = Database["public"]["Tables"]["food_publication_metadata"]["Row"];
type LoadState = "checking" | "login" | "forbidden" | "mfa" | "ready" | "unconfigured";
type TabKey = "foods" | "stores" | "areas" | "collections" | "operators" | "audit";
type SourceKind = "manual" | "generated";
type SaleStatus = "active" | "paused" | "ended" | "unknown";
type SalePeriodKind = "always" | "limited" | "ended";
type PublicState = "published" | "draft";
type ShopType = "restaurant" | "cart" | "wagon" | "unknown";
type BusinessStatus = "active" | "paused" | "ended" | "unknown";

type GeneratedFood = {
  id: string;
  name: string;
  nameEn: string | null;
  price: number | null;
  areaId: string | null;
  areaName: string;
  shopId: string | null;
  shopName: string;
  category: string;
  categoryTags?: string[] | null;
  saleStatus: SaleStatus;
  status: string;
  publicState: PublicState;
  reviewStatus: string;
  hidden: boolean;
  deletedAt: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string | null;
};

type GeneratedShop = {
  id: string;
  name: string;
  areaId: string | null;
  areaName: string;
  shopType: ShopType;
  isActive: boolean;
  officialUrl: string | null;
};

type AreaOption = { id: string; name: string; sortOrder: number };
type FoodOverride = Record<string, any>;
type StaffShop = Record<string, any>;
type FoodStoreLink = Record<string, any>;
type AuditLog = Record<string, any>;
type StaffArea = Record<string, any>;
type CollectionRow = Record<string, any>;
type StaffDashboard = { publicFoodCount: number; onSaleFoodCount: number; unpublishedFoodCount: number; areaCount: number; shopCount: number; activeSeasonalCollectionCount: number; updatedAt: string };

type ManagedFood = {
  sourceKind: SourceKind;
  id: string;
  name: string;
  nameEn: string;
  price: number | null;
  areaId: string | null;
  areaName: string;
  shopId: string | null;
  shopName: string;
  category: string;
  categoryTags: string[];
  saleStatus: SaleStatus;
  publicState: PublicState;
  reviewStatus: "draft" | "pending" | "approved" | "rejected";
  hidden: boolean;
  deletedAt: string | null;
  imageUrl: string;
  sourceUrl: string;
  startDate: string;
  endDate: string;
  adminNotes: string;
  updatedAt: string | null;
  version: number | null;
};

type FoodForm = {
  sourceKind: SourceKind;
  id: string;
  name: string;
  nameEn: string;
  price: string;
  areaId: string;
  areaName: string;
  shopId: string;
  shopName: string;
  category: string;
  saleStatus: SaleStatus;
  salePeriodKind: SalePeriodKind;
  publicState: PublicState;
  hidden: boolean;
  startDate: string;
  endDate: string;
  imageUrl: string;
  sourceUrl: string;
  adminNotes: string;
  summer2026: boolean;
  collectionIds: string[];
  reviewStatus: "draft" | "pending" | "approved" | "rejected";
  version: number | null;
  selectedStoreIds: string[];
  primaryStoreId: string;
};

type StoreForm = {
  sourceKind: "generated" | "staff";
  id: string;
  name: string;
  nameEn: string;
  areaId: string;
  areaName: string;
  shopType: ShopType;
  description: string;
  imageUrl: string;
  publicState: PublicState;
  businessStatus: BusinessStatus;
  hidden: boolean;
  sortOrder: string;
  officialUrl: string;
  version: number | null;
};

type AreaForm = {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  imageUrl: string;
  publicState: PublicState;
  hidden: boolean;
  sortOrder: string;
  version: number | null;
};

type CollectionForm = {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  imageUrl: string;
  publicState: PublicState;
  hidden: boolean;
  sortOrder: string;
  startsOn: string;
  endsOn: string;
  seasonType: string;
  accentColor: string;
  isFeatured: boolean;
  selectedFoodIds: string[];
  version: number | null;
};

const emptyFoodForm: FoodForm = {
  sourceKind: "manual", id: "", name: "", nameEn: "", price: "", areaId: "", areaName: "", shopId: "", shopName: "", category: "", saleStatus: "active", salePeriodKind: "always", publicState: "draft", hidden: true, startDate: "", endDate: "", imageUrl: "", sourceUrl: "manual-staff-app", adminNotes: "", summer2026: false, collectionIds: [], reviewStatus: "pending", version: null, selectedStoreIds: [], primaryStoreId: ""
};
const emptyStoreForm: StoreForm = { sourceKind: "staff", id: "", name: "", nameEn: "", areaId: "", areaName: "", shopType: "unknown", description: "", imageUrl: "", publicState: "draft", businessStatus: "unknown", hidden: true, sortOrder: "1000", officialUrl: "", version: null };
const emptyAreaForm: AreaForm = { id: "", name: "", nameEn: "", description: "", imageUrl: "", publicState: "draft", hidden: true, sortOrder: "1000", version: null };
const emptyCollectionForm: CollectionForm = { id: "", name: "", nameEn: "", description: "", imageUrl: "", publicState: "draft", hidden: true, sortOrder: "1000", startsOn: "", endsOn: "", seasonType: "manual", accentColor: "#0b66c3", isFeatured: true, selectedFoodIds: [], version: null };
const categories = ["churro", "popcorn", "drink", "dessert", "burger", "pizza", "chicken", "rice", "curry", "noodle", "snack", "kids", "seasonal", "set", "unknown"] as const;
const saleStatuses: Array<[SaleStatus, string]> = [["active", "販売中"], ["paused", "休止中"], ["ended", "終了"], ["unknown", "確認中"]];
const shopTypes: Array<[ShopType, string]> = [["restaurant", "レストラン"], ["cart", "フードカート"], ["wagon", "ドリンクスタンド"], ["unknown", "その他"]];
const businessStatuses: Array<[BusinessStatus, string]> = [["active", "販売中"], ["paused", "休止中"], ["ended", "終了"], ["unknown", "確認中"]];
const categoryLabels: Record<string, string> = {
  churro: "チュリトス",
  popcorn: "ポップコーン",
  drink: "ドリンク",
  dessert: "スイーツ",
  burger: "バーガー",
  pizza: "ピザ",
  chicken: "チキン",
  rice: "ライス",
  curry: "カレー",
  noodle: "麺類",
  snack: "食べ歩き",
  kids: "キッズ",
  seasonal: "季節限定",
  set: "セット",
  cart: "カート",
  nintendo: "ニンテンドー",
  minion: "ミニオン",
  harry_potter: "ハリーポッター",
  unknown: "その他"
};
const productKindChoices = [
  ["churro", "チュリトス"],
  ["popcorn", "ポップコーン"],
  ["drink", "ドリンク"],
  ["snack", "食べ歩き"],
  ["cart", "カート"],
  ["seasonal", "季節限定"],
  ["nintendo", "ニンテンドー"],
  ["minion", "ミニオン"],
  ["harry_potter", "ハリーポッター"],
  ["unknown", "その他"]
] as const;
const productKindValues = new Set(productKindChoices.map(([value]) => value));
const productKindLabelToValue = new Map<string, string>(productKindChoices.map(([value, label]) => [label, value]));
const productKindToFoodCategory: Record<string, string> = { churro: "churro", popcorn: "popcorn", drink: "drink", snack: "snack", cart: "snack", seasonal: "seasonal", nintendo: "kids", minion: "kids", harry_potter: "kids", unknown: "unknown" };
function categoryLabel(value: string) { return categoryLabels[value] ?? "その他"; }
function normalizeProductKind(value: string | null | undefined, tags?: unknown): string {
  const candidates = Array.isArray(tags) ? tags.map((item) => String(item ?? "")) : [];
  candidates.push(String(value ?? ""));
  const normalized = candidates.map((item) => productKindLabelToValue.get(item) ?? item).filter((item) => productKindValues.has(item as typeof productKindChoices[number][0]));
  const known = normalized.find((item) => item !== "unknown");
  return known ?? normalized[0] ?? "";
}
function foodCategoryFromProductKind(value: string) { return productKindToFoodCategory[value] ?? "unknown"; }
function salePeriodKindFromFood(food: { saleStatus: SaleStatus; startDate?: string | null; endDate?: string | null }): SalePeriodKind {
  if (food.saleStatus === "ended") return "ended";
  if (food.startDate || food.endDate) return "limited";
  return "always";
}
function saleStatusLabel(value: SaleStatus) { return saleStatuses.find(([key]) => key === value)?.[1] ?? "確認中"; }
function businessStatusLabel(value: BusinessStatus) { return businessStatuses.find(([key]) => key === value)?.[1] ?? "確認中"; }
function shopTypeLabel(value: ShopType) { return shopTypes.find(([key]) => key === value)?.[1] ?? "その他"; }
function roleLabel(value: StaffMember["role"]) { return value === "owner" ? "管理者" : "編集できる人"; }
function safePublicNote(value: string) {
  const text = String(value ?? "");
  return /summer-2026|auto-review|pending|公式存在確認済み|管理画面確認待ち|manual-admin|generated|override|staff|supabase|内部/i.test(text) ? "" : text;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "未更新";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未更新" : date.toLocaleString("ja-JP");
}

type StaffEditorKind = "foods" | "stores" | "areas" | "collections";
type StaffConsoleProps = { editorKind?: StaffEditorKind; editorId?: string | null; mode?: "list" | "new" | "edit" };
const staffTabKeys: TabKey[] = ["foods", "stores", "areas", "collections", "operators", "audit"];

function initialStaffTab(editorKind?: StaffEditorKind): TabKey {
  if (editorKind) return editorKind;
  if (typeof window === "undefined") return "foods";
  const tab = new URLSearchParams(window.location.search).get("tab") as TabKey | null;
  return tab && staffTabKeys.includes(tab) ? tab : "foods";
}

function initialStaffMessage() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("notice") ?? "";
}

class StaffCatalogError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
  }
}

function classifyStaffCatalogError(error: unknown) {
  if (error instanceof StaffCatalogError) return { api: "staff.catalog", status: error.status, code: error.code };
  const code = error instanceof Error ? error.message : "network_or_unknown";
  return { api: "staff.catalog", status: 0, code };
}

export function StaffConsole({ editorKind, editorId = null, mode = "list" }: StaffConsoleProps = {}) {
  const router = useRouter();
  const [supabase, setSupabase] = useState<SupabaseClient<Database> | null | undefined>(undefined);
  const [state, setState] = useState<LoadState>("checking");
  const [tab, setTab] = useState<TabKey>(() => initialStaffTab(editorKind));
  const [message, setMessage] = useState(initialStaffMessage);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [manualFoods, setManualFoods] = useState<ManualFood[]>([]);
  const [generatedFoods, setGeneratedFoods] = useState<GeneratedFood[]>([]);
  const [overrides, setOverrides] = useState<FoodOverride[]>([]);
  const [memberships, setMemberships] = useState<FoodMembership[]>([]);
  const [metadata, setMetadata] = useState<PublicationMetadata[]>([]);
  const [generatedShops, setGeneratedShops] = useState<GeneratedShop[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [staffShops, setStaffShops] = useState<StaffShop[]>([]);
  const [foodStoreLinks, setFoodStoreLinks] = useState<FoodStoreLink[]>([]);
  const [staffAreas, setStaffAreas] = useState<StaffArea[]>([]);
  const [collectionRows, setCollectionRows] = useState<CollectionRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dashboard, setDashboard] = useState<StaffDashboard | null>(null);
  const [catalogLoadError, setCatalogLoadError] = useState("");
  const [catalogLoadErrorCode, setCatalogLoadErrorCode] = useState("");
  const [staffRows, setStaffRows] = useState<StaffMember[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [storeQuery, setStoreQuery] = useState("");
  const [storeStatusFilter, setStoreStatusFilter] = useState("all");
  const [storeLinkQuery, setStoreLinkQuery] = useState("");
  const [areaQuery, setAreaQuery] = useState("");
  const [areaStatusFilter, setAreaStatusFilter] = useState("all");
  const [collectionQuery, setCollectionQuery] = useState("");
  const [collectionStatusFilter, setCollectionStatusFilter] = useState("all");
  const [collectionFoodQuery, setCollectionFoodQuery] = useState("");
  const [foodDisplayLimit, setFoodDisplayLimit] = useState(30);
  const [form, setForm] = useState<FoodForm>(emptyFoodForm);
  const [storeForm, setStoreForm] = useState<StoreForm>(emptyStoreForm);
  const [areaForm, setAreaForm] = useState<AreaForm>(emptyAreaForm);
  const [collectionForm, setCollectionForm] = useState<CollectionForm>(emptyCollectionForm);
  const [uploading, setUploading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffMember["role"]>("editor");
  const [inviteLink, setInviteLink] = useState<InviteLinkState | null>(null);
  const [inviteBusyMode, setInviteBusyMode] = useState<StaffInviteMode | null>(null);
  const [authDebug, setAuthDebug] = useState<StaffAuthDebugSnapshot | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [nativeEditor, setNativeEditor] = useState<{ kind: StaffEditorKind; id: string | null; mode: "new" | "edit" } | null>(null);
  const [lastDeviceAuthAt, setLastDeviceAuthAt] = useState(0);
  const activeEditorKind = editorKind ?? nativeEditor?.kind;
  const activeEditorId = editorKind ? editorId : nativeEditor?.id ?? null;
  const activeEditorMode = editorKind ? mode : nativeEditor?.mode ?? "list";
  const isEditorRoute = Boolean(activeEditorKind);
  const editorTitle = activeEditorKind === "foods" ? "商品" : activeEditorKind === "stores" ? "店舗" : activeEditorKind === "areas" ? "エリア" : activeEditorKind === "collections" ? "期間限定特集" : "";


  useEffect(() => {
    let cancelled = false;
    void createStaffSupabaseClientAsync().then((client) => {
      if (!cancelled) setSupabase(client);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    resetStaffViewportState();
    return () => {
      resetStaffViewportState();
    };
  }, []);

  async function updateAuthDebug(lastAuthEvent = "manual") {
    if (!supabase) return null;
    const snapshot = await getStaffAuthDebugSnapshot(supabase, lastAuthEvent);
    setAuthDebug(snapshot);
    if (isStaffAal2Snapshot(snapshot)) {
      setMessage((current) => current === STAFF_MFA_REQUIRED_MESSAGE ? "" : current);
    }
    return snapshot;
  }

  async function refresh(options: { requireDeviceAuth?: boolean } = {}) {
    if (!supabase) return;
    const requireDeviceAuth = options.requireDeviceAuth !== false;
    setMessage("");
    if (requireDeviceAuth && await hasStaffSessionInSecureStorage()) {
      const shouldAuthenticate = Date.now() - lastDeviceAuthAt > 5 * 60 * 1000;
      if (shouldAuthenticate) {
        const authenticated = await authenticateStaffDeviceOwner();
        if (!authenticated) {
          await supabase.auth.signOut();
          await clearStaffSessionFromSecureStorage();
          setState("login");
          setMessage("本人確認を完了できませんでした。もう一度ログインしてください。");
          return;
        }
        setLastDeviceAuthAt(Date.now());
      }
    }
    await restoreStaffSessionFromSecureStorage(supabase);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setState("login"); return; }
    const staffResult = await supabase.from("staff_members").select("*").eq("user_id", user.id).maybeSingle();
    if (staffResult.error) { console.error(staffResult.error); setState("unconfigured"); setMessage("運営者設定を確認できません。時間を置いてもう一度お試しください。"); return; }
    if (!staffResult.data || staffResult.data.is_active === false) { setState("forbidden"); return; }
    setStaff(staffResult.data);
    const assurance = await getAuthenticatorAssuranceLevel(supabase);
    const debug = await updateAuthDebug("refresh");
    if (assurance.currentLevel !== "aal2" || debug?.accessTokenAal !== "aal2") { setState("mfa"); return; }
    await loadData(staffResult.data);
    setState("ready");
  }

  async function revalidatePublicData(kind: "food" | "store" | "area" | "collection" | "all", id?: string) {
    if (!supabase) return;
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    await fetch(staffApiUrl("/api/staff/revalidate"), {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id })
    }).catch(() => undefined);
    router.refresh();
  }

  async function staffWrite(operation: string, payload: unknown) {
    if (!supabase) throw new Error("staff-client-unavailable");
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) {
      setMessage("ログイン状態を確認できませんでした。もう一度ログインしてください。");
      throw new Error("staff-token-missing");
    }
    const response = await fetch(staffApiUrl("/api/staff/write"), {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ operation, payload }),
      cache: "no-store"
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json?.ok !== true || json?.verified !== true) {
      const code = typeof json?.code === "string" ? json.code : typeof json?.error === "string" ? json.error : "save_failed";
      throw new Error(code);
    }
    return json;
  }

  function staffWriteErrorMessage(error: unknown) {
    const code = error instanceof Error ? error.message : "";
    if (code === "owner_required") return "この操作は管理者だけが利用できます。";
    if (code === "aal2_required") return STAFF_MFA_REQUIRED_MESSAGE;
    if (code === "permission_denied") return "権限を確認できませんでした。もう一度ログインしてください。";
    if (code === "related_record_missing") return "関連する商品や店舗を確認できませんでした。画面を開き直してください。";
    if (code === "already_exists") return "同じ内容がすでに登録されています。";
    return "保存できませんでした。入力内容を確認してください。";
  }

  async function loadData(currentStaff: StaffMember | null = staff) {
    if (!supabase) return;
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    let catalog: { foods?: GeneratedFood[]; shops?: GeneratedShop[]; areas?: AreaOption[]; dashboard?: StaffDashboard | null } = { foods: [], shops: [], areas: [], dashboard: null };
    setCatalogLoadError("");
    setCatalogLoadErrorCode("");
    if (token) {
      try {
        const url = staffApiUrl("/api/staff/catalog");
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          const code = typeof json?.code === "string" ? json.code : typeof json?.error === "string" ? json.error : response.status === 404 ? "staff_api_not_found" : "staff_catalog_request_failed";
          throw new StaffCatalogError(response.status, code);
        }
        if (!json?.dashboard) throw new StaffCatalogError(200, "staff_catalog_dashboard_missing");
        catalog = json;
      } catch (error) {
        const detail = classifyStaffCatalogError(error);
        console.info("staff-catalog-load-failed", detail);
        setCatalogLoadError("管理データを取得できませんでした");
        setCatalogLoadErrorCode(detail.code);
      }
    } else {
      setCatalogLoadError("管理データを取得できませんでした");
      setCatalogLoadErrorCode("missing_session_token");
    }
    const db = supabase as any;
    const [foodsResult, overridesResult, membershipsResult, metadataResult, staffResult, shopsResult, linksResult, areasResult, collectionsResult, auditResult] = await Promise.all([
      supabase.from("manual_foods").select("*").order("updated_at", { ascending: false }),
      db.from("food_overrides").select("*"),
      supabase.from("food_collection_memberships").select("*"),
      supabase.from("food_publication_metadata").select("*"),
      supabase.from("staff_members").select("*").order("created_at", { ascending: true }),
      db.from("staff_shops").select("*").order("sort_order", { ascending: true }),
      db.from("staff_food_store_links").select("*").order("updated_at", { ascending: false }),
      db.from("staff_areas").select("*").order("sort_order", { ascending: true }),
      db.from("collections").select("*").order("sort_order", { ascending: true }),
      currentStaff?.role === "owner" ? db.from("staff_audit_logs").select("*").order("created_at", { ascending: false }).limit(120) : Promise.resolve({ data: [], error: null })
    ]);
    if (foodsResult.error) { console.error(foodsResult.error); setMessage("商品一覧を読み込めませんでした。もう一度お試しください。"); return; }
    setManualFoods(foodsResult.data ?? []);
    setOverrides(overridesResult.error ? [] : overridesResult.data ?? []);
    setMemberships(membershipsResult.data ?? []);
    setMetadata(metadataResult.data ?? []);
    if (!staffResult.error) setStaffRows(staffResult.data ?? []);
    setStaffShops(shopsResult.error ? [] : shopsResult.data ?? []);
    setFoodStoreLinks(linksResult.error ? [] : linksResult.data ?? []);
    setStaffAreas(areasResult.error ? [] : areasResult.data ?? []);
    setCollectionRows(collectionsResult.error ? [] : collectionsResult.data ?? []);
    setAuditLogs(auditResult.error ? [] : auditResult.data ?? []);
    setGeneratedFoods(catalog.foods ?? []);
    setGeneratedShops(catalog.shops ?? []);
    setAreas(catalog.areas ?? []);
    setDashboard(catalog.dashboard ?? null);
    if (shopsResult.error && /does not exist|not found|schema cache/i.test(shopsResult.error.message ?? "")) { console.error(shopsResult.error); setMessage("店舗管理の準備を確認できません。時間を置いてもう一度お試しください。"); }
  }

  useEffect(() => {
    if (!supabase) return;
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    const subscription = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED" || event === "MFA_CHALLENGE_VERIFIED") {
        void persistStaffSessionToSecureStorage(supabase);
      }
      if (event === "SIGNED_OUT") {
        void clearStaffSessionFromSecureStorage();
      }
      void updateAuthDebug(event);
    }).data.subscription;
    return () => {
      window.clearTimeout(timer);
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const managedFoods = useMemo(() => buildManagedFoods(generatedFoods, manualFoods, overrides, metadata), [generatedFoods, manualFoods, overrides, metadata]);
  const stores = useMemo(() => buildManagedStores(generatedShops, staffShops, foodStoreLinks, managedFoods), [generatedShops, staffShops, foodStoreLinks, managedFoods]);
  const managedAreas = useMemo(() => buildManagedAreas(areas, staffAreas, stores, managedFoods), [areas, staffAreas, stores, managedFoods]);
  const managedCollections = useMemo(() => buildManagedCollections(collectionRows, memberships, managedFoods), [collectionRows, memberships, managedFoods]);

  const collectionNamesByFoodId = useMemo(() => {
    const collectionNameById = new Map(managedCollections.map((collection) => [collection.id, collection.name]));
    const namesByFoodId = new Map<string, string[]>();
    for (const membership of memberships) {
      const name = collectionNameById.get(membership.collection_id);
      if (!name) continue;
      namesByFoodId.set(membership.food_id, [...(namesByFoodId.get(membership.food_id) ?? []), name]);
    }
    return namesByFoodId;
  }, [memberships, managedCollections]);

  useEffect(() => {
    if (state !== "mfa" || !isStaffAal2Snapshot(authDebug)) return;
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, authDebug?.currentLevel, authDebug?.accessTokenAal]);

  useEffect(() => {
    if (!isEditorRoute || state !== "ready" || !activeEditorKind) return;
    const timer = window.setTimeout(() => {
      if (activeEditorMode === "new") {
        if (activeEditorKind === "foods" && (form.id || form.name)) setForm(emptyFoodForm);
        if (activeEditorKind === "stores" && (storeForm.id || storeForm.name)) setStoreForm(emptyStoreForm);
        if (activeEditorKind === "areas" && (areaForm.id || areaForm.name)) setAreaForm(emptyAreaForm);
        if (activeEditorKind === "collections" && (collectionForm.id || collectionForm.name)) setCollectionForm(emptyCollectionForm);
        return;
      }
      const id = activeEditorId ? decodeURIComponent(activeEditorId) : "";
      if (!id) return;
      if (activeEditorKind === "foods" && form.id !== id) { const food = managedFoods.find((item) => item.id === id); if (food) fillFoodForm(food); else setMessage("対象の商品を読み込めませんでした。"); }
      if (activeEditorKind === "stores" && storeForm.id !== id) { const store = stores.find((item) => item.id === id); if (store) fillStoreForm(store); else setMessage("対象の店舗を読み込めませんでした。"); }
      if (activeEditorKind === "areas" && areaForm.id !== id) { const area = managedAreas.find((item) => item.id === id); if (area) fillAreaForm(area); else setMessage("対象のエリアを読み込めませんでした。"); }
      if (activeEditorKind === "collections" && collectionForm.id !== id) { const collection = managedCollections.find((item) => item.id === id); if (collection) fillCollectionForm(collection); else setMessage("対象の期間限定特集を読み込めませんでした。"); }
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditorRoute, state, activeEditorKind, activeEditorId, activeEditorMode, managedFoods, stores, managedAreas, managedCollections]);

  if (supabase === undefined) return <StaffPanel title="運営機能に接続しています" description="運営ログインの準備をしています。" />;
  if (supabase === null) return <StaffPanel title="運営者機能は未設定です" description="運営者機能の接続設定が未完了です。" />;
  async function handleLogin(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!supabase) return; setMessage(""); const result = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }); if (result.error) { console.error(result.error); setMessage("ログインできません。メールアドレスとパスワードを確認してください。"); return; } await persistStaffSessionToSecureStorage(supabase); await refresh({ requireDeviceAuth: false }); }
  async function startTotpEnrollment() {
    if (!supabase) return;
    setMessage("");
    setTotpSecret(null);
    setTotpUri(null);
    const result = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (result.error) {
      console.error(result.error);
      setMessage("認証アプリの登録を開始できません。もう一度お試しください。");
      return;
    }
    setFactorId(result.data.id);
    setQrCode(result.data.totp.qr_code);
    setTotpSecret(result.data.totp.secret ?? null);
    setTotpUri(result.data.totp.uri ?? null);
  }
  async function verifyTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setMessage("");

    const factors = await supabase.auth.mfa.listFactors();
    const selectedFactorId = factorId ?? factors.data?.totp?.find((factor) => factor.status === "verified")?.id ?? factors.data?.totp?.[0]?.id;
    if (!selectedFactorId) {
      setMessage("認証アプリの登録を先に行ってください。");
      return;
    }

    const challenge = await supabase.auth.mfa.challenge({ factorId: selectedFactorId });
    if (challenge.error) {
      console.error(challenge.error);
      setMessage("認証コードの確認を開始できません。もう一度お試しください。");
      return;
    }

    const verified = await supabase.auth.mfa.verify({ factorId: selectedFactorId, challengeId: challenge.data.id, code: totpCode.trim() });
    if (verified.error) {
      console.error(verified.error);
      setMessage("認証コードを確認できません。6桁コードをもう一度入力してください。");
      return;
    }

    const synced = await syncVerifiedStaffMfaSession(supabase, verified.data);
    await updateAuthDebug("MFA_CHALLENGE_VERIFIED");
    if (!synced.ok) {
      console.error(new Error("MFA session did not reach AAL2 after verification"), { currentLevel: synced.currentLevel, accessTokenAal: synced.accessTokenAal });
      setMessage("本人確認は完了しましたが、最新の確認状態を保存できませんでした。もう一度6桁コードを入力してください。");
      return;
    }

    setTotpCode("");
    setQrCode(null);
    setTotpSecret(null);
    setTotpUri(null);
    setFactorId(null);
    await refresh({ requireDeviceAuth: false });
  }
  function returnToPublicHome() {
    resetStaffViewportState();
    router.push("/");
    window.setTimeout(resetStaffViewportState, 0);
    window.setTimeout(resetStaffViewportState, 120);
  }

  async function logout() { if (!supabase) return; resetStaffViewportState(); await supabase.auth.signOut(); await clearStaffSessionFromSecureStorage(); setManualFoods([]); setGeneratedFoods([]); setDashboard(null); setCatalogLoadError(""); setCatalogLoadErrorCode(""); setStaff(null); setStaffRows([]); setForm(emptyFoodForm); setNativeEditor(null); setLastDeviceAuthAt(0); setState("login"); window.setTimeout(resetStaffViewportState, 0); }

  function goToEditor(kind: StaffEditorKind, id: string) {
    if (isNativeShell()) {
      setTab(kind);
      setNativeEditor({ kind, id, mode: "edit" });
      resetStaffViewportState();
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }
    router.push(`/staff/${kind}/${encodeURIComponent(id)}/edit`);
  }

  function goToNew(kind: StaffEditorKind) {
    if (isNativeShell()) {
      setTab(kind);
      setNativeEditor({ kind, id: null, mode: "new" });
      resetStaffViewportState();
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }
    router.push(`/staff/${kind}/new`);
  }

  function returnToList(kind: StaffEditorKind, notice = "保存しました。") {
    if (isNativeShell()) {
      setNativeEditor(null);
      setTab(kind);
      setMessage(notice);
      resetStaffViewportState();
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }
    router.push(`/staff?tab=${kind}&notice=${encodeURIComponent(notice)}`);
  }

  function fillFoodForm(food: ManagedFood) {
    const foodMemberships = memberships.filter((item) => item.food_id === food.id).map((item) => item.collection_id);
    const linkRows = foodStoreLinks.filter((item) => item.food_id === food.id && !item.deleted_at);
    setForm({ sourceKind: food.sourceKind, id: food.id, name: food.name, nameEn: food.nameEn ?? "", price: food.price === null ? "" : String(food.price), areaId: food.areaId ?? "", areaName: food.areaName, shopId: food.shopId ?? "", shopName: food.shopName, category: normalizeProductKind(food.category, food.categoryTags), saleStatus: food.saleStatus, salePeriodKind: salePeriodKindFromFood(food), publicState: food.publicState, hidden: food.hidden, startDate: food.startDate ?? "", endDate: food.endDate ?? "", imageUrl: food.imageUrl ?? "", sourceUrl: food.sourceUrl ?? "manual-staff-app", adminNotes: food.adminNotes ?? "", summer2026: foodMemberships.includes("summer-2026"), collectionIds: foodMemberships, reviewStatus: food.reviewStatus, version: food.version ?? null, selectedStoreIds: linkRows.length ? linkRows.map((item) => item.shop_id) : ([food.shopId].filter(Boolean) as string[]), primaryStoreId: linkRows.find((item) => item.is_primary)?.shop_id ?? food.shopId ?? "" });
  }

  function editFood(food: ManagedFood) { goToEditor("foods", food.id); }

  async function saveFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !staff) return;
    setMessage("");
    const parsedPrice = form.price.trim() === "" ? null : Number(form.price);
    if (!form.name.trim() || !form.areaName.trim() || !form.shopName.trim()) {
      setMessage("商品名、エリア、店舗は必須です。");
      return;
    }
    if (parsedPrice !== null && (!Number.isInteger(parsedPrice) || parsedPrice < 0)) {
      setMessage("価格は0以上の整数で入力してください。");
      return;
    }
    const productKind = normalizeProductKind(form.category);
    if (!productKind) {
      setMessage("商品の種類を1つ選んでください。");
      return;
    }
    const publishRequested = form.publicState === "published" && !form.hidden;
    const startDate = form.salePeriodKind === "always" ? "" : form.startDate;
    const endDate = form.salePeriodKind === "always" ? "" : form.endDate;
    if (form.salePeriodKind === "limited") {
      if (startDate && endDate && startDate > endDate) {
        setMessage("販売開始日は販売終了日より前の日付にしてください。");
        return;
      }
      if (publishRequested && (!startDate || !endDate)) {
        setMessage("期間限定の商品を公開するには、販売開始日と販売終了日を入力してください。");
        return;
      }
    }
    const saleStatus = form.salePeriodKind === "ended" ? "ended" : "active";
    const foodCategory = foodCategoryFromProductKind(productKind);
    const now = new Date().toISOString();
    const id = form.id.trim() || buildStaffManualFoodId(form.areaName, form.shopName, form.name);
    const existing = managedFoods.find((food) => food.id === id);
    const duplicate = managedFoods.find((food) => food.id !== id && food.name === form.name.trim() && food.shopName === form.shopName.trim() && !food.deletedAt);
    if (duplicate && !window.confirm("同じ店舗に似た商品「" + duplicate.name + "」があります。このまま保存しますか？")) return;
    if (!window.confirm(form.name.trim() + " を" + (existing ? "更新" : "追加") + "します。公開状態: " + (form.publicState === "published" && !form.hidden ? "公開" : "非公開"))) return;
    const isGenerated = form.sourceKind === "generated" && !id.startsWith("food-manual-");
    const values = isGenerated
      ? { food_id: id, name: form.name.trim(), name_en: emptyToNull(form.nameEn), price: parsedPrice, area_id: emptyToNull(form.areaId), area_name: form.areaName.trim(), shop_id: emptyToNull(form.shopId), shop_name: form.shopName.trim(), category: foodCategory, category_tags: [productKind], image_path: emptyToNull(form.imageUrl), image_source_url: emptyToNull(form.sourceUrl), info_source_url: emptyToNull(form.sourceUrl), sale_status: saleStatus, start_date: emptyToNull(startDate), end_date: emptyToNull(endDate), hidden: form.hidden, is_deleted: false, deleted_at: null, admin_notes: emptyToNull(form.adminNotes), updated_at: now }
      : { id, name: form.name.trim(), normalized_name: normalizeFoodName(form.name), name_en: emptyToNull(form.nameEn), category: foodCategory, category_tags: [productKind], price: parsedPrice, area_name: form.areaName.trim(), shop_name: form.shopName.trim(), sale_status: saleStatus, public_state: form.publicState, hidden: form.hidden, start_date: emptyToNull(startDate), end_date: emptyToNull(endDate), image_url: emptyToNull(form.imageUrl), source_url: emptyToNull(form.sourceUrl) ?? "manual-staff-app", admin_notes: emptyToNull(form.adminNotes), updated_at: now };
    const editableCollectionIds = collectionRows.map((item) => String(item.id)).filter(Boolean);
    if (editableCollectionIds.length === 0) editableCollectionIds.push("summer-2026");
    const selectedCollectionIds = Array.from(new Set([...(form.collectionIds ?? []), ...(form.summer2026 ? ["summer-2026"] : [])]));
    const currentLinkRows = foodStoreLinks.filter((item) => item.food_id === id).map((item) => ({ id: item.id, shop_id: item.shop_id, deleted_at: item.deleted_at }));
    try {
      await staffWrite("food.save", { id, isGenerated, values, salePeriodKind: form.salePeriodKind, version: form.version ?? manualFoods.find((food) => food.id === id)?.version ?? null });
      await staffWrite("food.seasonal", { foodId: id, editableCollectionIds, selectedCollectionIds, publicState: form.publicState, reviewStatus: form.reviewStatus });
      await staffWrite("food.storeLinks", { foodId: id, selectedStoreIds: form.selectedStoreIds, currentRows: currentLinkRows, primaryStoreId: form.primaryStoreId, saleStatus, price: parsedPrice, startDate, endDate });
    } catch (error) {
      setMessage(staffWriteErrorMessage(error));
      return;
    }
    setForm(emptyFoodForm);
    await loadData();
    await revalidatePublicData("food", id);
    if (isEditorRoute && activeEditorKind) {
      returnToList(activeEditorKind, "保存しました。");
      return;
    }
    setMessage("保存しました。");
  }

  async function uploadImage(file: File | null, target: "food" | "store" | "area" | "collection" = "food") {
    if (!supabase || !file) return;
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
    if (!allowedTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage("JPEG、PNG、WebP、HEICの画像を選んでください。画像サイズは5MB以内です。");
      return;
    }
    setUploading(true);
    setMessage("画像を保存しています");
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("staff-token-missing");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("target", target);
      const response = await fetch(staffApiUrl("/api/staff/upload-image"), { method: "POST", headers: { Authorization: "Bearer " + token }, body: formData, cache: "no-store" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json?.ok !== true || typeof json?.publicUrl !== "string") throw new Error(typeof json?.error === "string" ? json.error : "upload_failed");
      const publicUrl = json.urls?.card ?? json.publicUrl;
      const originalUrl = typeof json.urls?.original === "string" ? json.urls.original : publicUrl;
      if (target === "store") setStoreForm((current) => ({ ...current, imageUrl: publicUrl }));
      else if (target === "area") setAreaForm((current) => ({ ...current, imageUrl: publicUrl }));
      else if (target === "collection") setCollectionForm((current) => ({ ...current, imageUrl: publicUrl }));
      else setForm((current) => ({ ...current, imageUrl: publicUrl, sourceUrl: originalUrl || current.sourceUrl || "staff-upload" }));
      setMessage("画像を保存しました");
    } catch (error) {
      console.error(error);
      const code = error instanceof Error ? error.message : "";
      setMessage(code === "image_too_small" ? "画像が小さすぎます。横640px、縦480px以上の画像を選んでください。" : code === "unsupported_image" ? "この画像形式は処理できませんでした。JPEG、PNG、WebPの画像を選んでください。" : "画像を保存できませんでした。もう一度お試しください。");
    } finally {
      setUploading(false);
    }
  }

  async function softDeleteFood(food: ManagedFood, restore = false) {
    if (!window.confirm(food.name + " を" + (restore ? "復元" : "削除済みへ移動") + "します。")) return;
    try {
      await staffWrite("food.softDelete", { id: food.id, sourceKind: food.sourceKind, restore });
    } catch (error) {
      setMessage(staffWriteErrorMessage(error));
      return;
    }
    await loadData();
    await revalidatePublicData("food", food.id);
  }

  async function hardDeleteFood(food: ManagedFood) {
    if (staff?.role !== "owner") return;
    const confirmation = window.prompt("完全に削除します。元に戻せません。商品名を入力してください。");
    if (confirmation !== food.name) {
      setMessage("確認名が一致しないため中止しました。");
      return;
    }
    try {
      await staffWrite("food.hardDelete", { id: food.id, sourceKind: food.sourceKind });
    } catch (error) {
      setMessage(staffWriteErrorMessage(error));
      return;
    }
    await loadData();
    await revalidatePublicData("food", food.id);
  }

  function fillStoreForm(store: ManagedStore) { const staffRow = staffShops.find((item) => item.id === store.id); setStoreForm({ sourceKind: staffRow ? "staff" : "generated", id: store.id, name: store.name, nameEn: staffRow?.name_en ?? "", areaId: store.areaId ?? "", areaName: store.areaName, shopType: store.shopType, description: staffRow?.description ?? "", imageUrl: staffRow?.image_url ?? "", publicState: staffRow?.public_state ?? (store.isActive ? "published" : "draft"), businessStatus: staffRow?.business_status ?? (store.isActive ? "active" : "unknown"), hidden: Boolean(staffRow?.hidden), sortOrder: String(staffRow?.sort_order ?? 1000), officialUrl: staffRow?.official_url ?? store.officialUrl ?? "", version: staffRow?.version ?? null }); }
  function editStore(store: ManagedStore) { goToEditor("stores", store.id); }
  async function saveStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!staff) return;
    if (!storeForm.name.trim() || !storeForm.areaName.trim()) { setMessage("店舗名とエリアは必須です。"); return; }
    const sortOrder = Number(storeForm.sortOrder || 1000);
    if (!Number.isInteger(sortOrder)) { setMessage("表示順は整数で入力してください。"); return; }
    const id = storeForm.id.trim() || buildStaffStoreId(storeForm.areaName, storeForm.name);
    if (!window.confirm(storeForm.name + " を保存します。公開状態: " + (storeForm.publicState === "published" && !storeForm.hidden ? "公開" : "非公開"))) return;
    const values = { id, name: storeForm.name.trim(), name_en: emptyToNull(storeForm.nameEn), area_id: emptyToNull(storeForm.areaId), area_name: storeForm.areaName.trim(), shop_type: storeForm.shopType, description: emptyToNull(storeForm.description), image_url: emptyToNull(storeForm.imageUrl), public_state: storeForm.publicState, business_status: storeForm.businessStatus, hidden: storeForm.hidden, sort_order: sortOrder, official_url: emptyToNull(storeForm.officialUrl), updated_at: new Date().toISOString() };
    try { await staffWrite("store.save", { id, values }); } catch (error) { setMessage(staffWriteErrorMessage(error)); return; }
    setStoreForm(emptyStoreForm);
    await loadData();
    await revalidatePublicData("store", id);
    if (isEditorRoute && activeEditorKind) { returnToList(activeEditorKind, "保存しました。"); return; }
    setMessage("保存しました。");
  }
  async function softDeleteStore(store: ManagedStore, restore = false) {
    const text = restore ? store.name + " を復元します。" : store.name + " を削除済みにします。紐づく商品 " + store.linkedCount + " 件" + (store.publicLinkedCount ? "（公開中 " + store.publicLinkedCount + " 件）" : "") + "があります。";
    if (!window.confirm(text)) return;
    const values = { name: store.name, area_id: store.areaId, area_name: store.areaName, shop_type: store.shopType, public_state: store.publicState, business_status: store.businessStatus };
    try { await staffWrite("store.softDelete", { id: store.id, restore, values }); } catch (error) { setMessage(staffWriteErrorMessage(error)); return; }
    await loadData();
    await revalidatePublicData("store", store.id);
  }
  async function hardDeleteStore(store: ManagedStore) {
    if (staff?.role !== "owner") return;
    if (store.linkedCount > 0) { setMessage("商品が " + store.linkedCount + " 件紐づいているため完全削除できません。先に商品を別店舗へ移動してください。"); return; }
    const confirmation = window.prompt("完全削除するには「" + store.name + "」と入力してください。");
    if (confirmation !== store.name) { setMessage("確認名が一致しないため中止しました。"); return; }
    try { await staffWrite("store.hardDelete", { id: store.id }); } catch (error) { setMessage(staffWriteErrorMessage(error)); return; }
    await loadData();
    await revalidatePublicData("store", store.id);
  }

  function fillAreaForm(area: ManagedArea) { const row = staffAreas.find((item) => String(item.id) === area.id); setAreaForm({ id: area.id, name: area.name, nameEn: String(row?.name_en ?? ""), description: String(row?.description ?? ""), imageUrl: String(row?.image_url ?? ""), publicState: area.publicState, hidden: area.hidden, sortOrder: String(row?.sort_order ?? area.sortOrder ?? 1000), version: row?.version ?? null }); }
  function editArea(area: ManagedArea) { goToEditor("areas", area.id); }
  async function saveArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!staff) return;
    if (!areaForm.name.trim()) { setMessage("エリア名は必須です。"); return; }
    const sortOrder = Number(areaForm.sortOrder || 1000);
    if (!Number.isInteger(sortOrder)) { setMessage("表示順は整数で入力してください。"); return; }
    const id = areaForm.id.trim() || buildStaffAreaId(areaForm.name);
    if (!window.confirm(areaForm.name.trim() + " を保存します。公開状態: " + (areaForm.publicState === "published" && !areaForm.hidden ? "公開" : "非公開"))) return;
    const values = { id, name: areaForm.name.trim(), name_en: emptyToNull(areaForm.nameEn), description: emptyToNull(areaForm.description), image_url: emptyToNull(areaForm.imageUrl), public_state: areaForm.publicState, hidden: areaForm.hidden, sort_order: sortOrder, updated_at: new Date().toISOString() };
    try { await staffWrite("area.save", { id, values }); } catch (error) { setMessage(staffWriteErrorMessage(error)); return; }
    setAreaForm(emptyAreaForm);
    await loadData();
    await revalidatePublicData("area", id);
    if (isEditorRoute && activeEditorKind) { returnToList(activeEditorKind, "保存しました。"); return; }
    setMessage("保存しました。");
  }
  async function softDeleteArea(area: ManagedArea, restore = false) {
    const text = restore ? area.name + " を復元します。" : area.name + " を削除済みにします。所属店舗 " + area.storeCount + " 件、商品 " + area.foodCount + " 件があります。";
    if (!window.confirm(text)) return;
    const values = { name: area.name, public_state: area.publicState, sort_order: area.sortOrder };
    try { await staffWrite("area.softDelete", { id: area.id, restore, values }); } catch (error) { setMessage(staffWriteErrorMessage(error)); return; }
    await loadData();
    await revalidatePublicData("area", area.id);
  }
  async function hardDeleteArea(area: ManagedArea) {
    if (staff?.role !== "owner") return;
    if (area.storeCount > 0 || area.foodCount > 0) { setMessage("店舗 " + area.storeCount + " 件、商品 " + area.foodCount + " 件が所属しているため完全削除できません。先に別エリアへ移動してください。"); return; }
    const confirmation = window.prompt("完全削除するには「" + area.name + "」と入力してください。");
    if (confirmation !== area.name) { setMessage("確認名が一致しないため中止しました。"); return; }
    try { await staffWrite("area.hardDelete", { id: area.id }); } catch (error) { setMessage(staffWriteErrorMessage(error)); return; }
    await loadData();
    await revalidatePublicData("area", area.id);
  }

  function fillCollectionForm(collection: ManagedCollection) { const row = collectionRows.find((item) => String(item.id) === collection.id); const selectedFoodIds = memberships.filter((item) => item.collection_id === collection.id).map((item) => item.food_id); setCollectionForm({ id: collection.id, name: collection.name, nameEn: String(row?.name_en ?? collection.nameEn ?? ""), description: String(row?.description ?? collection.description ?? ""), imageUrl: String(row?.image_url ?? collection.imageUrl ?? ""), publicState: collection.publicState, hidden: collection.hidden, sortOrder: String(row?.sort_order ?? collection.sortOrder ?? 1000), startsOn: String(row?.starts_on ?? collection.startsOn ?? ""), endsOn: String(row?.ends_on ?? collection.endsOn ?? ""), seasonType: String(row?.season_type ?? "manual"), accentColor: String(row?.accent_color ?? "#0b66c3"), isFeatured: Boolean(row?.is_featured ?? collection.isFeatured ?? true), selectedFoodIds, version: row?.version ?? null }); }
  function editCollection(collection: ManagedCollection) { goToEditor("collections", collection.id); }
  async function saveCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!staff) return;
    if (!collectionForm.name.trim()) { setMessage("特集名は必須です。"); return; }
    const id = collectionForm.id.trim() || buildStaffCollectionId(collectionForm.name);
    const sortOrder = Number(collectionForm.sortOrder || 1000);
    if (!Number.isInteger(sortOrder)) { setMessage("表示順は整数で入力してください。"); return; }
    if (!window.confirm(collectionForm.name.trim() + " を保存します。公開状態: " + (collectionForm.publicState === "published" && !collectionForm.hidden ? "公開" : "非公開"))) return;
    const values = { id, name: collectionForm.name.trim(), name_en: emptyToNull(collectionForm.nameEn), description: emptyToNull(collectionForm.description), image_url: emptyToNull(collectionForm.imageUrl), public_state: collectionForm.publicState, hidden: collectionForm.hidden, sort_order: sortOrder, starts_on: emptyToNull(collectionForm.startsOn), ends_on: emptyToNull(collectionForm.endsOn), season_type: collectionForm.seasonType.trim() || "manual", accent_color: collectionForm.accentColor.trim() || "#0b66c3", is_featured: collectionForm.isFeatured, updated_at: new Date().toISOString() };
    const existingLinks = memberships.filter((item) => item.collection_id === id).map((item) => ({ food_id: item.food_id }));
    try { await staffWrite("collection.save", { id, values, selectedFoodIds: collectionForm.selectedFoodIds, existingLinks }); } catch (error) { setMessage(staffWriteErrorMessage(error)); return; }
    setCollectionForm(emptyCollectionForm);
    setCollectionFoodQuery("");
    await loadData();
    await revalidatePublicData("collection", id);
    if (isEditorRoute && activeEditorKind) { returnToList(activeEditorKind, "保存しました。"); return; }
    setMessage("保存しました。");
  }
  async function softDeleteCollection(collection: ManagedCollection, restore = false) {
    const text = restore ? collection.name + " を復元します。" : collection.name + " を削除済みにします。所属商品 " + collection.foodCount + " 件があります。商品本体は削除されません。";
    if (!window.confirm(text)) return;
    const values = { name: collection.name, public_state: collection.publicState, sort_order: collection.sortOrder };
    try { await staffWrite("collection.softDelete", { id: collection.id, restore, values }); } catch (error) { setMessage(staffWriteErrorMessage(error)); return; }
    await loadData();
    await revalidatePublicData("collection", collection.id);
  }
  async function hardDeleteCollection(collection: ManagedCollection) {
    if (staff?.role !== "owner") return;
    if (collection.foodCount > 0) { setMessage("商品が " + collection.foodCount + " 件所属しているため完全削除できません。先に商品編集で解除してください。"); return; }
    const confirmation = window.prompt("完全削除するには「" + collection.name + "」と入力してください。");
    if (confirmation !== collection.name) { setMessage("確認名が一致しないため中止しました。"); return; }
    try { await staffWrite("collection.hardDelete", { id: collection.id }); } catch (error) { setMessage(staffWriteErrorMessage(error)); return; }
    await loadData();
    await revalidatePublicData("collection", collection.id);
  }
  async function inviteStaffMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || staff?.role !== "owner" || inviteBusyMode) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const mode: StaffInviteMode = submitter?.dataset.mode === "email" ? "email" : "link";
    const emailValue = inviteEmail.trim().toLowerCase();
    setMessage(mode === "email" ? "招待メールを送っています" : "招待リンクを作成しています");
    setInviteBusyMode(mode);
    setInviteLink(null);
    try {
      const debug = await updateAuthDebug("staff-invite-before");
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const tokenAal = readJwtAalClaim(accessToken);
      const isStaffAal2 = debug?.currentLevel === "aal2" && tokenAal === "aal2";
      if (!accessToken || !isStaffAal2) {
        setMessage(STAFF_MFA_REQUIRED_MESSAGE);
        return;
      }
      supabase.functions.setAuth(accessToken);
      const result = await supabase.functions.invoke("staff-invite", {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: {
          email: emailValue,
          role: "editor",
          displayName: inviteDisplayName.trim() || undefined,
          mode
        }
      });
      if (result.error) {
        const payload = await readFunctionErrorPayload(result.error);
        setMessage(staffInviteErrorMessage(payload, mode));
        await updateAuthDebug("staff-invite-error");
        return;
      }
      const data = result.data as { inviteLink?: string; linkType?: string; delivery?: StaffInviteMode } | null;
      if (mode === "link" && data?.inviteLink) {
        setInviteLink({ url: data.inviteLink, email: emailValue, linkType: data.linkType ?? null });
        setMessage("招待リンクを作成しました。");
      } else if (mode === "link") {
        setMessage("招待リンクを作成できませんでした。時間を置いてもう一度お試しください。（missing_invite_link）");
        await updateAuthDebug("staff-invite-error");
        return;
      } else {
        setMessage("招待メールを送信しました。");
      }
      await updateAuthDebug("staff-invite-success");
      setInviteEmail("");
      setInviteDisplayName("");
      setInviteRole("editor");
      await loadData();
    } catch {
      setMessage("招待処理に接続できませんでした。時間を置いてもう一度お試しください。");
      await updateAuthDebug("staff-invite-error");
    } finally {
      setInviteBusyMode(null);
    }
  }
  async function updateStaffMemberRole(userId: string, role: StaffMember["role"]) { if (staff?.role !== "owner") return; try { await staffWrite("staff.role", { userId, role }); } catch (error) { setMessage(staffWriteErrorMessage(error)); return; } await loadData(); }
  async function setStaffMemberActive(userId: string, isActive: boolean) { if (staff?.role !== "owner") return; try { await staffWrite("staff.active", { userId, isActive }); } catch (error) { setMessage(staffWriteErrorMessage(error)); return; } await loadData(); }
  async function copyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink.url);
      setMessage("招待リンクをコピーしました。");
    } catch {
      setMessage("コピーできませんでした。リンクを選択してコピーしてください。");
    }
  }

  const visibleMessage = visibleStaffMessage(message, authDebug);

  const visibleFoods = managedFoods.filter((food) => {
    const lower = query.trim().toLowerCase();
    const matchesQuery = !lower || [food.name, food.nameEn, food.id, food.areaName, food.shopName, categoryLabel(food.category), saleStatusLabel(food.saleStatus), foodStatusLabel(food), collectionNamesByFoodId.get(food.id)?.join(" ")].some((value) => String(value ?? "").toLowerCase().includes(lower));
    return matchesQuery && foodMatchesStaffFilter(food, statusFilter);
  });
  const visibleStores = stores.filter((store) => { const lower = storeQuery.trim().toLowerCase(); const matchesQuery = !lower || [store.name, store.areaName, shopTypeLabel(store.shopType), businessStatusLabel(store.businessStatus), storeStatusLabel(store)].some((value) => String(value ?? "").toLowerCase().includes(lower)); const stateKey = store.deletedAt ? "deleted" : store.hidden ? "hidden" : store.publicState === "published" ? "published" : "draft"; return matchesQuery && (storeStatusFilter === "all" || storeStatusFilter === stateKey || (storeStatusFilter === "hidden" && stateKey === "draft") || storeStatusFilter === store.businessStatus); });
  const visibleAreas = managedAreas.filter((area) => { const lower = areaQuery.trim().toLowerCase(); const matchesQuery = !lower || [area.name, area.nameEn, areaStatusLabel(area)].some((value) => String(value ?? "").toLowerCase().includes(lower)); const stateKey = area.deletedAt ? "deleted" : area.hidden ? "hidden" : area.publicState === "published" ? "published" : "draft"; return matchesQuery && (areaStatusFilter === "all" || areaStatusFilter === stateKey || (areaStatusFilter === "hidden" && stateKey === "draft")); });
  const visibleCollections = managedCollections.filter((collection) => { const lower = collectionQuery.trim().toLowerCase(); const matchesQuery = !lower || [collection.name, collection.nameEn, collectionStatusLabel(collection)].some((value) => String(value ?? "").toLowerCase().includes(lower)); const stateKey = collection.deletedAt ? "deleted" : collection.hidden ? "hidden" : collection.publicState === "published" ? "published" : "draft"; return matchesQuery && (collectionStatusFilter === "all" || collectionStatusFilter === stateKey || (collectionStatusFilter === "hidden" && stateKey === "draft")); });
  const storeLinkChoices = stores.filter((store) => { const lower = storeLinkQuery.trim().toLowerCase(); return !lower || [store.name, store.areaName, shopTypeLabel(store.shopType)].some((value) => String(value).toLowerCase().includes(lower)); }).slice(0, 40);

  const pagedVisibleFoods = visibleFoods.slice(0, foodDisplayLimit);

  if (state === "checking") return <StaffPanel title="運営者確認中" description="セッションと権限を確認しています。" />;
  if (state === "unconfigured") return <StaffPanel title="運営者設定を確認できません" description={message || "運営者機能の準備が完了していません。"} />;
  if (state === "forbidden") return <StaffPanel title="運営者として登録されていません" description="この画面は所有者が許可した家族・運営者だけが使用できます。" onLogout={logout} />;
  if (state === "login") return <StaffPanel title="運営者ログイン" description="登録済み運営者だけが利用できます。通常利用者向け画面にはこの入口を表示しません。"><form onSubmit={handleLogin} className="mt-5 space-y-3"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="メールアドレス" className="h-12 w-full max-w-full rounded-xl border border-slate-200 px-4 text-sm font-bold" /><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="パスワード" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold" /><button className="h-12 w-full rounded-full bg-ink text-sm font-black text-white">ログイン</button></form>{visibleMessage ? <Message text={visibleMessage} /> : null}</StaffPanel>;
  if (state === "mfa" && isStaffAal2Snapshot(authDebug)) return <StaffPanel title="本人確認の状態を確認しています" description="最新の本人確認状態を反映しています。" onLogout={logout}>{authDebug ? <div className="mt-5"><StaffAuthDebugPanel snapshot={authDebug} /></div> : null}</StaffPanel>;
  if (state === "mfa") return <StaffPanel title="本人確認が必要です" description="追加や編集の前に、認証アプリの6桁コードで本人確認を完了してください。" onLogout={logout}><div className="mt-5 space-y-4"><button onClick={startTotpEnrollment} className="min-h-11 rounded-full border border-slate-200 px-5 text-sm font-black text-ink">認証アプリを登録する</button>{qrCode ? <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm font-bold text-slate-600">認証アプリでQRコードを読み取り、表示された6桁コードを入力してください。QRコードを読めない場合は、下の手動登録キーを認証アプリへ入力してください。</p><div className="mt-3 overflow-hidden rounded-xl bg-white p-3" dangerouslySetInnerHTML={{ __html: qrCode }} />{totpSecret ? <div className="mt-3 rounded-xl bg-slate-50 p-3"><p className="text-xs font-black text-slate-500">手動登録キー</p><code className="mt-1 block break-all text-sm font-black text-ink">{totpSecret}</code></div> : null}{totpUri ? <details className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600"><summary className="cursor-pointer font-black text-ink">読み取り用の文字列を表示</summary><code className="mt-2 block break-all">{totpUri}</code></details> : null}</div> : null}<form onSubmit={verifyTotp} className="flex gap-2"><input value={totpCode} onChange={(event) => setTotpCode(event.target.value)} inputMode="numeric" placeholder="6桁コード" className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-black" /><button className="h-12 rounded-full bg-park px-5 text-sm font-black text-white">確認</button></form>{visibleMessage ? <Message text={visibleMessage} /> : null}{staff?.role === "owner" && authDebug ? <StaffAuthDebugPanel snapshot={authDebug} /> : null}</div></StaffPanel>;

  const backHref = activeEditorKind ? `/staff?tab=${activeEditorKind}` : "/staff";
  const closeEditor = () => { if (activeEditorKind) returnToList(activeEditorKind, "変更せず戻りました。"); else router.push("/staff"); };
  const currentFood = activeEditorKind === "foods" && activeEditorMode === "edit" ? managedFoods.find((item) => item.id === form.id || item.id === activeEditorId) : null;
  const currentStore = activeEditorKind === "stores" && activeEditorMode === "edit" ? stores.find((item) => item.id === storeForm.id || item.id === activeEditorId) : null;
  const currentArea = activeEditorKind === "areas" && activeEditorMode === "edit" ? managedAreas.find((item) => item.id === areaForm.id || item.id === activeEditorId) : null;
  const currentCollection = activeEditorKind === "collections" && activeEditorMode === "edit" ? managedCollections.find((item) => item.id === collectionForm.id || item.id === activeEditorId) : null;
  const targetName = activeEditorKind === "foods" ? (form.name || currentFood?.name || "新しい商品") : activeEditorKind === "stores" ? (storeForm.name || currentStore?.name || "新しい店舗") : activeEditorKind === "areas" ? (areaForm.name || currentArea?.name || "新しいエリア") : activeEditorKind === "collections" ? (collectionForm.name || currentCollection?.name || "新しい特集") : "";
  const targetStatus = activeEditorKind === "foods" ? (currentFood ? foodStatusLabel(currentFood) : form.hidden ? "非公開" : form.publicState === "published" ? "公開中" : "非公開") : activeEditorKind === "stores" ? (currentStore ? storeStatusLabel(currentStore) : storeForm.hidden ? "非公開" : storeForm.publicState === "published" ? "公開中" : "非公開") : activeEditorKind === "areas" ? (currentArea ? areaStatusLabel(currentArea) : areaForm.hidden ? "非公開" : areaForm.publicState === "published" ? "公開中" : "非公開") : activeEditorKind === "collections" ? (currentCollection ? collectionStatusLabel(currentCollection) : collectionForm.hidden ? "非公開" : collectionForm.publicState === "published" ? "公開中" : "非公開") : "";
  const editorFormId = activeEditorKind === "foods" ? "staff-food-editor" : activeEditorKind === "stores" ? "staff-store-editor" : activeEditorKind === "areas" ? "staff-area-editor" : "staff-collection-editor";

  if (isEditorRoute && activeEditorKind) return <div className="staff-console max-w-full space-y-5 overflow-x-clip pb-28 md:pb-8"><StaffEditHeader title={activeEditorMode === "new" ? editorTitle + "を新しく追加" : editorTitle + "を編集"} targetName={targetName} status={targetStatus} backHref={backHref} formId={editorFormId} />{visibleMessage ? <Message text={visibleMessage} /> : null}{activeEditorKind === "foods" ? <FoodEditor form={form} setForm={setForm} stores={stores} storeLinkChoices={storeLinkChoices} storeLinkQuery={storeLinkQuery} setStoreLinkQuery={setStoreLinkQuery} collections={managedCollections} staffRole={staff?.role ?? "editor"} uploading={uploading} onUpload={(file) => uploadImage(file, "food")} onSubmit={saveFood} onReset={closeEditor} /> : null}{activeEditorKind === "stores" ? <StoreEditor form={storeForm} setForm={setStoreForm} areas={managedAreas} uploading={uploading} onUpload={(file) => uploadImage(file, "store")} onSubmit={saveStore} onReset={closeEditor} /> : null}{activeEditorKind === "areas" ? <AreaEditor form={areaForm} setForm={setAreaForm} uploading={uploading} onUpload={(file) => uploadImage(file, "area")} onSubmit={saveArea} onReset={closeEditor} /> : null}{activeEditorKind === "collections" ? <CollectionEditor form={collectionForm} setForm={setCollectionForm} foods={managedFoods} foodQuery={collectionFoodQuery} setFoodQuery={setCollectionFoodQuery} uploading={uploading} onUpload={(file) => uploadImage(file, "collection")} onSubmit={saveCollection} onReset={closeEditor} /> : null}{activeEditorMode === "edit" ? <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"><h2 className="text-lg font-black text-ink">公開・非公開</h2><p className="mt-1 text-sm font-bold leading-6 text-slate-500">ふだんは非公開か削除済みにします。完全削除は管理者だけが確認して実行します。</p><div className="mt-4 flex flex-wrap gap-2">{activeEditorKind === "foods" && currentFood ? <><button type="button" onClick={() => void softDeleteFood(currentFood, Boolean(currentFood.deletedAt))} className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-ink">{currentFood.deletedAt ? "元に戻す" : "削除済みにする"}</button>{staff?.role === "owner" && currentFood.deletedAt ? <details className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"><summary className="cursor-pointer">管理者だけの完全削除</summary><button type="button" onClick={() => void hardDeleteFood(currentFood)} className="mt-2 min-h-11 rounded-full bg-white px-4 text-sm font-black text-rose-700">完全削除</button></details> : null}</> : null}{activeEditorKind === "stores" && currentStore ? <><button type="button" onClick={() => void softDeleteStore(currentStore, Boolean(currentStore.deletedAt))} className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-ink">{currentStore.deletedAt ? "元に戻す" : "削除済みにする"}</button>{staff?.role === "owner" && currentStore.deletedAt ? <details className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"><summary className="cursor-pointer">管理者だけの完全削除</summary><button type="button" onClick={() => void hardDeleteStore(currentStore)} className="mt-2 min-h-11 rounded-full bg-white px-4 text-sm font-black text-rose-700">完全削除</button></details> : null}</> : null}{activeEditorKind === "areas" && currentArea ? <><button type="button" onClick={() => void softDeleteArea(currentArea, Boolean(currentArea.deletedAt))} className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-ink">{currentArea.deletedAt ? "元に戻す" : "削除済みにする"}</button>{staff?.role === "owner" && currentArea.deletedAt ? <details className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"><summary className="cursor-pointer">管理者だけの完全削除</summary><button type="button" onClick={() => void hardDeleteArea(currentArea)} className="mt-2 min-h-11 rounded-full bg-white px-4 text-sm font-black text-rose-700">完全削除</button></details> : null}</> : null}{activeEditorKind === "collections" && currentCollection ? <><button type="button" onClick={() => void softDeleteCollection(currentCollection, Boolean(currentCollection.deletedAt))} className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-ink">{currentCollection.deletedAt ? "元に戻す" : "削除済みにする"}</button>{staff?.role === "owner" && currentCollection.deletedAt ? <details className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"><summary className="cursor-pointer">管理者だけの完全削除</summary><button type="button" onClick={() => void hardDeleteCollection(currentCollection)} className="mt-2 min-h-11 rounded-full bg-white px-4 text-sm font-black text-rose-700">完全削除</button></details> : null}</> : null}</div></div> : null}</div>;
  const tabItems: Array<[TabKey, string, ReactNode]> = [["foods", "商品", <Tags key="foods" className="h-5 w-5" />], ["stores", "店舗", <Store key="stores" className="h-5 w-5" />], ["areas", "エリア", <MapPinned key="areas" className="h-5 w-5" />], ["collections", "期間限定特集", <CalendarDays key="collections" className="h-5 w-5" />], ["operators", "家族を追加", <Users key="operators" className="h-5 w-5" />], ["audit", "操作履歴", <ListChecks key="audit" className="h-5 w-5" />]];
  const visibleTabItems = staff?.role === "owner" ? tabItems : tabItems.filter(([key]) => key !== "operators" && key !== "audit");
  const activeTab = staff?.role !== "owner" && (tab === "operators" || tab === "audit") ? "foods" : tab;
  const topStats: Array<[string, number]> = dashboard ? [["販売中の商品", dashboard.onSaleFoodCount], ["非公開の商品", dashboard.unpublishedFoodCount], ["エリア総数", dashboard.areaCount], ["公開店舗", dashboard.shopCount]] : [];

  return <div className="staff-console max-w-full space-y-6 overflow-x-clip pb-32 md:pb-8"><div className="staff-top-card flex min-w-0 flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft lg:flex-row lg:items-end lg:justify-between"><div className="min-w-0"><p className="text-xs font-black text-park">アプリ運営</p><h1 className="mt-1 text-3xl font-black text-ink">アプリ運営</h1><p className="mt-2 text-sm font-bold leading-6 text-slate-600">商品や店舗、期間限定特集を管理できます。</p><p className="mt-1 text-xs font-bold leading-5 text-slate-500">家族だけが利用できる管理画面です。</p></div><div className="staff-top-actions flex flex-wrap gap-2 text-xs font-black text-slate-600"><span className="rounded-full bg-mint px-3 py-2 text-park">{staff ? roleLabel(staff.role) : "運営者"}</span><button type="button" onClick={returnToPublicHome} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 py-2 text-ink">一般画面へ戻る</button><button type="button" onClick={logout} className="min-h-11 rounded-full border border-slate-200 px-4 py-2 text-ink">ログアウト</button></div></div>{visibleMessage ? <Message text={visibleMessage} /> : null}{staff?.role === "owner" && authDebug ? <StaffAuthDebugPanel snapshot={authDebug} /> : null}{catalogLoadError || !dashboard ? <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-soft"><h2 className="text-sm font-black text-ink">管理データを取得できませんでした</h2><p className="mt-1 text-xs font-bold leading-5 text-slate-600">通信環境を確認して、もう一度読み込んでください。</p>{catalogLoadErrorCode ? <p className="mt-1 text-[11px] font-black leading-5 text-amber-700">エラーコード: {catalogLoadErrorCode}</p> : null}<button type="button" onClick={() => void loadData()} className="mt-3 min-h-11 rounded-full bg-white px-4 text-xs font-black text-park ring-1 ring-amber-200">もう一度読み込む</button></section> : <><section className="grid grid-cols-2 gap-2">{topStats.map(([label, value]) => <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft"><p className="truncate text-[11px] font-black text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-ink">{Number(value).toLocaleString("ja-JP")}件</p></div>)}</section><section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-sm font-black text-ink">公開中の期間限定特集</h2><p className="mt-1 text-xs font-bold leading-5 text-slate-500">期間限定メニューをまとめた特集です。</p></div><p className="shrink-0 rounded-full bg-slate-50 px-3 py-2 text-sm font-black text-park">{Number(dashboard.activeSeasonalCollectionCount).toLocaleString("ja-JP")}件</p></div></section></>}{auditLogs.length ? <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft"><h2 className="text-base font-black text-ink">最近の操作</h2><div className="mt-3 space-y-2">{auditLogs.slice(0, 3).map((log, index) => <p key={String(log.id ?? index)} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">{auditTargetLabel(log)}{auditActionLabel(log)}</p>)}</div></section> : null}<div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft md:grid-cols-3 xl:grid-cols-6">{visibleTabItems.map(([key, label, icon]) => <button key={key} type="button" onClick={() => setTab(key)} className={"flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-center text-xs font-black " + (activeTab === key ? "bg-ink text-white" : "bg-slate-50 text-ink")}>{icon}<span className="break-words leading-5">{label}</span></button>)}</div>{activeTab === "foods" ? <FoodList visibleFoods={pagedVisibleFoods} totalFoods={visibleFoods.length} hasMore={visibleFoods.length > pagedVisibleFoods.length} onLoadMore={() => setFoodDisplayLimit((value) => value + 30)} staff={staff} onEdit={editFood} onSoftDelete={softDeleteFood} onHardDelete={hardDeleteFood} query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} /> : null}{activeTab === "stores" ? <StoreList visibleStores={visibleStores} staff={staff} onEdit={editStore} onSoftDelete={softDeleteStore} onHardDelete={hardDeleteStore} query={storeQuery} setQuery={setStoreQuery} statusFilter={storeStatusFilter} setStatusFilter={setStoreStatusFilter} /> : null}{activeTab === "areas" ? <AreaList visibleAreas={visibleAreas} staff={staff} onEdit={editArea} onSoftDelete={softDeleteArea} onHardDelete={hardDeleteArea} query={areaQuery} setQuery={setAreaQuery} statusFilter={areaStatusFilter} setStatusFilter={setAreaStatusFilter} /> : null}{activeTab === "collections" ? <CollectionList visibleCollections={visibleCollections} staff={staff} onEdit={editCollection} onSoftDelete={softDeleteCollection} onHardDelete={hardDeleteCollection} query={collectionQuery} setQuery={setCollectionQuery} statusFilter={collectionStatusFilter} setStatusFilter={setCollectionStatusFilter} /> : null}{activeTab === "operators" && staff?.role === "owner" ? <OperatorsSection staff={staff} staffRows={staffRows} inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} inviteDisplayName={inviteDisplayName} setInviteDisplayName={setInviteDisplayName} inviteRole={inviteRole} setInviteRole={setInviteRole} inviteLink={inviteLink} onCopyInviteLink={copyInviteLink} onCloseInviteLink={() => setInviteLink(null)} onInvite={inviteStaffMember} inviteBusyMode={inviteBusyMode} onRole={updateStaffMemberRole} onActive={setStaffMemberActive} /> : null}{activeTab === "audit" && staff?.role === "owner" ? <AuditSection staff={staff} logs={auditLogs} /> : null}<StaffAddFab open={addMenuOpen} setOpen={setAddMenuOpen} onNew={goToNew} /></div>;

}

type ManagedStore = ReturnType<typeof buildManagedStores>[number];
type ManagedArea = ReturnType<typeof buildManagedAreas>[number];
type ManagedCollection = ReturnType<typeof buildManagedCollections>[number];

function foodMatchesStaffFilter(food: ManagedFood, filter: string) {
  const stateKey = food.deletedAt ? "deleted" : food.hidden ? "hidden" : food.publicState === "published" ? "published" : "draft";
  if (filter === "all") return true;
  if (filter === "hidden") return stateKey === "hidden" || stateKey === "draft";
  if (filter === "published" || filter === "deleted") return stateKey === filter;
  if (filter === "active" || filter === "ended" || filter === "paused" || filter === "unknown") return food.saleStatus === filter;
  if (filter === "priceUnknown") return food.price === null;
  if (filter === "noImage") return !food.imageUrl;
  if (filter === "seasonal") return food.category === "seasonal" || Boolean(food.startDate || food.endDate);
  if (filter === "permanent") return food.saleStatus === "active" && !food.startDate && !food.endDate;
  return true;
}

function isDateWithinCollectionWindow(startsOn?: string, endsOn?: string) {
  const today = new Date();
  const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const start = startsOn ? new Date(startsOn + "T00:00:00").getTime() : null;
  const end = endsOn ? new Date(endsOn + "T23:59:59").getTime() : null;
  return (start === null || start <= todayKey) && (end === null || end >= todayKey);
}

function collectionHomeVisibilityReasons(collection: Pick<ManagedCollection, "publicState" | "hidden" | "deletedAt" | "isFeatured" | "foodCount" | "imageUrl" | "startsOn" | "endsOn">) {
  const reasons: string[] = [];
  if (collection.deletedAt) reasons.push("削除済みです");
  if (collection.hidden || collection.publicState !== "published") reasons.push("非公開になっています");
  if (!collection.isFeatured) reasons.push("「ホーム画面に表示」がOFFです");
  if (!collection.imageUrl) reasons.push("メイン画像を設定してください");
  if (collection.foodCount < 1) reasons.push("掲載商品を1件以上選んでください");
  if (!isDateWithinCollectionWindow(collection.startsOn, collection.endsOn)) reasons.push("開催期間外です");
  return reasons;
}

function isHomeVisibleCollection(collection: ManagedCollection) {
  return collectionHomeVisibilityReasons(collection).length === 0;
}
function StaffImagePicker({ id, value, emptyText, uploading, onUpload, onClear }: { id: string; value?: string | null; emptyText: string; uploading: boolean; onUpload: (file: File | null) => void; onClear: () => void }) {
  return <div className="space-y-3"><div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">{value ? <img src={value} alt="" className="h-52 w-full object-cover" /> : <div className="grid h-40 place-items-center px-4 text-center text-sm font-black text-slate-400">{emptyText}</div>}</div><input id={id} type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif" onChange={(event) => onUpload(event.target.files?.[0] ?? null)} className="sr-only" /><div className="flex flex-wrap gap-2"><label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-park px-5 text-sm font-black text-white">{value ? "写真を変更" : "写真を選ぶ"}</label>{value ? <button type="button" onClick={onClear} className="min-h-11 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-ink">画像を削除</button> : null}</div><p className="text-xs font-bold leading-5 text-slate-500">推奨: 横640px・縦480px以上。元画像を残し、表示用に自動調整します。</p>{uploading ? <p className="text-sm font-bold text-park">画像を保存しています</p> : null}</div>;
}

function StaffChoice({ active, children, onClick, role, ariaLabel }: { active: boolean; children: ReactNode; onClick: () => void; role?: "radio"; ariaLabel?: string }) {
  return <button type="button" role={role} aria-checked={role === "radio" ? active : undefined} aria-label={ariaLabel} onClick={onClick} className={"min-h-11 rounded-2xl border px-4 py-3 text-sm font-black " + (active ? "border-park bg-blue-50 text-park" : "border-slate-200 bg-white text-ink")}>{children}</button>;
}

function StaffBottomActions({ saving, onReset }: { saving: boolean; onReset: () => void }) {
  return <div className="sticky bottom-0 z-20 mx-0 rounded-t-3xl border border-slate-200 bg-white/95 p-3 shadow-[0_-16px_40px_rgba(15,23,42,0.10)] backdrop-blur supports-[padding:max(0px)]:pb-[max(12px,env(safe-area-inset-bottom))]"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={onReset} className="min-h-12 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-ink">戻る</button><button type="submit" disabled={saving} className="min-h-12 rounded-full bg-park px-4 text-sm font-black text-white disabled:opacity-60">{saving ? "保存しています" : "保存する"}</button></div></div>;
}

function FoodList({ visibleFoods, totalFoods, hasMore, onLoadMore, staff, onEdit, onSoftDelete, onHardDelete, query, setQuery, statusFilter, setStatusFilter }: { visibleFoods: ManagedFood[]; totalFoods: number; hasMore: boolean; onLoadMore: () => void; staff: StaffMember | null; onEdit: (food: ManagedFood) => void; onSoftDelete: (food: ManagedFood, restore?: boolean) => void; onHardDelete: (food: ManagedFood) => void; query: string; setQuery: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft"><div className="mb-4"><h2 className="text-xl font-black text-ink">商品</h2><p className="mt-1 text-sm font-bold text-slate-500">写真、価格、売っている場所を確認できます。</p></div><div className="grid gap-3 sm:grid-cols-[1fr_180px]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="商品名で検索" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-bold" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-bold"><option value="all">すべて</option><option value="published">公開中</option><option value="hidden">非公開</option><option value="active">販売中</option><option value="ended">販売終了</option><option value="priceUnknown">価格未確認</option><option value="noImage">画像未設定</option><option value="seasonal">期間限定</option><option value="permanent">通年販売</option></select></div><p className="mt-3 text-xs font-bold text-slate-500">全商品 {totalFoods.toLocaleString("ja-JP")} 件中、{visibleFoods.length.toLocaleString("ja-JP")} 件を表示</p><div className="mt-4 grid gap-2">{visibleFoods.map((food) => <article key={String(food.sourceKind) + "-" + food.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-3"><div className="flex min-w-0 gap-3"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white">{food.imageUrl ? <img src={food.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[10px] font-black text-slate-400">画像なし</div>}</div><div className="min-w-0 flex-1"><p className="break-words text-sm font-black leading-snug text-ink" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{food.name}</p><p className="mt-1 text-sm font-black text-park">{food.price === null ? "価格未確認" : "¥" + food.price.toLocaleString("ja-JP")}</p><p className="mt-1 break-words text-xs font-bold text-slate-600">{food.shopName || food.areaName || "販売場所未設定"}</p><p className="mt-2 text-xs font-bold text-slate-600">{foodStatusLabel(food)}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onEdit(food)} className="min-h-11 rounded-full bg-ink px-5 text-xs font-black text-white">編集</button><button type="button" onClick={() => onSoftDelete(food, Boolean(food.deletedAt))} className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">{food.deletedAt ? "元に戻す" : "非公開"}</button>{staff?.role === "owner" && food.deletedAt ? <button type="button" onClick={() => onHardDelete(food)} className="min-h-11 rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-700">完全削除</button> : null}</div></div></div></article>)}{hasMore ? <button type="button" onClick={onLoadMore} className="mt-4 min-h-11 w-full rounded-full border border-slate-200 bg-white text-sm font-black text-ink">さらに表示</button> : null}</div></section>;
}

function StoreList({ visibleStores, staff, onEdit, onSoftDelete, onHardDelete, query, setQuery, statusFilter, setStatusFilter }: { visibleStores: ManagedStore[]; staff: StaffMember | null; onEdit: (store: ManagedStore) => void; onSoftDelete: (store: ManagedStore, restore?: boolean) => void; onHardDelete: (store: ManagedStore) => void; query: string; setQuery: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft"><div className="mb-4"><h2 className="text-xl font-black text-ink">店舗</h2></div><div className="grid gap-3 sm:grid-cols-[1fr_180px]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="店舗名で検索" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-bold" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-bold"><option value="all">すべて</option><option value="published">公開中</option><option value="hidden">非公開</option></select></div><div className="mt-4 grid gap-3">{visibleStores.map((store) => <article key={store.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-3"><div className="flex min-w-0 gap-3"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white">{store.imageUrl ? <img src={store.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[10px] font-black text-slate-400">店舗</div>}</div><div className="min-w-0 flex-1"><p className="break-words text-base font-black text-ink">{store.name}</p><p className="mt-1 text-sm font-bold text-slate-600">{store.areaName}</p><p className="mt-1 text-xs font-bold text-slate-500">{shopTypeLabel(store.shopType)} / 商品 {store.linkedCount} 件</p><p className="mt-1 text-xs font-bold text-slate-600">{storeStatusLabel(store)}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onEdit(store)} className="min-h-11 rounded-full bg-ink px-5 text-xs font-black text-white">編集</button><button type="button" onClick={() => onSoftDelete(store, Boolean(store.deletedAt))} className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">{store.deletedAt ? "元に戻す" : "非公開"}</button>{staff?.role === "owner" && store.deletedAt && store.linkedCount === 0 ? <button type="button" onClick={() => onHardDelete(store)} className="min-h-11 rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-700">完全削除</button> : null}</div></div></div></article>)}</div></section>;
}

function FoodEditor({ form, setForm, stores, storeLinkChoices, storeLinkQuery, setStoreLinkQuery, collections, staffRole, uploading, onUpload, onSubmit, onReset }: { form: FoodForm; setForm: (value: FoodForm | ((current: FoodForm) => FoodForm)) => void; stores: ManagedStore[]; storeLinkChoices: ManagedStore[]; storeLinkQuery: string; setStoreLinkQuery: (value: string) => void; collections: ManagedCollection[]; staffRole: StaffMember["role"]; uploading: boolean; onUpload: (file: File | null) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onReset: () => void }) {
  const selectedStoreNames = form.selectedStoreIds.map((id) => stores.find((store) => store.id === id)?.name).filter(Boolean).join("、");
  const sourceUrl = form.sourceUrl.trim();
  const sourceIsUrl = /^https?:\/\//i.test(sourceUrl);
  const salePeriodKind = form.salePeriodKind;
  const areaNames = Array.from(new Set(stores.map((store) => store.areaName).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ja"));
  return <form id="staff-food-editor" onSubmit={onSubmit} className="min-w-0 space-y-4 pb-28"><section className="staff-card space-y-4"><h2 className="text-xl font-black text-ink">商品を編集</h2><p className="text-sm font-bold leading-6 text-slate-500">写真、名前、価格、売っている場所の順に確認します。</p><Field label="商品画像"><StaffImagePicker id="food-image" value={form.imageUrl} emptyText="写真を選んでください" uploading={uploading} onUpload={onUpload} onClear={() => setForm((current) => ({ ...current, imageUrl: "" }))} /></Field><Field label="商品名"><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="アメリカン・ホットドッグ" className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-base font-bold" /></Field><Field label="価格"><div className="space-y-2"><input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value.replace(/[^0-9]/g, "") }))} inputMode="numeric" placeholder="600" className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-base font-bold" /><button type="button" onClick={() => setForm((current) => ({ ...current, price: "" }))} className="min-h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">価格未確認にする</button>{form.price ? <p className="text-sm font-black text-park">表示: ¥{Number(form.price).toLocaleString("ja-JP")}</p> : <p className="text-sm font-bold text-slate-500">価格未確認</p>}</div></Field></section><section className="staff-card space-y-4"><h3 className="text-lg font-black text-ink">どこで買えるか</h3><Field label="エリア"><select value={form.areaName} onChange={(event) => setForm((current) => ({ ...current, areaName: event.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold"><option value="">エリアを選ぶ</option>{areaNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></Field><Field label="店舗"><input value={storeLinkQuery} onChange={(event) => setStoreLinkQuery(event.target.value)} placeholder="店舗名で検索" className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold" />{selectedStoreNames ? <p className="mt-2 text-xs font-bold text-slate-500">選択中: {selectedStoreNames}</p> : null}<div className="mt-2 max-h-64 space-y-2 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-2">{storeLinkChoices.map((store) => <label key={store.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={form.selectedStoreIds.includes(store.id)} onChange={(event) => setForm((current) => ({ ...current, selectedStoreIds: event.target.checked ? Array.from(new Set([...current.selectedStoreIds, store.id])) : current.selectedStoreIds.filter((id) => id !== store.id), primaryStoreId: event.target.checked && !current.primaryStoreId ? store.id : current.primaryStoreId === store.id && !event.target.checked ? "" : current.primaryStoreId }))} /><span className="min-w-0 flex-1 break-words">{store.name}<span className="block text-slate-400">{store.areaName}</span></span><input type="radio" name="primaryStore" checked={form.primaryStoreId === store.id} onChange={() => setForm((current) => ({ ...current, primaryStoreId: store.id, selectedStoreIds: Array.from(new Set([...current.selectedStoreIds, store.id])) }))} /><span>主な店舗</span></label>)}</div><Link href="/staff/stores/new" className="mt-2 inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">新しい店舗を追加</Link></Field></section><section className="staff-card space-y-4"><h3 className="text-lg font-black text-ink">いつ販売するか</h3><div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="いつ販売するか"><StaffChoice role="radio" active={salePeriodKind === "always"} onClick={() => setForm((current) => ({ ...current, salePeriodKind: "always", saleStatus: "active", startDate: "", endDate: "" }))}>いつでも販売</StaffChoice><StaffChoice role="radio" active={salePeriodKind === "limited"} onClick={() => setForm((current) => ({ ...current, salePeriodKind: "limited", saleStatus: "active" }))}>期間限定</StaffChoice><StaffChoice role="radio" active={salePeriodKind === "ended"} onClick={() => setForm((current) => ({ ...current, salePeriodKind: "ended", saleStatus: "ended" }))}>販売終了</StaffChoice></div>{salePeriodKind === "limited" ? <div className="grid gap-3 sm:grid-cols-2"><Field label="販売開始日"><input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-base font-bold" /></Field><Field label="販売終了日"><input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-base font-bold" /></Field>{form.startDate || form.endDate ? <p className="sm:col-span-2 text-xs font-bold leading-5 text-slate-500">現在の設定: {form.startDate || "開始日未設定"} から {form.endDate || "終了日未設定"} まで</p> : <p className="sm:col-span-2 text-xs font-bold leading-5 text-slate-500">公開する場合は販売開始日と販売終了日を入力してください。</p>}</div> : null}</section><section className="staff-card space-y-4"><h3 className="text-lg font-black text-ink">商品タグ</h3><p className="text-xs font-bold leading-5 text-slate-500">この商品自身の特徴です。</p><Field label="商品の種類"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="商品の種類">{productKindChoices.map(([value, label]) => <StaffChoice key={value} role="radio" active={form.category === value} onClick={() => setForm((current) => ({ ...current, category: value }))}>{label}</StaffChoice>)}</div>{!form.category ? <p className="mt-2 text-xs font-bold text-slate-500">商品の種類を1つ選んでください。</p> : null}</Field><Field label="公開状態"><div className="grid gap-2 sm:grid-cols-3"><StaffChoice active={!form.hidden && form.publicState === "published"} onClick={() => setForm((current) => ({ ...current, publicState: "published", hidden: false }))}>公開する</StaffChoice><StaffChoice active={form.hidden || form.publicState !== "published"} onClick={() => setForm((current) => ({ ...current, publicState: "draft", hidden: true }))}>非公開にする</StaffChoice></div></Field></section><details className="staff-card"><summary className="cursor-pointer text-base font-black text-ink">その他の情報</summary><div className="mt-4 space-y-3"><Field label="英語名"><input value={form.nameEn} onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" /></Field><Field label="商品メモ"><textarea value={safePublicNote(form.adminNotes)} onChange={(event) => setForm((current) => ({ ...current, adminNotes: event.target.value }))} rows={3} placeholder="味や内容について残したいことがあれば入力します。" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" /></Field><div className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-600"><p>確認情報: {sourceIsUrl ? (sourceUrl.includes("usj.co.jp") ? "公式サイト" : "その他の確認情報") : "その他の確認情報"}</p>{sourceIsUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-10 items-center rounded-full bg-white px-4 text-xs font-black text-park">確認ページを開く</a> : null}</div>{collections.length ? <Field label="期間限定特集"><p className="mb-2 text-xs font-bold leading-5 text-slate-500">ホーム画面の特集に、この商品を載せる場合に選びます。</p><div className="space-y-2">{collections.map((collection) => <label key={collection.id} className="flex min-w-0 items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"><input className="mt-0.5 shrink-0" type="checkbox" checked={form.collectionIds.includes(collection.id)} onChange={(event) => setForm((current) => ({ ...current, collectionIds: event.target.checked ? Array.from(new Set([...current.collectionIds, collection.id])) : current.collectionIds.filter((id) => id !== collection.id) }))} /><span className="min-w-0 flex-1 break-words leading-5" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{collection.name}</span></label>)}</div></Field> : null}</div></details><StaffBottomActions saving={uploading} onReset={onReset} /></form>;
}

function StoreEditor({ form, setForm, areas, uploading, onUpload, onSubmit, onReset }: { form: StoreForm; setForm: (value: StoreForm | ((current: StoreForm) => StoreForm)) => void; areas: AreaOption[]; uploading: boolean; onUpload: (file: File | null) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onReset: () => void }) {
  return <form id="staff-store-editor" onSubmit={onSubmit} className="min-w-0 space-y-4 pb-28"><section className="staff-card space-y-4"><h2 className="text-xl font-black text-ink">店舗を編集</h2><Field label="店舗画像"><StaffImagePicker id="store-image" value={form.imageUrl} emptyText="店舗の写真を選んでください" uploading={uploading} onUpload={onUpload} onClear={() => setForm((current) => ({ ...current, imageUrl: "" }))} /></Field><Field label="店舗名"><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="ワーフカフェ" className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-base font-bold" /></Field><Field label="エリア"><select value={form.areaName} onChange={(event) => setForm((current) => ({ ...current, areaName: event.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold"><option value="">エリアを選ぶ</option>{areas.map((area) => <option key={area.id} value={area.name}>{area.name}</option>)}</select></Field><Field label="店舗の種類"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{[["restaurant", "レストラン"], ["cart", "フードカート"], ["stand", "ドリンクスタンド"], ["sweets", "スイーツ"], ["unknown", "その他"]].map(([value, label]) => <StaffChoice key={value} active={form.shopType === value} onClick={() => setForm((current) => ({ ...current, shopType: value as ShopType }))}>{label}</StaffChoice>)}</div></Field><Field label="公開状態"><div className="grid gap-2 sm:grid-cols-3"><StaffChoice active={!form.hidden && form.publicState === "published"} onClick={() => setForm((current) => ({ ...current, publicState: "published", hidden: false }))}>公開する</StaffChoice><StaffChoice active={form.hidden || form.publicState !== "published"} onClick={() => setForm((current) => ({ ...current, publicState: "draft", hidden: true }))}>非公開にする</StaffChoice></div></Field><Field label="メモ"><textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="必要なことだけメモします。" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" /></Field></section><StaffBottomActions saving={uploading} onReset={onReset} /></form>;
}

function AreaList({ visibleAreas, staff, onEdit, onSoftDelete, onHardDelete, query, setQuery, statusFilter, setStatusFilter }: { visibleAreas: ManagedArea[]; staff: StaffMember | null; onEdit: (area: ManagedArea) => void; onSoftDelete: (area: ManagedArea, restore?: boolean) => void; onHardDelete: (area: ManagedArea) => void; query: string; setQuery: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft"><div className="mb-4"><h2 className="text-xl font-black text-ink">エリア</h2></div><div className="grid gap-3 sm:grid-cols-[1fr_180px]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="エリア名で検索" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-bold" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-bold"><option value="all">すべて</option><option value="published">公開中</option><option value="hidden">非公開</option></select></div><div className="mt-4 grid gap-3">{visibleAreas.map((area) => <article key={area.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-3"><div className="flex min-w-0 gap-3"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white">{area.imageUrl ? <img src={area.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[10px] font-black text-slate-400">エリア</div>}</div><div className="min-w-0 flex-1"><p className="break-words text-base font-black text-ink">{area.name}</p><p className="mt-1 text-xs font-bold text-slate-500">商品 {area.foodCount} 件 / 店舗 {area.storeCount} 件</p><p className="mt-1 text-xs font-bold text-slate-600">{areaStatusLabel(area)}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onEdit(area)} className="min-h-11 rounded-full bg-ink px-5 text-xs font-black text-white">編集</button><button type="button" onClick={() => onSoftDelete(area, Boolean(area.deletedAt))} className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">{area.deletedAt ? "元に戻す" : "非公開"}</button>{staff?.role === "owner" && area.deletedAt && area.storeCount === 0 && area.foodCount === 0 ? <button type="button" onClick={() => onHardDelete(area)} className="min-h-11 rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-700">完全削除</button> : null}</div></div></div></article>)}</div></section>;
}

function AreaEditor({ form, setForm, uploading, onUpload, onSubmit, onReset }: { form: AreaForm; setForm: (value: AreaForm | ((current: AreaForm) => AreaForm)) => void; uploading: boolean; onUpload: (file: File | null) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onReset: () => void }) {
  return <form id="staff-area-editor" onSubmit={onSubmit} className="min-w-0 space-y-4 pb-28"><section className="staff-card space-y-4"><h2 className="text-xl font-black text-ink">エリアを編集</h2><Field label="エリア画像"><StaffImagePicker id="area-image" value={form.imageUrl} emptyText="エリアの写真を選んでください" uploading={uploading} onUpload={onUpload} onClear={() => setForm((current) => ({ ...current, imageUrl: "" }))} /></Field><Field label="エリア名"><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="サンフランシスコ・エリア" className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-base font-bold" /></Field><Field label="並び順"><input value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value.replace(/[^0-9]/g, "") }))} inputMode="numeric" className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold" /></Field><Field label="公開状態"><div className="grid gap-2 sm:grid-cols-3"><StaffChoice active={!form.hidden && form.publicState === "published"} onClick={() => setForm((current) => ({ ...current, publicState: "published", hidden: false }))}>公開する</StaffChoice><StaffChoice active={form.hidden || form.publicState !== "published"} onClick={() => setForm((current) => ({ ...current, publicState: "draft", hidden: true }))}>非公開にする</StaffChoice></div></Field></section><StaffBottomActions saving={uploading} onReset={onReset} /></form>;
}

function CollectionList({ visibleCollections, staff, onEdit, onSoftDelete, onHardDelete, query, setQuery, statusFilter, setStatusFilter }: { visibleCollections: ManagedCollection[]; staff: StaffMember | null; onEdit: (collection: ManagedCollection) => void; onSoftDelete: (collection: ManagedCollection, restore?: boolean) => void; onHardDelete: (collection: ManagedCollection) => void; query: string; setQuery: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft"><div className="mb-4"><h2 className="text-xl font-black text-ink">期間限定特集</h2><p className="mt-1 text-sm font-bold text-slate-500">ホーム画面に表示する期間限定の特集を管理します。</p></div><div className="grid gap-3 sm:grid-cols-[1fr_180px]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="特集名で検索" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-bold" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-bold"><option value="all">すべて</option><option value="published">公開中</option><option value="hidden">非公開</option></select></div><div className="mt-4 grid gap-3">{visibleCollections.map((collection) => <article key={collection.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-3"><div className="flex min-w-0 gap-3"><div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white">{collection.imageUrl ? <img src={collection.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[10px] font-black text-slate-400">特集</div>}</div><div className="min-w-0 flex-1"><p className="break-words text-base font-black text-ink">{collection.name}</p><p className="mt-1 text-xs font-bold text-slate-500">{collection.startsOn || "開始日未設定"} から {collection.endsOn || "終了日未設定"}</p><p className="mt-1 text-xs font-bold text-slate-500">掲載商品 {collection.foodCount} 件 / {collection.isFeatured ? "ホーム表示中" : "ホーム非公開"}</p><p className="mt-1 text-xs font-bold text-slate-600">{collectionStatusLabel(collection)}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onEdit(collection)} className="min-h-11 rounded-full bg-ink px-5 text-xs font-black text-white">編集</button><button type="button" onClick={() => onSoftDelete(collection, Boolean(collection.deletedAt))} className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">{collection.deletedAt ? "元に戻す" : "非公開"}</button>{staff?.role === "owner" && collection.deletedAt && collection.foodCount === 0 ? <button type="button" onClick={() => onHardDelete(collection)} className="min-h-11 rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-700">完全削除</button> : null}</div></div></div></article>)}</div></section>;
}

function CollectionEditor({ form, setForm, foods, foodQuery, setFoodQuery, uploading, onUpload, onSubmit, onReset }: { form: CollectionForm; setForm: (value: CollectionForm | ((current: CollectionForm) => CollectionForm)) => void; foods: ManagedFood[]; foodQuery: string; setFoodQuery: (value: string) => void; uploading: boolean; onUpload: (file: File | null) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onReset: () => void }) {
  const foodChoices = foods.filter((food) => !foodQuery || food.name.toLowerCase().includes(foodQuery.toLowerCase())).slice(0, 40);
  const selectedFoods = foods.filter((food) => form.selectedFoodIds.includes(food.id));
  const homeReasons = collectionHomeVisibilityReasons({ publicState: form.publicState, hidden: form.hidden, deletedAt: null, isFeatured: form.isFeatured, foodCount: selectedFoods.length, imageUrl: form.imageUrl, startsOn: form.startsOn, endsOn: form.endsOn });
  return <form id="staff-collection-editor" onSubmit={onSubmit} className="min-w-0 space-y-4 pb-28"><section className="staff-card space-y-4"><h2 className="text-xl font-black text-ink">期間限定特集を編集</h2><Field label="特集名"><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="2026年夏特集" className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-base font-bold" /></Field><Field label="メイン画像"><StaffImagePicker id="collection-image" value={form.imageUrl} emptyText="特集画像を選んでください" uploading={uploading} onUpload={onUpload} onClear={() => setForm((current) => ({ ...current, imageUrl: "" }))} /></Field><Field label="説明"><textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="特集の説明を入力します。" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" /></Field></section><section className="staff-card space-y-4"><h3 className="text-lg font-black text-ink">開催期間</h3><div className="grid gap-3 sm:grid-cols-2"><Field label="開始日"><input type="date" value={form.startsOn} onChange={(event) => setForm((current) => ({ ...current, startsOn: event.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold" /></Field><Field label="終了日"><input type="date" value={form.endsOn} onChange={(event) => setForm((current) => ({ ...current, endsOn: event.target.value }))} className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold" /></Field></div></section><section className="staff-card space-y-4"><h3 className="text-lg font-black text-ink">掲載する商品</h3><input value={foodQuery} onChange={(event) => setFoodQuery(event.target.value)} placeholder="商品名で検索" className="h-12 w-full rounded-2xl border border-slate-200 px-3 text-sm font-bold" />{selectedFoods.length ? <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-black text-slate-500">選択済み商品 {selectedFoods.length}件</p><div className="mt-2 flex flex-wrap gap-2">{selectedFoods.map((food) => <button key={food.id} type="button" onClick={() => setForm((current) => ({ ...current, selectedFoodIds: current.selectedFoodIds.filter((id) => id !== food.id) }))} className="min-h-10 rounded-full bg-white px-3 text-xs font-black text-ink">{food.name} を外す</button>)}</div></div> : null}<div className="max-h-72 space-y-2 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-2">{foodChoices.map((food) => <label key={food.id} className="flex min-w-0 items-center gap-3 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={form.selectedFoodIds.includes(food.id)} onChange={(event) => setForm((current) => ({ ...current, selectedFoodIds: event.target.checked ? Array.from(new Set([...current.selectedFoodIds, food.id])) : current.selectedFoodIds.filter((id) => id !== food.id) }))} />{food.imageUrl ? <img src={food.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" /> : null}<span className="min-w-0 flex-1 break-words">{food.name}</span></label>)}</div></section><section className="staff-card space-y-4"><h3 className="text-lg font-black text-ink">ホーム画面への表示</h3><label className="flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-black text-ink"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} />ホーム画面に表示する</label><div className={"rounded-2xl p-3 text-sm font-bold leading-6 " + (homeReasons.length === 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}><p className="font-black">{homeReasons.length === 0 ? "ホームに表示されます" : "ホームに表示されません"}</p>{homeReasons.length ? <ul className="mt-1 list-disc space-y-1 pl-5">{homeReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : null}</div><Field label="公開状態"><div className="grid gap-2 sm:grid-cols-3"><StaffChoice active={!form.hidden && form.publicState === "published"} onClick={() => setForm((current) => ({ ...current, publicState: "published", hidden: false }))}>公開する</StaffChoice><StaffChoice active={form.hidden || form.publicState !== "published"} onClick={() => setForm((current) => ({ ...current, publicState: "draft", hidden: true }))}>非公開にする</StaffChoice></div></Field></section><StaffBottomActions saving={uploading} onReset={onReset} /></form>;
}

function OperatorsSection({ staff, staffRows, inviteEmail, setInviteEmail, inviteDisplayName, setInviteDisplayName, inviteRole, setInviteRole, inviteLink, inviteBusyMode, onCopyInviteLink, onCloseInviteLink, onInvite, onRole, onActive }: { staff: StaffMember | null; staffRows: StaffMember[]; inviteEmail: string; setInviteEmail: (value: string) => void; inviteDisplayName: string; setInviteDisplayName: (value: string) => void; inviteRole: StaffMember["role"]; setInviteRole: (value: StaffMember["role"]) => void; inviteLink: InviteLinkState | null; inviteBusyMode: StaffInviteMode | null; onCopyInviteLink: () => void; onCloseInviteLink: () => void; onInvite: (event: FormEvent<HTMLFormElement>) => void; onRole: (userId: string, role: StaffMember["role"]) => void; onActive: (userId: string, active: boolean) => void }) {
  if (staff?.role !== "owner") return <StaffPanel title="管理者専用" description="家族の追加、利用停止、権限変更は管理者だけが実行できます。" />;
  return <div className="grid gap-5 lg:grid-cols-[380px_1fr]"><form onSubmit={onInvite} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"><h2 className="text-xl font-black text-ink">家族を追加</h2><p className="mt-2 text-sm font-bold leading-6 text-slate-500">招待リンクを作成して、LINEなどで本人へ送れます。</p><div className="mt-4 space-y-3"><Field label="メールアドレス"><input required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" /></Field><Field label="名前"><input value={inviteDisplayName} onChange={(event) => setInviteDisplayName(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold" /></Field><Field label="権限"><select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as StaffMember["role"])} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold"><option value="editor">編集できる人</option></select></Field><button type="submit" data-mode="link" disabled={Boolean(inviteBusyMode)} className="min-h-12 w-full rounded-full bg-ink text-sm font-black text-white disabled:opacity-60">{inviteBusyMode === "link" ? "招待リンクを作成しています" : "招待リンクを作成"}</button><button type="submit" data-mode="email" disabled={Boolean(inviteBusyMode)} className="min-h-12 w-full rounded-full border border-slate-200 bg-white text-sm font-black text-ink disabled:opacity-60">{inviteBusyMode === "email" ? "招待メールを送っています" : "招待メールを送る"}</button></div>{inviteLink ? <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-3"><p className="text-sm font-black text-sky-950">招待リンクを作成しました</p><p className="mt-1 text-xs font-bold leading-5 text-sky-900">このリンクをLINEなどで本人へ送ってください。リンクはこの画面でのみ確認できます。</p><textarea readOnly value={inviteLink.url} className="mt-3 h-24 w-full resize-none rounded-xl border border-sky-100 bg-white p-3 text-xs font-bold text-ink" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={onCopyInviteLink} className="min-h-10 rounded-full bg-park px-4 text-xs font-black text-white">リンクをコピー</button><button type="button" onClick={onCloseInviteLink} className="min-h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">閉じる</button></div></div> : null}</form><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"><h2 className="text-xl font-black text-ink">家族追加</h2><div className="mt-4 space-y-3">{staffRows.map((row) => { const isSelf = row.user_id === staff?.user_id; return <article key={row.user_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-black text-ink">{row.display_name || row.email || "名前未設定"}</p><p className="mt-1 break-all text-xs font-bold text-slate-600">{row.email || "メール未設定"}</p><p className="mt-2 text-xs font-bold text-slate-500">{roleLabel(row.role)} / {row.is_active ? "利用中" : "停止中"}</p><div className="mt-3 flex flex-wrap gap-2"><select disabled={isSelf} value={row.role} onChange={(event) => onRole(row.user_id, event.target.value as StaffMember["role"])} className="h-10 rounded-full border border-slate-200 px-3 text-xs font-black disabled:opacity-50"><option value="editor">編集できる人</option><option value="owner">管理者</option></select><button disabled={isSelf} onClick={() => onActive(row.user_id, !row.is_active)} className="min-h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink disabled:opacity-50">{row.is_active ? "利用を停止" : "利用を再開"}</button>{isSelf ? <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-500">本人は停止できません</span> : null}</div></article>; })}</div></div></div>;
}

function AuditSection({ staff, logs }: { staff: StaffMember | null; logs: AuditLog[] }) {
  if (staff?.role !== "owner") return <StaffPanel title="管理者専用" description="操作履歴の確認は管理者だけが実行できます。" />;
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"><h2 className="text-xl font-black text-ink">操作履歴</h2><p className="mt-1 text-sm font-bold text-slate-500">誰が、いつ、何を変更したか確認できます。</p><div className="mt-4 space-y-2">{logs.map((log, index) => <article key={String(log.id ?? index)} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">{formatDateTime(String(log.created_at ?? ""))}</p><p className="mt-1 text-sm font-black text-ink">{auditActorLabel(log)}</p><p className="mt-1 text-sm font-bold leading-6 text-slate-700">{auditTargetLabel(log)}{auditActionLabel(log)}</p></article>)}</div></div>;
}

type StaffInviteErrorPayload = {
  error?: string;
  providerMessage?: string;
  providerCode?: string;
  canCreateLink?: boolean;
  currentLevel?: string;
  accessTokenAal?: string | null;
  status?: number;
  statusText?: string;
  reason?: string;
};

async function readFunctionErrorPayload(error: unknown): Promise<StaffInviteErrorPayload | null> {
  const context = (error as { context?: Response }).context;
  if (!context) return null;
  const base = { status: context.status, statusText: context.statusText };
  try {
    return { ...base, ...await context.clone().json() as StaffInviteErrorPayload };
  } catch {
    return base;
  }
}

function inviteErrorSuffix(payload: StaffInviteErrorPayload | null) {
  const parts = [payload?.status ? "HTTP " + payload.status : null, payload?.error ? "code: " + payload.error : null].filter(Boolean);
  return parts.length ? "（" + parts.join(" / ") + "）" : "";
}

function staffInviteErrorMessage(payload: StaffInviteErrorPayload | null, mode: StaffInviteMode) {
  const linkHint = "招待リンクを作成して、LINEなどで本人へ送ってください。";
  const suffix = inviteErrorSuffix(payload);
  switch (payload?.error) {
    case "email_not_authorized":
      return "現在のメール送信設定では、このアドレスへ招待メールを送れません。" + linkHint + suffix;
    case "rate_limited":
      return (mode === "email" ? "招待メールの送信回数が一時的に上限に達しています。" + linkHint : "招待リンクの作成回数が一時的に上限に達しています。時間を置いてもう一度お試しください。") + suffix;
    case "user_already_registered":
      return "このメールアドレスはすでに登録されています。必要に応じて招待リンクを作成してください。" + suffix;
    case "invalid_email":
      return "メールアドレスの形式を確認してください。" + suffix;
    case "smtp_unavailable":
      return "現在のメール送信設定では招待メールを送れません。" + linkHint + suffix;
    case "mfa_required":
      return STAFF_MFA_REQUIRED_MESSAGE + suffix;
    case "owner_required":
      return "この操作は管理者だけが実行できます。" + suffix;
    case "owner_row_missing":
      return "管理者情報の対応付けが見つかりません。管理者設定を確認してください。" + suffix;
    case "owner_uid_mismatch":
      return "管理者情報の対応付けに問題があります。管理者設定を確認してください。" + suffix;
    case "owner_inactive":
      return "この管理者アカウントは停止されています。" + suffix;
    case "owner_role_mismatch":
      return "この操作は管理者だけが実行できます。" + suffix;
    case "multiple_owner_rows":
      return "管理者情報が重複しています。安全のため招待を停止しました。" + suffix;
    case "owner_lookup_failed":
      return "管理者情報を確認できませんでした。時間を置いてもう一度お試しください。" + suffix;
    case "staff_upsert_failed":
      return "家族の登録情報を保存できませんでした。時間を置いてもう一度お試しください。" + suffix;
    case "existing_owner_not_changed":
      return "このメールアドレスは管理者として登録済みです。権限は変更しませんでした。" + suffix;
    default:
      return (mode === "email" ? "招待メールを送信できませんでした。" + linkHint : "招待リンクを作成できませんでした。時間を置いてもう一度お試しください。") + suffix;
  }
}

function auditActionLabel(log: AuditLog) {
  const action = String(log.action ?? log.operation ?? "変更").toLowerCase();
  if (action.includes("insert") || action.includes("create") || action.includes("add")) return "を追加";
  if (action.includes("delete") || action.includes("remove")) return "を削除";
  if (action.includes("restore")) return "を元に戻す";
  if (action.includes("hidden") || action.includes("unpublish")) return "を非公開";
  if (action.includes("invite")) return "を追加";
  return "を編集";
}

function auditActorLabel(log: AuditLog) {
  return String(log.actor_name ?? log.actor_email ?? log.email ?? log.user_email ?? "家族追加");
}

function auditTargetLabel(log: AuditLog) {
  const after = (log.after ?? log.new_record ?? {}) as Record<string, unknown>;
  const before = (log.before ?? log.old_record ?? {}) as Record<string, unknown>;
  return "「" + String(after.name ?? before.name ?? log.target_name ?? "対象") + "」";
}

function StaffEditHeader({ title, targetName, status, backHref, formId }: { title: string; targetName: string; status: string; backHref: string; formId: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-soft"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black text-park">編集画面</p><h1 className="mt-1 text-2xl font-black text-ink">{title}</h1><p className="mt-2 break-words text-sm font-bold leading-6 text-slate-600">{targetName}</p><span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{status}</span></div><div className="flex flex-wrap gap-2"><Link href="/staff" className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">管理トップへ</Link><Link href={backHref} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">一覧へ戻る</Link><button type="submit" form={formId} className="min-h-11 rounded-full bg-park px-5 text-xs font-black text-white">保存する</button></div></div></div>;
}

function StaffAddFab({ open, setOpen, onNew }: { open: boolean; setOpen: (value: boolean) => void; onNew: (kind: StaffEditorKind) => void }) {
  const items: Array<[StaffEditorKind, string]> = [["foods", "商品を追加"], ["stores", "店舗を追加"], ["areas", "エリアを追加"], ["collections", "特集を追加"]];
  return <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">{open ? <div className="w-[min(13rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-2 shadow-soft">{items.map(([kind, label]) => <button key={kind} type="button" onClick={() => { setOpen(false); onNew(kind); }} className="block min-h-12 w-full rounded-2xl px-4 text-left text-sm font-black text-ink hover:bg-slate-50">{label}</button>)}</div> : null}<button type="button" onClick={() => setOpen(!open)} className="min-h-14 rounded-full bg-park px-6 text-base font-black text-white shadow-soft">＋追加</button></div>;
}

function StaffPanel({ title, description, children, onLogout }: { title: string; description: string; children?: ReactNode; onLogout?: () => void }) {
  return <div className="staff-console mx-auto max-w-xl min-w-0 overflow-x-clip rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"><div className="staff-panel-header flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-black text-park">運営者専用</p><h1 className="mt-2 text-2xl font-black text-ink">{title}</h1><p className="mt-3 text-sm font-bold leading-6 text-slate-500">{description}</p></div>{onLogout ? <button onClick={onLogout} className="min-h-11 rounded-full border border-slate-200 px-4 text-xs font-black text-ink">ログアウト</button> : null}</div>{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block min-w-0 text-xs font-black text-slate-600"><span className="mb-1 block">{label}</span>{children}</label>; }
function Message({ text }: { text: string }) { return <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-bold leading-6 text-sky-900">{text}</div>; }

function StaffAuthDebugPanel({ snapshot }: { snapshot: StaffAuthDebugSnapshot }) {
  const rows: Array<[string, string]> = [
    ["currentLevel", snapshot.currentLevel],
    ["nextLevel", snapshot.nextLevel],
    ["verified TOTP", String(snapshot.verifiedTotpFactors)],
    ["session", snapshot.hasSession ? "あり" : "なし"],
    ["access token aal", snapshot.accessTokenAal ?? "なし"],
    ["session保存先", snapshot.storage],
    ["最終認証イベント", snapshot.lastAuthEvent]
  ];
  return <details className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-950"><summary className="cursor-pointer text-sm font-black">本人確認の状態（安全診断）</summary><dl className="mt-3 grid gap-2 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-white/70 p-2"><dt className="text-[11px] font-black text-amber-700">{label}</dt><dd className="mt-1 break-words font-black text-ink">{value}</dd></div>)}</dl><p className="mt-3 text-[11px] font-bold text-amber-800">token本体、認証コード、秘密鍵、招待リンクは表示していません。</p></details>;
}

function buildManagedFoods(generatedFoods: GeneratedFood[], manualFoods: ManualFood[], overrides: FoodOverride[], metadata: PublicationMetadata[]): ManagedFood[] {
  const overrideByFoodId = new Map(overrides.map((override) => [String(override.food_id), override]));
  const metadataByFoodId = new Map(metadata.map((item) => [item.food_id, item]));
  const generated = generatedFoods.map((food): ManagedFood => { const override = overrideByFoodId.get(food.id) ?? {}; const reviewStatus = (metadataByFoodId.get(food.id)?.review_status ?? override.review_status ?? food.reviewStatus ?? "approved") as ManagedFood["reviewStatus"]; const hidden = Boolean(override.hidden ?? food.hidden); const deletedAt = override.is_deleted ? (override.deleted_at ?? new Date().toISOString()) : (override.deleted_at ?? food.deletedAt ?? null); return { sourceKind: "generated", id: food.id, name: String(override.name ?? food.name), nameEn: String(override.name_en ?? food.nameEn ?? ""), price: override.price ?? food.price ?? null, areaId: override.area_id ?? food.areaId ?? null, areaName: String(override.area_name ?? food.areaName), shopId: override.shop_id ?? food.shopId ?? null, shopName: String(override.shop_name ?? food.shopName), category: String(override.category ?? food.category ?? "unknown"), categoryTags: Array.isArray(override.category_tags) ? override.category_tags.map(String) : Array.isArray(food.categoryTags) ? food.categoryTags.map(String) : [], saleStatus: (override.sale_status ?? food.saleStatus ?? "unknown") as SaleStatus, publicState: hidden || deletedAt ? "draft" : (reviewStatus === "approved" ? "published" : "draft"), reviewStatus, hidden, deletedAt, imageUrl: String(override.image_path ?? food.imageUrl ?? ""), sourceUrl: String(override.image_source_url ?? override.info_source_url ?? food.sourceUrl ?? ""), startDate: String(override.start_date ?? food.startDate ?? ""), endDate: String(override.end_date ?? food.endDate ?? ""), adminNotes: String(override.admin_notes ?? ""), updatedAt: String(override.updated_at ?? food.updatedAt ?? ""), version: null }; });
  const manual = manualFoods.map((food): ManagedFood => { const meta = metadataByFoodId.get(food.id); return { sourceKind: "manual", id: food.id, name: food.name, nameEn: food.name_en ?? "", price: food.price ?? null, areaId: null, areaName: food.area_name, shopId: null, shopName: food.shop_name, category: food.category, categoryTags: Array.isArray(food.category_tags) ? food.category_tags.map(String) : [], saleStatus: (food.sale_status ?? "unknown") as SaleStatus, publicState: (food.public_state ?? "draft") as PublicState, reviewStatus: (meta?.review_status ?? "pending") as ManagedFood["reviewStatus"], hidden: Boolean(food.hidden), deletedAt: food.deleted_at ?? null, imageUrl: food.image_url ?? "", sourceUrl: food.source_url ?? "", startDate: food.start_date ?? "", endDate: food.end_date ?? "", adminNotes: food.admin_notes ?? "", updatedAt: food.updated_at ?? null, version: food.version ?? null }; });
  const manualIds = new Set(manual.map((food) => food.id));
  return [...manual, ...generated.filter((food) => !manualIds.has(food.id))].sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")) || a.name.localeCompare(b.name, "ja"));
}

function buildManagedStores(generatedShops: GeneratedShop[], staffShops: StaffShop[], links: FoodStoreLink[], foods: ManagedFood[]) {
  const staffById = new Map(staffShops.map((shop) => [String(shop.id), shop]));
  const generated = generatedShops.map((shop) => ({ id: shop.id, name: shop.name, areaId: shop.areaId, areaName: shop.areaName, shopType: shop.shopType, imageUrl: "", publicState: shop.isActive ? "published" as PublicState : "draft" as PublicState, businessStatus: shop.isActive ? "active" as BusinessStatus : "unknown" as BusinessStatus, hidden: false, deletedAt: null as string | null, officialUrl: shop.officialUrl, isActive: shop.isActive, linkedCount: 0, publicLinkedCount: 0 }));
  const staffOnly = staffShops.map((shop) => ({ id: String(shop.id), name: String(shop.name), areaId: shop.area_id ?? null, areaName: String(shop.area_name ?? "エリア確認中"), shopType: (shop.shop_type ?? "unknown") as ShopType, imageUrl: String(shop.image_url ?? ""), publicState: (shop.public_state ?? "draft") as PublicState, businessStatus: (shop.business_status ?? "unknown") as BusinessStatus, hidden: Boolean(shop.hidden), deletedAt: shop.deleted_at ?? null, officialUrl: shop.official_url ?? null, isActive: shop.public_state === "published" && !shop.hidden && !shop.deleted_at, linkedCount: 0, publicLinkedCount: 0 }));
  const byId = new Map<string, (typeof generated)[number]>();
  for (const store of generated) byId.set(store.id, store);
  for (const store of staffOnly) byId.set(store.id, { ...(byId.get(store.id) ?? store), ...store });
  for (const link of links.filter((item) => !item.deleted_at)) { const store = byId.get(String(link.shop_id)); if (!store) continue; store.linkedCount += 1; const food = foods.find((item) => item.id === link.food_id); if (food?.publicState === "published" && !food.hidden && !food.deletedAt) store.publicLinkedCount += 1; }
  for (const food of foods) { const candidateId = food.shopId ?? ""; if (!candidateId) continue; const staffOverride = staffById.get(candidateId); if (!byId.has(candidateId) && staffOverride) continue; const store = byId.get(candidateId); if (store && !links.some((link) => link.shop_id === candidateId && link.food_id === food.id && !link.deleted_at)) { store.linkedCount += 1; if (food.publicState === "published" && !food.hidden && !food.deletedAt) store.publicLinkedCount += 1; } }
  return Array.from(byId.values()).sort((a, b) => a.areaName.localeCompare(b.areaName, "ja") || a.name.localeCompare(b.name, "ja"));
}

function buildManagedAreas(generatedAreas: AreaOption[], staffAreas: StaffArea[], stores: ManagedStore[], foods: ManagedFood[]) {
  const byId = new Map<string, { id: string; name: string; nameEn: string; description: string; imageUrl: string; publicState: PublicState; hidden: boolean; deletedAt: string | null; sortOrder: number; storeCount: number; foodCount: number }>();
  for (const area of generatedAreas) byId.set(area.id, { id: area.id, name: area.name, nameEn: "", description: "", imageUrl: "", publicState: "published", hidden: false, deletedAt: null, sortOrder: area.sortOrder ?? 1000, storeCount: 0, foodCount: 0 });
  for (const row of staffAreas) byId.set(String(row.id), { id: String(row.id), name: String(row.name ?? row.id), nameEn: String(row.name_en ?? ""), description: String(row.description ?? ""), imageUrl: String(row.image_url ?? ""), publicState: (row.public_state ?? "draft") as PublicState, hidden: Boolean(row.hidden), deletedAt: row.deleted_at ?? null, sortOrder: Number(row.sort_order ?? 1000), storeCount: 0, foodCount: 0 });
  for (const store of stores) {
    const key = store.areaId || buildStaffAreaId(store.areaName);
    const existing = byId.get(key) ?? { id: key, name: store.areaName, nameEn: "", description: "", imageUrl: "", publicState: "published" as PublicState, hidden: false, deletedAt: null as string | null, sortOrder: 1000, storeCount: 0, foodCount: 0 };
    existing.storeCount += 1;
    byId.set(key, existing);
  }
  for (const food of foods.filter((item) => !item.deletedAt)) {
    const key = food.areaId || buildStaffAreaId(food.areaName);
    const existing = byId.get(key) ?? { id: key, name: food.areaName, nameEn: "", description: "", imageUrl: "", publicState: "published" as PublicState, hidden: false, deletedAt: null as string | null, sortOrder: 1000, storeCount: 0, foodCount: 0 };
    existing.foodCount += 1;
    byId.set(key, existing);
  }
  return Array.from(byId.values()).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

function buildManagedCollections(collectionRows: CollectionRow[], memberships: FoodMembership[], foods: ManagedFood[]) {
  const foodById = new Map(foods.map((food) => [food.id, food]));
  const membershipCount = new Map<string, number>();
  for (const membership of memberships) {
    const food = foodById.get(membership.food_id);
    if (food?.deletedAt) continue;
    membershipCount.set(membership.collection_id, (membershipCount.get(membership.collection_id) ?? 0) + 1);
  }
  const rows = collectionRows.length ? collectionRows : [{ id: "summer-2026", name: "2026夏限定", sort_order: 1000, public_state: "published" }];
  return rows.map((row) => ({ id: String(row.id), name: String(row.name ?? row.id), nameEn: String(row.name_en ?? ""), description: String(row.description ?? ""), imageUrl: String(row.image_url ?? ""), publicState: (row.public_state ?? "published") as PublicState, hidden: Boolean(row.hidden), deletedAt: row.deleted_at ?? null, sortOrder: Number(row.sort_order ?? 1000), startsOn: String(row.starts_on ?? ""), endsOn: String(row.ends_on ?? ""), isFeatured: Boolean(row.is_featured ?? true), foodCount: membershipCount.get(String(row.id)) ?? 0 })).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

function foodStatusLabel(food: ManagedFood) { if (food.deletedAt) return "削除済み"; if (food.hidden) return "非公開"; return food.publicState === "published" ? "公開中" : "非公開"; }
function storeStatusLabel(store: ManagedStore) { if (store.deletedAt) return "削除済み"; if (store.hidden) return "非公開"; return store.publicState === "published" ? "公開中" : "非公開"; }
function areaStatusLabel(area: ManagedArea) { if (area.deletedAt) return "削除済み"; if (area.hidden) return "非公開"; return area.publicState === "published" ? "公開中" : "非公開"; }
function collectionStatusLabel(collection: ManagedCollection) { if (collection.deletedAt) return "削除済み"; if (collection.hidden) return "非公開"; return collection.publicState === "published" ? "公開中" : "非公開"; }
function emptyToNull(value: string | null | undefined) { const trimmed = String(value ?? "").trim(); return trimmed === "" ? null : trimmed; }
function normalizeFoodName(value: string) { return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ja-JP"); }
function buildStaffManualFoodId(areaName: string, shopName: string, name: string) { return `food-manual-${hashText(`${areaName}:${shopName}:${name}`)}`; }
function buildStaffStoreId(areaName: string, name: string) { return `staff-shop-${hashText(`${areaName}:${name}`)}`; }
function buildStaffAreaId(name: string) { return `staff-area-${hashText(name)}`; }
function buildStaffCollectionId(name: string) { return `staff-collection-${hashText(name)}`; }
function hashText(value: string) { let hash = 0; for (let i = 0; i < value.length; i += 1) hash = Math.imul(31, hash) + value.charCodeAt(i) | 0; return Math.abs(hash).toString(36); }
