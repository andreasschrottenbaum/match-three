import { Translations, Locale } from "./Translations";

export class I18nService {
  private static currentLocale: Locale = "en";

  public static init(): void {
    const lang = navigator.language.split("-")[0];
    this.currentLocale = lang === "de" ? "de" : "en";
  }

  public static t(key: keyof typeof Translations.en): string {
    return Translations[this.currentLocale][key] || key;
  }

  // Debugging Helper
  public static toggleLanguage(): void {
    this.currentLocale = this.currentLocale === "en" ? "de" : "en";
  }
}
