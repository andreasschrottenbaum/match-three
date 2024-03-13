import Phaser from 'phaser'

export default class GameOver extends Phaser.Scene {
  private gameOverText?: Phaser.GameObjects.Text

  constructor() {
    super('GameOverScene')
  }

  preload() {
    // this.load.image('gameover', 'assets/gameover.png')
    this.gameOverText = this.add
      .text(400, 300, '', {
        fontSize: '64px',
        color: '#fff',
      })
      .setOrigin(0.5)
  }

  create() {
    // this.add.image(400, 300, 'gameover')
    this.gameOverText?.setText('Game Over')
  }
}
