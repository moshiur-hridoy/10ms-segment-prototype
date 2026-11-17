"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/design-system/molecules/select";
import { cn } from "@/lib/cn";

/** Course picker for the report. Each option's URL is built on the server; this only navigates. */
export function CourseSelect({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; href: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Select
      label={label}
      value={value}
      options={options}
      onChange={(v) => {
        const next = options.find((o) => o.value === v);
        if (next) startTransition(() => router.push(next.href, { scroll: false }));
      }}
      className={cn("w-full min-w-0 sm:w-80", pending && "opacity-70")}
    />
  );
}
