import { Scene, Geom, GameObjects } from "phaser";
import { BaseOverlay } from "./BaseOverlay";
import { Button } from "../ui/Button";
import { GameConfig, GameSettings } from "../config/GameConfig";
import { Stepper } from "../ui/Stepper";
import { I18nService } from "../i18n/I18nService";
import { GameText } from "../ui/GameText";
import { COLORS, getNumColor } from "../config/Theme";

/**
 * The SettingsView provides a modal interface for adjusting game parameters
 * like grid size and tile variety. It uses a draft-commit pattern to prevent
 * accidental changes during gameplay.
 */
export class SettingsView extends BaseOverlay {
  /** Background panel for the settings elements */
  private panel: GameObjects.Graphics;
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
    this.sizeStepper.setLabelText(I18nService.t("GRID_SIZE"));
    this.varietyStepper.setLabelText(I18nService.t("TILE_VARIETY"));
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
    // Create the background panel first to ensure it's at the back
    this.panel = this.scene.add.graphics();

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
      this.panel,
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

    // 1. Calculate Panel Dimensions
    // Mobile: 90% width, 70% height | Desktop: max 500px width
    const panelWidth = Math.min(rect.width * 0.9, 500);
    const panelHeight = Math.min(rect.height * 0.7, 600);
    const panelX = (rect.width - panelWidth) / 2;
    const panelY = (rect.height - panelHeight) / 2;

    // 2. Draw the Panel Background
    this.panel.clear();
    this.panel.fillStyle(getNumColor(COLORS.UI_BG_DARK), 0.95);
    this.panel.lineStyle(4, getNumColor(COLORS.WHITE), 1);
    this.panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
    this.panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);

    const centerX = rect.width / 2;

    // 3. Update Title Position (top of panel)
    this.title.setPosition(centerX, panelY + panelHeight * 0.15);
    this.title.resize();

    // 4. Update Stepper Components (centered in panel)
    this.sizeStepper.setPosition(centerX, panelY + panelHeight * 0.4);
    this.sizeStepper.resize();

    this.varietyStepper.setPosition(centerX, panelY + panelHeight * 0.6);
    this.varietyStepper.resize();

    // 5. Update Action Buttons (bottom of panel)
    const btnSpacing = panelWidth * 0.25;
    const btnY = panelY + panelHeight - 60;
    const btnWidth = panelWidth / 2 - 40;

    this.saveBtn.setPosition(centerX + btnSpacing, btnY);
    this.saveBtn.resize(btnWidth, 50);

    this.cancelBtn.setPosition(centerX - btnSpacing, btnY);
    this.cancelBtn.resize(btnWidth, 50);

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
