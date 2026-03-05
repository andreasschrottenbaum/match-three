import { Scene, GameObjects, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";

export class Header extends BaseLayoutArea {
  private headerText: GameObjects.Text;

  constructor(scene: Scene) {
    super(scene);

    // Initialize the text with a placeholder position
    this.headerText = scene.add.text(0, 0, "MATCH THREE").setOrigin(0.5);

    this.add(this.headerText);
  }

  /**
   * Updates the background and aligns the text
   */
  public resize(rect: Geom.Rectangle): void {
    // 1. Draw background
    this.drawBackground(rect, 0xffffff, 0.3);

    // 2. Position the text
    // Absolutely centered
    this.headerText.setPosition(rect.width / 2, rect.height / 2);
  }
}
