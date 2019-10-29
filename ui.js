const ipcRenderer = require('electron').ipcRenderer;
const path = require('path')
const fs = require('fs');
const plot = require('./modules/plot');
var isLoading = false;
var dataset_path = './dataset/perceptron1.txt';
var data = null;

ipcRenderer.on('log', function(evt, arg){
  console.log(...arg);
});

let fileString = fs.readFileSync(dataset_path, "UTF-8");
ipcRenderer.send('input', fileString);
ipcRenderer.on('input_res', function(evt, arg){
  data = arg;
  console.log(data);
});

document.addEventListener("keydown", function(e) {
  if (e.which === 123) {
    require('electron').remote.getCurrentWindow().toggleDevTools();
  } else if (e.which === 116) {
    location.reload();
  }
});

$('#btnStart').click(function () {
  clear();
  toggleLoading();
  let iter = parseInt($('#in_iter').val());
  let lr = parseFloat($('#in_lr').val());
  let th = parseFloat($('#in_th').val());
  let nh = parseInt($('#in_nh').val());
  if(data != null)
    ipcRenderer.send('start', [data, iter, lr, th, nh]);
});

$('#inputFile').change(function () {
  if ($('#inputFile').prop('files')[0]) {
    let inputFile = $('#inputFile').prop('files')[0];
    $('#inputFile-label').html(inputFile.name);
    dataset_path = inputFile.path;
    $('#inputFile').val('');
    let fileString = fs.readFileSync(dataset_path, "UTF-8");
    ipcRenderer.send('input', fileString);
  }
});

var path_dir = "./dataset";
fs.readdir(path_dir, function (err, items) {
  items.forEach(item => {
    $dropdown_item_dataset = $($.parseHTML('<a class="dropdown-item dropdown-item-dataset" href="#" filename="' + item + '" filepath="' + path.join(path_dir, item) + '">' + item.slice(0, -4) + '</a>'));
    $dropdown_item_dataset.click(function () {
      inputFile = [];
      dataset_path = $(this).attr('filepath');
      let fileString = fs.readFileSync(dataset_path, "UTF-8");
      ipcRenderer.send('input', fileString);
      $('#inputFile-label').html($(this).attr('filename'));

    });
    $('#dropdown-menu-dataset').append($dropdown_item_dataset);
  });
});

function clear() {
  $("#train").children().remove();
  $("#test").children().remove();
  $(".acc").html('');
  $(".rmse").html('');
  $(".range").remove();
  $('#row-weights').children().remove();
}

function updateResult(res_plots, res_results, i_frame=0) {
  // update plot
  if (res_plots != null)
    plot.plot2d_mlp(...res_plots[i_frame]);
  else{
    $('#train').html('<h3>Train</h3>');
    $('#test').html('<h3>Test</h3>');
  }

  // update ACC, RMSE and weights
  let w = res_results[i_frame].w;
  let res_test = res_results[i_frame].res_test;
  let wi = w.wi;
  let wo = w.wo;
  $('#row-weights').children().remove();

  $('#acc_train').html('Accuracy: ' + res_test.trainSet.acc.toFixed(6));
  $('#rmse_train').html('RMSE: ' + res_test.trainSet.rmse.toFixed(6));
  $('#acc_test').html('Accuracy: ' + res_test.testSet.acc.toFixed(6));
  $('#rmse_test').html('RMSE: ' + res_test.testSet.rmse.toFixed(6));
  
  let $col_wi = $($.parseHTML('<div class="col text-center" id="col-wi"></div>'));
  let $col_wo = $($.parseHTML('<div class="col text-center" id="col-wo"></div>'));
  let $list_wi = $($.parseHTML('<ul class="list-group" id="list-wi">'));
  let $list_wo = $($.parseHTML('<ul class="list-group" id="list-wo">'));
  $('#row-weights').append([$col_wi, $col_wo]);
  $col_wi.html("<h5>Weights (Input-Hidden)</h5>");
  $col_wi.append($list_wi);
  $col_wo.html("<h5>Weights (Hidden-Output)</h5>");
  $col_wo.append($list_wo);

  for (let i = 0; i < wi.length; i++) {
    for (let j = 0; j < wi[i].length; j++) {
      let $wi = $($.parseHTML('<div class="list-group-item text-center"></div>'));
      $wi.html('wi[' + i + '][' + j + ']: ' + wi[i][j]);
      $list_wi.append($wi);
    }
  }
  for (let i = 0; i < wo.length; i++) {
    for (let j = 0; j < wo[i].length; j++) {
      let $wo = $($.parseHTML('<div class="list-group-item text-center"></div>'));
      $wo.html('wo[' + i + '][' + j + ']: ' + wo[i][j]);
      $list_wo.append($wo);
    }
  }
}

function toggleLoading() {
  isLoading = !isLoading;
  $("#spinner-start").toggleClass('d-none');
}

ipcRenderer.on('finished', function(evt, arg){
  $range = $($.parseHTML('<input class="range" id="range" type="range" min="0" max="' + (arg.result.length - 1) + '" step="1" value="' + (arg.result.length - 1) + '">'));
  $range.on('input', function () {
    updateResult(arg.plot, arg.result, $range.val());
  });
  $('#col-range').html($range);
  $range.focus();

  updateResult(arg.plot, arg.result, arg.result.length - 1);
  toggleLoading();
});