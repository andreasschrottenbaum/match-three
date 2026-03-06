import { Scene, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { Button } from "../ui/Button";
import { LAYOUT, COLORS, getNumColor } from "../config/Theme";
import { GameConfig } from "../config/GameConfig";
import { I18nService } from "../i18n/I18nService";
import { GameText } from "../ui/GameText";

/**
 * Sidebar component managing game stats and control buttons.
 * Dynamically adapts its layout between column (Landscape) and row (Portrait) modes.
 */
export class Sidebar extends BaseLayoutArea {
  /** Internal list of buttons for batch processing and alignment */
  private buttons: Button[] = [];
  /** Static label for the score display */
  private scoreHeader!: GameText;
  /** Dynamic text showing the current player score */
  private scoreText!: GameText;
  /** Current session score */
  private score: number = 0;
  /** Button to trigger the board shuffle mechanic */
  private shuffleBtn!: Button;
  /** Button to open the settings overlay */
  private settingsBtn!: Button;

  /**
   * @param scene - The Phaser Scene instance.
   */
  constructor(scene: Scene) {
    super(scene);

    this.setupScoreDisplay();
    this.createButtons();
    this.setupEventListeners();
  }

  /**
   * Attaches listeners for game events and UI updates.
   */
  private setupEventListeners(): void {
    // Update score when tiles are cleared
    this.scene.events.on("TILES_CLEARED", (count: number) =>
      this.updateScore(count),
    );

    // Refresh shuffle button text and state (enabled/disabled)
    this.scene.events.on("UPDATE_SHUFFLE_UI", () => {
      this.shuffleBtn.setText(
        `${I18nService.t("SHUFFLE")} (${GameConfig.shuffleCharges})`,
      );
      this.shuffleBtn.setDisabled(GameConfig.shuffleCharges <= 0);
    });

    // Reset UI and score when settings or game state changes
    this.scene.events.on("SETTINGS_CHANGED", () => {
      this.score = 0;
      this.scoreText.setText("0");
      this.scoreHeader.setText(I18nService.t("SCORE"));
      this.shuffleBtn.setText(
        `${I18nService.t("SHUFFLE")} (${GameConfig.shuffleCharges})`,
      );
      this.settingsBtn.setText(I18nService.t("SETTINGS"));
    });
  }

  /**
   * Initializes the score-related GameText objects.
   */
  private setupScoreDisplay(): void {
    this.scoreHeader = new GameText(this.scene, I18nService.t("SCORE"), {
      fontSizeFactor: 0.05,
    }).setOrigin(0.5);

    this.scoreText = new GameText(this.scene, "0", {
      fontSizeFactor: 0.06,
    }).setOrigin(0.5);

    this.add([this.scoreHeader, this.scoreText]);
  }

  /**
   * Instantiates the interaction buttons and adds them to the container.
   */
  private createButtons(): void {
    this.shuffleBtn = new Button(this.scene, 0, 0, {
      text: `${I18nService.t("SHUFFLE")} (${GameConfig.shuffleCharges})`,
      callback: () => this.scene.events.emit("GAME_SHUFFLE"),
    });

    this.settingsBtn = new Button(this.scene, 0, 0, {
      text: I18nService.t("SETTINGS"),
      callback: () => this.scene.events.emit("UI_OPEN_SETTINGS"),
    });

    this.add([this.shuffleBtn, this.settingsBtn]);
    this.buttons = [this.shuffleBtn, this.settingsBtn];
  }

  /**
   * Increments the score and triggers a visual "pop" animation.
   * @param count - The number of tiles matched.
   */
  private updateScore(count: number): void {
    this.score += count * 10;
    this.scoreText.setText(this.score.toString());

    // Visual feedback for score increment
    this.scene.tweens.add({
      targets: this.scoreText,
      scale: 1.2,
      duration: 100,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => this.scoreText.setScale(1), // Ensure it returns to base scale
    });
  }

  /**
   * Main resize entry point. Determines orientation and delegates to specific layout methods.
   * @param rect - The bounds allocated by the LayoutManager.
   */
  public resize(rect: Geom.Rectangle): void {
    this.drawBackground(rect, getNumColor(COLORS.UI_BG_LIGHT));

    // Determine orientation based on aspect ratio
    const isPortraitArea = rect.height < rect.width;
    const padding = LAYOUT.PADDING;
    const gap = 20;

    // Refresh font sizes for all text elements
    this.scoreHeader.resize();
    this.scoreText.resize();

    if (isPortraitArea) {
      this.layoutHorizontal(rect, padding, gap);
    } else {
      this.layoutVertical(rect, padding, gap);
    }
  }

  /**
   * Layout for Landscape Mode: Sidebar appears as a vertical column.
   * @param rect - The calculation bounds.
   * @param padding - Side padding.
   * @param gap - Gap between items.
   */
  private layoutVertical(
    rect: Geom.Rectangle,
    padding: number,
    gap: number,
  ): void {
    const btnWidth = rect.width - padding * 2;
    const btnHeight = 50;

    // Center header and score at the top
    this.scoreHeader.setOrigin(0.5);
    this.scoreHeader.setPosition(rect.width / 2, padding * 2);

    this.scoreText.setOrigin(0.5);
    this.scoreText.setPosition(rect.width / 2, padding * 5);

    // Stack buttons from the bottom up
    let currentY = rect.height - padding - btnHeight / 2;

    [...this.buttons].reverse().forEach((btn) => {
      btn.setPosition(rect.width / 2, currentY);
      btn.resize(btnWidth, btnHeight);
      currentY -= btnHeight + gap;
    });
  }

  /**
   * Layout for Portrait Mode: Sidebar appears as a horizontal toolbar.
   * @param rect - The calculation bounds.
   * @param padding - Side padding.
   * @param gap - Gap between items.
   */
  private layoutHorizontal(
    rect: Geom.Rectangle,
    padding: number,
    gap: number,
  ): void {
    const btnWidth = 140;
    const btnHeight = rect.height - padding * 2;

    // Aligns score label and value on the left side
    this.scoreHeader.setOrigin(0, 0.5);
    this.scoreHeader.setPosition(padding, rect.height / 2);

    this.scoreText.setOrigin(0, 0.5);
    this.scoreText.setPosition(padding * 6, rect.height / 2);

    // Stack buttons from the right to the left
    let currentX = rect.width - padding - btnWidth / 2;

    [...this.buttons].reverse().forEach((btn) => {
      btn.setPosition(currentX, rect.height / 2);
      btn.resize(btnWidth, btnHeight);
      currentX -= btnWidth + gap;
    });
  }
}
