import { Scene, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { Button } from "../ui/Button";
import { LAYOUT, COLORS, getNumColor } from "../config/Theme";

/**
 * Sidebar component that acts as a vertical column in landscape
 * and a horizontal toolbar in portrait mode.
 */
export class Sidebar extends BaseLayoutArea {
  private buttons: Button[] = [];

  constructor(scene: Scene) {
    super(scene);
    this.createButtons();
  }

  /**
   * Reacts to layout changes provided by the LayoutManager.
   * Aligns buttons vertically or horizontally based on area dimensions.
   */
  public resize(rect: Geom.Rectangle): void {
    // Draw area background
    this.drawBackground(rect, getNumColor(COLORS.UI_BG_LIGHT));

    // Determine orientation based on area aspect ratio
    const isAreaPortrait = rect.width < rect.height;
    const padding = LAYOUT.PADDING;
    const gap = 10; // Space between buttons

    // Calculate dynamic button dimensions
    const btnWidth = isAreaPortrait ? rect.width - padding * 2 : 120;
    const btnHeight = isAreaPortrait ? 50 : rect.height - padding * 2;

    // Calculate total size of the button group for centering
    const totalGroupSize =
      this.buttons.length * (isAreaPortrait ? btnHeight : btnWidth) +
      (this.buttons.length - 1) * gap;

    // Find the starting center position to keep the group centered in the area
    let currentPos = isAreaPortrait
      ? (rect.height - totalGroupSize) / 2 + btnHeight / 2
      : (rect.width - totalGroupSize) / 2 + btnWidth / 2;

    // Reposition and resize each button
    this.buttons.forEach((btn) => {
      if (isAreaPortrait) {
        // Vertical stack (Landscape layout of the game)
        btn.setPosition(rect.width / 2, currentPos);
        currentPos += btnHeight + gap;
      } else {
        // Horizontal row (Portrait layout of the game)
        btn.setPosition(currentPos, rect.height / 2);
        currentPos += btnWidth + gap;
      }
      btn.resize(btnWidth, btnHeight);
    });
  }

  /**
   * Initializes the buttons for the sidebar
   */
  private createButtons(): void {
    const settingsBtn = new Button(this.scene, 100, 0, {
      text: "SETTINGS",
      callback: () => {
        this.scene.events.emit("UI_OPEN_SETTINGS");
      },
    });
    this.add(settingsBtn);
    this.buttons.push(settingsBtn);
  }
}
