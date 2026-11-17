"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { catchError, type ErrorInfo } from "next/error";
import type { ReactNode } from "react";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { IconTile } from "@/design-system/atoms/icon-tile";

type Props = { message: string; retryLabel: string; className?: string };

/** The card a failed section shows. Without `onRetry` the button is inert (style guide). */
export function SectionErrorCard({ message, retryLabel, detail, onRetry, className }: Props & { detail?: string | null; onRetry?: () => void }) {
  return (
    <Card role="alert" className={className}>
      <div className="grid justify-items-start gap-3 p-5 sm:p-6">
        <IconTile icon={AlertTriangle} tone="danger" shape="circle" />
        <p className="font-semibold">{message}</p>
        {detail && <pre className="max-w-full overflow-x-auto text-xs whitespace-pre-wrap text-subtle">{detail}</pre>}
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden />
          {retryLabel}
        </Button>
      </div>
    </Card>
  );
}

function SectionErrorFallback(props: Props, { error, retry }: ErrorInfo) {
  const detail = process.env.NODE_ENV === "development" && error instanceof Error ? error.message : null;
  return <SectionErrorCard {...props} detail={detail} onRetry={() => retry()} />;
}

/** Contains a failing section so the rest of the page keeps working. */
export const SectionErrorBoundary = catchError(SectionErrorFallback);

function QuietFallback({ fallback = null }: { fallback?: ReactNode }) {
  return fallback;
}

/** For small slots (header profile) where an error card would be out of place: hide the slot, or show `fallback`. */
export const QuietErrorBoundary = catchError(QuietFallback);
