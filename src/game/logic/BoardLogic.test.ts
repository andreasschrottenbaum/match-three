import { describe, it, expect } from "vitest";
import { BoardLogic } from "./BoardLogic";
import type { TileID } from "../types";

describe("BoardLogic", () => {
  describe("getAllMatches", () => {
    it("should detect horizontal matches of 3 tiles", () => {
      const grid: TileID[][] = [
        [0, 0, 0, 1, 2], // Match in the first three columns
        [1, 2, 3, 4, 5],
        [0, 1, 0, 1, 0],
      ];
      const matches = BoardLogic.getAllMatches(grid);
      expect(matches).toHaveLength(3);
      expect(matches).toContainEqual({ row: 0, col: 0 });
      expect(matches).toContainEqual({ row: 0, col: 1 });
      expect(matches).toContainEqual({ row: 0, col: 2 });
    });

    it("should detect vertical matches of 3 tiles", () => {
      const grid: TileID[][] = [
        [5, 1],
        [5, 2],
        [5, 3],
      ];
      const matches = BoardLogic.getAllMatches(grid);
      expect(matches).toHaveLength(3);
      expect(matches).toContainEqual({ row: 0, col: 0 });
      expect(matches).toContainEqual({ row: 1, col: 0 });
      expect(matches).toContainEqual({ row: 2, col: 0 });
    });

    it("should ignore empty slots (-1) during match detection", () => {
      const grid: TileID[][] = [
        [-1, -1, -1, 0, 0],
        [0, 0, 1, 1, 1],
      ];
      const matches = BoardLogic.getAllMatches(grid);
      // Only the 1s should match, the -1s must be ignored
      expect(matches).toHaveLength(3);
      expect(matches.every((m) => grid[m.row][m.col] === 1)).toBe(true);
    });
  });

  describe("getGravityPlan", () => {
    it("should calculate correct downward movements", () => {
      const grid: TileID[][] = [
        [0, 1],
        [-1, -1], // Bottom row is empty
      ];
      const { moves, newTiles } = BoardLogic.getGravityPlan(grid);

      // Two existing tiles must fall
      expect(moves).toHaveLength(2);
      // Tile at [0,0] falls 1 row down to [1,0]
      expect(moves).toContainEqual({ col: 0, fromRow: 0, toRow: 1 });
      // Two new tiles must be spawned at the top
      expect(newTiles).toHaveLength(2);
      expect(newTiles).toContainEqual({ row: 0, col: 0 });
      expect(newTiles).toContainEqual({ row: 0, col: 1 });
    });
  });

  describe("Stress Test (Gravity)", () => {
    it("should correctly collapse complex hole patterns", () => {
      // 1 = Tile, -1 = Empty
      const grid: TileID[][] = [
        [1, -1, 1], // Row 0
        [-1, -1, -1], // Row 1
        [1, 1, -1], // Row 2
      ];

      const { moves, newTiles } = BoardLogic.getGravityPlan(grid);

      // 1. Verify that no target position is occupied twice
      const targets = moves.map((m) => `${m.toRow},${m.col}`);
      const uniqueTargets = new Set(targets);
      expect(targets.length).toBe(uniqueTargets.size);

      // 2. Column 0: Tile at [0,0] falls to [1,0] because [1,0] is free and [2,0] is occupied
      expect(moves).toContainEqual({ col: 0, fromRow: 0, toRow: 1 });

      // 3. New tiles count should match the number of holes in each column
      const col1New = newTiles.filter((n) => n.col === 1);
      expect(col1New).toHaveLength(2); // Two holes in column 1
    });
  });

  describe("Scoring Logic", () => {
    it("should award 30 points for a simple 3-match", () => {
      const matches = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ];
      expect(BoardLogic.calculateScore(matches, 1)).toBe(30);
    });

    it("should apply a bonus for 4-matches (40 base + 5 bonus)", () => {
      const matches = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ];
      expect(BoardLogic.calculateScore(matches, 1)).toBe(45);
    });

    it("should apply the combo multiplier correctly", () => {
      const matches = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ];
      // (30 points) * multiplier 2 = 60
      expect(BoardLogic.calculateScore(matches, 2)).toBe(60);
    });

    it("should calculate bonus BEFORE applying the multiplier", () => {
      const matches4 = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ];
      // (40 base + 5 bonus) * 3 = 135
      expect(BoardLogic.calculateScore(matches4, 3)).toBe(135);
    });
  });

  describe("Deadlock Detection", () => {
    it("should return true when a valid move exists", () => {
      const grid: TileID[][] = [
        [1, 1, 2, 0], // The tile at [0,2] could be swapped with [1,2]
        [0, 0, 1, 0],
      ];
      expect(BoardLogic.hasValidMoves(grid)).toBe(true);
    });

    it("should return false when no moves are possible", () => {
      const grid: TileID[][] = [
        [1, 0, 1, 2],
        [2, 0, 2, 1],
      ];
      expect(BoardLogic.hasValidMoves(grid)).toBe(false);
    });
  });
});
