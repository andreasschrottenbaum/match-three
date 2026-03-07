import { Scene, Geom } from "phaser";
import { BaseLayoutArea } from "./BaseLayoutArea";
import { Button } from "../ui/Button";
import { LAYOUT, COLORS, getNumColor } from "../config/Theme";
import { GameConfig } from "../config/GameConfig";
import { I18nService } from "../i18n/I18nService";
import { GameText } from "../ui/GameText";

/**
 * Sidebar component managing game stats and control buttons.
 * Uses a zone-based layout to prevent overlapping on small screens.
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
   * @param scene - The active Phaser Scene.
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
      this.shuffleBtn.setBadge(GameConfig.shuffleCharges.toString());
      this.shuffleBtn.setDisabled(GameConfig.shuffleCharges <= 0);
    });

    // Reset UI and score when settings or game state changes
    this.scene.events.on("SETTINGS_CHANGED", () => {
      this.score = 0;
      this.scoreText.setText("0");
      this.scoreHeader.setText(I18nService.t("SCORE"));
      this.shuffleBtn.setBadge(GameConfig.shuffleCharges.toString());
    });
  }

  /**
   * Initializes the score-related GameText objects.
   */
  private setupScoreDisplay(): void {
    this.scoreHeader = new GameText(this.scene, I18nService.t("SCORE"), {
      fontSizeFactor: 0.045,
    }).setOrigin(0.5);

    this.scoreText = new GameText(this.scene, "0", {
      fontSizeFactor: 0.055,
    }).setOrigin(0.5);

    this.add([this.scoreHeader, this.scoreText]);
  }

  /**
   * Instantiates the interaction buttons and adds them to the container.
   */
  private createButtons(): void {
    this.shuffleBtn = new Button(this.scene, 0, 0, {
      icon: "icon-shuffle",
      badge: GameConfig.shuffleCharges.toString(),
      callback: () => this.scene.events.emit("GAME_SHUFFLE"),
    });

    this.settingsBtn = new Button(this.scene, 0, 0, {
      icon: "icon-settings",
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
      scale: this.scoreText.scale * 1.2,
      duration: 100,
      yoyo: true,
      ease: "Quad.easeOut",
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

    if (isPortraitArea) {
      this.layoutHorizontal(rect);
    } else {
      this.layoutVertical(rect);
    }
  }

  /**
   * Layout for Landscape Mode: Sidebar appears as a vertical column.
   * @param rect - The calculation bounds.
   */
  private layoutVertical(rect: Geom.Rectangle): void {
    const padding = LAYOUT.PADDING;
    const gap = 15;
    const maxBtnSize = 80; // Absolute limit for button growth

    // Define vertical zones: 30% for score, 70% for buttons
    const scoreZoneHeight = rect.height * 0.3;
    const buttonZoneHeight = rect.height * 0.7;
    const maxWidth = rect.width - padding * 2;

    // Constrain text
    this.scoreHeader.setMaxWidth(maxWidth);
    this.scoreText.setMaxWidth(maxWidth);

    // Position score (centered in zone)
    this.scoreHeader.setOrigin(0.5);
    this.scoreHeader.setPosition(rect.width / 2, scoreZoneHeight * 0.35);
    this.scoreText.setOrigin(0.5);
    this.scoreText.setPosition(rect.width / 2, scoreZoneHeight * 0.75);

    // Calculate dynamic button size with an upper cap
    // 1. Based on width (with padding)
    // 2. Based on available height divided by button count
    // 3. Capped at maxBtnSize
    const btnSize = Math.min(
      maxWidth * 0.9,
      buttonZoneHeight / this.buttons.length - gap,
      maxBtnSize,
    );

    // Start positioning from the bottom
    let currentY = rect.height - padding - btnSize / 2;

    [...this.buttons].reverse().forEach((btn) => {
      btn.setPosition(rect.width / 2, currentY);
      btn.resize(btnSize, btnSize);
      currentY -= btnSize + gap;
    });
  }

  /**
   * Horizontal layout for Portrait mode (Toolbar).
   */
  private layoutHorizontal(rect: Geom.Rectangle): void {
    const padding = LAYOUT.PADDING;
    const gap = 15;

    // Split width: 40% Score, 60% Buttons
    const scoreZoneWidth = rect.width * 0.4;
    const buttonZoneWidth = rect.width * 0.6;
    const centerY = rect.height / 2;

    // Score Layout
    this.scoreHeader.setOrigin(0.5);
    this.scoreText.setOrigin(0.5);
    this.scoreHeader.setMaxWidth(scoreZoneWidth * 0.4);
    this.scoreText.setMaxWidth(scoreZoneWidth * 0.4);

    this.scoreHeader.setPosition(scoreZoneWidth * 0.3, centerY);
    this.scoreText.setPosition(scoreZoneWidth * 0.7, centerY);

    // Button Layout
    const btnSize = Math.min(
      rect.height * 0.85,
      buttonZoneWidth / this.buttons.length - gap,
    );
    let currentX = rect.width - padding - btnSize / 2;

    [...this.buttons].reverse().forEach((btn) => {
      btn.setPosition(currentX, centerY);
      btn.resize(btnSize, btnSize);
      currentX -= btnSize + gap;
    });
  }
}
