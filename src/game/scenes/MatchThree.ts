import { Scene, Math as PMath } from "phaser";
import { BoardLogic } from "../logic/BoardLogic";
import { ScoreManager } from "../entities/ScoreManager";
import { InputManager } from "../events/InputManager";
import { BoardManager } from "../entities/BoardManager";
import { GridUtils } from "../logic/GridUtils";
import { GameOverOverlay } from "../ui/GameOverOverlay";
import { GameConfig } from "../config/GameConfig";
import { SettingsOverlay } from "../ui/SettingsOverlay";

/**
 * Main game scene that orchestrates managers and game flow.
 * Handles the high-level game state and UI triggers.
 */
export class MatchThree extends Scene {
  private GRID_SIZE = GameConfig.grid.size;
  private TYPE_COUNT = GameConfig.grid.variety;

  private TILE_SIZE = 128;
  private offsetX = 0;
  private offsetY = 0;

  private shuffleCharges!: number;
  private shuffleButtonText!: Phaser.GameObjects.Text;
  private shuffleButtonContainer!: Phaser.GameObjects.Container;
  private settingsButton!: Phaser.GameObjects.Text;

  private scoreManager!: ScoreManager;
  private inputManager!: InputManager;
  private boardManager!: BoardManager;
  private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("ZenMatchThree");
  }

  /**
   * Initializes layout constants based on current screen dimensions.
   */
  init(): void {
    this.GRID_SIZE = GameConfig.grid.size;
    this.TYPE_COUNT = GameConfig.grid.variety;
    this.shuffleCharges = GameConfig.grid.shuffleCharges;

    const padding = 40;
    const uiHeight = 200;

    const maxTileW = (this.cameras.main.width - padding * 2) / this.GRID_SIZE;
    const maxTileH =
      (this.cameras.main.height - uiHeight - padding * 2) / this.GRID_SIZE;

    this.TILE_SIZE = Math.min(maxTileW, maxTileH);

    const offsets = GridUtils.getGridOffsets(
      this.cameras.main.width,
      this.cameras.main.height,
      this.GRID_SIZE,
      this.TILE_SIZE,
    );
    this.offsetX = offsets.x;
    this.offsetY = offsets.y;
  }

  /**
   * Loads necessary visual assets.
   */
  preload(): void {
    this.load.spritesheet("tiles", "assets/spritesheet.png", {
      frameWidth: 185,
      frameHeight: 185,
    });
    this.load.image("spark", "assets/spark.png");
  }

  /**
   * Bootstraps the game managers and the initial board state.
   */
  create(): void {
    this.calculateLayout();

    this.cameras.main.setSize(this.scale.width, this.scale.height);

    this.scoreManager = new ScoreManager(this);

    this.boardManager = new BoardManager(
      this,
      {
        gridSize: this.GRID_SIZE,
        tileSize: this.TILE_SIZE,
        typeCount: this.TYPE_COUNT,
        offsetX: this.offsetX,
        offsetY: this.offsetY,
      },
      {
        onScore: (pts, x, y) => this.scoreManager.addPoints(pts, x, y),
        onCombo: (combo, x, y) => this.showComboText(combo, x, y),
        onMatchExplode: (x, y) => this.emitter.explode(10, x, y),
        onSequenceComplete: (hasMoves) => {
          if (!hasMoves) this.showGameOverUI();
          else this.inputManager.setEnabled(true);
        },
      },
    );

    this.boardManager.updateLayout(this.TILE_SIZE, this.offsetX, this.offsetY);

    this.inputManager = new InputManager(
      this,
      {
        gridSize: this.GRID_SIZE,
        tileSize: this.TILE_SIZE,
        offsetX: this.offsetX,
        offsetY: this.offsetY,
      },
      (swipe) => {
        this.inputManager.setEnabled(false);
        const { row, col } = swipe.tile.gridPosition;
        this.boardManager.swapTiles(
          row,
          col,
          row + swipe.direction.row,
          col + swipe.direction.col,
        );
      },
    );
    this.inputManager.updateLayout(this.TILE_SIZE, this.offsetX, this.offsetY);

    this.setupParticles();
    this.setupBoard();
    this.createShuffleButton();
    this.createSettingsButton();

    this.scale.on("resize", () => {
      this.calculateLayout();
      this.cameras.main.setSize(this.scale.width, this.scale.height);

      // Managers update existing objects
      this.boardManager.updateLayout(
        this.TILE_SIZE,
        this.offsetX,
        this.offsetY,
      );
      this.inputManager.updateLayout(
        this.TILE_SIZE,
        this.offsetX,
        this.offsetY,
      );

      this.repositionUI();
    });
  }

  private calculateLayout(): void {
    const { width, height } = this.cameras.main;

    // Wir lassen Platz für UI (Score oben, Buttons unten)
    const verticalPadding = 200;
    const horizontalPadding = 40;

    const availableWidth = width - horizontalPadding;
    const availableHeight = height - verticalPadding;

    // TILE_SIZE so wählen, dass das Grid in BEIDE Richtungen passt
    const maxTileW = availableWidth / this.GRID_SIZE;
    const maxTileH = availableHeight / this.GRID_SIZE;

    this.TILE_SIZE = Math.min(maxTileW, maxTileH);

    // Zentrieren
    const offsets = GridUtils.getGridOffsets(
      width,
      height,
      this.GRID_SIZE,
      this.TILE_SIZE,
    );

    this.offsetX = offsets.x;
    this.offsetY = offsets.y;
  }

  /**
   * Displays a rising text effect when a combo is achieved.
   * @param combo - The current multiplier.
   * @param x - World X position.
   * @param y - World Y position.
   */
  private showComboText(combo: number, x: number, y: number): void {
    const messages = ["GREAT!", "SUPER!", "FANTASTIC!", "UNBELIEVABLE!"];
    const msg = messages[PMath.Clamp(combo - 2, 0, messages.length - 1)];

    const text = this.add
      .text(x, y, `${msg}\nx${combo}`, {
        fontSize: "48px",
        fontStyle: "bold",
        color: "#ffcc00",
        stroke: "#000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(2000);

    this.tweens.add({
      targets: text,
      y: y - 120,
      alpha: 0,
      scale: 1.4,
      duration: 1000,
      onComplete: () => text.destroy(),
    });
  }

  /**
   * Generates a valid initial board without matches and with available moves.
   */
  private setupBoard(): void {
    let numericGrid: number[][] = [];
    let isValidStart = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 200;

    while (!isValidStart && attempts < MAX_ATTEMPTS) {
      attempts++;
      numericGrid = BoardLogic.createRandomGrid(
        this.GRID_SIZE,
        this.GRID_SIZE,
        this.TYPE_COUNT,
        () => PMath.RND.frac(),
      );

      BoardLogic.resolveInitialMatchesInGrid(numericGrid, this.TYPE_COUNT, () =>
        PMath.RND.frac(),
      );

      if (BoardLogic.hasValidMoves(numericGrid)) {
        isValidStart = true;
      }
    }

    if (!isValidStart) {
      console.warn(
        "Could not create a valid board. Checking TYPE_COUNT/GRID_SIZE ratios.",
      );
    }

    this.boardManager.createVisualBoard(numericGrid);
  }

  /**
   * Proxy method for the InputManager to access tiles from the board.
   * @param row - Grid row.
   * @param col - Grid column.
   */
  public getTileAt(row: number, col: number) {
    return this.boardManager.getTileAt(row, col);
  }

  /**
   * Triggers the Game Over UI overlay.
   */
  private showGameOverUI(): void {
    new GameOverOverlay(this, this.scoreManager.currentScore, () =>
      this.scene.restart(),
    );
  }

  /**
   * Configures the particle emitter for explosion effects.
   */
  private setupParticles(): void {
    this.emitter = this.add.particles(0, 0, "spark", {
      speed: { min: 80, max: 200 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      emitting: false,
    });
  }

  /**
   * Creates a simple button to trigger the shuffle logic.
   */
  private createShuffleButton(): void {
    const x = this.cameras.main.width - 150;
    const y = this.cameras.main.height - 80;

    const btnBg = this.add
      .rectangle(0, 0, 200, 60, GameConfig.ui.baseColor)
      .setInteractive({ useHandCursor: true });
    this.shuffleButtonText = this.add
      .text(0, 0, `SHUFFLE (${this.shuffleCharges})`, {
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.shuffleButtonContainer = this.add.container(x, y, [
      btnBg,
      this.shuffleButtonText,
    ]);
    btnBg.on("pointerdown", () => this.handleShuffle());
  }

  /**
   * Orchestrates the shuffle process if charges are available.
   */
  private handleShuffle(): void {
    if (this.shuffleCharges <= 0 || !this.inputManager.getEnabled()) return;

    this.shuffleCharges--;
    this.shuffleButtonText.setText(`SHUFFLE (${this.shuffleCharges})`);

    this.inputManager.setEnabled(false);

    // 1. Logisches Grid holen und mischen
    const currentGrid = this.boardManager.getNumericGrid();
    const shuffledGrid = BoardLogic.shuffleGrid(currentGrid, () =>
      PMath.RND.frac(),
    );

    // 2. Visuell aktualisieren
    this.boardManager.shuffleVisuals(shuffledGrid);

    // 3. Kurz warten und Input wieder freigeben
    this.time.delayedCall(500, () => {
      this.inputManager.setEnabled(true);
    });

    if (this.shuffleCharges === 0) {
      this.shuffleButtonText.setColor("#666666");
    }
  }

  /**
   * Creates a simple button to toggle the Settings Menu.
   */
  private createSettingsButton(): void {
    this.settingsButton = this.add
      .text(50, this.cameras.main.height - 50, "⚙", {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.settingsButton.on("pointerdown", () => {
      this.inputManager.setEnabled(false);
      new SettingsOverlay(this);
    });
  }

  private repositionUI(): void {
    const { width, height } = this.cameras.main;

    // Move the whole container, not just the text
    if (this.shuffleButtonContainer) {
      this.shuffleButtonContainer.setPosition(width - 150, height - 80);
    }

    if (this.settingsButton) {
      this.settingsButton.setPosition(50, height - 50);
    }
  }
}
