import { Scene } from "phaser";

const TILE_TYPES = ["💎", "🍎", "🍇", "🌟", "🧡", "🍀"];
const GRID_SIZE = 8;
const TILE_SIZE = 64;

interface Tile {
  type: number;
  view: Phaser.GameObjects.Text;
}

export class MatchThree extends Scene {
  private board: Tile[][] = [];
  private selectedTile: { r: number; c: number } | null = null;
  private isProcessing: boolean = false; // Verhindert Eingaben während Animationen

  constructor() {
    super("MatchThree");
  }

  create() {
    this.setupBoard();
    this.setupInput();
  }

  private setupBoard() {
    this.board = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      this.board[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const typeIndex = Math.floor(Math.random() * TILE_TYPES.length);
        const pos = this.getTilePosition(r, c);

        const textObj = this.add
          .text(pos.x, pos.y, TILE_TYPES[typeIndex], { fontSize: "40px" })
          .setOrigin(0.5)
          .setInteractive();

        // Wichtig: r und c an das Objekt binden für den Klick
        textObj.setData("row", r);
        textObj.setData("col", c);

        textObj.on("pointerdown", () => {
          if (this.isProcessing) return;
          this.selectedTile = { r, c };
        });

        this.board[r][c] = { type: typeIndex, view: textObj };
      }
    }

    // Board bereinigen (Start ohne Matches)
    this.resolveStartingMatches();
  }

  private resolveStartingMatches() {
    let matches = this.getAllMatches();
    while (matches.length > 0) {
      matches.forEach((m) => {
        const newType = Math.floor(Math.random() * TILE_TYPES.length);
        this.board[m.r][m.c].type = newType;
        this.board[m.r][m.c].view.setText(TILE_TYPES[newType]);
      });
      matches = this.getAllMatches();
    }
  }

  private setupInput() {
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.selectedTile || this.isProcessing) return;

      const { r, c } = this.selectedTile;
      const tileView = this.board[r][c].view;
      const dx = pointer.x - tileView.x;
      const dy = pointer.y - tileView.y;
      const threshold = 20;

      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        let targetR = r;
        let targetC = c;

        if (Math.abs(dx) > Math.abs(dy)) {
          targetC = dx > 0 ? c + 1 : c - 1;
        } else {
          targetR = dy > 0 ? r + 1 : r - 1;
        }

        if (
          targetR >= 0 &&
          targetR < GRID_SIZE &&
          targetC >= 0 &&
          targetC < GRID_SIZE
        ) {
          this.swapTiles(r, c, targetR, targetC);
        }
      }
      this.selectedTile = null;
    });
  }

  private getBoardStartPos() {
    return {
      x: (this.cameras.main.width - GRID_SIZE * TILE_SIZE) / 2,
      y: (this.cameras.main.height - GRID_SIZE * TILE_SIZE) / 2,
    };
  }

  private getTilePosition(r: number, c: number) {
    const start = this.getBoardStartPos();
    return {
      x: start.x + c * TILE_SIZE + TILE_SIZE / 2,
      y: start.y + r * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  private swapTiles(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
    isReverting: boolean = false,
  ) {
    this.isProcessing = true;
    const tile1 = this.board[r1][c1];
    const tile2 = this.board[r2][c2];

    // Logischer Tausch im Array
    this.board[r1][c1] = tile2;
    this.board[r2][c2] = tile1;

    const pos1 = this.getTilePosition(r1, c1);
    const pos2 = this.getTilePosition(r2, c2);

    // Animation tile1
    this.tweens.add({
      targets: tile1.view,
      x: pos2.x,
      y: pos2.y,
      duration: 300,
      ease: "Power2",
    });

    // Animation tile2
    this.tweens.add({
      targets: tile2.view,
      x: pos1.x,
      y: pos1.y,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        if (!isReverting) {
          const matches = this.getAllMatches();
          if (matches.length > 0) {
            this.handleMatches(matches);
          } else {
            // Kein Match? Zurücktauschen!
            this.swapTiles(r1, c1, r2, c2, true);
          }
        } else {
          this.isProcessing = false;
        }
      },
    });
  }

  private handleMatches(matches: { r: number; c: number }[]) {
    matches.forEach((m) => {
      const tile = this.board[m.r][m.c];
      if (!tile) return;

      this.tweens.add({
        targets: tile.view,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          tile.view.destroy();
        },
      });
      tile.type = -1; // Logisch leer
    });

    this.time.delayedCall(300, () => {
      this.applyGravity();
    });
  }

  private applyGravity() {
    let longestFall = 0;

    // Wir gehen Spalte für Spalte durch
    for (let c = 0; c < GRID_SIZE; c++) {
      let emptySpaces = 0;

      // Wir scannen von unten (GRID_SIZE - 1) nach oben (0)
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (this.board[r][c].type === -1) {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          // Ein Stein über einer Lücke gefunden!
          const tile = this.board[r][c];
          const targetR = r + emptySpaces;

          // Logischer Umzug im Array
          this.board[targetR][c] = tile;
          this.board[r][c] = { type: -1, view: null as any };

          // Visueller Fall (Animation)
          const newPos = this.getTilePosition(targetR, c);
          const fallDuration = emptySpaces * 100; // Je tiefer er fällt, desto länger dauert es
          longestFall = Math.max(longestFall, fallDuration);

          this.tweens.add({
            targets: tile.view,
            y: newPos.y,
            duration: fallDuration,
            ease: "Bounce.easeOut", // Ein kleiner Hopser beim Aufprall
          });
        }
      }

      // Neue Steine oben nachfüllen
      for (let i = 0; i < emptySpaces; i++) {
        const row = emptySpaces - 1 - i;
        const typeIndex = Math.floor(Math.random() * TILE_TYPES.length);
        const pos = this.getTilePosition(row, c);

        // Wir starten den Stein oberhalb des sichtbaren Bereichs
        const startY = pos.y - emptySpaces * TILE_SIZE;

        const textObj = this.add
          .text(pos.x, startY, TILE_TYPES[typeIndex], { fontSize: "40px" })
          .setOrigin(0.5)
          .setInteractive()
          .setAlpha(0); // Startet unsichtbar

        textObj.on("pointerdown", () => {
          if (this.isProcessing) return;
          this.selectedTile = { r: row, c };
        });

        this.board[row][c] = { type: typeIndex, view: textObj };

        this.tweens.add({
          targets: textObj,
          y: pos.y,
          alpha: 1,
          duration: emptySpaces * 150,
          ease: "Bounce.easeOut",
        });
      }
    }

    // Wenn alles gefallen ist, prüfen wir, ob durch das Nachrücken neue Matches entstanden sind
    this.time.delayedCall(longestFall + 200, () => {
      const nextMatches = this.getAllMatches();
      if (nextMatches.length > 0) {
        this.handleMatches(nextMatches); // Kettenreaktion!
      } else {
        this.isProcessing = false; // Spielzug beendet
      }
    });
  }

  private getAllMatches(): { r: number; c: number }[] {
    const matches: { r: number; c: number }[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const type1 = this.board[r][c].type;
        if (type1 === -1) continue;
        if (
          type1 === this.board[r][c + 1].type &&
          type1 === this.board[r][c + 2].type
        ) {
          matches.push({ r, c }, { r, c: c + 1 }, { r, c: c + 2 });
        }
      }
    }
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const type1 = this.board[r][c].type;
        if (type1 === -1) continue;
        if (
          type1 === this.board[r + 1][c].type &&
          type1 === this.board[r + 2][c].type
        ) {
          matches.push({ r, c }, { r: r + 1, c }, { r: r + 2, c });
        }
      }
    }
    return matches.filter(
      (v, i, a) => a.findIndex((t) => t.r === v.r && t.c === v.c) === i,
    );
  }
}
