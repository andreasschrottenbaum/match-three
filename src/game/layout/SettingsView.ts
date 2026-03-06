import { Scene, Geom, GameObjects } from "phaser";
import { BaseOverlay } from "./BaseOverlay";
import { Button } from "../ui/Button";
import { GameConfig, GameSettings } from "../config/GameConfig";
import { COLORS } from "../config/Theme";
import { Stepper } from "../ui/Stepper";

export class SettingsView extends BaseOverlay {
  private title: GameObjects.Text;
  private saveBtn: Button;
  private cancelBtn: Button;

  private draftSettings!: GameSettings;
  private sizeStepper!: Stepper;
  private varietyStepper!: Stepper;

  constructor(scene: Scene) {
    super(scene);

    // Initial clone of the global config
    this.copySettingsToDraft();
    this.createUI();

    // Listen for the open command.
    // We use 'on' and should ideally clean this up in a shutdown listener.
    const openHandler = () => {
      this.copySettingsToDraft();
      this.refreshUI();

      const fullRect = new Geom.Rectangle(
        0,
        0,
        this.scene.scale.width,
        this.scene.scale.height,
      );
      this.show(fullRect);
    };

    this.scene.events.on("UI_OPEN_SETTINGS", openHandler);

    // Cleanup to prevent memory leaks when scene is destroyed
    this.scene.events.once("shutdown", () => {
      this.scene.events.off("UI_OPEN_SETTINGS", openHandler);
    });
  }

  /**
   * Creates a deep copy of the current GameConfig using native structuredClone.
   */
  private copySettingsToDraft(): void {
    this.draftSettings = structuredClone(GameConfig);
  }

  /**
   * Initializes all UI components and adds them to the container.
   */
  private createUI(): void {
    this.title = this.scene.add
      .text(0, 0, "SETTINGS", {
        fontSize: "32px",
        color: COLORS.WHITE,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.saveBtn = new Button(this.scene, 0, 0, {
      text: "SAVE & RESTART",
      callback: () => this.applySettings(),
    });

    this.cancelBtn = new Button(this.scene, 0, 0, {
      text: "CLOSE",
      callback: () => this.hide(),
    });

    // Stepper for Grid Dimensions
    this.sizeStepper = new Stepper(this.scene, 0, 0, {
      label: "GRID SIZE",
      value: this.draftSettings.grid.size,
      min: GameConfig.grid.minSize,
      max: GameConfig.grid.maxSize,
      onChange: (val: number) => {
        this.draftSettings.grid.size = val;
        // No global event fired here to keep it draft-only
      },
    });

    // Stepper for Color/Symbol Variety
    this.varietyStepper = new Stepper(this.scene, 0, 0, {
      label: "TILE VARIETY",
      value: this.draftSettings.grid.variety,
      min: GameConfig.grid.minVariety,
      max: GameConfig.grid.maxVariety,
      onChange: (val: number) => {
        this.draftSettings.grid.variety = val;
      },
    });

    this.add([
      this.title,
      this.saveBtn,
      this.cancelBtn,
      this.sizeStepper,
      this.varietyStepper,
    ]);
  }

  /**
   * Handles layout and positioning for the overlay components.
   */
  public resize(rect: Geom.Rectangle): void {
    this.drawDimmer(rect);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Position Steppers
    this.sizeStepper.setPosition(centerX, centerY - 60);
    this.varietyStepper.setPosition(centerX, centerY + 60);

    // Position Title
    this.title.setPosition(centerX, 100);

    // Position Buttons (Bottom Area)
    const btnSpacing = 112; // Half of total gap + half button width
    this.saveBtn.setPosition(centerX + btnSpacing, rect.height - 100);
    this.saveBtn.resize(200, 50);

    this.cancelBtn.setPosition(centerX - btnSpacing, rect.height - 100);
    this.cancelBtn.resize(200, 50);
  }

  /**
   * Commits draft changes back to global GameConfig and triggers game restart.
   */
  private applySettings(): void {
    const newSize = this.draftSettings.grid.size;
    const newVariety = this.draftSettings.grid.variety;

    // Deep commit
    GameConfig.grid.size = newSize;
    GameConfig.grid.variety = newVariety;

    localStorage.setItem("match3_size", newSize.toString());
    localStorage.setItem("match3_variety", newVariety.toString());

    // Notify the game that configuration has officially changed
    this.scene.events.emit("SETTINGS_CHANGED", GameConfig);
    this.hide();
  }

  /**
   * Syncs the Stepper components with the current draft settings.
   */
  private refreshUI(): void {
    this.sizeStepper.setValue(this.draftSettings.grid.size);
    this.varietyStepper.setValue(this.draftSettings.grid.variety);
  }
}
