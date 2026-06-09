"use client";

import { useState } from "react";
import { LocalDataBackupPanel } from "@/components/local-data-backup-panel";

export function SettingsDataPanel() {
  const [, refresh] = useState(0);

  return <LocalDataBackupPanel onDataChanged={() => refresh((value) => value + 1)} />;
}
