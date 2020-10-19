const KEY_CODE_LEFT = 37;
const KEY_CODE_RIGHT = 39;
const KEY_CODE_SPACE = 32;

const PLAYER_WIDTH = 20;
const PLAYER_MAX_SPEED = 600;

const LASER_MAX_SPEED = 300;
const LASER_COOLDOWN = 0.3;

const ENEMIES_PER_ROW = 10;
const ENEMY_HORIZONTAL_PADDING = 80;
const ENEMY_VERTICAL_PADDING = 70;
const ENEMY_VERTICAL_SPACING = 80;
const ENEMY_COOLDOWN = 4.0;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GAME_STATE = {
    lastTime: Date.now(),
    leftPressed: false,
    rightPressed: false,
    spacePressed: false,
    playerX: 0,
    playerY: 0,
    playerCooldown: 0,
    lasers: [],
    enemies: [],
    enemyLasers: []
}

function hitTest(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

function setPosition($el, x, y) {
    $el.style.transform = `translate(${x}px, ${y}px)`;
}

function clamp(v, min, max) {
    if (v < min) {
        return min;
    }
    if (v > max) {
        return max;
    }
    return v;
}

function rand(min, max) {
    if (min === undefined) min = 0;
    if (max === undefined) max = 1;
    return min + Math.random() * (max - min);
}

// Player

function createPlayer($container) {
    GAME_STATE.playerX = GAME_WIDTH / 2;
    GAME_STATE.playerY = GAME_HEIGHT - 50;
    const $player = document.createElement("img");
    $player.src = "img/player-blue-1.png";
    $player.className = "player";
    $container.appendChild($player);
    setPosition($player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function updatePlayer(dt, $container) {
    if (GAME_STATE.leftPressed) {
        GAME_STATE.playerX -= dt * PLAYER_MAX_SPEED;
    }
    if (GAME_STATE.rightPressed) {
        GAME_STATE.playerX += dt * PLAYER_MAX_SPEED;
    }
    GAME_STATE.playerX = clamp(GAME_STATE.playerX, PLAYER_WIDTH, GAME_WIDTH - PLAYER_WIDTH);
    const $player = document.querySelector(".player");
    setPosition($player, GAME_STATE.playerX, GAME_STATE.playerY);

    if (GAME_STATE.spacePressed && GAME_STATE.playerCooldown <= 0) {
        createLaser($container, GAME_STATE.playerX, GAME_STATE.playerY);
        GAME_STATE.playerCooldown = LASER_COOLDOWN;
    }
    if (GAME_STATE.playerCooldown > 0) {
        GAME_STATE.playerCooldown -= dt;
    }
}

function destroyPlayer($container, $player) {
    $container.removeChild($player);
    GAME_STATE.gameOver = true;
    const audio = new Audio("sound/sfx-lose.ogg");
    audio.play();
}

// Lasers

function createLaser($container, x, y) {
    const $laser = document.createElement("img");
    $laser.src = "img/laser-blue-1.png";
    $laser.className = "laser";
    $container.appendChild($laser);
    const laser = {x, y, $laser};
    GAME_STATE.lasers.push(laser);
    setPosition($laser, x, y);
    const audio = new Audio("sound/sfx-laser1.ogg");
    audio.play();
}

function destroyLaser($container, laser) {
    $container.removeChild(laser.$laser);
    laser.isDead = true;
}

function updateLasers(dt, $container) {
    const lasers = GAME_STATE.lasers;
    for (let i = 0; i < lasers.length; ++i) {
        const laser = lasers[i];
        laser.y -= dt * LASER_MAX_SPEED;
        if (laser.y < 0) {
            destroyLaser($container, laser);
        }
        setPosition(laser.$laser, laser.x, laser.y);

        // kill enemy
        const r1 = laser.$laser.getBoundingClientRect();
        const enemies = GAME_STATE.enemies;
        for (let i = 0; i < enemies.length; ++i) {
            const enemy = enemies[i];
            if (enemy.isDead) continue;
            const r2 = enemy.$enemy.getBoundingClientRect();
            if (hitTest(r1, r2)) {
                destroyEnemy($container, enemy);
                destroyLaser($container, laser);
            }
        }
    }
    GAME_STATE.lasers = GAME_STATE.lasers.filter(e => !e.isDead);
}

// Enemy

function createEnemy($container, x, y) {
    const $enemy = document.createElement("img");
    $enemy.src = "img/enemy-black-1.png";
    $enemy.className = "enemy";
    $container.appendChild($enemy);
    const enemy = {
        x,
        y,
        cooldown: rand(0.5, ENEMY_COOLDOWN),
        $enemy
    };
    GAME_STATE.enemies.push(enemy);
    setPosition($enemy, x, y);
}

function updateEnemies(dt, $container) {
    const dx = Math.sin(GAME_STATE.lastTime / 1000.0) * 50;
    const dy = Math.cos(GAME_STATE.lastTime / 1000.0) * 10;

    const enemies = GAME_STATE.enemies;
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const x = enemy.x + dx;
        const y = enemy.y + dy;
        setPosition(enemy.$enemy, x, y);

        // Enemy lasers
        enemy.cooldown -= dt;
        if (enemy.cooldown <= 0) {
            createEnemyLaser($container, x, y);
            enemy.cooldown = ENEMY_COOLDOWN;
        }
    }
    GAME_STATE.enemies = GAME_STATE.enemies.filter(e => !e.isDead);
}

function destroyEnemy($container, enemy) {
    $container.removeChild(enemy.$enemy);
    enemy.isDead = true;
}

// Enemy Laser

function createEnemyLaser($container, x, y) {
    const $laser = document.createElement("img");
    $laser.src = "img/laser-red-5.png";
    $laser.className = "enemy-laser";
    $container.appendChild($laser);
    const laser = { x, y, $laser };
    GAME_STATE.enemyLasers.push(laser);
    setPosition($laser, x, y);
}

function updateEnemyLasers(dt, $container) {
    const lasers = GAME_STATE.enemyLasers;
    for (let i = 0; i < lasers.length; ++i) {
        const laser = lasers[i];
        laser.y += dt * LASER_MAX_SPEED;
        if (laser.y > GAME_HEIGHT) {
            destroyLaser($container, laser);
        }
        setPosition(laser.$laser, laser.x, laser.y);

        // kill player
        const r1 = laser.$laser.getBoundingClientRect();
        const $player = document.querySelector(".player");
        const r2 = $player.getBoundingClientRect();
        if (hitTest(r1, r2)) {
            destroyLaser($container, laser);
            destroyPlayer($container, $player);
            break;
        }
    }
    GAME_STATE.enemyLasers = GAME_STATE.enemyLasers.filter(e => !e.isDead);
}

// Game

function init() {
    const $container = document.querySelector(".game")
    createPlayer($container);

    const enemySpacing = (GAME_WIDTH - ENEMY_HORIZONTAL_PADDING * 2) / (ENEMIES_PER_ROW - 1);
    for (let j = 0; j < 3; j++) {
        const y = ENEMY_VERTICAL_PADDING + j * ENEMY_VERTICAL_SPACING;
        for (let i = 0; i < ENEMIES_PER_ROW; ++i) {
            const x = i * enemySpacing + ENEMY_HORIZONTAL_PADDING;
            createEnemy($container, x, y);
        }
    }
}

function playerHasWon() {
    return GAME_STATE.enemies.length === 0;
}

function update() {
    const currentTime = Date.now();
    const dt = (currentTime - GAME_STATE.lastTime) / 1000;

    if (GAME_STATE.gameOver) {
        document.querySelector(".game-over").style.display = "block";
        return;
    }

    if (playerHasWon()) {
        document.querySelector(".congratulations").style.display = "block";
        return;
    }

    const $container = document.querySelector(".game")
    updatePlayer(dt, $container);
    updateLasers(dt, $container);
    updateEnemies(dt, $container);
    updateEnemyLasers(dt, $container);

    GAME_STATE.lastTime = currentTime;
    window.requestAnimationFrame(update);
}

function onKeyDown(e) {
    if (e.keyCode === KEY_CODE_LEFT) {
        GAME_STATE.leftPressed = true;
    }
    if (e.keyCode === KEY_CODE_RIGHT) {
        GAME_STATE.rightPressed = true;
    }
    if (e.keyCode === KEY_CODE_SPACE) {
        GAME_STATE.spacePressed = true;
    }
}

function onKeyUp(e) {
    if (e.keyCode === KEY_CODE_LEFT) {
        GAME_STATE.leftPressed = false;
    }
    if (e.keyCode === KEY_CODE_RIGHT) {
        GAME_STATE.rightPressed = false;
    }
    if (e.keyCode === KEY_CODE_SPACE) {
        GAME_STATE.spacePressed = false;
    }
}

init();
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.requestAnimationFrame(update);
