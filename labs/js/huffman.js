#!/usr/bin/env node

/* exported huffman */
/* global entropy roundFractional redundancy */
//let huffman = (function() {
const { roundFractional, entropy, redundancy } = require('./lib');

const SNUM_MAX = 256,                 // 信源符号个数最多为 SNUM_MAX 个
      NNUM_MAX = 512,                 // 树节点个数最多为 512 个
      CHAR_BIT = 8,                   // 一个字节有 8 位
      INT_MAX  = 2147483647,
      EOT      = -1,                  // End of Tree
      HEAD     = NNUM_MAX - 1,        // Huffman树头节点的位置
      HFM_FILE_TOKEN = "Hfm",         // huffman 压缩文件的前三个字节标识
      LB10     = 3.321928095;         // 以 2 为底 10 的对数

let srcData = null,                   // 源文件无符号字节数组
    n       = 0,                      // 信源符号个数
//    scaled  = false,                  // 是否发生信源缩减
    srcFileName = '',                 // 信源文件名
    freq    = new Array(SNUM_MAX),    // 符号频次整型数组
    p       = new Array(SNUM_MAX),    // 符号概率浮点数组
    miniFrq = new Array(SNUM_MAX),    // 缩减后符号频次整型数组
    miniP   = new Array(SNUM_MAX),    // 缩减后符号概率浮点数组
    miniTFq = 0,                      // 缩减后符号频次总和
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
  srcData = data;     // 信源文件的字节数组

  for(let i=0; i<SNUM_MAX; i++)  {
    p[i]       = 0;
    freq[i]    = 0;
    miniP[i]   = 0;
    miniFrq[i] = 0;
    hfmTree[i] = { l:0, r:0, p:0, w:0 };
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

  printf("信源符号的频次：\n");
  printf("xi    value\tfreq\n");
  printf("-------------------------\n");
  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] !== 0) {
      total += freq[i];
      printf(`x${++num} \t${i}\t${freq[i]}\n`);
    }
  }
  printf("-------------------------\n");
  printf(`频次合计:\t${total}\n\n`);
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

  printf("信源符号的概率分布：\n");
  printf("xi    value\tp\n");
  printf("-------------------------\n");
  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] !== 0) printf(`x${++num} \t${i}\t${p[i]}\n`);
  }
  printf("-------------------------\n");
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

  printf("等比例缩小之后信源符号的频次：\n");
  printf("xi    value\tfreq\n");
  printf("-------------------------\n");
  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] !== 0) {
      total += miniFrq[i];
      printf(`x${++num} \t${i}\t${miniFrq[i]}\n`);
    }
  }
  printf("-------------------------\n");
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

  printf("信源符号的概率分布：\n");
  printf("xi    value\tp\n");
  printf("-------------------------\n");
  for(let i=0; i<SNUM_MAX; i++) {
    if(freq[i] !== 0) printf(`x${++num} \t${i}\t${miniP[i]}\n`);
  }
  printf("-------------------------\n");
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
  // 1. 按位存储，每个信源符号，的频次保存在该符号 ASCII 值所在的数组位置
  //    这种方式，存储机制简单，消耗存储空间为固定的 256 字节
  // 2. 按行程存储，信源符号 ASCII 值连续的符号，组成一个行程段
  //    每个行程段的存储方式为：[START][LENGTH][...]
  //    [START] 是行程段中 ASCII 值最小的信源符号其 ASCII 值，占一个字节
  //    [LENGTH] 是行程段中 ASCII 值连续的符号个数，占一个字节
  //    [...] 是该行程段中按 ASCII 值从小到大，每个信源符号的频次
  //    这样保存的码表消耗的存储空间为：secNum * 2 + n 字节
  //    其中：secNum 是行程段数，n 为信源符号个数
  // 3. 配对存储，存储方式为：[SYMBOL][FREQUENCE]
  //    [SYMBOL] 是信源符号的 ASCII 值，占一个字节
  //    [REQUENCE] 是信源符号的频次，占一个字节
  //    这样保存的码表消耗的存储空间为：2 * n 字节

  // 三种存储方案，应选择占用空间最小的存储方案

  let freqNew = freq.map(f => f === 0 ? 'x' : 1);
  let str = freqNew.join('');
  let secNum = str.match(/\d+/g).length;    // 行程段的数量

  // 三种存储方案的存储总开销，取最小值
  let size = Math.min(SNUM_MAX, 2 * secNum + n, 2 * n) + HFM_FILE_TOKEN.length + 1;
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
  * 利用信源符号缩减的原理，将Huffman树各个活动叶子节点
  * 与缩减的中间节点连接成一棵二叉树。
  *
  * @param 无
  *
  * @returns 无
  */
function genHfmTree() {
  let s1 = 0, s2 = 0, s3 = 0;

  printf("信源缩减过程：\n");

  while(select(s1, s2) != 0) {
    //_ASSERT(HfmTree[HEAD].w < NNUM_MAX);
    s3 = hfmTree[HEAD].w++;

    hfmTree[s3].l = s1;
    hfmTree[s3].r = s2;
    hfmTree[s3].w = hfmTree[s1].w + hfmTree[s2].w;

    hfmTree[s1].p = s3;
    hfmTree[s2].p = s3;

    // 可以在这里调试打印每一步信源缩减后的Huffman树信息
  }

  printf("\n生成的");
  printHfmTree();
}

/**
  * 从 Huffman 树中选择权重最小的两个节点。条件是这两个节
  * 点是活动节点，并且是孤立节点，可以是叶子节点也可以是
  * 中间节点，最后权重需要满足下面的不等式：
  *   weight(s1) <= weight(s2) <= weight(other node)。
  *
  * @param s1    第一个节点的下标
  *        s2    第二个节点的下标
  *
  * @returns {boolean} 选择是否成功
  *   1    成功
  *   0    失败，只剩下一个满足条件的活动节点了
  */
function select(s1, s2) {
  const num = hfmTree[HEAD].w;
  let minWeight = INT_MAX;

  s1 = s2 = HEAD;
  for(let i=0; i<num; i++) {
    if((hfmTree[i].w < minWeight)    /* HfmTree[i]的权重最小 */
      && (hfmTree[i].w != 0)         /* HfmTree[i]是活动节点 */
      && (hfmTree[i].p == 0))        /* HfmTree[i]是孤立节点 */
    {
      minWeight = hfmTree[i].w;
      s1 = i;
    }
  }

  minWeight = INT_MAX;
  for(let i=0; i<num; i++) {
    if((hfmTree[i].w < minWeight)    /* HfmTree[i]的权重最小 */
      && (hfmTree[i].w != 0)      /* HfmTree[i]是活动节点 */
      && (hfmTree[i].p == 0)      /* HfmTree[i]是孤立节点 */
      && (i != s1))          /* *s2 <> *s1      */
    {
      minWeight = hfmTree[i].w;
      s2 = i;
    }
  }

  printf("s1 = %3d,   s2 = %3d,   s3 = %3d\n", s1, s2, num);

  return(((s2 == HEAD) && (s1 == num-1)) ? 0 : 1);
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

  printf("Huffman 树：\n");
  printf("xi\tpos\tweight\tl\tr\tp\n");
  printf("---------------------------------------------\n");
  for(let i=0; i<NNUM_MAX; i++) {
    if(hfmTree[i].w != 0) {
      printf(`x${++num}\t${i}\t${hfmTree[i].w}\t${hfmTree[i].l}\t${hfmTree[i].r}\t${hfmTree[i].p}\n`);
    }
  }
  printf("---------------------------------------------\n\n");
}

/**
  * 将信源文件打包。因为对信源文件的压缩不足以抵消存储
  * 频次表的开销，因此不压缩信源文件，仅仅将其封装。即
  * 仅仅加上Huffman文件头标识符，其他部分与信源文件的每
  * 个字节都完全相同。
  *
  * @param 无
  *
  * @returns 无
  */
function wrapSrcFile()
{
  const flag = 0x80;    // 最高位为1，代表信源文件没有被压缩

  const len = HFM_FILE_TOKEN.length + 1 + srcData.length;
  const data = new Uint8Array(len);

  data[0] = HFM_FILE_TOKEN.charCodeAt(0);
  data[1] = HFM_FILE_TOKEN.charCodeAt(1);
  data[2] = HFM_FILE_TOKEN.charCodeAt(2);
  data[3] = flag;

  for(let i=4; i<len; i++) data[i] = srcData[i-4];

  writeFile(data);
}

function writeFile(data) {
  const fs = require('fs');

  console.log(data.length);
  fs.writeFileSync(getDstFileName(), data, 'binary');
}

function getDstFileName() {
  return srcFileName.split('.')[0] + '.hfm';
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

  let notNeedCompress = (flenSrc - flenSrc * h / CHAR_BIT) < storeCost();

  if(notNeedCompress) {
    wrapSrcFile();
    return;
  }

  if(scaleFreq())  scaledInfoSrcAnalyze();

  initHfmTree();
  //genHfmTree();
  /*
  genHfmCode();
  writeHfmFile();
  */
}

function decompress(data, output) {
  // 解压缩
}

function main() {
  const fs = require('fs'),
        fname = 'test.txt';

  compress(fs.readFileSync(fname), fname);
}

main();
//  return { compress, decompress };
//})();
