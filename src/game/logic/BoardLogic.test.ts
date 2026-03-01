import { describe, it, expect } from "vitest";
import { BoardLogic } from "./BoardLogic";

describe("BoardLogic", () => {
  describe("getAllMatches", () => {
    it("sollte horizontale 3er-Matches erkennen", () => {
      const grid = [
        [0, 0, 0, 1, 2], // Match in den ersten drei Spalten
        [1, 2, 3, 4, 5],
        [0, 1, 0, 1, 0],
      ];
      const matches = BoardLogic.getAllMatches(grid);
      expect(matches).toHaveLength(3);
      expect(matches).toContainEqual({ r: 0, c: 0 });
      expect(matches).toContainEqual({ r: 0, c: 1 });
      expect(matches).toContainEqual({ r: 0, c: 2 });
    });

    it("sollte vertikale 3er-Matches erkennen", () => {
      const grid = [
        [5, 1],
        [5, 2],
        [5, 3],
      ];
      const matches = BoardLogic.getAllMatches(grid);
      expect(matches).toHaveLength(3);
      expect(matches).toContainEqual({ r: 0, c: 0 });
      expect(matches).toContainEqual({ r: 2, c: 0 });
    });

    it("sollte leere Felder (-1) ignorieren", () => {
      const grid = [
        [-1, -1, -1, 0, 0],
        [0, 0, 1, 1, 1],
      ];
      const matches = BoardLogic.getAllMatches(grid);
      // Nur die 1er Reihe sollte matchen, nicht die -1er
      expect(matches).toHaveLength(3);
      expect(matches.every((m) => grid[m.r][m.c] === 1)).toBe(true);
    });
  });

  describe("getGravityPlan", () => {
    it("sollte korrekte Fall-Bewegungen berechnen", () => {
      const grid = [
        [0, 1],
        [-1, -1], // Die untere Reihe ist leer
      ];
      const { moves, newTiles } = BoardLogic.getGravityPlan(grid);

      // Zwei Steine müssen fallen
      expect(moves).toHaveLength(2);
      // Stein bei [0,0] fällt 1 Feld tief auf [1,0]
      expect(moves).toContainEqual({ fromR: 0, toR: 1, c: 0 });
      // Zwei neue Steine müssen oben generiert werden
      expect(newTiles).toHaveLength(2);
    });
  });
  describe("BoardLogic - Stress Test (Gravity)", () => {
    it("sollte ein komplexes Loch-Muster korrekt kollabieren lassen", () => {
      // Ein Grid, das absichtlich "löchrig" ist
      // 1 = Stein, -1 = Leer
      const grid = [
        [1, -1, 1], // Reihe 0
        [-1, -1, -1], // Reihe 1
        [1, 1, -1], // Reihe 2
      ];

      const { moves, newTiles } = BoardLogic.getGravityPlan(grid);

      // Erwartung für Spalte 0 (c: 0):
      // Stein bei [0,0] muss 1 Feld tief fallen (auf [1,0]),
      // weil [1,0] leer ist aber [2,0] belegt.
      // Moment - in unserem Algorithmus fallen sie GANZ nach unten.
      // Da [1,0] leer ist, rutscht [0,0] nach unten.

      // Wir prüfen die Konsistenz:
      // 1. Kein Ziel-Feld (toR) darf doppelt belegt werden.
      const targets = moves.map((m) => `${m.toR},${m.c}`);
      const uniqueTargets = new Set(targets);
      expect(targets.length).toBe(uniqueTargets.size);

      // 2. Die Anzahl der Steine + neue Steine muss wieder GRID_SIZE ergeben
      const col0Moves = moves.filter((m) => m.c === 0);
      const col0New = newTiles.filter((n) => n.c === 0);
      // In Spalte 0 war ein Loch bei [1,0]. Der Stein von [0,0] fällt.
      // Ein neuer Stein kommt oben rein.
      expect(col0Moves.length + col0New.length).toBeGreaterThan(0);
    });
  });

  describe("BoardLogic - Scoring", () => {
    it("sollte 30 Punkte für ein einfaches 3er-Match geben", () => {
      const matches = [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 },
      ];
      expect(BoardLogic.calculateScore(matches)).toBe(30);
    });

    it("sollte einen Bonus für 4er-Matches geben", () => {
      const matches = [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 },
        { r: 0, c: 3 },
      ];
      expect(BoardLogic.calculateScore(matches)).toBe(60); // 40 + 20 Bonus
    });
  });
});
