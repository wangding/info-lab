/* exported i h c $ entropy roundFractional redundancy */

/**
 * 小数点后面保留第 n 位
 *
 * @param x 做近似处理的数
 *        n 小数点后第 n 位
 *
 * @returns 近似处理后的数
 */
function roundFractional(x, n) {
  return Math.round(x * Math.pow(10, n)) / Math.pow(10, n);
}

/**
 * 计算自信息量
 *
 * @param p 概率，取值范围 0 ~ 1
 *
 * @returns -log(p)
 */
function i(p) {
  return roundFractional(-1 * Math.log2(p), 2);
}

/**
 * 计算 p*log(p)
 *
 * @param p 概率，取值范围 0 ~ 1
 *
 * @returns p*log(p)
 */
function plog(p) {
  return (p === 0)? 0 : p * Math.log2(p);
}

/**
 * 计算二进制熵
 *
 * @param p 概率，取值范围 0 ~ 1
 *
 * @returns -p*log(p) - (1-p)*log(1-p)
 */
function h(p) {
  return roundFractional(-1 * (plog(p) + plog(1 - p)), 3);
}

/**
 * 计算信源熵
 * h(p) = -(p1*log(p1,2) + p2*log(p2,2) + ...+ pn*log(pn,2))
 *
 * @param p 信源符号概率数组
 * @returns {double} 信源熵
 */
function entropy(p) {
  var h = 0;

  for(var i=0; i<p.length; i++) {
    if(p[i] === 0) continue;
    h += p[i] * Math.log2(p[i]);
  }

  return roundFractional(-1 * h, 3);
}

/**
 * 计算信源剩余度或冗余度
 * r = 1 - (h / Math.log2(num))
 *
 * @param h 信源熵
 * @param n 信源符号个数
 *
 * @returns {double} 信源冗余度
 */
function redundancy(h, n) {
  return roundFractional(1 - (h / Math.log2(n)), 3);
}

/**
 * 计算 BSC 信道容量
 *
 * @param p 概率，取值范围 0 ~ 1
 * @returns 1 + p*log(p) + (1-p)*log(1-p)
 */
function c(p) {
  return roundFractional(1 + plog(p) + plog(1 - p), 4);
}

const q = document.querySelector,
      $ = q.bind(document);
