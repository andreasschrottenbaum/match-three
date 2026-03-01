export type Grid = number[][];

export interface MatchPos {
  r: number;
  c: number;
}
export interface Move {
  fromR: number;
  toR: number;
  c: number;
}
export interface NewTile {
  r: number;
  c: number;
}

export class BoardLogic {
  static getAllMatches(grid: Grid): MatchPos[] {
    const matches: MatchPos[] = [];
    const rows = grid.length;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols - 2; c++) {
        const type = grid[r][c];
        if (type !== -1 && type === grid[r][c + 1] && type === grid[r][c + 2]) {
          matches.push({ r, c }, { r, c: c + 1 }, { r, c: c + 2 });
        }
      }
    }

    for (let r = 0; r < rows - 2; r++) {
      for (let c = 0; c < cols; c++) {
        const type = grid[r][c];
        if (type !== -1 && type === grid[r + 1][c] && type === grid[r + 2][c]) {
          matches.push({ r, c }, { r: r + 1, c }, { r: r + 2, c });
        }
      }
    }

    return matches.filter(
      (v, i, a) => a.findIndex((t) => t.r === v.r && t.c === v.c) === i,
    );
  }

  static getGravityPlan(grid: Grid): { moves: Move[]; newTiles: NewTile[] } {
    const moves: Move[] = [];
    const newTiles: NewTile[] = [];
    const rows = grid.length;
    const cols = grid[0].length;

    for (let c = 0; c < cols; c++) {
      let emptySpaces = 0;
      for (let r = rows - 1; r >= 0; r--) {
        if (grid[r][c] === -1) {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          moves.push({ fromR: r, toR: r + emptySpaces, c });
        }
      }
      for (let i = 0; i < emptySpaces; i++) {
        newTiles.push({ r: i, c });
      }
    }
    return { moves, newTiles };
  }

  static calculateScore(matches: MatchPos[]): number {
    const basePointsPerTile = 10;
    const count = matches.length;

    if (count === 0) return 0;

    // Bonus-Logik: Mehr als 3 Steine geben exponentiell mehr Punkte
    // 3 Steine = 30
    // 4 Steine = 40 + Bonus 20 = 60
    // 5 Steine = 50 + Bonus 50 = 100
    let bonus = 0;
    if (count === 4) bonus = 20;
    if (count >= 5) bonus = 50;

    return count * basePointsPerTile + bonus;
  }
}
