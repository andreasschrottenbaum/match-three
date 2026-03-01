import { Scene } from "phaser";
import { BoardLogic } from "../logic/BoardLogic";

const TILE_TYPES = ["💎", "🍎", "🍇", "🌟", "🧡", "🍀"];
const GRID_SIZE = 8;
const TILE_SIZE = 64;

interface Tile {
  type: number;
  view: Phaser.GameObjects.Text;
}

export class MatchThree extends Scene {
  private board: (Tile | null)[][] = [];
  private isProcessing = false;
  private selectedTile: { r: number; c: number } | null = null;
  private score: number = 0;
  private comboMultiplier: number = 1;
  private scoreText!: Phaser.GameObjects.Text;

  create() {
    this.setupBoard();
    this.setupInput();

    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "32px",
      color: "#ffffff",
      fontStyle: "bold",
    });
  }

  private setupBoard() {
    for (let r = 0; r < GRID_SIZE; r++) {
      this.board[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        this.board[r][c] = this.spawnTile(
          r,
          c,
          Math.floor(Math.random() * TILE_TYPES.length),
        );
      }
    }
    this.cleanInitialBoard();
  }

  private spawnTile(r: number, c: number, type: number, yOffset = 0): Tile {
    const pos = this.getTilePos(r, c);
    const view = this.add
      .text(pos.x, pos.y - yOffset, TILE_TYPES[type], { fontSize: "52px" })
      .setOrigin(0.5)
      .setInteractive();

    view.setData("row", r).setData("col", c);
    view.on("pointerdown", () => {
      if (!this.isProcessing)
        this.selectedTile = { r: view.getData("row"), c: view.getData("col") };
    });

    return { type, view };
  }

  private cleanInitialBoard() {
    let matches = BoardLogic.getAllMatches(this.getNumericGrid());
    while (matches.length > 0) {
      matches.forEach((m) => {
        const newType = Math.floor(Math.random() * TILE_TYPES.length);
        this.board[m.r][m.c]!.type = newType;
        this.board[m.r][m.c]!.view.setText(TILE_TYPES[newType]);
      });
      matches = BoardLogic.getAllMatches(this.getNumericGrid());
    }
  }

  private swapTiles(
    r1: number,
    c1: number,
    r2: number,
    c2: number,
    isReverting = false,
  ) {
    this.isProcessing = true;
    const t1 = this.board[r1][c1]!;
    const t2 = this.board[r2][c2]!;

    this.board[r1][c1] = t2;
    this.board[r2][c2] = t1;

    if (!isReverting) {
      this.comboMultiplier = 1;
    }

    [t1, t2].forEach((t) => {
      const r = t === t1 ? r2 : r1;
      const c = t === t1 ? c2 : c1;
      t.view.setData("row", r).setData("col", c);
      this.tweens.add({
        targets: t.view,
        ...this.getTilePos(r, c),
        duration: 300,
        onComplete: () => {
          if (t === t2) {
            // Nur einmal triggern
            if (
              !isReverting &&
              BoardLogic.getAllMatches(this.getNumericGrid()).length > 0
            ) {
              this.handleMatches();
            } else if (!isReverting) {
              this.swapTiles(r1, c1, r2, c2, true);
            } else {
              this.isProcessing = false;
            }
          }
        },
      });
    });
  }

  private handleMatches() {
    const matches = BoardLogic.getAllMatches(this.getNumericGrid());
    if (matches.length === 0) {
      this.comboMultiplier = 1; // Sicherheitshalber resetten
      return;
    }

    // Punkte berechnen und UI updaten
    const points = BoardLogic.calculateScore(matches, this.comboMultiplier);
    this.score += points;
    this.updateScoreUI(points); // Hilfsfunktion für Effekte

    // Kleiner visueller Effekt für den Score-Zuwachs
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.2,
      duration: 100,
      yoyo: true,
    });

    matches.forEach((m) => {
      const tile = this.board[m.r][m.c];
      if (tile) {
        this.tweens.add({
          targets: tile.view,
          scale: 0,
          alpha: 0,
          duration: 200,
          onComplete: () => tile.view.destroy(),
        });
        this.board[m.r][m.c] = null;
      }
    });

    this.time.delayedCall(250, () => {
      this.comboMultiplier++; // Combo erhöhen für die nächste Welle (applyGravity)
      this.applyGravity();
    });
  }

  private applyGravity() {
    const { moves, newTiles } = BoardLogic.getGravityPlan(
      this.getNumericGrid(),
    );
    let maxDelay = 0;

    moves.forEach((m) => {
      const tile = this.board[m.fromR][m.c]!;
      this.board[m.toR][m.c] = tile;
      this.board[m.fromR][m.c] = null;
      tile.view.setData("row", m.toR);

      const duration = (m.toR - m.fromR) * 100;
      maxDelay = Math.max(maxDelay, duration);
      this.tweens.add({
        targets: tile.view,
        y: this.getTilePos(m.toR, m.c).y,
        duration,
        ease: "Bounce.easeOut",
      });
    });

    newTiles.forEach((n) => {
      const type = Math.floor(Math.random() * TILE_TYPES.length);
      const tile = this.spawnTile(n.r, n.c, type, 300);
      this.board[n.r][n.c] = tile;
      this.tweens.add({
        targets: tile.view,
        y: this.getTilePos(n.r, n.c).y,
        duration: 500,
        ease: "Bounce.easeOut",
      });
      maxDelay = Math.max(maxDelay, 500);
    });

    this.time.delayedCall(maxDelay + 100, () => {
      const nextMatches = BoardLogic.getAllMatches(this.getNumericGrid());

      if (nextMatches.length > 0) {
        this.handleMatches();
      } else {
        // Keine weiteren Matches? Prüfen, ob der Spieler noch ziehen kann
        if (!BoardLogic.hasValidMoves(this.getNumericGrid())) {
          this.shuffleBoard();
        } else {
          this.isProcessing = false;
        }
      }
    });
  }

  private shuffleBoard() {
    this.isProcessing = true;
    console.log("No moves left! Shuffling...");

    // Alle Typen einsammeln
    const allTypes = this.board.flat().map((t) => t?.type || 0);

    // Einfacher Shuffle-Algorithmus (Fisher-Yates)
    for (let i = allTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTypes[i], allTypes[j]] = [allTypes[j], allTypes[i]];
    }

    // Board neu belegen und animieren
    let index = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = this.board[r][c]!;
        tile.type = allTypes[index++];
        tile.view.setText(TILE_TYPES[tile.type]);

        // Kleiner "Wirbel"-Effekt
        this.tweens.add({
          targets: tile.view,
          scale: 1.2,
          duration: 200,
          yoyo: true,
          delay: (r * GRID_SIZE + c) * 10,
        });
      }
    }

    // Nach dem Shuffle erneut prüfen (Rekursion verhindern durch Sicherheitstimer)
    this.time.delayedCall(1000, () => {
      if (!BoardLogic.hasValidMoves(this.getNumericGrid())) {
        this.shuffleBoard(); // Falls durch Zufall wieder kein Zug möglich ist
      } else {
        this.isProcessing = false;
      }
    });
  }

  private getNumericGrid(): number[][] {
    return this.board.map((row) => row.map((t) => (t ? t.type : -1)));
  }

  private getTilePos(r: number, c: number) {
    const startX = (this.cameras.main.width - GRID_SIZE * TILE_SIZE) / 2;
    const startY = (this.cameras.main.height - GRID_SIZE * TILE_SIZE) / 2;
    return {
      x: startX + c * TILE_SIZE + TILE_SIZE / 2,
      y: startY + r * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  private setupInput() {
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.selectedTile || this.isProcessing) return;
      const { r, c } = this.selectedTile;
      const view = this.board[r][c]?.view;
      if (!view) return;
      const dx = p.x - view.x;
      const dy = p.y - view.y;
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        const tr = Math.abs(dx) > Math.abs(dy) ? r : dy > 0 ? r + 1 : r - 1;
        const tc = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? c + 1 : c - 1) : c;
        if (tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE)
          this.swapTiles(r, c, tr, tc);
      }
      this.selectedTile = null;
    });
  }

  private updateScoreUI(addedPoints: number) {
    this.scoreText.setText(`Score: ${this.score}`);

    console.log(addedPoints);

    // Visuelles Feedback für Combos
    if (this.comboMultiplier > 1) {
      const comboText = this.add
        .text(400, 100, `Combo x${this.comboMultiplier}!`, {
          fontSize: "48px",
          color: "#ffcc00",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      this.tweens.add({
        targets: comboText,
        y: 50,
        alpha: 0,
        duration: 800,
        onComplete: () => comboText.destroy(),
      });
    }
  }
}
