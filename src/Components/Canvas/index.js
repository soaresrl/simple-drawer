import React, {Component} from 'react';
import collector from '../../Entity/collector';

export default class Canvas extends Component {
    constructor(props){
        super(props);

        // Set viewport dimensions for orthographic projection
        this.left = -5.0;
        this.right = 5.0;
        this.top = 5.0;
        this.bottom = -5.0;

        // Collector entity
        this.collector = new collector();
    }

    // Auxiliary function to setup GLSL program
    static createProgram(gl){
        const vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
        const fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;
        
        const vertexShader = Canvas.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = Canvas.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
          return program;
        }
       
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);

        return 
    }
    
    // Auxiliary function to setup GLSL program
    static createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    componentDidMount(){
        const canvas = document.getElementById("canvas");

        this.width = canvas.clientWidth;
        this.height =  canvas.clientHeight;

         // Get A WebGL context
         this.gl = canvas.getContext("webgl");
         if (!this.gl) {
             console.log('no WebGl for you');
             return; 
         }

         // Setup GLSL program
        this.program = Canvas.createProgram(this.gl);
        this.gl.useProgram(this.program);

        // Get variables location in GLSL program
        this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.colorLocation = this.gl.getUniformLocation(this.program, 'u_color');
        this.projectionLocation = this.gl.getUniformLocation(this.program, 'u_projection');
        this.pointSizeLocation = this.gl.getUniformLocation(this.program, 'u_pointSize');

        this.resizeGL();

        this.paintGL();

        window.addEventListener('resize', this.resizeGL.bind(this));
        canvas.addEventListener('contextmenu', (e)=>{e.preventDefault()});
    }

    glOrtho(left, right, bottom, top, near, far){
        
        /*
            Setup the orthographic projection, need to pay attention 
            about the order of the array to be sent to shader
        */

        let matrix =[
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, 2 / (near - far), 0,
       
            (left + right) / (left - right),
            (bottom + top) / (bottom - top),
            (near + far) / (near - far),
            1,
          ];

        // Set the matrix on shader.
        this.gl.uniformMatrix4fv(this.projectionLocation, false, new Float32Array(matrix));
    }

    scaleWorldWindow(scaleFac){
        let vpr, cx, cy, sizex, sizey;

        // Compute canvas viewport ratio
        vpr = this.height / this.width;

        // Get current window center
        cx = (this.left + this.right) / 2;
        cy = (this.bottom + this.top) / 2;

        // Set new window sizes based on scaling factor
        sizex = (this.right - this.left) * scaleFac;
        sizey = (this.top - this.bottom) * scaleFac;

        // Adjust window to keep the same aspect ratio of the viewport.
        if (sizey / sizex > vpr){
            sizex = sizey / vpr;
        }
        else if (sizey / sizex < vpr)
        {
            sizey = sizex*vpr;
        }

        this.right = cx + (sizex / 2);
        this.left = cx - (sizex / 2);
        this.top = cy + (sizey / 2);
        this.bottom = cy - (sizey / 2);

        // Setup orthographic projection
        this.glOrtho(this.left, this.right, this.bottom, this.top, -1, 1);
    }

    resizeGL(){
        const canvas = document.getElementById('canvas');
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        this.width = this.gl.canvas.width;
        this.height = this.gl.canvas.height;
        this.gl.viewport(0,0, this.gl.canvas.width, this.gl.canvas.height);

        this.scaleWorldWindow(1.0);

        this.paintGL();
    }

    makeDisplayTriangle(){

        // Set triangle coordinates 
        const triangle = [
            1.0, 1.0, //first vertex
            2.0, 2.0, //second vertex
            3.0, 1.0  //third vertex
        ]

        // Create Buffer and set Buffet data
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(triangle), this.gl.STATIC_DRAW);

         /* The second parameter is the size of vertex's coordinates 
            ex.: p(x,y) -> 2; p(x,y,z) -> 3  
         */
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

        // The third parameter is the number of vertices to be drawn
        this.gl.drawArrays(this.gl.TRIANGLES, 0, triangle.length/2);
    }

    makeDisplayModel(){
        const pCoords = []
        for(const line of this.collector.model.lines){
           pCoords.push(
               ...line.pt0,
               ...line.pt1
           )
        }

        // Create Buffer and set Buffet data
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(pCoords), this.gl.STATIC_DRAW);

         /* The second parameter is the size of vertex's coordinates 
            ex.: p(x,y) -> 2; p(x,y,z) -> 3  
         */
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

        // The third parameter is the number of vertices to be drawn
        this.gl.drawArrays(this.gl.LINES, 0, pCoords.length/2);

    }

    drawCollectedCurve(){
        if (this.collector.curve) {
            if (!this.collector.curve.pt1) {
                return
            }
            const pCoords = [
                ...this.collector.curve.pt0,
                ...this.collector.curve.pt1
            ]
    
            // Create Buffer and set Buffet data
            const positionBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(pCoords), this.gl.STATIC_DRAW);
    
             /* The second parameter is the size of vertex's coordinates 
                ex.: p(x,y) -> 2; p(x,y,z) -> 3  
             */
            this.gl.enableVertexAttribArray(this.positionAttributeLocation);
            this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    
            // The third parameter is the number of vertices to be drawn
            this.gl.drawArrays(this.gl.LINES, 0, pCoords.length/2);
        }
    }

    getPosition (e) {

        const dx = this.right - this.left; 
        const dy = this.top - this.bottom; 

        const mX = (e.clientX - e.target.offsetLeft) *dx/this.width;  
        const mY = (this.height - (e.clientY - e.target.offsetTop)) *dy/this.height;

        const x = this.left + mX;
        const y = this.bottom + mY;

        return {x, y}
    }

    onMouseDown(e){
        e.preventDefault();

        this.buttonPressed = true;
        this.mouseButton = e.button;

        this.pt0 = {x: e.clientX - e.target.offsetLeft, y: e.clientY - e.target.offsetTop};
        this.pt0W = this.getPosition(e);

        if (!this.collector.isCollecting()) {
            this.collector.startCollection();
        }
       
        this.collector.insertPoint(this.pt0W);
    }

    onMouseUp(e){
        e.preventDefault();
        this.buttonPressed = false;
        this.pt1 = {x: e.clientX - e.target.offsetLeft, y: e.clientY - e.target.offsetTop}
        this.pt1W = this.getPosition(e);

        if(this.collector.isFinished()){
            this.collector.endCollection();
        }
        this.paintGL();
    }

    onMouseMove(e){
        e.preventDefault();

        this.pt1 = {x: e.clientX - e.target.offsetLeft, y: e.clientY - e.target.offsetTop};
        this.pt1W = this.getPosition(e);
        if (this.collector.isCollecting()) {
            this.collector.insertPoint(this.pt1W);
        }
        this.paintGL();
    }

    paintGL(){    

        this.gl.clearColor(0.1, 0.1, 0.1, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        //this.makeDisplayTriangle();
        this.makeDisplayModel();
        this.drawCollectedCurve();
    }

    render(){
        return(
            <canvas
                id='canvas'
                width='800'
                height='600'
                onMouseDown={this.onMouseDown.bind(this)}
                onMouseUp={this.onMouseUp.bind(this)}
                onMouseMove={this.onMouseMove.bind(this)}
            >
            </canvas>
        )
    }
}