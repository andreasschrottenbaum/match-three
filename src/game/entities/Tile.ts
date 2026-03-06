import { GameObjects, Scene, Display } from "phaser";

/**
 * Represents a high-quality "Crystal Gem" tile with a balanced look.
 * Corrects the Hexagon glint and Triangle bevel inconsistencies.
 */
export class Tile extends GameObjects.Container {
  private symbol: GameObjects.Graphics;
  private shadow: GameObjects.Graphics;
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

    // Layer 1: Outer Shadow for depth against the board
    this.shadow = scene.add.graphics();
    this.add(this.shadow);

    // Layer 2: The combined Gem Body (Base, Highlight, and Specular layers)
    this.symbol = scene.add.graphics();
    this.add(this.symbol);

    this.drawGem(type, size);
    scene.add.existing(this);
  }

  /**
   * Re-renders the tile visuals (e.g., after resize or shuffle).
   */
  public updateVisuals(size: number, color: number, type: number): void {
    this._color = color;
    this.symbol.clear();
    this.shadow.clear();
    this.drawGem(type, size);
  }

  /**
   * Orchestrates the drawing of the balanced 4-layer crystal gem effect.
   */
  private drawGem(type: number, size: number): void {
    const s = size * 0.35; // Basic scale factor relative to cell size

    // 1. Drop Shadow (offset and semi-transparent)
    this.renderShape(this.shadow, type, s, 0x000000, 0.25, 4, false);

    // 2. Base Layer (The outer rim / "cut" of the gem)
    // Darkened slightly more for better contrast against the highlight face
    const rimColor = this.adjustColor(this._color, -30);
    this.renderShape(this.symbol, type, s, rimColor, 1, 0, false);

    // 3. Highlight Face (The inner, raised surface)
    // Use modulo to cycle through colors if variety is high
    const faceColor = this.getHighlightColor(this._color);

    // Scale is slightly reduced to create the bevel gap
    // Use slightly less face shrinkage for more base visibility
    this.renderShape(this.symbol, type, s * 0.86, faceColor, 1, 0, false);

    // 4. Specular Highlight (The 'Glint')
    // A thin, bright, semi-transparent arc on the top-left edge
    // We pass 'true' to render the special specular version of the shape
    this.renderShape(this.symbol, type, s * 0.86, 0xffffff, 0.45, 0, true);
  }

  /**
   * Core rendering logic for the geometric shapes.
   * Can draw the filled shape or the specific specular glint.
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
      // Default drawing style for standard filled layers
      graphics.fillStyle(color, alpha);
      // Add a very thin black line to define the rim more sharply
      graphics.lineStyle(1, 0x000000, 0.1);

      // Remove stroke for shadow or inner face
      if (alpha !== 1 || s < 25) {
        graphics.lineStyle(0, 0);
      }
    } else {
      // Specular Glint style: Pure color lines, high alpha
      graphics.lineStyle(3, color, alpha);
      graphics.fillStyle(0, 0); // Ensure NO fill on glint
    }

    // Switch case for different geometric shapes
    switch (type % 6) {
      case 0: // Circle
        if (!isSpecular) {
          graphics.fillCircle(offset, offset, s);
          graphics.strokeCircle(offset, offset, s);
        } else {
          // Draw a precise arc on the top-left quadrant of the circle
          graphics.beginPath();
          // Start at 200 degrees (top-left) to 270 degrees (top)
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
          // Draw L-shaped glint on top and left edges
          // Start glint a bit further in for diamond effect
          graphics.lineBetween(-s + 4, -s + 4, s - 4, -s + 4); // Top
          graphics.lineBetween(-s + 4, -s + 4, -s + 4, s - 4); // Left
        }
        break;

      case 2: // Triangle
        if (!isSpecular) {
          // The fill Triangle logic is fine, it's about the proportions
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
        } else {
          // FIX: The glint itself on the triangle slope.
          // Corrected angle to match the actual left slope.
          const offsetGlint = 4;
          // Start glint a bit further up, and end it before the corner
          graphics.lineBetween(
            0,
            -s + offsetGlint + 2,
            -s + offsetGlint,
            s - offsetGlint,
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
          // Precise glint on top-left slope
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
          // FIX: The glint on the hexagon slopes. Removed the erroneous arc logic.
          // Using precise lines for the two top-left edges.

          // Specular Segment 1 (Top-Left horizontal)
          const yOffset = -s * 0.866; // Standard hexagon math: cos(30deg) * s
          const xOffsetShort = -s * 0.5; // sin(30deg) * s
          graphics.lineBetween(
            xOffsetShort + 3,
            yOffset + 3,
            s * 0.5 - 3,
            yOffset + 3,
          );

          // Specular Segment 2 (Top-Left downward slope)
          graphics.lineBetween(-s + 3, 0, xOffsetShort + 2, yOffset + 2);
        }
        break;

      case 5: // Thick Cross
        const k = s * 0.4; // Thickness factor

        const crossPath = [
          { x: -k + offset, y: -s + offset },
          { x: k + offset, y: -s + offset },
          { x: k + offset, y: -k + offset },
          { x: s + offset, y: -k + offset },
          { x: s + offset, y: k + offset },
          { x: k + offset, y: k + offset },
          { x: k + offset, y: s + offset },
          { x: -k + offset, y: s + offset },
          { x: -k + offset, y: k + offset },
          { x: -s + offset, y: k + offset },
          { x: -s + offset, y: -k + offset },
          { x: -k + offset, y: -k + offset },
        ];

        if (!isSpecular) {
          graphics.fillPoints(crossPath, true);
          graphics.strokePoints(crossPath, true);
        } else {
          // Draw glints on the extreme edges of the cross bars
          graphics.lineBetween(-k + 3, -s + 3, k - 3, -s + 3); // Top edge vertical bar
          graphics.lineBetween(-s + 3, -k + 3, -k + 3, -k + 3); // Left edge horizontal bar
        }
        break;
    }
  }

  /**
   * Helper to draw filled polygons.
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
   * Color logic for the raised gem face (high saturation, brightened).
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
   * Helper to adjust color brightness.
   */
  private adjustColor(color: number, amount: number): number {
    const col = Display.Color.IntegerToColor(color);
    const r = Phaser.Math.Clamp(col.red + amount, 0, 255);
    const g = Phaser.Math.Clamp(col.green + amount, 0, 255);
    const b = Phaser.Math.Clamp(col.blue + amount, 0, 255);
    return Display.Color.GetColor(r, g, b);
  }

  /**
   * Getter for the logical color, needed for particle effects.
   */
  public get fillColor(): number {
    return this._color;
  }
}
