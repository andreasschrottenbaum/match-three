import { GameObjects, Scene, Geom } from "phaser";

/**
 * BaseLayoutArea serves as the abstract foundation for all UI regions.
 * It provides a standardized container and background rendering logic
 * that integrates with the LayoutManager.
 */
export abstract class BaseLayoutArea extends GameObjects.Container {
  /** The background graphics object, automatically managed by the container */
  protected background: GameObjects.Graphics;

  /**
   * @param scene - The Phaser Scene this area belongs to.
   */
  constructor(scene: Scene) {
    super(scene);

    // Initialize background layer
    this.background = scene.add.graphics();
    this.add(this.background);

    // Register this container with the scene's update list
    scene.add.existing(this);
  }

  /**
   * Defines how the specific UI area responds to size and orientation changes.
   * Every subclass must implement this to reposition internal elements
   * and update GameText sizes.
   *
   * @param rect - The calculated bounds provided by the LayoutManager.
   */
  abstract resize(rect: Geom.Rectangle): void;

  /**
   * Re-renders the background rectangle based on the current area dimensions.
   *
   * @param rect - The dimensions of the area.
   * @param color - Hexadecimal color value.
   * @param alpha - Opacity of the background (default: 1).
   */
  protected drawBackground(
    rect: Geom.Rectangle,
    color: number,
    alpha: number = 1,
  ): void {
    this.background.clear();
    this.background.fillStyle(color, alpha);

    // Draw from (0,0) relative to the container's position
    this.background.fillRect(0, 0, rect.width, rect.height);
  }
}
