const logger = require('./logger');

class MLP {
  constructor(ni, nh, no) {
    this.ws = null;

    this.ni = ni + 1;
    this.nh = nh + 1;
    this.no = no;

    this.ai = new Array(this.ni).fill(-1.0);
    this.ah = new Array(this.nh).fill(-1.0);
    this.ao = new Array(this.no).fill(0.0);

    this.wi = this.makeMatrix(this.ni, this.nh - 1, 0.0);
    this.wo = this.makeMatrix(this.nh, this.no, 0.0);

    for (var i = 0; i < this.ni; i++)
      for (var j = 0; j < this.nh; j++)
        this.wi[i][j] = this.rand(-1, 1);
    for (var j = 0; j < this.nh; j++)
      for (var k = 0; k < this.no; k++)
        this.wo[j][k] = this.rand(-1, 1);

    // this.wi = [
    //     [1, 1],
    //     [1, 1],
    //     [-1.2, 0.3]
    // ];
    // this.wo = [
    //     [0.4],
    //     [0.8],
    //     [0.5]
    // ];
  }

  numbersToStr(array, precision) {
    var rzStr = "";
    for (var i = 0; i < array.length; i++) {
      if (array[i] >= 0)
        rzStr += " " + array[i].toFixed(precision) + " ";
      else
        rzStr += array[i].toFixed(precision) + " ";
    }
    return rzStr;
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  dsigmoid(x) {
    return x * (1 - x);
  }

  makeMatrix(I, J, fill) {
    var m = [];
    for (var i = 0; i < I; i++)
      m.push(new Array(J).fill(fill));
    return m;
  }

  rand(a, b) {
    return (b - a) * Math.random() + a;
  }

  update(inputs, wi = this.wi, wo = this.wo) {
    for (var i = 0; i < this.ni - 1; i++)
      this.ai[i] = inputs[i];

    for (var j = 0; j < this.nh - 1; j++) {
      var sum = 0.0;
      for (var i = 0; i < this.ni; i++)
        sum = sum + this.ai[i] * wi[i][j];
      this.ah[j] = this.sigmoid(sum);
    }

    for (var k = 0; k < this.no; k++) {
      var sum = 0.0;
      for (var j = 0; j < this.nh; j++)
        sum = sum + this.ah[j] * wo[j][k];
      this.ao[k] = this.sigmoid(sum);
    }

    return this.ao;
  }

  backPropagate(targets, rate) {
    var delta_o = new Array(this.n0).fill(0.0);
    for (var k = 0; k < this.no; k++) {
      var error = targets[k] - this.ao[k];
      delta_o[k] = error * this.dsigmoid(this.ao[k]);
    }

    var delta_h = new Array(this.nh).fill(0.0);
    for (var j = 0; j < this.nh; j++) {
      var error = 0.0;
      for (var k = 0; k < this.no; k++) {
        error = error + delta_o[k] * this.wo[j][k];
      }
      delta_h[j] = error * this.dsigmoid(this.ah[j]);
    }

    for (var j = 0; j < this.nh; j++) {
      for (var k = 0; k < this.no; k++) {
        var delta = delta_o[k] * this.ah[j];
        this.wo[j][k] = this.wo[j][k] + rate * delta;
      }
    }

    for (var i = 0; i < this.ni; i++) {
      for (var j = 0; j < this.nh - 1; j++) {
        var delta = delta_h[j] * this.ai[i];
        this.wi[i][j] = this.wi[i][j] + rate * delta;
      }
    }

    var error = 0.0;
    for (var k = 0; k < targets.length; k++)
      error += 0.5 * Math.pow(targets[k] - this.ao[k], 2);
    return error;
  }

  test(data, wi, wo) {
    let acc = 0.0;
    let rmse = 0.0;
    let results = new Array();
    let classes = [...new Set(data.map(function (v) { return v[v.length - 1] }))];
    for(let i = 0; i < data.length; i++){
      let inputs = data[i].slice(0, -1);
      let targets = data[i].slice(-1);
      let result = {target: targets[0], predict: this.update(inputs, wi, wo)[0]};
      let e = result.target - result.predict;
      rmse += e * e;
      results.push(result);

      if (Math.abs(e) < 1 / (classes.length - 1) / 2){
        acc += 1;
      }
        

      // logger('test #%d\n\toutput: %o\n\ttarget: %o', i, this.update(inputs, wi, wo)[0].toFixed(3), targets[0]);
    }
    acc /= data.length;
    rmse /= data.length;
    rmse = Math.sqrt(rmse);
    return {acc: acc, rmse: rmse, results: results};
  }

  train(data, iterations, learning_rate, threshold) {
    this.ws = new Array();
    this.ws.push(this.get_weights())
    for (var n = 0; n < iterations; n++) {
      var mse = 0.0;
      data.forEach(function (data) {
        let inputs = data.slice(0, -1);
        let targets = data.slice(-1);
        let outputs = this.update(inputs);
        mse += this.backPropagate(targets, learning_rate);
      }, this);
      mse /= data.length;
      if (mse < threshold) {
        this.ws.push(this.get_weights());
        logger("MSE_Train #%d: %f", n, mse);
        return;
      }
      if (n % 100 == 0) {
        this.ws.push(this.get_weights());
        logger("MSE_Train #%d: %f", n, mse);
      }
    }
    this.ws.push(this.get_weights());
    logger("MSE_Train #%d: %f", n, mse);
  }

  get_weights() {
    let wi = new Array();
    let wo = new Array();

    for (let i = 0; i < this.wi.length; i++) {
      wi.push(new Array());
      for (let j = 0; j < this.wi[i].length; j++) {
        wi[i].push(this.wi[i][j])
      }
    }

    for (let i = 0; i < this.wo.length; i++) {
      wo.push(new Array());
      for (let j = 0; j < this.wo[i].length; j++) {
        wo[i].push(this.wo[i][j])
      }
    }

    return {wi: wi, wo: wo};
  }
}

module.exports = MLP;