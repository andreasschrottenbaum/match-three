import { Scene, Geom, GameObjects } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { GameConfig } from "../config/GameConfig";
import { COLORS, getNumColor } from "../config/Theme";
import { GridModel } from "../logic/GridModel";
import { GridPosition } from "../types";

/**
 * Main gameplay content area handling the grid visualization,
 * input logic, and tile animations.
 */
export class Content extends BaseLayoutArea {
  private gridGraphics: GameObjects.Graphics;
  private model: GridModel;
  private lastRect?: Geom.Rectangle;
  private gridMetrics = { offsetX: 0, offsetY: 0, cellSize: 0 };

  private firstSelection: GridPosition | null = null;
  private isDragging: boolean = false;
  private dragStartPos: { x: number; y: number } | null = null;
  private readonly SWIPE_THRESHOLD = 30;
  private tiles: Map<string, GameObjects.Rectangle> = new Map();
  private isAnimating: boolean = false;

  constructor(scene: Scene) {
    super(scene);
    this.model = new GridModel(GameConfig.grid.size, GameConfig.grid.size);
    this.model.generate();

    this.gridGraphics = scene.add.graphics();
    this.add(this.gridGraphics);

    this.prepareResources();
    this.initInputHandlers();

    // Reset grid when settings change (e.g., board size)
    this.scene.events.on("SETTINGS_CHANGED", () => this.handleReset());
  }

  /**
   * Generates necessary runtime textures like the particle pixel.
   */
  private prepareResources(): void {
    if (!this.scene.textures.exists("white-pixel")) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff).fillRect(0, 0, 8, 8);
      graphics.generateTexture("white-pixel", 8, 8);
      graphics.destroy();
    }
  }

  /**
   * Initializes pointer events for clicking and swiping.
   */
  private initInputHandlers(): void {
    this.scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.isAnimating) return;
      const pos = this.getGridPosFromPointer(p);
      if (pos) {
        this.dragStartPos = { x: p.x, y: p.y };
        this.isDragging = true;
        this.handleSelection(pos);
      }
    });

    this.scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (
        this.isAnimating ||
        !this.isDragging ||
        !this.dragStartPos ||
        !this.firstSelection
      )
        return;
      const dx = p.x - this.dragStartPos.x;
      const dy = p.y - this.dragStartPos.y;

      if (
        Math.abs(dx) > this.SWIPE_THRESHOLD ||
        Math.abs(dy) > this.SWIPE_THRESHOLD
      ) {
        this.handleSwipe(dx, dy);
        this.cancelDrag();
      }
    });

    this.scene.input.on("pointerup", () => this.cancelDrag());
  }

  private cancelDrag(): void {
    this.isDragging = false;
    this.dragStartPos = null;
  }

  /**
   * Resets the game board and re-renders.
   */
  private handleReset(): void {
    this.tiles.forEach((tile) => tile.destroy());
    this.tiles.clear();
    this.model = new GridModel(GameConfig.grid.size, GameConfig.grid.size);
    this.model.generate();
    if (this.lastRect) this.resize(this.lastRect);
  }

  /**
   * Main layout update method called by the LayoutManager.
   */
  public resize(rect: Geom.Rectangle): void {
    this.lastRect = rect;
    this.drawBackground(rect, getNumColor(COLORS.UI_BG_DARK), 0.3);
    this.drawGrid(rect, this.firstSelection ?? undefined);
  }

  /**
   * Updates grid metrics and renders static background and dynamic tiles.
   */
  private drawGrid(rect: Geom.Rectangle, selectedTile?: GridPosition): void {
    this.gridGraphics.clear();
    const gridSize = GameConfig.grid.size;
    const padding = 20;
    const boardSize = Math.min(rect.width - padding, rect.height - padding);
    const cellSize = boardSize / gridSize;
    const offsetX = (rect.width - boardSize) / 2;
    const offsetY = (rect.height - boardSize) / 2;

    this.gridMetrics = { offsetX, offsetY, cellSize };

    // Draw Board Background
    this.gridGraphics.fillStyle(getNumColor(COLORS.BLACK), 0.2);
    this.gridGraphics.fillRoundedRect(
      offsetX,
      offsetY,
      boardSize,
      boardSize,
      8,
    );

    // Draw Selection Highlight
    if (selectedTile) {
      this.gridGraphics.lineStyle(4, 0xffffff, 1);
      this.gridGraphics.strokeRoundedRect(
        offsetX + selectedTile.col * cellSize,
        offsetY + selectedTile.row * cellSize,
        cellSize,
        cellSize,
        4,
      );
    }

    // Synchronize Tile Positions
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const tileType = this.model.getTile(row, col);
        if (tileType === -1) continue;

        const key = `${row}-${col}`;
        const x = offsetX + col * cellSize + cellSize / 2;
        const y = offsetY + row * cellSize + cellSize / 2;

        if (!this.tiles.has(key)) {
          const rectTile = this.scene.add.rectangle(
            x,
            y,
            cellSize - 4,
            cellSize - 4,
            this.getTileColor(tileType),
          );
          this.add(rectTile);
          this.tiles.set(key, rectTile);
        } else {
          const tile = this.tiles.get(key)!;
          if (!this.isAnimating) {
            tile.setPosition(x, y);
            tile.setDisplaySize(cellSize - 4, cellSize - 4);
          }
        }
      }
    }
  }

  /**
   * Logic for selecting a tile or triggering a swap if two are selected.
   */
  private handleSelection(newPos: GridPosition): void {
    if (!this.firstSelection) {
      this.firstSelection = newPos;
    } else {
      if (this.areNeighbors(this.firstSelection, newPos)) {
        this.executeSwap(this.firstSelection, newPos);
        this.firstSelection = null;
      } else {
        this.firstSelection = newPos;
      }
    }
    this.drawGrid(this.lastRect!, this.firstSelection ?? undefined);
  }

  /**
   * Handles the visual and logical swap of two tiles.
   */
  private executeSwap(posA: GridPosition, posB: GridPosition): void {
    const tileA = this.tiles.get(`${posA.row}-${posA.col}`);
    const tileB = this.tiles.get(`${posB.row}-${posB.col}`);
    if (!tileA || !tileB) return;

    this.isAnimating = true;
    const isValid = this.model.trySwap(posA, posB);

    this.scene.tweens.add({
      targets: tileA,
      x: tileB.x,
      y: tileB.y,
      duration: 300,
      ease: "Back.easeOut",
    });

    this.scene.tweens.add({
      targets: tileB,
      x: tileA.x,
      y: tileA.y,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        if (isValid) {
          this.tiles.set(`${posA.row}-${posA.col}`, tileB);
          this.tiles.set(`${posB.row}-${posB.col}`, tileA);
          this.handleMatches();
        } else {
          this.scene.tweens.add({
            targets: [tileA, tileB],
            x: (target: any) => (target === tileA ? tileB.x : tileA.x),
            y: (target: any) => (target === tileA ? tileB.y : tileA.y),
            duration: 200,
            delay: 100,
            onComplete: () => {
              this.isAnimating = false;
            },
          });
        }
      },
    });
  }

  /**
   * Finds matches, triggers destruction animations and particle effects.
   */
  private handleMatches(): void {
    const matches = this.model.findMatches();
    if (matches.length === 0) return;

    matches.forEach((pos) => {
      const key = `${pos.row}-${pos.col}`;
      const tile = this.tiles.get(key);
      if (tile) {
        this.createExplosion(tile.x, tile.y, tile.fillColor);
        this.scene.tweens.add({
          targets: tile,
          scale: 0,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            tile.destroy();
            this.tiles.delete(key);
          },
        });
      }
    });

    this.model.clearMatches(matches);
    this.scene.time.delayedCall(250, () => this.applyGravity());
  }

  /**
   * Moves existing tiles down to fill gaps.
   */
  private applyGravity(): void {
    const plan = this.model.stepGravity();
    plan.moves.forEach((move) => {
      const oldKey = `${move.fromRow}-${move.col}`;
      const newKey = `${move.toRow}-${move.col}`;
      const tile = this.tiles.get(oldKey);
      if (tile) {
        this.tiles.delete(oldKey);
        this.tiles.set(newKey, tile);
        const newY =
          this.gridMetrics.offsetY +
          move.toRow * this.gridMetrics.cellSize +
          this.gridMetrics.cellSize / 2;
        this.scene.tweens.add({
          targets: tile,
          y: newY,
          duration: 400,
          ease: "Bounce.easeOut",
        });
      }
    });
    this.spawnNewTiles(plan.newTiles);
  }

  /**
   * Spawns new tiles from the top of the board.
   */
  private spawnNewTiles(newTiles: { row: number; col: number }[]): void {
    this.model.refill(newTiles);
    const { offsetX, offsetY, cellSize } = this.gridMetrics;
    let completed = 0;

    newTiles.forEach((pos) => {
      const tileType = this.model.getTile(pos.row, pos.col);
      const startX = offsetX + pos.col * cellSize + cellSize / 2;
      const targetY = offsetY + pos.row * cellSize + cellSize / 2;

      const rect = this.scene.add.rectangle(
        startX,
        offsetY - cellSize,
        cellSize - 4,
        cellSize - 4,
        this.getTileColor(tileType),
      );
      this.add(rect);
      this.tiles.set(`${pos.row}-${pos.col}`, rect);

      this.scene.tweens.add({
        targets: rect,
        y: targetY,
        duration: 500,
        ease: "Bounce.easeOut",
        delay: pos.row * 50,
        onComplete: () => {
          if (++completed === newTiles.length) this.checkNextChain();
        },
      });
    });
  }

  /**
   * Checks if the newly spawned tiles created new matches (combos).
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
   * Triggers a particle explosion at the specified location.
   */
  private createExplosion(tileX: number, tileY: number, color: number): void {
    const worldPoint = new Phaser.Math.Vector2();
    this.getWorldTransformMatrix().transformPoint(tileX, tileY, worldPoint);
    const particles = this.scene.add.particles(
      worldPoint.x,
      worldPoint.y,
      "white-pixel",
      {
        speed: { min: 50, max: 150 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: color,
        lifespan: 500,
        gravityY: 200,
      },
    );
    particles.explode(15);
    this.scene.time.delayedCall(600, () => particles.destroy());
  }

  /**
   * Converts screen coordinates to grid row/column.
   */
  private getGridPosFromPointer(p: Phaser.Input.Pointer): GridPosition | null {
    const localPoint = new Phaser.Math.Vector2();
    this.getWorldTransformMatrix().applyInverse(p.x, p.y, localPoint);
    const col = Math.floor(
      (localPoint.x - this.gridMetrics.offsetX) / this.gridMetrics.cellSize,
    );
    const row = Math.floor(
      (localPoint.y - this.gridMetrics.offsetY) / this.gridMetrics.cellSize,
    );
    const size = GameConfig.grid.size;
    return col >= 0 && col < size && row >= 0 && row < size
      ? { row, col }
      : null;
  }

  private areNeighbors(posA: GridPosition, posB: GridPosition): boolean {
    return Math.abs(posA.row - posB.row) + Math.abs(posA.col - posB.col) === 1;
  }

  private getTileColor(type: number): number {
    const palette = [
      0xff595e, 0xffca3a, 0x8ac926, 0x1982c4, 0x6a4c93, 0xff924c,
    ];
    return palette[type % palette.length];
  }

  /**
   * Determines the swipe direction and triggers a swap.
   */
  private handleSwipe(dx: number, dy: number): void {
    if (!this.firstSelection) return;
    let target = { ...this.firstSelection };
    if (Math.abs(dx) > Math.abs(dy)) target.col += dx > 0 ? 1 : -1;
    else target.row += dy > 0 ? 1 : -1;

    const size = GameConfig.grid.size;
    if (
      target.col >= 0 &&
      target.col < size &&
      target.row >= 0 &&
      target.row < size
    ) {
      this.executeSwap(this.firstSelection, target);
    }
    this.firstSelection = null;
    this.drawGrid(this.lastRect!);
  }
}
