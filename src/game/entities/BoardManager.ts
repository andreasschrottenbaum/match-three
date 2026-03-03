import { Scene } from "phaser";
import { GameTile } from "./GameTile";
import { BoardLogic } from "../logic/BoardLogic";
import { GridUtils } from "../logic/GridUtils";
import type { TileID } from "../types";

/**
 * Configuration interface for the BoardManager layout and logic.
 */
export interface BoardConfig {
  gridSize: number;
  tileSize: number;
  typeCount: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Manages the visual grid of tiles, orchestrates animations,
 * and communicates with BoardLogic for match detection.
 */
export class BoardManager {
  private board: (GameTile | null)[][] = [];

  /**
   * @param scene - The parent Phaser scene.
   * @param config - Layout and grid configuration.
   * @param callbacks - Hooks for external systems (Score, Particles, GameState).
   */
  constructor(
    private scene: Scene,
    private config: BoardConfig,
    private callbacks: {
      onScore: (points: number, x: number, y: number) => void;
      onMatchExplode: (x: number, y: number) => void;
      onSequenceComplete: (hasMoves: boolean) => void;
    },
  ) {}

  /**
   * Returns the tile at a specific grid position.
   */
  public getTileAt(row: number, col: number): GameTile | null {
    return this.board[row][col];
  }

  /**
   * Converts the visual board into a numeric ID representation for logic checks.
   */
  public getNumericGrid(): TileID[][] {
    return this.board.map((row) =>
      row.map((tile) => (tile ? tile.tileID : -1)),
    );
  }

  /**
   * Clears old tiles and instantiates new GameTile objects based on a grid plan.
   */
  public createVisualBoard(numericGrid: number[][]): void {
    this.board.forEach((row) => row.forEach((tile) => tile?.destroy()));
    this.board = [];

    for (let row = 0; row < this.config.gridSize; row++) {
      this.board[row] = [];
      for (let col = 0; col < this.config.gridSize; col++) {
        const worldPos = this.getWorldPos(row, col);
        this.board[row][col] = new GameTile(
          this.scene,
          worldPos.x,
          worldPos.y,
          numericGrid[row][col],
          row,
          col,
          this.config.tileSize,
        );
      }
    }
  }

  /**
   * Swaps two tiles visually and logically. Reverts if no match is found.
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
            this.swapTiles(row2, col2, row1, col1, true);
          }
        } else {
          this.callbacks.onSequenceComplete(true);
        }
      },
    });
  }

  /**
   * Processes matches: updates score, triggers explosions, and initiates gravity.
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

    const points = BoardLogic.calculateScore(matches, combo);
    const firstMatch = matches[0];
    const scorePos = this.getWorldPos(firstMatch.row, firstMatch.col);
    this.callbacks.onScore(points, scorePos.x, scorePos.y);

    matches.forEach((pos) => {
      const tile = this.board[pos.row][pos.col];
      if (tile) {
        this.callbacks.onMatchExplode(tile.x, tile.y);
        tile.popAndDestroy();
        this.board[pos.row][pos.col] = null;
      }
    });

    this.scene.time.delayedCall(250, () => this.applyGravity(combo));
  }

  /**
   * Applies gravity to empty slots and spawns new tiles at the top.
   */
  private applyGravity(combo: number): void {
    const { moves, newTiles } = BoardLogic.getGravityPlan(
      this.getNumericGrid(),
    );
    let maxDelay = 0;

    moves.forEach((move) => {
      const tile = this.board[move.fromRow][move.col]!;
      const worldPos = this.getWorldPos(move.toRow, move.col);
      this.board[move.toRow][move.col] = tile;
      this.board[move.fromRow][move.col] = null;

      const duration = (move.toRow - move.fromRow) * 100;
      maxDelay = Math.max(maxDelay, duration);
      tile.animateTo(move.toRow, move.col, worldPos.x, worldPos.y, duration);
    });

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
      this.board[slot.row][slot.col] = newTile;
      const duration = 400 + slot.row * 50;
      maxDelay = Math.max(maxDelay, duration);
      newTile.animateTo(slot.row, slot.col, finalPos.x, finalPos.y, duration);
    });

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
}
