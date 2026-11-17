"use client";

import { createContext, useContext } from "react";

/**
 * L19: students are addressed as তুমি, guardians as আপনি (designer's direction). Inside a
 * guardian context every button and direct address uses the আপনি form.
 * Copy that always speaks to guardians (the 16910 band, "অভিভাবক? …") is written with আপনি directly.
 */
const Formal = createContext(false);

export function AddressProvider({ formal, children }: { formal: boolean; children: React.ReactNode }) {
  return <Formal.Provider value={formal}>{children}</Formal.Provider>;
}

/** `t("ফ্রি ক্লাস করো", "ফ্রি ক্লাস দেখুন")`: the first for a student, the second for a guardian. */
export function useT() {
  const formal = useContext(Formal);
  return (tumi: string, apni: string) => (formal ? apni : tumi);
}

export const useFormal = () => useContext(Formal);
