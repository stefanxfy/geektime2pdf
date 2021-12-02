// 获取每篇文章下面所有的评论
const config = require('./config.js');
const superagent = require('superagent');
const utils = require('./utils');

/**
 * 获取每篇文章下面所有的评论
 * @param {String} 文章的链接地址
 * @param {Number} 文章的ID
 */
async function downloadComments (url, articleId, commentLimit, prev = 0) {
    console.log('开始获取 ', url, '评论');
    let commentsArr = [];
    let commentsTotal = 0;
	let isFinished = false;
	let downloadLen = 0;
    async function run (prev) {
        try {
            let res = await superagent.post(config.commentUrl)
            .set({
                'Content-Type': 'application/json',
                'Cookie': config.cookie,
                'Referer': url,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36'
            }).send({
                aid: articleId,
                prev: prev
            });
            if (res.body && res.body.error && res.body.error.code){
                console.log('error msg', res.body.error.msg);
                throw new Error(res.body.error.msg);
            };
            let resData = res.body.data
            commentsTotal = resData.page.count;
            let nextPage = resData.page.more;
			if (commentLimit > (downloadLen + resData.list.length) || commentLimit < 0) {
				commentsArr.push(...resData.list);
				downloadLen = downloadLen + resData.list.length;
			} else {
				commentsArr.push(...resData.list.slice(0, (commentLimit - downloadLen)));
				downloadLen = commentLimit;
				isFinished = true;
			}
            if (nextPage && !isFinished) {
                prev = resData.list[resData.list.length -1].score;
                await utils.sleep(1);
                await run(prev);
            };
        }catch (err){
            console.log(`获取 评论 ${url} err`, err.message);
        };
    };
    await run(prev);
    // console.log('commentsArr', commentsArr);
    // console.log('commentsTotal', commentsTotal);
    console.log('结束获取:', url, '评论 总评论数为:', commentsTotal, "限制评论数:", commentLimit, "实下载评论数:", downloadLen);
    return {commentsArr, downloadLen};
};

// downloadComments('https://time.geekbang.org/column/article/82337',82337);

module.exports = downloadComments;