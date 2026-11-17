import { BookSquare, Building, LampCharge, MonitorMobbile, VideoTick } from "iconsax-react";
import type { PublicNavGroup } from "@/design-system/organisms/header/public-nav";
import { links } from "./site";

const SITE = "https://10minuteschool.com";

/**
 * The header's menus for visitors who aren't signed in (designer, 1 Nov 2026, LP16): the live
 * site's menus, with every address taken from the live site by opening each item (1 Nov 2026).
 * The class backpacks are the live site's own icons (public/img/nav); the rest are Iconsax, as there.
 */
export const PUBLIC_NAV: PublicNavGroup[] = [
  {
    label: "ক্লাস ৫-১২",
    items: [
      {
        label: "এইচএসসি",
        icon: { src: "/img/nav/hsc.svg" },
        sub: [
          { label: "এইচএসসি ২৬", href: `${SITE}/hsc/hsc-26/` },
          // CT73: HSC 27 and 28 open our segment page (HSC 26 isn't rebuilt here yet).
          { label: "এইচএসসি ২৭", href: "/bn/hsc/hsc-27" },
          { label: "এইচএসসি ২৮", href: "/bn/hsc/hsc-28" },
          { label: "ফ্রি ক্লাস (HSC)", href: links.freeClassHsc },
        ],
      },
      {
        label: "এসএসসি",
        icon: { src: "/img/nav/ssc.svg" },
        sub: [
          { label: "এসএসসি ২৭ (১০ম শ্রেণি)", href: `${SITE}/ssc/ssc-27/` },
          { label: "এসএসসি ২৮ (৯ম শ্রেণি)", href: `${SITE}/ssc/ssc-28/` },
        ],
      },
      { label: "অষ্টম শ্রেণি", href: `${SITE}/class-8/`, icon: { src: "/img/nav/class-8.svg" } },
      { label: "সপ্তম শ্রেণি", href: `${SITE}/class-7/`, icon: { src: "/img/nav/class-7.svg" } },
      { label: "ষষ্ঠ শ্রেণি", href: `${SITE}/class-6/`, icon: { src: "/img/nav/class-6.svg" } },
      // CT64 (9 Nov 2026): the live site added class 5 and renamed the menu "ক্লাস ৫-১২"; its icon is the live one.
      { label: "পঞ্চম শ্রেণি", href: `${SITE}/class-5/`, icon: { src: "/img/nav/class-5.svg" } },
      "divider",
      { label: "একাডেমিক ফ্রি কোর্সসমূহ", href: `${SITE}/free/`, icon: { Icon: VideoTick, tone: "text-brand" } },
    ],
  },
  {
    label: "ইংলিশ",
    items: [
      { label: "অনলাইন", href: links.englishOnline, icon: { Icon: MonitorMobbile, tone: "text-brand" } },
      { label: "অফলাইন", href: links.englishOffline, icon: { Icon: Building, tone: "text-streak" } },
    ],
  },
  { label: "স্টোর", href: links.store },
  {
    label: "অন্যান্য",
    items: [
      { label: "স্কিলস", href: links.skills, icon: { Icon: LampCharge, tone: "text-info" } },
      { label: "ফ্রি কোর্সসমূহ", href: `${SITE}/categories/free/`, icon: { Icon: VideoTick, tone: "text-brand" } },
      { label: "বুক স্টোর", href: `${SITE}/store/`, icon: { Icon: BookSquare, tone: "text-highlight" } },
    ],
  },
];

/** The landing headers' tab style. */
export const NAV_TAB = "flex h-full items-center gap-1 px-3 text-base text-muted transition-colors hover:text-text";
