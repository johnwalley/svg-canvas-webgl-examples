let myReq;

function renderSVG() {
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

      const x = d3.scaleLinear().range([0, 400]);
      const y = d3.scaleLinear().range([400, 0]);

      x.domain(d3.extent(d, d => d.lon));
      y.domain(d3.extent(d, d => d.lat));

      const svg = d3.select('#svg');

      performance.mark('svg-render-start');

      const points = svg.selectAll('circle').data(d);

      points
        .enter()
        .append('circle')
        .attr('cx', d => x(d.lon))
        .attr('cy', d => y(d.lat))
        .attr('r', 2);

      points.exit().remove();

      performance.mark('svg-render-end');
      performance.measure('svg-render', 'svg-render-start', 'svg-render-end');
      const measures = performance.getEntriesByName('svg-render');
      console.log(measures[0].duration);

      const duration = `${d3.format('.0f')(measures[0].duration)} ms`;

      d3.select('#svg-initial-time').text(duration);

      performance.clearMarks();
      performance.clearMeasures();
    }
  );
}

function animateSVG() {
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

      const phase = Array.from(
        { length: d.length },
        () => 2 * Math.PI * Math.random()
      );

      const x = d3.scaleLinear().range([0, 400]);
      const y = d3.scaleLinear().range([400, 0]);

      x.domain(d3.extent(d, d => d.lon));
      y.domain(d3.extent(d, d => d.lat));

      const svg = d3.select('#svg');
      const points = svg.selectAll('circle').data(d);
      let lastTimestamp;

      function step(timestamp) {
        svg
          .selectAll('circle')
          .attr(
            'cx',
            (d, i) => x(d.lon) + 20 * Math.sin(0.001 * timestamp + phase[i])
          )
          .attr(
            'cy',
            (d, i) => y(d.lat) + 20 * Math.cos(0.001 * timestamp + phase[i])
          );

        if (lastTimestamp !== undefined) {
          const fps = `${d3.format('.0f')(
            1000 / (timestamp - lastTimestamp)
          )} /s`;

          d3.select('#svg-update-time').text(fps);
          console.log(fps);
        }

        lastTimestamp = timestamp;

        myReq = window.requestAnimationFrame(step);
      }

      points
        .enter()
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 2);

      points.exit().remove();

      myReq = window.requestAnimationFrame(step);
    }
  );
}

function stopSVG() {
  cancelAnimationFrame(myReq);
}

function clearSVG() {
  const svg = d3.select('#svg');

  svg.selectAll('circle').remove();
}
