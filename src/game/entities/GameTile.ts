import { Scene, GameObjects } from "phaser";
import type { TileID, GridPosition } from "../types";

/**
 * Visual representation of a single tile in the ZenMatchThree game.
 * Extends Phaser's Text object to display emojis and manage its own grid state.
 */
export class GameTile extends GameObjects.Text {
  public tileID: TileID;
  public gridPosition: GridPosition;

  private static readonly EMOJIS = ["💎", "🍎", "🍇", "🌟", "🧡", "🍀"];

  /**
   * @param scene - The Phaser Scene this tile belongs to.
   * @param x - Initial horizontal world position.
   * @param y - Initial vertical world position.
   * @param id - The unique TileID determining the emoji.
   * @param row - Initial row index in the grid.
   * @param col - Initial column index in the grid.
   */
  constructor(
    scene: Scene,
    x: number,
    y: number,
    id: TileID,
    row: number,
    col: number,
  ) {
    // Call the parent Text constructor with the corresponding emoji
    super(scene, x, y, GameTile.EMOJIS[id], {
      fontSize: "52px",
      fontFamily: "Arial", // Ensure consistent rendering
    });

    this.tileID = id;
    this.gridPosition = { row, col };

    // Setup visual properties
    this.setOrigin(0.5);
    this.setInteractive();

    // Add this object to the scene's display list
    scene.add.existing(this);
  }

  /**
   * Updates the internal grid position and starts a movement tween.
   * @param row - The new target row.
   * @param col - The new target column.
   * @param x - The new target X world coordinate.
   * @param y - The new target Y world coordinate.
   * @param duration - Animation length in milliseconds.
   */
  public animateTo(
    row: number,
    col: number,
    x: number,
    y: number,
    duration: number = 300,
  ): void {
    this.gridPosition = { row, col };

    this.scene.tweens.add({
      targets: this,
      x: x,
      y: y,
      duration: duration,
      ease: "Back.easeOut", // A slight "Zen" bounce effect
      easeParams: [1.5],
    });
  }

  /**
   * Plays a "pop" animation and destroys the tile.
   * Used when a match is cleared.
   */
  public popAndDestroy(): void {
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
