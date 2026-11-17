"use client";

import {
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  ChevronRight,
  FastForward,
  Gauge,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Undo2,
  UsersRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { createFormatter, fill, type Formatter } from "@/lib/format";
import { useDismiss } from "@/lib/use-dismiss";
import { IconButton } from "@/design-system/atoms/icon-button";
import { useLab, useLabAt } from "@/lib/lab";
import { partAt, Scrubber, SkipRipple, type VideoPart } from "./player-parts";
import { DEMO_POLLS } from "./demo-polls";
import { addNote, requestNote, useNotes } from "./notes";
import type { Audience } from "./demo-audience";
import { STAGE_BLEED } from "./stage";
import { publishPlayback, resetPlayback } from "./playback";

/*
 * Demo player: streams from YouTube but looks like our own CDN player.
 *  - YouTube's chrome is off (controls=0, no related videos, no annotations, no keyboard).
 *  - The iframe is taller than the stage and clipped, so YouTube's title bar and logo, drawn
 *    at the iframe's top and bottom edges, fall outside; the video itself isn't cropped.
 *  - The iframe ignores the pointer (no hover overlays). Our own layer handles clicks, and our
 *    paused / ended screens cover YouTube's "more videos" panels.
 * YouTube's API terms ask embeds not to hide its branding, so this is for the demo only;
 * production plays from the CDN.
 *
 * Speed and quality menus: speed is real (setPlaybackRate). Quality is not guaranteed: YouTube
 * deprecated manual quality control for embeds, so setPlaybackQuality / getAvailableQualityLevels
 * may do nothing or return little. In production the CDN (HLS) player makes this menu real by
 * switching renditions; in this YouTube demo the choice is only a request YouTube may ignore, so
 * the menu also shows the quality YouTube is actually playing.
 *
 * Lab `class` (P48, `?lab=class`): touch works like YouTube's phone player. A tap shows the
 * controls (they hide again after 3 s), a double tap on the left or right skips 10 s (each further
 * tap adds 10), a press and hold plays at 2x until the finger lifts, the seek bar drags, and on
 * phones full screen turns to landscape (a swipe down leaves it). Without the lab, the earlier
 * player: a tap plays or pauses, the controls show on hover.
 */

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  mute(): void;
  unMute(): void;
  destroy(): void;
  setPlaybackRate(r: number): void;
  getPlaybackRate(): number;
  getAvailablePlaybackRates(): number[];
  setPlaybackQuality(q: string): void;
  getPlaybackQuality(): string;
  getAvailableQualityLevels(): string[];
  getVideoLoadedFraction(): number;
  loadVideoById(o: { videoId: string; startSeconds?: number; suggestedQuality?: string }): void;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
        onPlaybackRateChange?: (e: { data: number }) => void;
        onPlaybackQualityChange?: (e: { data: string }) => void;
      };
    },
  ) => YTPlayer;
};
type YTWindow = Window & {
  YT?: YTNamespace;
  onYouTubeIframeAPIReady?: () => void;
};

const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;

/** Lab `class`: seconds a double tap skips; how fast a second tap must follow; how long a skip run keeps adding taps. */
const SKIP = 10;
const DOUBLE_MS = 300;
const CHAIN_MS = 700;
const HOLD_MS = 500;
const HIDE_MS = 3000;
/** Lab `class` v11 (P62): a swipe across the video's full width moves this many seconds; a jump at least this long offers the way back, for this long. */
const SWIPE_SEC = 90;
const BACK_MIN_SEC = 15;
const BACK_MS = 6000;

type Orientation = ScreenOrientation & {
  lock?: (o: "landscape") => Promise<void>;
};
/** Phones in full screen turn to landscape; desktops and iPhones refuse, which is fine. */
const lockLandscape = () => void (screen.orientation as Orientation | undefined)?.lock?.("landscape").catch(() => {});

let api: Promise<YTNamespace> | null = null;
/** Loads YouTube's iframe API once, on first play, never at page load. */
function loadApi() {
  const w = window as YTWindow;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  api ??= new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT!);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.append(tag);
  });
  return api;
}

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITY_LABEL: Record<string, string> = {
  hd1080: "1080p",
  hd720: "720p",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
};
const QUALITY_ORDER = Object.keys(QUALITY_LABEL);
const QUALITY_FALLBACK = ["hd1080", "hd720", "large", "medium"];
/** Lab `class` (P83): the choices offered: speeds from 0.75x, and 720p, 480p and 360p besides Auto. */
const LAB_MIN_RATE = 0.75;
/** Lab `class` (P101): the shortest time the first start shows the loading circle. */
const LAB_MIN_LOADING_MS = 2000;
const LAB_QUALITIES = ["hd720", "large", "medium"];
/** Lab `class` (P91): a recording shows its watching count only from this many. */
const AUDIENCE_MIN = 50;
/** The play / pause circle in the middle of the stage: one size and look for play, pause, replay and loading (P61). */
const CIRCLE = "grid size-16 place-items-center rounded-full bg-on-fill/15 ring-1 ring-on-fill/25 backdrop-blur sm:size-20";
const CIRCLE_ICON = "size-7 sm:size-8";
const SPINNER = "size-7 animate-spin rounded-full border-2 border-on-fill/30 border-t-on-fill sm:size-8";

const AUTO = "auto";

/** Quality levels YouTube reports, best first, without auto / highres; the fixed list if it reports none. */
function qualityLevels(p: YTPlayer | null) {
  const got = (p?.getAvailableQualityLevels() ?? []).filter((q) => q in QUALITY_LABEL);
  return got.length ? got.sort((a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b)) : QUALITY_FALLBACK;
}

type Phase = "idle" | "loading" | "playing" | "paused" | "ended";

export function YouTubePlayer({
  videoId,
  title,
  resumeSec,
  watchedPct,
  durationSec,
  locale,
  labels: localLabels,
  labelsEn,
  parts,
  noteKey: itemKey = null,
  audience = null,
  autoStart = false,
}: {
  videoId: string;
  title: string;
  resumeSec: number | null;
  watchedPct: number;
  durationSec: number | null;
  locale: Locale;
  labels: Dictionary["syllabus"]["player"];
  /** Lab `class` v10 (P60): the player's words in English. */
  labelsEn: Dictionary["syllabus"]["player"];
  /** Lab `class`: the video's parts, shown on the seek bar and in the control bar (P49). */
  parts?: VideoPart[];
  /** Lab `class` v15 (P67): the video's item id, for the student's marks and notes. */
  noteKey?: string | null;
  /** Lab `class` v19 (P91): live or not, and how many are watching (a demo sample for now). */
  audience?: Audience | null;
  /** Start playing on arrival (the "up next" card opened this class). Phones may block it; then the play button shows. */
  autoStart?: boolean;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [time, setTime] = useState(resumeSec ?? 0);
  const [duration, setDuration] = useState(durationSec ?? 0);
  const [muted, setMuted] = useState(false);
  const [full, setFull] = useState(false);
  const [rate, setRate] = useState(1);
  const [rates, setRates] = useState<number[]>([]);
  const [menu, setMenu] = useState<"speed" | "quality" | "parts" | null>(null);
  const [chosenQuality, setChosenQuality] = useState(AUTO);
  const [actualQuality, setActualQuality] = useState("");
  const [levels, setLevels] = useState(QUALITY_FALLBACK);
  const closeMenu = useCallback(() => setMenu(null), []);
  /** Demo: seconds before the end to jump to once the player is ready. */
  const pendingFromEnd = useRef<number | null>(null);
  /** A part picked before the player existed: where to start once it's ready. */
  const pendingAt = useRef<number | null>(null);

  // Lab `class` (P48).
  const lab = useLab("class") !== null;
  // Lab `class` v24 (P117): no length before the video loads; the API has none (the player's own clock stays).
  const light = useLabAt("class", 24);
  const noLiveTag = useLabAt("class", 36);
  // Lab `class` v49 (P143): the teacher's poll, as a pointer on the seek bar at its moment.
  const pollPin = useLabAt("class", 49);
  const poll = pollPin && itemKey ? DEMO_POLLS[itemKey] : undefined;
  // Lab `class` v50 (P144): no marks or notes: no bookmark button, no `B`/`N` keys, no dots on the seek bar.
  const noNotes = useLabAt("class", 50);
  const noteKey = noNotes ? null : itemKey;
  // Lab `class` (P59, P60): everything the player says in English, words and numbers (1x, Auto, 42% watched, 30:30 / 2:02:09), as in most video players.
  const fmt = createFormatter(lab ? "en" : locale, 0);
  const labels = lab ? labelsEn : localLabels;
  const notes = useNotes(lab ? noteKey : null);
  // The state keeps everything YouTube offers; the menus and the sheet show the lab's shorter lists (P83).
  const shownRates = lab ? rates.filter((r) => r >= LAB_MIN_RATE) : rates;
  const labLevels = levels.filter((q) => LAB_QUALITIES.includes(q));
  const shownLevels = lab ? (labLevels.length ? labLevels : LAB_QUALITIES) : levels;
  const [loaded, setLoaded] = useState(0);
  const [buffering, setBuffering] = useState(false);
  /** Full screen without the Fullscreen API (iPhones): the stage covers the window. */
  const [pseudoFull, setPseudoFull] = useState(false);
  /** Controls showing while the video plays (tap or mouse movement; they hide after HIDE_MS). */
  const [shown, setShown] = useState(false);
  /** The last press on the video was a finger: show the big centre buttons with the controls. */
  const [scrubbing, setScrubbing] = useState(false);
  const [skip, setSkip] = useState<{ side: -1 | 1; n: number } | null>(null);
  const [fast, setFast] = useState(false);
  /** Lab `class` v11 (P62): a swipe across the video in progress (where it started, where it would land). */
  const [swipe, setSwipe] = useState<{ from: number; to: number } | null>(null);
  /** Where the student was before a long jump: the "Back to 30:30" chip. */
  const [back, setBack] = useState<number | null>(null);
  /** Lab `class` v15 (P67): a mark just made, confirmed for a moment at the top of the video. */
  const [marked, setMarked] = useState<number | null>(null);
  const markTimer = useRef(0);
  /** Lab `class` v19 (P91): the watching count, moving a little every 12 s (the demo's stand-in for live numbers). */
  const [watching, setWatching] = useState(audience?.watching ?? 0);
  useEffect(() => {
    if (!audience) return;
    const id = window.setInterval(() => setWatching((n) => Math.max(1, n + Math.round(Math.random() * 14 - 5))), 12000);
    return () => window.clearInterval(id);
  }, [audience]);
  const hideTimer = useRef(0);
  const skipTimer = useRef(0);
  const backTimer = useRef(0);
  // Lab `class` v11 (P62): after a long jump, a chip leads back to where the student was. Jumps in a
  // row keep the first place, so exploring never loses it.
  const offerBack = useCallback(
    (from: number, to: number) => {
      if (!lab || Math.abs(to - from) < BACK_MIN_SEC) return;
      setBack((b) => b ?? from);
      window.clearTimeout(backTimer.current);
      backTimer.current = window.setTimeout(() => setBack(null), BACK_MS);
    },
    [lab],
  );
  const press = useRef<{
    x: number;
    y: number;
    moved: boolean;
    held: boolean;
    timer: number;
    /** Set once the finger moves sideways: a swipe to seek, measured from `x0` over the layer's `width`. */
    seek: { from: number; x0: number; width: number } | null;
  } | null>(null);
  const lastTap = useRef<{ at: number; side: -1 | 0 | 1 } | null>(null);
  const pointerKind = useRef("mouse");
  const heldRate = useRef(1);
  const isFull = full || pseudoFull;
  /** Seconds played this visit, and where the clock was at its last tick. */
  const played = useRef(0);
  const lastAt = useRef(resumeSec ?? 0);

  // Clock: only ticks while playing.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setTime(player.current?.getCurrentTime() ?? 0);
      setLoaded(player.current?.getVideoLoadedFraction?.() ?? 0);
      // Count what actually plays: steps of normal playback (2x included), not jumps.
      const now = player.current?.getCurrentTime() ?? 0;
      const step = now - lastAt.current;
      if (step > 0 && step < 1.5) played.current += step;
      lastAt.current = now;
    }, 250);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const onChange = () => {
      const on = document.fullscreenElement === stage.current;
      setFull(on);
      if (!on) {
        try {
          screen.orientation?.unlock();
        } catch {}
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(skipTimer.current);
      player.current?.destroy();
      resetPlayback();
    };
  }, []);

  // Share what's playing with the page (the phone's "up next" card).
  useEffect(() => publishPlayback({ phase, time, duration, played: played.current }), [phase, time, duration]);
  useEffect(() => publishPlayback({ stage: stage.current }), []);
  useEffect(() => publishPlayback({ fullStage: isFull ? stage.current : null }), [isFull]);

  // Lab `class` v21 (P105): turning a phone sideways with a video started fills the screen with it; turning it
  // back undoes it. A browser allows real full screen only after a tap, so where it refuses, the stage fills the window.
  const autoFull = useRef(false);
  useEffect(() => {
    if (!lab) return;
    const sideways = matchMedia("(orientation: landscape) and (pointer: coarse) and (max-height: 32rem)");
    const onTurn = () => {
      const el = stage.current;
      if (!el) return;
      if (sideways.matches) {
        if (phase === "idle" || document.fullscreenElement || pseudoFull) return;
        autoFull.current = true;
        if (el.requestFullscreen) el.requestFullscreen().catch(() => setPseudoFull(true));
        else setPseudoFull(true);
      } else if (autoFull.current) {
        autoFull.current = false;
        if (document.fullscreenElement) void document.exitFullscreen();
        setPseudoFull(false);
      }
    };
    sideways.addEventListener("change", onTurn);
    return () => sideways.removeEventListener("change", onTurn);
  }, [lab, phase, pseudoFull]);

  // The window-filling stage keeps the page behind it still.
  useEffect(() => {
    if (!pseudoFull) return;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => void (root.style.overflow = before);
  }, [pseudoFull]);

  // Set while the player is being created, so a second call (autoplay, a quick double tap) can't make another.
  const creating = useRef(false);
  // Lab `class` (P101): the first start shows the loading circle for at least 2 s from the tap. YouTube loads
  // meanwhile; if it starts sooner, it is paused at once and played when the 2 s are up (`holding`).
  const startedAt = useRef(0);
  const holding = useRef(false);
  const start = useCallback(async () => {
    if (player.current) return player.current.playVideo();
    if (creating.current) return;
    creating.current = true;
    setPhase("loading");
    startedAt.current = Date.now();
    const YT = await loadApi();
    player.current = new YT.Player(mount.current!, {
      videoId,
      host: "https://www.youtube-nocookie.com",
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        rel: 0,
        playsinline: 1,
        cc_load_policy: 0,
      },
      events: {
        onReady: () => {
          const p = player.current!;
          const d = p.getDuration();
          setDuration(d);
          // Resume where the student stopped, unless that's past this video's end.
          if (pendingAt.current !== null) {
            p.seekTo(Math.min(pendingAt.current, d), true);
            pendingAt.current = null;
          } else if (pendingFromEnd.current !== null) {
            p.seekTo(Math.max(0, d - pendingFromEnd.current), true);
            pendingFromEnd.current = null;
          } else if (resumeSec && resumeSec < d - 5) p.seekTo(resumeSec, true);
          p.playVideo();
          // A phone may refuse to start without a fresh tap: fall back to the play button.
          window.setTimeout(() => setPhase((cur) => (cur === "loading" ? "paused" : cur)), 2500);
          const offered = p.getAvailablePlaybackRates?.() ?? [];
          setRates(RATES.filter((r) => offered.includes(r)));
          setRate(p.getPlaybackRate());
        },
        onPlaybackRateChange: ({ data }) => setRate(data),
        onPlaybackQualityChange: ({ data }) => {
          setActualQuality(data);
          setLevels(qualityLevels(player.current));
        },
        onStateChange: ({ data }) => {
          if (holding.current) return;
          const early = LAB_MIN_LOADING_MS - (Date.now() - startedAt.current);
          if (lab && data === PLAYING && early > 0 && startedAt.current) {
            holding.current = true;
            player.current?.pauseVideo();
            window.setTimeout(() => {
              holding.current = false;
              player.current?.playVideo();
            }, early);
            return;
          }
          setBuffering(data === BUFFERING);
          if (data === PLAYING) {
            startedAt.current = 0;
            setPhase("playing");
          } else if (data === ENDED) setPhase("ended");
          else if (data === PAUSED) setPhase("paused");
        },
      },
    });
  }, [videoId, resumeSec, lab]);

  useEffect(() => {
    if (autoStart) void start();
  }, [autoStart, start]);

  // Demo only: jump near the end so the "up next" card can be seen without waiting.
  useEffect(() => {
    publishPlayback({
      seekFromEnd: (left) => {
        const p = player.current;
        if (!p) {
          pendingFromEnd.current = left;
          void start();
          return;
        }
        const to = Math.max(0, p.getDuration() - left);
        p.seekTo(to, true);
        setTime(to);
        p.playVideo();
      },
      // A part chosen under the video (P49): jump there, starting the video if needed.
      seekTo: (sec) => {
        const p = player.current;
        setTime(sec);
        if (!p) {
          pendingAt.current = sec;
          void start();
          return;
        }
        offerBack(p.getCurrentTime(), sec);
        p.seekTo(sec, true);
        p.playVideo();
      },
      // Lab `class` v15 (P67): the note composer holds the video while the student writes.
      pause: () => player.current?.pauseVideo(),
      play: () => player.current?.playVideo(),
    });
  }, [start, offerBack]);

  const toggle = () => {
    if (phase === "playing") player.current?.pauseVideo();
    else if (phase === "ended") {
      player.current?.seekTo(0, true);
      player.current?.playVideo();
    } else void start();
  };

  const seekTo = (s: number) => {
    const to = Math.max(0, Math.min(duration, s));
    setTime(to);
    player.current?.seekTo(to, true);
  };
  /** A long jump (seek bar, a part, a swipe): seek, and offer the way back. */
  const jumpTo = (s: number) => {
    offerBack(player.current?.getCurrentTime() ?? time, s);
    seekTo(s);
  };
  const goBack = () => {
    if (back === null) return;
    window.clearTimeout(backTimer.current);
    setBack(null);
    seekTo(back);
  };

  const onSeekPointer = (e: PointerEvent<HTMLDivElement>) => {
    if (!player.current || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    seekTo(((e.clientX - r.left) / r.width) * duration);
  };

  /** Lab `class` v15 (P67): mark this moment (the control bar's bookmark, or `B`). */
  const mark = () => {
    const p = player.current;
    if (!lab || !noteKey || !p) return;
    const at = p.getCurrentTime();
    addNote(noteKey, at, null);
    setMarked(at);
    window.clearTimeout(markTimer.current);
    markTimer.current = window.setTimeout(() => setMarked(null), 1800);
  };

  const onKeys = (e: KeyboardEvent) => {
    if (!player.current) return;
    const k = e.key;
    if (lab && noteKey && (k === "b" || k === "n")) {
      e.preventDefault();
      return k === "b" ? mark() : requestNote();
    }
    if (k === ">" || k === "<") {
      const i = RATES.indexOf(rate);
      const next = RATES[Math.max(0, Math.min(RATES.length - 1, i + (k === ">" ? 1 : -1)))];
      if (next !== undefined && next !== rate && (shownRates.length === 0 || shownRates.includes(next))) changeRate(next);
    } else if (k === " " || k === "k") toggle();
    else if (k === "ArrowRight") seekTo(time + 5);
    else if (k === "ArrowLeft") seekTo(time - 5);
    else if (lab && (k === "l" || k === "j")) seekTo(time + (k === "l" ? SKIP : -SKIP));
    else if (k === "Escape" && pseudoFull) setPseudoFull(false);
    else if (k === "m") toggleMute();
    else if (k === "f") toggleFull();
    else return;
    e.preventDefault();
  };

  const changeRate = (r: number) => {
    player.current?.setPlaybackRate(r);
    setRate(r);
  };

  // Lab `class` v16 (P73): on a finger device, speed, quality and the parts open in a bottom sheet.
  const [sheet, setSheet] = useState<SheetView | null>(null);
  /** Where the sheet renders: in full screen only the stage shows, so inside it; otherwise over the page. */
  const [sheetHost, setSheetHost] = useState<HTMLElement | null>(null);
  const openSheet = (v: SheetView) => {
    setSheetHost((isFull && stage.current) || document.body);
    if (v === "main") {
      setLevels(qualityLevels(player.current));
      setActualQuality(player.current?.getPlaybackQuality() ?? "");
    }
    setSheet(v);
  };
  const closeSheet = () => {
    setSheet(null);
    poke();
  };

  const openMenu = (m: "speed" | "quality" | "parts") => {
    if (m === "quality") {
      setLevels(qualityLevels(player.current));
      setActualQuality(player.current?.getPlaybackQuality() ?? "");
    }
    setMenu((cur) => (cur === m ? null : m));
  };

  const changeQuality = (q: string) => {
    const p = player.current;
    setChosenQuality(q);
    if (!p) return;
    p.setPlaybackQuality(q === AUTO ? "default" : q);
    // Best effort: YouTube may ignore both calls; the menu shows the quality it actually plays.
    if (q !== AUTO && phase === "playing") {
      p.loadVideoById({
        videoId,
        startSeconds: p.getCurrentTime(),
        suggestedQuality: q,
      });
    }
  };

  const toggleMute = () => {
    if (muted) player.current?.unMute();
    else player.current?.mute();
    setMuted(!muted);
  };

  const exitFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    setPseudoFull(false);
  };

  const toggleFull = () => {
    if (isFull) return exitFull();
    const el = stage.current;
    if (!el) return;
    // iPhones can't put a page element in full screen: the stage fills the window instead.
    if (!el.requestFullscreen) return setPseudoFull(true);
    el.requestFullscreen().then(
      () => lab && lockLandscape(),
      () => setPseudoFull(true),
    );
  };

  // Lab `class`: the controls come and go like YouTube's.
  const poke = useCallback(() => {
    setShown(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShown(false), HIDE_MS);
  }, []);
  const hide = () => {
    window.clearTimeout(hideTimer.current);
    setShown(false);
  };

  const addSkip = (side: -1 | 1) => {
    const p = player.current;
    if (!p) return;
    const to = Math.max(0, Math.min(duration, p.getCurrentTime() + side * SKIP));
    p.seekTo(to, true);
    setTime(to);
    setSkip((s) => (s?.side === side ? { side, n: s.n + 1 } : { side, n: 1 }));
    window.clearTimeout(skipTimer.current);
    skipTimer.current = window.setTimeout(() => setSkip(null), CHAIN_MS);
  };

  const startFast = () => {
    const p = player.current;
    if (!p || (rates.length > 0 && !rates.includes(2))) return;
    heldRate.current = p.getPlaybackRate();
    p.setPlaybackRate(2);
    setFast(true);
    hide();
  };
  const stopFast = () => {
    player.current?.setPlaybackRate(heldRate.current);
    setFast(false);
  };

  const endPress = () => {
    const s = press.current;
    press.current = null;
    if (s) window.clearTimeout(s.timer);
    if (s?.held) stopFast();
    if (s?.seek) setSwipe(null);
    return s;
  };
  /** Where a swipe that has moved the finger to `x` lands. */
  const swipeTo = (seek: { from: number; x0: number; width: number }, x: number) =>
    Math.max(0, Math.min(duration, seek.from + ((x - seek.x0) / seek.width) * SWIPE_SEC));

  const onLayerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointerKind.current = e.pointerType;
    if (e.pointerType === "mouse") return;
    const timer = window.setTimeout(() => {
      const s = press.current;
      if (!s || s.moved) return;
      s.held = true;
      startFast();
    }, HOLD_MS);
    press.current = {
      x: e.clientX,
      y: e.clientY,
      moved: false,
      held: false,
      timer,
      seek: null,
    };
  };

  // A finger that moves sideways (lab `class` v11, P62) seeks like MX Player: the full width is 90 s
  // whatever the class's length, so a long class can still be moved by a few seconds. The video jumps on release.
  const onLayerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = press.current;
    if (!s || s.held) return;
    if (s.seek) return setSwipe({ from: s.seek.from, to: swipeTo(s.seek, e.clientX) });
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (s.moved || Math.hypot(dx, dy) < 12) return;
    s.moved = true;
    window.clearTimeout(s.timer);
    const p = player.current;
    if (lab && p && duration && Math.abs(dx) > Math.abs(dy) * 1.5) {
      e.currentTarget.setPointerCapture(e.pointerId);
      const from = p.getCurrentTime();
      s.seek = { from, x0: e.clientX, width: e.currentTarget.getBoundingClientRect().width };
      setSwipe({ from, to: from });
      hide();
    }
  };

  // A finger: one tap shows or hides the controls; two quick taps on a side skip, and while the
  // ripple shows, each further tap on that side adds another 10 s. The middle fifth never skips.
  const onLayerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    const s = endPress();
    if (!s || s.held) return;
    if (s.seek) return jumpTo(swipeTo(s.seek, e.clientX));
    if (s.moved) {
      if (isFull && e.clientY - s.y > 60) exitFull();
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const f = (e.clientX - r.left) / r.width;
    const side = f < 0.4 ? -1 : f > 0.6 ? 1 : 0;
    if (side !== 0 && skip?.side === side) return addSkip(side);
    const last = lastTap.current;
    if (side !== 0 && last?.side === side && e.timeStamp - last.at < DOUBLE_MS) {
      lastTap.current = null;
      hide();
      return addSkip(side);
    }
    lastTap.current = { at: e.timeStamp, side };
    if (shown) hide();
    else poke();
  };

  const started = phase !== "idle";
  const pct = duration ? (time / duration) * 100 : watchedPct;
  const covered = phase === "idle" || phase === "loading" || phase === "paused" || phase === "ended";
  const barOn = phase !== "playing" || shown || menu !== null || scrubbing || sheet !== null;
  // Lab `class` (P102): back 10 s and forward 10 s beside the centre button, for a finger and a mouse alike:
  // with the controls while playing, and always while paused.
  const centre = lab && !fast && ((phase === "playing" && shown) || phase === "paused");
  // Lab `class` (P102): who is watching shows with the controls only, so the slide's corner stays clear.
  const pillOn = lab && !!audience && barOn && (audience.live || watching >= AUDIENCE_MIN);
  // Lab `class` v51 (P147): the watching count leaves the video for a line above the class title (WatchingLine).
  const pillLow = useLabAt("class", 51);
  // Lab `class` v52 (P148): the part playing leaves the video too, for that line (no chip, no control-bar menu).
  const partsOut = useLabAt("class", 52);
  const watchingPill = (where: string) =>
    audience && (
      <div
        role="status"
        className={cn(
          "pointer-events-none z-10 flex h-7 items-center gap-1.5 rounded-full bg-player/70 px-2.5 text-xs font-semibold tabular-nums backdrop-blur",
          where,
        )}
      >
        {/* Lab `class` v36 (P129): no "● LIVE"; the watching count says enough. */}
        {audience.live && !noLiveTag && (
          <>
            <span className="size-2 rounded-full bg-live motion-safe:animate-pulse" aria-hidden />
            <span>{labels.live}</span>
            <span className="text-on-fill/50" aria-hidden>
              ·
            </span>
          </>
        )}
        {/* Lab `class` v38 (P131): two people before the count, now that it stands alone (P129); v37's eye was misread. */}
        {noLiveTag && <UsersRound className="size-3.5 text-on-fill/80" aria-hidden />}
        <span className="text-on-fill/90">{fill(labels.watching, { n: watching >= 1000 ? fmt.compact(watching) : fmt.number(watching) })}</span>
      </div>
    );
  const current = parts?.length ? partAt(parts, time) : undefined;

  return (
    <div
      ref={stage}
      onKeyDown={onKeys}
      onPointerMove={lab ? (e) => e.pointerType === "mouse" && poke() : undefined}
      onPointerLeave={lab ? (e) => e.pointerType === "mouse" && phase === "playing" && hide() : undefined}
      className={cn(
        "group/player relative aspect-video w-full overflow-hidden bg-player text-on-fill",
        isFull ? "rounded-none" : "rounded-lg",
        lab && !isFull && STAGE_BLEED,
        pseudoFull && "fixed inset-0 z-[70] aspect-auto h-dvh",
      )}
    >
      {/* Taller than the stage by 2 × 80px; YouTube's title bar and logo sit in that clipped margin. In full screen,
          the teacher's poll (P103) takes the right side and the video moves left to keep the slide whole. */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-20 -bottom-20 transition-[right] duration-(--motion-base) ease-emphasis group-data-[poll]/player:right-[calc(min(22rem,45%)+1.5rem)]"
        aria-hidden
      >
        <div ref={mount} className="size-full" />
      </div>

      {/* Poster before the first play: the video's own frame, dimmed. */}
      {!started && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/sddefault.jpg)`,
          }}
        />
      )}

      {/* Lab `class`, while playing: the gesture layer. A mouse click still plays / pauses; a double click is full screen. */}
      {lab && phase === "playing" ? (
        <div
          aria-hidden
          onPointerDown={onLayerDown}
          onPointerMove={onLayerMove}
          onPointerUp={onLayerUp}
          onPointerCancel={endPress}
          onClick={() => {
            if (pointerKind.current !== "mouse") return;
            toggle();
            poke();
          }}
          onDoubleClick={() => pointerKind.current === "mouse" && toggleFull()}
          onContextMenu={(e) => e.preventDefault()}
          className={cn("absolute inset-0 select-none [-webkit-touch-callout:none]", isFull ? "touch-none" : "touch-pan-y")}
        />
      ) : (
        /* Click anywhere to play / pause. Paused and ended screens hide YouTube's own panels. */
        <button
          type="button"
          onClick={toggle}
          aria-label={phase === "playing" ? labels.pause : title}
          className={cn(
            "group/play absolute inset-0 grid place-items-center transition-colors",
            covered && started && "bg-player/70 backdrop-blur-md",
          )}
        >
          {/* The circle sits in the exact middle, like the phone's pause button (P61); the line hangs below it without moving it. */}
          {phase !== "playing" && (
            <span className="relative">
              <span className={cn(CIRCLE, "transition-transform group-hover/play:scale-105")}>
                {phase === "loading" ? (
                  <span className={SPINNER} />
                ) : phase === "ended" ? (
                  <RotateCcw className={CIRCLE_ICON} aria-hidden />
                ) : (
                  <Play className={cn(CIRCLE_ICON, "translate-x-0.5 fill-current")} aria-hidden />
                )}
              </span>
              {/* Below 360px the stage is too short for this line and the progress row (P87); the row already says how much is watched.
                  Lab `class` (P90): no "Play video" under a plain play button, students know it; only resume and replay say something. */}
              {(() => {
                const words =
                  phase === "ended"
                    ? labels.replay
                    : // The resume line stays while the video loads, so the words don't change under the finger.
                      (phase === "idle" || phase === "loading") && resumeSec
                      ? fill(labels.resumeAt, { time: fmt.duration(resumeSec) })
                      : lab
                        ? null
                        : labels.play;
                return (
                  words && (
                    <span className="absolute top-full left-1/2 mt-3 -translate-x-1/2 text-sm font-semibold whitespace-nowrap max-[22.5rem]:hidden">
                      {words}
                    </span>
                  )
                );
              })()}
            </span>
          )}
        </button>
      )}

      {/* Lab `class` v11 (P62): the swipe's jump and where it lands, in the middle; the video moves on release. */}
      {lab && swipe && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-player/30">
          <div
            role="status"
            aria-label={fill(labels.swipe, { delta: swipeDelta(swipe, fmt), time: fmt.duration(swipe.to) })}
            className="grid min-w-44 justify-items-center gap-2 rounded-xl bg-player/75 px-5 py-3 tabular-nums backdrop-blur"
          >
            <span className="text-2xl font-bold">{swipeDelta(swipe, fmt)}</span>
            <span className="text-sm text-on-fill/80">
              {fmt.duration(swipe.to)} / {fmt.duration(duration)}
            </span>
            <span className="h-1 w-full overflow-hidden rounded-full bg-on-fill/25" aria-hidden>
              <span className="block h-full rounded-full bg-live" style={{ width: `${duration ? (swipe.to / duration) * 100 : 0}%` }} />
            </span>
            {parts?.length ? <span className="max-w-56 truncate text-xs text-on-fill/80">{partAt(parts, swipe.to)?.title}</span> : null}
          </div>
        </div>
      )}

      {/* Lab `class` v19 (P91): who is watching, with the controls (P102). A recording only from 50 watching
          (a small number reads as an empty class). Lab `class` v51 (P147): it moves out, above the class title. */}
      {pillOn && !pillLow && watchingPill("absolute top-3 left-3")}

      {/* Lab `class` v11 (P62): after a long jump, the way back. */}
      {lab && back !== null && !swipe && (
        <button
          type="button"
          onClick={goBack}
          // Under the watching pill when it shows (P91).
          className={cn(
            "absolute left-3 z-10 flex h-9 items-center gap-1.5 rounded-full bg-player/75 pr-3.5 pl-2.5 text-sm font-semibold tabular-nums ring-1 ring-on-fill/20 backdrop-blur transition-colors press hover:bg-player/90",
            pillOn && !pillLow ? "top-12" : "top-3",
          )}
        >
          <Undo2 className="size-4" aria-hidden />
          {fill(labels.backTo, { time: fmt.duration(back) })}
        </button>
      )}

      {lab && skip && <SkipRipple side={skip.side} label={fill(labels.seconds, { n: fmt.number(skip.n * SKIP) })} />}

      {/* Lab `class` v15 (P67): a mark just made. */}
      {lab && marked !== null && !fast && (
        <div
          role="status"
          className="pointer-events-none absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-player/75 px-3 py-1 text-sm font-semibold tabular-nums backdrop-blur"
        >
          <BookmarkCheck className="size-4 text-warning" aria-hidden />
          {fill(labels.marked, { time: fmt.duration(marked) })}
        </div>
      )}

      {lab && fast && (
        <div className="pointer-events-none absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-player/70 px-3 py-1 text-sm font-semibold">
          {fmt.number(2)}x
          <FastForward className="size-4 fill-current" aria-hidden />
        </div>
      )}

      {/* Buffering, with the controls away: a small spinner in the middle. */}
      {lab && buffering && phase === "playing" && !centre && (
        <span className="pointer-events-none absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-on-fill/30 border-t-on-fill" />
      )}

      {/* With the controls up: back 10 s, play / pause, forward 10 s, in the middle like YouTube. Paused, the stage's
          own play circle is the middle one, so a same-sized gap keeps the skips around it. */}
      {centre && (
        <div
          className={cn(
            // With the poll's panel open in full screen (P103), centred on the video, not the stage.
            "pointer-events-none absolute inset-0 flex items-center justify-center gap-10 transition-[right] duration-(--motion-base) ease-emphasis group-data-[poll]/player:right-[calc(min(22rem,45%)+1.5rem)] sm:gap-16",
            phase === "playing" && "bg-player/30",
          )}
        >
          <CentreButton label={fill(labels.skipBack, { n: fmt.number(SKIP) })} onClick={() => (addSkip(-1), poke())}>
            <RotateCcw className="size-8" strokeWidth={1.5} aria-hidden />
            <span className="absolute pt-0.5 text-xs font-bold">{fmt.number(SKIP)}</span>
          </CentreButton>
          {phase === "playing" ? (
            <CentreButton big label={labels.pause} onClick={toggle}>
              {buffering ? <span className={SPINNER} /> : <Pause className={cn(CIRCLE_ICON, "fill-current")} aria-hidden />}
            </CentreButton>
          ) : (
            <span className={cn(CIRCLE, "invisible")} aria-hidden />
          )}
          <CentreButton label={fill(labels.skipForward, { n: fmt.number(SKIP) })} onClick={() => (addSkip(1), poke())}>
            <RotateCw className="size-8" strokeWidth={1.5} aria-hidden />
            <span className="absolute pt-0.5 text-xs font-bold">{fmt.number(SKIP)}</span>
          </CentreButton>
        </div>
      )}

      {/* Lab `class` v16 (P73), a finger: mark and settings at the top right, as in YouTube's phone player. */}
      {lab && started && (
        <div
          className={cn(
            "absolute top-2 right-2 hidden items-center gap-1 transition-opacity compact:flex",
            !barOn && "pointer-events-none opacity-0",
          )}
        >
          {noteKey && (
            <IconButton variant="player" label={labels.mark} onClick={() => (mark(), poke())}>
              <Bookmark className="size-5" />
            </IconButton>
          )}
          <IconButton variant="player" label={labels.settings} onClick={() => openSheet("main")}>
            <Settings className="size-5" />
          </IconButton>
        </div>
      )}

      {lab &&
        sheet &&
        sheetHost &&
        createPortal(
          <SettingsSheet
            view={sheet}
            labels={labels}
            onClose={closeSheet}
            speed={
              shownRates.length > 0
                ? {
                    items: shownRates.map((r) => ({ key: String(r), label: `${fmt.number(r)}x`, checked: r === rate })),
                    choose: (k) => changeRate(Number(k)),
                  }
                : null
            }
            quality={{
              items: [
                { key: AUTO, label: labels.auto, checked: chosenQuality === AUTO },
                ...shownLevels.map((q) => ({ key: q, label: QUALITY_LABEL[q], checked: q === chosenQuality })),
              ],
              choose: changeQuality,
              note: QUALITY_LABEL[actualQuality] ? fill(labels.qualityNow, { quality: QUALITY_LABEL[actualQuality] }) : undefined,
            }}
            parts={
              parts?.length
                ? {
                    items: parts.map((p) => ({ key: String(p.startSec), label: `${fmt.duration(p.startSec)}  ${p.title}`, checked: p === current })),
                    choose: (k) => jumpTo(Number(k)),
                  }
                : null
            }
          />,
          sheetHost,
        )}

      {/* Our control bar. Before play it's the watched-progress summary; after, a real scrubber. */}
      <div
        onPointerDown={lab ? poke : undefined}
        className={cn(
          "absolute inset-x-0 bottom-0 grid gap-2 bg-linear-to-t from-player/80 to-transparent px-4 pt-10 pb-3 transition-opacity",
          lab
            ? barOn
              ? // The bar's faded top must not catch taps meant for the play button over a short (phone) stage, P75.
                "pointer-events-none *:pointer-events-auto"
              : "pointer-events-none opacity-0 group-has-[:focus-visible]/player:pointer-events-auto group-has-[:focus-visible]/player:opacity-100"
            : phase === "playing" && !menu && "opacity-0 group-hover/player:opacity-100 group-focus-within/player:opacity-100",
        )}
      >
        {started ? (
          <>
            {lab ? (
              <>
                {/* A finger (P73): the part playing as a chip above the bar; it opens the parts in the sheet. */}
                {current && !partsOut && (
                  <button
                    type="button"
                    onClick={() => openSheet("parts")}
                    className="-mb-1 hidden max-w-[70%] items-center gap-1 justify-self-start rounded-full px-1 text-sm font-medium text-on-fill/90 compact:flex"
                  >
                    <span className="truncate">· {current.title}</span>
                    <ChevronRight className="size-4 shrink-0" aria-hidden />
                  </button>
                )}
                {/* A finger: the time either side of a thick bar, as in the current app, and full screen at the end. */}
                <div className="flex items-center gap-3">
                  <span className="hidden text-sm font-medium tabular-nums compact:inline">{fmt.duration(time)}</span>
                  <div className="min-w-0 flex-1">
                    <Scrubber
                      time={time}
                      duration={duration}
                      loaded={loaded}
                      parts={parts}
                      playing={phase === "playing"}
                      label={labels.seek}
                      fmt={fmt}
                      onSeek={jumpTo}
                      marks={notes.map((n) => n.sec)}
                      pin={poll && { sec: poll.at, label: labels.poll }}
                      onScrub={(on) => {
                        setScrubbing(on);
                        if (!on) poke();
                      }}
                    />
                  </div>
                  <span className="hidden text-sm font-medium tabular-nums text-on-fill/80 compact:inline">{fmt.duration(duration)}</span>
                  <IconButton
                    variant="player"
                    label={isFull ? labels.exitFullscreen : labels.fullscreen}
                    onClick={toggleFull}
                    className="-mr-2 hidden compact:inline-grid"
                  >
                    {isFull ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
                  </IconButton>
                </div>
              </>
            ) : (
              <div
                role="slider"
                tabIndex={0}
                aria-label={labels.seek}
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(time)}
                aria-valuetext={`${fmt.duration(time)} / ${fmt.duration(duration)}`}
                onPointerDown={onSeekPointer}
                className="group/seek relative flex h-4 cursor-pointer items-center"
              >
                <div className="h-1 w-full overflow-hidden rounded-full bg-on-fill/25 transition-[height] group-hover/seek:h-1.5">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
            {/* 14px: Bangla digits at 12px were too small to read on video. A finger in the lab gets the row above instead (P73). */}
            <div className={cn("flex items-center gap-1 text-sm tabular-nums", lab && "compact:hidden")}>
              <IconButton variant="player" tooltip label={phase === "playing" ? labels.pause : labels.play} onClick={toggle}>
                {phase === "playing" ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
              </IconButton>
              <IconButton variant="player" tooltip label={muted ? labels.unmute : labels.mute} onClick={toggleMute}>
                {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </IconButton>
              <span className="ml-1 font-medium whitespace-nowrap text-on-fill/90">
                {fmt.duration(time)} / {fmt.duration(duration)}
              </span>
              {/* The part playing, after the time (P49); its menu jumps to another. Phones in portrait have the list under the video instead. */}
              {lab && current && !partsOut && (
                <PlayerMenu
                  label={labels.parts}
                  value={current.title}
                  face={<span className="max-w-48 truncate">· {current.title}</span>}
                  align="left"
                  className="min-w-0 max-sm:hidden"
                  open={menu === "parts"}
                  onToggle={() => openMenu("parts")}
                  onClose={closeMenu}
                  items={parts!.map((p) => ({ key: String(p.startSec), label: `${fmt.duration(p.startSec)}  ${p.title}`, checked: p === current }))}
                  onChoose={(k) => jumpTo(Number(k))}
                />
              )}
              <div className="ml-auto flex items-center gap-0.5">
                {lab && noteKey && (
                  <IconButton variant="player" tooltip label={labels.mark} onClick={mark}>
                    <Bookmark className="size-5" />
                  </IconButton>
                )}
                {shownRates.length > 0 && (
                  <PlayerMenu
                    label={labels.speed}
                    icon={<Gauge className="size-5" />}
                    value={`${fmt.number(rate)}x`}
                    open={menu === "speed"}
                    onToggle={() => openMenu("speed")}
                    onClose={closeMenu}
                    items={shownRates.map((r) => ({
                      key: String(r),
                      label: `${fmt.number(r)}x`,
                      checked: r === rate,
                    }))}
                    onChoose={(k) => changeRate(Number(k))}
                  />
                )}
                <PlayerMenu
                  label={labels.quality}
                  icon={<Settings className="size-5" />}
                  value={chosenQuality === AUTO ? labels.auto : QUALITY_LABEL[chosenQuality]}
                  open={menu === "quality"}
                  onToggle={() => openMenu("quality")}
                  onClose={closeMenu}
                  items={[
                    {
                      key: AUTO,
                      label: labels.auto,
                      checked: chosenQuality === AUTO,
                    },
                    ...shownLevels.map((q) => ({
                      key: q,
                      label: QUALITY_LABEL[q],
                      checked: q === chosenQuality,
                    })),
                  ]}
                  onChoose={changeQuality}
                  note={
                    QUALITY_LABEL[actualQuality]
                      ? fill(labels.qualityNow, {
                          quality: QUALITY_LABEL[actualQuality],
                        })
                      : undefined
                  }
                />
              </div>
              <IconButton variant="player" tooltip label={isFull ? labels.exitFullscreen : labels.fullscreen} onClick={toggleFull}>
                {isFull ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
              </IconButton>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 text-sm text-on-fill/85 tabular-nums">
              <span>{watchedPct > 0 && fill(labels.watched, { pct: fmt.percent(watchedPct) })}</span>
              {durationSec && !light && <span>{fmt.duration(durationSec)}</span>}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-on-fill/20" aria-hidden>
              <div className={cn("h-full rounded-full", lab ? "bg-live" : "bg-brand")} style={{ width: `${watchedPct}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** A big round button in the middle of the video (lab `class`, phones). */
type SheetView = "main" | "parts";
type SheetList = { items: MenuItem[]; choose: (key: string) => void };

/**
 * Lab `class` v16 (P73, P76): the player's settings on a finger device, as a bottom sheet with the options
 * themselves: the speeds in a row of chips, then the qualities, so one tap changes either; the choice
 * applies and closes the sheet. The parts chip opens the parts list in the same sheet. A tap outside or
 * Esc closes it.
 */
function SettingsSheet({
  view,
  labels,
  onClose,
  speed,
  quality,
  parts,
}: {
  view: SheetView;
  labels: Dictionary["syllabus"]["player"];
  onClose: () => void;
  speed: SheetList | null;
  quality: SheetList & { note?: string };
  parts: SheetList | null;
}) {
  const title = view === "parts" ? labels.parts : labels.settings;
  const pick = (list: SheetList, key: string) => (list.choose(key), onClose());
  return (
    <div className="fixed inset-0 z-[80]" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="absolute inset-0 animate-[fade-in_var(--motion-base)_ease-out] bg-player/50" aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[80dvh] max-w-lg animate-[sheet-up_var(--motion-base)_var(--ease-emphasis)] overflow-y-auto rounded-t-xl bg-player p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-on-fill shadow-pop ring-1 ring-on-fill/10"
      >
        <div className="mx-auto mt-1 mb-2 h-1 w-9 rounded-full bg-on-fill/30" aria-hidden />
        {view === "parts" && parts ? (
          <>
            <p className="flex h-11 items-center px-3 text-sm font-semibold text-on-fill/80">{title}</p>
            {parts.items.map((i) => (
              <button
                key={i.key}
                type="button"
                autoFocus={i.checked}
                onClick={() => pick(parts, i.key)}
                className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-base transition-colors press hover:bg-on-fill/10"
              >
                <Check className={cn("size-5 shrink-0 text-brand", !i.checked && "invisible")} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{i.label}</span>
              </button>
            ))}
          </>
        ) : (
          <div className="grid gap-4 px-2 pt-1 pb-1">
            {speed && <ChipGroup icon={<Gauge className="size-4" aria-hidden />} title={labels.speed} list={speed} onPick={(k) => pick(speed, k)} />}
            <ChipGroup
              icon={<Settings className="size-4" aria-hidden />}
              title={labels.quality}
              list={quality}
              onPick={(k) => pick(quality, k)}
              note={quality.note}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** One setting in the sheet: its name, then every option as a chip; the current one filled. */
function ChipGroup({
  icon,
  title,
  list,
  note,
  onPick,
}: {
  icon: ReactNode;
  title: string;
  list: SheetList;
  note?: string;
  onPick: (key: string) => void;
}) {
  return (
    <section role="radiogroup" aria-label={title} className="grid gap-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-on-fill/80">
        {icon}
        {title}
      </p>
      {/* Up to six options share one row in equal widths (speed: 0.5x … 2x); more wrap. */}
      <div
        className={cn("gap-2", list.items.length <= 6 ? "grid" : "flex flex-wrap")}
        style={list.items.length <= 6 ? { gridTemplateColumns: `repeat(${list.items.length}, minmax(0, 1fr))` } : undefined}
      >
        {list.items.map((i) => (
          <button
            key={i.key}
            type="button"
            role="radio"
            aria-checked={i.checked}
            autoFocus={i.checked}
            onClick={() => onPick(i.key)}
            className={cn(
              "h-10 rounded-full text-sm font-semibold whitespace-nowrap tabular-nums transition-colors press",
              list.items.length <= 6 ? "min-w-0 px-1" : "min-w-14 px-3",
              i.checked ? "bg-on-fill text-player" : "bg-on-fill/10 text-on-fill hover:bg-on-fill/15",
            )}
          >
            {i.label}
          </button>
        ))}
      </div>
      {note && <p className="text-xs text-on-fill/60">{note}</p>}
    </section>
  );
}

/** "+0:45" or "−1:20": how far a swipe moves. */
function swipeDelta(swipe: { from: number; to: number }, fmt: Formatter) {
  const d = Math.round(swipe.to - swipe.from);
  return `${d < 0 ? "−" : "+"}${fmt.duration(Math.abs(d))}`;
}

function CentreButton({ label, big = false, onClick, children }: { label: string; big?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "pointer-events-auto relative transition-transform active:scale-90",
        // The big one is the same circle as the paused play button, so play ⇄ pause swap in place (P61).
        big ? CIRCLE : "grid size-12 place-items-center rounded-full bg-player/40 backdrop-blur-sm",
      )}
    >
      {children}
    </button>
  );
}

type MenuItem = { key: string; label: string; checked: boolean };

/** A trigger (icon, value, chevron) plus a small dark radio menu that opens upward inside the stage. */
function PlayerMenu({
  label,
  icon,
  face,
  align = "right",
  className,
  value,
  open,
  onToggle,
  onClose,
  items,
  onChoose,
  note,
}: {
  label: string;
  icon?: ReactNode;
  /** Replaces the icon and value in the trigger (the parts menu shows the part's title). */
  face?: ReactNode;
  align?: "left" | "right";
  className?: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: MenuItem[];
  onChoose: (key: string) => void;
  note?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useDismiss(open, onClose, root, trigger);

  useEffect(() => {
    if (!open) return;
    const rows = list.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
    (rows && (Array.from(rows).find((r) => r.getAttribute("aria-checked") === "true") ?? rows[0]))?.focus();
  }, [open]);

  const move = (to: number | ((i: number, n: number) => number)) => {
    const rows = Array.from(list.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []);
    const i = rows.indexOf(document.activeElement as HTMLElement);
    rows[typeof to === "number" ? to : to(i, rows.length)]?.focus();
  };

  // Keys handled here must not reach the stage's player shortcuts (space = play, arrows = seek).
  // Escape is left to propagate so useDismiss (a document listener) closes the menu.
  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key;
    if (k === "Escape") return;
    if (!open) {
      if (k === "ArrowUp" || k === "ArrowDown") {
        e.preventDefault();
        onToggle();
      }
      if (k === " " || k === "Enter" || k === "ArrowUp" || k === "ArrowDown") e.stopPropagation();
      return;
    }
    e.stopPropagation();
    if (k === "ArrowDown") move((i, n) => (i + 1) % n);
    else if (k === "ArrowUp") move((i, n) => (i - 1 + n) % n);
    else if (k === "Home") move(0);
    else if (k === "End") move((_, n) => n - 1);
    else if (k === "Tab") return onClose();
    else return;
    e.preventDefault();
  };

  const choose = (key: string) => {
    onChoose(key);
    onClose();
    trigger.current?.focus();
  };

  return (
    <div ref={root} onKeyDown={onKeyDown} className={cn("relative", className)}>
      <button
        ref={trigger}
        type="button"
        aria-label={`${label}: ${value}`}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
        className="flex h-9 items-center gap-1 rounded-full px-2 transition-colors hover:bg-on-fill/15 aria-expanded:bg-on-fill/15 sm:px-2.5 [&>svg]:pointer-events-none"
      >
        {face ?? (
          <>
            {icon}
            <span className="hidden sm:inline">{value}</span>
          </>
        )}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div
          ref={list}
          role="menu"
          aria-label={label}
          className={cn(
            "absolute bottom-full z-10 mb-2 max-h-36 min-w-32 overflow-y-auto rounded-lg bg-player p-1 text-sm shadow-lg ring-1 ring-on-fill/20 sm:max-h-none",
            align === "left" ? "left-0 w-max max-w-80" : "right-0",
          )}
        >
          {/* First, so it stays in view when the list scrolls on phones. */}
          {note && <p className="mb-1 border-b border-on-fill/15 px-3 pt-1 pb-1.5 text-xs text-on-fill/65">{note}</p>}
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              role="menuitemradio"
              aria-checked={it.checked}
              tabIndex={it.checked ? 0 : -1}
              onClick={() => choose(it.key)}
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-md px-3 py-1.5 text-left transition-colors hover:bg-on-fill/15 focus-visible:bg-on-fill/15 focus-visible:outline-none",
                it.checked ? "font-semibold text-on-fill" : "text-on-fill/80",
              )}
            >
              {it.label}
              <span className={cn("size-1.5 rounded-full bg-brand", !it.checked && "invisible")} aria-hidden />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
