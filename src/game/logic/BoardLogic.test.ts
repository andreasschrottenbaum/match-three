import { describe, it, expect } from "vitest";
import { BoardLogic } from "./BoardLogic";
import type { TileID } from "../types";

describe("BoardLogic", () => {
  describe("getAllMatches()", () => {
    it("should detect simple horizontal and vertical matches", () => {
      const grid: TileID[][] = [
        [1, 1, 1, 2], // Horizontal match of '1's
        [3, 4, 5, 2],
        [6, 7, 8, 2], // Vertical match of '2's (ends here)
        [0, 0, 0, 0], // Horizontal match of '0's
      ];

      const matches = BoardLogic.getAllMatches(grid);

      // 3 (top row) + 3 (last col) + 4 (bottom row) = 10 unique positions
      expect(matches.length).toBe(10);
    });

    it("should handle an L-shaped match and return unique positions only", () => {
      const grid: TileID[][] = [
        [1, 0, 0],
        [1, 5, 5],
        [1, 1, 1], // Intersection at (2,0)
      ];

      const matches = BoardLogic.getAllMatches(grid);

      // Vertical: (0,0),(1,0),(2,0)
      // Horizontal: (2,0),(2,1),(2,2)
      // Total unique: 5
      expect(matches.length).toBe(5);
    });

    it("should return an empty array if no matches exist", () => {
      const grid: TileID[][] = [
        [1, 2, 1],
        [2, 1, 2],
        [1, 2, 1],
      ];
      expect(BoardLogic.getAllMatches(grid).length).toBe(0);
    });
  });

  describe("calculateScore()", () => {
    it("should calculate base score for a match of 3", () => {
      const matches = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ];
      // (3 tiles * 10) * 1 multiplier = 30
      expect(BoardLogic.calculateScore(matches, 1)).toBe(30);
    });

    it("should apply bonus points for chains longer than 3", () => {
      const matches = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ];
      // (4 tiles * 10) + (1 extra * 5) = 45
      expect(BoardLogic.calculateScore(matches, 1)).toBe(45);
    });

    it("should apply the combo multiplier to the total", () => {
      const matches = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ];
      // 30 * 2 multiplier = 60
      expect(BoardLogic.calculateScore(matches, 2)).toBe(60);
    });
  });

  describe("getGravityPlan()", () => {
    it("should correctly identify falling tiles and new spawn points", () => {
      const grid: TileID[][] = [
        [1, -1],
        [-1, 2],
        [3, 4],
      ];

      const plan = BoardLogic.getGravityPlan(grid);

      // Column 0: Row 1 is empty. Tile at (0,0) should fall to (1,0).
      // Resulting new tile at (0,0).
      expect(plan.moves).toContainEqual({ col: 0, fromRow: 0, toRow: 1 });
      expect(plan.newTiles).toContainEqual({ row: 0, col: 0 });

      // Column 1: Row 0 is empty. Tile at (1,1) falls to (1,1) [no move],
      // but empty space at (0,1) needs refill.
      expect(plan.newTiles).toContainEqual({ row: 0, col: 1 });
    });

    it("should handle multiple empty spaces in one column", () => {
      const grid: TileID[][] = [[1], [-1], [-1], [2]];
      const plan = BoardLogic.getGravityPlan(grid);

      // Tile '1' (row 0) falls 2 spaces to row 2.
      expect(plan.moves).toContainEqual({ col: 0, fromRow: 0, toRow: 2 });
      // Two new tiles at the top
      expect(plan.newTiles.length).toBe(2);
    });
  });

  describe("hasValidMoves()", () => {
    it("should return true if a horizontal swap creates a match", () => {
      const grid: TileID[][] = [
        [1, 1, 2, 1], // Swapping (0,2) with (0,3) creates a match of '1's
        [5, 6, 7, 8],
      ];
      expect(BoardLogic.hasValidMoves(grid)).toBe(true);
    });

    it("should return false if no swaps result in a match", () => {
      const grid: TileID[][] = [
        [1, 0, 1, 2],
        [2, 2, 0, 1],
      ];
      expect(BoardLogic.hasValidMoves(grid)).toBe(false);
    });
  });

  describe("createRandomGrid()", () => {
    it("should create a grid with the correct dimensions", () => {
      const grid = BoardLogic.createRandomGrid(5, 4, 6);
      expect(grid.length).toBe(5);
      expect(grid[0].length).toBe(4);
    });
  });
});
