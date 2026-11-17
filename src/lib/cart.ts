/**
 * LP34 (CT65): an order of whole courses for our cart (`/bn/cart` → login → `/bn/checkout`), saved in this tab by
 * the app's segment page (any batch or stream). While one is saved, the cart, checkout and success pages show these
 * courses line by line instead of the HSC 27 product page's package; that page's own sheet clears it.
 */
export type Course = { id: string; title: string; img: string | null; price: number; list: number; unit?: string };
export type Courses = { items: Course[]; back: string; backLabel: string };

const COURSES = "10ms-cart-courses";
/** The order number's key (purchase.tsx), dropped so a new order gets a new number. */
const ORDER_ID = "10ms-pdp-hsc27-id";

export function setCourses(c: Courses) {
  window.sessionStorage.setItem(COURSES, JSON.stringify(c));
  window.sessionStorage.removeItem(ORDER_ID);
}

export const clearCourses = () => window.sessionStorage.removeItem(COURSES);

export function readCourses(): Courses | null {
  try {
    const c = JSON.parse(window.sessionStorage.getItem(COURSES) ?? "null") as Courses | null;
    return c?.items?.length ? c : null;
  } catch {
    return null;
  }
}
