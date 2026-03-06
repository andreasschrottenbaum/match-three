import { GameObjects, Scene, Display } from "phaser";

/**
 * Represents a high-quality "Crystal Gem" tile with a balanced look.
 * Uses procedural Graphics to render different shapes with shadows,
 * bevels, and specular glints.
 */
export class Tile extends GameObjects.Container {
  /** The main graphics object for the gem body, highlights, and glints */
  private symbol: GameObjects.Graphics;
  /** Separate graphics object for the drop shadow to allow independent layering */
  private shadow: GameObjects.Graphics;
  /** The logical color of the tile used for gameplay and effects */
  private _color: number;

  /**
   * @param scene - The Phaser Scene this tile belongs to.
   * @param x - Initial X position in pixels.
   * @param y - Initial Y position in pixels.
   * @param size - The bounding size of the grid cell.
   * @param type - The tile type ID (determines the geometric shape).
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

    // Layer 1: Outer Shadow for depth against the board background
    this.shadow = scene.add.graphics();
    this.add(this.shadow);

    // Layer 2: The combined Gem Body (Base, Highlight face, and Specular glints)
    this.symbol = scene.add.graphics();
    this.add(this.symbol);

    this.drawGem(type, size);
    scene.add.existing(this);
  }

  /**
   * Re-renders the tile visuals from scratch.
   * Useful when the grid size changes or the tile is recycled.
   *
   * @param size - The new bounding size of the cell.
   * @param color - The new color for the tile.
   * @param type - The shape type index.
   */
  public updateVisuals(size: number, color: number, type: number): void {
    this._color = color;
    this.symbol.clear();
    this.shadow.clear();
    this.drawGem(type, size);
  }

  /**
   * Orchestrates the drawing of the multi-layered crystal effect.
   * Layers: Shadow -> Beveled Rim -> Bright Face -> Specular Glint.
   *
   * @param type - Shape index.
   * @param size - Cell size.
   */
  private drawGem(type: number, size: number): void {
    const s = size * 0.35; // Scale factor relative to cell size

    // 1. Drop Shadow (offset and semi-transparent)
    this.renderShape(this.shadow, type, s, 0x000000, 0.25, 4, false);

    // 2. Base Layer (The outer rim / "cut" of the gem)
    // Darkened to provide depth for the bevel effect
    const rimColor = this.adjustColor(this._color, -30);
    this.renderShape(this.symbol, type, s, rimColor, 1, 0, false);

    // 3. Highlight Face (The inner, raised surface)
    const faceColor = this.getHighlightColor(this._color);
    // Scale is reduced to 86% to reveal the rim underneath
    this.renderShape(this.symbol, type, s * 0.86, faceColor, 1, 0, false);

    // 4. Specular Highlight (The 'Glint')
    // A thin, bright, semi-transparent highlight on the top-left edge
    this.renderShape(this.symbol, type, s * 0.86, 0xffffff, 0.45, 0, true);
  }

  /**
   * Core rendering logic for geometric shapes.
   * Supports drawing filled shapes (Base/Face) or line-based highlights (Specular).
   *
   * @param graphics - The graphics object to draw on.
   * @param type - Shape index.
   * @param s - Calculated radius/half-width.
   * @param color - Fill or line color.
   * @param alpha - Transparency.
   * @param offset - Positional offset (mainly for shadows).
   * @param isSpecular - If true, only the top-left edges are stroked.
   */
  private renderShape(
    graphics: GameObjects.Graphics,
    type: number,
    s: number,
    color: number,
    alpha: number,
    offset: number,
    isSpecular: boolean,
  ): void {
    if (!isSpecular) {
      graphics.fillStyle(color, alpha);
      // Sharp black hairline for definition
      graphics.lineStyle(1, 0x000000, 0.1);

      // Disable stroke for shadows or extremely small sizes
      if (alpha !== 1 || s < 25) {
        graphics.lineStyle(0, 0);
      }
    } else {
      // Specular Glint style: Lines only
      graphics.lineStyle(3, color, alpha);
      graphics.fillStyle(0, 0);
    }

    const shapeType = type % 6;

    switch (shapeType) {
      case 0: // Circle
        if (!isSpecular) {
          graphics.fillCircle(offset, offset, s);
          graphics.strokeCircle(offset, offset, s);
        } else {
          graphics.beginPath();
          graphics.arc(
            0,
            0,
            s - 3,
            Phaser.Math.DegToRad(200),
            Phaser.Math.DegToRad(270),
            true,
          );
          graphics.strokePath();
        }
        break;

      case 1: // Square
        if (!isSpecular) {
          graphics.fillRect(-s + offset, -s + offset, s * 2, s * 2);
          graphics.strokeRect(-s + offset, -s + offset, s * 2, s * 2);
        } else {
          graphics.lineBetween(-s + 4, -s + 4, s - 4, -s + 4); // Top edge
          graphics.lineBetween(-s + 4, -s + 4, -s + 4, s - 4); // Left edge
        }
        break;

      case 2: // Triangle
        if (!isSpecular) {
          this.drawTriangle(graphics, s, offset);
        } else {
          const glintOff = 4;
          graphics.lineBetween(
            0,
            -s + glintOff + 2,
            -s + glintOff,
            s - glintOff,
          );
        }
        break;

      case 3: // Diamond
        if (!isSpecular) {
          this.drawPoly(
            graphics,
            [
              { x: 0, y: -s * 1.2 },
              { x: s, y: 0 },
              { x: 0, y: s * 1.2 },
              { x: -s, y: 0 },
            ],
            offset,
          );
        } else {
          graphics.lineBetween(-s + 4, 0, 0, -s * 1.2 + 4);
        }
        break;

      case 4: // Hexagon
        if (!isSpecular) {
          const hex = [];
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i;
            hex.push({ x: Math.cos(a) * s, y: Math.sin(a) * s });
          }
          this.drawPoly(graphics, hex, offset);
        } else {
          const yOffset = -s * 0.866;
          const xOffsetShort = -s * 0.5;
          graphics.lineBetween(
            xOffsetShort + 3,
            yOffset + 3,
            s * 0.5 - 3,
            yOffset + 3,
          );
          graphics.lineBetween(-s + 3, 0, xOffsetShort + 2, yOffset + 2);
        }
        break;

      case 5: // Thick Cross
        const k = s * 0.4;
        const cross = [
          { x: -k, y: -s },
          { x: k, y: -s },
          { x: k, y: -k },
          { x: s, y: -k },
          { x: s, y: k },
          { x: k, y: k },
          { x: k, y: s },
          { x: -k, y: s },
          { x: -k, y: k },
          { x: -s, y: k },
          { x: -s, y: -k },
          { x: -k, y: -k },
        ];
        if (!isSpecular) {
          this.drawPoly(graphics, cross, offset);
        } else {
          graphics.lineBetween(-k + 3, -s + 3, k - 3, -s + 3);
          graphics.lineBetween(-s + 3, -k + 3, -k + 3, -k + 3);
        }
        break;
    }
  }

  /**
   * Helper to draw a standard triangle shape.
   */
  private drawTriangle(
    graphics: GameObjects.Graphics,
    s: number,
    offset: number,
  ): void {
    graphics.fillTriangle(
      offset,
      -s + offset,
      -s + offset,
      s + offset,
      s + offset,
      s + offset,
    );
    graphics.strokeTriangle(
      offset,
      -s + offset,
      -s + offset,
      s + offset,
      s + offset,
      s + offset,
    );
  }

  /**
   * Helper to draw filled and stroked polygons.
   *
   * @param graphics - The graphics object.
   * @param points - Array of coordinate objects.
   * @param offset - Positional offset.
   */
  private drawPoly(
    graphics: GameObjects.Graphics,
    points: { x: number; y: number }[],
    offset: number,
  ): void {
    const offsetPoints = points.map((p) => ({
      x: p.x + offset,
      y: p.y + offset,
    }));
    graphics.fillPoints(offsetPoints, true);
    graphics.strokePoints(offsetPoints, true);
  }

  /**
   * Calculates a brighter version of the base color for the inner gem face.
   *
   * @param color - Base hexadecimal color.
   * @returns Brightened color value.
   */
  private getHighlightColor(color: number): number {
    const col = Display.Color.IntegerToColor(color);
    const boost = 55;
    const r = Math.min(255, col.red + boost);
    const g = Math.min(255, col.green + boost);
    const b = Math.min(255, col.blue + boost);
    return Display.Color.GetColor(r, g, b);
  }

  /**
   * Adjusts color brightness by a specific amount.
   *
   * @param color - Base color.
   * @param amount - Positive to brighten, negative to darken.
   * @returns Adjusted color value.
   */
  private adjustColor(color: number, amount: number): number {
    const col = Display.Color.IntegerToColor(color);
    const r = Phaser.Math.Clamp(col.red + amount, 0, 255);
    const g = Phaser.Math.Clamp(col.green + amount, 0, 255);
    const b = Phaser.Math.Clamp(col.blue + amount, 0, 255);
    return Display.Color.GetColor(r, g, b);
  }

  /**
   * Returns the logical color of the tile.
   * Useful for matching colors with particle emitters during matches.
   */
  public get fillColor(): number {
    return this._color;
  }
}
