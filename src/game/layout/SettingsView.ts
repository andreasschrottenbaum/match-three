import { Scene, Geom } from "phaser";
import { BaseOverlay } from "./BaseOverlay";
import { Button } from "../ui/Button";
import { GameConfig, GameSettings } from "../config/GameConfig";
import { Stepper } from "../ui/Stepper";
import { I18nService } from "../i18n/I18nService";
import { GameText } from "../ui/GameText";

/**
 * The SettingsView provides a modal interface for adjusting game parameters
 * like grid size and tile variety. It uses a draft-commit pattern to prevent
 * accidental changes during gameplay.
 */
export class SettingsView extends BaseOverlay {
  /** Title text at the top of the overlay */
  private title: GameText;
  /** Button to apply changes and restart the game board */
  private saveBtn: Button;
  /** Button to close the overlay without saving */
  private cancelBtn: Button;

  /** Local copy of settings to allow "Cancel" without side effects */
  private draftSettings!: GameSettings;
  /** Stepper component for adjusting grid dimensions (N x N) */
  private sizeStepper!: Stepper;
  /** Stepper component for adjusting the number of different tile types */
  private varietyStepper!: Stepper;

  /**
   * @param scene - The Phaser Scene instance.
   */
  constructor(scene: Scene) {
    super(scene);

    // Initial sync with the global configuration
    this.copySettingsToDraft();
    this.createUI();

    // 1. Setup the Open Handler
    const openHandler = () => {
      this.copySettingsToDraft();
      this.refreshUI();

      // Define bounds for the overlay (Full Screen)
      const fullRect = new Geom.Rectangle(
        0,
        0,
        this.scene.scale.width,
        this.scene.scale.height,
      );
      this.show(fullRect);
    };

    // 2. Setup the Global Settings Change Handler (for I18n updates)
    const settingsChangedHandler = () => {
      this.updateLocalization();
    };

    // 3. Attach Listeners
    this.scene.events.on("UI_OPEN_SETTINGS", openHandler);
    this.scene.events.on("SETTINGS_CHANGED", settingsChangedHandler);

    // 4. Proper Cleanup to prevent memory leaks on scene shutdown
    this.scene.events.once("shutdown", () => {
      this.scene.events.off("UI_OPEN_SETTINGS", openHandler);
      this.scene.events.off("SETTINGS_CHANGED", settingsChangedHandler);
    });
  }

  /**
   * Creates a deep copy of the current GameConfig using structuredClone.
   */
  private copySettingsToDraft(): void {
    this.draftSettings = structuredClone(GameConfig);
  }

  /**
   * Updates all UI text elements when the language or settings are changed.
   */
  private updateLocalization(): void {
    this.title.setText(I18nService.t("SETTINGS"));
    this.sizeStepper.setText(I18nService.t("GRID_SIZE"));
    this.varietyStepper.setText(I18nService.t("TILE_VARIETY"));
    this.saveBtn.setText(I18nService.t("SAVE_RESTART"));
    this.cancelBtn.setText(I18nService.t("CLOSE"));

    // Explicitly trigger resize to handle potentially longer translated strings
    if (this.isShown && this.scene.scale.gameSize) {
      this.resize(
        new Geom.Rectangle(
          0,
          0,
          this.scene.scale.width,
          this.scene.scale.height,
        ),
      );
    }
  }

  /**
   * Initializes all UI components and adds them to the overlay container.
   */
  private createUI(): void {
    this.title = new GameText(this.scene, I18nService.t("SETTINGS")).setOrigin(
      0.5,
    );

    this.saveBtn = new Button(this.scene, 0, 0, {
      text: I18nService.t("SAVE_RESTART"),
      callback: () => this.applySettings(),
    });

    this.cancelBtn = new Button(this.scene, 0, 0, {
      text: I18nService.t("CLOSE"),
      callback: () => this.hide(),
    });

    // Grid Size Stepper logic
    this.sizeStepper = new Stepper(this.scene, 0, 0, {
      label: I18nService.t("GRID_SIZE"),
      value: this.draftSettings.grid.size,
      min: GameConfig.grid.minSize,
      max: GameConfig.grid.maxSize,
      onChange: (val: number) => {
        this.draftSettings.grid.size = val;
      },
    });

    // Tile Variety Stepper logic
    this.varietyStepper = new Stepper(this.scene, 0, 0, {
      label: I18nService.t("TILE_VARIETY"),
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
   * Orchestrates the layout of the settings menu elements.
   * Ensures that all GameText and interactive components remain responsive.
   *
   * @param rect - The bounding rectangle provided by the LayoutManager.
   */
  public resize(rect: Geom.Rectangle): void {
    // Render the base dimmer from BaseOverlay
    this.drawDimmer(rect);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 1. Update Title Position & Size
    this.title.setPosition(centerX, rect.height * 0.15);
    this.title.resize();

    // 2. Update Stepper Components
    this.sizeStepper.setPosition(centerX, centerY - 60);
    this.sizeStepper.resize();

    this.varietyStepper.setPosition(centerX, centerY + 60);
    this.varietyStepper.resize();

    // 3. Update Action Buttons
    const bottomPadding = 100;
    const btnSpacing = 115;

    this.saveBtn.setPosition(centerX + btnSpacing, rect.height - bottomPadding);
    this.saveBtn.resize(210, 60);

    this.cancelBtn.setPosition(
      centerX - btnSpacing,
      rect.height - bottomPadding,
    );
    this.cancelBtn.resize(210, 60);

    // Ensure the input blocking zone is updated in the base class
    if (this.isShown) {
      this.setInteractive(rect, Geom.Rectangle.Contains);
    }
  }

  /**
   * Commits the draft changes to the global GameConfig and persists them to localStorage.
   * Emits a SETTINGS_CHANGED event to trigger a game reset.
   */
  private applySettings(): void {
    const { size, variety } = this.draftSettings.grid;

    // Update global config object
    GameConfig.grid.size = size;
    GameConfig.grid.variety = variety;

    // Persist user preferences
    localStorage.setItem("match3_size", size.toString());
    localStorage.setItem("match3_variety", variety.toString());

    // Notify subsystems (Content, UI, etc.) to reload with new configuration
    this.scene.events.emit("SETTINGS_CHANGED", GameConfig);
    this.hide();
  }

  /**
   * Synchronizes the Stepper visual values with the current draft state.
   */
  private refreshUI(): void {
    this.sizeStepper.setValue(this.draftSettings.grid.size);
    this.varietyStepper.setValue(this.draftSettings.grid.variety);
  }
}
