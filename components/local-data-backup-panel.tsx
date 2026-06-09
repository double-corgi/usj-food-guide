"use client";

import { useRef, useState } from "react";
import { Download, FileJson, RotateCcw, Trash2, Upload } from "lucide-react";
import { clearLocalUserData, exportLocalUserData, parseLocalUserDataBackup, restoreLocalUserData } from "@/lib/local-user-data";

export function LocalDataBackupPanel({ onDataChanged }: { onDataChanged: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleExport() {
    const backup = exportLocalUserData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `usj-food-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("バックアップJSONを出力しました。");
  }

  async function handleRestore(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const backup = parseLocalUserDataBackup(parsed);
      if (!backup) {
        setMessage("復元できないJSONです。バックアップファイルを確認してください。");
        return;
      }
      restoreLocalUserData(backup);
      onDataChanged();
      setMessage(`バックアップを復元しました。食べた記録 ${backup.logs.length}件、レビュー ${backup.reviews.length}件。`);
    } catch {
      setMessage("JSONの読み込みに失敗しました。");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleClear() {
    const ok = window.confirm("食べた記録、レビュー、最近見た商品、検索履歴を端末から削除します。よろしいですか？");
    if (!ok) return;
    clearLocalUserData();
    onDataChanged();
    setMessage("端末内の記録データを削除しました。");
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint text-park">
          <FileJson size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black text-ink">データ管理</p>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
            ログイン不要です。食べた記録とレビューはこの端末内に保存されます。機種変更時はJSONバックアップを出力して復元してください。
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={handleExport} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-black text-white active:scale-95">
          <Download size={17} aria-hidden />
          バックアップ出力
        </button>
        <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-park px-4 text-sm font-black text-white active:scale-95">
          <Upload size={17} aria-hidden />
          バックアップ復元
        </button>
        <button type="button" onClick={handleClear} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 active:scale-95">
          <Trash2 size={17} aria-hidden />
          全データ削除
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleRestore(file);
        }}
      />
      {message ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
          <RotateCcw size={14} aria-hidden />
          {message}
        </p>
      ) : null}
    </section>
  );
}
