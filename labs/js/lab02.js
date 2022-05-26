let $form    = $('.controller'),
    $txtNub  = $('input[type="number"]'),
    $btnDraw = $('input[type="button"]');

let Data = [],
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
  /* global echarts h roundFractional: true */
  chart = echarts.init($('.diagram'));

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
  let step = 1 / ($txtNub.value - 1);

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
  $('.data-table').innerHTML = ''
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
    + '</table>';
  let $tbody = $('tbody');

  let dom = '';
  for(let j=0; j<Data.length; j++) {
    dom += `<tr><td>${j+1}</td><td>${Data[j][0]}</td><td>${roundFractional(1-Data[j][0], 3)}</td><td>${Data[j][1]}</td></tr>`;
  }
  $tbody.innerHTML = dom;
}
