/* global roundFractional: true */
$(function() {
  var $form     = $('.controller'),                    // 表单
      $p        = $('.channel input[type="number"]'),  // 错误转移概率文本框
      $inputImg = $('.input img'),              
      inputImg  = $inputImg.get(0),                    // 信源图片
      outputImg = $('.output canvas').get(0);          // 信宿图片

  $form.submit(onTrans);
  $inputImg.click(onClick);

  /* global $forkMeGH, $bszPageFooter */
  $forkMeGH.show('https://github.com/wangding/info-lab');
  $bszPageFooter.show('body');

  function onClick() {
    outputImg.style.display = 'none';
    var file = $inputImg.attr('src');
    file = file.replace(/\d/, function(n) { return (Number(n) + 1) % 3; });
    $inputImg.attr('src', file);
  }

  function onTrans(e) {
    e.preventDefault();
    
    // 准备参数
    var width = inputImg.width, height = inputImg.height;

    outputImg.width = width;
    outputImg.height = height;

    var p = Number($p.val());                   // 错误转移概率
    var ctx = outputImg.getContext('2d'); 
    ctx.drawImage(inputImg, 0, 0, width, height);

    var imgData = ctx.getImageData(0, 0, width, height);
    var totalPixel = width * height;            // 图片总像素数
    var pixels;                                 // 产生干扰的像素数
    
    if(p > 0.5) {
      pixels = roundFractional(totalPixel * (1-p), 0);
      convertImg(imgData);
    } else {
      pixels = roundFractional(totalPixel * p, 0);
    }

    //console.log('p:', p);
    //console.log('width: %d, height: %d, totalPixel: %d, pixels: %d', 
    //  width, height, totalPixel, pixels);
   
    // 产生干扰数据
    var xy = {};
    for(var j=0; j<pixels; j++) {
      var x   = roundFractional(Math.random() * (width - 1), 0),
          y   = roundFractional(Math.random() * (height - 1), 0),
          key = x + ',' + y;

      //console.log(key);
      if(xy[key] === 0) {
        --j;
        //console.log('数据碰撞!');
      } else {
        xy[key] = 0;
        convertPixel(imgData, x, y);
      }
    }
    //console.log(xy);

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
    var width  = imgData.width,
        height = imgData.height;

    for(var y=0; y<height; y++) {
      for(var x=0; x<width; x++) {
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
    var width = imgData.width,
        data  = imgData.data,
        pos   = (y * width * 4) + (x * 4);

    data[pos + 0] = 255 - data[pos + 0];
    data[pos + 1] = 255 - data[pos + 1];
    data[pos + 2] = 255 - data[pos + 2];
  }
});
