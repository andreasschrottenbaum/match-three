import { Scene, Geom, GameObjects } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { Button } from "../ui/Button";
import { LAYOUT, COLORS, getNumColor } from "../config/Theme";
import { GameConfig } from "../config/GameConfig";
import { I18nService } from "../i18n/I18nService";

/**
 * Sidebar component managing game stats and control buttons.
 * Adapts its layout based on the available space (Vertical vs Horizontal).
 */
export class Sidebar extends BaseLayoutArea {
  private buttons: Button[] = [];
  private scoreHeader!: GameObjects.Text;
  private scoreText!: GameObjects.Text;
  private score: number = 0;
  private shuffleBtn: Button;
  private settingsBtn: Button;

  constructor(scene: Scene) {
    super(scene);
    this.setupScoreDisplay();
    this.createButtons();

    // Listen for tile matches to update score
    this.scene.events.on("TILES_CLEARED", (count: number) =>
      this.updateScore(count),
    );

    this.scene.events.on("UPDATE_SHUFFLE_UI", () => {
      this.shuffleBtn.setText(
        `${I18nService.t("SHUFFLE")} (${GameConfig.shuffleCharges})`,
      );
      this.shuffleBtn.setDisabled(GameConfig.shuffleCharges <= 0);
    });

    this.scene.events.on("SETTINGS_CHANGED", () => {
      this.score = 0;
      this.scoreText.setText(this.score.toString());
      this.scoreHeader.setText(I18nService.t("SCORE"));
      this.shuffleBtn.setText(
        `${I18nService.t("SHUFFLE")} (${GameConfig.shuffleCharges})`,
      );
      this.settingsBtn.setText(I18nService.t("SETTINGS"));
    });
  }

  /**
   * Initializes the score text object.
   */
  private setupScoreDisplay(): void {
    this.scoreHeader = this.scene.add
      .text(0, 0, I18nService.t("SCORE"), {
        fontSize: "24px",
        color: "#ffffff",
        align: "center",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.scoreText = this.scene.add
      .text(0, 0, "0", {
        fontSize: "24px",
        color: "#ffffff",
        align: "center",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add([this.scoreHeader, this.scoreText]);
  }

  /**
   * Creates the control buttons for the sidebar.
   */
  private createButtons(): void {
    // Shuffle Button (Placeholder for next step)
    this.shuffleBtn = new Button(this.scene, 0, 0, {
      text: `${I18nService.t("SHUFFLE")} (${GameConfig.shuffleCharges})`,
      callback: () => this.scene.events.emit("GAME_SHUFFLE"),
    });

    // Settings Button
    this.settingsBtn = new Button(this.scene, 0, 0, {
      text: I18nService.t("SETTINGS"),
      callback: () => this.scene.events.emit("UI_OPEN_SETTINGS"),
    });

    this.add(this.shuffleBtn);
    this.add(this.settingsBtn);
    this.buttons = [this.shuffleBtn, this.settingsBtn];
  }

  /**
   * Updates the score value and triggers a small visual feedback.
   * @param count - Number of tiles cleared in the match.
   */
  private updateScore(count: number): void {
    this.score += count * 10;
    this.scoreText.setText(this.score + "");

    this.scene.tweens.add({
      targets: this.scoreText,
      scale: 1.2,
      duration: 100,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  /**
   * Aligns the score and buttons dynamically based on area dimensions.
   */
  public resize(rect: Geom.Rectangle): void {
    this.drawBackground(rect, getNumColor(COLORS.UI_BG_LIGHT));

    const isVertical = rect.height > rect.width;
    const padding = LAYOUT.PADDING;
    const gap = 20;

    if (isVertical) {
      this.layoutVertical(rect, padding, gap);
    } else {
      this.layoutHorizontal(rect, padding, gap);
    }
  }

  /**
   * Layout logic for Landscape Mode (Sidebar is a vertical column).
   * Score at the top, buttons at the bottom.
   */
  private layoutVertical(
    rect: Geom.Rectangle,
    padding: number,
    gap: number,
  ): void {
    const btnWidth = rect.width - padding * 2;
    const btnHeight = 50;

    this.scoreHeader.setPosition(rect.width / 2, padding * 2);

    // Position Score at the top
    this.scoreText.setOrigin(0.5);
    this.scoreText.setPosition(rect.width / 2, padding * 3.5);

    // Position Buttons at the bottom, stacked upwards
    let currentY = rect.height - padding - btnHeight / 2;

    // Reverse array to place the last button (Settings) at the very bottom
    [...this.buttons].reverse().forEach((btn) => {
      btn.setPosition(rect.width / 2, currentY);
      btn.resize(btnWidth, btnHeight);
      currentY -= btnHeight + gap;
    });
  }

  /**
   * Layout logic for Portrait Mode (Sidebar is a horizontal toolbar).
   * Score on the left, buttons on the right.
   */
  private layoutHorizontal(
    rect: Geom.Rectangle,
    padding: number,
    gap: number,
  ): void {
    const btnWidth = 120;
    const btnHeight = rect.height - padding * 2;

    this.scoreHeader.setPosition(padding * 3, rect.height / 2);

    // Position Score on the far left
    this.scoreText.setOrigin(0, 0.5);
    this.scoreText.setPosition(padding * 6, rect.height / 2);

    // Position Buttons on the right, stacked leftwards
    let currentX = rect.width - padding - btnWidth / 2;

    [...this.buttons].reverse().forEach((btn) => {
      btn.setPosition(currentX, rect.height / 2);
      btn.resize(btnWidth, btnHeight);
      currentX -= btnWidth + gap;
    });
  }
}
