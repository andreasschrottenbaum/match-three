import { Scene, GameObjects } from "phaser";
import Constants from "../config/Constants";

/**
 * Shared utility for creating consistent UI elements.
 * Uses the project's Constants and typography rules.
 */
export class UIUtils {
  /**
   * Creates a text object with the global default style.
   */
  public static addText(
    scene: Scene,
    x: number,
    y: number,
    content: string,
    size: string = "32px",
  ): GameObjects.Text {
    return scene.add
      .text(x, y, content, {
        ...Constants.DEFAULT_FONT,
        fontSize: size,
      })
      .setOrigin(0.5);
  }

  /**
   * Creates a stylized button with dynamic width, rounded corners, and a 3D bevel effect.
   */
  public static createButton(
    scene: Scene,
    x: number,
    y: number,
    label: string,
    callback: () => void,
  ): GameObjects.Container {
    // 1. Setup text first to calculate dynamic dimensions
    const text = scene.add
      .text(0, 0, label, {
        ...Constants.DEFAULT_FONT,
        fontSize: "26px",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);

    // 2. Define dynamic dimensions based on text width (with padding)
    const padding = 40;
    const btnWidth = Math.max(text.width + padding, 60); // Minimum width for +/- buttons
    const btnHeight = 60;
    const cornerRadius = 12;
    const btnColor = 0xffcc00;
    const shadowColor = 0xcca300;

    // 3. Draw the 3D shadow/bottom part
    const shadow = scene.add.graphics();
    shadow.fillStyle(shadowColor, 1);
    shadow.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2 + 5,
      btnWidth,
      btnHeight,
      cornerRadius,
    );

    // 4. Draw the main button surface
    const bg = scene.add.graphics();
    bg.fillStyle(btnColor, 1);
    bg.fillRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      cornerRadius,
    );

    // 5. Create transparent hit area for interaction
    const hitArea = scene.add
      .rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const container = scene.add.container(x, y, [shadow, bg, hitArea, text]);

    // 6. Define interaction logic (Press/Release/Hover)
    hitArea.on("pointerdown", () => {
      // Visual feedback: push button "down" towards the shadow
      scene.tweens.add({
        targets: [bg, text],
        y: 4,
        duration: 50,
      });
      if (navigator.vibrate) navigator.vibrate(10);
    });

    hitArea.on("pointerup", () => {
      // Bounce back and trigger callback
      scene.tweens.add({
        targets: [bg, text],
        y: 0,
        duration: 100,
        ease: "Back.easeOut",
        onComplete: callback,
      });
    });

    hitArea.on("pointerover", () => {
      // Brighten color on hover
      bg.clear();
      bg.fillStyle(0xffe066, 1);
      bg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        cornerRadius,
      );
    });

    hitArea.on("pointerout", () => {
      // Restore original color and position
      bg.clear();
      bg.fillStyle(btnColor, 1);
      bg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        cornerRadius,
      );
      scene.tweens.add({ targets: [bg, text], y: 0, duration: 100 });
    });

    return container;
  }
}
