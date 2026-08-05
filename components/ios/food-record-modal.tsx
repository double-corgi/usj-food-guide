"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Share2, Star, X } from "lucide-react";
import { formatFoodPrice } from "@/lib/food-utils";
import { impactLight, isNativeIosApp, notifySuccess, notifyWarning, selectionChanged } from "@/lib/ios/native";
import { deletePhotosNotUsed, getPhotoDataUrl, pickAndStoreFoodPhotos } from "@/lib/ios/photo-store";
import { createShareCard, shareCardDataUrl } from "@/lib/ios/share-card";
import { getFoodImage } from "@/lib/utils/image";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations, UserFoodLog } from "@/types/domain";

type FoodRecord = { food: FoodWithRelations; log: UserFoodLog };
type Draft = { eatenAt: string; rating?: number; memo: string; spentAmount?: number; shopId?: string; photoIds: string[] };

type FoodRecordActionProps = {
  food: FoodWithRelations;
  recordFoodId: string;
  eaten: boolean;
  existingLog?: UserFoodLog;
  className: string;
  quickLabel: string;
  doneLabel: string;
  onQuickRecord: () => void;
  onChanged?: () => void;
};

export function FoodRecordAction({ food, recordFoodId, eaten, existingLog, className, quickLabel, doneLabel, onQuickRecord, onChanged }: FoodRecordActionProps) {
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [localLog, setLocalLog] = useState<UserFoodLog | undefined>(existingLog);
  const displayLog = localLog ?? existingLog;


  return (
    <>
      <button type="button" onClick={() => setChoiceOpen(true)} className={className}>
        <Check size={20} aria-hidden />
        {displayLog || eaten ? doneLabel : quickLabel}
      </button>
      {choiceOpen ? <ChoiceDialog eaten={Boolean(displayLog || eaten)} onClose={() => setChoiceOpen(false)} onQuick={() => { onQuickRecord(); void impactLight(); setChoiceOpen(false); onChanged?.(); }} onRich={() => { setChoiceOpen(false); setSheetOpen(true); }} onDetail={displayLog ? () => { setChoiceOpen(false); setDetailOpen(true); } : undefined} /> : null}
      {sheetOpen ? <FoodRecordSheet food={food} recordFoodId={recordFoodId} log={displayLog} onClose={() => setSheetOpen(false)} onSaved={(log) => { setLocalLog(log); setSheetOpen(false); setDetailOpen(true); onChanged?.(); }} /> : null}
      {detailOpen && displayLog ? <FoodRecordDetailModal record={{ food, log: displayLog }} onClose={() => setDetailOpen(false)} onChanged={(nextLog) => { setLocalLog(nextLog); onChanged?.(); }} /> : null}
    </>
  );
}

export function FoodRecordDetailModal({ record, onClose, onChanged }: { record: FoodRecord; onClose: () => void; onChanged?: (log?: UserFoodLog) => void }) {
  const { logs, removeEaten } = useFoodLogs();
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharePreview, setSharePreview] = useState<string | null>(null);
  const [includeCompletion, setIncludeCompletion] = useState(true);
  const completionRate = useMemo(() => {
    const eaten = logs.filter((log) => log.status === "eaten").length;
    return eaten > 0 ? 100 : 0;
  }, [logs]);

  useEffect(() => {
    if (!sharing) return;
    let active = true;
    void createShareCard(record.food, record.log, completionRate, includeCompletion).then((dataUrl) => {
      if (active) setSharePreview(dataUrl);
    }).catch(() => {
      if (active) setSharePreview(null);
    });
    return () => { active = false; };
  }, [completionRate, includeCompletion, record.food, record.log, sharing]);

  async function deleteRecord() {
    if (!window.confirm("この記録を削除しますか？\n記録に保存した写真も削除されます。")) return;
    const remainingLogs = logs.filter((log) => !(log.foodId === record.log.foodId && log.status === "eaten"));
    await deletePhotosNotUsed(record.log.photoIds ?? [], remainingLogs);
    removeEaten(record.log.foodId);
    await notifyWarning();
    onChanged?.(undefined);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/45 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-[max(env(safe-area-inset-top),1rem)] sm:items-center" role="dialog" aria-modal="true">
      <section className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[1.8rem] bg-[#fffaf5] p-4 text-ink shadow-2xl sm:p-5">
        <header className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-[#fffaf5]/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5">
          <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white px-4 text-sm font-black text-slate-700 shadow-sm"><X size={17} />閉じる</button>
          <strong className="min-w-0 truncate text-sm font-black">記録詳細</strong>
          <button type="button" onClick={() => setEditing(true)} className="min-h-11 rounded-full bg-park px-4 text-sm font-black text-white">編集</button>
        </header>
        <div className="mt-4 space-y-4">
          <div className="overflow-hidden rounded-[1.4rem] bg-white shadow-soft"><RecordPhotoImage record={record} className="h-72 w-full object-cover" /></div>
          <div><h2 className="break-words text-2xl font-black leading-tight">{record.food.name}</h2><p className="mt-2 text-lg font-black text-park">{typeof record.log.rating === "number" ? "★".repeat(record.log.rating) : "未評価"}</p></div>
          <dl className="grid gap-2 rounded-[1.3rem] bg-white p-4 text-sm font-bold text-slate-600 shadow-soft">
            <InfoRow label="食べた日" value={formatDate(record.log.eatenAt)} />
            <InfoRow label="支払った金額" value={typeof record.log.spentAmount === "number" ? "¥" + record.log.spentAmount.toLocaleString("ja-JP") : "未記録"} />
            <InfoRow label="食べた店舗" value={selectedShopName(record.food, record.log.shopId)} />
            <InfoRow label="エリア" value={record.food.area.name} />
          </dl>
          {record.log.memo ? <p className="rounded-[1.3rem] bg-white p-4 text-sm font-bold leading-7 text-slate-700 shadow-soft">{record.log.memo}</p> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setSharing(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-park px-4 text-sm font-black text-white"><Share2 size={17} />共有する</button>
            <button type="button" onClick={() => setEditing(true)} className="min-h-12 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-ink">編集する</button>
            <a href={"/foods/" + record.food.id} className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-ink">商品情報を見る</a>
            <button type="button" onClick={deleteRecord} className="min-h-12 rounded-full bg-rose-50 px-4 text-sm font-black text-rose-700">記録を削除</button>
          </div>
        </div>
      </section>
      {editing ? <FoodRecordSheet food={record.food} recordFoodId={record.log.foodId} log={record.log} onClose={() => setEditing(false)} onSaved={(log) => { setEditing(false); onChanged?.(log); }} /> : null}
      {sharing ? <ShareDialog preview={sharePreview} includeCompletion={includeCompletion} setIncludeCompletion={setIncludeCompletion} onClose={() => setSharing(false)} /> : null}
    </div>
  );
}

export function RecordPhotoImage({ record, className }: { record: FoodRecord; className?: string }) {
  const [photoSrc, setPhotoSrc] = useState<{ photoId?: string; src: string | null }>({ src: null });
  const photoId = record.log.photoIds?.[0];
  useEffect(() => {
    if (!photoId) return;
    let mounted = true;
    void getPhotoDataUrl(photoId, true).then((value) => { if (mounted) setPhotoSrc({ photoId, src: value }); });
    return () => { mounted = false; };
  }, [photoId]);
  const src = photoId && photoSrc.photoId === photoId ? photoSrc.src : null;
  return <img src={src ?? getFoodImage(record.food)} alt={record.food.name} className={className ?? "h-full w-full object-cover"} />;
}

function FoodRecordSheet({ food, recordFoodId, log, onClose, onSaved }: { food: FoodWithRelations; recordFoodId: string; log?: UserFoodLog; onClose: () => void; onSaved: (log: UserFoodLog) => void }) {
  const { updateEatenDetails } = useFoodLogs();
  const [draft, setDraft] = useState<Draft>(() => ({ eatenAt: (log?.eatenAt ?? new Date().toISOString()).slice(0, 10), rating: log?.rating, memo: log?.memo ?? "", spentAmount: log?.spentAmount ?? food.priceMin ?? food.price, shopId: log?.shopId ?? food.locations?.[0]?.shopId ?? food.shopId, photoIds: log?.photoIds ?? [] }));
  const [message, setMessage] = useState<string | null>(null);
  const [savingPhotos, setSavingPhotos] = useState(false);

  async function addPhotos() {
    setSavingPhotos(true);
    try {
      const saved = await pickAndStoreFoodPhotos(4 - draft.photoIds.length);
      if (saved.length > 0) setDraft((current) => ({ ...current, photoIds: [...current.photoIds, ...saved.map((photo) => photo.id)].slice(0, 4) }));
      if (saved.length === 0) setMessage(isNativeIosApp() ? "写真を選べませんでした。もう一度お試しください。" : "写真選択はiOSアプリで利用できます。");
    } catch {
      setMessage("画像を保存できませんでした。もう一度お試しください。");
    } finally {
      setSavingPhotos(false);
    }
  }

  async function save() {
    const eatenAt = new Date(draft.eatenAt + "T12:00:00").toISOString();
    updateEatenDetails(recordFoodId, { eatenAt, rating: draft.rating, memo: draft.memo || undefined, spentAmount: draft.spentAmount, shopId: draft.shopId, photoIds: draft.photoIds });
    const savedLog: UserFoodLog = { foodId: recordFoodId, status: "eaten", eatenAt, eatenCount: log?.eatenCount ?? 1, rating: draft.rating, memo: draft.memo || undefined, spentAmount: draft.spentAmount, shopId: draft.shopId, photoIds: draft.photoIds, updatedAt: new Date().toISOString() };
    await notifySuccess();
    setMessage("保存しました");
    onSaved(savedLog);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/45 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-[max(env(safe-area-inset-top),1rem)] sm:items-center" role="dialog" aria-modal="true">
      <section className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[1.8rem] bg-[#fffaf5] p-4 text-ink shadow-2xl sm:p-5">
        <header className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-[#fffaf5]/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:-mt-5 sm:px-5"><button type="button" onClick={onClose} className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">キャンセル</button><strong className="min-w-0 truncate text-sm font-black">写真・メモを追加</strong><button type="button" onClick={save} className="min-h-11 rounded-full bg-park px-4 text-sm font-black text-white">記録する</button></header>
        <div className="mt-4 space-y-4">
          {message ? <p className="rounded-2xl bg-mint px-4 py-3 text-sm font-black text-park">{message}</p> : null}
          <div className="flex gap-3 rounded-[1.2rem] bg-white p-3 shadow-soft"><img src={getFoodImage(food)} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" /><div className="min-w-0"><p className="break-words text-base font-black leading-6">{food.name}</p><p className="mt-1 text-sm font-black text-park">{formatFoodPrice(food)}</p></div></div>
          <Field title="写真"><div className="grid gap-2"><button type="button" onClick={addPhotos} disabled={savingPhotos || draft.photoIds.length >= 4} className="min-h-12 rounded-2xl border border-dashed border-slate-300 bg-white px-4 text-sm font-black text-slate-700 disabled:opacity-50">{savingPhotos ? "画像を保存しています" : draft.photoIds.length ? "写真を追加" : "写真を選ぶ"}<br /><small className="font-bold text-slate-500">あとから追加できます</small></button>{draft.photoIds.length ? <div className="grid grid-cols-4 gap-2">{draft.photoIds.map((id) => <PhotoPreview key={id} photoId={id} onRemove={() => setDraft({ ...draft, photoIds: draft.photoIds.filter((item) => item !== id) })} />)}</div> : null}</div></Field>
          <Field title="食べた日"><input type="date" value={draft.eatenAt} onChange={(event) => setDraft({ ...draft, eatenAt: event.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold" /></Field>
          <Field title="評価"><div className="flex gap-1">{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" onClick={() => { void selectionChanged(); setDraft({ ...draft, rating: draft.rating === rating ? undefined : rating }); }} className="grid h-11 w-11 place-items-center rounded-full bg-white text-park shadow-sm" aria-label={String(rating) + "点"}><Star size={24} fill={draft.rating && rating <= draft.rating ? "currentColor" : "none"} /></button>)}</div></Field>
          <Field title="メモ"><textarea value={draft.memo} onChange={(event) => setDraft({ ...draft, memo: event.target.value })} placeholder="味や思い出をメモできます" className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-bold" /></Field>
          <Field title="支払った金額"><input inputMode="numeric" value={draft.spentAmount ?? ""} onChange={(event) => setDraft({ ...draft, spentAmount: event.target.value ? Number(event.target.value.replace(/[^0-9]/g, "")) : undefined })} placeholder="600" className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold" /></Field>
          <Field title="食べた場所"><select value={draft.shopId ?? ""} onChange={(event) => setDraft({ ...draft, shopId: event.target.value || undefined })} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-bold"><option value="">未選択</option>{(food.locations?.length ? food.locations : [{ shopId: food.shopId, shopName: food.shop.name }]).map((location) => <option key={location.shopId ?? location.shopName} value={location.shopId ?? location.shopName}>{location.shopName}</option>)}</select></Field>
        </div>
      </section>
    </div>
  );
}

function ChoiceDialog({ eaten, onClose, onQuick, onRich, onDetail }: { eaten: boolean; onClose: () => void; onQuick: () => void; onRich: () => void; onDetail?: () => void }) {
  return <div className="fixed inset-0 z-[85] flex items-end justify-center bg-slate-950/40 px-3 pb-[max(env(safe-area-inset-bottom),1rem)] pt-[max(env(safe-area-inset-top),1rem)] sm:items-center"><section className="w-full max-w-sm rounded-[1.6rem] bg-white p-4 text-ink shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-black">食べた記録</h2><p className="mt-1 text-sm font-bold leading-6 text-slate-500">写真やメモはあとから追加できます。</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100"><X size={18} /></button></div><div className="mt-4 grid gap-2"><button type="button" onClick={onQuick} className="min-h-12 rounded-full bg-park px-4 text-sm font-black text-white">{eaten ? "記録だけ外す" : "記録だけ付ける"}</button><button type="button" onClick={onRich} className="min-h-12 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-ink">写真やメモも追加する</button>{onDetail ? <button type="button" onClick={onDetail} className="min-h-12 rounded-full bg-mint px-4 text-sm font-black text-park">記録の詳細を見る</button> : null}</div></section></div>;
}

function ShareDialog({ preview, includeCompletion, setIncludeCompletion, onClose }: { preview: string | null; includeCompletion: boolean; setIncludeCompletion: (value: boolean) => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-[max(env(safe-area-inset-top),1rem)] sm:items-center"><section className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-[1.8rem] bg-white p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between"><button type="button" onClick={onClose} className="min-h-11 rounded-full border border-slate-200 px-4 text-sm font-black">閉じる</button><strong>共有カード</strong></div>{preview ? <img src={preview} alt="共有カード" className="w-full rounded-2xl" /> : <div className="grid h-80 place-items-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-500">作成中</div>}<label className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" checked={includeCompletion} onChange={(event) => setIncludeCompletion(event.target.checked)} />達成率を載せる</label><button type="button" disabled={!preview} onClick={async () => { if (!preview) return; await shareCardDataUrl(preview); await notifySuccess(); }} className="mt-3 min-h-12 w-full rounded-full bg-park text-sm font-black text-white disabled:opacity-50">共有する</button></section></div>;
}

function PhotoPreview({ photoId, onRemove }: { photoId: string; onRemove: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => { void getPhotoDataUrl(photoId, true).then(setSrc); }, [photoId]);
  return <span className="relative block aspect-square overflow-hidden rounded-2xl bg-slate-100">{src ? <img src={src} alt="" className="h-full w-full object-cover" /> : null}<button type="button" onClick={onRemove} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-sm font-black text-ink">×</button></span>;
}
function Field({ title, children }: { title: string; children: React.ReactNode }) { return <label className="block space-y-2"><span className="text-sm font-black text-ink">{title}</span>{children}</label>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3"><dt className="shrink-0 text-slate-400">{label}</dt><dd className="min-w-0 break-words text-right font-black text-slate-700">{value}</dd></div>; }
function selectedShopName(food: FoodWithRelations, shopId?: string) { return food.locations?.find((location) => location.shopId === shopId)?.shopName ?? food.shop.name; }
function formatDate(value?: string) { if (!value) return "未設定"; const date = new Date(value); if (Number.isNaN(date.getTime())) return value; return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(date); }
