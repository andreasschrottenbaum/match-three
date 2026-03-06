import { Scene, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import type { AreaName, Bounds } from "./types";
import { LAYOUT } from "../config/Theme";

/**
 * Orchestrates the positioning and sizing of all UI components.
 * Listens to the Phaser Scale Manager to trigger responsive layout updates
 * for both Landscape and Portrait orientations.
 */
export class LayoutManager {
  /** The Phaser Scene context for accessing the Scale Manager */
  private scene: Scene;
  /** A collection of registered layout areas, mapped by their unique names */
  private areas: Map<AreaName, BaseLayoutArea> = new Map();

  /**
   * @param scene - The Phaser Scene instance.
   */
  constructor(scene: Scene) {
    this.scene = scene;

    // Define the resize handler to bind 'this' context correctly
    const resizeHandler = () => this.update();

    // Listen for window/canvas resize events
    this.scene.scale.on("resize", resizeHandler);

    // Clean up the listener when the scene shuts down to prevent memory leaks
    this.scene.events.once("shutdown", () => {
      this.scene.scale.off("resize", resizeHandler);
    });
  }

  /**
   * Registers a layout component (e.g., Header, Sidebar) to be managed.
   *
   * @param key - The unique AreaName identifier.
   * @param area - The instance of the BaseLayoutArea.
   */
  public registerArea(key: AreaName, area: BaseLayoutArea): void {
    this.areas.set(key, area);
  }

  /**
   * Main orchestration logic for responsive positioning.
   * Calculates bounds for all areas and triggers their internal resize methods.
   */
  public update(): void {
    const { width, height } = this.scene.scale;
    const isLandscape = width > height;
    const fullRect = new Geom.Rectangle(0, 0, width, height);

    // Initialize bounds object with empty rectangles
    // Modals (settings/gameOver) default to full screen dimensions
    const bounds: Bounds = {
      header: new Geom.Rectangle(),
      sidebar: new Geom.Rectangle(),
      content: new Geom.Rectangle(),
      footer: new Geom.Rectangle(),
      settings: fullRect,
      gameOver: fullRect,
    };

    // Calculate specific dimensions based on orientation
    if (isLandscape) {
      this.calculateLandscape(width, height, bounds);
    } else {
      this.calculatePortrait(width, height, bounds);
    }

    // Apply calculated bounds to all registered components
    this.areas.forEach((area, key) => {
      const rect = bounds[key];
      if (rect) {
        // Position the container in the global coordinate space
        area.setPosition(rect.x, rect.y);
        // Inform the component about its new dimensions (triggers internal GameText.resize)
        area.resize(rect);
      }
    });
  }

  /**
   * Layout logic for Landscape orientation (Sidebar on the left).
   *
   * @param width - Current canvas width.
   * @param height - Current canvas height.
   * @param bounds - The bounds object to populate.
   */
  private calculateLandscape(
    width: number,
    height: number,
    bounds: Bounds,
  ): void {
    const sidebarWidth = Math.max(LAYOUT.SIDEBAR_MIN_WIDTH, width * 0.2);
    const contentHeight = height - LAYOUT.HEADER_HEIGHT - LAYOUT.FOOTER_HEIGHT;

    bounds.header.setTo(0, 0, width, LAYOUT.HEADER_HEIGHT);
    bounds.footer.setTo(
      0,
      height - LAYOUT.FOOTER_HEIGHT,
      width,
      LAYOUT.FOOTER_HEIGHT,
    );
    bounds.sidebar.setTo(0, LAYOUT.HEADER_HEIGHT, sidebarWidth, contentHeight);
    bounds.content.setTo(
      sidebarWidth,
      LAYOUT.HEADER_HEIGHT,
      width - sidebarWidth,
      contentHeight,
    );
  }

  /**
   * Layout logic for Portrait orientation (Sidebar at the top).
   *
   * @param width - Current canvas width.
   * @param height - Current canvas height.
   * @param bounds - The bounds object to populate.
   */
  private calculatePortrait(
    width: number,
    height: number,
    bounds: Bounds,
  ): void {
    const sidebarHeight = LAYOUT.SIDEBAR_PORTRAIT_HEIGHT;
    const mainHeight =
      height - LAYOUT.HEADER_HEIGHT - sidebarHeight - LAYOUT.FOOTER_HEIGHT;

    bounds.header.setTo(0, 0, width, LAYOUT.HEADER_HEIGHT);
    bounds.sidebar.setTo(0, LAYOUT.HEADER_HEIGHT, width, sidebarHeight);
    bounds.content.setTo(
      0,
      LAYOUT.HEADER_HEIGHT + sidebarHeight,
      width,
      mainHeight,
    );
    bounds.footer.setTo(
      0,
      height - LAYOUT.FOOTER_HEIGHT,
      width,
      LAYOUT.FOOTER_HEIGHT,
    );
  }
}
