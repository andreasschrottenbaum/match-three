import { BoardLogic } from "./BoardLogic";
import { GameConfig } from "../config/GameConfig";
import type { TileID, GravityResult, GridPosition } from "../types";

export class GridModel {
  private grid: TileID[][] = [];
  private rows: number;
  private cols: number;

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
    this.reset();
  }

  /**
   * Resets the grid to an empty state
   */
  public reset(): void {
    this.grid = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(-1),
    );
  }

  /**
   * Generates a new, stable board without initial matches
   */
  public generate(): void {
    const variety = GameConfig.grid.variety;

    // 1. Create random board
    this.grid = BoardLogic.createRandomGrid(this.rows, this.cols, variety);

    // 2. Remove initial matches
    BoardLogic.resolveInitialMatchesInGrid(this.grid, variety);

    // 3. Ensure a move is actually possible
    let attempts = 0;
    while (!BoardLogic.hasValidMoves(this.grid) && attempts < 10) {
      this.grid = BoardLogic.shuffleGrid(this.grid);
      attempts++;
    }
  }

  /**
   * Shuffles the logical grid data until no matches are present.
   * This only changes the IDs in the 2D array.
   */
  public shuffle(): void {
    let attempts = 0;
    this.grid = BoardLogic.shuffleGrid(this.grid);

    while (this.findMatches().length > 0 && attempts < 100) {
      this.grid = BoardLogic.shuffleGrid(this.grid);
      attempts++;
    }
  }

  /**
   * Core Match-3 Step: Apply gravity and return the plan for animations
   */
  public stepGravity(): GravityResult {
    const plan = BoardLogic.getGravityPlan(this.grid);

    // Update internal state: moves
    plan.moves.forEach((move) => {
      const type = this.grid[move.fromRow][move.col];
      this.grid[move.fromRow][move.col] = -1;
      this.grid[move.toRow][move.col] = type;
    });

    // Note: newTiles are still -1 until the View/Controller
    // actually spawns them and sets their types.

    return plan;
  }

  /**
   * Finds all current matches in the grid based on the current state.
   * @returns An array of positions that are part of a match.
   */
  public findMatches(): GridPosition[] {
    return BoardLogic.getAllMatches(this.grid);
  }

  /**
   * Marks the specified positions as empty (-1).
   * @param matches - The positions to clear.
   */
  public clearMatches(matches: GridPosition[]): void {
    matches.forEach((pos) => {
      this.grid[pos.row][pos.col] = -1;
    });
  }

  /**
   * Attempts to swap two tiles. If no match is created, the swap is reverted.
   * @returns True if the swap resulted in a match and was kept.
   */
  public trySwap(posA: GridPosition, posB: GridPosition): boolean {
    const typeA = this.getTile(posA.row, posA.col);
    const typeB = this.getTile(posB.row, posB.col);

    this.setTile(posA.row, posA.col, typeB);
    this.setTile(posB.row, posB.col, typeA);

    const matches = this.findMatches();

    if (matches.length > 0) {
      return true;
    } else {
      this.setTile(posA.row, posA.col, typeA);
      this.setTile(posB.row, posB.col, typeB);
      return false;
    }
  }

  /**
   * Refills empty grid slots with new random tiles.
   * @param newTiles - The positions to refill.
   */
  public refill(newTiles: { row: number; col: number }[]): void {
    const variety = GameConfig.grid.variety;
    newTiles.forEach((pos) => {
      this.grid[pos.row][pos.col] = Math.floor(Math.random() * variety);
    });
  }

  /**
   * Retrieves the tile type at a specific grid position.
   * @param row - The grid row index.
   * @param col - The grid column index.
   * @returns The TileID at the specified location.
   */
  public getTile(row: number, col: number): TileID {
    return this.grid[row][col];
  }

  /**
   * Updates the tile type at a specific grid position.
   * @param row - The grid row index.
   * @param col - The grid column index.
   * @param type - The new TileID to assign.
   */
  public setTile(row: number, col: number, type: TileID): void {
    this.grid[row][col] = type;
  }

  /**
   * Returns the underlying 2D array representation of the grid.
   * Useful for logic operations that require direct board access.
   * @returns The 2D array of TileIDs.
   */
  public getRawGrid(): TileID[][] {
    return this.grid;
  }
}
