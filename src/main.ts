import Phaser from 'phaser'
import config from './config'
import Tutorial from './scenes/Tutorial'
import GameOver from './scenes/GameOver'

new Phaser.Game({
  ...config,
  scene: [Tutorial, GameOver],
})
