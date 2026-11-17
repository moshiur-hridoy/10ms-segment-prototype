/*
 * Lab `concept` v7 (P157): sample live attendance for the demo. The backend records attendance (present, late,
 * absent: schemas.ts, the report's live classes), but the class on the subject page isn't linked to it yet
 * (design-audit 9.2). Class 1 plays as missed (to show the make-up path), class 2 as late; other batch
 * classes as present. A recording from the previous batch (`archive`) had no live class for this student.
 */
export type Attendance = "present" | "late" | "absent";

const DEMO: Record<string, Attendance> = { v_2: "absent", v_5: "late" };

export const demoAttendance = (id: string, source: "batch" | "archive"): Attendance | null => (source === "archive" ? null : (DEMO[id] ?? "present"));
