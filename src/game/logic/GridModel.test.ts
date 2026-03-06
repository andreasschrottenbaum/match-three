import { describe, it, expect, beforeEach } from "vitest";
import { GridModel } from "./GridModel";

describe("GridModel", () => {
  let model: GridModel;

  beforeEach(() => {
    // Initialize a 3x3 Grid for isolated unit testing
    model = new GridModel(3, 3);
  });

  describe("Match Detection", () => {
    it("should detect a horizontal match", () => {
      // Setup: Manual horizontal match in the top row
      model.setTile(0, 0, 1);
      model.setTile(0, 1, 1);
      model.setTile(0, 2, 1);

      const matches = model.findMatches();

      expect(matches.length).toBe(3);
      expect(matches).toContainEqual({ row: 0, col: 0 });
      expect(matches).toContainEqual({ row: 0, col: 1 });
      expect(matches).toContainEqual({ row: 0, col: 2 });
    });

    it("should detect a vertical match", () => {
      // Setup: Manual vertical match in the middle column
      model.setTile(0, 1, 5);
      model.setTile(1, 1, 5);
      model.setTile(2, 1, 5);

      const matches = model.findMatches();

      expect(matches.length).toBe(3);
      expect(matches).toContainEqual({ row: 0, col: 1 });
      expect(matches).toContainEqual({ row: 1, col: 1 });
      expect(matches).toContainEqual({ row: 2, col: 1 });
    });
  });

  describe("Swap Mechanics", () => {
    it("should confirm a swap and keep changes if a match is created", () => {
      // Setup: Moving (1,0) to (0,0) completes a horizontal match of type '2'
      model.setTile(0, 0, 1); // Target position
      model.setTile(0, 1, 2);
      model.setTile(0, 2, 2);

      model.setTile(1, 0, 2); // The tile to be swapped up
      model.setTile(1, 1, 2);
      model.setTile(1, 2, 5);

      const swapSuccessful = model.trySwap(
        { row: 1, col: 0 },
        { row: 0, col: 0 },
      );

      expect(swapSuccessful).toBe(true);
      expect(model.getTile(0, 0)).toBe(2); // Value updated
      expect(model.getTile(1, 0)).toBe(1); // Values swapped
    });

    it("should revert a swap if no match is created", () => {
      // Setup: Two different tiles with no neighbors forming a match
      model.setTile(0, 0, 1);
      model.setTile(0, 1, 2);

      const swapSuccessful = model.trySwap(
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      );

      expect(swapSuccessful).toBe(false);
      expect(model.getTile(0, 0)).toBe(1); // Reverted to original
      expect(model.getTile(0, 1)).toBe(2); // Reverted to original
    });
  });

  describe("Grid Lifecycle (Clear, Gravity, Refill)", () => {
    it("should set matched tiles to -1 when cleared", () => {
      model.setTile(0, 0, 1);
      model.setTile(0, 1, 1);
      model.setTile(0, 2, 1);

      const matches = model.findMatches();
      model.clearMatches(matches);

      expect(model.getTile(0, 0)).toBe(-1);
      expect(model.getTile(0, 1)).toBe(-1);
      expect(model.getTile(0, 2)).toBe(-1);
    });

    it("should update internal grid state when gravity steps are executed", () => {
      // Setup: A tile at (0,0) sits above an empty slot at (1,0)
      model.setTile(0, 0, 7);
      model.setTile(1, 0, -1);
      model.setTile(2, 0, 8);

      const plan = model.stepGravity();

      // Check if plan contains the move
      expect(plan.moves).toContainEqual(
        expect.objectContaining({
          fromRow: 0,
          toRow: 1,
          col: 0,
        }),
      );

      // Check if model internal state updated
      expect(model.getTile(1, 0)).toBe(7);
      expect(model.getTile(0, 0)).toBe(-1);
    });

    it("should refill empty slots with valid tile IDs", () => {
      // Setup: Entire grid is empty
      model.reset();

      const emptySlots = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];

      model.refill(emptySlots);

      expect(model.getTile(0, 0)).toBeGreaterThanOrEqual(0);
      expect(model.getTile(0, 1)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Board Generation", () => {
    it("should generate a full grid with no initial matches", () => {
      model.generate();

      // Ensure no tiles are -1
      const raw = model.getRawGrid();
      raw.forEach((row) => {
        row.forEach((tile) => expect(tile).toBeGreaterThanOrEqual(0));
      });

      // Ensure no accidental matches at start
      const matches = model.findMatches();
      expect(matches.length).toBe(0);
    });
  });
});
