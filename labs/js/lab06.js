let fileName,$btnCompress=$("#compress"),$btnDecompress=$("#decompress"),$output=$(".output>pre"),filePicker=$('input[type="file"]'),fileReader=new FileReader;function onClickCompress(){filePicker.click()}function onClickDecompress(){filePicker.click()}function onChangeFile(){let e=filePicker.files;0!==e.length&&(fileName=e[0].name,fileReader.readAsArrayBuffer(e[0]))}function onLoadFile(){let e=new window.Uint8Array(fileReader.result);huffman.compress(e,fileName,$output)}$btnCompress.onclick=onClickCompress,$btnDecompress.onclick=onClickDecompress,filePicker.onchange=onChangeFile,fileReader.onload=onLoadFile;