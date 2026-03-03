import { Scene } from "phaser";
import { BoardLogic } from "../logic/BoardLogic";
import { ScoreManager } from "../entities/ScoreManager";
import { InputManager } from "../events/InputManager";
import { BoardManager } from "../entities/BoardManager";
import { GridUtils } from "../logic/GridUtils";
import { GameOverOverlay } from "../ui/GameOverOverlay";

/**
 * Main game scene that orchestrates managers and game flow.
 */
export class MatchThree extends Scene {
  private readonly GRID_SIZE = 8;
  private readonly TYPE_COUNT = 12;
  private TILE_SIZE = 128;
  private offsetX = 0;
  private offsetY = 0;

  private scoreManager!: ScoreManager;
  private inputManager!: InputManager;
  private boardManager!: BoardManager;
  private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("ZenMatchThree");
  }

  /**
   * Pre-calculates layout dimensions.
   */
  init() {
    this.TILE_SIZE = (this.cameras.main.width * 0.8) / this.GRID_SIZE;
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
   * Loads the assets.
   */
  preload(): void {
    this.load.spritesheet("tiles", "assets/spritesheet.png", {
      frameWidth: 185,
      frameHeight: 185,
    });

    this.load.image("spark", "assets/spark.png");
  }

  /**
   * Initializes managers and starts the board generation.
   */
  create(): void {
    this.scoreManager = new ScoreManager(this);
    this.setupParticles();

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
        onMatchExplode: (x, y) => this.emitter.explode(10, x, y),
        onSequenceComplete: (hasMoves) => {
          if (!hasMoves) this.showGameOverUI();
          else this.inputManager.setEnabled(true);
        },
      },
    );

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

    this.setupBoard();
  }

  /**
   * Interface for InputManager to retrieve tiles from the board.
   */
  public getTileAt(row: number, col: number) {
    return this.boardManager.getTileAt(row, col);
  }

  /**
   * Handles the generation of a valid starting board.
   */
  private setupBoard(): void {
    let isValidStart = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;
    let numericGrid: number[][] = [];

    while (!isValidStart && attempts < MAX_ATTEMPTS) {
      attempts++;
      numericGrid = BoardLogic.createRandomGrid(
        this.GRID_SIZE,
        this.GRID_SIZE,
        this.TYPE_COUNT,
        () => Phaser.Math.RND.frac(),
      );
      if (BoardLogic.hasValidMoves(numericGrid)) {
        isValidStart = true;
      }
    }

    this.boardManager.createVisualBoard(numericGrid);
    this.resolveInitialMatches();
  }

  /**
   * Cleans up any matches that exist at game start.
   */
  private resolveInitialMatches(): void {
    let numericGrid = this.boardManager.getNumericGrid();
    let matches = BoardLogic.getAllMatches(numericGrid);

    while (matches.length > 0) {
      matches.forEach((pos) => {
        const newID = Math.floor(Phaser.Math.RND.frac() * this.TYPE_COUNT);
        this.boardManager.getTileAt(pos.row, pos.col)?.updateVisual(newID);
      });
      numericGrid = this.boardManager.getNumericGrid();
      matches = BoardLogic.getAllMatches(numericGrid);
    }
  }

  /**
   * Shows the game over screen.
   */
  private showGameOverUI(): void {
    new GameOverOverlay(this, this.scoreManager.currentScore, () =>
      this.scene.restart(),
    );
  }

  /**
   * Configures the particle emitter for match effects.
   */
  private setupParticles(): void {
    this.emitter = this.add.particles(0, 0, "spark", {
      speed: { min: 80, max: 200 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      gravityY: 300,
      rotate: { min: 0, max: 360 },
      blendMode: "ADD",
      emitting: false,
    });
  }
}
