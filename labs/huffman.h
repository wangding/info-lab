/***
*Huffman.h - Huffman编码用到的运行库头文件、宏定义、数据结构定义
*			 以及函数声明
*
*Copyright (c) 2007，无有版权，欢迎复制
*All rights reserved.
*
*作者：
*	王顶
*	13582027613
*	wngding@gmail.com
*	
****/

#include <io.h>
#include <math.h>
#include <stdio.h>
#include <conio.h>
#include <stdlib.h>
#include <string.h>
#include <crtdbg.h>
#include <limits.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <stdarg.h>

//
#define SNUM_MAX		256						// 信源符号个数最多为256个
#define NNUM_MAX		512						// 树节点个数最多为512个
#define CMDARG_MAX		4						// 命令行参数个数最多为4个

#define LB10			3.321928095				// 以2为底10的对数
#define HEAD			NNUM_MAX - 1			// Huffman树头节点的位置
#define EOS				'\0'					// End of String
#define EOT				-1						// End of Tree

#define CMD_COMPRESS	(stricmp(argv[1], "/O:c") == 0)
#define CMD_DECOMPRESS	(stricmp(argv[1], "/O:e") == 0)

#define IS_SYMBOL		(frequence[i] != 0)
#define NOT_TOUCH_ROOT	(node->p != 0)
#define NOT_LEAF_NODE	(HfmTree[i].p == 0)
#define IS_LEAF_NODE	(node->l == 0) && (node->r == 0) && (node->p != 0)
#define IS_LEFT_CHILD	(HfmTree[node->p].l == pos)
#define MOVE_TO_ROOT	pos = node->p;	node = &HfmTree[pos]
#define MOVE_TO_LEAF	pos = (bit == 0x00) ? node->r : node->l;	node = &HfmTree[pos];
#define HEAD_NODE		&HfmTree[HfmTree[HEAD].w - 1]

#define HFM_FILE_TOKEN	"Hfm"
#define NOT_NEED_COMPRESS	(flenSrc - flenSrc * H / CHAR_BIT) < StoreCost()

//
typedef struct
{
	int l;		// left child
	int r;		// right child
	int p;		// parent
	int w;		// weight
}HufNode, HufTree;


/*
杂项函数 -	初始化全局变量；错误处理。
*/
void InitData(char* argv[]);
void Error(char* fmt, ...);

/*
信源分析函数 -	统计信源符号的频次，计算信源剩余度。
*/
void StatFreq(void);
int  ScaleFreq(void);
void InfoSrcAnalyze(void);
double Entropy(void);

/*
Huffman编码函数 - 根据信源符号的概率构造Huffman树，生成码字。
*/
void InitHfmTree(void);
void GenHfmTree(void);
void GenHfmCode(void);
int  Select(int* s1, int* s2);

/*
写压缩文件函数 - 利用编码得到的码字压缩原始文件。
*/
void HufCompress(viod);
void WriteHfmFileHead(FILE* fpDst);
void WriteHfmFile(void);
void SaveFrqSerial(FILE *fpDst);
void SaveFrqRunLen(FILE *fpDst, int secNum);
void WrapSrcFile(void);
int  SuitRunLen(void);
int  StoreCost(void);

/*
解压缩文件函数 - 将压缩文件还原成原始文件。
*/
void HufDecompress(void);
int  IsHFMFile(FILE* fpSrc);
int  ReadFrq(FILE* fpSrc, int flag);
void DecodeFile(FILE* fpSrc, FILE* fpDst);

/*
用户接口函数 - 打印提示命令行参数；输出程序执行的结果。
*/
void PrintCmdPmt(void);
void Report(char* argv[]);

/*
调试函数 - 打印输出程序执行的中间结果，用来观察、判断程序执行是否正确。
*/
void PrintFreq(void);
void PrintHfmTree(void);
void PrintHfmCode(void);
void PrintInfoSrcSum(void);
void PrintResult(long flenSrc, long flenDst);
