import { Scene } from "phaser";
import { LayoutManager } from "../layout/LayoutManager";
import { Header } from "../layout/Header";
import { Sidebar } from "../layout/Sidebar";
import { Content } from "../layout/Content";
import { Footer } from "../layout/Footer";
import { SettingsView } from "../layout/SettingsView";
import { GameOverOverlay } from "../layout/GameOverOverlay";
import { I18nService } from "../i18n/I18nService";

/**
 * Main Entry Point Scene for the Match-3 Game.
 * Orchestrates the LayoutManager, UI areas, and global service initialization.
 */
export class MatchThree extends Scene {
  /** Controller responsible for responsive positioning and UI area management */
  private layoutManager!: LayoutManager;

  /**
   * Preloads essential assets for the game.
   * Note: It is recommended to use a dedicated Boot/Preload scene for larger projects.
   */
  public preload(): void {
    // Load custom fonts - Ensure the path is correct relative to the index.html
    this.load.font("FreckleFace", "./assets/fonts/FreckleFace-Regular.ttf");

    this.load.svg("icon-settings", "./assets/icons/cogwheel.svg");
    this.load.svg("icon-shuffle", "./assets/icons/shuffle.svg");
  }

  /**
   * Initializes game services, creates UI layout areas, and performs initial positioning.
   */
  public create(): void {
    // Initialize Internationalization before UI components are created
    I18nService.init();

    // Initialize the LayoutManager with the current scene context
    this.layoutManager = new LayoutManager(this);

    /**
     * Register UI Areas.
     * These extend BaseLayoutArea, so they are automatically added to the display list.
     * The order of registration does not dictate depth (z-index), but logical grouping.
     */
    this.layoutManager.registerArea("header", new Header(this));
    this.layoutManager.registerArea("sidebar", new Sidebar(this));
    this.layoutManager.registerArea("content", new Content(this));
    this.layoutManager.registerArea("footer", new Footer(this));

    // Register Overlays (Hidden by default within their own internal logic)
    this.layoutManager.registerArea("settings", new SettingsView(this));
    this.layoutManager.registerArea("gameOver", new GameOverOverlay(this));

    // Force an immediate layout update to position elements based on current screen size
    this.layoutManager.update();

    // Listen for window resize events to trigger the LayoutManager
    this.scale.on("resize", () => {
      this.layoutManager.update();
    });
  }

  /**
   * Clean up listeners when the scene is shut down or destroyed.
   */
  public shutdown(): void {
    this.scale.off("resize");
  }
}
