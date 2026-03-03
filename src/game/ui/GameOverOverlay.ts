import { Scene, GameObjects } from "phaser";

export class GameOverOverlay extends GameObjects.Container {
  constructor(scene: Scene, score: number, onRestart: () => void) {
    const { width, height } = scene.cameras.main;
    super(scene, 0, 0);

    this.setDepth(100).setAlpha(0);

    // 1. Background
    const overlay = scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0);

    // 2. Panel
    const panelW = Math.min(width * 0.8, 400);
    const panelH = 300;
    const panel = scene.add
      .rectangle(width / 2, height / 2, panelW, panelH, 0xffffff, 1)
      .setStrokeStyle(4, 0x4a90e2);

    // 3. Texts
    const title = scene.make
      .text({
        x: width / 2,
        y: height / 2 - 70,
        text: "NO MORE MOVES",
        style: {
          fontSize: "32px",
          color: "#333333",
          fontStyle: "bold",
        },
      })
      .setOrigin(0.5);

    const scoreText = scene.make
      .text({
        x: width / 2,
        y: height / 2,
        text: `Final Score: ${score}`,
        style: {
          fontSize: "24px",
          color: "#666666",
        },
      })
      .setOrigin(0.5);

    // 4. Restart Button
    const restartBtn = scene.make
      .text({
        x: width / 2,
        y: height / 2 + 80,
        text: "PLAY AGAIN",
        style: {
          fontSize: "28px",
          color: "#ffffff",
          backgroundColor: "#4a90e2",
          padding: { x: 20, y: 10 },
          fontStyle: "bold",
        },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () =>
        restartBtn.setStyle({ backgroundColor: "#357abd" }),
      )
      .on("pointerout", () =>
        restartBtn.setStyle({ backgroundColor: "#4a90e2" }),
      )
      .on("pointerdown", () => onRestart());

    // Add everything to the container
    this.add([overlay, panel, title, scoreText, restartBtn]);

    // Add the container to the scene
    scene.add.existing(this);

    // Fade-In Animation
    scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 500,
      ease: "Power2",
    });
  }
}
