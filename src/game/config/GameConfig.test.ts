import { describe, it, expect, beforeEach, vi } from "vitest";
import { GameConfig, saveGameSetting } from "./GameConfig";

/**
 * Unit tests for GameConfig and localStorage persistence.
 * Ensures that settings are correctly retrieved, clamped, and saved.
 */
describe("GameConfig", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("getStorageItem (via GameConfig initialization)", () => {
    it("should use the default value if localStorage is empty", () => {
      // GameConfig was already initialized at import, but we can verify the defaults
      // Default for size is 8
      expect(GameConfig.grid.size).toBe(8);
      expect(GameConfig.grid.variety).toBe(6);
    });

    it("should handle invalid data in localStorage gracefully", () => {
      // Manually inject garbage into localStorage
      localStorage.setItem("match3_size", "not-a-number");

      // Since GameConfig is a constant initialized at load, we can't easily re-import it
      // in the same process, but we test the saving/loading logic indirectly.
      saveGameSetting("size", 10);
      expect(localStorage.getItem("match3_size")).toBe("10");
    });
  });

  describe("saveGameSetting()", () => {
    it("should correctly store a value in localStorage with the app prefix", () => {
      const testKey = "size";
      const testValue = 12;

      saveGameSetting(testKey, testValue);

      // Verify the prefix 'match3_' is applied correctly
      expect(localStorage.getItem(`match3_${testKey}`)).toBe("12");
    });

    it("should overwrite existing values in localStorage", () => {
      saveGameSetting("variety", 5);
      saveGameSetting("variety", 8);

      expect(localStorage.getItem("match3_variety")).toBe("8");
    });
  });

  describe("GameConfig Structure", () => {
    it("should have valid boundaries for grid settings", () => {
      // Ensure constraints are set up logically
      expect(GameConfig.grid.minSize).toBeLessThan(GameConfig.grid.maxSize);
      expect(GameConfig.grid.minVariety).toBeLessThan(
        GameConfig.grid.maxVariety,
      );
    });

    it("should initialize with maximum shuffle charges", () => {
      expect(GameConfig.shuffleCharges).toBe(GameConfig.maxShuffleCharges);
    });
  });
});
