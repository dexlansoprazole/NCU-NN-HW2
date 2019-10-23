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
      fn: fn,
      fnType: 'implicit',
      color: 'rgb(0, 204, 102)'
    }, {
      fn: fn_final,
      fnType: 'implicit',
      color: "rgba(0, 204, 102, 0.3)",
    }]
  }

  let classes = [...new Set(dataset.train.concat(dataset.test).map(function (v) { return v[v.length - 1] }))];
  for(let i = 0; i < classes.length; i++){
    // options_train.data.push({
    //   points: dataset.train.filter(function (v) { return v[v.length - 1] == classes[i] }),
    //   fnType: 'points',
    //   graphType: 'scatter',
    //   attr: {
    //     r: 3
    //   }
    // });

    options_train.data.push({
      points: y_trans.train.filter(function (v) { return v[v.length - 1] == classes[i] }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3,
        opacity: 1,
        // fill: '#0000ff',
        // stroke: '#0000ff'
      }
    });

    // options_test.data.push({
    //   points: dataset.test.filter(function (v) { return v[v.length - 1] == classes[i] }),
    //   fnType: 'points',
    //   graphType: 'scatter',
    //   attr: {
    //     r: 3
    //   }
    // });

    options_test.data.push({
      points: y_trans.test.filter(function (v) { return v[v.length - 1] == classes[i] }),
      fnType: 'points',
      graphType: 'scatter',
      attr: {
        r: 3,
        opacity: 1,
        // fill: '#0000ff',
        // stroke: '#0000ff'
      }
    });
  }

  let plot_train = functionPlot(options_train);
  let plot_test = functionPlot(options_test);
  plot_train.addLink(plot_test);
  plot_test.addLink(plot_train);
}

module.exports = {
  plot2d_mlp: plot2d_mlp
}