//Screen dimensions
const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;

const randomizeMap = false;
const mapSize = 16;

//Set up canvas
const canvas = document.createElement("canvas");
canvas.setAttribute("width", SCREEN_WIDTH);
canvas.setAttribute("height", SCREEN_HEIGHT);
document.body.appendChild(canvas);

//Game constants
const TICK = 30;
const CELL_SIZE = 64;
const PLAYER_SIZE = CELL_SIZE / 8;
const VIEW_RAY_LENGTH = PLAYER_SIZE * 2;
const FOV = toRads(60);

var showMinimap = false;

//Canvas context
const ctx = canvas.getContext("2d");

//Map
if (randomizeMap) {
    var map = [];
    for (i = 0; i < mapSize; i++) {
        map[i] = [];
        for (i2 = 0; i2 < mapSize; i2++) {
            let isWall = Math.floor(Math.random() * 10) === 1 ? true : false;
            map[i][i2] = isWall ? 1 : 0;
        }
    }
} else {
    map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
}

//Color palette
const COLORS = {
    floor: "#c6c58b",
    ceiling: "#e1e2bb",
    wall: "#f5da89",
    wallDark: "#d3af63",
    rays: "#ffa600",
    player: "blue",
    minimapWalls: "grey"
};

//Player object
const player = {
    x: CELL_SIZE * 1.5,
    y: CELL_SIZE * 2,
    angle: 0,
    speed: 0,
    strafe: 0,
    running: false
};

//Binds
const BINDS = {
    "Move up": {
        key: "w"
    },
    "Move down": {
        key: "s"
    },
    "Move left": {
        key: "a"
    },
    "Move right": {
        key: "d"
    },
    Run: {
        key: "shift"
    },
    "Show minimap": {
        key: "tab"
    },
    mouse: {
        sensitivity: 0.25
    }
};

//Game loop
function update() {
    clearScreen();
    movePlayer();
    const rays = getRays();
    renderScene(rays);
    const mapScale = randomizeMap ? (0.5 / mapSize) * 10 : 0.5;
    if (showMinimap) renderMinimap(0, 0, mapScale, rays);
}

//Clear the screen
function clearScreen() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

//Move the player
function movePlayer(speed) {
    let speedDiff = player.speed !== 0 && player.strafe !== 0 ? 1.5 : 2;
    speed = player.running ? player.speed * speedDiff : player.speed;
    strafe = player.running ? player.strafe * speedDiff : player.strafe;
    var movement = {
        x: 0,
        y: 0
    };
    movement.x += Math.cos(player.angle) * speed;
    movement.y += Math.sin(player.angle) * speed;
    if (player.strafe !== 0) {
        movement.x += Math.cos(player.angle + toRads(90)) * strafe;
        movement.y += Math.sin(player.angle + toRads(90)) * strafe;
    }
    let to = {
        x: player.x + movement.x,
        y: player.y + movement.y
    };
    //if (outOfBounds(to.x / CELL_SIZE, to.y / CELL_SIZE)) return;
    if (!collidesWithVWall(to.x)) player.x += movement.x;
    if (!collidesWithHWall(to.y)) player.y += movement.y;
}

//Cast a ray
function castRay(angle) {
    let vCollision = getVCollision(angle);
    let hCollision = getHCollision(angle);

    return hCollision.distance >= vCollision.distance ? vCollision : hCollision;
}

//Get the casted rays
function getRays() {
    let initialAngle = player.angle - FOV / 2;
    let nmbRays = SCREEN_WIDTH;
    let angleStep = FOV / nmbRays;
    return Array.from({ length: nmbRays }, (_, i) => {
        let angle = initialAngle + i * angleStep;
        let ray = castRay(angle);
        return ray;
    });
}

//Render scene
function renderScene(rays) {
    rays.forEach((ray, i) => {
        let distance = ray.distance;
        let wallHeight = ((CELL_SIZE * 5) / distance) * 277;

        //Draw walls
        //if (ray.outOfBounds) {
        //    ctx.fillStyle = "grey";
        //} else {
        ctx.fillStyle = ray.vertical ? COLORS.wallDark : COLORS.wall;
        //}
        ctx.fillRect(i, SCREEN_HEIGHT / 2 - wallHeight / 2, 1, wallHeight);

        //Draw floor
        ctx.fillStyle = COLORS.floor;
        ctx.fillRect(
            i,
            SCREEN_HEIGHT / 2 + wallHeight / 2,
            1,
            SCREEN_HEIGHT / 2 - wallHeight / 2
        );

        //Draw ceiling
        ctx.fillStyle = COLORS.ceiling;
        ctx.fillRect(i, 0, 1, SCREEN_HEIGHT / 2 - wallHeight / 2);
    });
}

//Render minimap
function renderMinimap(posX = 0, posY = 0, scale = 1, rays) {
    let cellSize = scale * CELL_SIZE;

    //Render walls
    map.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                ctx.fillStyle = COLORS.minimapWalls;
                ctx.fillRect(
                    posX + x * cellSize,
                    posY + y * cellSize,
                    cellSize,
                    cellSize
                );
            }
        });
    });

    //Render rays
    ctx.strokeStyle = COLORS.rays;
    rays.forEach(ray => {
        ctx.beginPath();
        ctx.moveTo(player.x * scale + posX, player.y * scale + posY);
        ctx.lineTo(
            (player.x + Math.cos(ray.angle) * ray.distance) * scale,
            (player.y + Math.sin(ray.angle) * ray.distance) * scale
        );
        ctx.closePath();
        ctx.stroke();
    });

    //Render player
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(
        posX + player.x * scale - PLAYER_SIZE / 2,
        posY + player.y * scale - PLAYER_SIZE / 2,
        PLAYER_SIZE * (scale * 2),
        PLAYER_SIZE * (scale * 2)
    );

    //Render player view angle
    ctx.strokeStyle = COLORS.player;
    ctx.beginPath();
    ctx.moveTo(player.x * scale + posX, player.y * scale + posY);
    ctx.lineTo(
        (player.x + Math.cos(player.angle) * VIEW_RAY_LENGTH) * scale,
        (player.y + Math.sin(player.angle) * VIEW_RAY_LENGTH) * scale
    );
    ctx.closePath();
    ctx.stroke();
}

//Update loop
setInterval(update, TICK);

//KeyDown event handler
document.addEventListener("keydown", e => {
    switch (e.key.toLowerCase()) {
        case BINDS["Move up"].key:
            e.preventDefault();
            player.speed = 2;
            break;
        case BINDS["Move down"].key:
            e.preventDefault();
            player.speed = -2;
            break;
        case BINDS["Move left"].key:
            e.preventDefault();
            player.strafe = -2;
            break;
        case BINDS["Move right"].key:
            e.preventDefault();
            player.strafe = 2;
            break;
        case BINDS["Run"].key:
            e.preventDefault();
            player.running = true;
            break;
        case BINDS["Show minimap"].key:
            e.preventDefault();
            if (showMinimap) showMinimap = false;
            else showMinimap = true;
            break;
        default:
            break;
    }
});

//KeyUp event handler
document.addEventListener("keyup", e => {
    switch (e.key.toLowerCase()) {
        case BINDS["Move up"].key:
        case BINDS["Move down"].key:
            player.speed = 0;
            break;
        case BINDS["Move left"].key:
        case BINDS["Move right"].key:
            player.strafe = 0;
            break;
        case BINDS["Run"].key:
            player.running = false;
            break;
        default:
            break;
    }
});

//MouseMove event handler
document.addEventListener("mousemove", e => {
    player.angle += toRads(e.movementX) * BINDS.mouse.sensitivity;
});

///////////////////////
// Utility functions //
///////////////////////

//Get radians from degrees
function toRads(deg) {
    return (deg * Math.PI) / 180;
}

//Get the distance between 2 points
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

//Get vertical collision from ray
function getVCollision(angle) {
    let facingRight = Math.abs(Math.floor((angle - Math.PI / 2) / Math.PI) % 2);

    let firstX = facingRight
        ? Math.floor(player.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE
        : Math.floor(player.x / CELL_SIZE) * CELL_SIZE;
    let firstY = player.y + (firstX - player.x) * Math.tan(angle);

    let xA = facingRight ? CELL_SIZE : -CELL_SIZE;
    let yA = xA * Math.tan(angle);

    let wall;
    let nextX = firstX;
    let nextY = firstY;

    while (!wall) {
        let cellX = facingRight
            ? Math.floor(nextX / CELL_SIZE)
            : Math.floor(nextX / CELL_SIZE) - 1;
        let cellY = Math.floor(nextY / CELL_SIZE);

        if (outOfBounds(cellX, cellY)) {
            return {
                angle,
                distance: distance(player.x, player.y, nextX, nextY),
                vertical: true,
                outOfBounds: true
            };
        }

        wall = map[cellY][cellX];

        if (!wall) {
            nextX += xA;
            nextY += yA;
        }
    }

    return {
        angle,
        distance: distance(player.x, player.y, nextX, nextY),
        vertical: true,
        outOfBounds: false
    };
}

//Get horizontal collision from ray
function getHCollision(angle) {
    let facingUp = Math.abs(Math.floor(angle / Math.PI) % 2);
    let firstY = facingUp
        ? Math.floor(player.y / CELL_SIZE) * CELL_SIZE
        : Math.floor(player.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE;
    let firstX = player.x + (firstY - player.y) / Math.tan(angle);

    let yA = facingUp ? -CELL_SIZE : CELL_SIZE;
    let xA = yA / Math.tan(angle);

    let wall;
    let nextX = firstX;
    let nextY = firstY;

    while (!wall) {
        let cellX = Math.floor(nextX / CELL_SIZE);
        let cellY = facingUp
            ? Math.floor(nextY / CELL_SIZE) - 1
            : Math.floor(nextY / CELL_SIZE);

        if (outOfBounds(cellX, cellY)) {
            return {
                angle,
                distance: distance(player.x, player.y, nextX, nextY),
                vertical: false,
                outOfBounds: true
            };
        }

        wall = map[cellY][cellX];

        if (!wall) {
            nextX += xA;
            nextY += yA;
        }
    }

    return {
        angle,
        distance: distance(player.x, player.y, nextX, nextY),
        vertical: false,
        outOfBounds: false
    };
}

//Check if point is out of bounds
function outOfBounds(x, y) {
    return x < 0 || x >= map[0].length || y < 0 || y >= map.length;
}

//Check if player collides with a vertical wall
function collidesWithVWall(toX) {
    return (
        map[Math.floor(player.y / CELL_SIZE)][Math.floor(toX / CELL_SIZE)] ===
            1 ||
        toX / CELL_SIZE < PLAYER_SIZE / CELL_SIZE ||
        toX / CELL_SIZE >=
            map[Math.floor(player.y / CELL_SIZE)].length -
                PLAYER_SIZE / CELL_SIZE
    );
}

//Check if player collides with a horizontal wall
function collidesWithHWall(toY) {
    return (
        map[Math.floor(toY / CELL_SIZE)][Math.floor(player.x / CELL_SIZE)] ===
            1 ||
        toY / CELL_SIZE < PLAYER_SIZE / CELL_SIZE ||
        toY / CELL_SIZE >= map.length - PLAYER_SIZE / CELL_SIZE
    );
}
