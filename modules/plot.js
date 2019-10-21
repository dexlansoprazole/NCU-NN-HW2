window.d3 = require('d3');
const functionPlot = require('function-plot');

function plot2d_mlp(dataset, fn, fn_final, y_trans) {
  let width = $('#train').width();
  let options_train = {
    title: 'Train',
    target: '#train',
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
      points: dataset.train.filter(function (v) { return v[2] == 0 }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3
      }
    }, {
      points: dataset.train.filter(function (v) { return v[2] == 1 }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3
      }
    }, {
      points: y_trans.train.filter(function (v) { return v[2] == 0 }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3,
        fill: '#0000ff',
        stroke: '#0000ff'
      }
    }, {
      points: y_trans.train.filter(function (v) { return v[2] == 1 }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3,
        fill: '#ff0000',
        stroke: '#ff0000'
      }
    }, {
      fn: fn,
      fnType: 'implicit',
      color: 'rgb(0, 204, 102)'
    }, {
      fn: fn_final,
      fnType: 'implicit',
      color: "rgba(0, 204, 102, 0.3)",
    }]
  }

  let options_test = {
    title: 'Test',
    target: '#test',
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
      points: dataset.test.filter(function (v) { return v[2] == 0 }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3
      }
    }, {
      points: dataset.test.filter(function (v) { return v[2] == 1 }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3
      }
    }, {
      points: y_trans.test.filter(function (v) { return v[2] == 0 }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3,
        fill: '#0000ff',
        stroke: '#0000ff'
      }
    }, {
      points: y_trans.test.filter(function (v) { return v[2] == 1 }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3,
        fill: '#ff0000',
        stroke: '#ff0000'
      }
    }, {
      fn: fn,
      fnType: 'implicit',
      color: 'rgb(0, 204, 102)'
    }, {
      fn: fn_final,
      fnType: 'implicit',
      color: "rgba(0, 204, 102, 0.3)",
    }]
  }
  let plot_train = functionPlot(options_train);
  let plot_test = functionPlot(options_test);
  plot_train.addLink(plot_test);
  plot_test.addLink(plot_train);
}

module.exports = {
  plot2d_mlp: plot2d_mlp
}