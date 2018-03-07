let canvasRequest;

function renderCanvas() {
  d3.csv(
    './output.csv',
    d => {
      return {
        lat: +d.Latitude,
        lon: +d.Longitude,
      };
    },
    d => {
      const x = d3.scaleLinear().range([0, 800]);
      const y = d3.scaleLinear().range([800, 0]);

      x.domain(d3.extent(d, d => d.lon));
      y.domain(d3.extent(d, d => d.lat));

      const canvas = d3.select('#canvas');
      const context = canvas.node().getContext('2d');

      performance.mark('canvas-render-start');

      d.forEach(d => {
        context.beginPath();
        context.arc(x(d.lon), y(d.lat), 4, 0, Math.PI * 2);
        context.fill();
      });

      performance.mark('canvas-render-end');
      performance.measure(
        'canvas-render',
        'canvas-render-start',
        'canvas-render-end'
      );
      const measures = performance.getEntriesByName('canvas-render');
      console.log(measures[0].duration);

      const duration = `${d3.format('.0f')(measures[0].duration)} ms`;

      d3.select('#canvas-load-time').text(duration);
      d3.select('#canvas-initial-time').text(duration);
      `${d3.format('.0f')(measures[0].duration)} ms`;

      performance.clearMarks();
      performance.clearMeasures();
    }
  );
}

function animateCanvas() {
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

      const x = d3.scaleLinear().range([0, 800]);
      const y = d3.scaleLinear().range([800, 0]);

      x.domain(d3.extent(d, d => d.lon));
      y.domain(d3.extent(d, d => d.lat));

      const canvas = d3.select('#canvas');
      const context = canvas.node().getContext('2d');
      let lastTimestamp;

      function step(timestamp) {
        performance.mark('canvas-render-start');

        context.clearRect(0, 0, 800, 800); // clear canvas

        d.forEach(d => {
          context.beginPath();
          context.arc(
            x(d.lon) + 20 * Math.sin(0.001 * timestamp),
            y(d.lat) + 20 * Math.cos(0.001 * timestamp),
            4,
            0,
            Math.PI * 2
          );
          context.fill();
        });

        if (lastTimestamp !== undefined) {
          const fps = `${d3.format('.0f')(
            1000 / (timestamp - lastTimestamp)
          )} /s`;

          d3.select('#canvas-update-time').text(fps);
        }

        lastTimestamp = timestamp;

        canvasRequest = window.requestAnimationFrame(step);
      }

      canvasRequest = window.requestAnimationFrame(step);
    }
  );
}

function stopCanvas() {
  cancelAnimationFrame(canvasRequest);
}
