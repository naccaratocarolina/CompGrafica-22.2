/**
 * @file
 *
 * Summary.
 * <p>Hierarchical Robot object using a matrix stack.</p>
 *
 * @author Paulo Roma
 * @since 27/09/2016
 * @see https://orion.lcg.ufrj.br/WebGL/labs/WebGL/Assignment_3/Hierarchy.html
 * @see <a href="/WebGL/labs/WebGL/Assignment_3/Hierarchy.js">source</a>
 * @see <a href="/WebGL/labs/WebGL/teal_book/cuon-matrix.js">cuon-matrix</a>
 * @see https://www.cs.ucy.ac.cy/courses/EPL426/courses/eBooks/ComputerGraphicsPrinciplesPractice.pdf#page=188
 * @see https://www.cs.drexel.edu/~david/Classes/ICG/Lectures_new/L-14_HierchModels.pdf
 * @see https://www.lcg.ufrj.br/WebGL/labs/WebGL/Assignment_3/5.hierarchy.pdf
 * @see <img src="../robot.png" width="512">
 */

"use strict";

var VSHADER_SOURCE = 
  'uniform mat4 model;\n' +
  'uniform mat4 view;\n' +
  'uniform mat4 projection;\n' +
  'uniform vec4 u_Color;\n' +
  'uniform mat3 normalMatrix;\n' +
  'uniform vec4 lightPosition;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec3 a_Normal;\n' +
  'varying vec4 color;\n' +
  'void main() {\n' +
    'float ambientFactor = 0.3;\n' +
    'vec3 lightDirection = normalize((view * lightPosition - view * model * a_Position).xyz);\n' +
    '//vec3 normal = (view * model * vec4(a_Normal, 0.0)).xyz;\n' +
    'vec3 normal = normalize(normalMatrix * a_Normal);\n' +
    'float diffuseFactor = max(0.0, dot(lightDirection, normal));\n' +
    'color = u_Color * diffuseFactor + u_Color * ambientFactor;\n' +
    'color.a = 1.0;\n' +
    'gl_Position = projection * view * model * a_Position;\n' +
  '}\n';

var FSHADER_SOURCE = 
  'precision mediump float;\n' +
  'varying vec4 color;\n' +
  'void main() {\n' +
    'gl_FragColor = color;\n' +
    '}\n';

class Stack {
  constructor() {
    this.elements = [];
    this.t = 0;
  }

  push(m) {
    this.elements[this.t++] = m;
  }

  top() {
    if (this.t <= 0) {
      console.log("top = ", this.t);
      console.log("Warning: stack underflow");
    } else {
      return this.elements[this.t - 1];
    }
  }

  pop() {
    if (this.t <= 0) {
      console.log("Warning: stack underflow");
    } else {
      this.t--;
      var temp = this.elements[this.t];
      this.elements[this.t] = undefined;
      return temp;
    }
  }

  isEmpty() {
    return this.t <= 0;
  }
}

/**
 * Creates data for vertices, colors, and normal vectors for
 * a unit cube.
 *
 * Return value is an object with three attributes:
 * vertices, colors, and normals, each referring to a Float32Array.<br>
 * (Note this is a "self-invoking" anonymous function.)
 * @return {Object<{numVertices: Number, vertices: Float32Array, colors: Float32Array, normals: Float32Array}>}
 * vertex array with associated color and normal arrays.
 * @function
 * @global
 */
var cube = (function makeCube() {
  // vertices of cube
  // prettier-ignore
  var rawVertices = new Float32Array([
      -0.5, -0.5, 0.5,
      0.5, -0.5, 0.5,
      0.5, 0.5, 0.5,
      -0.5, 0.5, 0.5,
      -0.5, -0.5, -0.5,
      0.5, -0.5, -0.5,
      0.5, 0.5, -0.5,
      -0.5, 0.5, -0.5
    ]);

  // prettier-ignore
  var rawColors = new Float32Array([
      1.0, 0.0, 0.0, 1.0,  // red
      0.0, 1.0, 0.0, 1.0,  // green
      0.0, 0.0, 1.0, 1.0,  // blue
      1.0, 1.0, 0.0, 1.0,  // yellow
      1.0, 0.0, 1.0, 1.0,  // magenta
      0.0, 1.0, 1.0, 1.0,  // cyan
    ]);

  // prettier-ignore
  var rawNormals = new Float32Array([
      0, 0, 1,
      1, 0, 0,
      0, 0, -1,
      -1, 0, 0,
      0, 1, 0,
      0, -1, 0
    ]);

  // prettier-ignore
  var indices = new Uint16Array([
      0, 1, 2, 0, 2, 3,  // z face
      1, 5, 6, 1, 6, 2,  // +x face
      5, 4, 7, 5, 7, 6,  // -z face
      4, 0, 3, 4, 3, 7,  // -x face
      3, 2, 6, 3, 6, 7,  // + y face
      4, 5, 1, 4, 1, 0   // -y face
    ]);

  var verticesArray = [];
  var colorsArray = [];
  var normalsArray = [];
  for (var i = 0; i < 36; ++i) {
    // for each of the 36 vertices...
    var face = Math.floor(i / 6);
    var index = indices[i];

    // (x, y, z): three numbers for each point
    for (var j = 0; j < 3; ++j) {
      verticesArray.push(rawVertices[3 * index + j]);
    }

    // (r, g, b, a): four numbers for each point
    for (var j = 0; j < 4; ++j) {
      colorsArray.push(rawColors[4 * face + j]);
    }

    // three numbers for each point
    for (var j = 0; j < 3; ++j) {
      normalsArray.push(rawNormals[3 * face + j]);
    }
  }

  return {
    numVertices: 36,
    vertices: new Float32Array(verticesArray),
    colors: new Float32Array(colorsArray),
    normals: new Float32Array(normalsArray),
  };
})();

function makeNormalMatrixElements(model, view) {
  var n = new Matrix4(view).multiply(model);
  n.transpose();
  n.invert();
  n = n.elements;
  // prettier-ignore
  return new Float32Array([
      n[0], n[1], n[2],
      n[4], n[5], n[6],
      n[8], n[9], n[10]
    ]);
}

// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;

// handle to the compiled shader program on the GPU
var lightingShader;

// transformation matrices defining 5 objects in the scene
var torsoMatrix = new Matrix4().setTranslate(0, 0, 0);
var rightShoulderMatrix = new Matrix4().setTranslate(6.5, 2, 0);
var leftShoulderMatrix = new Matrix4().setTranslate(-6.5, 2, 0);
var rightArmMatrix = new Matrix4().setTranslate(0, -5, 0);
var leftArmMatrix = new Matrix4().setTranslate(0, -5, 0);
var handMatrix = new Matrix4().setTranslate(0, -4, 0);
var headMatrix = new Matrix4().setTranslate(0, 7, 0);
var legMatrix = new Matrix4().setTranslate(0,-11,0);
var feetMatrix = new Matrix4().setTranslate(0,-7,0);

var torsoAngle = 0.0;
var shoulderAngle = 0.0;
var armAngle = 0.0;
var handAngle = 0.0;
var headAngle = 0.0;
var legsAngle = 0.0;

var torsoMatrixLocal = new Matrix4().setScale(10, 10, 5);
var rightShoulderMatrixLocal = new Matrix4().setScale(3, 5, 2);
var leftShoulderMatrixLocal = new Matrix4().setScale(3, 5, 2);
var rightArmMatrixLocal = new Matrix4().setScale(3, 5, 2);
var leftArmMatrixLocal = new Matrix4().setScale(3, 5, 2);
var handMatrixLocal = new Matrix4().setScale(1, 3, 3);
var headMatrixLocal = new Matrix4().setScale(4, 4, 4);
var legMatrixLocal = new Matrix4().setScale(3, 12, 2);
var feetMatrixLocal = new Matrix4().setScale(7, 0.5, 6);

// view matrix
// prettier-ignore
var view = new Matrix4().setLookAt(
		20, 20, 20,   // eye
		0, 0, 0,      // at - looking at the origin
		0, 1, 0); // up vector - y axis

// Here use aspect ratio 3/2 corresponding to canvas size 600 x 400
var projection = new Matrix4().setPerspective(45, 1.5, 0.1, 1000);

/**
 * Translate keypress events to strings.
 * @param {KeyboardEvent} event key pressed.
 * @return {String | null}
 * @see http://javascript.info/tutorial/keyboard-events
 */
function getChar(event) {
  if (event.which == null) {
    return String.fromCharCode(event.keyCode); // IE
  } else if (event.which != 0 && event.charCode != 0) {
    return String.fromCharCode(event.which); // the rest
  } else {
    return null; // special key
  }
}

/**
 * <p>Handler for key press events.</p>
 * Adjusts object rotations.
 * @param {KeyboardEvent} event key pressed.
 */
function handleKeyPress(event) {
  var ch = getChar(event);
  switch (ch) {
    case "b":
    case "B":
      torsoAngle -= 15;
      torsoMatrix.setTranslate(0, 0, 0).rotate(torsoAngle, 0, 1, 0);
      break;
    case "t":
    case "T":
      torsoAngle -= 15;
      torsoMatrix.setTranslate(0,0,0).rotate(torsoAngle, 0, 1, 0);
      legsAngle += 15;
      legMatrix.setTranslate(0, -11, 0).rotate(legsAngle, 0, 1,0);
    break;
    case "s":
    case "S":
      shoulderAngle += 15;
      // rotate shoulder clockwise about a point 2 units above its center
      var currentShoulderRot = new Matrix4()
        .setTranslate(0, 2, 0)
        .rotate(-shoulderAngle, 1, 0, 0)
        .translate(0, -2, 0);
      rightShoulderMatrix.setTranslate(6.5, 2, 0).multiply(currentShoulderRot);
      leftShoulderMatrix.setTranslate(-6.5, 2, 0).multiply(currentShoulderRot);
      break;
    case "a":
    case "A":
      armAngle += 15;
      // rotate arm clockwise about its top front corner
      var currentArm = new Matrix4()
        .setTranslate(0, 2.5, 1.0)
        .rotate(-armAngle, 1, 0, 0)
        .translate(0, -2.5, -1.0);
      rightArmMatrix.setTranslate(0, -5, 0).multiply(currentArm);
      leftArmMatrix.setTranslate(0, -5, 0).multiply(currentArm);
      break;
    case "h":
    case "H":
      handAngle += 15;
      handMatrix.setTranslate(0, -4, 0).rotate(handAngle, 0, 1, 0);
      break;
    case "l":
    case "L":
      headAngle -= 15;
      headMatrix.setTranslate(0, 7, 0).rotate(headAngle, 0, 1, 0);
      break;
    case "m":
    case "M":
      legsAngle -= 15;
      legMatrix.setTranslate(0, -11, 0).rotate(legsAngle, 0, 1,0);
      break;
    default:
      return;
  }
}

/**
 * <p>Helper function.</p>
 * Renders the cube based on the model transformation
 * on top of the stack and the given local transformation.
 * @param {Matrix4} matrixStack matrix on top of the stack;
 * @param {Matrix4} matrixLocal local transformation.
 */
function renderCube(matrixStack, matrixLocal) {
  // bind the shader
  gl.useProgram(lightingShader);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(lightingShader, "a_Position");
  if (positionIndex < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  var normalIndex = gl.getAttribLocation(lightingShader, "a_Normal");
  if (normalIndex < 0) {
    console.log("Failed to get the storage location of a_Normal");
    return;
  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(normalIndex);

  // bind data for points and normals
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);

  var loc = gl.getUniformLocation(lightingShader, "view");
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(lightingShader, "projection");
  gl.uniformMatrix4fv(loc, false, projection.elements);
  loc = gl.getUniformLocation(lightingShader, "u_Color");
  gl.uniform4f(loc, 0.0, 1.0, 0.0, 1.0);
  var loc = gl.getUniformLocation(lightingShader, "lightPosition");
  gl.uniform4f(loc, 5.0, 10.0, 5.0, 1.0);

  var modelMatrixloc = gl.getUniformLocation(lightingShader, "model");
  var normalMatrixLoc = gl.getUniformLocation(lightingShader, "normalMatrix");

  // transform using current model matrix on top of stack
  var current = new Matrix4(matrixStack.top()).multiply(matrixLocal);
  gl.uniformMatrix4fv(modelMatrixloc, false, current.elements);
  gl.uniformMatrix3fv(
    normalMatrixLoc,
    false,
    makeNormalMatrixElements(current, view)
  );

  gl.drawArrays(gl.TRIANGLES, 0, 36);

  // on safari 10, buffer cannot be disposed before drawing...
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.useProgram(null);
}

/** Code to actually render our geometry. */
function draw() {
  // clear the framebuffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

  // set up the matrix stack  
  var s = new Stack();
  s.push(torsoMatrix);
  renderCube(s, torsoMatrixLocal, 2);
    
  // Shoulder relative to torso
  s.push (new Matrix4(s.top()).multiply(rightShoulderMatrix)); 
  renderCube(s, rightShoulderMatrixLocal, 2);
      
  // Right arm relative to shoulder
  s.push(new Matrix4(s.top()).multiply(rightArmMatrix));
  renderCube(s, rightArmMatrixLocal, 1);

  // Right hand relative to arm
  s.push(new Matrix4(s.top()).multiply(handMatrix));
  renderCube(s, handMatrixLocal, 1);
  s.pop();
  s.pop();
  s.pop();
    
  // Left shoulder relative to torso
  s.push (new Matrix4(s.top()).multiply(leftShoulderMatrix)); 
  renderCube(s, leftShoulderMatrixLocal, 2);

  // Left arm relative to shouder
  s.push(new Matrix4(s.top()).multiply(leftArmMatrix));
  renderCube(s, leftArmMatrixLocal, 1);

  // Left hand relative to arm
  s.push(new Matrix4(s.top()).multiply(handMatrix));
  renderCube(s, handMatrixLocal, 1);
  s.pop();
  s.pop();
  s.pop();

  // Leg relative to torso
  s.push(new Matrix4(s.top()).multiply(legMatrix));
  renderCube(s, legMatrixLocal, 3);

  // Feet relative to leg
  s.push(new Matrix4(s.top()).multiply(feetMatrix));
  renderCube(s, feetMatrixLocal, 1);
  s.pop();
  s.pop();

  // Head relative to torso
  s.push(new Matrix4(s.top()).multiply(headMatrix));
  renderCube(s, headMatrixLocal, 1);
  s.pop();
  s.pop();

  if (!s.isEmpty()) {
    console.log("Warning: pops do not match pushes");
  }
}

/**
 * <p>Entry point when page is loaded.</p>
 *
 * Basically this function does setup that "should" only have to be done once,<br>
 * while draw() does things that have to be repeated each time the canvas is
 * redrawn.
 * @function
 * @memberof Window
 * @name anonymous_load
 * @global
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event
 */
window.addEventListener("load", (event) => {
  console.log("hahaha")
  // retrieve <canvas> element
  var canvas = document.getElementById("theCanvas");

  // key handler
  window.onkeypress = handleKeyPress;

  // get the rendering context for WebGL, using the utility from the teal book
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  // load and compile the shader pair, using utility from the teal book
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }
  lightingShader = gl.program;
  gl.useProgram(null);

  // buffer for vertex positions for triangles
  vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object");
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.vertices, gl.STATIC_DRAW);

  // buffer for vertex normals
  vertexNormalBuffer = gl.createBuffer();
  if (!vertexNormalBuffer) {
    console.log("Failed to create the buffer object");
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.normals, gl.STATIC_DRAW);

  // buffer is not needed anymore (not necessary, really)
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.9, 0.9, 0.9, 1.0);

  gl.enable(gl.DEPTH_TEST);

  // define an animation loop
  var animate = function () {
    draw();
    requestAnimationFrame(animate, canvas);
  };

  // start drawing!
  animate();
});
