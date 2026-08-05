import { readFileSync } from "node:fs";

const edge = readFileSync("supabase/functions/staff-invite/index.ts", "utf8");
const consoleCode = readFileSync("components/staff/staff-console.tsx", "utf8");
const inviteOnboarding = readFileSync("components/staff/staff-invite-onboarding.tsx", "utf8");
const invitePage = readFileSync("app/auth/invite/page.tsx", "utf8");

type Check = { name: string; pass: boolean; detail: string };
const checks: Check[] = [
  {
    name: "edge checks MFA assurance using latest bearer token",
    pass: /getAuthenticatorAssuranceLevel\(token\)/.test(edge) && /accessTokenAal !== "aal2"/.test(edge),
    detail: "staff-invite must not use an empty Edge Function auth session for AAL"
  },
  {
    name: "edge returns safe AAL diagnostics on MFA rejection",
    pass: /error: "mfa_required"/.test(edge) && /currentLevel/.test(edge) && /accessTokenAal/.test(edge),
    detail: "403 response contains only safe aal fields"
  },
  {
    name: "edge checks owner by JWT sub against staff_members user_id",
    pass: /ensureOwnerMapping/.test(edge) && /\.eq\("user_id", context\.userId\)/.test(edge) && /role !== "owner"/.test(edge),
    detail: "staff-invite owner gate uses auth user id, not only email or RPC"
  },
  {
    name: "edge can safely repair a verified single owner email mapping",
    pass: /emailVerified/.test(edge) && /ownerRows\.length > 1/.test(edge) && /update\(\{ user_id: context\.userId/.test(edge),
    detail: "only a verified single active owner email row can be relinked"
  },
  {
    name: "edge prevents existing owner from being overwritten as editor",
    pass: /existingStaff\.data\?\.role === "owner"/.test(edge) && /existing_owner_not_changed/.test(edge),
    detail: "owner invite target must not be demoted"
  },
  {
    name: "edge does not return internal SQL error detail to browser",
    pass: !/detail:\s*upsert\.error\.message/.test(edge),
    detail: "staff_upsert_failed response stays generic"
  },
  {
    name: "client shows invite progress and disables duplicate submits",
    pass: /inviteBusyMode/.test(consoleCode) && /招待リンクを作成しています/.test(consoleCode) && /disabled=\{Boolean\(inviteBusyMode\)\}/.test(consoleCode),
    detail: "invite buttons must not appear unresponsive"
  },
  {
    name: "client renders safe HTTP status and error code from Edge Function",
    pass: /readFunctionErrorPayload/.test(consoleCode) && /HTTP \" \+ payload\.status/.test(consoleCode) && /code: \" \+ payload\.error/.test(consoleCode),
    detail: "owner-visible errors include safe status/code"
  },
  {
    name: "client maps owner relation failures to safe Japanese messages",
    pass: /owner_uid_mismatch/.test(consoleCode) && /owner_row_missing/.test(consoleCode) && /multiple_owner_rows/.test(consoleCode),
    detail: "owner_required root causes are no longer silent"
  },
  {
    name: "edge redirects staff invites to onboarding route",
    pass: /\$\{origin\}\/auth\/invite/.test(edge) && !/auth\/callback\?next=/.test(edge),
    detail: "new staff invite links must open the onboarding route, not the normal staff login callback"
  },
  {
    name: "invite onboarding accepts code and hash sessions",
    pass: /exchangeCodeForSession\(code\)/.test(inviteOnboarding) && /setSession\(\{ access_token: accessToken, refresh_token: refreshToken \}\)/.test(inviteOnboarding),
    detail: "invite page handles both code and access_token fragment formats"
  },
  {
    name: "invite onboarding sets password and MFA before staff entry",
    pass: /updateUser\(\{ password \}\)/.test(inviteOnboarding) && /mfa\.enroll\(\{ factorType: "totp" \}\)/.test(inviteOnboarding) && /syncVerifiedStaffMfaSession/.test(inviteOnboarding),
    detail: "family onboarding does password setup, TOTP enrollment, and AAL2 session sync"
  },
  {
    name: "invite onboarding does not show magic link login",
    pass: !/ログインリンクを送信/.test(inviteOnboarding) && /StaffInviteOnboarding/.test(invitePage),
    detail: "invite links must not fall back to the normal login-link form"
  },
  {
    name: "client keeps invite links out of logs",
    pass: !/console\.(log|error|warn)\([^)]*inviteLink/.test(consoleCode) && !/console\.(log|error|warn)\([^)]*actionLink/.test(edge),
    detail: "invite URL/token must not be logged"
  }
];

for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name} - ${item.detail}`);
const failed = checks.filter((item) => !item.pass);
if (failed.length) {
  console.error(`${failed.length} staff invite flow checks failed.`);
  process.exit(1);
}
console.log(`${checks.length} staff invite flow checks passed.`);
