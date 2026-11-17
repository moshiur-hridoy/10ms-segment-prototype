/** The subject groups share this `<details name>`, so the browser keeps one open at a time. */
export const SUBJECT_ACCORDION = "subject-groups";

/** One group name per copy when the subjects card is drawn more than once on a page (style guide). */
export const accordionName = (instance?: string) => (instance ? `${SUBJECT_ACCORDION}-${instance}` : SUBJECT_ACCORDION);
