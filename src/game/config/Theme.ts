/**
 * Global Color Palette and Theme Definitions.
 * Centralizes all hex strings used for UI components and background colors.
 */
export const COLORS = {
  PRIMARY: "#DDDDDD", // Primary Background
  SECONDARY: "#FFCC00", // Gold (Highlight/Action)
  ACCENT: "#FF0000", // Red (Debug/Warning)

  // UI Backgrounds
  UI_BG_DARK: "#1A1A1A", // Main Content / Board Background
  UI_BG_LIGHT: "#222222", // Sidebar / Panel Background
  UI_BG_HEADER: "#DDDDDD", // Header/Footer Panels

  // Neutral Colors
  WHITE: "#FFFFFF",
  BLACK: "#000000",
};

/**
 * Utility to convert Hex CSS string to a numeric value for Phaser Graphics.
 *
 * @param hex - A CSS-style hex string (e.g., "#FF0000").
 * @returns The numeric representation of the color (e.g., 0xFF0000).
 */
export const getNumColor = (hex: string): number => {
  // Removes '#' and parses the hex string into a base-16 number
  return parseInt(hex.replace(/^#/, "0x"), 16);
};

/**
 * UI Layout Constants for the BaseLayoutArea and LayoutManager.
 * Defines dimensions and spacing constraints for responsive positioning.
 */
export const LAYOUT = {
  /** Height of the top area in landscape mode */
  HEADER_HEIGHT: 80,
  /** Height of the bottom area in landscape mode */
  FOOTER_HEIGHT: 60,
  /** Minimum width for the sidebar in landscape mode */
  SIDEBAR_MIN_WIDTH: 250,
  /** Fixed height for the sidebar when placed at the bottom in portrait mode */
  SIDEBAR_PORTRAIT_HEIGHT: 100,
  /** Default padding used between UI elements */
  PADDING: 20,
};
