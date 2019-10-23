const path = require('path')
const fs = require('fs');

function init(dataHandler, main) {
  var dataset_path = './dataset/perceptron1.txt';
  let data = null;
  let fileString = fs.readFileSync(dataset_path, "UTF-8");
  data = dataHandler(fileString);
  
  document.addEventListener("keydown", function(e) {
    if (e.which === 123) {
      require('electron').remote.getCurrentWindow().toggleDevTools();
    } else if (e.which === 116) {
      location.reload();
    }
  });

  $('#btnStart').click(function () {
    clear();
    main(data);
  });

  $('#inputFile').change(function () {
    if ($('#inputFile').prop('files')[0]) {
      let inputFile = $('#inputFile').prop('files')[0];
      $('#inputFile-label').html(inputFile.name);
      dataset_path = inputFile.path;
      $('#inputFile').val('');
      let fileString = fs.readFileSync(dataset_path, "UTF-8");
      data = dataHandler(fileString);
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
        data = dataHandler(fileString);
        $('#inputFile-label').html($(this).attr('filename'));

      });
      $('#dropdown-menu-dataset').append($dropdown_item_dataset);
    });
  });
}

function clear() {
  $("#train").children().remove();
  $("#test").children().remove();
  $(".acc").html('');
  $(".range").remove();
  $('#row-weights').children().remove();
}

function updateResult(net, w, dataset) {
  let wi = w.wi;
  let wo = w.wo;
  $('#row-weights').children().remove();

  res_test_trainSet = net.test(dataset.train, wi, wo);
  res_test_testSet = net.test(dataset.test, wi, wo);
  $('#acc_train').html('Accuracy: ' + res_test_trainSet.acc.toFixed(6));
  $('#rmse_train').html('RMSE: ' + res_test_trainSet.rmse.toFixed(6));
  $('#acc_test').html('Accuracy: ' + res_test_testSet.acc.toFixed(6));
  $('#rmse_test').html('RMSE: ' + res_test_testSet.rmse.toFixed(6));
  
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

module.exports = {
  init: init,
  clear: clear,
  updateResult: updateResult,
}