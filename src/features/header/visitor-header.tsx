import { LoginButton } from "@/components/catalog/segment";
import { SiteHeader, type HeaderTab } from "@/design-system/organisms/header/site-header";
import { GuestNav } from "./guest-nav";
import type { SectionProps } from "@/features/dashboard/types";
import type { Visitor } from "@/lib/visitor";
import { DashboardHeader } from "./dashboard-header";

/**
 * The student's header, or for a guest (CT21) the header without their tabs, inbox and profile: a login button instead,
 * and (CT64) the live site's menus for visitors, the same `PUBLIC_NAV` as the landing's header.
 */
export async function VisitorHeader({ visitor, current = "none", ...props }: SectionProps & { visitor: Promise<Visitor>; current?: HeaderTab }) {
  const { guest } = await visitor;
  if (!guest) return <DashboardHeader {...props} current={current} />;
  return (
    <SiteHeader
      lang={props.lang}
      t={props.t}
      current={current}
      guest
      publicNav={<GuestNav label={props.t.nav.primary} />}
      actions={<LoginButton lang={props.lang} label={props.t.segment.login} size="xs" />}
    />
  );
}
