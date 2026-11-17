import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, localeCookie, locales } from "@/i18n/config";
import { isLoginPath, isPublicPath, isPublicRoutine, SESSION_COOKIE } from "@/lib/session";

// Bangla by default. The profile menu's language switch saves the choice in the
// locale cookie, so unprefixed URLs then open in that language.
function preferredLocale(request: NextRequest) {
  const saved = request.cookies.get(localeCookie)?.value;
  return saved && isLocale(saved) ? saved : defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const locale = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  if (!locale) {
    request.nextUrl.pathname = `/${preferredLocale(request)}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  if (
    isLoginPath(pathname) ||
    isPublicPath(pathname) ||
    isPublicRoutine(pathname, request.nextUrl.searchParams) ||
    request.cookies.has(SESSION_COOKIE)
  )
    return;

  // Signed out, the site opens on the landing page instead of the login page.
  if (pathname === `/${locale}` || pathname === `/${locale}/`) {
    const home = request.nextUrl.clone();
    home.pathname = `/${locale}/hsc/hsc-28`;
    return NextResponse.redirect(home);
  }

  // Demo sign-in (lib/session.ts): every other page needs the session cookie.
  // Without it, go to the login page and come back here after signing in.
  const login = request.nextUrl.clone();
  login.pathname = `/${locale}/login`;
  login.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(login);
}

export const config = {
  // Skip Next internals, public assets and any file with an extension
  matcher: ["/((?!_next|assets|data|favicon.ico|.*\\..*).*)"],
};
