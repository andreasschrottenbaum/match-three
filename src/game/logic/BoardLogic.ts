import type {
  TileID,
  GridPosition,
  GravityResult,
  GravityMove,
  EmptySlot,
} from "../types";

/**
 * Pure logic class for Match-3 grid operations.
 * Handles match detection, score calculation, gravity planning, and grid generation.
 * This class is independent of the DOM and Phaser rendering.
 */
class BoardLogic {
  /**
   * Scans the entire grid for matches of 3 or more identical tiles.
   * Checks both horizontal and vertical directions.
   *
   * @param grid - A 2D array of TileIDs representing the current board state.
   * @returns An array of unique GridPositions that are part of a match.
   */
  static getAllMatches(grid: TileID[][]): GridPosition[] {
    const matches: GridPosition[] = [];
    const rows = grid.length;
    if (rows === 0) return [];
    const cols = grid[0].length;

    // Horizontal check: scan each row for sequences
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols - 2; col++) {
        const type = grid[row][col];
        if (
          type !== -1 &&
          type === grid[row][col + 1] &&
          type === grid[row][col + 2]
        ) {
          matches.push(
            { row, col },
            { row, col: col + 1 },
            { row, col: col + 2 },
          );
        }
      }
    }

    // Vertical check: scan each column for sequences
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows - 2; row++) {
        const type = grid[row][col];
        if (
          type !== -1 &&
          type === grid[row + 1][col] &&
          type === grid[row + 2][col]
        ) {
          matches.push(
            { row, col },
            { row: row + 1, col },
            { row: row + 2, col },
          );
        }
      }
    }

    // Filter duplicates: tiles at intersections shouldn't be counted twice
    return matches.filter(
      (pos, index, self) =>
        index === self.findIndex((p) => p.row === pos.row && p.col === pos.col),
    );
  }

  /**
   * Calculates the score based on the number of matched tiles and a multiplier.
   *
   * @param matches - Array of matched grid positions.
   * @param multiplier - Current combo multiplier.
   * @returns Total points earned.
   */
  static calculateScore(matches: GridPosition[], multiplier: number): number {
    const basePointsPerTile = 10;
    const bonusPerExtraTile = 5; // Bonus for chains longer than 3

    const baseScore = matches.length * basePointsPerTile;
    const lengthBonus =
      matches.length > 3 ? (matches.length - 3) * bonusPerExtraTile : 0;

    return (baseScore + lengthBonus) * multiplier;
  }

  /**
   * Analyzes the grid to determine how tiles should fall and where new tiles are needed.
   * Calculated column by column from bottom to top to identify "holes".
   *
   * @param grid - The current grid state (empty slots marked as -1).
   * @returns A plan containing movement instructions and spawn locations.
   */
  static getGravityPlan(grid: TileID[][]): GravityResult {
    const moves: GravityMove[] = [];
    const newTiles: EmptySlot[] = [];
    const rows = grid.length;
    if (rows === 0) return { moves: [], newTiles: [] };
    const cols = grid[0].length;

    for (let col = 0; col < cols; col++) {
      let emptySpaces = 0;

      // Scan column from bottom to top to find empty slots
      for (let row = rows - 1; row >= 0; row--) {
        if (grid[row][col] === -1) {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          // Current tile "falls" into the accumulated empty space below it
          moves.push({
            col,
            fromRow: row,
            toRow: row + emptySpaces,
          });
        }
      }

      // Populate top of the column with new tiles to replace the fell/matched ones
      for (let i = 0; i < emptySpaces; i++) {
        newTiles.push({
          row: i,
          col: col,
        });
      }
    }

    return { moves, newTiles };
  }

  /**
   * Checks for potential matches by simulating all possible adjacent swaps.
   *
   * @param grid - The current grid state.
   * @returns True if at least one valid move exists.
   */
  static hasValidMoves(grid: TileID[][]): boolean {
    const rows = grid.length;
    if (rows === 0) return false;
    const cols = grid[0].length;

    /**
     * Internal helper to check if a specific cell forms a match with its neighbors.
     */
    const wouldMatch = (
      tempGrid: TileID[][],
      row: number,
      col: number,
    ): boolean => {
      const type = tempGrid[row][col];
      if (type === -1) return false;

      // Local Horizontal check
      let hCount = 1;
      for (let i = col + 1; i < cols && tempGrid[row][i] === type; i++)
        hCount++;
      for (let i = col - 1; i >= 0 && tempGrid[row][i] === type; i--) hCount++;
      if (hCount >= 3) return true;

      // Local Vertical check
      let vCount = 1;
      for (let i = row + 1; i < rows && tempGrid[i][col] === type; i++)
        vCount++;
      for (let i = row - 1; i >= 0 && tempGrid[i][col] === type; i--) vCount++;
      return vCount >= 3;
    };

    // Simulate Horizontal Swaps
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols - 1; col++) {
        [grid[row][col], grid[row][col + 1]] = [
          grid[row][col + 1],
          grid[row][col],
        ];
        const found =
          wouldMatch(grid, row, col) || wouldMatch(grid, row, col + 1);
        [grid[row][col], grid[row][col + 1]] = [
          grid[row][col + 1],
          grid[row][col],
        ]; // Swap back
        if (found) return true;
      }
    }

    // Simulate Vertical Swaps
    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols; col++) {
        [grid[row][col], grid[row + 1][col]] = [
          grid[row + 1][col],
          grid[row][col],
        ];
        const found =
          wouldMatch(grid, row, col) || wouldMatch(grid, row + 1, col);
        [grid[row][col], grid[row + 1][col]] = [
          grid[row + 1][col],
          grid[row][col],
        ]; // Swap back
        if (found) return true;
      }
    }

    return false;
  }

  /**
   * Generates a raw grid filled with random tile IDs.
   *
   * @param rows - Row count.
   * @param cols - Column count.
   * @param typeCount - Number of unique tile types available.
   * @param randomFn - Optional custom random generator (useful for seeded tests).
   * @returns A 2D array of TileIDs.
   */
  static createRandomGrid(
    rows: number,
    cols: number,
    typeCount: number,
    randomFn: () => number = Math.random,
  ): TileID[][] {
    const grid: TileID[][] = [];
    for (let row = 0; row < rows; row++) {
      grid[row] = [];
      for (let col = 0; col < cols; col++) {
        grid[row][col] = Math.floor(randomFn() * typeCount);
      }
    }
    return grid;
  }

  /**
   * Modifies the grid in-place to replace any tiles that form automatic matches.
   * Typically used during board initialization to ensure no matches exist at start.
   *
   * @param grid - The grid to stabilize.
   * @param typeCount - Number of available tile types.
   */
  static resolveInitialMatchesInGrid(
    grid: TileID[][],
    typeCount: number,
  ): void {
    const rows = grid.length;
    if (rows === 0) return;
    const cols = grid[0].length;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Change the tile if it matches neighbors to the left or top
        while (
          (col > 1 &&
            grid[row][col] === grid[row][col - 1] &&
            grid[row][col] === grid[row][col - 2]) ||
          (row > 1 &&
            grid[row][col] === grid[row - 1][col] &&
            grid[row][col] === grid[row - 2][col])
        ) {
          grid[row][col] = Math.floor(Math.random() * typeCount);
        }
      }
    }
  }

  /**
   * Shuffles the grid until a state with at least one valid move is reached.
   * Uses the Fisher-Yates algorithm for the shuffle.
   *
   * @param grid - The grid state to shuffle.
   * @param typeCount - Available tile types for re-resolving matches.
   * @param randomFn - Random number generator.
   * @returns The modified grid.
   */
  static shuffleGrid(
    grid: TileID[][],
    typeCount: number,
    randomFn: () => number = Math.random,
  ): TileID[][] {
    const rows = grid.length;
    if (rows === 0) return grid;
    const cols = grid[0].length;

    let attempts = 0;
    const maxAttempts = 100; // Safety cap to prevent infinite loops
    let isValid = false;

    while (!isValid && attempts < maxAttempts) {
      attempts++;

      // 1. Flatten the 2D grid for Fisher-Yates shuffle
      const flatGrid = grid.flat();
      for (let i = flatGrid.length - 1; i > 0; i--) {
        const j = Math.floor(randomFn() * (i + 1));
        [flatGrid[i], flatGrid[j]] = [flatGrid[j], flatGrid[i]];
      }

      // 2. Reconstruct the 2D structure
      for (let i = 0; i < rows; i++) {
        grid[i] = flatGrid.slice(i * cols, (i + 1) * cols);
      }

      // 3. Remove any unintentional matches created by the shuffle
      this.resolveInitialMatchesInGrid(grid, typeCount);

      // 4. Validate that the board is playable
      if (this.hasValidMoves(grid)) {
        isValid = true;
      }
    }

    if (attempts >= maxAttempts) {
      console.warn("Shuffle: Failed to find valid state within attempt limit.");
    }

    return grid;
  }
}

export { BoardLogic };
