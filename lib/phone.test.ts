import { describe, it, expect } from "vitest";
import {
  normalizeIsraeliPhone,
  isValidIsraeliPhone,
  formatIsraeliPhone,
} from "./phone";

describe("normalizeIsraeliPhone", () => {
  it("accepts local mobile", () => {
    expect(normalizeIsraeliPhone("054-123-4567")).toBe("0541234567");
    expect(normalizeIsraeliPhone("054 123 4567")).toBe("0541234567");
    expect(normalizeIsraeliPhone("0541234567")).toBe("0541234567");
  });
  it("accepts +972 / 972 prefixes", () => {
    expect(normalizeIsraeliPhone("+972-54-123-4567")).toBe("0541234567");
    expect(normalizeIsraeliPhone("972541234567")).toBe("0541234567");
  });
  it("rejects invalid numbers", () => {
    expect(normalizeIsraeliPhone("abc")).toBeNull();
    expect(normalizeIsraeliPhone("12345")).toBeNull();
    expect(normalizeIsraeliPhone("+1-212-555-0100")).toBeNull();
  });
});

describe("isValidIsraeliPhone", () => {
  it("empty is OK (required-ness enforced separately)", () => {
    expect(isValidIsraeliPhone("")).toBe(true);
  });
  it("rejects clearly invalid", () => {
    expect(isValidIsraeliPhone("abc")).toBe(false);
  });
});

describe("formatIsraeliPhone", () => {
  it("formats mobile with dashes", () => {
    expect(formatIsraeliPhone("0541234567")).toBe("054-123-4567");
  });
});
