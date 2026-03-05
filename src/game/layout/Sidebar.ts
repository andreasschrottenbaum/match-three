import { Scene, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { Button } from "./Button";
import { COLORS, getNumColor, LAYOUT } from "../config/Theme";

export class Sidebar extends BaseLayoutArea {
  private buttons: Button[] = [];

  constructor(scene: Scene) {
    super(scene);
    this.createButtons();
  }

  /**
   * Reacts to layout changes provided by the LayoutManager
   */
  public resize(rect: Geom.Rectangle): void {
    this.drawBackground(rect, getNumColor(COLORS.UI_BG_LIGHT));

    const isLandscape = rect.width < rect.height;
    const padding = LAYOUT.PADDING;

    // Calculate dynamic button sizes
    const btnWidth = isLandscape ? rect.width - padding * 2 : 120;
    const btnHeight = isLandscape ? 50 : rect.height - padding * 2;

    this.buttons.forEach((btn, index) => {
      if (isLandscape) {
        // Vertical stack for Landscape
        const spacing = btnHeight + 10;
        const startY = 100; // Offset from top
        btn.setPosition(rect.width / 2, startY + index * spacing);
      } else {
        // Horizontal row for Portrait
        const spacing = btnWidth + 10;
        const startX = 100; // Offset from left
        btn.setPosition(startX + index * spacing, rect.height / 2);
      }

      btn.resize(btnWidth, btnHeight);
    });
  }

  private createButtons() {
    const buttonLabels = ["SHUFFLE", "HINT", "RESTART"];

    buttonLabels.forEach((label) => {
      const btn = new Button(this.scene, 0, 0, {
        width: 100,
        height: 50,
        text: label,
        callback: () => console.log(`${label} clicked`),
      });

      this.add(btn);
      this.buttons.push(btn);
    });
  }
}
