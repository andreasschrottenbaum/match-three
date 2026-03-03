import { describe, it, expect } from "vitest";
import { GridUtils } from "./GridUtils";

describe("GridUtils", () => {
  const GRID_SIZE = 8;
  const TILE_SIZE = 100;
  const SCREEN_WIDTH = 1000;
  const SCREEN_HEIGHT = 800;

  // Expected offsets:
  // x: (1000 - 8 * 100) / 2 = 100
  // y: (800 - 8 * 100) / 2 = 0
  const OFFSETS = { x: 100, y: 0 };

  describe("getGridOffsets", () => {
    it("should calculate correct centering offsets", () => {
      const result = GridUtils.getGridOffsets(
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        GRID_SIZE,
        TILE_SIZE,
      );
      expect(result.x).toBe(100);
      expect(result.y).toBe(0);
    });
  });

  describe("gridToWorld", () => {
    it("should convert grid coordinates to world pixel center", () => {
      // First tile (0, 0)
      // Expected: offset (100) + col (0) * 100 + half-tile (50) = 150
      const pos = GridUtils.gridToWorld(0, 0, TILE_SIZE, OFFSETS.x, OFFSETS.y);
      expect(pos.x).toBe(150);
      expect(pos.y).toBe(50);
    });

    it("should calculate the last tile correctly", () => {
      // Last tile (7, 7)
      // Expected x: 100 + 7 * 100 + 50 = 850
      const pos = GridUtils.gridToWorld(7, 7, TILE_SIZE, OFFSETS.x, OFFSETS.y);
      expect(pos.x).toBe(850);
      expect(pos.y).toBe(750);
    });
  });

  describe("worldToGrid", () => {
    it("should convert world pixels back to grid indices", () => {
      // Input near the center of tile (0, 0)
      const grid = GridUtils.worldToGrid(
        160,
        60,
        TILE_SIZE,
        OFFSETS.x,
        OFFSETS.y,
      );
      expect(grid.row).toBe(0);
      expect(grid.col).toBe(0);
    });

    it("should handle edge cases correctly", () => {
      // Input exactly at the start of the last tile
      const grid = GridUtils.worldToGrid(
        800,
        700,
        TILE_SIZE,
        OFFSETS.x,
        OFFSETS.y,
      );
      expect(grid.row).toBe(7);
      expect(grid.col).toBe(7);
    });

    it("should return negative indices for out-of-bounds (left/top)", () => {
      const grid = GridUtils.worldToGrid(
        50,
        -10,
        TILE_SIZE,
        OFFSETS.x,
        OFFSETS.y,
      );
      expect(grid.col).toBeLessThan(0);
      expect(grid.row).toBeLessThan(0);
    });
  });
});
