"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { readImportData, saveReviewDecisionFiles } from "./review-data";
import type { ReviewDecision, SaveReviewDecisionsResult } from "./review-types";

export async function saveSummer2026ReviewDecisions(decisions: ReviewDecision[]): Promise<SaveReviewDecisionsResult> {
  try {
    await requireAdmin("editor");
    const data = readImportData();
    if (decisions.length !== data.items.length) {
      return {
        ok: false,
        message: `保存対象が${data.items.length}件ではありません。受信件数: ${decisions.length}件`
      };
    }

    const result = saveReviewDecisionFiles(data.items, decisions);
    return {
      ok: true,
      message: "レビュー判断を保存しました。import-readyも再生成しました。",
      savedAt: result.savedAt,
      decisions: result.decisions,
      importReadyCount: result.importReadyFile.itemCount,
      issues: result.issues
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "レビュー判断の保存に失敗しました。"
    };
  }
}
