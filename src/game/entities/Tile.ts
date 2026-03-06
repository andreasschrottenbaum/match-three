import { GameObjects, Scene } from "phaser";

/**
 * Represents a single visual tile in the game grid.
 * Uses procedural vector graphics to render shapes instead of bitmap assets.
 */
export class Tile extends GameObjects.Container {
  private symbol: GameObjects.Graphics;
  private _color: number;

  /**
   * @param scene - The Phaser Scene this tile belongs to.
   * @param x - Initial X position.
   * @param y - Initial Y position.
   * @param size - The bounding size of the tile cell.
   * @param type - The tile type ID (determines the shape).
   * @param color - The hexadecimal color value.
   */
  constructor(
    scene: Scene,
    x: number,
    y: number,
    size: number,
    type: number,
    color: number,
  ) {
    super(scene, x, y);
    this._color = color;

    // Initialize the graphics object for procedural drawing
    this.symbol = scene.add.graphics();
    this.drawShape(type, size);
    this.add(this.symbol);

    // Register the container with the scene's update list and display list
    scene.add.existing(this);
  }

  /**
   * Updates the tile's visual state during resizing or re-pooling.
   * @param size - The new cell size.
   * @param color - The new color value.
   * @param type - The new tile type ID.
   */
  public updateVisuals(size: number, color: number, type: number): void {
    this._color = color;
    this.symbol.clear();
    this.drawShape(type, size);
  }

  /**
   * Internal method to draw the geometric shape based on the type index.
   * Uses fill and stroke styles for a clean, vector-based look.
   * @param type - Determines which shape to render.
   * @param size - Used to calculate the scale of the shape.
   */
  private drawShape(type: number, size: number): void {
    const s = size * 0.35; // Scale factor for the shape relative to cell size

    this.symbol.fillStyle(this._color, 1);
    // Subtle white outline for depth and better visibility on dark backgrounds
    this.symbol.lineStyle(2, 0xffffff, 0.2);

    // Use modulo to cycle through shapes if more than 6 colors are used
    switch (type % 6) {
      case 0: // Circle
        this.symbol.fillCircle(0, 0, s);
        this.symbol.strokeCircle(0, 0, s);
        break;

      case 1: // Square
        this.symbol.fillRect(-s, -s, s * 2, s * 2);
        this.symbol.strokeRect(-s, -s, s * 2, s * 2);
        break;

      case 2: // Upward Triangle
        this.symbol.fillTriangle(0, -s, -s, s, s, s);
        this.symbol.strokeTriangle(0, -s, -s, s, s, s);
        break;

      case 3: // Diamond / Rhombus
        const diamondPath = [
          { x: 0, y: -s * 1.2 },
          { x: s, y: 0 },
          { x: 0, y: s * 1.2 },
          { x: -s, y: 0 },
        ];
        this.symbol.fillPoints(diamondPath, true);
        this.symbol.strokePoints(diamondPath, true);
        break;

      case 4: // Hexagon
        const hexPath = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          hexPath.push({ x: Math.cos(angle) * s, y: Math.sin(angle) * s });
        }
        this.symbol.fillPoints(hexPath, true);
        this.symbol.strokePoints(hexPath, true);
        break;

      case 5: // Thick Cross
        const k = s * 0.4; // Thickness of the cross bars
        this.symbol.fillRect(-s, -k, s * 2, k * 2);
        this.symbol.fillRect(-k, -s, k * 2, s * 2);
        // Stroke the outline for the cross
        this.symbol.strokeRect(-s, -k, s * 2, k * 2);
        this.symbol.strokeRect(-k, -s, k * 2, s * 2);
        break;
    }
  }

  /**
   * Getter for the current color value.
   * Used by animators and particle systems for color synchronization.
   */
  public get fillColor(): number {
    return this._color;
  }
}
