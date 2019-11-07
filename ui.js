const ipcRenderer = require('electron').ipcRenderer;
const path = require('path')
const fs = require('fs');
const plot = require('./modules/plot');
var isNumber = false;
var path_dir = "./dataset";
var dataset_path = './dataset/perceptron1.txt';
var inputRes = null;
var data_num = null;

document.addEventListener("keydown", function(e) {
  if (e.which === 123) {
    require('electron').remote.getCurrentWindow().toggleDevTools();
  } else if (e.which === 116) {
    location.reload();
  }
});

function readFile(filepath, filename) {
  $('#inputFile-label').html(filename);
  dataset_path = filepath;
  let fileString = fs.readFileSync(dataset_path, "UTF-8");
  let isNum = false;
  if (filename == 'Number.txt')
    isNum = true;
  $('#row-num').toggleClass('d-none', !isNum);
  $('#btnTest').addClass('disabled');
  ipcRenderer.send('input', {fileString: fileString, isNumber: isNum});
}

function clear() {
  $("#plot-train").children().remove();
  $("#plot-test").children().remove();
  $('.pred').html('');
  $(".acc").html('');
  $(".rmse").html('');
  $('#row-weights').children().remove();
}

function updateResult(res_plots, res_results, i_frame = 0) {
  clear();
  if (!isNumber) {
    $("#plot-train-num").children().remove();
    $("#plot-test-num").children().remove();
  }

  // update plot
  if (res_plots != null && !isNumber)
    plot.plot2d_mlp(...res_plots[i_frame]);
  else {
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

function updateNumber(dataset, result, i_frame = $('#range').val()) {
  $('.pred').remove();
  let results = {train: result[i_frame].res_test.trainSet.results, test: result[i_frame].res_test.testSet.results};
  let classes = [...new Set(dataset.train.map(function(v) {return v[v.length - 1]}))];
  let i_active = {train: $('#carousel-train-num .active').index('#carousel-train-num .carousel-item'), test: $('#carousel-test-num .active').index('#carousel-test-num .carousel-item')};
  let predict = {train: null, test: null};

  if (i_active.train >= 0 && i_active.test >= 0) {
    for (let i = 0; i < classes.length; i++) {
      if (results.train[i_active.train].predict - (i / (classes.length - 1)) < 1 / (classes.length - 1) / 2 && predict.train == null)
        predict.train = classes[i];
      if (results.test[i_active.test].predict - (i / (classes.length - 1)) < 1 / (classes.length - 1) / 2 && predict.test == null)
        predict.test = classes[i];
    }

    let $pred_train_num = $('<div id="pred-train-num" class="pred text-center"></div>');
    $pred_train_num.html('#' + i_active.train + '&nbsp;&nbsp;&nbsp;&nbsp;Target: ' + results.train[i_active.train].target_ori + '&nbsp;&nbsp;&nbsp;&nbsp;Predict: ' + predict.train);
    $('#plot-train-num').append($pred_train_num);

    let $pred_test_num = $('<div id="pred-test-num" class="pred text-center"></div>');
    $pred_test_num.html('#' + i_active.test + '&nbsp;&nbsp;&nbsp;&nbsp;Target: ' + results.test[i_active.test].target_ori + '&nbsp;&nbsp;&nbsp;&nbsp;Predict: ' + predict.test);
    $('#plot-test-num').append($pred_test_num);
  }
}

function updateNumberHandler(evt) {
  updateNumber(evt.data.dataset, evt.data.result);
}

function carousels(dataset, result) {
  // create carousel
  let $carousel = {
    train: $('<div id="carousel-train-num" class="carousel slide" data-ride="carousel"></div>'),
    test: $('<div id="carousel-test-num" class="carousel slide" data-ride="carousel"></div>')
  };
  let $carouselInner = {
    train: $('<div class="carousel-inner"></div>'),
    test: $('<div class="carousel-inner"></div>')
  };
  let carouselItems = {train: new Array(), test: new Array()};
  for (let i = 0; i < dataset.train.length; i++) {
    let $carouselItem = $('<div class="carousel-item"  id="carouse-item-train-num' + i + '"></div>');
    if (i == 0)
      $carouselItem.addClass('active');
    carouselItems.train.push($carouselItem);
  }
  for (let i = 0; i < dataset.test.length; i++) {
    let $carouselItem = $('<div class="carousel-item"  id="carouse-item-test-num' + i + '"></div>');
    if (i == 0)
      $carouselItem.addClass('active');
    carouselItems.test.push($carouselItem);
  }
  $carouselInner.train.append(carouselItems.train);
  $carouselInner.test.append(carouselItems.test);
  $carousel.train.append($carouselInner.train);
  $carousel.test.append($carouselInner.test);

  if (dataset.train.length > 1) {
    let $carousel_control_prev = $('<a class="carousel-control-prev" href="#carousel-train-num" role="button" data-slide="prev"><span class="carousel-control-prev-icon"><span class="sr-only">Previous</span></span></a>');
    let $carousel_control_next = $('<a class="carousel-control-next" href="#carousel-train-num" role="button" data-slide="next"><span class="carousel-control-next-icon"><span class="sr-only">Next</span></span></a>');
    $carousel.train.append($carousel_control_prev);
    $carousel.train.append($carousel_control_next);
    $carousel.train.unbind('slid.bs.carousel', updateNumberHandler);
    $carousel.train.bind('slid.bs.carousel', {dataset: dataset, result: result}, updateNumberHandler);
  }
  if (dataset.test.length > 1) {
    let $carousel_control_prev = $('<a class="carousel-control-prev" href="#carousel-test-num" role="button" data-slide="prev"><span class="carousel-control-prev-icon"><span class="sr-only">Previous</span></span></a>');
    let $carousel_control_next = $('<a class="carousel-control-next" href="#carousel-test-num" role="button" data-slide="next"><span class="carousel-control-next-icon"><span class="sr-only">Next</span></span></a>');
    $carousel.test.append($carousel_control_prev);
    $carousel.test.append($carousel_control_next);
    $carousel.test.unbind('slid.bs.carousel', updateNumberHandler);
    $carousel.test.bind('slid.bs.carousel', {dataset: dataset, result: result}, updateNumberHandler);
  }

  $carousel.train.carousel({
    interval: false
  });
  $carousel.test.carousel({
    interval: false
  });

  return $carousel;
}

function showAlert(level, title, msg) {
  $alert = $('<div class="alert alert-' + level + '" role="alert"></div>');
  $btnClose = $('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
  $alert.append('<span><strong>' + title + ':</strong> ' + msg + '</span>');
  $alert.append($btnClose);
  $alert.hide();
  $alert.click(function() {
    $(this).alert('close');
  });
  $('#alert').prepend($alert);
  $alert.fadeTo('normal', 1).delay(3000).fadeTo('normal', 0, function() {
    $(this).alert('close');
  });
}

function toggleLoading() {
  $("#spinner-start").toggleClass('d-none');
}

$('#btnStart').click(function() {
  isNumber = inputRes.isNumber;
  clear();
  $("#col-range").children().remove();
  toggleLoading();
  let iter = parseInt($('#in_iter').val());
  let lr = parseFloat($('#in_lr').val());
  let th = parseFloat($('#in_th').val());
  let nh = parseInt($('#in_nh').val());

  if (inputRes.data == null || inputRes.data == '')
    showAlert('danger', 'Error', 'Invalid dataset');
  else
    ipcRenderer.send('start', [inputRes.data, iter, lr, th, nh]);
});

$('.dropdown-item-num').click(function() {
  let $in_num_text = $('<input id="in_num_text" type="text" class="form-control in_num" value="11111100011000110001111110">');
  let $in_num_file = $('<div class="custom-file in_num"><input type="file" class="custom-file-input in_num" id="in_num_file"><label class="custom-file-label">Choose file</label></div>');
  $in_num_file.children('input').change(function() {
    if ($(this).prop('files')[0]) {
      let inputFile = $(this).prop('files')[0];
      let fileString = fs.readFileSync(inputFile.path, "UTF-8");
      $in_num_file.find('.custom-file-label').html(inputFile.name);
      ipcRenderer.send('input_num', {fileString: fileString, isNumber: isNumber});
    }
  });
  $('#row-num').find('.in_num').remove();
  let type = $(this).html();
  $('#dropdownMenuButton-num').html(type);
  if (type == 'Text')
    $('#row-num').find('.input-group').append($in_num_text);
  else if (type == 'File')
    $('#row-num').find('.input-group').append($in_num_file);
  data_num = null;
});

$('#btnTest').click(function() {
  if (isNumber && !$(this).hasClass('disabled')) {
    let $in_num = $("input[class*=in_num]");
    if ($in_num.attr('type') == 'text') {
      data_num = $in_num.val().split("");
      data_num = [data_num.map(v => parseInt(v))];
    }

    if (data_num != null) {
      console.log('Test Input: ', data_num);
      if (data_num[0].length == inputRes.data[0].length)
        ipcRenderer.send('test_num', data_num);
      else
        showAlert('danger', 'Error', 'Invalid input');
    }
    else
      showAlert('danger', 'Error', 'Invalid input');
  }
});

$('#inputFile').change(function() {
  if ($(this).prop('files')[0]) {
    let inputFile = $(this).prop('files')[0];
    $(this).val('');
    readFile(inputFile.path, inputFile.name);
  }
});

ipcRenderer.on('log', function(evt, arg) {
  console.log(...arg);
});

ipcRenderer.on('input_res', function(evt, arg) {
  inputRes = arg;
});

ipcRenderer.on('input_num_res', function(evt, arg) {
  data_num = arg.data;
  $('#btnTest').removeClass('disabled');
});

ipcRenderer.on('finished', function(evt, arg) {
  $range = $($.parseHTML('<input class="custom-range" id="range" type="range" min="0" max="' + (arg.result.length - 1) + '" step="1" value="' + (arg.result.length - 1) + '">'));
  $range.on('input', function() {
    updateResult(arg.plot, arg.result, $(this).val());
  });
  $('#col-range').html($range);

  updateResult(arg.plot, arg.result, arg.result.length - 1);
  if (isNumber) {
    $carousel = carousels(arg.plot, arg.result);
    $('#plot-train-num').html($carousel.train);
    $('#plot-test-num').html($carousel.test);
    $('#range').unbind('input', updateNumberHandler);
    $('#range').bind('input', {dataset: arg.plot, result: arg.result}, updateNumberHandler);
    plot.plot_number(arg.plot);
    updateNumber(arg.plot, arg.result, arg.result.length - 1);
  }

  toggleLoading();
  $('#btnTest').removeClass('disabled');
});

ipcRenderer.on('test_num_res', function(evt, arg) {
  $carousel = carousels(arg.dataset, arg.res_num)

  $('#plot-train-num').html($carousel.train);
  $('#plot-test-num').html($carousel.test);
  $('#range').unbind('input', updateNumberHandler);
  $('#range').bind('input', {dataset: arg.dataset, result: arg.res_num}, updateNumberHandler);
  plot.plot_number(arg.dataset);
  updateNumber(arg.dataset, arg.res_num);
});

readFile(dataset_path, 'perceptron1.txt');
fs.readdir(path_dir, function(err, items) {
  items.forEach(item => {
    $dropdown_item_dataset = $($.parseHTML('<a class="dropdown-item dropdown-item-dataset" href="#" filename="' + item + '" filepath="' + path.join(path_dir, item) + '">' + item.slice(0, -4) + '</a>'));
    $dropdown_item_dataset.click(function() {
      let filename = $(this).attr('filename');
      let filepath = $(this).attr('filepath');
      readFile(filepath, filename);
    });
    $('#dropdown-menu-dataset').append($dropdown_item_dataset);
  });
});