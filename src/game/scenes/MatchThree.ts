import { Scene, Math as PMath } from "phaser";
import { BoardLogic } from "../logic/BoardLogic";
import { ScoreManager } from "../entities/ScoreManager";
import { InputManager } from "../events/InputManager";
import { BoardManager } from "../entities/BoardManager";
import { GridUtils } from "../logic/GridUtils";
import { GameOverOverlay } from "../ui/GameOverOverlay";
import { GameConfig } from "../config/GameConfig";
import { SettingsOverlay } from "../ui/SettingsOverlay";
import { UIUtils } from "../ui/UIUtils";
import Constants from "../config/Constants";
import { Manager } from "../types";

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
  private isResizing = false;

  private shuffleCharges!: number;
  private shuffleButton!: Phaser.GameObjects.Container;
  private shuffleText!: Phaser.GameObjects.Text;
  private settingsButton!: Phaser.GameObjects.Container;

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
    this.shuffleCharges = GameConfig.shuffleCharges;
    this.calculateLayout();
  }

  /**
   * Loads necessary visual assets.
   */
  preload(): void {
    this.load.spritesheet("tiles", "assets/spritesheet.png", {
      frameWidth: Constants.SPRITE_SIZE,
      frameHeight: Constants.SPRITE_SIZE,
    });
    this.load.image("spark", "assets/spark.png");
    this.load.font("FreckleFace", "./assets/fonts/FreckleFace-Regular.ttf");
  }

  /**
   * Bootstraps the game managers and the initial board state.
   */
  create(): void {
    this.cameras.main.setSize(this.scale.width, this.scale.height);
    this.calculateLayout();

    const managers: Manager[] = [];

    // 1. Score Management
    this.scoreManager = new ScoreManager(this);
    managers.push(this.scoreManager);

    // 2. Board Management
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
    managers.push(this.boardManager);

    // 3. Input Management
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
    managers.push(this.inputManager);

    // Initial Layout Sync
    this.boardManager.updateLayout(this.TILE_SIZE, this.offsetX, this.offsetY);
    this.inputManager.updateLayout(this.TILE_SIZE, this.offsetX, this.offsetY);

    // Visual Setup
    this.setupParticles();
    this.setupBoard();
    this.createUI();

    // Lifecycle: Cleanup on shutdown
    this.events.once("shutdown", () => {
      managers.forEach((manager) => manager.destroy());
    });

    // Handle Window Resizing
    this.scale.on("resize", () => {
      if (this.isResizing) return;

      this.isResizing = true;
      this.inputManager.setEnabled(false);

      this.time.delayedCall(150, () => {
        this.scale.refresh();
        this.calculateLayout();

        if (
          this.cameras.main.width !== this.scale.width ||
          this.cameras.main.height !== this.scale.height
        ) {
          this.cameras.main.setSize(this.scale.width, this.scale.height);
        }

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

        this.isResizing = false;
        this.inputManager.setEnabled(true);
      });
    });
  }

  /**
   * Calculates the positioning of the Game Grid.
   */
  private calculateLayout(): void {
    const { width, height } = this.scale;

    const verticalPadding = 200;
    const horizontalPadding = 40;

    const availableWidth = width - horizontalPadding;
    const availableHeight = height - verticalPadding;

    const maxTileW = availableWidth / this.GRID_SIZE;
    const maxTileH = availableHeight / this.GRID_SIZE;

    this.TILE_SIZE = Math.min(maxTileW, maxTileH);
    this.GRID_SIZE = GameConfig.grid.size;
    this.TYPE_COUNT = GameConfig.grid.variety;

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
   * Initializes UI elements using UIUtils for visual consistency.
   */
  private createUI(): void {
    // Shuffle Button
    this.shuffleButton = UIUtils.createButton(
      this,
      0,
      0,
      `SHUFFLE (${this.shuffleCharges})`,
      () => this.handleShuffle(),
    );

    // Extract text reference from container to update charges later
    this.shuffleText = this.shuffleButton.list.find(
      (obj) => obj instanceof Phaser.GameObjects.Text,
    ) as Phaser.GameObjects.Text;

    // Settings Button
    this.settingsButton = UIUtils.createButton(this, 0, 0, "⚙", () => {
      if (this.inputManager.getEnabled()) {
        this.inputManager.setEnabled(false);
        new SettingsOverlay(this);
      }
    });

    this.repositionUI();
  }

  /**
   * Displays a rising text effect when a combo is achieved.
   */
  private showComboText(combo: number, x: number, y: number): void {
    const messages = ["GREAT!", "SUPER!", "FANTASTIC!", "UNBELIEVABLE!"];
    const msg = messages[PMath.Clamp(combo - 2, 0, messages.length - 1)];

    const text = UIUtils.addText(this, x, y, `${msg}\nx${combo}`, "48px")
      .setColor("#ffcc00")
      .setDepth(Constants.DEPTH_LAYERS.OVERLAY);

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
      console.warn("Could not create a valid board.");
    }

    this.inputManager.setEnabled(false);
    this.boardManager.createVisualBoard(numericGrid);
  }

  /**
   * Proxy method for the InputManager to access tiles from the board.
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
    this.emitter.setDepth(Constants.DEPTH_LAYERS.PARTICLES);
  }

  /**
   * Orchestrates the shuffle process if charges are available.
   */
  private handleShuffle(): void {
    if (this.shuffleCharges <= 0 || !this.inputManager.getEnabled()) return;

    this.shuffleCharges--;
    this.shuffleText.setText(`SHUFFLE (${this.shuffleCharges})`);

    this.inputManager.setEnabled(false);

    const currentGrid = this.boardManager.getNumericGrid();
    const shuffledGrid = BoardLogic.shuffleGrid(currentGrid, () =>
      PMath.RND.frac(),
    );

    this.boardManager.shuffleVisuals(shuffledGrid);

    this.time.delayedCall(500, () => {
      this.inputManager.setEnabled(true);
    });

    if (this.shuffleCharges === 0) {
      this.shuffleText.setColor("#666666");
      const bg = this.shuffleButton.list[0] as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(0x333333);
    }
  }

  /**
   * Re-Calculates the positioning after Resizing.
   */
  private repositionUI(): void {
    const { width, height } = this.scale;

    if (this.scoreManager && this.scoreManager.element) {
      this.scoreManager.element.setPosition(
        Constants.UI_MARGINS.SCORE,
        Constants.UI_MARGINS.SCORE,
      );
    }

    if (this.settingsButton) {
      this.settingsButton.setPosition(
        Constants.UI_MARGINS.SMALL_BTN,
        height - Constants.UI_MARGINS.BOTTOM,
      );
    }

    if (this.shuffleButton) {
      this.shuffleButton.setPosition(
        width - Constants.UI_MARGINS.SIDE,
        height - Constants.UI_MARGINS.BOTTOM,
      );
    }
  }
}
