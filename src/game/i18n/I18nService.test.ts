import { describe, it, expect, beforeEach, vi } from "vitest";
import { I18nService } from "./I18nService";
import { Translations } from "./Translations";

/**
 * Unit tests for I18nService.
 * Focuses on locale detection, manual switching, and translation accuracy.
 */
describe("I18nService", () => {
  beforeEach(() => {
    // Reset to a known state before each test since it's a static service
    I18nService.setLocale("en");
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should default to German if browser language is 'de'", () => {
      // Mocking browser navigator language
      vi.spyOn(navigator, "language", "get").mockReturnValue("de-DE");

      I18nService.init();
      expect(I18nService.getLocale()).toBe("de");
    });

    it("should default to English if browser language is unsupported (e.g., 'fr')", () => {
      vi.spyOn(navigator, "language", "get").mockReturnValue("fr-FR");

      I18nService.init();
      expect(I18nService.getLocale()).toBe("en");
    });
  });

  describe("Translation Logic", () => {
    it("should return the correct translation for a valid key in English", () => {
      I18nService.setLocale("en");
      const key = "SCORE" as keyof typeof Translations.en;

      // We assume Translations.en['play'] exists
      expect(I18nService.t(key)).toBe(Translations.en[key]);
    });

    it("should return the correct translation for a valid key after switching to German", () => {
      I18nService.setLocale("de");
      const key = "SETTINGS" as keyof typeof Translations.en;

      expect(I18nService.t(key)).toBe(Translations.de[key]);
    });

    it("should fallback to the key string if a translation is missing (safety check)", () => {
      // Casting to any to simulate a key that might exist in types but not in the object
      const fakeKey = "non_existent_key" as any;
      expect(I18nService.t(fakeKey)).toBe("non_existent_key");
    });
  });

  describe("Locale Management", () => {
    it("should toggle between 'en' and 'de' correctly", () => {
      I18nService.setLocale("en");
      I18nService.toggleLanguage();
      expect(I18nService.getLocale()).toBe("de");

      I18nService.toggleLanguage();
      expect(I18nService.getLocale()).toBe("en");
    });

    it("should allow manual setting of locale", () => {
      I18nService.setLocale("de");
      expect(I18nService.getLocale()).toBe("de");
    });
  });
});
