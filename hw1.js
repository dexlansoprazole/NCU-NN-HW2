var ui = require('./modules/ui')
var MLP = require('./modules/mlp');
var plot = require('./modules/plot');

var dataset = null;

$(document).ready(function () {
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

  function main(data) {
    let draw = null;
    let iter = parseInt($('#in_iter').val());
    let lr = parseFloat($('#in_lr').val());
    let th = parseFloat($('#in_th').val());
    let nh = parseInt($('#in_nh').val());
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
    net = new MLP(input_size, nh, output_size);
    draw = draw_mlp;

    net.train(dataset.train, iter, lr, th);
    console.log("w=%o", net.ws.slice(-1)[0]);
    draw(net, net.ws.length - 1);
    $range = $($.parseHTML('<input class="range" id="range" type="range" min="0" max="' + (net.ws.length - 1) + '" step="1" value="' + (net.ws.length - 1) + '">'));
    $range.on('input', function () {
      draw(net, $range.val())
    });
    $('#col-range').html($range);
    $range.focus();
  }

  ui.init(loadData, main);
})

function draw_mlp(net, i_frame) {
  let w = net.ws[i_frame];
  let wi = w.wi;
  let wo = w.wo;
  let wof = net.ws[net.ws.length - 1].wo;
  let y_trans = {
    train: new Array(),
    test: new Array()
  }

  if (net.ni == 3 && net.nh == 3){
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

    fn = 'x * ' + wo[0] + ' + y * ' + wo[1] + ' - ' + wo[2];
    fn_final = 'x * ' + wof[0] + ' + y * ' + wof[1] + ' - ' + wof[2];
    plot.plot2d_mlp(dataset, fn, fn_final, y_trans);
  }else{
    $('#train').html('<h3>Train</h3>');
    $('#test').html('<h3>Test</h3>');
  }

  ui.updateResult(net, w, dataset);
}