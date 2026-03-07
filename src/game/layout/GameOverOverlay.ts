import { Scene, Geom, GameObjects } from "phaser";
import { BaseOverlay } from "./BaseOverlay";
import { Button } from "../ui/Button";
import { I18nService } from "../i18n/I18nService";
import { GameText } from "../ui/GameText";
import { COLORS, getNumColor } from "../config/Theme";

/**
 * Overlay displayed when the game ends (no more moves).
 * Displays the final score and provides a restart option.
 */
export class GameOverOverlay extends BaseOverlay {
  /** Background panel for the game over elements */
  private panel: GameObjects.Graphics;
  /** Title text displaying the "Game Over" message */
  private titleText: GameText;
  /** Text displaying the accumulated player score */
  private scoreText: GameText;
  /** Button to trigger a game reset */
  private retryButton: Button;
  /** Internal score tracker for the current session */
  private finalScore: number = 0;

  /**
   * @param scene - The Phaser Scene this overlay belongs to.
   */
  constructor(scene: Scene) {
    super(scene);

    // Initialize the background panel first to ensure correct depth sorting
    this.panel = this.scene.add.graphics();

    // 1. Initialize text elements using GameText for responsiveness
    // The title will get a larger font factor for visual hierarchy
    this.titleText = new GameText(scene, I18nService.t("GAME_OVER"), {
      fontSizeFactor: 0.05,
    }).setOrigin(0.5);

    this.scoreText = new GameText(
      scene,
      `${I18nService.t("SCORE")}: 0`,
    ).setOrigin(0.5);

    // 2. Initialize the Restart button with a callback to the game reset event
    this.retryButton = new Button(this.scene, 0, 0, {
      text: I18nService.t("RESTART"),
      callback: () => {
        this.hide();
        // Emit global reset event to start a fresh game
        this.scene.events.emit("SETTINGS_CHANGED");
      },
    });

    this.add([this.panel, this.titleText, this.scoreText, this.retryButton]);

    // 3. Register Event Listeners
    this.setupEventListeners();
  }

  /**
   * Attaches necessary scene-level event listeners for scoring and game state.
   */
  private setupEventListeners(): void {
    // Increment score based on cleared tiles
    const scoreHandler = (count: number) => {
      this.finalScore += count * 10;
    };

    // Reset logic when a new game starts
    const resetHandler = () => {
      this.finalScore = 0;
      this.updateScore(0);
      this.titleText.setText(I18nService.t("GAME_OVER"));
      this.retryButton.setText(I18nService.t("RESTART"));
    };

    // Logic to trigger the overlay visibility
    const openHandler = () => {
      this.updateScore(this.finalScore);
      // Calculate full screen bounds for the background dimmer
      const fullRect = new Geom.Rectangle(
        0,
        0,
        this.scene.scale.width,
        this.scene.scale.height,
      );
      this.show(fullRect);
    };

    this.scene.events.on("TILES_CLEARED", scoreHandler);
    this.scene.events.on("SETTINGS_CHANGED", resetHandler);
    this.scene.events.on("GAME_OVER", openHandler);

    // Clean up listeners when scene is destroyed to prevent memory leaks
    this.scene.events.once("shutdown", () => {
      this.scene.events.off("TILES_CLEARED", scoreHandler);
      this.scene.events.off("SETTINGS_CHANGED", resetHandler);
      this.scene.events.off("GAME_OVER", openHandler);
    });
  }

  /**
   * Updates the score text display.
   * @param score - The numerical score value to display.
   */
  public updateScore(score: number): void {
    this.scoreText.setText(`${I18nService.t("SCORE")}: ${score}`);
  }

  /**
   * Orchestrates the layout of the overlay elements.
   * Implements text width constraints to prevent Desktop overflow.
   * @param rect - The screen dimensions provided by the LayoutManager.
   */
  public resize(rect: Geom.Rectangle): void {
    // Update the full-screen background dimmer from the base class
    this.drawDimmer(rect);

    // 1. Calculate Panel Dimensions (consistent with SettingsView)
    // Set limits for desktop to prevent it from getting too large.
    const panelWidth = Math.min(rect.width * 0.85, 450);
    const panelHeight = Math.min(rect.height * 0.5, 400);
    const panelX = (rect.width - panelWidth) / 2;
    const panelY = (rect.height - panelHeight) / 2;

    // 2. Draw the Panel Background
    this.panel.clear();
    this.panel.fillStyle(getNumColor(COLORS.UI_BG_DARK), 0.95);
    this.panel.lineStyle(4, getNumColor(COLORS.WHITE), 1);
    this.panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
    this.panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

    const cx = rect.width / 2;

    // 3. Define Constraints for Text Width (e.g., 90% of panel width)
    const textMaxWidth = panelWidth * 0.9;

    // 4. Position and resize GameText elements with constraints
    this.titleText.setMaxWidth(textMaxWidth); // APPLY CONSTRAINT HERE
    this.titleText.setPosition(cx, panelY + panelHeight * 0.25);
    // Inform the text object to recalculate scaling
    this.titleText.resize();

    this.scoreText.setMaxWidth(textMaxWidth); // APPLY CONSTRAINT HERE
    this.scoreText.setPosition(cx, panelY + panelHeight * 0.5);
    this.scoreText.resize();

    // 5. Position and resize the Button component
    this.retryButton.setPosition(cx, panelY + panelHeight - 60);
    this.retryButton.resize(panelWidth * 0.6, 60);

    // Ensure input blocker matches the full screen if shown
    if (this.isShown) {
      this.setInteractive(rect, Geom.Rectangle.Contains);
    }
  }
}
