import { Scene, Geom, GameObjects } from "phaser";
import { BaseOverlay } from "./BaseOverlay";
import { Button } from "../ui/Button";
import { GameConfig } from "../config/GameConfig";
import { COLORS } from "../config/Theme";
import { Stepper } from "../ui/Stepper";

export class SettingsView extends BaseOverlay {
  private title: GameObjects.Text;
  private closeBtn: Button;

  private sizeStepper!: Stepper;
  private varietyStepper!: Stepper;

  constructor(scene: Scene) {
    super(scene);

    this.title = scene.add
      .text(0, 0, "SETTINGS", {
        fontSize: "32px",
        color: COLORS.WHITE,
      })
      .setOrigin(0.5);

    this.closeBtn = new Button(scene, 0, 0, {
      text: "CLOSE",
      callback: () => this.hide(),
    });

    this.createGridSettings();

    this.add([
      this.title,
      this.closeBtn,
      this.sizeStepper,
      this.varietyStepper,
    ]);

    this.scene.events.on("UI_OPEN_SETTINGS", () => {
      const fullRect = new Geom.Rectangle(
        0,
        0,
        this.scene.scale.width,
        this.scene.scale.height,
      );
      this.show(fullRect);
    });
  }

  private createGridSettings() {
    this.sizeStepper = new Stepper(this.scene, 0, 0, {
      label: "GRID SIZE",
      value: GameConfig.grid.size,
      min: 4,
      max: 12,
      onChange: (val: number) => {
        GameConfig.grid.size = val;
        this.scene.events.emit("SETTINGS_CHANGED", GameConfig);
      },
    });

    this.varietyStepper = new Stepper(this.scene, 0, 100, {
      label: "TILE VARIETY",
      value: GameConfig.grid.variety,
      min: 3,
      max: 12,
      onChange: (val: number) => {
        GameConfig.grid.variety = val;
        this.scene.events.emit("SETTINGS_CHANGED", GameConfig);
      },
    });
  }

  public resize(rect: Geom.Rectangle): void {
    // Redraw Dimmer
    this.drawDimmer(rect);

    const centerX = rect.width / 2;

    this.sizeStepper.setPosition(centerX, rect.height / 2 - 60);
    this.varietyStepper.setPosition(centerX, rect.height / 2 + 60);

    // Center UI elements
    this.title.setPosition(rect.width / 2, 100);
    this.closeBtn.setPosition(rect.width / 2, rect.height - 100);
    this.closeBtn.resize(200, 50);
  }
}
