let webGLRequest;

function renderWebGL() {
  d3.csv(
    './output.csv',
    d => {
      return {
        lat: +d.Latitude,
        lon: +d.Longitude,
      };
    },
    d => {
      d = d.slice(0, numElements);

      const canvas = d3.select('#webgl');
      const gl = canvas.node().getContext('webgl');

      const vsSource = `
      attribute vec4 aVertexPosition;

      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;

      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      }
    `;

      const fsSource = `
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    `;

      const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

      const programInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(
            shaderProgram,
            'aVertexPosition'
          ),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(
            shaderProgram,
            'uProjectionMatrix'
          ),
          modelViewMatrix: gl.getUniformLocation(
            shaderProgram,
            'uModelViewMatrix'
          ),
        },
      };

      performance.mark('webgl-render-start');

      // Here's where we call the routine that builds all the
      // objects we'll be drawing.
      const buffers = initBuffers(gl);

      // Draw the scene
      drawScene(gl, programInfo, buffers, d);

      performance.mark('webgl-render-end');
      performance.measure(
        'webgl-render',
        'webgl-render-start',
        'webgl-render-end'
      );
      const measures = performance.getEntriesByName('webgl-render');
      console.log(measures[0].duration);

      const duration = `${d3.format('.0f')(measures[0].duration)} ms`;

      d3.select('#webgl-load-time').text(duration);
      d3.select('#webgl-initial-time').text(duration);

      performance.clearMarks();
      performance.clearMeasures();
    }
  );

  function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(
        'Unable to initialize the shader program: ' +
          gl.getProgramInfoLog(shaderProgram)
      );
      return null;
    }

    return shaderProgram;
  }

  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(
        'An error occurred compiling the shaders: ' +
          gl.getShaderInfoLog(shader)
      );
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const width = 0.005;
    const positions = [
      width,
      width,
      -width,
      width,
      width,
      -width,
      -width,
      -width,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return {
      position: positionBuffer,
    };
  }

  function drawScene(gl, programInfo, buffers, data) {
    gl.clearColor(1.0, 1.0, 1.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 90 * Math.PI / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 10.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    gl.useProgram(programInfo.program);

    const x = d3.scaleLinear().range([-1, 1]);
    const y = d3.scaleLinear().range([-1, 1]);

    x.domain(d3.extent(data, d => d.lon));
    y.domain(d3.extent(data, d => d.lat));

    data.forEach(d => {
      const modelViewMatrix = mat4.create();

      mat4.translate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to translate
        [x(d.lon), y(d.lat), -1]
      );

      // Tell WebGL how to pull out the positions from the position
      // buffer into the vertexPosition attribute.
      {
        const numComponents = 2; // pull out 2 values per iteration
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
          programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
      }

      // Set the shader uniforms
      gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
      );
      gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
      );

      {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
      }
    });
  }
}

function animateWebGL() {
  d3.csv(
    './output.csv',
    d => {
      return {
        lat: +d.Latitude,
        lon: +d.Longitude,
      };
    },
    d => {
      d = d.slice(0, numElements);

      const canvas = d3.select('#webgl');
      const gl = canvas.node().getContext('webgl');

      const vsSource = `
      attribute vec4 aVertexPosition;

      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;

      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      }
    `;

      const fsSource = `
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    `;

      const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

      const programInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(
            shaderProgram,
            'aVertexPosition'
          ),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(
            shaderProgram,
            'uProjectionMatrix'
          ),
          modelViewMatrix: gl.getUniformLocation(
            shaderProgram,
            'uModelViewMatrix'
          ),
        },
      };

      // Here's where we call the routine that builds all the
      // objects we'll be drawing.
      const buffers = initBuffers(gl);

      // Draw the scene
      webGLRequest = window.requestAnimationFrame(function(timestamp) {
        drawScene(gl, programInfo, buffers, d, timestamp);
      });
    }
  );

  function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(
        'Unable to initialize the shader program: ' +
          gl.getProgramInfoLog(shaderProgram)
      );
      return null;
    }

    return shaderProgram;
  }

  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(
        'An error occurred compiling the shaders: ' +
          gl.getShaderInfoLog(shader)
      );
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const width = 0.005;
    const positions = [
      width,
      width,
      -width,
      width,
      width,
      -width,
      -width,
      -width,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return {
      position: positionBuffer,
    };
  }

  let lastTimestamp;

  function drawScene(gl, programInfo, buffers, data, timestamp) {
    gl.clearColor(1.0, 1.0, 1.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 90 * Math.PI / 180; // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 10.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    gl.useProgram(programInfo.program);

    const x = d3.scaleLinear().range([-1, 1]);
    const y = d3.scaleLinear().range([-1, 1]);

    x.domain(d3.extent(data, d => d.lon));
    y.domain(d3.extent(data, d => d.lat));

    data.forEach(d => {
      const modelViewMatrix = mat4.create();

      mat4.translate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to translate
        [
          x(d.lon) + 0.1 * Math.sin(0.001 * timestamp),
          y(d.lat) + 0.1 * Math.cos(0.001 * timestamp),
          -1,
        ]
      );

      // Tell WebGL how to pull out the positions from the position
      // buffer into the vertexPosition attribute.
      {
        const numComponents = 2; // pull out 2 values per iteration
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
          programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
      }

      // Set the shader uniforms
      gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
      );
      gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
      );

      {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
      }
    });

    if (lastTimestamp !== undefined) {
      const fps = `${d3.format('.0f')(1000 / (timestamp - lastTimestamp))} /s`;

      d3.select('#webgl-update-time').text(fps);
      console.log(timestamp);
    }

    lastTimestamp = timestamp;

    webGLRequest = window.requestAnimationFrame(function(timestamp) {
      drawScene(gl, programInfo, buffers, data, timestamp);
    });
  }
}

function stopWebGL() {
  cancelAnimationFrame(webGLRequest);
}
