import { Scene, Geom, GameObjects } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { GameConfig } from "../config/GameConfig";
import { COLORS, getNumColor } from "../config/Theme";
import { GridModel } from "../logic/GridModel";
import { GridPosition } from "../types";
import { GridInputHandler } from "../logic/GridInputHandler";
import { GridAnimator } from "../logic/GridAnimator";

/**
 * Main gameplay area that coordinates the Model, Animator, and InputHandler.
 */
export class Content extends BaseLayoutArea {
  private gridGraphics: GameObjects.Graphics;
  private model: GridModel;
  private animator: GridAnimator;
  private inputHandler: GridInputHandler;

  private lastRect?: Geom.Rectangle;
  private gridMetrics = { offsetX: 0, offsetY: 0, cellSize: 0 };
  private tiles: Map<string, GameObjects.Rectangle> = new Map();
  private isAnimating: boolean = false;
  private firstSelection: GridPosition | null = null;

  constructor(scene: Scene) {
    super(scene);
    this.model = new GridModel(GameConfig.grid.size, GameConfig.grid.size);
    this.model.generate();

    this.animator = new GridAnimator(scene);
    this.gridGraphics = scene.add.graphics();
    this.add(this.gridGraphics);

    // Initialize the external input handler
    this.inputHandler = new GridInputHandler(
      scene,
      this,
      () => this.gridMetrics,
    );
    this.inputHandler.attach(
      (pos) => {
        this.firstSelection = pos;
        this.drawGrid(this.lastRect!, pos ?? undefined);
      },
      (a, b) => this.executeSwap(a, b),
    );

    this.prepareResources();
    this.scene.events.on("SETTINGS_CHANGED", () => this.handleReset());
    this.scene.events.on("GAME_SHUFFLE", () => this.handleShuffle());
  }

  /**
   * Prepares runtime textures for effects.
   */
  private prepareResources(): void {
    if (this.scene.textures.exists("white-pixel")) return;
    const graphics = this.scene.make.graphics({ x: 0, y: 0 });
    graphics
      .fillStyle(0xffffff)
      .fillRect(0, 0, 8, 8)
      .generateTexture("white-pixel", 8, 8);
    graphics.destroy();
  }

  /**
   * Fully resets the board state and visuals.
   */
  private handleReset(): void {
    this.tiles.forEach((t) => t.destroy());
    this.tiles.clear();
    this.model = new GridModel(GameConfig.grid.size, GameConfig.grid.size);
    this.model.generate();
    if (this.lastRect) this.resize(this.lastRect);
  }

  /**
   * Layout update triggered by the LayoutManager.
   */
  public resize(rect: Geom.Rectangle): void {
    this.lastRect = rect;
    this.drawBackground(rect, getNumColor(COLORS.UI_BG_DARK), 0.3);
    this.drawGrid(rect, this.firstSelection ?? undefined);
  }

  /**
   * Renders the board background and synchronizes tile positions.
   */
  private drawGrid(rect: Geom.Rectangle, selectedTile?: GridPosition): void {
    this.gridGraphics.clear();
    const size = GameConfig.grid.size;
    const padding = 20;
    const boardSize = Math.min(rect.width - padding, rect.height - padding);
    const cellSize = boardSize / size;
    const offsetX = (rect.width - boardSize) / 2;
    const offsetY = (rect.height - boardSize) / 2;
    this.gridMetrics = { offsetX, offsetY, cellSize };

    // Draw Board Background
    this.gridGraphics
      .fillStyle(getNumColor(COLORS.BLACK), 0.2)
      .fillRoundedRect(offsetX, offsetY, boardSize, boardSize, 8);

    // Draw Selection Highlight
    if (selectedTile) {
      this.gridGraphics
        .lineStyle(4, 0xffffff)
        .strokeRoundedRect(
          offsetX + selectedTile.col * cellSize,
          offsetY + selectedTile.row * cellSize,
          cellSize,
          cellSize,
          4,
        );
    }

    // Sync GameObjects with Model
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const type = this.model.getTile(row, col);
        if (type === -1) continue;
        const key = `${row}-${col}`;
        const x = offsetX + col * cellSize + cellSize / 2;
        const y = offsetY + row * cellSize + cellSize / 2;

        if (!this.tiles.has(key)) {
          const t = this.scene.add.rectangle(
            x,
            y,
            cellSize - 4,
            cellSize - 4,
            this.getTileColor(type),
          );
          this.add(t);
          this.tiles.set(key, t);
        } else if (!this.isAnimating) {
          const t = this.tiles.get(key)!;
          t.setPosition(x, y).setDisplaySize(cellSize - 4, cellSize - 4);
        }
      }
    }
  }

  /**
   * Executes the logical and visual swap of two tiles.
   */
  private executeSwap(posA: GridPosition, posB: GridPosition): void {
    const tileA = this.tiles.get(`${posA.row}-${posA.col}`);
    const tileB = this.tiles.get(`${posB.row}-${posB.col}`);
    if (!tileA || !tileB || this.isAnimating) return;

    this.isAnimating = true;
    const isValid = this.model.trySwap(posA, posB);

    this.animator.swap(tileA, tileB, isValid, () => {
      if (isValid) {
        this.tiles.set(`${posA.row}-${posA.col}`, tileB);
        this.tiles.set(`${posB.row}-${posB.col}`, tileA);
        this.handleMatches();
      } else {
        this.isAnimating = false;
      }
    });
  }

  /**
   * Identifies matches and triggers destruction sequences.
   */
  private handleMatches(): void {
    const matches = this.model.findMatches();
    if (matches.length === 0) return;

    this.scene.events.emit("TILES_CLEARED", matches.length);

    matches.forEach((pos) => {
      const key = `${pos.row}-${pos.col}`;
      const tile = this.tiles.get(key);
      if (tile) {
        this.createExplosion(tile.x, tile.y, tile.fillColor);
        this.animator.destroy(tile, () => {
          tile.destroy();
          this.tiles.delete(key);
        });
      }
    });

    this.model.clearMatches(matches);
    this.scene.time.delayedCall(250, () => this.applyGravity());
  }

  /**
   * Shuffles the board and performs a re-spawn animation for all tiles.
   */
  private handleShuffle(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.model.shuffle();

    let completed = 0;

    this.tiles.forEach((tile, key) => {
      const [row, col] = key.split("-").map(Number);
      const type = this.model.getTile(row, col);

      // Update color and visual state
      tile.setFillStyle(this.getTileColor(type));

      // Animate tiles falling back in from the top for a "reset" feel
      const targetY = tile.y;
      tile.y -= 500; // Start from above the screen

      this.animator.drop(tile, targetY, row * 20, () => {
        completed++;
        if (completed === this.tiles.size) {
          this.isAnimating = false;
          // Check if the shuffle (by accident) created new matches
          // (though model.shuffle should prevent this)
          this.checkNextChain();
        }
      });
    });
  }

  /**
   * Moves existing tiles downward to fill empty slots.
   */
  private applyGravity(): void {
    const plan = this.model.stepGravity();
    plan.moves.forEach((m) => {
      const tile = this.tiles.get(`${m.fromRow}-${m.col}`);
      if (tile) {
        this.tiles.delete(`${m.fromRow}-${m.col}`);
        this.tiles.set(`${m.toRow}-${m.col}`, tile);
        const targetY =
          this.gridMetrics.offsetY +
          m.toRow * this.gridMetrics.cellSize +
          this.gridMetrics.cellSize / 2;
        this.animator.drop(tile, targetY);
      }
    });
    this.spawnNewTiles(plan.newTiles);
  }

  /**
   * Spawns and animates new tiles falling from the top.
   */
  private spawnNewTiles(newTiles: { row: number; col: number }[]): void {
    this.model.refill(newTiles);
    let completed = 0;
    newTiles.forEach((pos) => {
      const { offsetX, offsetY, cellSize } = this.gridMetrics;
      const x = offsetX + pos.col * cellSize + cellSize / 2;
      const targetY = offsetY + pos.row * cellSize + cellSize / 2;

      const type = this.model.getTile(pos.row, pos.col);
      const t = this.scene.add.rectangle(
        x,
        offsetY - cellSize,
        cellSize - 4,
        cellSize - 4,
        this.getTileColor(type),
      );
      this.add(t);
      this.tiles.set(`${pos.row}-${pos.col}`, t);

      this.animator.drop(t, targetY, pos.row * 50, () => {
        if (++completed === newTiles.length) this.checkNextChain();
      });
    });
  }

  /**
   * Checks for combo matches after a refill.
   */
  private checkNextChain(): void {
    if (this.model.findMatches().length > 0) {
      this.scene.time.delayedCall(200, () => this.handleMatches());
    } else {
      this.isAnimating = false;
      this.firstSelection = null;
    }
  }

  /**
   * Visual particle effect for tile destruction.
   */
  private createExplosion(tileX: number, tileY: number, color: number): void {
    const wp = new Phaser.Math.Vector2();
    this.getWorldTransformMatrix().transformPoint(tileX, tileY, wp);
    const p = this.scene.add.particles(wp.x, wp.y, "white-pixel", {
      speed: { min: 50, max: 150 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      lifespan: 500,
      gravityY: 200,
    });
    p.explode(15);
    this.scene.time.delayedCall(600, () => p.destroy());
  }

  /**
   * Returns a hexadecimal color value based on the tile type index.
   * Uses a predefined palette for consistent tile visuals.
   * @param type - The numeric ID of the tile type.
   */
  private getTileColor(type: number): number {
    const palette = [
      0xff595e, 0xffca3a, 0x8ac926, 0x1982c4, 0x6a4c93, 0xff924c,
    ];
    return palette[type % palette.length];
  }
}
