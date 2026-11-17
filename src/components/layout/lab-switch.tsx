"use client";

import type { ReactNode } from "react";
import { useLab } from "@/lib/lab";

/** For server components: `on` while lab `id` is open (`?lab=<id>`), `off` otherwise. */
export function LabSwitch({ id, on, off }: { id: string; on: ReactNode; off: ReactNode }) {
  return useLab(id) !== null ? on : off;
}
