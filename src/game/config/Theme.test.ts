import { describe, it, expect } from "vitest";
import { COLORS, LAYOUT, getNumColor } from "./Theme";

/**
 * Unit tests for Theme and Utility functions.
 * Ensures color conversions and layout constants are consistent.
 */
describe("Theme Utilities", () => {
  describe("getNumColor()", () => {
    it("should convert a standard hex string to a numeric value", () => {
      // Phaser expects 0xFF0000 format for colors
      expect(getNumColor("#FF0000")).toBe(0xff0000);
      expect(getNumColor("#00FF00")).toBe(0x00ff00);
      expect(getNumColor("#0000FF")).toBe(0x0000ff);
    });

    it("should handle hex strings from the COLORS object", () => {
      const whiteNum = getNumColor(COLORS.WHITE);
      const blackNum = getNumColor(COLORS.BLACK);

      expect(whiteNum).toBe(0xffffff);
      expect(blackNum).toBe(0x000000);
    });

    it("should correctly handle shorthand-like hex or edge cases if replaced", () => {
      // Even if the string doesn't have a #, it should parse if it's valid hex
      expect(getNumColor("FFFFFF")).toBe(0xffffff);
    });

    it("should return NaN or 0 for completely invalid strings", () => {
      // Basic sanity check for non-hex input
      const result = getNumColor("not-a-color");
      expect(isNaN(result)).toBe(true);
    });
  });

  describe("Theme Constants", () => {
    it("should have all required UI colors defined as hex strings", () => {
      // Ensure the palette hasn't been accidentally cleared or changed to numbers
      expect(COLORS.PRIMARY).toMatch(/^#[0-9A-F]{6}$/i);
      expect(COLORS.SECONDARY).toMatch(/^#[0-9A-F]{6}$/i);
      expect(COLORS.UI_BG_DARK).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("should have positive numeric values for layout constraints", () => {
      // Ensure layout constants are logical
      expect(LAYOUT.HEADER_MAX_HEIGHT).toBeGreaterThan(0);
      expect(LAYOUT.PADDING).toBeGreaterThanOrEqual(0);
      expect(LAYOUT.SIDEBAR_MIN_WIDTH).toBeGreaterThan(0);
    });
  });
});
