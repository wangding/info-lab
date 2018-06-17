/* global huffman: true */
$(function() {
  var $btnCompress = $('#compress'),
      $btnDecompress = $('#decompress'),
      $output = $('.output>pre'),
      filePicker = $('input[type="file"]').get(0),
      fileReader = new FileReader(),
      fileName, // 要压缩或解压缩的文件名
      opt;      // 要做的操作：compress 或 decompress

  $btnCompress.click(onClickCompress);
  $btnDecompress.click(onClickDecompress);
  filePicker.onchange = onChangeFile;
  fileReader.onload = onLoadFile;

  function onClickCompress() {
    filePicker.click();
    opt = 'compress';
  }

  function onClickDecompress() {
    filePicker.click();
    opt = 'decompress';
  }

  function onChangeFile() {
    var files = filePicker.files;

    if(files.length === 0) return;

    fileName = files[0].name;
    fileReader.readAsArrayBuffer(files[0]);
  }

  function onLoadFile() {
    let data = new window.Uint8Array(fileReader.result);

    huffman.compress(data, $output);
  }
});
