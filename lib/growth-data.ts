import { z } from "zod";
import {emptyLife, lifeSchema} from './life.ts';

/** Storage and backup format. Changes require an explicit schema migration. */
export const DATA_VERSION = 2 as const;
export const WHEEL_AREAS = ["سلامت جسم", "آرامش ذهن", "رابطه‌ها", "خانواده", "کار و یادگیری", "وضعیت مالی", "تفریح", "معنا و ارزش‌ها"] as const;

export function dayKey(date: Date = new Date()): string {
  if (Number.isNaN(date.getTime())) throw new Error("تاریخ معتبر نیست.");
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function validDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900 || year > 2200) return false;
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function shiftDay(key: string, delta: number): string {
  if (!validDay(key) || !Number.isInteger(delta)) throw new Error("تاریخ یا فاصلهٔ روزها معتبر نیست.");
  const [year, month, day] = key.split("-").map(Number);
  // Local noon avoids UTC date shifts and daylight-saving transitions at midnight.
  return dayKey(new Date(year, month - 1, day + delta, 12));
}

export function lastDays(count: number, end: string = dayKey()): string[] {
  if (!Number.isInteger(count) || count < 0 || count > 3660) throw new Error("تعداد روزها معتبر نیست.");
  return Array.from({ length: count }, (_, index) => shiftDay(end, index - count + 1));
}

export function faNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(value);
}

export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    return Array.from(crypto.getRandomValues(new Uint32Array(4)), (part) => part.toString(16).padStart(8, "0")).join("");
  }
  throw new Error("برای استفاده از برنامه به مرورگر جدید و اتصال امن HTTPS نیاز است.");
}

const dateSchema = z.string().refine(validDay, "تاریخ معتبر نیست.");
const idSchema = z.string().min(1).max(128);
const titleSchema = z.string().trim().min(1).max(300);
const shortText = z.string().max(2000);

export const taskSchema = z.object({
  id: idSchema,
  title: titleSchema,
  date: dateSchema,
  time: z.string().regex(/^(?:|(?:[01]\d|2[0-3]):[0-5]\d)$/),
  priority: z.enum(["high", "medium", "low"]),
  done: z.boolean(),
}).strict();

export const goalSchema = z.object({
  id: idSchema,
  title: titleSchema,
  why: shortText,
  deadline: z.union([dateSchema, z.literal("")]),
  target: z.number().finite().positive().max(1_000_000_000),
  current: z.number().finite().nonnegative().max(1_000_000_000),
  unit: z.string().max(80),
}).strict();

export const habitSchema = z.object({
  id: idSchema,
  title: titleSchema,
  days: z.array(dateSchema).max(50_000).refine((days) => new Set(days).size === days.length, "روز تکراری وجود دارد."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
}).strict();

export const journalSchema = z.object({
  id: idSchema,
  date: dateSchema,
  mood: z.number().int().min(1).max(5),
  text: z.string().max(100_000),
  gratitude: z.string().max(10_000),
}).strict();

export const focusSchema = z.object({
  id: idSchema,
  date: dateSchema,
  minutes: z.number().finite().positive().max(1440),
}).strict();

export const reminderSchema = z.object({
  enabled: z.boolean(), taskReminders: z.boolean(), dailyReview: z.boolean(),
  dailyTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  weeklyReview: z.boolean(), weeklyDay: z.number().int().min(0).max(6),
  weeklyTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), native: z.boolean(),
}).strict();
export type ReminderSettings = z.infer<typeof reminderSchema>;

function uniqueIds<T extends { id: string }>(items: T[]): boolean {
  return new Set(items.map((item) => item.id)).size === items.length;
}

export const gadgetRecordSchema = z.object({
  id: idSchema,
  kind: z.enum(['reframe', 'release', 'breathing', 'grounding', 'body', 'gratitude']),
  createdAt: z.string().datetime(),
  before: z.string().max(1500),
  after: z.string().max(1500),
  note: z.string().max(6000),
  seconds: z.number().int().min(0).max(3600),
}).strict();
export type GadgetRecord = z.infer<typeof gadgetRecordSchema>;

export const growthDataSchema = z.preprocess(value => {
  if (value && typeof value === 'object' && 'version' in value && value.version === 1) {
    return {...value, version: DATA_VERSION};
  }
  return value;
}, z.object({
  version: z.literal(DATA_VERSION),
  profile: z.object({ name: z.string().max(100), intention: shortText }).strict(),
  tasks: z.array(taskSchema).max(100_000).refine(uniqueIds, "شناسهٔ تکراری وجود دارد."),
  goals: z.array(goalSchema).max(10_000).refine(uniqueIds, "شناسهٔ تکراری وجود دارد."),
  habits: z.array(habitSchema).max(1000).refine(uniqueIds, "شناسهٔ تکراری وجود دارد."),
  journal: z.array(journalSchema).max(50_000).refine(uniqueIds, "شناسهٔ تکراری وجود دارد."),
  wheel: z.record(z.string().min(1).max(100), z.number().int().min(0).max(10))
    .refine((wheel) => Object.keys(wheel).length <= 30, "تعداد حوزه‌ها بیش از حد مجاز است."),
  focus: z.array(focusSchema).max(100_000).refine(uniqueIds, "شناسهٔ تکراری وجود دارد."),
  reminders: reminderSchema.default({enabled:false,taskReminders:true,dailyReview:true,dailyTime:'20:30',weeklyReview:true,weeklyDay:6,weeklyTime:'18:00',native:false}),
  // Additive v1 migration: older stored data and backups receive an empty history.
  gadgets: z.array(gadgetRecordSchema).max(10_000).refine(uniqueIds, "شناسهٔ تکراری وجود دارد.").default([]),
  createdAt: z.string().datetime(),
  life: lifeSchema.default(emptyLife),
}).strict());

export type Task = z.infer<typeof taskSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Habit = z.infer<typeof habitSchema>;
export type JournalEntry = z.infer<typeof journalSchema>;
export type FocusSession = z.infer<typeof focusSchema>;
export type GrowthData = z.infer<typeof growthDataSchema>;

export function emptyData(): GrowthData {
  return {
    version: DATA_VERSION,
    profile: { name: "", intention: "" },
    tasks: [], goals: [], habits: [], journal: [], focus: [], gadgets: [],
    reminders: {enabled:false,taskReminders:true,dailyReview:true,dailyTime:'20:30',weeklyReview:true,weeklyDay:6,weeklyTime:'18:00',native:false},
    wheel: {},
    life: emptyLife(),
    createdAt: new Date().toISOString(),
  };
}

export function parseBackup(text: string): GrowthData {
  if (text.length > 20_000_000) throw new Error("حجم فایل پشتیبان نباید بیش از ۲۰ مگابایت باشد.");
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error("فایل پشتیبان JSON معتبر نیست؛ اطلاعات فعلی تغییر نکرد."); }
  const result = growthDataSchema.safeParse(value);
  if (!result.success) throw new Error("ساختار یا نسخهٔ فایل پشتیبان معتبر نیست؛ اطلاعات فعلی تغییر نکرد.");
  return result.data;
}

export function makeBackup(data: GrowthData): string {
  return JSON.stringify(growthDataSchema.parse(data), null, 2);
}

/** A streak remains alive until the end of today if yesterday was completed. */
export function habitStreak(days: string[], today: string = dayKey()): number {
  if (!validDay(today)) throw new Error("تاریخ معتبر نیست.");
  const completed = new Set(days.filter(validDay));
  let cursor = completed.has(today) ? today : shiftDay(today, -1);
  let count = 0;
  while (completed.has(cursor)) {
    count += 1;
    cursor = shiftDay(cursor, -1);
  }
  return count;
}

export function taskCompletion(tasks: Task[], date?: string): number {
  const selected = date ? tasks.filter((task) => task.date === date) : tasks;
  return selected.length ? Math.round(selected.filter((task) => task.done).length / selected.length * 100) : 0;
}

export function focusMinutes(sessions: FocusSession[], days?: string[]): number {
  const selected = days ? new Set(days) : null;
  return sessions.reduce((total, session) => total + (!selected || selected.has(session.date) ? session.minutes : 0), 0);
}
