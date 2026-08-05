"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Album, CalendarDays, Check, ChevronRight, Home, Map as MapIcon, Search, Settings, Share2, Star, Utensils } from "lucide-react";
import { calculateAreaProgressList } from "@/lib/area-progress";
import { formatFoodPrice, getSaleStatusLabel, calculateCompletion, dedupeFoodsByCanonical, getCanonicalFoodKey } from "@/lib/food-utils";
import { impactLight, notifySuccess, notifyWarning, selectionChanged } from "@/lib/ios/native";
import { addNetworkListener, getNetworkOnline, readOfflineSnapshot, saveOfflineSnapshot } from "@/lib/ios/offline-snapshot";
import { deletePhotosNotUsed, getPhotoDataUrl, pickAndStoreFoodPhotos } from "@/lib/ios/photo-store";
import { createShareCard, shareCardDataUrl } from "@/lib/ios/share-card";
import { getFoodImage } from "@/lib/utils/image";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { Area, FoodCategory, FoodCollection, FoodWithRelations, UserFoodLog } from "@/types/domain";

type TabKey = "home" | "search" | "record" | "album" | "park";
type AlbumMode = "all" | "area" | "shop" | "event";
type RecordDraft = {
  food: FoodWithRelations;
  log?: UserFoodLog;
  eatenAt: string;
  rating?: number;
  memo: string;
  spentAmount?: number;
  shopId?: string;
  photoIds: string[];
};

type DetailRecord = { food: FoodWithRelations; log: UserFoodLog };

const categoryLabels: Record<FoodCategory, string> = {
  churro: "チュリトス",
  popcorn: "ポップコーン",
  drink: "ドリンク",
  dessert: "スイーツ",
  burger: "バーガー",
  pizza: "ピザ",
  chicken: "チキン",
  rice: "ライス",
  noodle: "麺・パスタ",
  snack: "スナック",
  kids: "キッズ",
  seasonal: "期間限定",
  set: "セット",
  unknown: "その他"
};

export function IosNativeApp({ foods, activeCollectionFoods, collections, areas }: { foods: FoodWithRelations[]; activeCollectionFoods: FoodWithRelations[]; collections: FoodCollection[]; areas: Area[] }) {
  const { logs, ready, error, updateEatenDetails } = useFoodLogs();
  const [tab, setTab] = useState<TabKey>("home");
  const [query, setQuery] = useState("");
  const [albumMode, setAlbumMode] = useState<AlbumMode>("all");
  const [recordDraft, setRecordDraft] = useState<RecordDraft | null>(null);
  const [detailRecord, setDetailRecord] = useState<DetailRecord | null>(null);
  const [shareRecord, setShareRecord] = useState<DetailRecord | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [snapshotSavedAt, setSnapshotSavedAt] = useState<string | null>(null);
  const [snapshotFoods, setSnapshotFoods] = useState<FoodWithRelations[]>(foods);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void saveOfflineSnapshot({ foods, areas, collections }).then(() => setSnapshotSavedAt(new Date().toISOString())).catch(() => undefined);
    void readOfflineSnapshot().then((snapshot) => {
      if (snapshot && foods.length === 0) setSnapshotFoods(snapshot.foods);
      if (snapshot?.savedAt) setSnapshotSavedAt(snapshot.savedAt);
    });
    void getNetworkOnline().then(setOnline);
    let cleanup: () => void = () => undefined;
    void addNetworkListener(setOnline).then((dispose) => { cleanup = dispose; });
    return () => cleanup();
  }, [areas, collections, foods]);

  const effectiveFoods = snapshotFoods.length > 0 ? snapshotFoods : foods;
  const canonicalFoods = useMemo(() => dedupeFoodsByCanonical(effectiveFoods), [effectiveFoods]);
  const completion = useMemo(() => calculateCompletion(effectiveFoods, logs), [effectiveFoods, logs]);
  const totalSpend = useMemo(() => logs.reduce((sum, log) => sum + (typeof log.spentAmount === "number" ? log.spentAmount : 0), 0), [logs]);
  const records = useMemo(() => logs.filter((log) => log.status === "eaten").map((log) => ({ log, food: findFood(effectiveFoods, canonicalFoods, log.foodId) })).filter((item): item is DetailRecord => Boolean(item.food)).sort((a, b) => (b.log.eatenAt ?? "").localeCompare(a.log.eatenAt ?? "")), [canonicalFoods, effectiveFoods, logs]);
  const filteredFoods = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return canonicalFoods.filter((food) => {
      if (!normalized) return true;
      return [food.name, food.shop.name, food.area.name, categoryLabels[food.category]].join(" ").toLowerCase().includes(normalized);
    }).slice(0, 80);
  }, [canonicalFoods, query]);

  const openRecord = (food: FoodWithRelations, log?: UserFoodLog) => {
    setRecordDraft({
      food,
      log,
      eatenAt: (log?.eatenAt ?? new Date().toISOString()).slice(0, 10),
      rating: log?.rating,
      memo: log?.memo ?? "",
      spentAmount: log?.spentAmount ?? food.priceMin ?? food.price,
      shopId: log?.shopId ?? food.locations?.[0]?.shopId ?? food.shopId,
      photoIds: log?.photoIds ?? []
    });
  };

  const closeRecord = () => setRecordDraft(null);
  const saveDraft = async (draft: RecordDraft) => {
    updateEatenDetails(draft.food.id, {
      rating: draft.rating,
      memo: draft.memo || undefined,
      eatenAt: new Date(`${draft.eatenAt}T12:00:00`).toISOString(),
      spentAmount: draft.spentAmount,
      photoIds: draft.photoIds,
      shopId: draft.shopId
    });
    await notifySuccess();
    setToast("保存しました");
    window.setTimeout(() => setToast(null), 1800);
    setRecordDraft(null);
    setDetailRecord({ food: draft.food, log: { foodId: draft.food.id, status: "eaten", eatenAt: new Date(`${draft.eatenAt}T12:00:00`).toISOString(), spentAmount: draft.spentAmount, rating: draft.rating, memo: draft.memo, photoIds: draft.photoIds, shopId: draft.shopId, updatedAt: new Date().toISOString() } });
    setTab("album");
  };

  const deleteRecord = async (record: DetailRecord) => {
    if (!window.confirm("この記録を削除しますか？\n記録に保存した写真も削除されます。")) return;
    const remainingLogs = logs.filter((log) => !(log.foodId === record.log.foodId && log.status === "eaten"));
    await deletePhotosNotUsed(record.log.photoIds ?? [], remainingLogs);
    window.localStorage.setItem("uniba-food-logs-v1", JSON.stringify(remainingLogs));
    await notifyWarning();
    window.location.reload();
  };

  return (
    <div className="ios-native-shell min-h-dvh bg-[#fffaf5] text-ink">
      {!online ? <div className="ios-offline-banner">オフライン表示中。保存済みの情報を表示しています</div> : null}
      <div className="ios-ipad-layout">
        <aside className="ios-sidebar">
          <div className="ios-sidebar-brand">ユニコレ</div>
          <button onClick={() => switchTab("home", setTab)} className={sidebarClass(tab === "home")}><Home size={18} />ホーム</button>
          <button onClick={() => switchTab("search", setTab)} className={sidebarClass(tab === "search")}><Search size={18} />さがす</button>
          <button onClick={() => switchTab("album", setTab)} className={sidebarClass(tab === "album")}><Album size={18} />アルバム</button>
          <button onClick={() => switchTab("park", setTab)} className={sidebarClass(tab === "park")}><MapIcon size={18} />パーク</button>
          <button onClick={() => setSettingsOpen(true)} className="ios-sidebar-button"><Settings size={18} />設定</button>
          <button onClick={() => { setTab("record"); void impactLight(); }} className="ios-sidebar-record">＋ 記録を追加</button>
        </aside>
        <main className="ios-native-main">
          {tab === "home" ? <HomeTab records={records} completion={completion} totalSpend={totalSpend} foods={canonicalFoods} activeCollectionFoods={activeCollectionFoods} collections={collections} onOpenRecord={setDetailRecord} onOpenFood={openRecord} onSettings={() => setSettingsOpen(true)} /> : null}
          {tab === "search" ? <SearchTab foods={filteredFoods} query={query} setQuery={setQuery} logs={logs} onOpenRecord={openRecord} /> : null}
          {tab === "record" ? <RecordPickTab foods={filteredFoods} query={query} setQuery={setQuery} logs={logs} onOpenRecord={openRecord} /> : null}
          {tab === "album" ? <AlbumTab records={records} foods={effectiveFoods} mode={albumMode} setMode={setAlbumMode} completion={completion} totalSpend={totalSpend} onOpenRecord={setDetailRecord} onOpenAdd={() => setTab("record")} /> : null}
          {tab === "park" ? <ParkTab foods={canonicalFoods} areas={areas} collections={collections} onOpenRecord={openRecord} /> : null}
          {ready || !error ? null : <p className="ios-error">端末内の記録を読み込めませんでした。</p>}
        </main>
      </div>
      <nav className="ios-tabbar" aria-label="iOSアプリのタブ">
        <TabButton active={tab === "home"} icon={<Home size={19} />} label="ホーム" onClick={() => switchTab("home", setTab)} />
        <TabButton active={tab === "search"} icon={<Search size={19} />} label="さがす" onClick={() => switchTab("search", setTab)} />
        <button type="button" className="ios-record-tab" onClick={() => switchTab("record", setTab)}><span>＋</span><strong>記録</strong></button>
        <TabButton active={tab === "album"} icon={<Album size={19} />} label="アルバム" onClick={() => switchTab("album", setTab)} />
        <TabButton active={tab === "park"} icon={<MapIcon size={19} />} label="パーク" onClick={() => switchTab("park", setTab)} />
      </nav>
      {recordDraft ? <RecordSheet draft={recordDraft} setDraft={setRecordDraft} onClose={closeRecord} onSave={saveDraft} /> : null}
      {detailRecord ? <RecordDetail record={detailRecord} completionRate={completion.rate} onClose={() => setDetailRecord(null)} onEdit={() => openRecord(detailRecord.food, detailRecord.log)} onDelete={() => deleteRecord(detailRecord)} onShare={() => setShareRecord(detailRecord)} /> : null}
      {shareRecord ? <SharePreview record={shareRecord} completionRate={completion.rate} onClose={() => setShareRecord(null)} /> : null}
      {settingsOpen ? <SettingsPanel snapshotSavedAt={snapshotSavedAt} onClose={() => setSettingsOpen(false)} /> : null}
      {toast ? <div className="ios-toast">{toast}</div> : null}
    </div>
  );
}

function switchTab(tab: TabKey, setTab: (tab: TabKey) => void) {
  setTab(tab);
  void impactLight();
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" className={`ios-tab ${active ? "is-active" : ""}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function HomeTab({ records, completion, totalSpend, foods, activeCollectionFoods, collections, onOpenRecord, onOpenFood, onSettings }: { records: DetailRecord[]; completion: { eaten: number; total: number; rate: number }; totalSpend: number; foods: FoodWithRelations[]; activeCollectionFoods: FoodWithRelations[]; collections: FoodCollection[]; onOpenRecord: (record: DetailRecord) => void; onOpenFood: (food: FoodWithRelations) => void; onSettings: () => void }) {
  const recentFoods = foods.slice(0, 8);
  return <div className="ios-screen"><div className="ios-topbar"><h1>ユニコレ</h1><button type="button" onClick={onSettings} aria-label="設定"><Settings size={20} /></button></div><div className="ios-stat-grid"><Stat label="食べた数" value={`${completion.eaten}品`} /><Stat label="達成率" value={`${completion.rate}%`} /><Stat label="合計金額" value={totalSpend ? `¥${totalSpend.toLocaleString("ja-JP")}` : "未記録"} /></div><SectionTitle title="最近の記録" />{records.length ? <div className="ios-horizontal-cards">{records.slice(0, 8).map((record) => <RecordMini key={`${record.log.foodId}-${record.log.eatenAt}`} record={record} onClick={() => onOpenRecord(record)} />)}</div> : <Empty title="最初の1品を記録しよう" cta="商品をさがす" /> }<SectionTitle title="新着・販売中の商品" /> <div className="ios-food-list compact">{recentFoods.slice(0, 5).map((food) => <FoodRow key={food.id} food={food} eaten={false} onRecord={() => onOpenFood(food)} />)}</div><SectionTitle title="期間限定イベント" /> <div className="ios-event-grid">{collections.filter((collection) => collection.isFeatured).slice(0, 2).map((collection) => <article key={collection.id} className="ios-event-card"><img src={collection.imageUrl || activeCollectionFoods[0]?.images[0]?.imageUrl || getFoodImage(activeCollectionFoods[0] ?? foods[0])} alt="" /><div><strong>{collection.name}</strong><span>{collection.endsOn ? `${collection.endsOn}まで` : "開催中"}</span></div></article>)}</div></div>;
}

function SearchTab({ foods, query, setQuery, logs, onOpenRecord }: { foods: FoodWithRelations[]; query: string; setQuery: (query: string) => void; logs: UserFoodLog[]; onOpenRecord: (food: FoodWithRelations, log?: UserFoodLog) => void }) {
  return <div className="ios-screen"><h1>さがす</h1><SearchBox value={query} onChange={setQuery} placeholder="商品名・店舗名で検索" /><div className="ios-filter-row"><span>販売中</span><span>期間限定</span><span>エリア</span><span>店舗</span></div><div className="ios-food-list">{foods.map((food) => <FoodRow key={food.id} food={food} eaten={logs.some((log) => log.foodId === food.id)} onRecord={() => onOpenRecord(food, logs.find((log) => log.foodId === food.id))} />)}</div></div>;
}

function RecordPickTab(props: { foods: FoodWithRelations[]; query: string; setQuery: (query: string) => void; logs: UserFoodLog[]; onOpenRecord: (food: FoodWithRelations, log?: UserFoodLog) => void }) {
  return <div className="ios-screen"><h1>記録する商品を選ぶ</h1><p className="ios-muted">写真やメモはあとから追加できます。</p><SearchTab {...props} /></div>;
}

function AlbumTab({ records, foods, mode, setMode, completion, totalSpend, onOpenRecord, onOpenAdd }: { records: DetailRecord[]; foods: FoodWithRelations[]; mode: AlbumMode; setMode: (mode: AlbumMode) => void; completion: { eaten: number; total: number; rate: number }; totalSpend: number; onOpenRecord: (record: DetailRecord) => void; onOpenAdd: () => void }) {
  const areaProgress = calculateAreaProgressList(foods, records.map((record) => record.log));
  return <div className="ios-screen"><h1>アルバム</h1><div className="ios-stat-grid"><Stat label="食べた数" value={`${records.length}品`} /><Stat label="達成率" value={`${completion.rate}%`} /><Stat label="総額" value={totalSpend ? `¥${totalSpend.toLocaleString("ja-JP")}` : "未記録"} /></div><div className="ios-segment">{[["all","すべて"],["area","エリア別"],["shop","店舗別"],["event","期間限定"]].map(([id,label]) => <button key={id} type="button" onClick={() => setMode(id as AlbumMode)} className={mode === id ? "is-active" : ""}>{label}</button>)}</div>{records.length === 0 ? <Empty title="最初の1品を記録しよう" cta="商品をさがす" onClick={onOpenAdd} /> : null}{mode === "all" ? <div className="ios-photo-grid">{records.map((record) => <button key={`${record.log.foodId}-${record.log.eatenAt}`} type="button" onClick={() => onOpenRecord(record)}><RecordImage record={record} /></button>)}</div> : null}{mode === "area" ? <div className="ios-progress-list">{areaProgress.map((progress) => <article key={progress.area.id}><strong>{progress.area.name}</strong><span>{progress.active.eaten} / {progress.active.total}品</span><b>{progress.active.rate}%</b><i style={{ width: `${progress.active.rate}%` }} /></article>)}</div> : null}{mode === "shop" ? <GroupedRecords records={records} group={(record) => selectedShopName(record.food, record.log.shopId)} onOpenRecord={onOpenRecord} /> : null}{mode === "event" ? <GroupedRecords records={records} group={(record) => record.food.eventName || "期間限定以外"} onOpenRecord={onOpenRecord} /> : null}</div>;
}

function ParkTab({ foods, areas, collections, onOpenRecord }: { foods: FoodWithRelations[]; areas: Area[]; collections: FoodCollection[]; onOpenRecord: (food: FoodWithRelations) => void }) {
  const shops = Array.from(new Map(foods.map((food) => [food.shop.id, food.shop])).values());
  return <div className="ios-screen"><h1>パーク</h1><p className="ios-muted">エリア・店舗・期間限定イベントから探せます。近くのフードは次のアップデートで対応予定です。</p><SectionTitle title="エリアから探す" /><div className="ios-park-grid">{areas.map((area) => <article key={area.id}><strong>{area.name}</strong><span>{foods.filter((food) => food.area.id === area.id).length}品</span></article>)}</div><SectionTitle title="店舗から探す" /><div className="ios-park-grid">{shops.slice(0, 12).map((shop) => <article key={shop.id}><strong>{shop.name}</strong><span>{foods.filter((food) => food.shop.id === shop.id).length}品</span></article>)}</div><SectionTitle title="期間限定イベント" /><div className="ios-food-list compact">{collections.filter((collection) => collection.isFeatured).slice(0, 4).map((collection) => <article key={collection.id} className="ios-simple-card"><strong>{collection.name}</strong><span>{collection.endsOn ? `${collection.endsOn}まで` : "開催中"}</span></article>)}</div></div>;
}

function RecordSheet({ draft, setDraft, onClose, onSave }: { draft: RecordDraft; setDraft: (draft: RecordDraft) => void; onClose: () => void; onSave: (draft: RecordDraft) => void }) {
  const addPhotos = async () => {
    const saved = await pickAndStoreFoodPhotos(4 - draft.photoIds.length);
    if (saved.length) setDraft({ ...draft, photoIds: [...draft.photoIds, ...saved.map((photo) => photo.id)].slice(0, 4) });
  };
  return <div className="ios-sheet-backdrop"><section className="ios-record-sheet"><div className="ios-grabber" /><header><button type="button" onClick={onClose}>キャンセル</button><strong>記録</strong><button type="button" onClick={() => onSave(draft)}>記録する</button></header><div className="ios-sheet-food"><img src={getFoodImage(draft.food)} alt="" /><div><strong>{draft.food.name}</strong><span>{formatFoodPrice(draft.food)}</span></div></div><Field title="写真"><div className="ios-photo-picker"><button type="button" onClick={addPhotos}>写真を追加<br /><small>あとから追加できます</small></button>{draft.photoIds.map((id) => <PhotoPreview key={id} photoId={id} onRemove={() => setDraft({ ...draft, photoIds: draft.photoIds.filter((item) => item !== id) })} />)}</div></Field><Field title="食べた日"><input type="date" value={draft.eatenAt} onChange={(event) => setDraft({ ...draft, eatenAt: event.target.value })} /></Field><Field title="評価"><div className="ios-stars">{[1,2,3,4,5].map((rating) => <button key={rating} type="button" onClick={() => { void selectionChanged(); setDraft({ ...draft, rating: draft.rating === rating ? undefined : rating }); }} aria-label={`${rating}点`}><Star fill={draft.rating && rating <= draft.rating ? "currentColor" : "none"} /></button>)}</div></Field><Field title="メモ"><textarea value={draft.memo} maxLength={500} onChange={(event) => setDraft({ ...draft, memo: event.target.value })} placeholder="味や思い出をメモできます" /></Field><Field title="支払った金額"><input inputMode="numeric" value={draft.spentAmount ?? ""} onChange={(event) => setDraft({ ...draft, spentAmount: event.target.value ? Number(event.target.value.replace(/[^0-9]/g, "")) : undefined })} placeholder="600" /></Field><Field title="食べた場所"><select value={draft.shopId ?? ""} onChange={(event) => setDraft({ ...draft, shopId: event.target.value || undefined })}><option value="">未選択</option>{(draft.food.locations?.length ? draft.food.locations : [{ shopId: draft.food.shopId, shopName: draft.food.shop.name }]).map((location) => <option key={location.shopId ?? location.shopName} value={location.shopId ?? location.shopName}>{location.shopName}</option>)}</select></Field></section></div>;
}

function RecordDetail({ record, completionRate, onClose, onEdit, onDelete, onShare }: { record: DetailRecord; completionRate: number; onClose: () => void; onEdit: () => void; onDelete: () => void; onShare: () => void }) {
  return <div className="ios-sheet-backdrop"><section className="ios-detail-sheet"><header><button type="button" onClick={onClose}>閉じる</button><strong>記録詳細</strong><button type="button" onClick={onEdit}>編集</button></header><RecordHero record={record} /><h2>{record.food.name}</h2><p className="ios-rating">{typeof record.log.rating === "number" ? "★".repeat(record.log.rating) : "未評価"}</p><dl className="ios-detail-list"><div><dt>食べた日</dt><dd>{formatDate(record.log.eatenAt)}</dd></div><div><dt>支払った金額</dt><dd>{typeof record.log.spentAmount === "number" ? `¥${record.log.spentAmount.toLocaleString("ja-JP")}` : "未記録"}</dd></div><div><dt>食べた店舗</dt><dd>{selectedShopName(record.food, record.log.shopId)}</dd></div><div><dt>エリア</dt><dd>{record.food.area.name}</dd></div></dl>{record.log.memo ? <p className="ios-memo">{record.log.memo}</p> : null}<div className="ios-detail-actions"><button type="button" onClick={onShare}><Share2 size={17} />共有する</button><button type="button" onClick={onEdit}>編集する</button><a href={`/foods/${record.food.id}`}>商品情報を見る</a><button type="button" className="danger" onClick={onDelete}>記録を削除</button></div></section></div>;
}

function SharePreview({ record, completionRate, onClose }: { record: DetailRecord; completionRate: number; onClose: () => void }) {
  const [includeCompletion, setIncludeCompletion] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { void createShareCard(record.food, record.log, completionRate, includeCompletion).then(setPreview).catch(() => setPreview(null)); }, [completionRate, includeCompletion, record]);
  return <div className="ios-sheet-backdrop"><section className="ios-share-sheet"><header><button type="button" onClick={onClose}>閉じる</button><strong>共有カード</strong><span /></header>{preview ? <img src={preview} alt="共有カードのプレビュー" /> : <div className="ios-share-placeholder">作成中</div>}<label className="ios-toggle"><input type="checkbox" checked={includeCompletion} onChange={(event) => setIncludeCompletion(event.target.checked)} />達成率を載せる</label><button type="button" disabled={!preview || busy} onClick={async () => { if (!preview) return; setBusy(true); await shareCardDataUrl(preview); await notifySuccess(); setBusy(false); }}>共有する</button></section></div>;
}

function SettingsPanel({ snapshotSavedAt, onClose }: { snapshotSavedAt: string | null; onClose: () => void }) {
  return <div className="ios-sheet-backdrop"><section className="ios-detail-sheet"><header><button type="button" onClick={onClose}>閉じる</button><strong>設定</strong><span /></header><div className="ios-settings-list"><p>保存した商品情報の更新日時<br /><strong>{snapshotSavedAt ? formatDateTime(snapshotSavedAt) : "未保存"}</strong></p><p>写真は端末内に保存され、運営者へ送信されません。</p><a href="/privacy">プライバシーポリシー</a><a href="/terms">利用規約</a><a href="/about">このアプリについて</a><p className="ios-muted">ユニコレは個人運営の非公式ファンアプリです。</p></div></section></div>;
}

function FoodRow({ food, eaten, onRecord }: { food: FoodWithRelations; eaten: boolean; onRecord: () => void }) {
  return <article className="ios-food-row"><img src={getFoodImage(food)} alt="" /><div><strong>{food.name}</strong><span>{formatFoodPrice(food)} / {food.area.name}</span><small>{food.shop.name} / {getSaleStatusLabel(food)}</small></div><button type="button" onClick={onRecord}>{eaten ? "編集" : "記録"}</button></article>;
}

function RecordMini({ record, onClick }: { record: DetailRecord; onClick: () => void }) { return <button type="button" className="ios-record-mini" onClick={onClick}><RecordImage record={record} /><strong>{record.food.name}</strong><span>{formatDate(record.log.eatenAt)}</span></button>; }
function RecordHero({ record }: { record: DetailRecord }) { return <div className="ios-record-hero"><RecordImage record={record} /></div>; }
function RecordImage({ record }: { record: DetailRecord }) { return <AsyncPhotoImage record={record} />; }
function AsyncPhotoImage({ record }: { record: DetailRecord }) { const [src, setSrc] = useState<string | null>(null); const id = record.log.photoIds?.[0]; useEffect(() => { let mounted = true; if (id) void getPhotoDataUrl(id, true).then((value) => { if (mounted) setSrc(value); }); return () => { mounted = false; }; }, [id]); return <img src={id && src ? src : getFoodImage(record.food)} alt="" />; }
function PhotoPreview({ photoId, onRemove }: { photoId: string; onRemove: () => void }) { const [src, setSrc] = useState<string | null>(null); useEffect(() => { void getPhotoDataUrl(photoId, true).then(setSrc); }, [photoId]); return <span className="ios-photo-preview">{src ? <img src={src} alt="" /> : <i />}<button type="button" onClick={onRemove}>×</button></span>; }
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="ios-search"><Search size={18} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>; }
function Stat({ label, value }: { label: string; value: string }) { return <article className="ios-stat"><span>{label}</span><strong>{value}</strong></article>; }
function SectionTitle({ title }: { title: string }) { return <h2 className="ios-section-title">{title}</h2>; }
function Empty({ title, cta, onClick }: { title: string; cta: string; onClick?: () => void }) { return <div className="ios-empty"><strong>{title}</strong><button type="button" onClick={onClick}>{cta}</button></div>; }
function Field({ title, children }: { title: string; children: ReactNode }) { return <label className="ios-field"><span>{title}</span>{children}</label>; }
function GroupedRecords({ records, group, onOpenRecord }: { records: DetailRecord[]; group: (record: DetailRecord) => string; onOpenRecord: (record: DetailRecord) => void }) { const groups = Array.from(records.reduce((map, record) => map.set(group(record), [...(map.get(group(record)) ?? []), record]), new Map<string, DetailRecord[]>()).entries()); return <div className="ios-grouped-records">{groups.map(([title, items]) => <section key={title}><h3>{title}</h3><div className="ios-photo-grid">{items.map((record) => <button key={`${record.log.foodId}-${record.log.eatenAt}`} type="button" onClick={() => onOpenRecord(record)}><RecordImage record={record} /></button>)}</div></section>)}</div>; }

function findFood(foods: FoodWithRelations[], canonicalFoods: FoodWithRelations[], foodId: string) { const direct = foods.find((food) => food.id === foodId); if (direct) return direct; const key = foods.find((food) => food.id === foodId) ? getCanonicalFoodKey(foods.find((food) => food.id === foodId)!) : foodId; return canonicalFoods.find((food) => getCanonicalFoodKey(food) === key) ?? null; }
function selectedShopName(food: FoodWithRelations, shopId?: string) { return food.locations?.find((location) => location.shopId === shopId)?.shopName ?? food.shop.name; }
function formatDate(value?: string) { if (!value) return "未設定"; const date = new Date(value); if (Number.isNaN(date.getTime())) return value; return new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric" }).format(date); }
function formatDateTime(value: string) { const date = new Date(value); if (Number.isNaN(date.getTime())) return value; return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(date); }
function sidebarClass(active: boolean) { return `ios-sidebar-button ${active ? "is-active" : ""}`; }
