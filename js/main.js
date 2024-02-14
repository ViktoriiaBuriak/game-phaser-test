const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image('sky', './images/sky.png');
  this.load.image('ground', './images/platform.png');
  this.load.image('star', './images/star.png');
  this.load.image('bomb', './images/bomb.png');
  this.load.spritesheet('dude', './images/dude.png', {
    frameWidth: 32,
    frameHeight: 48,
  });

  this.load.audio('bg', './audio/background.mp3');
  this.load.audio('gameOver', './audio/game-over.mp3');
  this.load.audio('jump', './audio/jump.mp3');
  this.load.audio('collectStar', './audio/star.mp3');
  this.load.audio('win', './audio/win.mp3');
}

let platforms;
let player;
let stars;

let score = 0;
let scoreText;

let level = 1;
let levelText;

let bombs;
let bgMusic;

function create() {
  this.add.image(400, 300, 'sky');

  bgMusic = this.sound.add('bg');
  bgMusic.play();

  platforms = this.physics.add.staticGroup();

  platforms.create(400, 568, 'ground').setScale(2).refreshBody();

  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  player = this.physics.add.sprite(100, 450, 'dude');

  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: 'turn',
    frames: [{ key: 'dude', frame: 4 }],
    frameRate: 20,
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  this.physics.add.collider(player, platforms);

  stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  this.physics.add.collider(stars, platforms);

  this.physics.add.overlap(player, stars, collectStar, null, this);

  levelText = this.add.text(16, 50, 'level: ' + level, {
    fontSize: '32px',
    fill: '#000',
  });

  scoreText = this.add.text(16, 16, 'score: 0', {
    fontSize: '32px',
    fill: '#000',
  });

  bombs = this.physics.add.group();

  this.physics.add.collider(bombs, platforms);

  this.physics.add.collider(player, bombs, hitBomb, null, this);

  const width = this.cameras.main.width;

  const pauseButton = this.add
    .text(width - 16, 16, '\u2758 \u2758 Pause', {
      fontSize: '24px',
      fill: '#fff',
    })
    .setOrigin(1, 0);
  pauseButton.setInteractive();

  pauseButton.on(
    'pointerup',
    () => {
      this.physics.pause();
      this.anims.pauseAll();
      this.sound.pauseAll();
      pauseButton.visible = false;
      playButton.visible = true;
    },
    this
  );

  this.input.keyboard.on(
    'keydown-SPACE',
    () => {
      if (!this.physics.world.isPaused) {
        this.physics.pause();
        this.anims.pauseAll();
        this.sound.pauseAll();
        pauseButton.visible = false;
        playButton.visible = true;
      } else {
        this.physics.resume();
        this.anims.resumeAll();
        this.sound.resumeAll();
        pauseButton.visible = true;
        playButton.visible = false;
      }
    },
    this
  );

  const playButton = this.add
    .text(width - 16, 16, '\u25B6 Play', {
      fontSize: '24px',
      fill: '#fff',
    })
    .setOrigin(1, 0);
  playButton.visible = false;
  playButton.setInteractive();

  playButton.on(
    'pointerup',
    () => {
      this.physics.resume();
      this.anims.resumeAll();
      this.sound.resumeAll();
      playButton.visible = false;
      pauseButton.visible = true;
    },
    this
  );
}

let cursors;

function update() {
  cursors = this.input.keyboard.createCursorKeys();
  if (cursors.left.isDown) {
    player.setVelocityX(-160);

    player.anims.play('left', true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);

    player.anims.play('right', true);
  } else {
    player.setVelocityX(0);

    player.anims.play('turn');
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);

    this.sound.play('jump');
  }
}

function collectStar(player, star) {
  star.disableBody(true, true);

  this.sound.play('collectStar');

  score += 10;
  scoreText.setText('score: ' + score);

  if (stars.countActive(true) === 0) {
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    level++;
    levelText.setText('level: ' + level);

    if (level === 10) {
      const winText = this.add.text(400, 300, 'You Win!', {
        fontSize: '48px',
        fill: '#00ff00',
      });
      winText.setOrigin(0.5);

      bgMusic.stop();

      this.sound.play('win');

      setTimeout(() => {
        this.scene.restart();
      }, 2000);

      level = 1;
      score = 0;
    } else {
      const x =
        player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      const bomb = bombs.create(x, 16, 'bomb');
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
  }
}

let gameOver = false;

function hitBomb(player, bomb) {
  this.physics.pause();

  player.setTint(0xff0000);

  player.anims.play('turn');

  gameOver = true;

  const gameOverText = this.add.text(400, 300, 'Game Over', {
    fontSize: '48px',
    fill: '#ff0000',
  });
  gameOverText.setOrigin(0.5);

  bgMusic.stop();

  this.sound.play('gameOver');

  setTimeout(() => {
    gameOverText.destroy();
    this.scene.restart();
  }, 2000);

  level = 1;
  score = 0;
}
