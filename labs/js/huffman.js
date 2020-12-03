#!/usr/bin/env node

/* exported huffman */
/* global entropy roundFractional redundancy */
//let huffman = (function() {
const { roundFractional, entropy, redundancy } = require('./lib');

const SNUM_MAX = 256,                 // 信源符号个数最多为 SNUM_MAX 个
      NNUM_MAX = 512,                 // 树节点个数最多为 512 个
      CHAR_BIT = 8,                   // 一个字节有 8 位
      EOT      = -1,                  // End of Tree
      HEAD     = NNUM_MAX - 1,        // Huffman 树头节点的位置，511
      HFM_FILE_TOKEN = 'Hfm',         // huffman 压缩文件的前三个字节标识
      LB10     = 3.321928095;         // 以 2 为底 10 的对数

let srcData = null,                   // 源文件无符号字节数组
    n       = 0,                      // 信源符号个数
//    scaled  = false,                  // 是否发生信源缩减
    srcFileName = '',                 // 信源文件名
    dstFileName = '',                 // 压缩文件名
    sfLen       = 0,                  // 信源文件长度，单位字节
    dfLen       = 0,                  // 目标文件长度，单位字节
    freq    = new Array(SNUM_MAX),    // 符号频次整型数组
    frqMode = 0;                      // 频次存储方式，0 代表顺序存储，1 代表成对存储，2 代表行程存储
    p       = new Array(SNUM_MAX),    // 符号概率浮点数组
    miniFrq = new Array(SNUM_MAX),    // 缩减后符号频次整型数组
    miniP   = new Array(SNUM_MAX),    // 缩减后符号概率浮点数组
    miniTFq = 0,                      // 缩减后符号频次总和
    headSize= 0,                      // 压缩文件头字节数
    runLen  = [],                     // 行程信息
    hfmTree = new Array(NNUM_MAX),    // Huffman 结点数组
    hfmCode = new Array(SNUM_MAX);    // Huffman 码字字符串数组

let $output;                          // 用来打印输出的 DOM 对象

/**
  * 初始化全局数据，包括：频次数组、概率数组、Huffman树
  * 的节点数组以及码字数组
  *
  * @param obj {object} 初始化数据
  *
  * @returns 无
  */
function initData(data) {
  sfLen   = data.length;
  srcData = data;     // 信源文件的字节数组

  for(let i=0; i<SNUM_MAX; i++)  {
    p[i]       = 0;
    freq[i]    = 0;
    miniP[i]   = 0;
    miniFrq[i] = 0;
    hfmCode[i] = '';
  }

  for(let i=0; i<NNUM_MAX; i++) hfmTree[i] = { l: 0, r: 0, p: 0, w: 0 };
}

/**
  * 统计信源文件中每个符号出现的频次
  *
  * @returns 无
  */
function statFreq() {
  for(let i=0; i<srcData.length; i++) freq[srcData[i]]++;
  printFreq();
}

/**
  * 打印输出信源文件中每个符号出现的频次
  *
  * @returns 无
  */
function printFreq() {
  let num = 0;
  let total = 0;

  printf('信源符号的频次：\n');
  printf('xi    value\tfreq\n');
  printf('-------------------------\n');
  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] !== 0) {
      total += freq[i];
      printf(`x${++num} \t${i}\t${freq[i]}\n`);
    }
  }
  printf('-------------------------\n');
  printf(`频次合计:\t${total}\n\n`);
}

/**
  * 打印输出行程段信息
  *
  * @returns 无
  */
function printRunLen() {
  printf('i\tstart\tlen\n');
  printf('-------------------------\n');
  for(let i=0; i<runLen.length; i++) {
    printf(`${i}\t${runLen[i].pos}\t${runLen[i].len}\n`);
  }
  printf('-------------------------\n');
}

/**
  * 打印输出行程段分析信息
  *
  * @returns 无
  */
function printRunLenAnalysis() {
  printf('i\tpos1\tlen\tpos2\tdistance\n');
  printf('----------------------------------------\n');
  for(let i=0; i<runLen.length-1; i++) {
    printf(`${i}\t${runLen[i].pos}\t${runLen[i].len}\t${runLen[i+1].pos}\t${runLen[i+1].pos - runLen[i].pos - runLen[i].len}\n`);
  }
  printf('----------------------------------------\n\n');
}
/**
  * 打印输出信息
  *
  * @returns 无
  */
// function printf(data) {
//   $output.append(data);
// }

function printf(data) {
  process.stdout.write(data);
}

/**
  * 信源文件分析——计算信源文件每个符号的概率
  *
  * @returns 无
  */
function infoSrcAnalyze() {
  let total = srcData.length;

  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] === 0) continue;
    p[i] = roundFractional(freq[i] / total, 6);
    ++n;
  }

  printInfoSrcSum();
}

/**
  * 打印信源文件分析结果，信源文件每个符号的概率、信源熵以及信源的剩余度。
  *
  * @returns 无
  */
function printInfoSrcSum() {
  let h   = entropy(p),       // 信源熵
      num = 0;

  printf('信源符号的概率分布：\n');
  printf('xi    value\tp\n');
  printf('-------------------------\n');
  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] !== 0) printf(`x${++num} \t${i}\t${p[i]}\n`);
  }
  printf('-------------------------\n');
  printf(`熵:\t\t${h} bit\n`);
  printf(`剩余度:\t\t${redundancy(h, num)}\n\n`);
}

/**
  * 将信源文件中每个符号出现的频次，等比例缩小，使缩小
  * 后的频次取值在0～255之间。频次为零的保持不变，频次
  * 不为零的等比例缩小不会为零。
  *
  * @returns {bool}  是否进行了等比缩小，true 缩小了，false 没有缩小
  */
function scaleFreq() {
  let f = 0, max = 0, scale = 0;

  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] > max)  max = freq[i];
  }

  if(max < SNUM_MAX) return false;

  scale = (max / SNUM_MAX) + 1;

  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] !== 0) {
      f = roundFractional(freq[i] / scale, 0);
      miniFrq[i] = (f === 0) ? 1 : f;
    }
  }

  printScaleFreq();
  return true;
}

function printScaleFreq() {
  let num = 0;
  let total = 0;

  printf('等比例缩小之后信源符号的频次：\n');
  printf('xi    value\tfreq\n');
  printf('-------------------------\n');
  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] !== 0) {
      total += miniFrq[i];
      printf(`x${++num} \t${i}\t${miniFrq[i]}\n`);
    }
  }
  printf('-------------------------\n');
  printf(`频次合计:\t${total}\n\n`);
}

/**
  * 缩减后的信源文件分析——计算信源文件每个符号的概率
  *
  * @returns 无
  */
function scaledInfoSrcAnalyze() {
  let total = 0;

  for(let i=0; i<SNUM_MAX; i++) total += miniFrq[i];

  for(i=0; i<SNUM_MAX; i++) miniP[i] = roundFractional(miniFrq[i] / total, 6);

  miniTFq = total;

  printScaledInfoSrcSum();
}

/**
  * 打印缩减信源分析结果，缩减信源每个符号的概率、信源熵以及信源的剩余度。
  *
  * @returns 无
  */
function printScaledInfoSrcSum() {
  let h   = entropy(miniP),       // 缩减信源的熵
      num = 0;

  printf('信源符号的概率分布：\n');
  printf('xi    value\tp\n');
  printf('-------------------------\n');
  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] !== 0) printf(`x${++num} \t${i}\t${miniP[i]}\n`);
  }
  printf('-------------------------\n');
  printf(`熵:\t\t${h} bit\n`);
  printf(`剩余度:\t\t${redundancy(h, num)}\n\n`);
}
/**
  * 计算压缩文件头部存储频次表等信息的开销
  *
  * @return inti 以字节为单位的开销大小
  */
function storeCost() {
  // 码表保存方式：
  // 1. 保存信源符号频次数据，而不是保存码字或者保存频率
  // 2. 频次数据最大值为 256，大于 256 的，做等比缩减
  // 3. 频次缩减小于 1 的，直接设为 1

  // 码表的存储方案有三种：
  // 1. 按位存储，每个信源符号，的频次保存在该符号 ASCII 值所在的数组位置，frqMode = 0
  //    这种方式，存储机制简单，消耗存储空间为固定的 256 字节
  // 2. 按行程存储，信源符号 ASCII 值连续的符号，组成一个行程段，frqMode = 2
  //    每个行程段的存储方式为：[START][LENGTH][...]
  //    [START] 是行程段中 ASCII 值最小的信源符号其 ASCII 值，占一个字节
  //    [LENGTH] 是行程段中 ASCII 值连续的符号个数，占一个字节
  //    [...] 是该行程段中按 ASCII 值从小到大，每个信源符号的频次
  //    这样保存的码表消耗的存储空间为：secNum * 2 + n 字节
  //    其中：secNum 是行程段数，n 为信源符号个数
  // 3. 配对存储，存储方式为：[SYMBOL][FREQUENCE]，frqMode = 1
  //    [SYMBOL] 是信源符号的 ASCII 值，占一个字节
  //    [REQUENCE] 是信源符号的频次，占一个字节
  //    这样保存的码表消耗的存储空间为：2 * n 字节

  // 三种存储方案，应选择占用空间最小的存储方案

  let str = freq.map(f => f === 0 ? 'x' : 1).join('');
  let sec = str.match(/\d+/g);

  for(let i=0, pos=0, len=0; i<sec.length; i++, pos+=len) {
    pos = str.indexOf('1', pos);
    len = sec[i].length;
    runLen.push({ pos, len});
  }

  printf('原始行程信息：\n');
  printRunLen();
  printf('\n原始行程分析：\n');
  printRunLenAnalysis();

  // 两个行程段间距小于等于 2 的进行合并
  for(let i=0; i<runLen.length-1; i++) {
    let distance = runLen[i+1].pos - runLen[i].pos - runLen[i].len;
    if(distance < 3) {
      runLen[i].len += distance + runLen[i+1].len;
      runLen.splice(i+1, 1);
      i--;
    }
  }

  let runLenCost = 0;

  runLenCost = runLen.reduce((w, v) => w += v.len, 0);

  printf('合并后行程信息：\n');
  printRunLen();
  printf(`行程段数：\t${runLen.length}\n频次总数：\t${runLenCost}\n\n`);
  runLenCost += runLen.length * 2;

  printf('合并后行程分析：\n');
  printRunLenAnalysis();

  let cost = [SNUM_MAX, 2 * n, runLenCost];

  // 三种存储方案的存储总开销，取最小值
  let size = Math.min(...cost) + HFM_FILE_TOKEN.length + 1;
  frqMode = cost.indexOf(size-4);
  printf(`文件头部存储开销：${size} 字节\n\n`);

  return(size);
}

function initHfmTree() {
  for(let i=0; i<SNUM_MAX; i++) hfmTree[i].w = miniFrq[i];

  hfmTree[HEAD].p = EOT;
  hfmTree[HEAD].w = SNUM_MAX;
  printf('初始化的 ');
  printHfmTree();
}

/**
  * 打印压缩结果。包括信源文件长度，目标文件长度和压缩率。
  *
  * @param 无
  *
  * @returns 无
  */
function printResult() {
  printf('\n\n压缩结果：\n');
  printf('---------------------------------------------\n');
  printf(`原始文件：\t${srcFileName}\t${sfLen} 字节\n`);
  printf(`目标文件：\t${dstFileName}\t${dfLen} 字节\n`);
  printf('---------------------------------------------\n');
  printf(`压缩率：\t${roundFractional(dfLen * 100 / sfLen, 2)} %\n`);
}

/**
  * 利用信源符号缩减的原理，将 Huffman 树各个活动叶子节点
  * 与缩减的中间节点连接成一棵二叉树。
  *
  * @param 无
  *
  * @returns 无
  */
function genHfmTree() {
  let s3 = 0;

  printf('信源缩减过程：\n');

  while(true) {
    let { s1, s2 } = select();
    if(s2 === HEAD) break;

    s3 = hfmTree[HEAD].w++;

    hfmTree[s3].l = s1;
    hfmTree[s3].r = s2;
    hfmTree[s3].w = hfmTree[s1].w + hfmTree[s2].w;

    hfmTree[s1].p = s3;
    hfmTree[s2].p = s3;
  }

  printf('\n生成的 ');
  printHfmTree();
}

/**
  * 从 Huffman 树中选择权重最小的两个节点。条件是这两个节
  * 点是活动节点，并且是孤立节点，可以是叶子节点也可以是
  * 中间节点，最后权重需要满足下面的不等式：
  *   weight(s1) <= weight(s2) <= weight(other node)。
  *
  * @return s1    第一个节点的下标
  *         s2    第二个节点的下标
  */
function select() {
  const num = hfmTree[HEAD].w;
  let minWeight = Infinity;

  s1 = s2 = HEAD;
  for(let i=0; i<num; i++) {
    if((hfmTree[i].w < minWeight)     /* HfmTree[i] 的权重最小 */
      && (hfmTree[i].w !== 0)         /* HfmTree[i] 是活动节点 */
      && (hfmTree[i].p === 0))        /* HfmTree[i] 是孤立节点 */
    {
      minWeight = hfmTree[i].w;
      s1 = i;
    }
  }

  minWeight = Infinity;
  for(let i=0; i<num; i++) {
    if((hfmTree[i].w < minWeight)     /* HfmTree[i]的权重最小 */
      && (hfmTree[i].w !== 0)         /* HfmTree[i]是活动节点 */
      && (hfmTree[i].p === 0)         /* HfmTree[i]是孤立节点 */
      && (i !== s1))                  /* s2 <> s1             */
    {
      minWeight = hfmTree[i].w;
      s2 = i;
    }
  }

  printf(`s1 = ${s1}  \ts2 = ${s2}  \ts3 = ${num}\n`);

  return {s1, s2};
}

/**
  * 打印 Huffman 树各个活动节点的信息
  *
  * @param 无
  *
  * @returns 无
  */
function printHfmTree() {
  let num = 0;

  printf('Huffman 树：\n');
  printf('xi\tpos\tweight\tl\tr\tp\n');
  printf('---------------------------------------------\n');
  for(let i=0; i<NNUM_MAX; i++) {
    if(hfmTree[i].w !== 0) {
      printf(`x${++num}\t${i}\t${hfmTree[i].w}\t${hfmTree[i].l}\t${hfmTree[i].r}\t${hfmTree[i].p}\n`);
    }
  }
  printf('---------------------------------------------\n\n');
}

/**
  * 利用 Huffman 树为每个信源符号生成相应的码字。每个信源
  * 符号都是 Huffman 树的活动叶子节点，从叶子节点向根节点
  * 行进路径就是分配码元符号，产生编码的过程。中间节点的
  * 左分支分配码元符号'1'，右分支分配码元符号'0'。码字的
  * 实际顺序与此过程正好相反，因此需要有一个反转的操作。
  *
  * @param 无
  *
  * @returns 无
  */
function genHfmCode() {
  for(let i=0; i<SNUM_MAX; i++) {
    let pos,
        code = '',
        pHfmCode = null,
        node = null;

    if(hfmTree[i].p === 0) continue;    // 不是叶子节点继续
    node = hfmTree[i];
    pos  = i;

    // 生成码字，从叶子节点往根节点走
    while(node.p !== 0) {             // NOT_TOUCH_ROOT
      code += ((hfmTree[node.p].l === pos) ? '1' : '0');
      pos = node.p;                   // MOVE_TO_ROOT
      node = hfmTree[pos];
    }

    // 反转码字，码字从根节点到叶子节点
    hfmCode[i] = code.split('').reverse().join('')
  }

  printHfmCode();
}

/**
  * 打印 Huffman 编码生成的码字。
  *
  * @param 无
  *
  * @returns 无
  */
function printHfmCode() {
  let num = 0, avgLen = 0;

  printf('码字：\n');
  printf('xi\tpos\tfreq\tlen\tCode\n');
  printf('---------------------------------------------\n');
  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] !== 0) {     // 是信源符号
      num++;
      avgLen += p[i] * hfmCode[i].length;
      printf(`x${num}\t${i}\t${miniFrq[i]}\t${hfmCode[i].length}\t${hfmCode[i]}\n`);
    }
  }
  printf('---------------------------------------------\n');
  printf(`平均码长：\t${roundFractional(avgLen, 3)}\n`);
  printf(`编码效率：\t${roundFractional(100 * entropy(p) / avgLen, 2)} %\n`);
  printf(`理论压缩率：\t${roundFractional(100.0 * avgLen / CHAR_BIT, 2)} %\n\n`);
}

/**
  * 将信源文件打包。因为对信源文件的压缩不足以抵消存储
  * 频次表的开销，因此不压缩信源文件，仅仅将其封装。即
  * 仅仅加上 Huffman 文件头标识符，其他部分与信源文件的每
  * 个字节都完全相同。
  *
  * @param 无
  *
  * @returns 无
  */
function wrapSrcFile() {
  const flag = 0x80;    // 最高位为 1，代表信源文件没有被压缩

  const len = HFM_FILE_TOKEN.length + 1 + srcData.length;
  const data = new Uint8Array(len);

  data[0] = HFM_FILE_TOKEN.charCodeAt(0);
  data[1] = HFM_FILE_TOKEN.charCodeAt(1);
  data[2] = HFM_FILE_TOKEN.charCodeAt(2);
  data[3] = flag;

  for(let i=4; i<len; i++) data[i] = srcData[i-4];

  dfLen = data.length;

  writeFile(data);
}

function writeFile(data, fileName) {
  const fs = require('fs');

  dstFileName = fileName || getDstFileName();
  fs.writeFileSync(dstFileName, data, 'binary');
}

function getDstFileName() {
  return srcFileName.split('.')[0] + '.hfm';
}

/**
  * 写 Huffman 压缩文件的头信息，包括三部分：文件标识符、
  * FLAG和频次表。频次表的存储有两种方式，行程长度存储
  * 和连续存储。
  *
  * @param data 压缩文件内容的字节数组
  *
  * @returns 无
  */
function writeHfmFileHead(data) {
  // 写 Huffman 文件标识符
  data[0] = HFM_FILE_TOKEN.charCodeAt(0);
  data[1] = HFM_FILE_TOKEN.charCodeAt(1);
  data[2] = HFM_FILE_TOKEN.charCodeAt(2);

  if(frqMode === 0) { // 顺序存储码表
    data[3] = 0x80;   // 第 7 位置 1，代表对信源文件进行压缩
                      // 第 6, 5 位置 00，代表采用顺序存储
    for(let i=0; i<SNUM_MAX; i++) data[i+4] = miniFrq[i];
    return;
  }

  if(frqMode === 1) { // 成对存储码表
    data[3] = 0xa0;   // 第 7 位置 1，代表对信源文件进行压缩
                      // 第 6, 5 位置 01，代表采用成对存储
    for(let i=0, pos=4; i<SNUM_MAX; i++) {
      if(miniFrq[i] !== 0) {
        data[pos++] = i;
        data[pos++] = miniFrq[i];
      }
    }
    return;
  }

  if(frqMode === 2) { // 行程存储码表
    data[3] = 0xc0;   // 第 7 位置 1，代表对信源文件进行压缩
                      // 第 6, 5 位置 10，代表采用行程存储
    for(let i=0, pos=4; i<runLen.length; i++) {
      data[pos++] = runLen[i].pos;
      data[pos++] = runLen[i].len;

      for(let j=0; j<runLen[i].len; j++, pos++) data[pos] = miniFrq[runLen[i].pos+j];
    }
  }
}

/**
  * 利用信源符号对应的码字，对信源文件重新编码，实现压缩。
  *
  * @param data 信源文件的字节数组
  *
  * @returns 无
  */
function writeHfmFile() {
  let data = new Uint8Array(sfLen);  // 这个长度有些大，看看怎么优化一下
  data.fill(0);

  writeHfmFileHead(data);

  let buf = '', pos = headSize, code = '';
  for(let i=0; i<sfLen; i++) {
    buf += hfmCode[srcData[i]];

    while(buf.length >= 8) {
      code = buf.substr(0, 8);
      data[pos++] = code.split('').reduce((m, v, i) => m += v * Math.pow(2, 7-i), 0);
      buf = buf.slice(8, buf.length);
    }
  }

  if(buf !== '') {
    pos++;
    data[4] += buf.length;
    code = (buf + '00000000').substr(0, 8);
    data[pos++] = code.split('').reduce((m, v, i) => m += v * Math.pow(2, 7-i), 0);
  }

  data  = data.slice(0, pos);
  dfLen = pos;
  writeFile(data);

  printResult();
}

/**
  * 对信源文件做 Huffman 压缩编码
  *
  * @param data 信源文件的字节数组
  *
  * @returns 无
  */
function compress(data, file, output) {
  $output = output;
  srcFileName = file;

  initData(data);
  statFreq();
  infoSrcAnalyze();

  let h       = entropy(p),
      flenSrc = srcData.length;

  headSize = storeCost();
  let notNeedCompress = (flenSrc - flenSrc * h / CHAR_BIT) < headSize;

  if(notNeedCompress) {
    wrapSrcFile();
    return;
  }

  if(scaleFreq())  scaledInfoSrcAnalyze();

  initHfmTree();
  genHfmTree();
  genHfmCode();
  writeHfmFile();
}

/**
  * 判断是否为合法的Huffman压缩文件。
  *
  * @param 无
  *
  * @returns bool true 合法，false 非法
  */
function isHFMFile() {
  let token = '';

  for(let i=0; i<3; i++) token += String.fromCharCode(srcData[i]);

  return token === HFM_FILE_TOKEN;
}

/**
  * Huffman 解压缩
  *
  * @param data 信源文件的字节数组
  *
  * @returns 无
  */
function decompress(data, file, output) {
  srcData = data;

  if(!isHFMFile()) {
    printf(`${file} 压缩文件格式不正确！\n`);
    return;
  }

  let flag    = srcData[3],
      okFlags = [0x00, 0x80, 0xA0, 0xC0], // 合法的 falg 高四位
      mask    = 0xf0;                     // 取高四位的掩码

  // 对 FLAG 字段进行合法性校验，参考设计文档
  flag &= mask;

  console.log(flag);
  process.exit();
  if(okFlags.indexOf(flag) === -1) {
    printf(`${file} 压缩文件格式不正确！\n`);
    return;
  }

  if(flag === 0x00) {        // 信源文件没有被压缩
    srcData = srcData.slice(4, srcData.length);
    writeFile(srcData, 'test2.bin');
    return;
  }

  process.exit();

/*
  if(ReadFrq(fpSrc, ch) == 0) {      // 频次读取错误的处理
    fclose(fpSrc);
    fclose(fpDst);
    remove(dstFile);
    exit(-1);
  }

  InfoSrcAnalyze();
  InitHfmTree();
  GenHfmTree();
  GenHfmCode();
  DecodeFile(fpSrc, fpDst);
*/
}

function main() {
  const fs = require('fs'),
        //fname = 'test.bin';
        fname = 'test.hfm';

  //compress(fs.readFileSync(fname), fname);
  decompress(fs.readFileSync(fname), fname);
  //report();
}

main();

/**
  * 打印报告。包括：信源分析、编码信息以及压缩效果。
  *
  * @param data 信源文件的字节数组
  *
  * @returns 无
  */
function report() {
  let num = 0, H = 0, avgLen = 0;

  printf('\n\t\t-- REPORT --\n\n');

  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] !== 0) {
      num++;
      avgLen += p[i] * hfmCode[i].length;
    }
  }

  printf('信源：\n');
  printf('---------------------------------------------\n');
  printf(`符号个数：\t${num}\n`);
  H = entropy(p);
  printf(`熵：\t\t${H} bit\n`);
  printf(`剩余度：\t${roundFractional(1 - (H / (LB10 * Math.log10(num))), 2)}\n\n`);

  printf('编码：\n');
  printf('---------------------------------------------\n');
  avgLen = (avgLen <= 0) ? CHAR_BIT : avgLen;
  printf(`平均码长：\t${roundFractional(avgLen, 2)} bit\n`);
  printf(`编码效率：\t${roundFractional(100.0 * H / avgLen, 2)} %\n`);
  printf(`理论压缩率：\t${roundFractional(100.0 * avgLen / CHAR_BIT, 2)} %\n\n`);

  printf('压缩：\n');
  printf('---------------------------------------------\n');
  printf(`原始文件：\t${srcFileName}\t${sfLen} 字节\n`);
  printf(`目标文件：\t${dstFileName}\t${dfLen} 字节\n`);
  printf(`节省空间：\t${sfLen - dfLen} 字节\n`);
  printf(`压缩率：\t${roundFractional(dfLen * 100 / sfLen, 2)}%\n`);
}

//  return { compress, decompress };
//})();
