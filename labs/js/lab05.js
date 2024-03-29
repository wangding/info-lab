/* global c echarts roundFractional: true */
let $form    = $('.controller'),
    $txtNub  = $('input[type="number"]'),
    $btnDraw = $('input[type="button"]');

let Data  = [],
    chart = null;

$form.onsubmit = onGenClick;
$btnDraw.onclick = onDrawClick;

window.onresize = function() {
  if(chart !== null) chart.resize();
};

function onGenClick(e) {
  e.preventDefault();

  $btnDraw.removeAttribute('disabled');
  generateData();
  displayDataTable();
}

function onDrawClick() {
  chart = echarts.init($('.diagram'));

  let option = {
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
  let step = 1 / ($txtNub.value - 1);

  Data = [];

  for(let p = 0; p < 1; p += step) {
    let d = [];
    d.push(roundFractional(p, 3));
    d.push(c(p));
    d.push(c(2*p*(1-p)));
    d.push(c(Math.pow(p, 3) + 3*p*Math.pow(1-p, 2)));
    Data.push(d);
  }

  if(Data[Data.length - 1][0] !== 1) {
    Data.push([1, 1, 1, 1]);
  }
}

function displayDataTable() {
  $('.data-table').innerHTML = ''
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
    + '</table>';
  let $tbody = $('tbody');

  let dom = '';
  for(let j=0; j<Data.length; j++) {
    dom += `<tr><td>${j+1}</td><td>${Data[j][0]}</td><td>${Data[j][1]}</td><td>${Data[j][2]}</td><td>${Data[j][3]}</td></tr>`;
  }
  $tbody.innerHTML = dom;
}
