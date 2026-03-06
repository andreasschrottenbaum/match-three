import { Scene, Geom, GameObjects } from "phaser";
import { BaseOverlay } from "./BaseOverlay";
import { Button } from "../ui/Button";
import { I18nService } from "../i18n/I18nService";

export class GameOverOverlay extends BaseOverlay {
  private titleText: GameObjects.Text;
  private scoreText: GameObjects.Text;
  private retryButton: Button; // Typ-Sicherheit
  private finalScore: number = 0;

  constructor(scene: Scene) {
    super(scene);

    const style = {
      fontFamily: "Arial",
      fontSize: "42px",
      color: "#ffffff",
      align: "center",
    };

    this.titleText = scene.add
      .text(0, 0, I18nService.t("GAME_OVER"), {
        ...style,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.scoreText = scene.add
      .text(0, 0, `${I18nService.t("SCORE")}: 0`, {
        ...style,
        fontSize: "32px",
      })
      .setOrigin(0.5);

    // Button initialisieren
    this.retryButton = new Button(this.scene, 0, 0, {
      text: I18nService.t("RESTART"),
      callback: () => {
        this.hide();
        this.scene.events.emit("SETTINGS_CHANGED"); // Reset Game
      },
    });

    this.add([this.titleText, this.scoreText, this.retryButton]);

    // Listener für den Score (optional, falls du den Score direkt hier tracken willst)
    this.scene.events.on("TILES_CLEARED", (count: number) => {
      this.finalScore += count * 10;
    });

    // Wichtig: Beim Reset Score auf 0 setzen
    this.scene.events.on("SETTINGS_CHANGED", () => {
      this.finalScore = 0;
      this.updateScore(0);
      this.titleText.setText(I18nService.t("GAME_OVER"));
      this.retryButton.setText(I18nService.t("RESTART"));
    });

    // Game Over Command
    const openHandler = () => {
      this.updateScore(this.finalScore);
      const fullRect = new Geom.Rectangle(
        0,
        0,
        this.scene.scale.width,
        this.scene.scale.height,
      );
      this.show(fullRect);
    };

    this.scene.events.on("GAME_OVER", openHandler);
    this.scene.events.once("shutdown", () => {
      this.scene.events.off("GAME_OVER", openHandler);
    });
  }

  public updateScore(score: number): void {
    this.scoreText.setText(`${I18nService.t("SCORE")}: ${score}`);
  }

  public resize(rect: Geom.Rectangle): void {
    this.drawDimmer(rect);
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    this.titleText.setPosition(cx, cy - 80);
    this.scoreText.setPosition(cx, cy);

    // HIER fehlte der Aufruf, der den Button zeichnet!
    this.retryButton.setPosition(cx, cy + 100);
    this.retryButton.resize(200, 60);

    if (this.isShown) {
      this.setInteractive(rect, Geom.Rectangle.Contains);
    }
  }
}
