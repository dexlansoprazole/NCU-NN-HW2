const ipcRenderer = require('electron').ipcRenderer;
const MLP = require('./modules/mlp');
const logger = require('./modules/logger');

var dataset = null;
var net = null;
var isNumber = false;
function loadData(arg) {
  isNumber = arg.isNumber;
  let rawText = arg.fileString;
  let data = new Array();
  var lines = rawText.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 0) {
      const line = lines[i].split(" ");
      let d = new Array();
      for (let j = 0; j < line.length; j++) {
        const v = parseFloat(line[j])
        d.push(v);
      }
      data.push(d);
    }
  }
  return data;
}

function splitData(data) {
  let train = new Array();
  let test = new Array();
  if (data.length > 4) {
    let classes = [...new Set(data.map(function (v) { return v[v.length - 1] }))];
    let data_c = [];
    for(let i = 0;i < classes.length; i++)
      data_c.push(data.filter(function (v) { return v[v.length - 1] == classes[i] }));
    // Split data for each class
    for (let k = 0; k < data_c.length; k++) {
      var nums = Array.from(Array(Math.round(data_c[k].length)).keys()),
        i = nums.length,
        j = 0;
      while (i > Math.round(data_c[k].length * 1 / 3)) {
        j = Math.floor(Math.random() * (i + 1));
        train.push(data_c[k].slice(nums[j])[0]);
        nums.splice(j, 1);
        i--;
      }
      while (i--) {
        j = Math.floor((Math.random() * (i + 1)));
        test.push(data_c[k].slice(nums[j])[0]);
        nums.splice(j, 1);
      }
    }
  }
  else {
    train = data.slice();
    test = data.slice();
  }
  return {train: train, test: test};
}

function main(data, iter, lr, th, nh) {
  let draw = null;
  let classes = [...new Set(data.map(function (v) { return v[v.length - 1] }))];
  logger('class_ori: %o', classes);
  // Normalization
  for (let i = 0; i < data.length; i++) {
    for(let j = 0; j < classes.length; j++){
      if(data[i][data[i].length-1] == classes[j]){
        data[i][data[i].length-1] = j / (classes.length - 1);
        break;
      }
    }
  }

  dataset = splitData(data);
  logger('data: %o', data);
  logger('dataset: %o', dataset);
  let output_size = 1;
  let input_size = dataset.train[0].length - output_size;
  net = new MLP(input_size, nh, output_size);
  // ui.toggleLoading();
  net.train(dataset.train, iter, lr, th);
  let w = net.ws[net.ws.length - 1];
  logger("w=%o", w);

  let res_plots = null;
  let res_results = new Array();
  if (net.ni == 3 && net.nh == 3){
    res_plots = new Array();
    for(let i = 0; i <　net.ws.length; i++){
      res_plots.push(mlp_res_plot(i));
    }
  }
  for(let i = 0; i <　net.ws.length; i++){
      res_results.push({w: net.ws[i], res_test: {trainSet: mlp_res_result(dataset.train, i), testSet: mlp_res_result(dataset.test, i)}});
  }
  return {plot: res_plots, result: res_results};
}

function mlp_res_plot(i_frame) {
  let w = net.ws[i_frame];
  let wi = w.wi;
  let wo = w.wo;
  let wof = net.ws[net.ws.length - 1].wo;
  let y_trans = {
    train: new Array(),
    test: new Array()
  }

  // Transformation
  dataset.train.forEach(function(d) {
    let ys = new Array();
    let inputs = d.slice(0, -1);
    let outputs = d.slice(-1);
    for (let i = 0; i < net.nh - 1; i++) {
      let y = 0;
      for (let j = 0; j < net.ni - 1; j++) {
        y += inputs[j] * wi[j][i];
      }
      y -= wi[net.ni - 1][i];
      y = net.sigmoid(y);
      ys.push(y);
    }
    ys.push(outputs[0]);
    y_trans.train.push(ys);
  });

  dataset.test.forEach(function (d) {
    let ys = new Array();
    let inputs = d.slice(0, -1);
    let outputs = d.slice(-1);
    for (let i = 0; i < net.nh - 1; i++) {
      let y = 0;
      for (let j = 0; j < net.ni - 1; j++) {
        y += inputs[j] * wi[j][i];
      }
      y -= wi[net.ni - 1][i];
      y = net.sigmoid(y);
      ys.push(y);
    }
    ys.push(outputs[0]);
    y_trans.test.push(ys);
  });

  let fn = 'x * ' + wo[0] + ' + y * ' + wo[1] + ' - ' + wo[2];
  let fn_final = 'x * ' + wof[0] + ' + y * ' + wof[1] + ' - ' + wof[2];
  return [dataset, fn, fn_final, y_trans];
}

function mlp_res_result(data = dataset.test, i_frame){
  let w = net.ws[i_frame];
  let wi = w.wi;
  let wo = w.wo;
  res_test = net.test(data, wi, wo);
  return res_test;
}

ipcRenderer.on('input', function(evt, arg) {
  evt.sender.send('input_res', loadData(arg));
});

ipcRenderer.on('start', function(evt, arg) {
  evt.sender.send('finished', main(...arg));
});

ipcRenderer.on('test_num', function(evt, arg) {
  let res_num = new Array();
  for(let i = 0; i <　net.ws.length; i++){
    res_num.push(mlp_res_result(arg, i));
  }
  evt.sender.send('test_num_res', res_num);
});