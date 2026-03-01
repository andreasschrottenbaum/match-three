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
  private isProcessing: boolean = false;

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
        this.board[r][c] = this.createTile(r, c, typeIndex);
      }
    }
    this.resolveStartingMatches();
  }

  // Hilfsfunktion zur Erstellung eines Steins (Zentralisiert die Logik)
  private createTile(
    r: number,
    c: number,
    typeIndex: number,
    startYOffset: number = 0,
  ): Tile {
    const pos = this.getTilePosition(r, c);
    const textObj = this.add
      .text(pos.x, pos.y - startYOffset, TILE_TYPES[typeIndex], {
        fontSize: "40px",
      })
      .setOrigin(0.5)
      .setInteractive();

    // Wir speichern die Koordinaten direkt im GameObject
    textObj.setData("row", r);
    textObj.setData("col", c);

    // Der Listener liest IMMER die aktuellen Daten des Objekts
    textObj.on("pointerdown", () => {
      if (this.isProcessing) return;
      this.selectedTile = {
        r: textObj.getData("row"),
        c: textObj.getData("col"),
      };
    });

    return { type: typeIndex, view: textObj };
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
      const tile = this.board[r][c];
      if (!tile) return;

      const dx = pointer.x - tile.view.x;
      const dy = pointer.y - tile.view.y;
      const threshold = 25;

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

  private getTilePosition(r: number, c: number) {
    const startX = (this.cameras.main.width - GRID_SIZE * TILE_SIZE) / 2;
    const startY = (this.cameras.main.height - GRID_SIZE * TILE_SIZE) / 2;
    return {
      x: startX + c * TILE_SIZE + TILE_SIZE / 2,
      y: startY + r * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  private swapTiles(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
    isReverting = false,
  ) {
    this.isProcessing = true;
    const tile1 = this.board[r1][c1];
    const tile2 = this.board[r2][c2];

    // Array-Logik tauschen
    this.board[r1][c1] = tile2;
    this.board[r2][c2] = tile1;

    // Metadaten der Objekte synchronisieren!
    tile1.view.setData("row", r2);
    tile1.view.setData("col", c2);
    tile2.view.setData("row", r1);
    tile2.view.setData("col", c1);

    const pos1 = this.getTilePosition(r1, c1);
    const pos2 = this.getTilePosition(r2, c2);

    this.tweens.add({
      targets: tile1.view,
      x: pos2.x,
      y: pos2.y,
      duration: 300,
      ease: "Power2",
    });

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
        onComplete: () => tile.view.destroy(),
      });
      tile.type = -1;
    });

    this.time.delayedCall(300, () => this.applyGravity());
  }

  private applyGravity() {
    let longestFall = 0;

    for (let c = 0; c < GRID_SIZE; c++) {
      let emptySpaces = 0;

      // Von unten nach oben scannen
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        // Falls der Slot leer ist (entweder Typ -1 oder view zerstört)
        if (this.board[r][c].type === -1) {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          // Stein gefunden, der fallen muss
          const tile = this.board[r][c];
          const targetR = r + emptySpaces;

          // 1. Logik im Array sofort umziehen
          this.board[targetR][c] = tile;
          this.board[r][c] = { type: -1, view: null as any };

          // 2. Metadaten im View-Objekt sofort updaten
          tile.view.setData("row", targetR);

          // 3. Bestehende Animationen auf diesem Objekt stoppen (WICHTIG!)
          this.tweens.killTweensOf(tile.view);

          const newPos = this.getTilePosition(targetR, c);
          const duration = emptySpaces * 150;
          longestFall = Math.max(longestFall, duration);

          this.tweens.add({
            targets: tile.view,
            y: newPos.y,
            duration: duration,
            ease: "Bounce.easeOut",
          });
        }
      }

      // Neue Steine für diese Spalte generieren
      for (let i = 0; i < emptySpaces; i++) {
        const targetRow = emptySpaces - 1 - i;
        const typeIndex = Math.floor(Math.random() * TILE_TYPES.length);

        // Wir lassen sie von deutlich weiter oben reinregnen
        const fallDist = emptySpaces + 1;
        const newTile = this.createTile(
          targetRow,
          c,
          typeIndex,
          fallDist * TILE_SIZE,
        );
        newTile.view.setAlpha(0);

        this.board[targetRow][c] = newTile;

        this.tweens.add({
          targets: newTile.view,
          y: this.getTilePosition(targetRow, c).y,
          alpha: 1,
          duration: fallDist * 150,
          ease: "Bounce.easeOut",
        });

        longestFall = Math.max(longestFall, fallDist * 150);
      }
    }

    // Sicherheits-Check: Warte, bis alle Tweens sicher fertig sind
    this.time.delayedCall(longestFall + 100, () => {
      const nextMatches = this.getAllMatches();
      if (nextMatches.length > 0) {
        this.handleMatches(nextMatches);
      } else {
        this.isProcessing = false;
        // Kleiner Extra-Check: Falls wir noch irgendwo -1 haben, Schwerkraft erneut triggern
        if (this.hasEmptySlots()) {
          this.applyGravity();
        }
      }
    });
  }

  // Hilfsfunktion für den Sicherheits-Check
  private hasEmptySlots(): boolean {
    return this.board.some((row) => row.some((tile) => tile.type === -1));
  }

  private getAllMatches(): { r: number; c: number }[] {
    const matches: { r: number; c: number }[] = [];
    // ... (deine funktionierende Logik hier einfügen)
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const type1 = this.board[r][c].type;
        if (
          type1 !== -1 &&
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
        if (
          type1 !== -1 &&
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
