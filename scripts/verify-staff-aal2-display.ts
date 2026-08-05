import { STAFF_MFA_REQUIRED_MESSAGE, isStaffAal2Snapshot, visibleStaffMessage } from "../lib/staff-auth-state";

type Case = { name: string; pass: boolean };
const cases: Case[] = [
  {
    name: "aal2 snapshot hides stale MFA banner",
    pass: visibleStaffMessage(STAFF_MFA_REQUIRED_MESSAGE, { currentLevel: "aal2", accessTokenAal: "aal2" }) === ""
  },
  {
    name: "aal2 snapshot enables staff operations",
    pass: isStaffAal2Snapshot({ currentLevel: "aal2", accessTokenAal: "aal2" }) === true
  },
  {
    name: "aal1 snapshot keeps MFA banner",
    pass: visibleStaffMessage(STAFF_MFA_REQUIRED_MESSAGE, { currentLevel: "aal1", accessTokenAal: "aal1" }) === STAFF_MFA_REQUIRED_MESSAGE
  },
  {
    name: "mixed current/token levels do not pass",
    pass: isStaffAal2Snapshot({ currentLevel: "aal2", accessTokenAal: "aal1" }) === false
  },
  {
    name: "non-MFA messages remain visible after aal2",
    pass: visibleStaffMessage("保存しました。", { currentLevel: "aal2", accessTokenAal: "aal2" }) === "保存しました。"
  }
];

for (const item of cases) console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name}`);
const failed = cases.filter((item) => !item.pass);
if (failed.length) {
  console.error(`${failed.length} staff AAL2 display checks failed.`);
  process.exit(1);
}
console.log(`${cases.length} staff AAL2 display checks passed.`);
