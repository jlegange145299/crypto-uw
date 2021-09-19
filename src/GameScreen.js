import React, { Component } from 'react';
import Phaser from 'phaser';
import serverURL from './constansts';
import './App.css';

var game;
//var balloonCount = getRandomInt(3,5);
var balloonCount = 5;
var balloonDirection = [];
var balloonSpeed = [];
var balloonAngular = [];
var balloonPosition = [];
var balloonStart = [];

var balloons = [];
var canClick = [];
var texts = [];
var toShowText = [];
for(var i = 0; i < balloonCount; i++)
{
  canClick.push(true);
  toShowText.push(false);
}

class GameScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      game: null,
    }

    //this.create = this.create.bind(this);
  }

  preload() {
    this.load.image('background', './phaser/Background.png');
    //this.load.image('balloon', './phaser/Balloon Pop.png');
    this.load.spritesheet('balloon',
      './phaser/Balloon Pop.png',
      { frameWidth: 390, frameHeight: 481 }
    );
    this.load.image('cloudBack', './phaser/Clouds_03_Back.png');
    this.load.image('cloudMid', './phaser/Clouds_02_Middle.png');
    this.load.image('cloudFront', './phaser/Clouds_01_Front.png');
  }

  create() {
    //console.log(game);
    //game.stage.backgroundColor = "#4488AA";
    let bg = this.add.sprite(0, 0, 'background');
    bg.displayWidth = window.innerWidth;
    bg.displayHeight = window.innerHeight;
    bg.setOrigin(0, 0);

    this.cloudBack = this.add.tileSprite(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 'cloudBack');
    this.cloudBack.setScale(1);
    this.cloudBack.tileScaleX = 0.5;
    this.cloudBack.tileScaleY = 0.6;

    this.cloudMid = this.add.tileSprite(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 'cloudMid');
    this.cloudMid.setScale(1);
    this.cloudMid.tileScaleX = 0.5;
    this.cloudMid.tileScaleY = 0.6;

    this.cloudFront = this.add.tileSprite(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 'cloudFront');
    this.cloudFront.setScale(1);
    this.cloudFront.tileScaleX = 0.5;
    this.cloudFront.tileScaleY = 0.6;

    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('balloon', { start: 0, end: 0 }),
      frameRate: 64
      //repeat: -1
    });

    this.anims.create({
      key: 'pop',
      frames: this.anims.generateFrameNumbers('balloon', { start: 0, end: 16 }),
      frameRate: 64
      //repeat: -1
    });

    var style = { font: "32px Arial", fill: "#FFFFFF"};


    fetch(serverURL + 'getballoon/',
      {
        method: 'get',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }).then(response => response.json())
      .then(data => {
        balloonAngular = data.angular;
        balloonSpeed = data.speed;
        balloonPosition = data.position;
        balloonDirection = data.direction;
        balloonStart = data.start;

        for (let i = 0; i < balloonCount; i++) {
          let balloon = this.physics.add.sprite(balloonPosition[i].x * window.innerWidth, balloonPosition[i].y * window.innerHeight, 'balloon', { ignoreGravity: false }).setInteractive();
          balloons.push(balloon);
          let text = this.add.text(0, 0, "", style);          
          text.setStroke("#de77ae", 6)
          text.setShadow(2, 2, "#333333", 3, true, true);
          texts.push(text);

          balloons[i].displayWidth = 140;
          balloons[i].displayHeight = 200;

          balloons[i].body.allowGravity = false;
          balloons[i].setBounce(0, 0);
          balloons[i].setAcceleration(0, 0);
          balloons[i].setCollideWorldBounds(false);
          balloons[i].body.setGravityY(0);
          balloons[i].setVelocity(0, 0);
          balloons[i].body.angularVelocity = balloonAngular[i];
          balloons[i].body.angularDrag = 0;
          balloons[i].on('pointerdown', function (e) {
            let p = e.downElement.closest(".Chat");
            if (p !== null || !canClick[i] || e.downElement.className == "quitButton")
            {
              return;
            }
            if (game.started) {
              canClick[i] = false;
              toShowText[i] = true;
              game.clickBalloon(i,texts[i]);
              setTimeout(function(){
                toShowText[i] = false;
                texts[i].setText("");
              },500);
            }
          });
        }
      }).catch(function (err) {
        console.log(err)
      });
  }


  update() {
    this.cloudBack.tilePositionX -= 0.15;
    this.cloudMid.tilePositionX += 0.3;
    this.cloudFront.tilePositionX -= 0.75;
    if(balloons.length == balloonCount)
    {
      for (let i = 0; i < balloonCount; i++) {
        balloons[i].x = window.innerWidth * balloonPosition[i].x;
        balloons[i].y = window.innerHeight * balloonPosition[i].y;

        balloonPosition[i].x += balloonDirection[i].x * balloonSpeed[i].x;
        balloonPosition[i].y += balloonDirection[i].y * balloonSpeed[i].y;
        if (balloonPosition[i].x > 1) {
          balloonPosition[i].x = 0;
        }
        else if (balloonPosition[i].x < 0) {
          balloonPosition[i].x = 1;
        }
        if (balloonPosition[i].y < 0) {
          balloonPosition[i].y = balloonStart[i].y;
          balloonPosition[i].x = balloonPosition[i].x;
          balloonDirection[i].x = balloonDirection[i].x * -1;
        }
        balloons[i].setVelocity(0, 0);
        if(!toShowText[i])
        {
          texts[i].x = balloons[i].x-10;
          texts[i].y = balloons[i].y-10;
        }
      }
    }
  }


  componentWillReceiveProps(nextProps) {
    game.clickBalloon = nextProps.clickBalloon;
    game.started = nextProps.gameStarted;
  }

  componentDidMount() {
    let gameScene = new Phaser.Scene(game);
    var config = {
      type: Phaser.AUTO,
      parent: 'phaser-parent',
      pixelArt: false,
      backgroundColor: 'rgba(176, 55, 110,0.5)',
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 200 },
          debug: false
        }
      },
      scene: {
        preload: this.preload,
        create: this.create,
        update: this.update
      }
    };
    game = new Phaser.Game(config);
    game.clickBalloon = this.props.clickBalloon;
    game.started = this.props.gameStarted;

    this.props.socket.on("POP", data => {
      var index = data.index;

      balloons[index].play("pop");
      balloons[index].on('animationcomplete', (animation, frame) => {
        if (animation.key == "pop") {
          balloons[index].anims.play("idle", true);
          canClick[index] = true;
        }
      }, this);
    });
    this.props.socket.on("RESETBALLOON",data=>{
      var index = data.index;
      balloonSpeed[index] = data.speed[index];
      balloonPosition[index] = data.position[index];
      balloonDirection[index] = data.direction[index];
    });
  }


  render() {
    return (
      <section id="phaser-parent">
      </section>
    );
  }
}

export default GameScreen;
