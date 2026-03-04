import { Scene } from "phaser";
import { GameTile } from "./GameTile";
import { BoardLogic } from "../logic/BoardLogic";
import { GridUtils } from "../logic/GridUtils";
import { Manager, TileID } from "../types";
import Constants from "../config/Constants";

/**
 * Configuration for the BoardManager layout and game rules.
 */
export interface BoardConfig {
  gridSize: number;
  tileSize: number;
  typeCount: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Handles the visual grid, tile animations, and orchestrates match logic.
 * Acts as the bridge between the Scene and the logical board state.
 */
export class BoardManager implements Manager {
  /** 2D Array holding the visual GameTile instances */
  private board: (GameTile | null)[][] = [];
  private boardBackground: Phaser.GameObjects.Graphics | null = null;

  /**
   * @param scene - The parent Phaser Scene.
   * @param config - Layout and grid configuration.
   * @param callbacks - Event hooks for UI and Game State updates.
   */
  constructor(
    private scene: Scene,
    private config: BoardConfig,
    private callbacks: {
      onScore: (points: number, x: number, y: number) => void;
      onCombo: (combo: number, x: number, y: number) => void;
      onMatchExplode: (x: number, y: number) => void;
      onSequenceComplete: (hasMoves: boolean) => void;
    },
  ) {
    this.board = Array.from({ length: config.gridSize }, () =>
      Array(config.gridSize).fill(null),
    );
  }

  /**
   * Triggers a browser-level vibration for haptic feedback if supported.
   * @param duration - Length of the vibration in ms.
   */
  private triggerHapticFeedback(duration: number = 15): void {
    if ("vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  }

  /**
   * Creates the visual board with a cascading drop-in effect.
   * @param numericGrid - The pre-calculated stable grid IDs.
   */
  public createVisualBoard(numericGrid: number[][]): void {
    this.drawBoardBackground();

    // Cleanup existing tiles if any
    this.board.forEach((row) => row.forEach((tile) => tile?.destroy()));
    this.board = [];

    for (let row = 0; row < this.config.gridSize; row++) {
      this.board[row] = [];
      for (let col = 0; col < this.config.gridSize; col++) {
        const finalPos = this.getWorldPos(row, col);
        const startY = finalPos.y - 600;

        const tile = new GameTile(
          this.scene,
          finalPos.x,
          startY,
          numericGrid[row][col],
          row,
          col,
          this.config.tileSize,
        );

        tile.setDepth(Constants.DEPTH_LAYERS.TILES);
        tile.setAlpha(0);
        this.board[row][col] = tile;

        // Cascade animation
        this.scene.tweens.add({
          targets: tile,
          y: finalPos.y,
          alpha: 1,
          duration: 700,
          delay: row * 80 + col * 40,
          ease: "Back.easeOut",
          onComplete: () => {
            // Signal readiness when the last tile has landed
            if (
              row === this.config.gridSize - 1 &&
              col === this.config.gridSize - 1
            ) {
              this.callbacks.onSequenceComplete(true);
            }
          },
        });
      }
    }
  }

  /**
   * Handles the swapping animation between two tiles and initiates match checking.
   * @param row1 - Starting row.
   * @param col1 - Starting column.
   * @param row2 - Target row.
   * @param col2 - Target column.
   * @param isReverting - Whether this is a rollback of an invalid move.
   */
  public swapTiles(
    row1: number,
    col1: number,
    row2: number,
    col2: number,
    isReverting = false,
  ): void {
    const tile1 = this.board[row1][col1]!;
    const tile2 = this.board[row2][col2]!;

    // Logical Swap
    this.board[row1][col1] = tile2;
    this.board[row2][col2] = tile1;

    const pos1 = this.getWorldPos(row1, col1);
    const pos2 = this.getWorldPos(row2, col2);

    tile1.animateTo(row2, col2, pos2.x, pos2.y);

    this.scene.tweens.add({
      targets: tile2,
      x: pos1.x,
      y: pos1.y,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        tile2.gridPosition = { row: row1, col: col1 };
        if (!isReverting) {
          const matches = BoardLogic.getAllMatches(this.getNumericGrid());
          if (matches.length > 0) {
            this.handleMatches(1);
          } else {
            // No matches? Swap back!
            this.swapTiles(row2, col2, row1, col1, true);
          }
        } else {
          this.callbacks.onSequenceComplete(true);
        }
      },
    });
  }

  /**
   * Processes current matches, triggers score/vfx and starts gravity sequence.
   * @param combo - Current chain reaction multiplier.
   */
  public handleMatches(combo: number): void {
    const numericGrid = this.getNumericGrid();
    const matches = BoardLogic.getAllMatches(numericGrid);

    if (matches.length === 0) {
      this.callbacks.onSequenceComplete(
        BoardLogic.hasValidMoves(this.getNumericGrid()),
      );
      return;
    }

    this.triggerHapticFeedback(10 + combo * 10);

    const points = BoardLogic.calculateScore(matches, combo);
    const firstMatch = matches[0];
    const scorePos = this.getWorldPos(firstMatch.row, firstMatch.col);

    this.callbacks.onScore(points, scorePos.x, scorePos.y);

    if (combo > 1) {
      this.callbacks.onCombo(combo, scorePos.x, scorePos.y);
    }

    matches.forEach((pos) => {
      const tile = this.board[pos.row][pos.col];
      if (tile) {
        this.callbacks.onMatchExplode(tile.x, tile.y);
        tile.popAndDestroy();
        this.board[pos.row][pos.col] = null;
      }
    });

    // Short delay before tiles fall down
    this.scene.time.delayedCall(250, () => this.applyGravity(combo));
  }

  /**
   * Moves existing tiles down and spawns new ones to fill gaps.
   * @param combo - Current combo to pass to the next match check.
   */
  private applyGravity(combo: number): void {
    const { moves, newTiles } = BoardLogic.getGravityPlan(
      this.getNumericGrid(),
    );
    let maxDelay = 0;

    // Move existing tiles
    moves.forEach((move) => {
      const tile = this.board[move.fromRow][move.col]!;
      const worldPos = this.getWorldPos(move.toRow, move.col);
      this.board[move.toRow][move.col] = tile;
      this.board[move.fromRow][move.col] = null;

      const duration = (move.toRow - move.fromRow) * 100;
      maxDelay = Math.max(maxDelay, duration);
      tile.animateTo(move.toRow, move.col, worldPos.x, worldPos.y, duration);
    });

    // Spawn new tiles
    newTiles.forEach((slot) => {
      const tileID = Math.floor(Math.random() * this.config.typeCount);
      const finalPos = this.getWorldPos(slot.row, slot.col);
      const newTile = new GameTile(
        this.scene,
        finalPos.x,
        finalPos.y - 300,
        tileID,
        slot.row,
        slot.col,
        this.config.tileSize,
      );
      newTile.setDepth(Constants.DEPTH_LAYERS.TILES);

      this.board[slot.row][slot.col] = newTile;
      const duration = 400 + slot.row * 50;
      maxDelay = Math.max(maxDelay, duration);
      newTile.animateTo(slot.row, slot.col, finalPos.x, finalPos.y, duration);
    });

    // Wait for all animations to finish before checking for new matches
    this.scene.time.delayedCall(maxDelay + 50, () => {
      const nextMatches = BoardLogic.getAllMatches(this.getNumericGrid());
      if (nextMatches.length > 0) {
        this.handleMatches(combo + 1);
      } else {
        this.callbacks.onSequenceComplete(
          BoardLogic.hasValidMoves(this.getNumericGrid()),
        );
      }
    });
  }

  /**
   * Helper to calculate world coordinates for a grid cell.
   */
  private getWorldPos(row: number, col: number) {
    return GridUtils.gridToWorld(
      row,
      col,
      this.config.tileSize,
      this.config.offsetX,
      this.config.offsetY,
    );
  }

  /**
   * Returns the tile at a specific grid position.
   * Safely handles out-of-bounds requests from InputManager.
   * @param row - Grid row.
   * @param col - Grid column.
   */
  public getTileAt(row: number, col: number): GameTile | null {
    if (this.board[row] && this.board[row][col] !== undefined) {
      return this.board[row][col];
    }
    return null;
  }

  /**
   * Converts the current visual board into a numeric grid for logic processing.
   */
  public getNumericGrid(): TileID[][] {
    return this.board.map((r) => r.map((t) => (t ? t.tileID : -1)));
  }

  /**
   * Visually shuffles all tiles to their new IDs and plays a "pop" animation.
   * @param newNumericGrid - The pre-calculated shuffled grid IDs.
   */
  public shuffleVisuals(newNumericGrid: TileID[][]): void {
    for (let row = 0; row < this.config.gridSize; row++) {
      for (let col = 0; col < this.config.gridSize; col++) {
        const tile = this.board[row][col];
        if (tile) {
          tile.updateVisual(newNumericGrid[row][col]);

          this.scene.tweens.add({
            targets: tile,
            scale: 1.4,
            duration: 150,
            yoyo: true,
            ease: "Quad.easeOut",
          });
        }
      }
    }
  }

  /**
   * Create a visual background for the grid
   */
  public drawBoardBackground(): void {
    if (this.boardBackground) this.boardBackground.destroy();

    const { gridSize, tileSize, offsetX, offsetY } = this.config;
    const padding = 20;
    const boardWidth = gridSize * tileSize;
    const boardHeight = gridSize * tileSize;
    const fullWidth = boardWidth + padding * 2;
    const fullHeight = boardHeight + padding * 2;
    const x = offsetX - padding;
    const y = offsetY - padding;

    this.boardBackground = this.scene.add.graphics();
    this.boardBackground.setDepth(Constants.DEPTH_LAYERS.TILES - 2);

    this.boardBackground.fillStyle(0x0a0a0a, 0.8);
    this.boardBackground.fillRoundedRect(x, y, fullWidth, fullHeight, 16);

    this.boardBackground.lineStyle(4, 0x000000, 0.5);
    this.boardBackground.strokeRoundedRect(
      x + 2,
      y + 2,
      fullWidth - 4,
      fullHeight - 4,
      16,
    );

    this.boardBackground.lineStyle(1, 0xffffff, 0.3);
    for (let i = 1; i < gridSize; i++) {
      const lx = offsetX + i * tileSize;
      const ly = offsetY + i * tileSize;
      this.boardBackground.lineBetween(lx, offsetY, lx, offsetY + boardHeight);
      this.boardBackground.lineBetween(offsetX, ly, offsetX + boardWidth, ly);
    }

    this.boardBackground.lineStyle(3, 0xffcc00, 0.4);
    this.boardBackground.strokeRoundedRect(x, y, fullWidth, fullHeight, 16);
  }

  /**
   * Updatae Layout after resize
   */
  public updateLayout(newSize: number, newX: number, newY: number): void {
    this.config.tileSize = newSize;
    this.config.offsetX = newX;
    this.config.offsetY = newY;

    this.drawBoardBackground();

    const targetScale = newSize / Constants.SPRITE_SIZE;

    for (let row = 0; row < this.config.gridSize; row++) {
      for (let col = 0; col < this.config.gridSize; col++) {
        const tile = this.board[row][col];
        if (!tile) continue;

        // Stop current animations to prevent scale/position conflicts
        this.scene.tweens.killTweensOf(tile);
        tile.setBaseScale(targetScale);
        tile.setDepth(Constants.DEPTH_LAYERS.TILES);

        const pos = this.getWorldPos(row, col);
        this.scene.tweens.add({
          targets: tile,
          x: pos.x,
          y: pos.y,
          duration: 400,
          ease: "Cubic.easeOut",
        });
      }
    }
  }

  /**
   * Cleans up any active references.
   */
  public destroy(): void {}
}
