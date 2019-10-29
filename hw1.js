const ipcMain = require('electron').ipcMain;
const MLP = require('./modules/mlp');

var dataset = null;

function loadData(rawText) {
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

function main(evt, data, iter, lr, th, nh) {
  let draw = null;
  let classes = [...new Set(data.map(function (v) { return v[v.length - 1] }))];
  console.log('class_ori: %o', classes);
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
  console.log('data: %o', data);
  console.log('dataset: %o', dataset);
  let output_size = 1;
  let input_size = dataset.train[0].length - output_size;
  let net = new MLP(input_size, nh, output_size);
  // ui.toggleLoading();
  net.train(dataset.train, iter, lr, th);
  let w = net.ws[net.ws.length - 1];
  console.log("w=%o", w);

  let res_plots = null;
  let res_results = new Array();
  if (net.ni == 3 && net.nh == 3){
    res_plots = new Array();
    for(let i = 0; i <　net.ws.length; i++){
      res_plots.push(mlp_res_plot(net, i));
    }
  }
  for(let i = 0; i <　net.ws.length; i++){
    res_results.push({w: net.ws[i], res_test: mlp_res_result(net, i)});
  }

  evt.sender.send('finished', {plot: res_plots, result: res_results});
}

function mlp_res_plot(net, i_frame) {
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

function mlp_res_result(net, i_frame){
  let w = net.ws[i_frame];
  let wi = w.wi;
  let wo = w.wo;
  res_test_trainSet = net.test(dataset.train, wi, wo);
  res_test_testSet = net.test(dataset.test, wi, wo);
  return {trainSet: res_test_trainSet, testSet: res_test_testSet};
}

ipcMain.on('input', function(evt, arg) {
  evt.returnValue = loadData(arg);
});

ipcMain.on('start', function(evt, arg) {
  main(evt, ...arg);
});