const ipcRenderer = require('electron').ipcRenderer;
const path = require('path')
const fs = require('fs');
const plot = require('./modules/plot');
var isNumber = false;
var dataset_path = './dataset/perceptron1.txt';
var data = null;

ipcRenderer.on('log', function(evt, arg){
  console.log(...arg);
});

readFile(dataset_path, 'perceptron1.txt');
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
  if(data == null)
    console.log('Invalid dataset');
  else
    ipcRenderer.send('start', [data, iter, lr, th, nh]);
});

$('#btnTest').click(function () {
  //TODO: support file input
  if(isNumber){
    let data_num = $('#in_num').val().split("");
    data_num = [data_num.map(v => parseInt(v))];
    if(data_num[0].length == data[0].length)
      ipcRenderer.send('test_num', data_num);
    else
      console.log('Invalid input');
  }
});

$('#inputFile').change(function () {
  if ($('#inputFile').prop('files')[0]) {
    let inputFile = $('#inputFile').prop('files')[0];
    $('#inputFile').val('');
    readFile(inputFile.path, inputFile.name);
  }
});

var path_dir = "./dataset";
fs.readdir(path_dir, function (err, items) {
  items.forEach(item => {
    $dropdown_item_dataset = $($.parseHTML('<a class="dropdown-item dropdown-item-dataset" href="#" filename="' + item + '" filepath="' + path.join(path_dir, item) + '">' + item.slice(0, -4) + '</a>'));
    $dropdown_item_dataset.click(function () {
      let filename = $(this).attr('filename');
      let filepath = $(this).attr('filepath');
      readFile(filepath, filename);
    });
    $('#dropdown-menu-dataset').append($dropdown_item_dataset);
  });
});

function readFile(filepath, filename) {
  $('#inputFile-label').html(filename);
  dataset_path = filepath;
  let fileString = fs.readFileSync(dataset_path, "UTF-8");
  if(filename == 'Number.txt')
    isNumber = true;
  else
    isNumber = false;
  $('#row-num').toggleClass('d-none', !isNumber);
  ipcRenderer.send('input', {fileString: fileString, isNumber: isNumber});
}

function clear() {
  $("#plot-train").children().remove();
  $("#plot-test").children().remove();
  $('.pred').html('');
  $(".acc").html('');
  $(".rmse").html('');
  $('#row-weights').children().remove();
}

function updateResult(res_plots, res_results, i_frame=0) {
  clear();
  if(!isNumber)
    $("#plot-num").children().remove();

  // update plot
  if (res_plots != null)
    plot.plot2d_mlp(...res_plots[i_frame]);
  else{
    $('#plot-train').html('<h3>Train</h3>');
    $('#plot-test').html('<h3>Test</h3>');
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

function updateNumber(arg, i_frame = $('#range').val()) {
  $('.pred').html('');
  let results = arg[i_frame].results;
  let classes = [...new Set(data.map(function (v) { return v[v.length - 1] }))];
  let i_active = $('#carousel-num .active').index('#carousel-num .carousel-item');
  
  for(let i = 0; i < classes.length; i++){
    if(results[i_active].predict - (i / (classes.length - 1)) < 1 / (classes.length - 1) / 2){
      predict = classes[i];
      break;
    }
  }
  
  $pred_num = $('<div id="pred_num" class="pred text-center"></div>');
  $pred_num.html('Target: ' + results[i_active].target + '<br>Predict: ' + predict);
  $('#plot-num').append($pred_num);
}

function toggleLoading() {
  $("#spinner-start").toggleClass('d-none');
}

ipcRenderer.on('finished', function(evt, arg){
  $(".custom-range").remove();
  $range = $($.parseHTML('<input class="custom-range" id="range" type="range" min="0" max="' + (arg.result.length - 1) + '" step="1" value="' + (arg.result.length - 1) + '">'));
  $range.on('input', function () {
    updateResult(arg.plot, arg.result, $(this).val());
  });
  $('#col-range').html($range);
  $range.focus();

  updateResult(arg.plot, arg.result, arg.result.length - 1);
  toggleLoading();
});

ipcRenderer.on('test_num_res', function(evt, arg){
  // create carousel
  let $carousel = $('<div id="carousel-num" class="carousel slide" data-ride="carousel"></div>');
  let $carouselInner = $('<div class="carousel-inner"></div>');
  let carouselItems = new Array();
  for(let i = 0; i < arg.data.length; i++){
    let $carouselItem = $('<div class="carousel-item"  id="carouse-item-' + i + '"></div>');
    if(i == 0)
      $carouselItem.addClass('active');
    carouselItems.push($carouselItem);
  }
  $carouselInner.append(carouselItems);
  $carousel.append($carouselInner);

  if(arg.data.length > 1){
    $carousel_control_prev = $('<a class="carousel-control-prev" href="#carousel-num" role="button" data-slide="prev"><span class="carousel-control-prev-icon"><span class="sr-only">Previous</span></span></a>');
    $carousel_control_next = $('<a class="carousel-control-next" href="#carousel-num" role="button" data-slide="next"><span class="carousel-control-next-icon"><span class="sr-only">Next</span></span></a>');
    $carousel.append($carousel_control_prev);
    $carousel.append($carousel_control_next);
    $carousel.bind('slid.bs.carousel', function (evt) {
      updateNumber(arg.res_num);
    });
  }

  $('#plot-num').html($carousel);
  $('#range').on('input', function(){
    updateNumber(arg.res_num);
  })
  plot.plot_number(arg.data);
  updateNumber(arg.res_num, arg.res_num.length - 1);
});