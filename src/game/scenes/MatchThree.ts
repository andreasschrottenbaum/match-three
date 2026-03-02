import { Scene } from "phaser";
import { BoardLogic } from "../logic/BoardLogic";
import { GameTile } from "../entities/GameTile";
import type { TileID } from "../types";
import { ScoreManager } from "../entities/ScoreManager";

export class MatchThree extends Scene {
  /** The logical representation of the board using visual Tile objects */
  private board: (GameTile | null)[][] = [];

  /** Constants for the layout - could be moved to a config file later */
  private readonly GRID_SIZE = 8;
  private readonly TYPE_COUNT = 12;
  private TILE_SIZE = 128;

  private scoreManager!: ScoreManager;

  private selectedTile: GameTile | null = null;
  private isProcessing: boolean = false;
  private comboMultiplier: number = 1;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("ZenMatchThree");
  }

  init() {
    this.TILE_SIZE = (this.cameras.main.width * 0.8) / this.GRID_SIZE;
  }

  preload(): void {
    this.load.spritesheet("tiles", "assets/spritesheet.png", {
      frameWidth: 185,
      frameHeight: 185,
    });

    this.load.image("spark", "assets/spark.png");
  }

  create(): void {
    this.setupBoard();
    this.setupInput();
    this.scoreManager = new ScoreManager(this);

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

  /**
   * Initializes the grid with a guaranteed playable start.
   */
  private setupBoard(): void {
    let isValidStart = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;

    this.board.forEach((row) => row.forEach((tile) => tile?.destroy()));
    this.board = [];

    while (!isValidStart && attempts < MAX_ATTEMPTS) {
      attempts++;

      const numericGrid = BoardLogic.createRandomGrid(
        this.GRID_SIZE,
        this.GRID_SIZE,
        this.TYPE_COUNT,
        () => Phaser.Math.RND.frac(),
      );

      if (BoardLogic.hasValidMoves(numericGrid)) {
        isValidStart = true;
        this.createVisualBoard(numericGrid);
      }
    }

    if (!isValidStart) {
      console.warn("Could not generate board after 100 attempts");

      this.createVisualBoard(
        BoardLogic.createRandomGrid(
          this.GRID_SIZE,
          this.GRID_SIZE,
          this.TYPE_COUNT,
          () => 0.5,
        ),
      );
    }

    this.resolveInitialMatches();
  }

  /**
   * Instantiates the GameTile objects.
   */
  private createVisualBoard(numericGrid: number[][]): void {
    for (let row = 0; row < this.GRID_SIZE; row++) {
      this.board[row] = [];
      for (let col = 0; col < this.GRID_SIZE; col++) {
        const worldPos = this.getTileWorldPosition(row, col);
        this.board[row][col] = new GameTile(
          this,
          worldPos.x,
          worldPos.y,
          numericGrid[row][col],
          row,
          col,
          this.TILE_SIZE,
        );
      }
    }
  }

  /**
   * Calculates the pixel position for a given grid coordinate.
   */
  private getTileWorldPosition(
    row: number,
    col: number,
  ): { x: number; y: number } {
    const startX =
      (this.cameras.main.width - this.GRID_SIZE * this.TILE_SIZE) / 2;
    const startY =
      (this.cameras.main.height - this.GRID_SIZE * this.TILE_SIZE) / 2;

    return {
      x: startX + col * this.TILE_SIZE + this.TILE_SIZE / 2,
      y: startY + row * this.TILE_SIZE + this.TILE_SIZE / 2,
    };
  }

  /**
   * Ensures the starting board has no pre-existing matches.
   * It repeatedly replaces matched tiles with new random ones until the board is "clean".
   */
  private resolveInitialMatches(): void {
    let numericGrid = this.getNumericGrid();
    let matches = BoardLogic.getAllMatches(numericGrid);

    while (matches.length > 0) {
      matches.forEach((pos) => {
        const newTileID = Math.floor(Phaser.Math.RND.frac() * this.TYPE_COUNT);
        const tile = this.board[pos.row][pos.col];

        if (tile) {
          tile.updateVisual(newTileID);
        }
      });
      numericGrid = this.getNumericGrid();
      matches = BoardLogic.getAllMatches(numericGrid);
    }
  }

  /**
   * Converts the current board of GameTile objects into a 2D array of TileIDs.
   * This is the bridge between the visual Scene and the static BoardLogic.
   */
  private getNumericGrid(): TileID[][] {
    return this.board.map((row) =>
      row.map((tile) => (tile ? tile.tileID : -1)),
    );
  }

  /**
   * Sets up the pointer events for the game.
   * Uses a simple "swipe" detection based on the initial click and release point.
   */
  private setupInput(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isProcessing) return;

      const startX =
        (this.cameras.main.width - this.GRID_SIZE * this.TILE_SIZE) / 2;
      const startY =
        (this.cameras.main.height - this.GRID_SIZE * this.TILE_SIZE) / 2;

      const col = Math.floor((pointer.x - startX) / this.TILE_SIZE);
      const row = Math.floor((pointer.y - startY) / this.TILE_SIZE);

      if (
        row >= 0 &&
        row < this.GRID_SIZE &&
        col >= 0 &&
        col < this.GRID_SIZE
      ) {
        const clickedTile = this.board[row][col];

        if (clickedTile) {
          this.selectedTile = clickedTile;
        }
      }
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.selectedTile || this.isProcessing) return;

      const startX = this.selectedTile.x;
      const startY = this.selectedTile.y;

      const diffX = pointer.x - startX;
      const diffY = pointer.y - startY;
      const threshold = 30; // Minimum distance for a "swipe"

      if (Math.abs(diffX) > threshold || Math.abs(diffY) > threshold) {
        const { row, col } = this.selectedTile.gridPosition;
        let targetRow = row;
        let targetCol = col;

        // Determine direction
        if (Math.abs(diffX) > Math.abs(diffY)) {
          targetCol = diffX > 0 ? col + 1 : col - 1;
        } else {
          targetRow = diffY > 0 ? row + 1 : row - 1;
        }

        // Execute swap if target is within grid boundaries
        if (
          targetRow >= 0 &&
          targetRow < this.GRID_SIZE &&
          targetCol >= 0 &&
          targetCol < this.GRID_SIZE
        ) {
          this.executeSwap(row, col, targetRow, targetCol);
        }
      }

      this.selectedTile = null;
    });
  }

  /**
   * Swaps two tiles in the grid and animates the transition.
   * If the swap doesn't result in a match, it automatically reverts.
   * @param row1 - Row of the first tile.
   * @param col1 - Column of the first tile.
   * @param row2 - Row of the target position.
   * @param col2 - Column of the target position.
   * @param isReverting - Internal flag to prevent infinite loops during undo.
   */
  private executeSwap(
    row1: number,
    col1: number,
    row2: number,
    col2: number,
    isReverting = false,
  ): void {
    this.isProcessing = true;

    const tile1 = this.board[row1][col1]!;
    const tile2 = this.board[row2][col2]!;

    // 1. Update the logical board (the array)
    this.board[row1][col1] = tile2;
    this.board[row2][col2] = tile1;

    // 2. Get the target world positions for the animation
    const pos1 = this.getTileWorldPosition(row1, col1);
    const pos2 = this.getTileWorldPosition(row2, col2);

    // 3. Animate both tiles using our GameTile helper
    // We only need to wait for one 'onComplete' to proceed
    tile1.animateTo(row2, col2, pos2.x, pos2.y);

    // We use a manual tween call here or an onComplete callback to sync the logic
    this.tweens.add({
      targets: tile2,
      x: pos1.x,
      y: pos1.y,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        tile2.gridPosition = { row: row1, col: col1 };

        if (!isReverting) {
          const matches = BoardLogic.getAllMatches(this.getNumericGrid());

          if (matches.length > 0) {
            // Success! Reset combo and handle the explosion
            this.comboMultiplier = 1;
            this.handleMatches();
          } else {
            // No match found? Swap them back!
            this.executeSwap(row2, col2, row1, col1, true);
          }
        } else {
          // We just finished a revert-swap, player can move again
          this.isProcessing = false;
        }
      },
    });
  }

  /**
   * Processes all current matches on the board.
   * Calculates scores, triggers animations, and starts the gravity sequence.
   */
  private handleMatches(): void {
    const numericGrid = this.getNumericGrid();
    const matches = BoardLogic.getAllMatches(numericGrid);

    if (matches.length === 0) {
      this.isProcessing = false;
      return;
    }

    // 1. Calculate and update score
    const points = BoardLogic.calculateScore(matches, this.comboMultiplier);
    const firstMatch = matches[0];
    const worldPos = this.getTileWorldPosition(firstMatch.row, firstMatch.col);
    this.scoreManager.addPoints(points, worldPos.x, worldPos.y);

    // 2. Visual: Pop and destroy the matched tiles
    matches.forEach((pos) => {
      const tile = this.board[pos.row][pos.col];
      if (tile) {
        this.emitter.explode(10, tile.x, tile.y);

        tile.popAndDestroy();
        this.board[pos.row][pos.col] = null; // Mark as empty in our visual board
      }
    });

    // 3. Wait for the pop animation (200ms) before applying gravity
    this.time.delayedCall(250, () => {
      this.applyGravity();
    });
  }

  /**
   * Orchestrates the falling of existing tiles and spawning of new ones.
   * Automatically checks for chain reactions (cascades) after completion.
   */
  private applyGravity(): void {
    const numericGrid = this.getNumericGrid();
    const { moves, newTiles } = BoardLogic.getGravityPlan(numericGrid);

    let maxDelay = 0;

    // 1. Move existing tiles down
    moves.forEach((move) => {
      const tile = this.board[move.fromRow][move.col]!;
      const worldPos = this.getTileWorldPosition(move.toRow, move.col);

      // Update our board array
      this.board[move.toRow][move.col] = tile;
      this.board[move.fromRow][move.col] = null;

      // Animate (duration based on fall distance)
      const fallDuration = (move.toRow - move.fromRow) * 100;
      maxDelay = Math.max(maxDelay, fallDuration);

      tile.animateTo(
        move.toRow,
        move.col,
        worldPos.x,
        worldPos.y,
        fallDuration,
      );
    });

    // 2. Spawn new tiles from the top
    newTiles.forEach((slot) => {
      const tileID = Math.floor(Math.random() * this.TYPE_COUNT);
      const finalPos = this.getTileWorldPosition(slot.row, slot.col);

      // Start position is above the visible grid
      const startY = finalPos.y - 300;

      const newTile = new GameTile(
        this,
        finalPos.x,
        startY,
        tileID,
        slot.row,
        slot.col,
        this.TILE_SIZE,
      );

      this.board[slot.row][slot.col] = newTile;

      const fallDuration = 400 + slot.row * 50; // Slight stagger for better feel
      maxDelay = Math.max(maxDelay, fallDuration);

      newTile.animateTo(
        slot.row,
        slot.col,
        finalPos.x,
        finalPos.y,
        fallDuration,
      );
    });

    // 3. Chain Reaction Check
    this.time.delayedCall(maxDelay + 50, () => {
      const nextMatches = BoardLogic.getAllMatches(this.getNumericGrid());

      if (nextMatches.length > 0) {
        // Cascade! Increase multiplier and repeat
        this.comboMultiplier++;
        this.handleMatches();
      } else {
        // Sequence finished. Check if player has moves left.
        this.checkGameOver();
      }
    });
  }

  /**
   * Final check after a sequence is finished.
   * Determines if the player can still make a move.
   */
  private checkGameOver(): void {
    if (!BoardLogic.hasValidMoves(this.getNumericGrid())) {
      console.log("GAME OVER - No more moves possible.");
      this.isProcessing = true; // Block further inputs
      this.showGameOverUI();
    } else {
      this.isProcessing = false; // Player can move again
    }
  }

  /**
   * Displays the Game Over overlay with the final score and a restart option.
   */
  private showGameOverUI(): void {
    const { width, height } = this.cameras.main;

    // 1. Create a container to hold all UI elements
    const uiContainer = this.add.container(0, 0).setDepth(100).setAlpha(0);

    // 2. Semi-transparent background overlay
    const overlay = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0);

    // 3. Central info panel (white card)
    const panelW = Math.min(width * 0.8, 400);
    const panelH = 300;
    const panel = this.add
      .rectangle(width / 2, height / 2, panelW, panelH, 0xffffff, 1)
      .setStrokeStyle(4, 0x4a90e2);

    // 4. "No More Moves" Title
    const title = this.add
      .text(width / 2, height / 2 - 70, "NO MORE MOVES", {
        fontSize: "32px",
        color: "#333333",
        fontStyle: "bold",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // 5. Final Score Display
    const scoreText = this.add
      .text(
        width / 2,
        height / 2,
        `Final Score: ${this.scoreManager.currentScore}`,
        {
          fontSize: "24px",
          color: "#666666",
          fontFamily: "Arial",
        },
      )
      .setOrigin(0.5);

    // 6. Interactive Restart Button
    const restartBtn = this.add
      .text(width / 2, height / 2 + 80, "PLAY AGAIN", {
        fontSize: "28px",
        color: "#ffffff",
        backgroundColor: "#4a90e2",
        padding: { x: 20, y: 10 },
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () =>
        restartBtn.setStyle({ backgroundColor: "#357abd" }),
      )
      .on("pointerout", () =>
        restartBtn.setStyle({ backgroundColor: "#4a90e2" }),
      )
      .on("pointerdown", () => {
        // Clean restart of the current scene
        this.scene.restart();
        this.isProcessing = false;
      });

    // Add everything to the container
    uiContainer.add([overlay, panel, title, scoreText, restartBtn]);

    // 7. Smooth fade-in animation
    this.tweens.add({
      targets: uiContainer,
      alpha: 1,
      duration: 500,
      ease: "Power2",
    });
  }
}
