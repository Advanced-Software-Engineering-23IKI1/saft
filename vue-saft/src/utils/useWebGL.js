
import vertexSrc from '@/shaders/vertex.glsl?raw';
import fragmentSrc from '@/shaders/fragment.glsl?raw';
import {ref, reactive} from 'vue';


export function useWebGL(canvasRef, spectrogramStore) {

    const gl = ref(null);
    const program = ref(null);
    const uniforms = reactive({});
    const specTex = ref(null);
    let previousHash = null;

    const renderData = spectrogramStore.renderData;



    function setupWebGL() {
        gl.value = canvasRef.value.getContext('webgl2')
        gl.value.getExtension('EXT_color_buffer_float'); 
        if (!gl.value) {
            alert('WebGL2 is required for this shader!');
            return;
        }
        gl.value.clearColor(0.0, 0.0, 0.0, 1.0); // RGBA: black
        gl.value.clear(gl.value.COLOR_BUFFER_BIT);

        const vertexShader = compileShader(vertexSrc, gl.value.VERTEX_SHADER)
        const fragmentShader = compileShader(fragmentSrc, gl.value.FRAGMENT_SHADER)
        program.value = createProgram(vertexShader, fragmentShader);
        createFullscreenQuad();
        cacheUniformLocations();
        uploadSpectrogram();
        updateValues();
        renderFrame();
    }


    function compileShader(src, type) {
        const shader = gl.value.createShader(type)
        gl.value.shaderSource(shader, src)
        gl.value.compileShader(shader)
        if (!gl.value.getShaderParameter(shader, gl.value.COMPILE_STATUS)) {
            console.error(gl.value.getShaderInfoLog(shader))
        }
        return shader
    }

    function createProgram(vertexShader, fragmentShader) {
        const program = gl.value.createProgram();
        gl.value.attachShader(program, vertexShader);
        gl.value.attachShader(program, fragmentShader);
        gl.value.linkProgram(program);
        gl.value.useProgram(program);
        return program;
    }

    function createFullscreenQuad() {

        const quad = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1
        ]);

        const buffer = gl.value.createBuffer();
        gl.value.bindBuffer(gl.value.ARRAY_BUFFER, buffer);
        gl.value.bufferData(gl.value.ARRAY_BUFFER, quad, gl.value.STATIC_DRAW);


        const posLoc = gl.value.getAttribLocation(program.value, "a_position");

        gl.value.enableVertexAttribArray(posLoc);

        gl.value.vertexAttribPointer(posLoc, 2, gl.value.FLOAT, false, 0, 0);



    }

    function uploadSpectrogram() {

        specTex.value = gl.value.createTexture();
        gl.value.activeTexture(gl.value.TEXTURE0);

        gl.value.bindTexture(gl.value.TEXTURE_2D, specTex.value);

        gl.value.texImage2D(
            gl.value.TEXTURE_2D,
            0,
            gl.value.R32F,
            renderData.width,
            renderData.height,
            0,
            gl.value.RED,
            gl.value.FLOAT,
            renderData.data
        );

        gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MIN_FILTER, gl.value.NEAREST);
        gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MAG_FILTER, gl.value.NEAREST);
        gl.value.uniform1i(uniforms.uSpectrogram, 0);

    }

    function updateValues(height_offset, width_offset, zoom) {
        gl.value.uniform1f(uniforms.width_offset, width_offset);
        gl.value.uniform1f(uniforms.height_offset, height_offset);
        gl.value.uniform1f(uniforms.zoom, zoom);

        gl.value.uniform1f(uniforms.minDB, renderData.minDB);
        gl.value.uniform1f(uniforms.maxDB, renderData.maxDB);
        gl.value.uniform1f(uniforms.maxBin, renderData.maxBin);
        gl.value.uniform1f(uniforms.minBin, renderData.minBin);
    }

    function cacheUniformLocations() {
    const uniformNames = [
        "uSpectrogram",
        "width_offset",
        "height_offset",
        "zoom",
        "minDB",
        "maxDB",
        "maxBin",
        "minBin"
    ];

    uniformNames.forEach(name => {
        uniforms[name] = gl.value.getUniformLocation(program.value, name);
    });
}

    function renderFrame() {
    gl.value.viewport(0, 0, canvasRef.value.width, canvasRef.value.height);
    gl.value.clear(gl.value.COLOR_BUFFER_BIT); 
    gl.value.activeTexture(gl.value.TEXTURE0);
    gl.value.bindTexture(gl.value.TEXTURE_2D, specTex.value);
    gl.value.drawArrays(gl.value.TRIANGLE_STRIP, 0, 4);
}

    function updateSpectrogramIfChanged() {
    // const newHash = hashArray(renderData.data);

    // if (previousHash !== newHash) {
    //     previousHash = newHash;
        uploadSpectrogram(renderData.data);
        renderFrame();
    // }
}
    return {
        setupWebGL,
        renderFrame,
        updateSpectrogramIfChanged,
        updateValues,
    }
}


function hashArray(arr) {
    let hash = 0;
    for (let i = 0; i < arr.length; i++) {
        hash = ((hash << 5) - hash) + Math.floor(arr[i]*1000);
        hash |= 0;
    }
    return hash;
}