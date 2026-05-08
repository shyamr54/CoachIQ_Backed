export function parseAcademicDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

export function getMonthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

  return { start, end };
}

export function formatTestName(subject: string, date: Date) {
  const datePart = date.toISOString().slice(0, 10);
  return `${subject} (${datePart})`;
}

