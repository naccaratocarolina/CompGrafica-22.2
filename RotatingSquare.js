"use strict";

var width;  // Largura do canvas
var height; // Altura do canvas

//  v1------v0
//  |       | 
//  |       |
//  |       |
//  v2------v3

var positions = new Float32Array([ // Coordenada dos vertices
    // x, z, y
    // v0-v1-v2-v3
    -0.5, -0.5, 0.5,
    -0.5, 0.5, 0.5,
    -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5,
]);

var positions2 = new Float32Array([ // Coordenada dos vertices
    // x, z, y
    // v0-v1-v2-v3
    -0.6, -0.6, 0.6,
    -0.6, 0.6, 0.6,
    -0.6, -0.6, 0.6,
    0.6, -0.6, 0.6,
]);


var numPoints = 6;

var ANGLE_STEP = 45.0; // Incremento do angulo (velocidade)

var lasTime = Date.now(); // Ultima vez que a janela foi aberta

const indexCoord = {'r': 0, 'g': 1, 'b': 2, 'w': 5 };

function mapToViewport (x, y, n = 5) {
    return [((x + n / 2) * width) / n, ((-y + n / 2) * height) / n];
}

function getVertex (n, i, vertices) {
    let j = (i % n) * 2;
    return [vertices[j], vertices[j + 1]];
}

function draw (ctx, angle, index) {
    ctx.fillStyle = "rgba(0, 204, 204, 1)";
    ctx.rect(0, 0, width, height);
    ctx.fill();

    let [x, y] = mapToViewport(...getVertex(numPoints, index, positions));
    ctx.translate(x, y);
    ctx.rotate(-angle * Math.PI / 180);
    ctx.translate(-x, -y)

    // Desenha borda cinza
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
        if (i == 3 || i == 4) continue;
        let [x, y] = mapToViewport(...getVertex(numPoints, i, positions2).map((x) => x));
        if (i == 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.fillStyle = "grey";
    ctx.fill();

    // Cria gradiente de acordo com o vertice selecionado
    var grad;
    if (indexCoord['r'] === index) {
        grad = ctx.createLinearGradient(203, 150, x, y);
        grad.addColorStop(0, 'rgba(12, 0, 255, 1)');
        grad.addColorStop(1, 'rgba(255, 0, 0, 1)');
    } else if (indexCoord['b'] === index) {
        grad = ctx.createLinearGradient(167, 200, x, y);
        grad.addColorStop(0, 'rgba(255, 0, 0, 1)');
        grad.addColorStop(1, 'rgba(12, 0, 255, 1)');
    } else if (indexCoord['w'] === index) {
        grad = ctx.createLinearGradient(210, 270, x, y);
        grad.addColorStop(0, 'rgba(0, 255, 4, 1)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 1)');
    } else if (indexCoord['g'] === index) {
        grad = ctx.createLinearGradient(167, 200, x, y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(1, 'rgba(0, 255, 4, 1)');
    }

    // Desenha quadrado interno
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
        if (i == 3 || i == 4) continue;
        let [x, y] = mapToViewport(...getVertex(numPoints, i, positions).map((x) => x));
        if (i == 0) {
            ctx.moveTo(x, y);
        }
        else ctx.lineTo(x, y);
    }
    ctx.fillStyle = grad; 
    ctx.fill();

    // Adiciona quadrado vermelho
    let [aux_x, aux_y] = mapToViewport(...getVertex(numPoints, 0, positions));
    ctx.beginPath();
    ctx.rect(aux_x - 3, aux_y - 3 , 8, 8);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();

    // Adiciona quadrado verde
    [aux_x, aux_y] = mapToViewport(...getVertex(numPoints, 1, positions));
    ctx.beginPath();
    ctx.rect(aux_x - 3, aux_y - 3 , 8, 8);
    ctx.fillStyle = 'rgba(0, 255, 4, 1)';
    ctx.fill();
    ctx.closePath();

    // Adiciona quadrado azul
    [aux_x, aux_y] = mapToViewport(...getVertex(numPoints, 2, positions));
    ctx.beginPath();
    ctx.rect(aux_x - 3, aux_y - 3 , 8, 8);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.closePath();

    // Adiciona quadrado branco
    [aux_x, aux_y] = mapToViewport(...getVertex(numPoints, 5, positions));
    ctx.beginPath();
    ctx.rect(aux_x - 3, aux_y - 3 , 8, 8);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
}

function calculateAngle (angle) {
    var now = Date.now();
    var elapsed = now - lasTime;
    lasTime = now;
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
};

function mainEntrance () {
    // Recupera o elemento <canvas>
    var canvas = document.getElementById('theCanvas');

    // Obtém o contexto de renderização para WebGL
    var ctx = canvas.getContext("2d");
    if (!ctx) {
        console.log('Falha ao obter o contexto de renderização para WebGL');
    return;
    }

    // Recupera as medidas do canvas
    width = canvas.width;
    height = canvas.height;

    // Escuta eventos do teclado para mudar cores e direcao de rotacao
    document.addEventListener("keydown", (e) => {
        if (e.key === 'r' ||
            e.key === 'g' ||
            e.key === 'b' ||
            e.key === 'w') {
            currentIndex = indexCoord[e.key];
        }
    });

    // Angulo inicial
    var currentAngle = 2.0;

    // Indice inicial de rotacao
    var currentIndex = indexCoord['r'];

    // Gera o loop da animacao
    var runanimation = (() => {
        currentAngle = calculateAngle(currentAngle);
        return () => {
            draw(ctx, currentAngle, currentIndex);
            requestAnimationFrame(runanimation);
        };
    })();
    runanimation();
};