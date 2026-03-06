import { Scene, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { GameText } from "../ui/GameText";

/**
 * The Header area of the game UI.
 * Displays the main game title and provides a background container
 * that scales with the LayoutManager.
 */
export class Header extends BaseLayoutArea {
  /** The main title text using the responsive GameText class */
  private headerText: GameText;

  /**
   * @param scene - The Phaser Scene this header belongs to.
   */
  constructor(scene: Scene) {
    super(scene);

    // Initialize the text with a title-appropriate font size factor (7% of screen height)
    this.headerText = new GameText(scene, "MATCH THREE", {
      fontSizeFactor: 0.07,
    });

    // Centered origin for easy positioning in the middle of the header rect
    this.headerText.setOrigin(0.5);

    this.add(this.headerText);
  }

  /**
   * Updates the visual layout of the header.
   * Redraws the background and repositions/rescales the text based on the provided bounds.
   *
   * @param rect - The calculation bounds provided by the LayoutManager.
   */
  public resize(rect: Geom.Rectangle): void {
    // 1. Draw a semi-transparent background to define the header area
    this.drawBackground(rect, 0xffffff, 0.3);

    // 2. Position the text exactly in the center of the allocated rectangle
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    this.headerText.setPosition(centerX, centerY);

    // 3. Trigger GameText resize to update internal font scaling relative to the new height
    this.headerText.resize();
  }
}
