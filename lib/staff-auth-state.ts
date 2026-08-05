export const STAFF_MFA_REQUIRED_MESSAGE = "本人確認が完了していません。認証アプリの6桁コードを確認してください。";

export type StaffAalSnapshotLike = {
  currentLevel?: string | null;
  accessTokenAal?: string | null;
} | null | undefined;

export function isStaffAal2Snapshot(snapshot: StaffAalSnapshotLike) {
  return snapshot?.currentLevel === "aal2" && snapshot.accessTokenAal === "aal2";
}

export function visibleStaffMessage(message: string, snapshot: StaffAalSnapshotLike) {
  return isStaffAal2Snapshot(snapshot) && message === STAFF_MFA_REQUIRED_MESSAGE ? "" : message;
}
