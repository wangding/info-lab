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
  /* global echarts roundFractional i: true */
  chart = echarts.init($('.diagram'));

  let option = {
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
  let step = 1 / $txtNub.value;

  Data = [];

  for(let p = step; p < 1; p += step) {
    let d = [];
    d.push(roundFractional(p, 3));
    d.push(i(p));
    Data.push(d);
  }

  if(Data[Data.length - 1][0] !== 1) {
    Data.push([1, 0]);
  }
}

function displayDataTable() {
  $('.data-table').innerHTML = '' 
    + '<table>'
      + '<thead>'
        + '<tr>'
          + '<td>NO.</td>'
          + '<td>p</td>'
          + '<td>I(xi)</td>'
        + '</tr>'
      + '<tbody>'
      + '</tbody>'
    + '</table>';
  let $tbody = $('tbody');

  let dom = '';
  for(let j=0; j<Data.length; j++) {
    dom += `<tr><td>${j+1}</td><td>${Data[j][0]}</td><td>${Data[j][1]}</td></tr>`;
  }
  $tbody.innerHTML = dom;
}
