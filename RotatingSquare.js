"use strict";

var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMatrix * a_Position;\n' +
    '}\n';

var FSHADER_SOURCE =
    'void main() {\n' +
    '  gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);\n' +
    '}\n';

var ANGLE_STEP = 45.0; // Incremento do angulo (graus/segundo)

var lasTime = Date.now();

function mapToViewport (x, y, n = 5) {
    return [((x + n / 2) * width) / n, ((-y + n / 2) * height) / n];
}

function getVertex (i) {
    let j = (i % numPoints) * 2;
    return [positions[j], positions[j + 1]];
}

function calculateAngle (angle) {
    // Calcula o tempo decorrido
    var now = Date.now();
    var elapsed = now - lasTime;
    lasTime = now;
    // Atualiza o ângulo de rotação atual (ajustado pelo tempo decorrido)
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
};

function initVertexBuffers (gl) {
    //  v1------v0
    //  |       | 
    //  |       |
    //  |       |
    //  v2------v3
    var vertices = new Float32Array([ // Coordenada dos vertices
        // x, z, y
        // v0-v1-v2-v3
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
    ]);
    var n = vertices.length / 2; // Numero de vertices

    // Cria o objeto do buffer
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Falha ao criar o objeto do buffer');
        return -1;
    }

    // Vincula o objeto do buffer ao destino (gl)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // Escreve a informacao no objeto do buffer
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Atribue o objeto de buffer à variável a_Position
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Habilita a atribuição à variável a_Position
    gl.enableVertexAttribArray(a_Position);

  return n;
};

function draw (gl, n, currentAngle, currentIndex, modelMatrix, u_ModelMatrix) {
    // Define a matriz de rotação
    modelMatrix.setRotate(currentAngle, 0, 0, 1);
    modelMatrix.translate(0.3, 0.0, 0.0);

    // Passa a matriz de rotação para o vertex shader
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Limpa canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Desenha retangulo
    gl.drawArrays(gl.TRIANGLES, 0, n);
};

function main () {
    // Recupera o elemento <canvas>
    var canvas = document.getElementById('theCanvas');

    // Obtém o contexto de renderização para WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Falha ao obter o contexto de renderização para WebGL');
        return;
    }
    
    // Inicializa shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Falha ao inicializar shaders.');
        return;
    }

    // Escreve posicoes dos vertices no vertex shader
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Falha ao definir as posições dos vértices');
        return;
    }

    // Especifica a cor para limpar o <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Obtem o local de armazenamento de u_ModelMatrix
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) { 
        console.log('Falha ao obter o local de armazenamento de u_ModelMatrix');
        return;
    }

    // Angulo atual
    var currentAngle = 0.0;

    // Indice inicial de rotacao
    var currentIndex = 0;

    // Escuta eventos do teclado para mudar cores e direcao de rotacao
    document.addEventListener("keydown", (e) => {
        console.log(e.key);
        switch (e.key) {
            case "r":
                currentIndex = 0;
                break;
            case "g":
                currentIndex = 1;
                break;
            case "b":
                currentIndex = 2;
                break;
            case "w":
                currentIndex = 3;
                break;
        }
    });

    // Matriz modelo
    var modelMatrix = new Matrix4();

    // Gera o loop da animacao
    var runanimation = function() {
        currentAngle = calculateAngle(currentAngle);
        draw(gl, n, currentAngle, currentIndex, modelMatrix, u_ModelMatrix);
        requestAnimationFrame(runanimation);
    };
    runanimation();
};