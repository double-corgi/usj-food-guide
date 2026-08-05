import fs from "node:fs";

const css = fs.readFileSync("app/globals.css", "utf8");
const appHeader = fs.readFileSync("components/app-header.tsx", "utf8");
const staffConsole = fs.readFileSync("components/staff/staff-console.tsx", "utf8");
const staff = css.slice(css.indexOf(".staff-console"));
const mobile = css.slice(css.indexOf("@media (max-width: 430px)"));
const checks = [
  ["staff console clips horizontal overflow", /\.staff-console\s*\{[\s\S]*overflow-x:\s*clip/.test(staff)],
  ["staff console has min-width zero", /\.staff-console\s*\{[\s\S]*min-width:\s*0/.test(staff)],
  ["staff descendants use border-box", /\.staff-console,\s*\n\.staff-console \*\s*\{[\s\S]*box-sizing:\s*border-box/.test(css)],
  ["inputs are constrained", /\.staff-console input,[\s\S]*max-width:\s*100%/.test(css)],
  ["checkboxes and radios do not stretch to full width", /input\[type="checkbox"\],[\s\S]*input\[type="radio"\][\s\S]*width:\s*1rem/.test(css)],
  ["buttons are constrained", /\.staff-console button,[\s\S]*max-width:\s*100%/.test(css)],
  ["staff shell constrains app main", /\.app-shell-main:has\(\.staff-console\)[\s\S]*overflow-x:\s*clip/.test(css)],
  ["flex and grid children can shrink", /\.staff-console :where\(\.grid, \.flex\) > \*[\s\S]*min-width:\s*0/.test(css)],
  ["mobile staff shell constrains app main", /\.app-shell-main:has\(\.staff-console\)[\s\S]*padding-left/.test(mobile)],
  ["mobile compact spacing rules exist", /\.staff-console \.space-y-6/.test(mobile)],
  ["mobile staff font compacting exists", /\.staff-console \.text-3xl/.test(mobile)],
  ["staff grid fixed search columns collapse on mobile", /grid-cols-\\\[1fr_180px\\\]/.test(css)],
  ["staff owner operators fixed columns collapse on mobile", /lg\\:grid-cols-\\\[380px_1fr\\\]/.test(css)],
  ["mobile multi-column grids use minmax zero", /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(mobile)],
  ["readonly invite link wraps safely", /textarea\[readonly\],[\s\S]*overflow-wrap:\s*anywhere/.test(css)],
  ["staff login panels use staff console constraints", /className="staff-console mx-auto/.test(staffConsole)],
  ["operator paths do not render mobile bottom tab", appHeader.includes("{!isOperatorPath ? (") && appHeader.includes("app-mobile-bottom-nav")]
];

let ok = true;
for (const [name, pass] of checks) {
  if (!pass) ok = false;
  console.log((pass ? "PASS" : "FAIL") + " " + name);
}
if (!ok) process.exit(1);
