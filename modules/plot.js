window.d3 = require('d3');
const functionPlot = require('function-plot');
const colormap = require('colormap');
const colors = colormap({
    colormap: 'rainbow',
    nshades: 50,
    format: 'hex',
    alpha: 1
  });

function plot2d_mlp(dataset, fn, fn_final, y_trans) {
  plot_train = plot2d_mlp_train(dataset, fn, fn_final, y_trans);
  plot_test = plot2d_mlp_test(dataset, fn, fn_final, y_trans);
  plot_train.addLink(plot_test);
  plot_test.addLink(plot_train);
}

function plot2d_mlp_train(dataset, fn, fn_final, y_trans) {
  let width = $('#plot-train').width();
  let classes = [...new Set(dataset.train.map(function (v) { return v[v.length - 1] }))];
  let options_train = {
    title: 'Train',
    target: '#plot-train',
    width: width,
    height: width,
    grid: true,
    xAxis: {
      label: 'x - axis',
      domain: [-0.5, 1.5]
    },
    yAxis: {
      label: 'y - axis',
      domain: [-0.5, 1.5]
    },
    data: [{
      fn: fn,
      fnType: 'implicit',
      color: 'rgb(0, 204, 102)'
    }, {
      fn: fn_final,
      fnType: 'implicit',
      color: "rgba(0, 204, 102, 0.3)",
    }]
  }

  for(let i = 0; i < classes.length; i++){
    options_train.data.push({
      points: dataset.train.filter(function (v) { return v[v.length - 1] == classes[i] }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        opacity: 0.3,
        fill: colors[i * 10],
        stroke: colors[i * 10],
        r: 3,
      }
    });

    options_train.data.push({
      points: y_trans.train.filter(function (v) { return v[v.length - 1] == classes[i] }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3,
        opacity: 1,
        fill: colors[i * 10],
        stroke: colors[i * 10]
      }
    });
  }

  return functionPlot(options_train);
}

function plot2d_mlp_test(dataset, fn, fn_final, y_trans) {
  let width = $('#plot-test').width();
  let classes = [...new Set(dataset.train.map(function (v) { return v[v.length - 1] }))];
  let options_test = {
    title: 'Test',
    target: '#plot-test',
    width: width,
    height: width,
    grid: true,
    xAxis: {
      label: 'x - axis',
      domain: [-0.5, 1.5]
    },
    yAxis: {
      label: 'y - axis',
      domain: [-0.5, 1.5]
    },
    data: [{
      fn: fn,
      fnType: 'implicit',
      color: 'rgb(0, 204, 102)'
    }, {
      fn: fn_final,
      fnType: 'implicit',
      color: "rgba(0, 204, 102, 0.3)",
    }]
  }

  for(let i = 0; i < classes.length; i++){
    options_test.data.push({
      points: dataset.test.filter(function (v) { return v[v.length - 1] == classes[i] }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        opacity: 0.3,
        fill: colors[i * 10],
        stroke: colors[i * 10],
        r: 3,
      }
    });

    options_test.data.push({
      points: y_trans.test.filter(function (v) { return v[v.length - 1] == classes[i] }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3,
        opacity: 1,
        fill: colors[i * 10],
        stroke: colors[i * 10]
      }
    });
  }

  return functionPlot(options_test);
}

function gridData(width, height, row, col, stroke, data) {
  let res = new Array();
  let xpos = stroke;
  let ypos = stroke;
  let width_block = (width - stroke * (col + 1)) / col;
  let height_block = (height - stroke * (row + 1)) / row;;

  for (let i = 0; i < row; i++) {
    res.push( new Array() );
    for (let j = 0; j < col; j++) {
      let enable = null;
      if (data[i * col + j] == 1)
        enable = true;
      else
        enable = false;
      res[i].push({
          x: xpos,
          y: ypos,
          width: width_block,
          height: height_block,
          enable: enable
      })
      xpos += width_block;
    }
    xpos = stroke;
    ypos += height_block; 
  }
  return res;
}

function plot_number(datas) {
  let width = $('#plot-train-num').width();
  for(let i = 0; i < datas.train.length; i++){
    let data = datas.train[i];
    let edge = Math.floor(Math.sqrt(data.length - 1));
    let gd = gridData(width, width, edge, edge, 1, data);
    let grid = d3.select('#carouse-item-train-num' + i)
      .append("svg")
      .attr("class", "d-block w-100")
      .attr("width", width)
      .attr("height", width);
    let row = grid.selectAll(".row")
      .data(gd)
      .enter().append("g")
      .attr("class", "row");
    let column = row.selectAll(".square")
      .data(function(d) { return d; })
      .enter().append("rect")
      .attr("class","square")
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("width", function(d) { return d.width; })
      .attr("height", function(d) { return d.height; })
      .style("fill", function(d) { return d.enable?"#000":"#fff"; })
      .style("stroke", "#ccc");
  }
  width = $('#plot-test-num').width();
  for(let i = 0; i < datas.test.length; i++){
    let data = datas.test[i];
    let edge = Math.floor(Math.sqrt(data.length - 1));
    let gd = gridData(width, width, edge, edge, 1, data);
    let grid = d3.select('#carouse-item-test-num' + i)
      .append("svg")
      .attr("class", "d-block w-100")
      .attr("width", width)
      .attr("height", width);
    let row = grid.selectAll(".row")
      .data(gd)
      .enter().append("g")
      .attr("class", "row");
    let column = row.selectAll(".square")
      .data(function(d) { return d; })
      .enter().append("rect")
      .attr("class","square")
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("width", function(d) { return d.width; })
      .attr("height", function(d) { return d.height; })
      .style("fill", function(d) { return d.enable?"#000":"#fff"; })
      .style("stroke", "#ccc");
  }
}

module.exports = {
  plot2d_mlp: plot2d_mlp,
  plot2d_mlp_train: plot2d_mlp_train,
  plot2d_mlp_test: plot2d_mlp_test,
  plot_number: plot_number
}