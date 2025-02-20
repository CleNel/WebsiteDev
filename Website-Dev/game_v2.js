var player = {
    x: 500,
    y: 365,
    buddy: 42,
    speed: 12,
    isjumping: false,
    isright: 0,
    isleft: 0,
    jump: 200,
    grounded: false,
    fireDir: false,
    alive: true,
    revive: 0
}

var platform1 = {
    x: 169,
    y: 158,
    locx: 220,
    locy: 355
}

var platform2 = {
    x: 169,
    y: 158,
    locx: 100,
    locy: 355
}

var platform3 = {
    x: 169,
    y: 158,
    locx: 160,
    locy: 300
}

var platform4 = {
    x: 169,
    y: 158,
    locx: 270,
    locy: 280
}

var platform5 = {
    x: 169,
    y: 158,
    locx: 320,
    locy: 345
}

var platform6 = {
    x: 169,
    y: 158,
    locx: 380,
    locy: 300
}

var laser1 = {
    x: 117,
    y: 192,
    locx: 0,
    locy: 0,
    able: true,
    fired: false,
    fireDir: false
}

var laser2 = {
    x: 117,
    y: 192,
    locx: 0,
    locy: 0,
    able: true,
    fired: false,
    fireDir: false
}

var laser3 = {
    x: 117,
    y: 192,
    locx: 0,
    locy: 0,
    able: true,
    fired: false,
    fireDir: false
}

var enemy1 = {
    x: 168,
    y: 187,
    locx: 100,
    locy: 100,
    alive: false,
    wait: 5,
    location: 0,
    isjumping: false,
    jump: 200,
    grounded: false,
    speed: 1
}

var canvas = document.createElement("canvas");
var context = canvas.getContext("2d");
var sec = 30;
canvas.width = 600;
canvas.height = 400;
const STAND = 44;
const RIGHT = 125;
const LEFT = 84;
const JUMP = 206;
const PREP = 164;

var tick = 0;

var score = 0;
var lives = 3;
var gameover = true;
var gamestart = true;
var highscore = -1;
var ifStart = true;

mainImage = new Image();
mainImage.ready = false;
mainImage.onload = checkReady;
mainImage.src = "game-test7.png";

var keyclick = {};
document.addEventListener("keydown", function (event){
    keyclick[event.keyCode]=true;
    move(keyclick);
    console.log(keyclick);
}, false);
document.addEventListener("keyup", function (event){
    delete keyclick[event.keyCode];
}, false);

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("left").addEventListener("touchstart", function() {
        keyclick[37] = true;
        move(keyclick);
    }, false);
    document.getElementById("left").addEventListener("touchend", function() {
        delete keyclick[37];
    }, false);

    document.getElementById("right").addEventListener("touchstart", function() {
        keyclick[39] = true;
        move(keyclick);
    }, false);
    document.getElementById("right").addEventListener("touchend", function() {
        delete keyclick[39];
    }, false);

    document.getElementById("jump").addEventListener("touchstart", function() {
        keyclick[38] = true;
        move(keyclick);
    }, false);
    document.getElementById("jump").addEventListener("touchend", function() {
        delete keyclick[38];
    }, false);

    document.getElementById("space").addEventListener("touchstart", function() {
        keyclick[32] = true;
        move(keyclick);
    }, false);
    document.getElementById("space").addEventListener("touchend", function() {
        delete keyclick[32];
    }, false);

});

function move(keyclick){
    if (keyclick[37]){player.x -= player.speed;player.isleft = 4;
    }
    if (keyclick[38]){player.isjumping = true;
    }
    if (keyclick[39]){player.x += player.speed;player.isright = 4;
    }
    if (keyclick[32]){ 
        if(gameover){
            gameSetUp();
        }
        if(laser1.able){
            laser1.able = false;
        } else if(laser2.able){
            laser2.able = false;
        } else if(laser3.able){
            laser3.able = false;
        }
    }
    render();
}

function hitGroundPlayer(){
    player.jump = 200;
    player.isjumping = false;
    player.grounded = true;
}

function hitGroundEnemy1(){
    enemy1.jump = 200;
    enemy1.isjumping = false;
    enemy1.grounded = true;
}

function gameSetUp(){
    player.alive = false;
    enemy1.alive = false;
    lives = 3; 
    score = 0;
    sec = 30;
    gameover = false;
    gamestart = false;
}

function checkReady() {
    this.ready = true;
    playgame();
}
function playgame() {

    // PLAYER COLLISION DETECTION

    if((player.x + 30 >= enemy1.locx && player.x <= enemy1.locx + 40 && player.y + 30 >= enemy1.locy && player.y <= enemy1.locy + 40 && player.revive == 0) && player.revive == 0){
        lives--;
        player.alive = false;
        player.revive = 100;
    }

    // GAME OVER

    if(lives == 0 || sec == 0){
        gameover = true;
        if (score > highscore){
            highscore = score;
            ifHigh = true;
        } else {
            ifHigh = false;
        }
        sec = 30;
        lives = 3;
    }

    // RESPAWN

    if(player.revive > 0){
        player.revive--;
    }

    if (!enemy1.alive){
        if (enemy1.wait > 0){
            enemy1.wait--;
        } else {
            enemy1.alive = true;
            enemy1.wait = 40;
            enemy1.location = Math.floor(Math.random() * 4);
            switch (enemy1.location){
                case 0: enemy1.locx = platform1.locx + 10; enemy1.locy = platform1.locy - 45; break;
                case 1: enemy1.locx = platform2.locx + 10; enemy1.locy = platform2.locy - 45; break;
                case 2: enemy1.locx = platform3.locx + 10; enemy1.locy = platform3.locy - 45; break;
                case 3: enemy1.locx = platform4.locx + 10; enemy1.locy = platform4.locy - 45; break;
            }
        }
    }

    // OBJECT COLLISION DETECTION

    if(player.x + 29 > platform1.locx && player.x + 1 < platform1.locx + 56 && player.y + 31 == platform1.locy && !player.isjumping){
        hitGroundPlayer();
    } else if(player.x + 29 > platform2.locx && player.x + 1 < platform2.locx + 56 && player.y + 31 == platform2.locy && !player.isjumping){
        hitGroundPlayer();
    } else if(player.x + 29 > platform3.locx && player.x + 1 < platform3.locx + 56 && player.y + 31 == platform3.locy && !player.isjumping){
        hitGroundPlayer();
    } else if(player.x + 29 > platform4.locx && player.x + 1 < platform4.locx + 56 && player.y + 31 == platform4.locy && !player.isjumping){
        hitGroundPlayer();
    } else if(player.x + 29 > platform5.locx && player.x + 1 < platform5.locx + 56 && player.y + 31 == platform5.locy && !player.isjumping){
        hitGroundPlayer();
    } else if(player.x + 29 > platform6.locx && player.x + 1 < platform6.locx + 56 && player.y + 31 == platform6.locy && !player.isjumping){
        hitGroundPlayer();
    } else if(player.y + 31 == 400 && !player.isjumping){
        hitGroundPlayer();
    } else {
        player.grounded = false;
    }

    if(enemy1.locx + 29 > platform1.locx && enemy1.locx + 1 < platform1.locx + 56 && enemy1.locy + 40 == platform1.locy && !enemy1.isjumping){
        hitGroundEnemy1();
    } else if(enemy1.locx + 29 > platform2.locx && enemy1.locx + 1 < platform2.locx + 56 && enemy1.locy + 40 == platform2.locy && !enemy1.isjumping){
        hitGroundEnemy1();
    } else if(enemy1.locx + 29 > platform3.locx && enemy1.locx + 1 < platform3.locx + 56 && enemy1.locy + 40 == platform3.locy && !enemy1.isjumping){
        hitGroundEnemy1();
    } else if(enemy1.locx + 29 > platform4.locx && enemy1.locx + 1 < platform4.locx + 56 && enemy1.locy + 40 == platform4.locy && !enemy1.isjumping){
        hitGroundEnemy1();
    } else if(enemy1.locx + 29 > platform5.locx && enemy1.locx + 1 < platform5.locx + 56 && enemy1.locy + 40 == platform5.locy && !enemy1.isjumping){
        hitGroundEnemy1();
    } else if(enemy1.locx + 29 > platform6.locx && enemy1.locx + 1 < platform6.locx + 56 && enemy1.locy + 40 == platform6.locy && !enemy1.isjumping){
        hitGroundEnemy1();
    } else if(enemy1.locy + 40 == 400 && !enemy1.isjumping){
        hitGroundEnemy1();
    } else {
        enemy1.grounded = false;
    }

    // GRAVITY

    if(!enemy1.grounded && !enemy1.isjumping){
        enemy1.locy += 1;
    }

    if(!player.grounded && !player.isjumping){
        player.y++;
    }

    // PLAYER JUMPING

    if(player.isjumping){
        if(player.jump > 180){  
            player.buddy = PREP;
        } else if(player.jump > 160){
            player.buddy = JUMP;
        } else if (player.jump > 100){
            player.buddy = JUMP;
            player.y--;
            player.grounded == false;
        } else {
            player.buddy = STAND;
            player.isjumping = false;
        }
        player.jump--;
    } else {
        if(player.isleft){
            player.buddy = LEFT;
            player.isleft--;
            player.fireDir = true;
        } else if (player.isright){
            player.buddy = RIGHT;
            player.isright--;
            player.fireDir = false;
        } else {
            player.buddy = STAND;
        }
    }

    // ENEMY JUMPING

    if(enemy1.isjumping){
        if(enemy1.jump > 140){  
            enemy1.locy--;
        } else {
            enemy1.isjumping = false;
        }
        enemy1.jump--;
    }

    if(enemy1.isjumping){
        if(enemy1.jump > 100){  
            enemy1.locy--;
            enemy1.grounded == false;
        } else {
            enemy1.isjumping = false;
        }
        enemy1.jump--;
    }

    // LASER MOVEMENT

    if(!laser1.able){
        if(!laser1.fired){
            laser1.fired = true;
            laser1.locx = player.x + 25;
            laser1.locy = player.y + 10;
            if(player.fireDir){
                laser1.fireDir = false;
            } else {
                laser1.fireDir = true;
            }
        }
        if(laser1.fireDir){
            laser1.locx += 10;
            if(laser1.locx > 600){
                laser1.able = true;
                laser1.fired = false;
            }
        } else {
            laser1.locx -= 10;
            if(laser1.locx < 0){
                laser1.able = true;
                laser1.fired = false;
            }
        }
    }
    if(!laser2.able){
        if(!laser2.fired){
            laser2.fired = true;
            laser2.locx = player.x + 25;
            laser2.locy = player.y + 10;
            if(player.fireDir){
                laser2.fireDir = false;
            } else {
                laser2.fireDir = true;
            }
        }
        if(laser2.fireDir){
            laser2.locx += 10;
            if(laser2.locx > 600){
                laser2.able = true;
                laser2.fired = false;
            }
        } else {
            laser2.locx -= 10;
            if(laser2.locx < 0){
                laser2.able = true;
                laser2.fired = false;
            }
        }
    }
    if(!laser3.able){
        if(!laser3.fired){
            laser3.fired = true;
            laser3.locx = player.x + 25;
            laser3.locy = player.y + 10;
            if(player.fireDir){
                laser3.fireDir = false;
            } else {
                laser3.fireDir = true;
            }
        }
        if(laser3.fireDir){
            laser3.locx += 10;
            if(laser3.locx > 600){
                laser3.able = true;
                laser3.fired = false;
            }
        } else {
            laser3.locx -= 10;
            if(laser3.locx < 0){
                laser3.able = true;
                laser3.fired = false;
            }
        }
    }

    // LASER COLLISION

    if(laser1.locx + 10 > enemy1.locx && laser1.locx < enemy1.locx + 29 && laser1.locy + 10 > enemy1.locy && laser1.locy < enemy1.locy + 40){
        laser1.able = true;
        laser1.fired = false;
        laser1.locy = -100;
        enemy1.alive = false;
        enemy1.locx = -100;
        score++;
    } else if(laser2.locx + 10 > enemy1.locx && laser2.locx < enemy1.locx + 29 && laser2.locy + 10 > enemy1.locy && laser2.locy < enemy1.locy + 40){
        laser2.able = true;
        laser2.fired = false;
        laser2.locy = -100;
        enemy1.alive = false;
        enemy1.locx = -100;
        score++;
    } else if(laser3.locx + 10 > enemy1.locx && laser3.locx < enemy1.locx + 29 && laser3.locy + 10 > enemy1.locy && laser3.locy < enemy1.locy + 40){
        laser3.able = true;
        laser3.fired = false;
        laser3.locy = -100;
        enemy1.alive = false;
        enemy1.locx = -100;
        score++;
    }

    // ENEMY MOVEMENT

    if(tick % 3 == 0){
        if(enemy1.locx < player.x){
            enemy1.locx += enemy1.speed;
        } else if (enemy1.locx > player.x){
            enemy1.locx -= enemy1.speed;
        }
    } else if(enemy1.grounded && Math.abs(enemy1.locx - player.x) > 100){
        enemy1.isjumping = true;
    }

    // TICK + TIME

    tick++;
    if(tick == 70){
        if(!gameover){
            sec--;
        }
        tick = 0;
    }

    // RENDER FRAMES

    render();
    requestAnimationFrame(playgame);
}

function render() {
    if(!gamestart){
        if(!gameover){

            // CANVAS

            context.fillStyle = "white"; 
            context.fillRect(0, 0, canvas.width, canvas.height);

            // PLAYER

            if(player.alive){
                context.drawImage(mainImage, player.buddy, 73, 30, 30, player.x, player.y, 30, 30);
            } else {
                if(enemy1.locx > 300){
                    player.x = 50;
                    player.y = 365;
                } else {
                    player.x = 500;
                    player.y = 365;
                }
                player.alive = true;
            }

            // PLATFORMS

            context.drawImage(mainImage, platform1.x, platform1.y, 56, 19, platform1.locx, platform1.locy, 56, 19);
            context.drawImage(mainImage, platform2.x, platform2.y, 56, 19, platform2.locx, platform2.locy, 56, 19);
            context.drawImage(mainImage, platform3.x, platform3.y, 56, 19, platform3.locx, platform3.locy, 56, 19);
            context.drawImage(mainImage, platform4.x, platform4.y, 56, 19, platform4.locx, platform4.locy, 56, 19);
            context.drawImage(mainImage, platform5.x, platform5.y, 56, 19, platform5.locx, platform5.locy, 56, 19);
            context.drawImage(mainImage, platform6.x, platform6.y, 56, 19, platform6.locx, platform6.locy, 56, 19);

            // ENEMY

            if(enemy1.alive){
                context.drawImage(mainImage, enemy1.x, enemy1.y, 58, 64, enemy1.locx, enemy1.locy, 40, 40);
            }

            if(!laser1.able){
                context.drawImage(mainImage, laser1.x, laser1.y, 6, 6, laser1.locx, laser1.locy, 6, 6);
            }
            if(!laser2.able){
                context.drawImage(mainImage, laser2.x, laser2.y, 6, 6, laser2.locx, laser2.locy, 6, 6);
            }
            if(!laser3.able){
                context.drawImage(mainImage, laser3.x, laser3.y, 6, 6, laser3.locx, laser3.locy, 6, 6);
            } 

            // UI

            context.font = "20px Verdana";
            context.fillStyle = "black";
            context.fillText("Score: "+score, 8, 20);
            context.fillText("Lives: "+lives, canvas.width-95, 20);
            context.fillText("Time: "+sec, canvas.width/2 - 50, 20);
        } else {

            // GAME OVER

            context.fillStyle = "white"; 
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = "50px Verdana";
            context.fillStyle = "black";
            context.fillText("Game Over", 150, 100);
            if(ifHigh){
                context.fillText("New Highscore!", 100, 200);
                context.fillText("Score: "+score, 170, 250);
            } else {
                context.fillText("Highscore: "+highscore, 100, 200);
                context.fillText("Score: "+score, 170, 250);
            }
            context.fillText("Press Space to Play Again", 50, 340, 500);
            enemy1.alive = false;
        }
    } else {

        // GAME START

        context.fillStyle = "white"; 
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = "50px Verdana";
        context.fillStyle = "black";
        context.fillText("Press Space to Start", 50, 200);
    }
}

document.body.appendChild(canvas);