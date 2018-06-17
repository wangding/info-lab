/* exported i h c */

/**
 * 小数点后面保留第 n 位
 *
 * @param x 做近似处理的数
 * @param n 小数点后第 n 位
 * @returns 近似处理后的数 
 */
function roundFractional(x, n) {
  return Math.round(x * Math.pow(10, n)) / Math.pow(10, n);
}

/**
 * 计算自信息量
 *
 * @param p 概率，取值范围 0 ~ 1
 * @returns -log(p)
 */
function i(p) {
  return roundFractional(-1 * Math.log2(p), 2);
}

/**
 * 计算 p*log(p)
 *
 * @param p 概率，取值范围 0 ~ 1
 * @returns p*log(p)
 */
function plog(p) {
  return (p === 0)? 0 : p * Math.log2(p);
}

/**
 * 计算二进制熵
 *
 * @param p 概率，取值范围 0 ~ 1
 * @returns -p*log(p) - (1-p)*log(1-p)
 */
function h(p) {
  return roundFractional(-1 * (plog(p) + plog(1 - p)), 3);
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
