import { Translations, Locale } from "./Translations";

/**
 * Service to handle Internationalization (I18n).
 * Manages the current locale and provides translated strings based on keys.
 */
export class I18nService {
  /** The currently active language locale */
  private static currentLocale: Locale = "en";

  /**
   * Initializes the service by detecting the browser language.
   * Defaults to English if the detected language is not supported.
   */
  public static init(): void {
    const lang = navigator.language.split("-")[0];
    // Check if the detected language exists in our supported Locales
    this.currentLocale = lang === "de" ? "de" : "en";
  }

  /**
   * Translates a given key into the string of the current locale.
   *
   * @param key - The translation identifier (must exist in the base translation file).
   * @returns The translated string or the key itself if the translation is missing.
   */
  public static t(key: keyof typeof Translations.en): string {
    const translationSet = Translations[this.currentLocale];

    // Return translation or fallback to the key to avoid empty UI elements
    return translationSet[key] || (key as string);
  }

  /**
   * Switches the current language between available options.
   * Useful for debugging or providing a language toggle in the settings menu.
   */
  public static toggleLanguage(): void {
    this.currentLocale = this.currentLocale === "en" ? "de" : "en";

    // Log change for debugging purposes
    console.log(`Language toggled to: ${this.currentLocale}`);
  }

  /**
   * Manually sets the locale.
   * @param locale - The target locale ('en' | 'de').
   */
  public static setLocale(locale: Locale): void {
    this.currentLocale = locale;
  }

  /**
   * Gets the currently active locale.
   * @returns The current Locale string.
   */
  public static getLocale(): Locale {
    return this.currentLocale;
  }
}
