import type {
  TileID,
  GridPosition,
  GravityResult,
  GravityMove,
  EmptySlot,
} from "../types";

class BoardLogic {
  /**
   * Scans the entire grid for matches of 3 or more identical tiles.
   * Checks both horizontal and vertical directions.
   * @param grid - A 2D array of TileIDs representing the current board state.
   * @returns An array of unique GridPositions that are part of a match.
   */
  static getAllMatches(grid: TileID[][]): GridPosition[] {
    const matches: GridPosition[] = [];
    const rows = grid.length;
    const cols = grid[0].length;

    // Horizontal check
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

    // Vertical check
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

    // Filter duplicates (e.g., tiles that are part of both a horizontal and vertical match)
    return matches.filter(
      (pos, index, self) =>
        index === self.findIndex((p) => p.row === pos.row && p.col === pos.col),
    );
  }

  /**
   * Calculates the score based on the number of matched tiles and a multiplier.
   * @param matches - Array of matched grid positions.
   * @param multiplier - Current combo multiplier.
   * @returns Total points earned.
   */
  static calculateScore(matches: GridPosition[], multiplier: number): number {
    const basePointsPerTile = 10;
    const bonusPerExtraTile = 5; // Bonus for matches > 3

    // Basic points: 10 per tile, plus extra for longer chains
    const baseScore = matches.length * basePointsPerTile;
    const lengthBonus =
      matches.length > 3 ? (matches.length - 3) * bonusPerExtraTile : 0;

    return (baseScore + lengthBonus) * multiplier;
  }

  /**
   * Analyzes the grid to determine how tiles should fall and where new tiles are needed.
   * This is calculated column by column from bottom to top.
   * @param grid - The current grid state (including empty slots marked as -1).
   * @returns A plan containing movement instructions and spawn locations for new tiles.
   */
  static getGravityPlan(grid: TileID[][]): GravityResult {
    const moves: GravityMove[] = [];
    const newTiles: EmptySlot[] = [];
    const rows = grid.length;
    const cols = grid[0].length;

    for (let col = 0; col < cols; col++) {
      let emptySpaces = 0;

      // Scan from bottom to top
      for (let row = rows - 1; row >= 0; row--) {
        if (grid[row][col] === -1) {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          // This tile needs to fall down by the number of empty spaces found below it
          moves.push({
            col,
            fromRow: row,
            toRow: row + emptySpaces,
          });
        }
      }

      // After scanning all rows in the column, the number of emptySpaces
      // tells us how many new tiles must spawn at the top.
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
   * Checks if there is at least one possible swap that results in a match.
   * If this returns false, the game is usually over or requires a shuffle.
   * @param grid - The current grid state.
   * @returns True if a valid move exists, false otherwise.
   */
  static hasValidMoves(grid: TileID[][]): boolean {
    const rows = grid.length;
    const cols = grid[0].length;

    // Helper to check if a specific cell would be part of a match
    const wouldMatch = (
      tempGrid: TileID[][],
      row: number,
      col: number,
    ): boolean => {
      const type = tempGrid[row][col];
      if (type === -1) return false;

      // Horizontal check around the tile
      let horizontalCount = 1;
      // Check right
      for (let i = col + 1; i < cols && tempGrid[row][i] === type; i++)
        horizontalCount++;
      // Check left
      for (let i = col - 1; i >= 0 && tempGrid[row][i] === type; i--)
        horizontalCount++;
      if (horizontalCount >= 3) return true;

      // Vertical check around the tile
      let verticalCount = 1;
      // Check down
      for (let i = row + 1; i < rows && tempGrid[i][col] === type; i++)
        verticalCount++;
      // Check up
      for (let i = row - 1; i >= 0 && tempGrid[i][col] === type; i--)
        verticalCount++;
      if (verticalCount >= 3) return true;

      return false;
    };

    // Try every possible horizontal swap
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols - 1; col++) {
        // Swap
        [grid[row][col], grid[row][col + 1]] = [
          grid[row][col + 1],
          grid[row][col],
        ];
        const found =
          wouldMatch(grid, row, col) || wouldMatch(grid, row, col + 1);
        // Swap back
        [grid[row][col], grid[row][col + 1]] = [
          grid[row][col + 1],
          grid[row][col],
        ];
        if (found) return true;
      }
    }

    // Try every possible vertical swap
    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols; col++) {
        // Swap
        [grid[row][col], grid[row + 1][col]] = [
          grid[row + 1][col],
          grid[row][col],
        ];
        const found =
          wouldMatch(grid, row, col) || wouldMatch(grid, row + 1, col);
        // Swap back
        [grid[row][col], grid[row + 1][col]] = [
          grid[row + 1][col],
          grid[row][col],
        ];
        if (found) return true;
      }
    }

    return false;
  }

  /**
   * Creates a new grid filled with random tiles.
   * @param rows - Number of rows.
   * @param cols - Number of columns.
   * @param typeCount - How many different tile types exist.
   * @param randomFn - A function that returns a float between 0 and 1.
   * @returns A fully initialized grid of TileIDs.
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
   * Iteratively replaces tiles that are part of a match until the grid is stable.
   * Used during initial board generation to prevent auto-matches.
   * @param grid - The grid to stabilize.
   * @param typeCount - Number of available tile types.
   * @param randomFn - Random number generator function.
   */
  static resolveInitialMatchesInGrid(
    grid: TileID[][],
    typeCount: number,
    randomFn: () => number = Math.random,
  ): void {
    let matches = this.getAllMatches(grid);
    let safetyNet = 0;

    while (matches.length > 0 && safetyNet < 100) {
      safetyNet++;
      matches.forEach((pos) => {
        grid[pos.row][pos.col] = Math.floor(randomFn() * typeCount);
      });
      matches = this.getAllMatches(grid);
    }
  }

  /**
   * Shuffles the current grid until at least one valid move is available.
   * Ensures the player never gets stuck after a shuffle.
   * @param grid - The current grid state.
   * @param randomFn - Random number generator.
   * @returns The shuffled grid.
   */
  static shuffleGrid(
    grid: TileID[][],
    randomFn: () => number = Math.random,
  ): TileID[][] {
    const rows = grid.length;
    const cols = grid[0].length;
    const flatGrid = grid.flat();
    let attempts = 0;

    do {
      // Fisher-Yates Shuffle
      for (let i = flatGrid.length - 1; i > 0; i--) {
        const j = Math.floor(randomFn() * (i + 1));
        [flatGrid[i], flatGrid[j]] = [flatGrid[j], flatGrid[i]];
      }

      // Convert back to 2D array
      for (let i = 0; i < rows; i++) {
        grid[i] = flatGrid.slice(i * cols, (i + 1) * cols);
      }
      attempts++;
    } while (!this.hasValidMoves(grid) && attempts < 100);

    return grid;
  }
}

export { BoardLogic };
