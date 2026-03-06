import { Scene, Geom, GameObjects } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { GameConfig } from "../config/GameConfig";
import { COLORS, getNumColor } from "../config/Theme";
import { GridModel } from "../logic/GridModel";
import { GridPosition } from "../types";
import { GridInputHandler } from "../logic/GridInputHandler";
import { GridAnimator } from "../logic/GridAnimator";
import { Tile } from "../entities/Tile";
import { BoardLogic } from "../logic/BoardLogic";

/**
 * Main gameplay controller. Coordinates logical state (Model) with visual
 * representation (Tiles) and handles user interaction.
 */
export class Content extends BaseLayoutArea {
  private gridGraphics: GameObjects.Graphics;
  private model: GridModel;
  private animator: GridAnimator;
  private inputHandler: GridInputHandler;

  private lastRect?: Geom.Rectangle;
  private gridMetrics = { offsetX: 0, offsetY: 0, cellSize: 0 };
  private tiles: Map<string, Tile> = new Map();
  private isAnimating: boolean = false;
  private firstSelection: GridPosition | null = null;

  constructor(scene: Scene) {
    super(scene);

    // Initialize Core Logic and Animation systems
    this.model = new GridModel(GameConfig.grid.size, GameConfig.grid.size);
    this.model.generate();
    this.animator = new GridAnimator(scene);

    // Layer for static UI elements like highlights and board background
    this.gridGraphics = scene.add.graphics();
    this.add(this.gridGraphics);

    // Setup input handling via delegation
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

    // Global event listeners
    this.scene.events.on("SETTINGS_CHANGED", () => this.handleReset());
    this.scene.events.on("GAME_SHUFFLE", () => this.handleShuffle());
  }

  /**
   * Generates runtime assets like the pixel texture for particle effects.
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
   * Resets the entire grid state and clears all visual tile objects.
   */
  private handleReset(): void {
    this.isAnimating = false;
    this.firstSelection = null;

    this.tiles.forEach((t) => {
      this.scene.tweens.killTweensOf(t);
      t.destroy();
    });
    this.tiles.clear();

    this.model = new GridModel(GameConfig.grid.size, GameConfig.grid.size);
    this.model.generate();

    if (this.lastRect) this.resize(this.lastRect);
  }

  /**
   * Updates layout and redraws the grid when the screen size changes.
   */
  public resize(rect: Geom.Rectangle): void {
    this.lastRect = rect;
    this.drawBackground(rect, getNumColor(COLORS.UI_BG_DARK), 0.3);
    this.drawGrid(rect, this.firstSelection ?? undefined);
  }

  /**
   * Orchestrates the drawing of the board background, selection highlights,
   * and synchronizes active tile positions.
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

    // Render Board Backdrop
    this.gridGraphics
      .fillStyle(getNumColor(COLORS.BLACK), 0.2)
      .fillRoundedRect(offsetX, offsetY, boardSize, boardSize, 8);

    // Render Selection Frame
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

    // Synchronize View-Entities with the Logical Model
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const type = this.model.getTile(row, col);
        if (type === -1) continue;

        const key = `${row}-${col}`;
        const x = offsetX + col * cellSize + cellSize / 2;
        const y = offsetY + row * cellSize + cellSize / 2;

        if (!this.tiles.has(key)) {
          const t = new Tile(
            this.scene,
            x,
            y,
            cellSize,
            type,
            this.getTileColor(type),
          );
          this.add(t);
          this.tiles.set(key, t);
        } else if (!this.isAnimating) {
          const t = this.tiles.get(key)!;
          t.setPosition(x, y);
          t.updateVisuals(cellSize, this.getTileColor(type), type);
        }
      }
    }
  }

  /**
   * Processes a swap attempt between two tiles.
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
   * Ensures visual tiles are removed from the tracking Map immediately to avoid "ghost" tiles.
   */
  private handleMatches(): void {
    const matches = this.model.findMatches();
    if (matches.length === 0) {
      this.isAnimating = false;
      return;
    }

    this.isAnimating = true;

    this.scene.events.emit("TILES_CLEARED", matches.length);

    matches.forEach((pos) => {
      const key = `${pos.row}-${pos.col}`;
      const tile = this.tiles.get(key);

      if (tile) {
        // 1. Remove from Map immediately so no other logic (like gravity)
        // can access this tile during its death animation.
        this.tiles.delete(key);

        // 2. Visual explosion and destruction
        this.createExplosion(tile.x, tile.y, tile.fillColor);
        this.animator.destroy(tile, () => {
          tile.destroy();
        });
      }
    });

    // 3. Update the logical model
    this.model.clearMatches(matches);

    // 4. Wait for the destruction animation to be halfway done before falling down
    this.scene.time.delayedCall(200, () => this.applyGravity());
  }

  /**
   * Re-shuffles the board logic and performs a fall-in animation.
   */
  private handleShuffle(): void {
    if (this.isAnimating) {
      return;
    }

    this.isAnimating = true;

    this.tiles.forEach((t) => this.scene.tweens.killTweensOf(t));

    this.model.shuffle();

    const tileList = Array.from(this.tiles.values());
    this.tiles.clear();

    const size = GameConfig.grid.size;
    let tileIndex = 0;
    let completedCount = 0;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const type = this.model.getTile(row, col);
        const tile = tileList[tileIndex++];
        if (!tile) continue;

        tile.updateVisuals(
          this.gridMetrics.cellSize,
          this.getTileColor(type),
          type,
        );
        this.tiles.set(`${row}-${col}`, tile);

        const targetX =
          this.gridMetrics.offsetX +
          col * this.gridMetrics.cellSize +
          this.gridMetrics.cellSize / 2;
        const targetY =
          this.gridMetrics.offsetY +
          row * this.gridMetrics.cellSize +
          this.gridMetrics.cellSize / 2;

        tile.x = targetX;
        tile.y -= 600;

        this.animator.drop(tile, targetY, row * 20, () => {
          completedCount++;

          if (completedCount === tileList.length) {
            this.isAnimating = false;
            this.checkNextChain();
          }
        });
      }
    }
  }

  /**
   * Moves existing tiles down and triggers spawning of new ones.
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
   * Instantiates new tiles above the visible area and animates them dropping in.
   */
  private spawnNewTiles(newTiles: { row: number; col: number }[]): void {
    this.model.refill(newTiles);
    let completed = 0;

    newTiles.forEach((pos) => {
      const { offsetX, offsetY, cellSize } = this.gridMetrics;
      const x = offsetX + pos.col * cellSize + cellSize / 2;
      const targetY = offsetY + pos.row * cellSize + cellSize / 2;

      // Start position is far above the grid to create the drop effect
      const startY = offsetY - cellSize * (GameConfig.grid.size - pos.row + 1);

      const type = this.model.getTile(pos.row, pos.col);
      const t = new Tile(
        this.scene,
        x,
        startY,
        cellSize,
        type,
        this.getTileColor(type),
      );

      this.add(t);
      this.tiles.set(`${pos.row}-${pos.col}`, t);

      // Trigger the drop animation with a staggered delay based on row
      this.animator.drop(
        t,
        targetY,
        (GameConfig.grid.size - pos.row) * 50,
        () => {
          if (++completed === newTiles.length) this.checkNextChain();
        },
      );
    });
  }

  /**
   * Recursive check for chain reactions (cascades).
   */
  private checkNextChain(): void {
    if (this.model.findMatches().length > 0) {
      this.scene.time.delayedCall(200, () => this.handleMatches());
    } else {
      this.isAnimating = false;
      this.firstSelection = null;

      if (!BoardLogic.hasValidMoves(this.model.getRawGrid())) {
        this.scene.events.emit("GAME_OVER");
      }
    }
  }

  /**
   * Creates a burst of particles at the specified location.
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
   * Helper to map tile types to colors.
   */
  private getTileColor(type: number): number {
    const palette = [
      0xff595e, 0xffca3a, 0x8ac926, 0x1982c4, 0x6a4c93, 0xff924c, 0x52e3e1,
      0xfb6f92, 0xd8f3dc, 0x666666, 0xff87ab, 0x9c6644,
    ];
    return palette[type % palette.length];
  }
}
