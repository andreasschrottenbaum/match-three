/**
 * Configuration for the game grid settings.
 */
export type GridSettings = {
  /** Current grid size (e.g., 8 for an 8x8 grid) */
  size: number;
  /** Number of different tile types/colors available */
  variety: number;
  /** Upper bound for grid dimensions */
  maxSize: number;
  /** Lower bound for grid dimensions */
  minSize: number;
  /** Maximum number of different tile types allowed */
  maxVariety: number;
  /** Minimum number of different tile types allowed */
  minVariety: number;
};

/**
 * Global game settings including grid and gameplay mechanics.
 */
export type GameSettings = {
  grid: GridSettings;
  /** Current available shuffle actions for the player */
  shuffleCharges: number;
  /** Maximum capacity of shuffle charges */
  maxShuffleCharges: number;
};

/**
 * Helper to retrieve a numeric value from localStorage with a fallback.
 * @param key - The unique identifier for the setting.
 * @param defaultValue - Value returned if the key is not found or invalid.
 * @returns The parsed integer value.
 */
const getStorageItem = (key: string, defaultValue: number): number => {
  try {
    const item = localStorage.getItem(`match3_${key}`);
    if (item === null) return defaultValue;

    const parsed = parseInt(item, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (error) {
    // Fallback for environments where localStorage might be blocked
    console.warn(`Failed to access localStorage for key: ${key}`, error);
    return defaultValue;
  }
};

/**
 * Global game configuration for runtime adjustments and state persistence.
 * This object holds the source of truth for game parameters.
 */
export const GameConfig: GameSettings = {
  grid: {
    size: getStorageItem("size", 8),
    variety: getStorageItem("variety", 6),
    maxSize: 12,
    minSize: 4,
    maxVariety: 12,
    minVariety: 3,
  },
  shuffleCharges: 3,
  maxShuffleCharges: 3,
};

/**
 * Persists a specific grid setting to localStorage.
 * @param key - The setting key (e.g., 'size' or 'variety').
 * @param value - The numeric value to store.
 */
export const saveGameSetting = (key: string, value: number): void => {
  localStorage.setItem(`match3_${key}`, value.toString());
};
