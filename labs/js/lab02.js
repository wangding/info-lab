$(function() {
  var $form    = $('.controller'),
      $txtNub  = $('input[type="number"]'),
      $btnDraw = $('input[type="button"]');

  var Data = [],
      chart = null;

  $form.submit(onGenClick);
  $btnDraw.click(onDrawClick);
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
    /* global echarts h roundFractional: true */
    chart = echarts.init($('.diagram').get(0));

    var option = {
      title: {
        text: '熵函数曲线',
        x: 'center',
        y: 0
      },
      tooltip: {
        formatter: '(pi, H)：({c})'
      },
      grid: [
        {left: '15%', width: '70%'}
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
        name: '熵',
        type: 'line',
        smooth: 'true',
        data: Data
      }]
    };

    chart.setOption(option, true);
  }

  function generateData() {
    var step = 1 / ($txtNub.val() - 1);

    Data = [];

    for(var p = 0; p < 1; p += step) {
      var d = [];
      d.push(roundFractional(p, 3));
      d.push(h(p));
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
            + '<td>编号</td>'
            + '<td>概率</td>'
            + '<td>自信息量</td>'
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
