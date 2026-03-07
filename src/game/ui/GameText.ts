import { GameObjects, Scene, Math as PhaserMath } from "phaser";
import { COLORS } from "../config/Theme";

/**
 * Configuration for GameText styling and responsive scaling behavior.
 */
export type TextStyleConfig = {
  /** Percentage of the shorter screen dimension (e.g., 0.05 for 5%) */
  fontSizeFactor?: number;
  /** Minimum allowed font size in pixels */
  minSize?: number;
  /** Maximum allowed font size in pixels */
  maxSize?: number;
  /** Hex string color code */
  color?: string;
  /** Whether to apply bold styling */
  bold?: boolean;
  /** Initial horizontal position */
  x?: number;
  /** Initial vertical position */
  y?: number;
};

/**
 * A specialized Phaser Text object that scales its font size based on viewport
 * and provides a maxWidth constraint to prevent overlapping.
 */
export class GameText extends GameObjects.Text {
  /** Relative scale factor used for font calculation */
  private sizeFactor: number;
  /** Lower bound for font size to ensure legibility on small screens */
  private minSize: number;
  /** Upper bound for font size to prevent overlapping on large screens */
  private maxSize: number;
  /** Upper bound for buttons to prevent huge sizes on large screens */
  private maxWidth: number = 0;

  /**
   * @param scene - The active Phaser Scene.
   * @param text - Initial content string.
   * @param config - Styling and scaling parameters.
   */
  constructor(scene: Scene, text: string, config: TextStyleConfig = {}) {
    const {
      fontSizeFactor = 0.04,
      minSize = 16,
      maxSize = 80,
      color = COLORS.WHITE,
      bold = false,
      x = 0,
      y = 0,
    } = config;

    super(scene, x, y, text, {
      fontFamily: "FreckleFace",
      color: color,
      fontStyle: bold ? "bold" : "normal",
    });

    this.sizeFactor = fontSizeFactor;
    this.minSize = minSize;
    this.maxSize = maxSize;

    // Apply default visual enhancements for readability
    this.setStroke("#000000", 4);
    this.setShadow(2, 2, "#000000", 2, true, true);

    // Initial calculation of the font size
    this.updateFontSize();

    // Add this instance to the scene's display list
    scene.add.existing(this);
  }

  /**
   * Limits the text width by downscaling the object if the rendered width exceeds the limit.
   * @param width - Maximum allowed width in pixels.
   */
  public setMaxWidth(width: number): void {
    this.maxWidth = width;
    this.resize();
  }

  /**
   * Recalculates the font size based on current screen dimensions.
   * Uses the shorter side (width or height) as the reference to maintain
   * consistency across portrait and landscape modes.
   */
  public updateFontSize(): void {
    const { width, height } = this.scene.scale;
    const referenceSide = Math.min(width, height);

    // Calculate size and clamp it within the defined boundaries
    let calculatedSize = referenceSide * this.sizeFactor;
    calculatedSize = PhaserMath.Clamp(
      calculatedSize,
      this.minSize,
      this.maxSize,
    );

    this.setFontSize(`${Math.round(calculatedSize)}px`);
    this.setScale(1); // Reset scale before checking constraints

    // If maxWidth is set and exceeded, downscale the text object
    if (this.maxWidth > 0 && this.width > this.maxWidth) {
      const scale = this.maxWidth / this.width;
      this.setScale(scale);
    }
  }

  /**
   * Synchronizes font size and scaling with the current screen dimensions.
   */
  public resize(): void {
    this.updateFontSize();
  }
}
