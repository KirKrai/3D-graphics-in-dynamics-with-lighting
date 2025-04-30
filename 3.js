
var gl;

var vertexPositionAttribute;
var vertexColorAttribute;

var projectionMatrixUniform;
var modelviewMatrixUniform;
var RotateCube;

var projectionMatrix; //проекция
var modelViewMatrix;

var VerticesIndexBuffer;
var VerticesBuffer;
var ColorBuffer;

function initWebGL(canvas){
    gl = null;
    try { 
    gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch(e) {}
    if (!gl) { 
    alert("Не удалось инициализировать WebGL. Ваш браузер может не поддерживать это.");
    gl = null;
    }
    return gl;
}

//есть отличие от предыдущего!
function initShaderProgram() {

    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

     if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Не удается инициализировать шейдерную программу: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    //отличие тут
    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(vertexPositionAttribute);

    vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColor');
    gl.enableVertexAttribArray(vertexColorAttribute);

    projectionMatrixUniform = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'); 
    modelviewMatrixUniform = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
    RotateCube = gl.getUniformLocation(shaderProgram, 'uRotateCube');

    gl.useProgram(shaderProgram);
    //отличие конец

    return shaderProgram;
}

function loadShader(type, source){

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('Произошла ошибка при компиляции шейдеров: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}



const vsSource = `
attribute vec4 aVertexPosition;
attribute vec3 aVertexColor;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uRotateCube;

varying lowp vec3 color;

void main() {
gl_Position = uProjectionMatrix * uModelViewMatrix * uRotateCube * aVertexPosition;
color = aVertexColor;
} `;

const fsSource = `
varying lowp vec3 color;

void main() {
    gl_FragColor = vec4(color, 1.0);
}
`;


function start(){
    main("canvas");
 }

//MAIN!
function main(type){

    var canvas = document.getElementById(type);

    gl = initWebGL(canvas); 
    if (gl) { 
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);  
        gl.clearColor(0.0, 0.0, 0.0, 1.0); 
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL); 
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        //
        initShaderProgram();
        initPMVMatrix();
        drawScene();
        moveCube();


    }
    //
}


function initBuffers(pos, posOfPedestal, CubeRot, pedestalRot, globalRot){
    var positions = [
        // Передняя грань
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Задняя грань
        -1.0, -1.0, -1.0,
        -1.0,1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Верхняя грань
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Нижняя грань
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Правая грань
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Левая грань
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0
    ];

    rotation = mat4.create();

    mat4.rotate(rotation, // матрица назначения
        rotation,  // матрица для перевода
        globalRot * Math.PI/180, // угол поворота
        [0.0, 1.0, 0.0] // ось вращения
    ); 

    mat4.translate( //перемещение матрицы
        rotation, //output //итоговая выходная матрица, которая получается после перемещения матрицы input на трехмерный вектор vec.
        rotation, // input
        posOfPedestal //vec
    )

    mat4.rotate(rotation, rotation,  pedestalRot * Math.PI/180, [0.0, 1.0, 0.0]); 

    mat4.translate(rotation,rotation,pos)

    mat4.rotate(rotation, rotation,  CubeRot * Math.PI/180, [0.0, 1.0, 0.0]);

    gl.uniformMatrix4fv(
        RotateCube,
        false,
        rotation
    );
    //связывание матриц*
     //задают матрицые значения для uniform переменных
    //gl.uniformMatrix4fv();

    VerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VerticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var cubeVertexIndices = [
        0,  1,  2,      0,  2,  3,    // передняя грань
        4,  5,  6,      4,  6,  7,    // задняя грань
        8,  9,  10,     8,  10, 11,   // верхняя грань
        12, 13, 14,     12, 14, 15,   // нижняя грань
        16, 17, 18,     16, 18, 19,   // правая грань
        20, 21, 22,     20, 22, 23    // левая грань
    ];

    VerticesIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, VerticesIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

    //цвет баффер
    var color=[
        //передняя грань
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        //задняя грань
        0.5, 1.0, 1.0,
        0.5, 1.0, 1.0,
        0.5, 1.0, 1.0,
        0.5, 1.0, 1.0,
        //верхняя грань
        1.0, 0.1, 0.0,
        1.0, 0.1, 0.0,
        1.0, 0.1, 0.0,
        1.0, 0.1, 0.0,
        // нижняя грань
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        // правая грань
        1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        // левая грань
        0.5, 0.0, 1.0,
        0.5, 0.0, 1.0,
        0.5, 0.0, 1.0,
        0.5, 0.0, 1.0,
    ];

    ColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
}

var posOfPedestal = [0,0,-4];
var cubesPos = [[-2.2,0,0], [0,0,0], [0,2.2,0], [2.2,0,0]];
var cubesRot = 0;
var pedestalRot = 0;
var globalRot = 0;

function initPMVMatrix(){

    const fieldOfView = 50 * Math.PI / 180; // РАДИАНЫ
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;


    projectionMatrix = mat4.create();

    //Матрица перспективы используется для масштабирования и,
    // возможно, перевода или отражения системы координат при подготовке к разделению перспективы
   
    mat4.perspective(//Создает матрицу перспективной проекции с заданными границами.
        projectionMatrix, //mat4 часть матрицы будет записана в
        fieldOfView, //Вертикальное поле зрения в радианах
        aspect, //Соотношение сторон. обычно ширина/высота области просмотра
        zNear, //Ближняя с границей усеченного конуса
        zFar // Дальняя граница усеченного конуса может быть нулевой или бесконечной
    );

    modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -15.0]);  //камера

    mat4.rotate(modelViewMatrix, modelViewMatrix,   5 * Math.PI/180,  [0.0, 1.0, 0.0]);  //угол фиг

    mat4.rotate(modelViewMatrix, modelViewMatrix,  15 * Math.PI/180, [1.0, 0.0, 0.0]); 

    gl.uniformMatrix4fv(projectionMatrixUniform,false, projectionMatrix);
    
    gl.uniformMatrix4fv( modelviewMatrixUniform, false, modelViewMatrix);
    
}

function drawCube(){
    // привязать буфер для вершин
    gl.bindBuffer(gl.ARRAY_BUFFER, VerticesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // привязать буфер для цветов
    gl.bindBuffer(gl.ARRAY_BUFFER, ColorBuffer);
    gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.drawElements(gl.TRIANGLES, 36,gl.UNSIGNED_SHORT,0)
}

function drawScene() {
    gl.clearDepth(1.0);
    //gl.enable(gl.DEPTH_TEST);
    //gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for(let i = 0; i < cubesPos.length; ++i){
        initBuffers(cubesPos[i], posOfPedestal, cubesRot, pedestalRot, globalRot);
        drawCube();
    }
}

function moveCube(){
    let speedOfRotation = 5;
    document.addEventListener('keydown', function(event) {

        if (event.code == 'KeyQ') {
            cubesRot -= speedOfRotation;
            drawScene();
        }
        if (event.code == 'KeyE') {
            cubesRot += speedOfRotation;
            drawScene();
        }
        if (event.code == 'KeyA') {
            pedestalRot -= speedOfRotation;
            drawScene();
        }
        if (event.code == 'KeyD') {
            pedestalRot += speedOfRotation;
            drawScene();
        }
        if (event.code == 'KeyZ') {
            globalRot -= speedOfRotation;
            drawScene();
        }
        if (event.code == 'KeyC') {
            globalRot += speedOfRotation;
            drawScene();
        }


});
}


/*
    positions = [
        // Передняя грань
        pos[0] + -1.0, pos[1] + -1.0, pos[2] + 1.0,
        pos[0] + 1.0, pos[1] + -1.0, pos[2] + 1.0,
        pos[0] + 1.0, pos[1] + 1.0, pos[2] + 1.0,
        pos[0] + -1.0, pos[1] + 1.0, pos[2] + 1.0,

        // Задняя грань
        pos[0] + -1.0, pos[1] + -1.0, pos[2] + -1.0,
        pos[0] + -1.0, pos[1] + 1.0, pos[2] + -1.0,
        pos[0] + 1.0, pos[1] + 1.0, pos[2] + -1.0,
        pos[0] + 1.0, pos[1] + -1.0, pos[2] + -1.0,

        // Верхняя грань
        pos[0] + -1.0, pos[1] + 1.0, pos[2] + -1.0,
        pos[0] + -1.0, pos[1] + 1.0, pos[2] + 1.0,
        pos[0] + 1.0, pos[1] + 1.0, pos[2] + 1.0,
        pos[0] + 1.0, pos[1] + 1.0, pos[2] + -1.0,

        // Нижняя грань
        pos[0] + -1.0, pos[1] + -1.0, pos[2] + -1.0,
        pos[0] + 1.0, pos[1] + -1.0, pos[2] + -1.0,
        pos[0] + 1.0, pos[1] + -1.0, pos[2] + 1.0,
        pos[0] + -1.0, pos[1] + -1.0, pos[2] + 1.0,

        // Правая грань
        pos[0] + 1.0, pos[1] + -1.0, pos[2] + -1.0,
        pos[0] + 1.0, pos[1] + 1.0, pos[2] + -1.0,
        pos[0] + 1.0, pos[1] + 1.0, pos[2] + 1.0,
        pos[0] + 1.0, pos[1] + -1.0, pos[2] + 1.0,

        // Левая грань
        pos[0] + -1.0, pos[1] + -1.0, pos[2] + -1.0,
        pos[0] + -1.0, pos[1] + -1.0, pos[2] + 1.0,
        pos[0] + -1.0, pos[1] + 1.0, pos[2] + 1.0,
        pos[0] + -1.0, pos[1] + 1.0, pos[2] + -1.0
    ];
 */