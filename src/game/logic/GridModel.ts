import { BoardLogic } from "./BoardLogic";
import { GameConfig } from "../config/GameConfig";
import type { TileID, GravityResult, GridPosition } from "../types";

/**
 * Manages the internal 2D state of the game grid.
 * Handles state updates for matches, swaps, and gravity transitions.
 */
export class GridModel {
  /** 2D array representing the board where each entry is a TileID */
  private grid: TileID[][] = [];
  /** Total number of rows in the grid */
  private readonly rows: number;
  /** Total number of columns in the grid */
  private readonly cols: number;

  /**
   * @param rows - Initial row count.
   * @param cols - Initial column count.
   */
  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.reset();
  }

  /**
   * Resets the grid to an empty state where all cells are -1.
   */
  public reset(): void {
    this.grid = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(-1),
    );
  }

  /**
   * Generates a new, stable board layout.
   * Uses BoardLogic to ensure the initial state contains no automatic matches
   * and at least one valid move is possible.
   */
  public generate(): void {
    const variety = GameConfig.grid.variety;

    // Create a raw randomized grid
    this.grid = BoardLogic.createRandomGrid(this.rows, this.cols, variety);

    // Ensure the grid is playable and match-free at start
    this.grid = BoardLogic.shuffleGrid(this.grid, variety);
  }

  /**
   * Shuffles the current logical grid data.
   * Maintains existing tile types but redistributes them until the board is valid.
   */
  public shuffle(): void {
    this.grid = BoardLogic.shuffleGrid(this.grid, GameConfig.grid.variety);
  }

  /**
   * Calculates the gravity transition and updates the internal grid state.
   * Tiles are moved from their 'fromRow' to 'toRow' within the model.
   *
   * @returns The plan containing moves and spawn positions for the View to animate.
   */
  public stepGravity(): GravityResult {
    const plan = BoardLogic.getGravityPlan(this.grid);

    // Update internal state based on moves:
    // We process moves to ensure the logical grid matches the visual result of gravity.
    plan.moves.forEach((move) => {
      const type = this.grid[move.fromRow][move.col];
      this.grid[move.fromRow][move.col] = -1;
      this.grid[move.toRow][move.col] = type;
    });

    // Note: newTiles positions in the grid remain -1 until refill() is called.
    return plan;
  }

  /**
   * Scans the current state for all horizontal and vertical matches.
   *
   * @returns An array of unique grid positions that should be cleared.
   */
  public findMatches(): GridPosition[] {
    return BoardLogic.getAllMatches(this.grid);
  }

  /**
   * Clears matched tiles by setting their grid values to -1.
   *
   * @param matches - The list of positions to empty.
   */
  public clearMatches(matches: GridPosition[]): void {
    matches.forEach((pos) => {
      this.grid[pos.row][pos.col] = -1;
    });
  }

  /**
   * Simulates a swap between two positions.
   * If the swap creates a match, it is kept; otherwise, it is reverted.
   *
   * @param posA - First grid position.
   * @param posB - Second grid position.
   * @returns True if the swap was successful (resulted in a match).
   */
  public trySwap(posA: GridPosition, posB: GridPosition): boolean {
    const typeA = this.getTile(posA.row, posA.col);
    const typeB = this.getTile(posB.row, posB.col);

    // Perform temporary swap
    this.setTile(posA.row, posA.col, typeB);
    this.setTile(posB.row, posB.col, typeA);

    const matches = this.findMatches();

    if (matches.length > 0) {
      return true;
    } else {
      // Revert if no match was formed
      this.setTile(posA.row, posA.col, typeA);
      this.setTile(posB.row, posB.col, typeB);
      return false;
    }
  }

  /**
   * Populates empty slots (-1) with new random tile IDs.
   *
   * @param newTiles - The empty positions identified by the gravity plan.
   */
  public refill(newTiles: { row: number; col: number }[]): void {
    const variety = GameConfig.grid.variety;
    newTiles.forEach((pos) => {
      this.grid[pos.row][pos.col] = Math.floor(Math.random() * variety);
    });
  }

  /**
   * Gets the tile type at a specific coordinate.
   *
   * @param row - Grid row.
   * @param col - Grid column.
   * @returns The TileID.
   */
  public getTile(row: number, col: number): TileID {
    return this.grid[row][col];
  }

  /**
   * Directly sets a tile type at a specific coordinate.
   *
   * @param row - Grid row.
   * @param col - Grid column.
   * @param type - New TileID.
   */
  public setTile(row: number, col: number, type: TileID): void {
    this.grid[row][col] = type;
  }

  /**
   * Provides access to the raw grid data.
   *
   * @returns The underlying 2D array.
   */
  public getRawGrid(): TileID[][] {
    return this.grid;
  }
}
