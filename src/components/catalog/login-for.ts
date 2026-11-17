/** What a guest tapped that asks for the login: a class, a folder of files, a note, SuperPrep, or a live class to join. */
export type LoginFor = "video" | "folder" | "note" | "exam" | "live";

/**
 * The marks on a link to the login page that tell the segment page's pop-up what was tapped: it shows the thing at its
 * top with a title for that action, and once signed in goes on to the link's `next`.
 */
export const loginFor = (kind: LoginFor, title: string, meta?: string) => ({
  "data-login-for": kind,
  "data-login-title": title,
  "data-login-meta": meta,
});
