void main(int argc, char* argv[])
{
	if((argc != CMDARG_MAX) || (!CMD_COMPRESS && !CMD_DECOMPRESS))
	{
		PrintCmdPmt();
		exit(0);
	}

	InitData(argv);
	if(CMD_COMPRESS)		HufCompress();
	if(CMD_DECOMPRESS)		HufDecompress();

	Report(argv);
}


/*------------------------------------------------------------
目的：	打印命令行提示信息
输入：
		无
输出：
		无
------------------------------------------------------------*/
void PrintCmdPmt(void)
{
	printf("使用Huffman编码算法压缩和解压缩文件。\n\n");
	printf("Huffman /O:opt SrcFile DstFile\n\n");
	printf("  /O\t\t指定操作选项开关\n");
	printf("  opt\t\tc  压缩\n");
	printf("     \t\te  解压缩\n");
	printf("  SrcFile\t指定待压缩（或解压缩）的原文件名。\n");
	printf("  DstFile\t指定将要生成的目标文件名。\n");
}

/*------------------------------------------------------------
目的：	对信源文件进行频次统计，根据概率空间进行Huffman编码，
		生成与信源符号对应的变长码字。利用Huffman变长码字对信
		源文件重新编码，生成目标文件。实现对信源文件的压缩。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void HufCompress(void)
{
	double H = 0;
	struct _stat buf;
	long   flenSrc = 0;

	if(_access(srcFile, 0) == -1)
		Error("%s 文件找不到！\n", srcFile);

	_stat(srcFile, &buf);
	flenSrc = buf.st_size;
	if(flenSrc < 0)
		Error("%s 文件太大，程序无法处理！\n", srcFile);

	StatFreq();
	InfoSrcAnalyze();
	H = Entropy();
	
	if(NOT_NEED_COMPRESS)
	{
		WrapSrcFile();
		return;
	}

	if(ScaleFreq() == 1)	InfoSrcAnalyze();

	InitHfmTree();
	GenHfmTree();
	GenHfmCode();
	WriteHfmFile();
}

/*------------------------------------------------------------
目的：	统计信源文件中每个符号出现的频次。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void StatFreq(void)
{
	int ch = 0;
	FILE* fpSrc = NULL;

	if((fpSrc=fopen(srcFile, "rb")) == NULL)
		Error("%s 文件找不到！\n", srcFile);
	
	while((ch=fgetc(fpSrc)) != EOF)		frequence[ch]++;
	fclose(fpSrc);

#ifdef _DEBUG
	PrintFreq();
#endif
}

/*------------------------------------------------------------
目的：	将信源文件中每个符号出现的频次，等比例缩小，使缩小
		后的频次取值在0～255之间。频次为零的保持不变，频次
		不为零的等比例缩小不会为零。
输入：
		无
输出：
		int		是否进行了等比缩小
		0		没有缩小
		1		实现缩小
------------------------------------------------------------*/
int ScaleFreq(void)
{
	int i, f = 0;
	long max=0, scale = 0;

	for(i=0; i<SNUM_MAX; i++)
	{
		if(frequence[i] > max)	max = frequence[i];
	}
	
	if(max < SNUM_MAX) return(0);

	scale = (max / SNUM_MAX) + 1;
	
	for(i=0; i<SNUM_MAX; i++)
	{
		if(IS_SYMBOL)
		{
			f = frequence[i] / scale;
			frequence[i] = (f == 0) ? 1 : f;
		}
	}

#ifdef _DEBUG
	printf("等比例缩小之后");
	PrintFreq();
#endif

	return(1);
}

/*------------------------------------------------------------
目的：	打印信源文件每个符号出现的频次。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void PrintFreq(void)
{
	int i, num = 0;
	long total = 0;

	printf("信源符号的频次：\n");
	printf("xi    value\tfreq\n");
	printf("-------------------------\n");
	for(i=0; i<SNUM_MAX; i++)
	{
		if(IS_SYMBOL)
		{
			total += frequence[i];
			printf("x%d =\t%02X\t%d\n", ++num, i, frequence[i]);
		}
	}
	printf("-------------------------\n");
	printf("频次合计:\t%d\n\n", total);
}

/*------------------------------------------------------------
目的：	信源文件分析——计算信源文件每个符号的概率。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void InfoSrcAnalyze(void)
{
	int  i;
	long total = 0;

	for(i=0; i<SNUM_MAX; i++)		total += frequence[i];
	
	for(i=0; i<SNUM_MAX; i++)
	{
		p[i] = (double)frequence[i] / (double)total;
	}

#ifdef _DEBUG
	PrintInfoSrcSum();
#endif
}

/*------------------------------------------------------------
目的：	打印信源文件分析结果，信源文件每个符号的概率、信源
		熵以及信源的剩余度。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void PrintInfoSrcSum(void)
{
	double H = 0;
	int i, num = 0;

	printf("信源符号的概率分布：\n");
	printf("xi    value\tp\n");
	printf("-------------------------\n");
	for(i=0; i<SNUM_MAX; i++)
	{
		if(IS_SYMBOL)	printf("x%d =\t%02X\t%f\n", ++num, i, p[i]);
	}
	printf("-------------------------\n");
	printf("熵:\t\t%.3f bit\n", H = Entropy());
	printf("剩余度:\t\t%.3f\n\n", 1 - (H / (LB10 * log10(num)))); 
}

/*------------------------------------------------------------
目的：	根据信源符号的概率分布计算信源熵。
输入：
		无
输出：
		double		信源熵
------------------------------------------------------------*/
double Entropy(void)
{
	int		i;
	double	H = 0;

	for(i=0; i<SNUM_MAX; i++)
	{
		if(IS_SYMBOL)	H += -p[i] * log10(p[i]) * LB10;
	}

	return(H);
}

/*------------------------------------------------------------
目的：	初始化Huffman树。为Huffman树的叶子节点赋权重，并设置
		哑节点的初始信息，哑节点的权重信息表示用来存储信源缩
		减的中间节点的当前可用位置（即，数组的下标值）。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void InitHfmTree(void)
{
	int i;

	for(i=0; i<SNUM_MAX; i++)		HfmTree[i].w = frequence[i];
	
	HfmTree[HEAD].p = EOT;
	HfmTree[HEAD].w = SNUM_MAX;

#ifdef _DEBUG
	printf("初始化的");
	PrintHfmTree();
#endif
}

/*------------------------------------------------------------
目的：	打印Huffman树各个活动节点的信息。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void PrintHfmTree(void)
{
	int i, num = 0;

	printf("Huffman树：\n");
	printf("xi\tpos\tweight\tl\tr\tp\n");
	printf("---------------------------------------------\n");
	for(i=0; i<NNUM_MAX; i++)
	{
		if(HfmTree[i].w != 0)
		{
			printf("x%d\t%d\t%d\t%d\t%d\t%d\n", ++num, i, 
				HfmTree[i].w, HfmTree[i].l, HfmTree[i].r, HfmTree[i].p);
		}
	}
	printf("---------------------------------------------\n\n");
}

/*------------------------------------------------------------
目的：	利用信源符号缩减的原理，将Huffman树各个活动叶子节点
		与缩减的中间节点连接成一棵二叉树。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void GenHfmTree(void)
{
	int s1 = 0, s2 = 0, s3 = 0;

#ifdef _DEBUG
	printf("信源缩减过程：\n");
#endif

	while(Select(&s1, &s2) != 0)
	{
		_ASSERT(HfmTree[HEAD].w < NNUM_MAX);
		s3 = HfmTree[HEAD].w++;
				
		HfmTree[s3].l = s1;
		HfmTree[s3].r = s2;
		HfmTree[s3].w = HfmTree[s1].w + HfmTree[s2].w;

		HfmTree[s1].p = s3;
		HfmTree[s2].p = s3;

		// 可以在这里调试打印每一步信源缩减后的Huffman树信息
	}

#ifdef _DEBUG
	printf("\n生成的");
	PrintHfmTree();
#endif
}

/*------------------------------------------------------------
目的：	从Huffman树中选择权重最小的两个节点。条件是这两个节
		点是活动节点，并且是孤立节点，可以是叶子节点也可以是
		中间节点，最后权重需要满足下面的不等式：
			weight(s1) <= weight(s2) <= weight(other node)。
输入：
		int* s1		第一个节点的下标
		int* s2		第二个节点的下标
输出：
		int			选择是否成功
			1		成功
			0		失败，只剩下一个满足条件的活动节点了
------------------------------------------------------------*/
int Select(int* s1, int* s2)
{
	int i;
	const int num = HfmTree[HEAD].w;
	int MinWeight = INT_MAX;

	*s1 = *s2 = HEAD;
	for(i=0; i<num; i++)
	{
		if((HfmTree[i].w < MinWeight)		/* HfmTree[i]的权重最小 */
			&& (HfmTree[i].w != 0)			/* HfmTree[i]是活动节点 */
			&& (HfmTree[i].p == 0))			/* HfmTree[i]是孤立节点 */
		{
			MinWeight = HfmTree[i].w;
			*s1 = i;
		}
	}

	MinWeight = INT_MAX;
	for(i=0; i<num; i++)
	{
		if((HfmTree[i].w < MinWeight)		/* HfmTree[i]的权重最小 */
			&& (HfmTree[i].w != 0)			/* HfmTree[i]是活动节点 */
			&& (HfmTree[i].p == 0)			/* HfmTree[i]是孤立节点 */
			&& (i != *s1))					/* *s2 <> *s1			*/
		{
			MinWeight = HfmTree[i].w;
			*s2 = i;
		}
	}

#ifdef _DEBUG
	printf("s1 = %3d,   s2 = %3d,   s3 = %3d\n", *s1, *s2, num);
#endif

	return(((*s2 == HEAD) && (*s1 == num-1)) ? 0 : 1);
}

/*------------------------------------------------------------
目的：	利用Huffman树为每个信源符号生成相应的码字。每个信源
		符号都是Huffman树的活动叶子节点，从叶子节点向根节点
		行进路径就是分配码元符号，产生编码的过程。中间节点的
		左分支分配码元符号'1'，右分支分配码元符号'0'。码字的
		实际顺序与此过程正好相反，因此需要有一个反转的操作。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void GenHfmCode(void)
{
	int  i, pos;
	char code[SNUM_MAX] = "";
	char* pCode = code;
	char* pHfmCode = NULL;
	HufNode* node = NULL;

	for(i=0; i<SNUM_MAX; i++)
	{
		if(NOT_LEAF_NODE)	continue;

		node = &HfmTree[i];
		pos  = i;
		
		// 生成码字
		while(NOT_TOUCH_ROOT)
		{
			*(pCode++) = IS_LEFT_CHILD ? '1' : '0';
			MOVE_TO_ROOT;
		}
		
		// 反转码字
		pHfmCode = HfmCode[i];
		while(pCode > code)
		{
			*(pHfmCode++) = *(--pCode);
		}
	}

#ifdef _DEBUG
	PrintHfmCode();
#endif
}

/*------------------------------------------------------------
目的：	打印Huffman编码生成的码字。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void PrintHfmCode(void)
{
	int i, num = 0;
	double avgLen = 0;

	printf("码字：\n");
	printf("xi\tpos\tfreq\tlen\tCode\n");
	printf("---------------------------------------------\n");
	for(i=0; i<SNUM_MAX; i++)
	{
		if(IS_SYMBOL)
		{
			num++;
			avgLen += p[i] * strlen(HfmCode[i]);
			printf("x%d\t%d\t%d\t%d\t%s\n", num, i,
				frequence[i], strlen(HfmCode[i]), HfmCode[i]);
		}
	}
	printf("---------------------------------------------\n");
	printf("平均码长：\t%.3f\n", avgLen);
	printf("编码效率：\t%.2f %%\n", 100.0 * Entropy() / avgLen);
	printf("理论压缩率：\t%.2f %%\n\n", 100.0 * avgLen / CHAR_BIT);
}

/*------------------------------------------------------------
目的：	利用信源符号对应的码字，对信源文件重新编码，实现
		压缩。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void WriteHfmFile(void)
{
	int ch = 0;
	unsigned int  i, len = 0U;
	unsigned char buf = 0x00;
	const unsigned char mask = 0x80;
	FILE *fpSrc = NULL, *fpDst = NULL;

	if((fpSrc=fopen(srcFile, "rb")) == NULL)
		Error("%s 文件找不到！\n", srcFile);

	if((fpDst=fopen(dstFile, "w+b")) == NULL)
	{
		fclose(fpSrc);
		Error("%s 文件创建失败！\n", dstFile);
	}

	WriteHfmFileHead(fpDst);

	while((ch=fgetc(fpSrc)) != EOF)			// 写压缩文件编码主体
	{
		for(i=0; HfmCode[ch][i] != EOS; i++)
		{
			if(HfmCode[ch][i] == '1')	buf |= mask >> len;

			if(len == (CHAR_BIT - 1))
			{
				fputc(buf, fpDst);
				len = -1;
				buf = 0x00;
			}

			len++;
		}
	}
	
	_ASSERT(len != -1);

	if(len != 0)	// buf没有填充完毕，写压缩文件的最后一个字节
	{
		fputc(buf, fpDst);
		fseek(fpDst, strlen(HFM_FILE_TOKEN), SEEK_SET);
		buf = fgetc(fpDst) + len;
		fseek(fpDst, strlen(HFM_FILE_TOKEN), SEEK_SET);
		fputc(buf, fpDst);
		fseek(fpDst, 0, SEEK_END);
	}

#ifdef _DEBUG
	PrintResult(ftell(fpSrc), ftell(fpDst));
#endif

	fclose(fpSrc);
	fclose(fpDst);
}

/*------------------------------------------------------------
目的：	写Huffman压缩文件的头信息，包括三部分：文件标识符、
		FLAG和频次表。频次表的存储有两种方式，行程长度存储
		和连续存储。
输入：
		FILE* fpDst		压缩文件的文件指针
输出：
		无
------------------------------------------------------------*/
void WriteHfmFileHead(FILE* fpDst)
{
	int secNum = 0;
	unsigned char flag = 0;

	_ASSERT(fpDst != NULL);

	// 写Huffman文件标识符
	fwrite(&HFM_FILE_TOKEN, sizeof(char), strlen(HFM_FILE_TOKEN), fpDst);

	if((secNum = SuitRunLen()) != 0)
	{
		flag = 0x40;			// 第7位置0，代表对信源文件进行压缩
								// 第6位置1，代表采用行程方式存储频次
		fputc(flag, fpDst);
		SaveFrqRunLen(fpDst, secNum);
	}
	else
	{
		flag = 0x00;			// 第7位置0，代表对信源文件进行压缩
								// 第6位置0，代表采用顺序方式存储频次
		fputc(flag, fpDst);
		SaveFrqSerial(fpDst);
	}
}

/*------------------------------------------------------------
目的：	打印压缩结果。包括信源文件长度，目标文件长度和压缩率。
输入：
		long  flenSrc		信源文件长度
		long  flenDst		目标文件长度
输出：
		无
------------------------------------------------------------*/
void PrintResult(long flenSrc, long flenDst)
{
	printf("\n\n压缩结果：\n");
	printf("---------------------------------------------\n");
	printf("原始文件：\t%s\t%1d 字节\n", srcFile, flenSrc);
	printf("目标文件：\t%s\t%1d 字节\n", dstFile, flenDst);
	printf("---------------------------------------------\n");
	printf("压缩率：\t%.2f %%\n", (double)flenDst * 100.0 / (double)flenSrc);
}

/*------------------------------------------------------------
目的：	Huffman解压缩。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void HufDecompress(void)
{
	int ch = 0;
	unsigned char mask  = 0x80;				// 取最高位的掩码
	unsigned char HFour = 0xf0;				// 取高4位的掩码
	FILE *fpSrc = NULL, *fpDst = NULL;

	if((fpSrc=fopen(srcFile, "rb")) == NULL)
		Error("%s 文件找不到！\n", srcFile);

	if(IsHFMFile(fpSrc) != 1)
	{
		fclose(fpSrc);
		Error("%s 压缩文件格式不正确！\n", srcFile);
	}

	ch = getc(fpSrc);						// 读取FLAG字段
	
	// 对FLAG 字段进行合法性校验，参考设计文档
	if(((ch & HFour) != 0x80)
		&& ((ch & HFour) != 0x40) 
		&& ((ch & HFour) != 0x00))
	{
		fclose(fpSrc);
		Error("%s 压缩文件格式不正确！！\n", srcFile);
	}

	if((fpDst=fopen(dstFile, "wb")) == NULL)
	{
		fclose(fpSrc);
		Error("%s 文件创建失败！\n", dstFile);
	}

	if((ch & mask) == mask)					// 信源文件没有被压缩
	{
		while((ch=fgetc(fpSrc)) != EOF)		fputc(ch, fpDst);
		fclose(fpSrc);
		fclose(fpDst);
		return;
	}

	if(ReadFrq(fpSrc, ch) == 0)				// 频次读取错误的处理
	{
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

	fclose(fpSrc);
	fclose(fpDst);
}

/*------------------------------------------------------------
目的：	判断是否为合法的Huffman压缩文件。
输入：
		FILE* fpSrc	压缩文件指针
输出：
		int			是否合法
		1			合法
		0			非法
------------------------------------------------------------*/
int IsHFMFile(FILE* fpSrc)
{
	char ch[sizeof(HFM_FILE_TOKEN)] = "";

	_ASSERT(fpSrc != NULL);
	fread(&ch, sizeof(char), strlen(HFM_FILE_TOKEN), fpSrc);

	return((strcmp(&HFM_FILE_TOKEN, ch) == 0) ? 1 : 0);
}

/*------------------------------------------------------------
目的：	从压缩文件读取频次表信息。
输入：
		FILE* fpSrc		压缩文件指针
		int   flag		压缩文件的FLAG字段，用来判断频次表
						存储的方式
输出：
		int				读取是否成功
		1				成功
		0				失败
------------------------------------------------------------*/
int ReadFrq(FILE* fpSrc, int flag)
{
	int i, j, secNum, len;
	long *p = NULL;							// 频次数组操作指针
	const char mask = 0x40;					// 取FLAG字段的第六位
	int total = 0;

	_ASSERT(fpSrc != NULL);
	if((flag & mask) == mask)				// 行程模式读取频次表
	{
		secNum = fgetc(fpSrc);
		for(i=0; i<secNum; i++)
		{
			p = &frequence[fgetc(fpSrc)];
			len = fgetc(fpSrc);
			for(j=0; j<len; j++)	*(p++) = fgetc(fpSrc);
		}
	}
	else									// 顺序模式读取频次表
	{
		for(i=0; i<SNUM_MAX; i++)		frequence[i] = fgetc(fpSrc);
	}
	
	// 检验频次读取是否正确。频次不能为负，所有频次不能为0。
	for(i=0; i<SNUM_MAX; i++)
	{
		if(frequence[i] < 0)
		{
			printf("ERROR: %s 原文件格式不正确或者已损坏！\n", srcFile);
			return(0);
		}
		total += frequence[i];
	}

	if(total == 0)
	{
		printf("ERROR: %s 原文件格式不正确或者已损坏！\n", srcFile);
		return(0);
	}

#ifdef _DEBUG
	PrintFreq();
#endif
	return(1);
}

/*------------------------------------------------------------
目的：	将压缩文件中的Huffman编码还原成信源文件符号。
输入：
		FILE* fpSrc		原始文件指针
		FILE* fpDst		目标文件指针
输出：
		无
------------------------------------------------------------*/
void DecodeFile(FILE* fpSrc, FILE* fpDst)
{
	unsigned char bit = 0x00;
	const unsigned char mask  = 0x80;		// 取最高位的掩码
	const unsigned char LFour = 0x0f;		// 取低四位的掩码
	HufNode *node = HEAD_NODE;
	int i, ch, pos = HfmTree[HEAD].w - 1;
	long fpos = 0, flen = 0, len = 0;

	_ASSERT(fpSrc != NULL);
	_ASSERT(fpDst != NULL);
	
	fpos = ftell(fpSrc);
	fseek(fpSrc, strlen(HFM_FILE_TOKEN), SEEK_SET);
	len = fgetc(fpSrc) & LFour;
	
	fseek(fpSrc, 0, SEEK_END);
	flen = ftell(fpSrc);

	fseek(fpSrc, fpos, SEEK_SET);

	while(ftell(fpSrc) < (flen-1))
	{
		ch = fgetc(fpSrc);
		for(i=0; i<CHAR_BIT; i++)
		{
			bit = ch & (mask >> i);

			MOVE_TO_LEAF;

			if(IS_LEAF_NODE)
			{
				fputc(pos, fpDst);
				node = HEAD_NODE;
			}
		}
	}
	
	// 翻译最后一个字节，最后一个字节可能没有填满
	ch  = fgetc(fpSrc);
	len = (len == 0) ? CHAR_BIT : len;
	for(i=0; i<len; i++)
	{
		bit = ch & (mask >> i);

		MOVE_TO_LEAF;

		if(IS_LEAF_NODE)
		{
			fputc(pos, fpDst);
			node = HEAD_NODE;
		}
	}
}

/*------------------------------------------------------------
目的：	打印报告。包括：信源分析、编码信息以及压缩效果。
输入：
		char* argv[]	命令行参数
输出：
		无
------------------------------------------------------------*/
void Report(char* argv[])
{
	int i, num = 0;
	struct	_stat buf;
	long	sfLen = 0, dfLen = 0;
	double	H = 0, avgLen = 0;

	printf("\n\t\t-- REPORT --\n\n");

	if(CMD_COMPRESS)
	{
		for(i=0; i<SNUM_MAX; i++)
		{
			if(IS_SYMBOL)
			{
				num++;
				avgLen += p[i] * strlen(HfmCode[i]);
			}
		}

		printf("信源：\n");
		printf("---------------------------------------------\n");
		printf("符号个数：\t%d\n", num);
		printf("熵：\t\t%.3f bit\n", H = Entropy());
		printf("剩余度：\t%.3f\n\n", 1 - (H / (LB10 * log10(num)))); 
		
		printf("编码：\n");
		printf("---------------------------------------------\n");
		avgLen = (avgLen <= 0) ? CHAR_BIT : avgLen;
		printf("平均码长：\t%.3f bit\n", avgLen);
		printf("编码效率：\t%.2f %%\n", 100.0 * H / avgLen);
		printf("理论压缩率：\t%.2f %%\n\n", 100.0 * avgLen / CHAR_BIT);
		
		printf("压缩：\n");
		printf("---------------------------------------------\n");	
	}

	_stat(srcFile, &buf);
	sfLen = buf.st_size;
	printf("原始文件：\t%s\t%ld 字节\n", srcFile, sfLen);

	_stat(dstFile, &buf);
	dfLen = buf.st_size;
	printf("目标文件：\t%s\t%ld 字节\n", dstFile, dfLen);
	
	if(CMD_COMPRESS)
	{
		printf("节省空间：\t%ld 字节\n", sfLen - dfLen);
		printf("压缩率：\t%.2f %%\n", ((double)dfLen) * 100.0 / ((double)sfLen));
	}
}


/*------------------------------------------------------------
目的：	将信源文件打包。因为对信源文件的压缩不足以抵消存储
		频次表的开销，因此不压缩信源文件，仅仅将其封装。即
		仅仅加上Huffman文件头标识符，其他部分与信源文件的每
		个字节都完全相同。
输入：
		无
输出：
		无
------------------------------------------------------------*/
void WrapSrcFile(void)
{
	int ch = 0;
	FILE *fpSrc = NULL, *fpDst = NULL;
	const unsigned char flag = 0x80;		// 最高位为1，代表信源文件
											// 没有被压缩
	if((fpSrc=fopen(srcFile, "rb")) == NULL)
		Error("%s 文件找不到！\n", srcFile);

	if((fpDst=fopen(dstFile, "wb")) == NULL)
	{
		fclose(fpSrc);
		Error("%s 文件创建失败！\n", dstFile);
	}

	// 写Huffman文件标识符
	fwrite(&HFM_FILE_TOKEN, sizeof(char), strlen(HFM_FILE_TOKEN), fpDst);
	fputc(flag, fpDst);

	// 写Huffman文件主体，与信源文件的每个字节完全相同 
	while((ch=fgetc(fpSrc)) != EOF)		fputc(ch, fpDst);
	
	fclose(fpSrc);
	fclose(fpDst);
}

/*------------------------------------------------------------
目的：	按连续方式存储频次表信息。
输入：
		FILE* fpDst		压缩文件的文件指针
输出：
		无
------------------------------------------------------------*/
void SaveFrqSerial(FILE *fpDst)
{
	int i;

	_ASSERT(fpDst != NULL);
	for(i=0; i<SNUM_MAX; i++)		fputc(frequence[i], fpDst);
}

/*------------------------------------------------------------
目的：	判断频次表是否适合用行程方式压缩。
输入：
		无
输出：
		int			是否适合
		<>0			适合，行程段的数量
		==0			不适合
------------------------------------------------------------*/
int SuitRunLen(void)
{
	int			i;
	int			secNum			 = 0;		// 行程段的数量
	int			totalLen		 = 0;		// 行程段中频次的总数量
	const char	SPAN[]			 = "000";	// 行程段与段之间的间隙
	char		strFrq[SNUM_MAX+1] = "";		// 频次字符串
	char		*p1 = NULL, *p2  = NULL;	// 操作频次字符串的指针

	// 初始化频次字符串
	for(i=0; i<SNUM_MAX; i++)	strFrq[i] = (frequence[i]==0) ? '0':'1';

#ifdef _DEBUG
	printf("频次表的行程分析：\nstart\tlen\tfreq\n");
	printf("---------------------------------------------");
#endif

	p1 = strstr(strFrq, "1");
	while((p2 = strstr(p1, SPAN)) != NULL)
	{
		secNum++;
		totalLen += p2 - p1;

#ifdef _DEBUG
		printf("\n%0.2X\t%d    ", p1-strFrq, p2-p1);
		while(p1<p2)	printf("%5d", frequence[(p1++)-strFrq]);
#endif
		
		if((p1 = strstr(p2, "1")) == NULL) break;
	}
	
	if(p1 != NULL)
	{
		if(*p1 == '1')
		{
			secNum++;
			while(*(p1++) != EOS) totalLen++;
		}
	}

#ifdef _DEBUG
	printf("\n---------------------------------------------\n");
	printf("行程段数：\t%d\n频次总数：\t%d", secNum, totalLen);
#endif

	return(((totalLen + secNum * 2)< SNUM_MAX) ? secNum : 0);
}

/*------------------------------------------------------------
目的：	按行程方式存储频次表。
输入：
		FILE* fpDst		压缩文件的文件指针
		int   secNum	行程段的数量
输出：
		无
------------------------------------------------------------*/
void SaveFrqRunLen(FILE *fpDst, int secNum)
{
	int			i;
	const char	SPAN[]			 = "000";	// 行程段与段之间的间隙
	char		strFrq[SNUM_MAX+1] = "";		// 频次字符串
	char		*p1 = NULL, *p2  = NULL;	// 操作频次字符串的指针

	// 初始化频次字符串
	for(i=0; i<SNUM_MAX; i++)	strFrq[i] = (frequence[i]==0) ? '0':'1';

	p1 = strstr(strFrq, "1");
	fputc(secNum, fpDst);					// 保存行程段的数量
	while((p2 = strstr(p1, SPAN)) != NULL)
	{
		fputc(p1-strFrq, fpDst);			// 保存行程段的起始位置
		fputc(p2-p1, fpDst);				// 保存行程段的长度
		
		// 保存行程段中的频次值
		while(p1<p2)	fputc(frequence[(p1++)-strFrq], fpDst);

		if((p1 = strstr(p2, "1")) == NULL)	break;
	}

	if(p1 != NULL)
	{
		if(*p1 == '1')
		{
			fputc(p1-strFrq, fpDst);		// 保存行程段的起始位置
			p2 = &strFrq[SNUM_MAX];
			fputc(p2-p1, fpDst);			// 保存行程段的长度

			while(*p1 != EOS)
			{
				fputc(frequence[(p1++)-strFrq], fpDst);
			}
		}
	}
}

/*------------------------------------------------------------
目的：	初始化全局数据，包括：频次数组、概率数组、Huffman树
		的节点数组以及码字数组。
输入：
		char* argv[]	命令行参数，用于获取信源文件和目标
						文件的文件名
输出：
		无
------------------------------------------------------------*/
void InitData(char* argv[])
{
	int i;

	for(i=0; i<SNUM_MAX; i++)
	{
		frequence[i] = 0l;
		p[i]		 = 0;

		HfmTree[i].l = 0;
		HfmTree[i].r = 0;
		HfmTree[i].p = 0;
		HfmTree[i].w = 0;

		strset(HfmCode[i], EOS);
	}

	strcpy(srcFile, argv[2]);
	strcpy(dstFile, argv[3]);
}

/*------------------------------------------------------------
目的：	严重错误处理。在屏幕上显示错误信息，并退出执行。
输入：
		char* fmt	格式化字符串
		...			可变参数列表
输出：
		无
------------------------------------------------------------*/
void Error(char* fmt, ...)
{
	va_list argptr;

	va_start(argptr, fmt);
	printf("ERROR: ");
	vprintf(fmt, argptr);
	va_end(argptr);
	exit(-1);
}

/*------------------------------------------------------------
目的：	计算压缩文件头部存储频次表等信息的开销。
输入：
		无
输出：
		int		以字节为单位的开销大小
------------------------------------------------------------*/
int StoreCost(void)
{
	int			i;
	int			secNum			 = 0;		// 行程段的数量
	int			totalLen		 = 0;		// 存储总开销
	const char	SPAN[]			 = "000";	// 行程段与段之间的间隙
	char		strFrq[SNUM_MAX+1] = "";		// 频次字符串
	char		*p1 = NULL, *p2  = NULL;	// 操作频次字符串的指针

	// 初始化频次字符串
	for(i=0; i<SNUM_MAX; i++)	strFrq[i] = (frequence[i]==0) ? '0':'1';

	p1 = strstr(strFrq, "1");
	while((p2 = strstr(p1, SPAN)) != NULL)
	{
		secNum++;
		totalLen += p2 - p1;	
		if((p1 = strstr(p2, "1")) == NULL) break;
	}
	
	if(p1 != NULL)
	{
		if(*p1 == '1')
		{
			secNum++;
			while(*(p1++) != EOS) totalLen++;
		}
	}

	totalLen += secNum * 2;
	totalLen = (totalLen < SNUM_MAX) ? (totalLen + 1) : SNUM_MAX;
	totalLen += sizeof(HFM_FILE_TOKEN);

#ifdef _DEBUG
	printf("文件头部存储开销：%d 字节\n\n", totalLen);
#endif

	return(totalLen);
}

/***
*Huffman.c - 利用Huffman编码对信源文件压缩和解压缩。
*
*Copyright (c) 2007，无有版权，欢迎复制
*All rights reserved.
*
*作者：
*	王顶
*	13582027613
*	wngding@gmail.com
*
*目的:
*	做为《信息科学基础》课程的实验，通过程序的设计和编写。
*	1、帮助理解和掌握信源分析的方法，能够计算信源熵和冗余度；
*	2、帮助理解和掌握Huffman编码的原理，能够计算平均码长和编码效率；
*	3、帮助理解和掌握编码压缩的原理、方法和过程；解压缩的原理、方法和过程；
*	4、通过对编码压缩前后文件的比较，分析压缩比和信源剩余度的关系；
*	5、理解和掌握二叉树的生成和遍历算法；
*	6、理解和掌握文件的创建和读/写操作；
*	7、理解和掌握二进制的位运算；
*	8、掌握C语言程序编写的常规技术：基本语法、代码风格、编程规范、
*	   数据合法性校验、软件测试，等。
*
*设计参数：
*	1、信源文件的最大尺寸2147483647字节，即2G；
*	2、信源文件中符号的频次最大值为2147483647；
*	3、计算结果显示精度为小数点后3位，计算精度采用double变量类型；
*	4、字符命令行界面，命令格式：Huffman /O:opt SrcFile DstFile；
*	5、只能对一个文件进行压缩，不能对多文档或整个目录进行压缩；
*	6、不能还原原始文件的访问状态信息，如：创建时间、修改时间和最后
*	   间以及只读或归档属性；
*	7、全局数据结构的详细描述，请参考-设计资料.xls;
*	8、压缩文件的存储格式，请参考-设计资料.xls;
*
****/

#include "Huffman.h"

//
double		p[SNUM_MAX];							// 信源符号的概率分布
HufTree		HfmTree[NNUM_MAX];						// 用于编码的Huffman树
long		frequence[SNUM_MAX];					// 信源符号出现的频次
char		HfmCode[SNUM_MAX][SNUM_MAX];			// 信源符号对应的码字
char		srcFile[FILENAME_MAX];					// 原始文件名
char		dstFile[FILENAME_MAX];					// 目标文件名

//
