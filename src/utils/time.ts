export function nowIso(): string {
  return new Date().toISOString();
}

export function minutesAgoIso(minutes: number, from = new Date()): string {
  return new Date(from.getTime() - minutes * 60_000).toISOString();
}

export function isPastIso(value: string | null | undefined, now = new Date()): boolean {
  if (!value) {
    return false;
  }
  return new Date(value).getTime() <= now.getTime();
}

export function epochSeconds(date = new Date()): number {
  return Math.floor(date.getTime() / 1000);
}
