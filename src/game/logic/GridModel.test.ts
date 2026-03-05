import { describe, it, expect, beforeEach } from "vitest";
import { GridModel } from "./GridModel";

describe("GridModel", () => {
  let model: GridModel;

  beforeEach(() => {
    // 3x3 Grid für einfache Tests
    model = new GridModel(3, 3);
  });

  it("should detect a horizontal match", () => {
    // Manuelles Setup eines Grids mit Match in der ersten Reihe
    model.setTile(0, 0, 1);
    model.setTile(0, 1, 1);
    model.setTile(0, 2, 1);

    const matches = model.findMatches();
    // Erwartet werden 3 Positionen
    expect(matches.length).toBe(3);
    expect(matches).toContainEqual({ row: 0, col: 0 });
    expect(matches).toContainEqual({ row: 0, col: 1 });
    expect(matches).toContainEqual({ row: 0, col: 2 });
  });

  it("should only swap and keep changes if a match is created", () => {
    // Setup: Ein Tausch von (1,0) nach (0,0) würde ein Match ergeben
    model.setTile(0, 0, 1); // Ziel
    model.setTile(0, 1, 2);
    model.setTile(0, 2, 2);

    model.setTile(1, 0, 2); // Das "Match-Tile"
    model.setTile(1, 1, 2);
    model.setTile(1, 2, 5);

    const swapSuccessful = model.trySwap(
      { row: 1, col: 0 },
      { row: 0, col: 0 },
    );

    expect(swapSuccessful).toBe(true);
    expect(model.getTile(0, 0)).toBe(2); // Tile wurde getauscht
  });

  it("should revert swap if no match is created", () => {
    model.setTile(0, 0, 1);
    model.setTile(0, 1, 2);

    const swapSuccessful = model.trySwap(
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    );

    expect(swapSuccessful).toBe(false);
    expect(model.getTile(0, 0)).toBe(1); // Wert ist wieder wie vorher
  });
});
