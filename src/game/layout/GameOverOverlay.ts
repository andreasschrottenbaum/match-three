import { Scene, Geom } from "phaser";
import { BaseOverlay } from "./BaseOverlay";
import { Button } from "../ui/Button";
import { I18nService } from "../i18n/I18nService";
import { GameText } from "../ui/GameText";

/**
 * Overlay displayed when the game ends (no more moves).
 * Displays the final score and provides a restart option.
 */
export class GameOverOverlay extends BaseOverlay {
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

    // 1. Initialize text elements using GameText for responsiveness
    this.titleText = new GameText(scene, I18nService.t("GAME_OVER")).setOrigin(
      0.5,
    );

    this.scoreText = new GameText(
      scene,
      `${I18nService.t("SCORE")}: 0`,
    ).setOrigin(0.5);

    // 2. Initialize the Restart button with a callback to the game reset event
    this.retryButton = new Button(this.scene, 0, 0, {
      text: I18nService.t("RESTART"),
      callback: () => {
        this.hide();
        // Emit global reset event
        this.scene.events.emit("SETTINGS_CHANGED");
      },
    });

    this.add([this.titleText, this.scoreText, this.retryButton]);

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
   * Ensures all text and button elements are resized for the current screen.
   * @param rect - The screen dimensions provided by the LayoutManager.
   */
  public resize(rect: Geom.Rectangle): void {
    // Update the full-screen background dimmer from the base class
    this.drawDimmer(rect);

    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Position and resize GameText elements
    this.titleText.setPosition(cx, cy - 80);
    this.titleText.resize();

    this.scoreText.setPosition(cx, cy);
    this.scoreText.resize();

    // Position and resize the Button component
    this.retryButton.setPosition(cx, cy + 100);
    this.retryButton.resize(200, 60);

    // Ensure input blocker matches the full screen if shown
    if (this.isShown) {
      this.setInteractive(rect, Geom.Rectangle.Contains);
    }
  }
}
