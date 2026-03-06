import { Scene, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { LAYOUT } from "../config/Theme";
import { GameText } from "../ui/GameText";

/**
 * The Footer area of the game UI.
 * Typically used for versioning, copyright information, or small legal disclaimers.
 */
export class Footer extends BaseLayoutArea {
  /** The copyright text element using the specialized GameText class for responsiveness */
  private footerText: GameText;

  /**
   * @param scene - The Phaser Scene this footer belongs to.
   */
  constructor(scene: Scene) {
    super(scene);

    // Initialize the text with a small font size factor (1% of screen height)
    this.footerText = new GameText(scene, "© 2026 Andreas Schrottenbaum", {
      fontSizeFactor: 0.01,
    });

    // Set origin to Left (0) and Vertically Centered (0.5) for easy positioning
    this.footerText.setOrigin(0, 0.5);

    this.add(this.footerText);
  }

  /**
   * Handles the layout and background rendering of the footer.
   * Aligns the footer text based on the provided dimensions.
   *
   * @param rect - The bounding box provided by the LayoutManager.
   */
  public resize(rect: Geom.Rectangle): void {
    // 1. Render the semi-transparent background
    this.drawBackground(rect, 0xffffff, 0.3);

    // 2. Position the text within the area
    // Applies standard padding from the theme and centers vertically
    const paddingLeft = LAYOUT.PADDING;
    const centerY = rect.height / 2;

    this.footerText.setPosition(paddingLeft, centerY);

    // 3. Trigger GameText's internal resize to update font scaling
    this.footerText.resize();
  }
}
