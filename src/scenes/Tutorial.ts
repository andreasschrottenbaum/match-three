import Phaser from 'phaser';

export default class Demo extends Phaser.Scene {
	private platforms?: Phaser.Physics.Arcade.StaticGroup;
	private player?: Phaser.Physics.Arcade.Sprite;
	private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

	private stars?: Phaser.Physics.Arcade.Group;
	private score: number = 0;
	private scoreText?: Phaser.GameObjects.Text;

	private fps: number = 0;
	private fpsText?: Phaser.GameObjects.Text;

	private bombs?: Phaser.Physics.Arcade.Group;
	private gameOver: boolean = false;
	private gameOverText?: Phaser.GameObjects.Text;

	constructor() {
		super('TutorialScene');
	}

	preload() {
		this.load.image('bomb', 'assets/bomb.png');
		this.load.image('platform', 'assets/platform.png');
		this.load.image('sky', 'assets/sky.png');
		this.load.image('star', 'assets/star.png');
		this.load.spritesheet('dude', 'assets/dude.png', {
			frameWidth: 32,
			frameHeight: 48
		});
	}

	create() {
		this.add.image(400, 300, 'sky');

		this.fpsText = this.add.text(10, 10, '', {
			fontSize: '16px',
			color: '#fff'
		});

		this.scoreText = this.add.text(10, 26, 'Score: 0', {
			fontSize: '32px',
			color: '#fff'
		});

		this.gameOverText = this.add
			.text(400, 300, '', {
				fontSize: '64px',
				color: '#fff'
			})
			.setOrigin(0.5);

		this.platforms = this.physics.add.staticGroup();

		this.platforms.create(400, 568, 'platform').setScale(2).refreshBody();

		this.platforms.create(600, 400, 'platform');
		this.platforms.create(50, 250, 'platform');
		this.platforms.create(750, 220, 'platform');

		this.player = this.physics.add.sprite(100, 450, 'dude');

		this.player?.setBounce(0.5);
		this.player?.setCollideWorldBounds(true);
		this.player?.setGravityY(300);

		this.physics.add.collider(this.player, this.platforms);

		this.anims.create({
			key: 'left',
			frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'turn',
			frames: [{ key: 'dude', frame: 4 }]
		});

		this.anims.create({
			key: 'right',
			frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
			frameRate: 10,
			repeat: -1
		});

		this.cursors = this.input.keyboard?.createCursorKeys();

		this.stars = this.physics.add.group({
			key: 'star',
			repeat: 11, //                                   ⬇️
			setXY: { x: 15, y: 0, stepX: 70 } // 15 + (70 * 11)	+ 15 = 800
		});

		this.stars.children.iterate((child) => {
			const c = child as Phaser.Physics.Arcade.Image;
			c.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
			return null;
		});

		this.physics.add.collider(this.stars, this.platforms);
		this.physics.add.overlap(this.player, this.stars, this._collectStar, undefined, this);

		this.bombs = this.physics.add.group();

		this.physics.add.collider(this.bombs, this.platforms);
		this.physics.add.collider(this.player, this.bombs, this._hitBomb, undefined, this);
	}

	update(_unused: unknown, delta: number): void {
		this.fps = Math.round(1000 / (delta || 1));

		this.fpsText?.setText(`FPS: ${this.fps}`);

		if (this.gameOver) return;

		if (this.cursors?.left?.isDown) {
			this.player?.setVelocityX(-160);

			this.player?.anims.play('left', true);
		} else if (this.cursors?.right?.isDown) {
			this.player?.setVelocityX(160);

			this.player?.anims.play('right', true);
		} else {
			this.player?.setVelocityX(0);

			this.player?.anims.play('turn');
		}

		if (this.cursors?.up?.isDown && this.player?.body?.touching.down) {
			this.player?.setVelocityY(-330);
		}

		if (this.cursors?.space?.isDown) {
			this.player?.setVelocityY(-330);
		}
	}

	private _collectStar(
		_unused: unknown,
		star: Phaser.GameObjects.GameObject | Phaser.Tilemaps.Tile
	) {
		this.score += 10;

		star.disableBody(true, true);

		this.scoreText?.setText(`Score: ${this.score}`);
		if (star instanceof Phaser.Physics.Arcade.Image) {
			star.disableBody(true, true);
		}

		if (this.stars?.countActive(true) === 0) {
			this.stars?.children.iterate((child) => {
				const c = child as Phaser.Physics.Arcade.Image;
				c.enableBody(true, c.x, 0, true, true);
				return null;
			});

			const x =
				this.player?.x || 0 < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

			const bomb = this.bombs?.create(x, 16, 'bomb');
			bomb.setBounce(1);
			bomb.setCollideWorldBounds(true);
			bomb.setVelocity(Phaser.Math.Between(-200, 200));
		}
	}

	private _hitBomb() {
		this.physics.pause();

		this.player?.setTint(0xff0000);

		this.player?.anims.play('turn');

		this._gameOver();
	}

	private _gameOver() {
		this.gameOver = true;

		this.gameOverText?.setText('Game Over');

		this.scene.transition({
			target: 'GameOverScene',
			duration: 2000,
			sleep: true
		});
	}
}
