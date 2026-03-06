import { Geom } from "phaser";

/**
 * Defines the physical screen areas for a standard gameplay layout.
 * Used primarily by the LayoutManager to partition the screen.
 */
export type LayoutAreas = {
  /** Top bar typically containing titles or game name */
  header: Geom.Rectangle;
  /** Central area where the game board (Content) is rendered */
  main: Geom.Rectangle;
  /** Side or bottom bar containing scores and controls */
  sidebar: Geom.Rectangle;
  /** Bottom-most bar for copyright or versioning */
  footer: Geom.Rectangle;
};

/**
 * Valid identifiers for all UI components managed by the LayoutManager.
 * These keys correspond to the registration entries in the areas Map.
 */
export type AreaName =
  | "content"
  | "footer"
  | "header"
  | "sidebar"
  | "settings"
  | "gameOver";

/**
 * A mapped type representing the calculated bounding boxes for every
 * registered UI area. This is passed from the LayoutManager to components.
 */
export type Bounds = Record<AreaName, Geom.Rectangle>;
