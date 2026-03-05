import { Scene, GameObjects, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { LAYOUT } from "../config/Theme";

export class Footer extends BaseLayoutArea {
  private footerText: GameObjects.Text;

  constructor(scene: Scene) {
    super(scene);

    // Initialize the text
    this.footerText = scene.add
      .text(0, 0, "© 2026 Andreas Schrottenbaum")
      .setOrigin(0, 0.5); // Origin: Left (0) and Vertically Centered (0.5)

    this.add(this.footerText);
  }

  /**
   * Updates the background and aligns the text
   */
  public resize(rect: Geom.Rectangle): void {
    // 1. Draw background
    this.drawBackground(rect, 0xffffff, 0.3);

    // 2. Position the text
    // Left default padding, vertically centered in the footer rectangle
    const paddingLeft = LAYOUT.PADDING;
    this.footerText.setPosition(paddingLeft, rect.height / 2);
  }
}
