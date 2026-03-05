// src/game/logic/GridModel.ts
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
   * Findet alle aktuellen Matches im Grid basierend auf dem aktuellen State.
   */
  public findMatches(): GridPosition[] {
    return BoardLogic.getAllMatches(this.grid);
  }

  /**
   * Markiert die übergebenen Positionen als leer (-1).
   */
  public clearMatches(matches: GridPosition[]): void {
    matches.forEach((pos) => {
      this.grid[pos.row][pos.col] = -1;
    });
  }

  /**
   * Versucht zwei Tiles zu tauschen und prüft, ob dadurch ein Match entsteht.
   */
  public trySwap(posA: GridPosition, posB: GridPosition): boolean {
    const typeA = this.getTile(posA.row, posA.col);
    const typeB = this.getTile(posB.row, posB.col);

    // Temporärer Tausch
    this.setTile(posA.row, posA.col, typeB);
    this.setTile(posB.row, posB.col, typeA);

    const matches = this.findMatches();

    if (matches.length > 0) {
      return true; // Tausch ist gültig!
    } else {
      // Rückgängig machen, da kein Match
      this.setTile(posA.row, posA.col, typeA);
      this.setTile(posB.row, posB.col, typeB);
      return false;
    }
  }

  public refill(newTiles: { row: number; col: number }[]): void {
    const variety = GameConfig.grid.variety;
    newTiles.forEach((pos) => {
      // Wir weisen jedem neuen Slot einen zufälligen Typ zu
      this.grid[pos.row][pos.col] = Math.floor(Math.random() * variety);
    });
  }

  public getTile(row: number, col: number): TileID {
    return this.grid[row][col];
  }

  public setTile(row: number, col: number, type: TileID): void {
    this.grid[row][col] = type;
  }

  public getRawGrid(): TileID[][] {
    return this.grid;
  }
}
