import Phaser from "phaser";
import type { TileID, GridPosition } from "../types";

/**
 * Visual representation of a single tile in the ZenMatchThree game.
 * Extends Phaser's Sprite to display high-res assets in a grid.
 */
export class GameTile extends Phaser.GameObjects.Sprite {
  public tileID: TileID;
  public gridPosition: GridPosition;

  /**
   * @param scene - The Phaser Scene this tile belongs to.
   * @param x - Initial horizontal world position (center).
   * @param y - Initial vertical world position (center).
   * @param id - The unique TileID determining the frame.
   * @param row - Initial row index in the grid.
   * @param col - Initial column index in the grid.
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: TileID,
    row: number,
    col: number,
    targetSize: number,
  ) {
    super(scene, x, y, "tiles", id);

    this.tileID = id;
    this.gridPosition = { row, col };

    const scaleFactor = targetSize / this.width;
    this.setScale(scaleFactor);

    // 2. Setup visual properties
    this.setOrigin(0.5);
    this.setInteractive();

    // Add this object to the scene's display list
    scene.add.existing(this);
  }

  /**
   * Updates the frame and ID (e.g., during board initialization).
   * @param newID - The new TileID.
   */
  public updateVisual(newID: TileID): void {
    this.tileID = newID;
    this.setFrame(newID);
  }

  /**
   * Updates the internal grid position and starts a movement tween.
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
   * More "juicy" now with scale-up before scale-down.
   */
  public popAndDestroy(): void {
    const currentScale = this.scaleX;

    this.scene.tweens.add({
      targets: this,
      scaleX: currentScale * 1.3,
      scaleY: currentScale * 1.3,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
