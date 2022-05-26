/* global roundFractional: true */
let $form     = $('.controller'),           // 表单
    $p        = $('input[type="number"]'),  // 错误转移概率文本框
    $inputImg = $('.input img'),              
    inputImg  = $inputImg,     // 信源图片
    outputImg = $('canvas');   // 信宿图片

$form.onsubmit = onTrans;
$inputImg.onclick = onClick;

function onClick() {
  outputImg.style.display = 'none';
  let file = $inputImg.getAttribute('src');
  console.log(file);
  file = file.replace(/\d/, function(n) { return (Number(n) + 1) % 3; });
  $inputImg.setAttribute('src', file);
}

function onTrans(e) {
  e.preventDefault();
  
  // 准备参数
  let width = inputImg.width, height = inputImg.height;

  outputImg.width = width;
  outputImg.height = height;

  let p = Number($p.value);                   // 错误转移概率
  let ctx = outputImg.getContext('2d');
  ctx.drawImage(inputImg, 0, 0, width, height);

  let imgData = ctx.getImageData(0, 0, width, height);
  let totalPixel = width * height;            // 图片总像素数
  let pixels;                                 // 产生干扰的像素数
  
  if(p > 0.5) {
    pixels = roundFractional(totalPixel * (1-p), 0);
    convertImg(imgData);
  } else {
    pixels = roundFractional(totalPixel * p, 0);
  }

  // 产生干扰数据
  let xy = {};
  for(let j=0; j<pixels; j++) {
    let x   = roundFractional(Math.random() * (width - 1), 0),
        y   = roundFractional(Math.random() * (height - 1), 0),
        key = x + ',' + y;

    if(xy[key] === 0) {
      --j;
    } else {
      xy[key] = 0;
      convertPixel(imgData, x, y);
    }
  }

  // 显示干扰后的图片
  ctx.putImageData(imgData, 0, 0);
  outputImg.style.display = 'block';
}

/**
 * 翻转整个图片，白色变黑色，黑色变白色
 *
 * @param imgData，图片数据对象
 * @returns {undefined} 无返回值
 */
function convertImg(imgData) {
  let width  = imgData.width,
      height = imgData.height;

  for(let y=0; y<height; y++) {
    for(let x=0; x<width; x++) {
      convertPixel(imgData, x, y);
    }
  }
}

/**
 * 翻转一个像素，白色变黑色，黑色变白色
 *
 * @param imgData，图片数据对象
 * @param x，x 坐标
 * @param y，y 坐标
 * @returns {undefined} 无返回值
 */
function convertPixel(imgData, x, y) {
  let width = imgData.width,
      data  = imgData.data,
      pos   = (y * width * 4) + (x * 4);

  data[pos + 0] = 255 - data[pos + 0];
  data[pos + 1] = 255 - data[pos + 1];
  data[pos + 2] = 255 - data[pos + 2];
}
