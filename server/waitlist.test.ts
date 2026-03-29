import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Input schema (mirrors the one in landing router) ───
const requestAccessInput = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  source: z.string().optional().default("landing_page"),
});

describe("Waitlist / Request Access", () => {
  describe("Input validation", () => {
    it("should accept a valid email only", () => {
      const result = requestAccessInput.safeParse({ email: "test@example.com" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe("landing_page");
        expect(result.data.fullName).toBeUndefined();
        expect(result.data.companyName).toBeUndefined();
      }
    });

    it("should accept full form with all fields", () => {
      const result = requestAccessInput.safeParse({
        email: "jane@acme.com",
        fullName: "Jane Smith",
        companyName: "Acme Corp",
        source: "pricing_page",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe("Jane Smith");
        expect(result.data.companyName).toBe("Acme Corp");
        expect(result.data.source).toBe("pricing_page");
      }
    });

    it("should reject invalid email", () => {
      const result = requestAccessInput.safeParse({ email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("should reject empty email", () => {
      const result = requestAccessInput.safeParse({ email: "" });
      expect(result.success).toBe(false);
    });

    it("should reject empty fullName (min 1 char)", () => {
      const result = requestAccessInput.safeParse({
        email: "test@example.com",
        fullName: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty companyName (min 1 char)", () => {
      const result = requestAccessInput.safeParse({
        email: "test@example.com",
        companyName: "",
      });
      expect(result.success).toBe(false);
    });

    it("should default source to landing_page when not provided", () => {
      const result = requestAccessInput.safeParse({ email: "test@example.com" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe("landing_page");
      }
    });

    it("should accept custom source values", () => {
      const sources = ["hero", "nav_desktop", "nav_mobile", "cta_bottom", "pricing_nav", "pricing_plan", "pricing_cta"];
      for (const source of sources) {
        const result = requestAccessInput.safeParse({ email: "test@example.com", source });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.source).toBe(source);
        }
      }
    });
  });
});
