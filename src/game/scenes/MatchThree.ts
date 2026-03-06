import { Scene } from "phaser";
import { LayoutManager } from "../layout/LayoutManager";
import { Header } from "../layout/Header";
import { Sidebar } from "../layout/Sidebar";
import { Content } from "../layout/Content";
import { Footer } from "../layout/Footer";
import { SettingsView } from "../layout/SettingsView";
import { GameOverOverlay } from "../layout/GameOverOverlay";
import { I18nService } from "../i18n/I18nService";

export class MatchThree extends Scene {
  private layoutManager: LayoutManager;

  create() {
    I18nService.init();

    this.layoutManager = new LayoutManager(this);

    // Areas will automatically be added to the scene's display list
    // because BaseLayoutArea calls scene.add.existing(this)
    this.layoutManager.registerArea("header", new Header(this));
    this.layoutManager.registerArea("sidebar", new Sidebar(this));
    this.layoutManager.registerArea("content", new Content(this));
    this.layoutManager.registerArea("footer", new Footer(this));
    this.layoutManager.registerArea("settings", new SettingsView(this));
    this.layoutManager.registerArea("gameOver", new GameOverOverlay(this));

    // Initial trigger to position everything
    this.layoutManager.update();

    this.input.keyboard?.on("keydown-L", () => {
      I18nService.toggleLanguage();

      this.events.emit("SETTINGS_CHANGED");
    });
  }
}
