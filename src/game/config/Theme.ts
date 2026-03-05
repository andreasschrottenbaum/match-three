/**
 * Global Constants and Theme Definitions
 */
export const COLORS = {
  PRIMARY: "#DDDDDD", // Primary Background
  SECONDARY: "#FFCC00", // Gold (Highlight)
  ACCENT: "#FF0000", // Red (Debug Helper)

  // UI Backgrounds
  UI_BG_DARK: "#1A1A1A", // Main Content
  UI_BG_LIGHT: "#222222", // Sidebar
  UI_BG_HEADER: "#DDDDDD", // Header/Footer

  // Neutral
  WHITE: "#FFFFFF", // White
  BLACK: "#000000", // Black
};

/**
 * Utility to convert Hex numbers to CSS Strings for Phaser Text objects
 */
export const getNumColor = (rgb: string): number => {
  return parseInt("0x" + rgb.substring(1));
};

/**
 * UI Layout Constants
 */
export const LAYOUT = {
  HEADER_HEIGHT: 80,
  FOOTER_HEIGHT: 60,
  SIDEBAR_MIN_WIDTH: 250,
  SIDEBAR_PORTRAIT_HEIGHT: 100,
  PADDING: 20,
};
