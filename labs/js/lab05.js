/* global c echarts roundFractional: true */
$(function() {
  var $form    = $('.controller'),
      $txtNub  = $('input[type="number"]'),
      $btnDraw = $('input[type="button"]');

  var Data  = [],
      chart = null;

  /* global $forkMeGH, $bszPageFooter */
  $forkMeGH.show('https://github.com/wangding/info-lab');
  $bszPageFooter.show('body');

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
    chart = echarts.init($('.diagram').get(0));

    var option = {
      title: {
        text: '串联信道容量函数曲线',
        x: 'center',
        y: 0
      },
      tooltip: {
        formatter: '(pi, C0, C1, C2)：({c})'
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
      series: [
        {
          name: '信道容量 1',
          type: 'line',
          smooth: 'true',
          data: Data,
          encode: {
            x: [0],
            y: [1]
          }
        },
        {
          name: '信道容量 2',
          type: 'line',
          smooth: 'true',
          data: Data,
          encode: {
            x: [0],
            y: [2]
          }
        },
        {
          name: '信道容量 3',
          type: 'line',
          smooth: 'true',
          data: Data,
          encode: {
            x: [0],
            y: [3]
          }
        }
      ]
    };

    chart.setOption(option, true);
  }

  function generateData() {
    var step = 1 / ($txtNub.val() - 1);

    Data = [];

    for(var p = 0; p < 1; p += step) {
      var d = [];
      d.push(roundFractional(p, 3));
      d.push(c(p));
      d.push(c(2*p*(1-p)));
      d.push(c(Math.pow(p, 3) + 3*p*Math.pow(1-p, 2)));
      Data.push(d);
    }

    if(Data[Data.length - 1][0] !== 1) {
      Data.push([1, 1, 1, 1]);
    }
    //console.log(Data);
  }

  function displayDataTable() {
    $('.data-table').html('');
    var $tableDOM = $(''
      + '<table>'
        + '<thead>'
          + '<tr>'
            + '<td>NO.</td>'
            + '<td>p</td>'
            + '<td>C0</td>'
            + '<td>C1</td>'
            + '<td>C2</td>'
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
      $tr.append('<td>' + Data[j][2] + '</td>');
      $tr.append('<td>' + Data[j][3] + '</td>');
      $tbody.append($tr);
    }
  }
});
