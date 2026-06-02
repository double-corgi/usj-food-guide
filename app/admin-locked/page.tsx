import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function AdminLockedPage() {
  return (
    <div className="mx-auto flex min-h-[58vh] max-w-xl flex-col items-center justify-center text-center">
      <div className="grid h-16 w-16 place-items-center rounded-[1.4rem] bg-ink text-white shadow-[0_18px_46px_rgba(15,23,42,0.18)]">
        <LockKeyhole size={28} aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-black text-ink">管理画面は非公開です</h1>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
        外部公開URLでは管理機能を表示しません。ローカル環境、または管理用キー付きURLで確認してください。
      </p>
      <Link href="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white shadow-soft">
        ホームへ戻る
      </Link>
    </div>
  );
}
