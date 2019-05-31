$(function() {
  var $form    = $('.controller'),
      $txtNub  = $('input[type="number"]'),
      $btnDraw = $('input[type="button"]');

  var Data  = [],
      chart = null;

  $form.submit(onGenClick);
  $btnDraw.click(onDrawClick);
  /* global $forkMeGH */
  $forkMeGH.show('https://github.com/wangding/info-lab');

  window.onresize = function() {
    if(chart !== null) chart.resize();
  };

  function onGenClick(e) {
    e.preventDefault();

    $btnDraw.removeAttr('disabled');
    generateData();
    displayDataTable();
  }

  function onDrawClick() {
    /* global echarts roundFractional i: true */
    chart = echarts.init($('.diagram').get(0));

    var option = {
      title: {
        text: '自信息量函数曲线',
        x: 'center',
        y: 0
      },
      tooltip: {
        formatter: '(pi, I)：({c})'
      },
      grid: [
        {left: '30%', width: '40%'}
      ],
      xAxis: {
        type: 'value',
        axisPointer: {show: 'true'}
      },
      yAxis: {
        type: 'value',
        axisPointer: {show: 'true'}
      },
      series: [{
        name: '自信息量',
        type: 'line',
        smooth: 'true',
        data: Data
      }]
    };

    chart.setOption(option, true);
  }

  function generateData() {
    var step = 1 / $txtNub.val();

    Data = [];

    for(var p = step; p < 1; p += step) {
      var d = [];
      d.push(roundFractional(p, 3));
      d.push(i(p));
      Data.push(d);
    }

    if(Data[Data.length - 1][0] !== 1) {
      Data.push([1, 0]);
    }
  }

  function displayDataTable() {
    $('.data-table').html('');
    var $tableDOM = $(''
      + '<table>'
        + '<thead>'
          + '<tr>'
            + '<td>NO.</td>'
            + '<td>p</td>'
            + '<td>I(xi)</td>'
          + '</tr>'
        + '<tbody>'
        + '</tbody>'
      + '</table>');
    $('.data-table').append($tableDOM);
    var $tbody = $tableDOM.find('tbody');

    for(var j=0; j<Data.length; j++) {
      var $tr = $('<tr></tr>');
      $tr.append('<td>' + (j + 1) + '</td>');
      $tr.append('<td>' + Data[j][0] + '</td>');
      $tr.append('<td>' + Data[j][1] + '</td>');
      $tbody.append($tr);
    }
  }
});
