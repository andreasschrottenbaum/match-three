import { Scene, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { LAYOUT } from "../config/Theme";

export class Content extends BaseLayoutArea {
  private boardPlaceholder: Phaser.GameObjects.Graphics;

  constructor(scene: Scene) {
    super(scene);

    // This will eventually be replaced by the actual BoardManager
    this.boardPlaceholder = scene.add.graphics();
    this.add(this.boardPlaceholder);
  }

  /**
   * Resizes the content area and centers the game board
   */
  public resize(rect: Geom.Rectangle): void {
    // 1. Visual background for the main area
    this.drawBackground(rect, 0x00001a, 1);

    // 2. Calculate the square for the game board
    // We want a small margin (e.g., 20px) so the board doesn't touch the area edges
    const margin = LAYOUT.PADDING;
    const availableWidth = rect.width - margin * 2;
    const availableHeight = rect.height - margin * 2;

    // The board must be a square
    const boardSize = Math.min(availableWidth, availableHeight);

    // Center the square within the content area
    const boardX = (rect.width - boardSize) / 2;
    const boardY = (rect.height - boardSize) / 2;

    this.drawBoardPreview(boardX, boardY, boardSize);
  }

  /**
   * Draws a preview of where the Match-3 grid will be placed
   */
  private drawBoardPreview(x: number, y: number, size: number): void {
    this.boardPlaceholder.clear();

    // Darker background for the board itself
    this.boardPlaceholder.fillStyle(0x000000, 0.5);
    this.boardPlaceholder.fillRoundedRect(x, y, size, size, 16);

    // Visual border to see the constraints
    this.boardPlaceholder.lineStyle(2, 0xffcc00, 0.8);
    this.boardPlaceholder.strokeRoundedRect(x, y, size, size, 16);
  }
}
