$(function() {
  let $form    = $('.controller'),
      $txtNub  = $('input[type="number"]'),
      $btnDraw = $('input[type="button"]');

  let Data = [],
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
    /* global echarts h roundFractional: true */
    chart = echarts.init($('.diagram').get(0));

    let option = {
      title: {
        text: '二进熵函数曲线',
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
        name: '二进熵',
        type: 'line',
        smooth: 'true',
        data: Data
      }]
    };

    chart.setOption(option, true);
  }

  function generateData() {
    let step = 1 / ($txtNub.val() - 1);

    Data = [];

    for(let p = 0; p < 1; p += step) {
      let d = [];
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
    let $tableDOM = $(''
      + '<table>'
        + '<thead>'
          + '<tr>'
            + '<td>NO.</td>'
            + '<td>p</td>'
            + '<td>1-p</td>'
            + '<td>H(p)</td>'
          + '</tr>'
        + '<tbody>'
        + '</tbody>'
      + '</table>');
    $('.data-table').append($tableDOM);
    let $tbody = $tableDOM.find('tbody');

    for(let j=0; j<Data.length; j++) {
      let $tr = $('<tr></tr>');
      $tr.append('<td>' + (j + 1) + '</td>');
      $tr.append('<td>' + Data[j][0] + '</td>');
      $tr.append('<td>' + roundFractional(1 - Data[j][0], 3) + '</td>');
      $tr.append('<td>' + Data[j][1] + '</td>');
      $tbody.append($tr);
    }
  }
});
