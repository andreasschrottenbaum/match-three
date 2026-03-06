import { Scene, Geom, GameObjects, Math as PhaserMath } from "phaser";
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
 * Main gameplay controller.
 * Orchestrates the synchronization between the logical GridModel and the visual Tiles.
 * Manages game states like swapping, matching, gravity, and refills.
 */
export class Content extends BaseLayoutArea {
  /** Graphics layer for the board background and selection highlights */
  private gridGraphics: GameObjects.Graphics;
  /** The logical state of the grid (data only) */
  private model: GridModel;
  /** Handles tweening and visual transitions for tiles */
  private animator: GridAnimator;
  /** Manages pointer interactions and converts them to grid coordinates */
  private inputHandler: GridInputHandler;

  /** Stores the last used layout rectangle for resize calculations */
  private lastRect?: Geom.Rectangle;
  /** Pre-calculated values for grid rendering based on available space */
  private gridMetrics = { offsetX: 0, offsetY: 0, cellSize: 0 };
  /** Map of active Tile objects, keyed by "row-col" strings */
  private tiles: Map<string, Tile> = new Map();
  /** Lock flag to prevent player interaction during animations */
  private isAnimating: boolean = false;
  /** Stores the first tile coordinate in a potential swap pair */
  private firstSelection: GridPosition | null = null;

  /**
   * @param scene - The Phaser Scene this content area belongs to.
   */
  constructor(scene: Scene) {
    super(scene);

    // Initialize Core Logic and Animation systems
    this.model = new GridModel(GameConfig.grid.size, GameConfig.grid.size);
    this.model.generate();
    this.animator = new GridAnimator(scene);

    // Add graphics layer to the container
    this.gridGraphics = scene.add.graphics();
    this.add(this.gridGraphics);

    // Setup input handling via delegation
    this.inputHandler = new GridInputHandler(
      scene,
      this,
      () => this.gridMetrics,
    );

    this.inputHandler.attach(
      (pos) => this.handleSelectionChange(pos),
      (a, b) => this.executeSwap(a, b),
    );

    this.prepareResources();

    // Setup global listeners for external triggers
    this.scene.events.on("SETTINGS_CHANGED", () => this.handleReset());
    this.scene.events.on("GAME_SHUFFLE", () => this.handleShuffle());
  }

  /**
   * Visual selection state update.
   * @param pos - The grid position that was clicked/selected.
   */
  private handleSelectionChange(pos: GridPosition | null): void {
    this.firstSelection = pos;
    if (this.lastRect) {
      this.drawGrid(this.lastRect, pos ?? undefined);
    }
  }

  /**
   * Generates runtime assets (e.g., textures) needed for visual effects.
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
   * Full reset of the game board.
   * Clears models, destroys visual objects, and resets shuffle charges.
   */
  private handleReset(): void {
    this.isAnimating = false;
    this.firstSelection = null;

    GameConfig.shuffleCharges = GameConfig.maxShuffleCharges;
    this.scene.events.emit("UPDATE_SHUFFLE_UI");

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
   * Resizes the content area and redraws the grid layout.
   * @param rect - The bounds provided by the LayoutManager.
   */
  public resize(rect: Geom.Rectangle): void {
    this.lastRect = rect;
    this.drawBackground(rect, getNumColor(COLORS.UI_BG_DARK), 0.3);
    this.drawGrid(rect, this.firstSelection ?? undefined);
  }

  /**
   * Calculates metrics and renders the board backdrop and tiles.
   * @param rect - Bounds for calculation.
   * @param selectedTile - Currently active selection for highlight.
   */
  private drawGrid(rect: Geom.Rectangle, selectedTile?: GridPosition): void {
    this.gridGraphics.clear();
    const size = GameConfig.grid.size;
    const padding = 20;

    // Calculate square board fitting inside the rectangle
    const boardSize = Math.min(rect.width - padding, rect.height - padding);
    const cellSize = boardSize / size;
    const offsetX = (rect.width - boardSize) / 2;
    const offsetY = (rect.height - boardSize) / 2;

    this.gridMetrics = { offsetX, offsetY, cellSize };

    // 1. Render Board Backdrop
    this.gridGraphics
      .fillStyle(getNumColor(COLORS.BLACK), 0.2)
      .fillRoundedRect(offsetX, offsetY, boardSize, boardSize, 8);

    // 2. Render Selection Frame
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

    // 3. Synchronize Tile Entities
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
   * Executes a swap animation and logic.
   * If the swap is invalid (no match), the tiles are swapped back.
   * @param posA - Origin position.
   * @param posB - Target position.
   */
  private executeSwap(posA: GridPosition, posB: GridPosition): void {
    const tileA = this.tiles.get(`${posA.row}-${posA.col}`);
    const tileB = this.tiles.get(`${posB.row}-${posB.col}`);
    if (!tileA || !tileB || this.isAnimating) return;

    this.isAnimating = true;
    const isValid = this.model.trySwap(posA, posB);

    this.animator.swap(tileA, tileB, isValid, () => {
      if (isValid) {
        // Swap visual tracking in the Map
        this.tiles.set(`${posA.row}-${posA.col}`, tileB);
        this.tiles.set(`${posB.row}-${posB.col}`, tileA);
        this.handleMatches();
      } else {
        this.isAnimating = false;
      }
    });
  }

  /**
   * Finds matches in the model, destroys visual tiles, and emits score events.
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
        this.tiles.delete(key);
        this.createExplosion(tile.x, tile.y, tile.fillColor);
        this.animator.destroy(tile, () => tile.destroy());
      }
    });

    this.model.clearMatches(matches);

    // Wait for pop animation before falling
    this.scene.time.delayedCall(200, () => this.applyGravity());
  }

  /**
   * Shuffles the logical board and performs a "fall-in" animation for all tiles.
   */
  private handleShuffle(): void {
    if (this.isAnimating || !GameConfig.shuffleCharges) return;

    GameConfig.shuffleCharges--;
    this.scene.events.emit("UPDATE_SHUFFLE_UI");

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
        tile.y -= 600; // Starting offset for shuffle "rain" effect

        this.animator.drop(tile, targetY, row * 20, () => {
          if (++completedCount === tileList.length) {
            this.isAnimating = false;
            this.checkNextChain();
          }
        });
      }
    }
  }

  /**
   * Shifts existing tiles down according to gravity and spawns new ones.
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
   * Refills the board with new tiles from the top.
   * @param newTiles - List of grid positions to refill.
   */
  private spawnNewTiles(newTiles: { row: number; col: number }[]): void {
    this.model.refill(newTiles);
    let completed = 0;

    newTiles.forEach((pos) => {
      const { offsetX, offsetY, cellSize } = this.gridMetrics;
      const x = offsetX + pos.col * cellSize + cellSize / 2;
      const targetY = offsetY + pos.row * cellSize + cellSize / 2;
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
   * Checks for subsequent matches after gravity/refill (Cascading).
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
   * Spawns a particle emitter for match feedback.
   * Uses world coordinates to ensure particles aren't clipped by containers.
   */
  private createExplosion(tileX: number, tileY: number, color: number): void {
    const wp = new PhaserMath.Vector2();
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
   * Returns a hexadecimal color for a specific tile type.
   */
  private getTileColor(type: number): number {
    const palette = [
      0xff595e, 0xffca3a, 0x8ac926, 0x1982c4, 0x6a4c93, 0xff924c, 0x52e3e1,
      0xfb6f92, 0xd8f3dc, 0x666666,
    ];
    return palette[type % palette.length];
  }
}
