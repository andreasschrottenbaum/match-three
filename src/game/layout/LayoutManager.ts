import { Scene, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import type { AreaName, Bounds } from "./types";
import { LAYOUT } from "../config/Theme";

export class LayoutManager {
  private scene: Scene;
  private areas: Map<AreaName, BaseLayoutArea> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;

    const resizeHandler = () => this.update();

    this.scene.scale.on("resize", resizeHandler);

    this.scene.scale.once("shutdown", () => {
      this.scene.scale.off("resize", resizeHandler);
    });
  }

  /**
   * Register a layout component to be managed
   */
  public registerArea(key: AreaName, area: BaseLayoutArea): void {
    this.areas.set(key, area);
  }

  /**
   * Main orchestration logic for responsive positioning
   */
  public update(): void {
    const { width, height } = this.scene.scale;
    const isLandscape = width > height;
    const fullRect = new Geom.Rectangle(0, 0, width, height);

    // Temporary rectangles to store calculated bounds
    const bounds: Bounds = {
      header: new Geom.Rectangle(),
      sidebar: new Geom.Rectangle(),
      content: new Geom.Rectangle(),
      footer: new Geom.Rectangle(),
      settings: fullRect,
      gameOver: fullRect,
    };

    if (isLandscape) {
      this.calculateLandscape(width, height, bounds);
    } else {
      this.calculatePortrait(width, height, bounds);
    }

    // Trigger resize on all registered components
    this.areas.forEach((area, key) => {
      const rect = bounds[key];
      area.setPosition(rect.x, rect.y);
      area.resize(rect);
    });
  }

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
