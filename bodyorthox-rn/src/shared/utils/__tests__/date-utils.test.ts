import {
  formatDisplayDate,
  formatDisplayDateTime,
  calculateAge,
  toISODateString,
  parseISODate,
  formatRelativeTime,
} from "../date-utils";

describe("formatDisplayDate", () => {
  it("formats a date as DD/MM/YYYY", () => {
    const date = new Date(2024, 0, 15); // 15 Jan 2024 local
    const result = formatDisplayDate(date);
    expect(result).toBe("15/01/2024");
  });
});

describe("formatDisplayDateTime", () => {
  it("formats as DD/MM/YYYY HH:MM", () => {
    const date = new Date(2024, 0, 15, 14, 30);
    const result = formatDisplayDateTime(date);
    expect(result).toBe("15/01/2024 14:30");
  });
});

describe("calculateAge", () => {
  it("calculates age correctly", () => {
    const today = new Date();
    const dob = new Date(
      today.getFullYear() - 30,
      today.getMonth(),
      today.getDate(),
    );
    expect(calculateAge(dob)).toBe(30);
  });

  it("handles birthday not yet reached this year", () => {
    const today = new Date();
    // Birthday is tomorrow — age should be one less
    const dob = new Date(
      today.getFullYear() - 25,
      today.getMonth(),
      today.getDate() + 1,
    );
    expect(calculateAge(dob)).toBe(24);
  });

  it("returns 0 for a newborn today", () => {
    expect(calculateAge(new Date())).toBe(0);
  });
});

describe("toISODateString", () => {
  it("returns YYYY-MM-DD format", () => {
    const date = new Date("2024-03-15T10:00:00Z");
    const result = toISODateString(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("parseISODate", () => {
  it("parses ISO string to Date", () => {
    const result = parseISODate("2024-01-15T10:00:00Z");
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
  });
});

describe("formatRelativeTime", () => {
  it('returns "À l\'instant" for very recent dates', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe("À l'instant");
  });

  it("returns minutes ago for recent dates", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    const result = formatRelativeTime(date);
    expect(result).toContain("5 min");
  });

  it("returns hours ago for dates within a day", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const result = formatRelativeTime(date);
    expect(result).toContain("3h");
  });

  it('returns "Hier" for yesterday', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const result = formatRelativeTime(yesterday);
    expect(result).toBe("Hier");
  });

  it("returns days ago for recent dates", () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(date);
    expect(result).toContain("3 jours");
  });
});
