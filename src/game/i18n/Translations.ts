/**
 * Available language keys for the application.
 */
export type Locale = "en" | "de";

/**
 * Type definition for the translation schema.
 * Ensures that all languages implement the exact same keys.
 */
export type TranslationSchema = {
  SCORE: string;
  SETTINGS: string;
  GRID_SIZE: string;
  TILE_VARIETY: string;
  SAVE_RESTART: string;
  CLOSE: string;
  SHUFFLE: string;
  GAME_OVER: string;
  RESTART: string;
  BEST: string;
  NEW_RECORD: string;
};

/**
 * Global Translation Dictionary.
 * Contains localized strings for UI elements.
 */
export const Translations: Record<Locale, TranslationSchema> = {
  /** English Localization */
  en: {
    SCORE: "SCORE",
    SETTINGS: "SETTINGS",
    GRID_SIZE: "GRID SIZE",
    TILE_VARIETY: "TILE VARIETY",
    SAVE_RESTART: "SAVE & RESTART",
    CLOSE: "CLOSE",
    SHUFFLE: "SHUFFLE",
    GAME_OVER: "NO MORE MOVES",
    RESTART: "RESTART",
    BEST: "BEST SCORE",
    NEW_RECORD: "NEW RECORD",
  },
  /** German Localization */
  de: {
    SCORE: "PUNKTE",
    SETTINGS: "OPTIONEN",
    GRID_SIZE: "FELDGRÖSSE",
    TILE_VARIETY: "VIELFALT",
    SAVE_RESTART: "SPEICHERN",
    CLOSE: "SCHLIESSEN",
    SHUFFLE: "MISCHEN",
    GAME_OVER: "KEINE WEITEREN ZÜGE MÖGLICH",
    RESTART: "NEU STARTEN",
    BEST: "BESTLEISTUNG",
    NEW_RECORD: "NEUER REKORD",
  },
};
