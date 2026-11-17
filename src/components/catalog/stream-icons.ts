import { Chart, Global, Microscope, type Icon } from "iconsax-react";

/** One icon per stream (lab `segment`, CT35): science a microscope, business a chart, humanities the globe. */
export const STREAM_ICON: Record<string, Icon> = { science: Microscope, "business-studies": Chart, humanities: Global };

/** CT218: the stream a visitor chose, so the segment page opens on it next time without asking (read on the server). */
export const STREAM_COOKIE = "hsc_stream";
