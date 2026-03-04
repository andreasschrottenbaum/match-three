import { GameTile } from "../entities/GameTile";
import { GridUtils } from "../logic/GridUtils";
import type { MatchThree } from "../scenes/MatchThree";
import { Manager } from "../types";

/**
 * Data structure emitted when a valid swipe gesture is detected.
 */
export type SwipeData = {
  /** The tile where the swipe started */
  tile: GameTile;
  /** The relative grid direction of the swipe */
  direction: { row: number; col: number };
};

/**
 * Manages user input (Pointer/Touch) and translates them into game actions like selection and swiping.
 */
export class InputManager implements Manager {
  /** The tile currently held by the user */
  private selectedTile: GameTile | null = null;
  /** Internal lock to prevent input during animations or UI overlays */
  private isEnabled: boolean = true;
  /** Minimum pixel distance for a movement to be recognized as a swipe */
  private readonly threshold = 30;

  /**
   * @param scene - Reference to the main game scene.
   * @param gridConfig - Current layout configuration for coordinate translation.
   * @param onSwipe - Callback executed when a valid swipe is completed.
   */
  constructor(
    private scene: MatchThree,
    private gridConfig: {
      gridSize: number;
      tileSize: number;
      offsetX: number;
      offsetY: number;
    },
    private onSwipe: (data: SwipeData) => void,
  ) {
    this.setupEvents();
  }

  /**
   * Toggles the input state. Set to false to block user interaction.
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Returns whether the manager is currently accepting input.
   */
  public getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Registers Phaser pointer events for the game board.
   */
  private setupEvents(): void {
    // 1. POINTER DOWN: Selection and Boundary Check
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.isEnabled) return;

      const { row, col } = GridUtils.worldToGrid(
        pointer.x,
        pointer.y,
        this.gridConfig.tileSize,
        this.gridConfig.offsetX,
        this.gridConfig.offsetY,
      );

      // Boundary check to prevent errors when clicking UI elements or outside the grid
      if (
        row < 0 ||
        row >= this.gridConfig.gridSize ||
        col < 0 ||
        col >= this.gridConfig.gridSize
      ) {
        return;
      }

      const tile = this.scene.getTileAt(row, col);
      if (tile) {
        this.selectedTile = tile;
        this.selectedTile.setSelected(true);
      }
    });

    // 2. POINTER UP: Swipe Recognition and Execution
    this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.selectedTile || !this.isEnabled) {
        this.selectedTile = null; // Ensure cleanup even if disabled
        return;
      }

      this.selectedTile.setSelected(false);

      // Calculate vector from tile center to release point
      const diffX = pointer.x - this.selectedTile.x;
      const diffY = pointer.y - this.selectedTile.y;

      // Check if the drag distance exceeds the threshold
      if (
        Math.abs(diffX) > this.threshold ||
        Math.abs(diffY) > this.threshold
      ) {
        let dr = 0;
        let dc = 0;

        // Determine primary axis (Horizontal vs Vertical)
        if (Math.abs(diffX) > Math.abs(diffY)) {
          dc = diffX > 0 ? 1 : -1;
        } else {
          dr = diffY > 0 ? 1 : -1;
        }

        this.onSwipe({
          tile: this.selectedTile,
          direction: { row: dr, col: dc },
        });
      }

      this.selectedTile = null;
    });
  }

  /**
   * Updates internal coordinate mapping for input detection.
   * @param newSize - New Size inPixels
   * @param newX - New X Position
   * @param newY - New Y Position
   */
  public updateLayout(newSize: number, newX: number, newY: number): void {
    // Updating the reference passed in the constructor
    this.gridConfig.tileSize = newSize;
    this.gridConfig.offsetX = newX;
    this.gridConfig.offsetY = newY;
  }

  /**
   * Class destructor
   */
  public destroy(): void {
    this.scene.input.off("pointerdown");
    this.scene.input.off("pointerup");
    this.scene.input.off("pointermove");
  }
}
