"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select, type SelectOption } from "@/design-system/molecules/select";
import { cn } from "@/lib/cn";

export type SubjectOption = SelectOption & { href: string };

/** Subject dropdown for the routine card (both versions). Each option's URL is built on the server; this only navigates. */
export function SubjectFilter({ label, value, options }: { label: string; value: string; options: SubjectOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (next: string) => {
    const to = options.find((o) => o.value === next);
    if (to) startTransition(() => router.replace(to.href, { scroll: false }));
  };
  return <Select label={label} value={value} options={options} onChange={go} className={cn("w-44", pending && "opacity-70")} />;
}
