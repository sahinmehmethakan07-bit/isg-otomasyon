type DateLike = Date | string | number | null | undefined;

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_WITH_WEEKDAY_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  weekday: "long",
});

const RELATIVE_DAY_FORMATTER = new Intl.RelativeTimeFormat("tr-TR", {
  numeric: "auto",
});

export function parseDisplayDate(value: DateLike): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const isoDateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: DateLike, fallback = "—") {
  const date = parseDisplayDate(value);
  return date ? LONG_DATE_FORMATTER.format(date) : fallback;
}

export function formatDateShort(value: DateLike, fallback = "—") {
  const date = parseDisplayDate(value);
  return date ? SHORT_DATE_FORMATTER.format(date) : fallback;
}

export function formatDateTime(value: DateLike, fallback = "—") {
  const date = parseDisplayDate(value);
  return date ? DATE_TIME_FORMATTER.format(date) : fallback;
}

export function formatDateWithWeekday(value: DateLike, fallback = "—") {
  const date = parseDisplayDate(value);
  return date ? DATE_WITH_WEEKDAY_FORMATTER.format(date) : fallback;
}

export function formatRelativeDays(days: number) {
  if (!Number.isFinite(days)) return "";
  return RELATIVE_DAY_FORMATTER.format(Math.trunc(days), "day");
}
