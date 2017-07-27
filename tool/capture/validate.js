// リクエスト電文ログを検証する
// TCPコネクション内でHTTPリクエストが重複していないか
// TCPコネクション内でのHTTPリクエスト数 最大
// 
// コマンドラインで実行する
// 引数は全て必須
//   argv[2] : ファイルパス　リクエスト電文を収めたファイルのパス

const fs = require('fs');
const readline = require('readline');
const filePath = process.argv[2];

var list = [];
var map = {};
var duplicatedCount = 0;
var maxHttpCount = 0;

var lineReader = readline.createInterface({
	input: fs.createReadStream(filePath)
});
lineReader.on('line', (line) => {
	var data = JSON.parse(line);
	list = list.concat(data.requests);

	var httpCount = data.requests.length;
	if(maxHttpCount < httpCount){
		maxHttpCount = httpCount;
	}
});
lineReader.on('close', () => {
	for(var i=0; i<list.length; i++){
		var telegram = list[i].telegram;
		var httpline = telegram.split('\r\n')[0];
		console.log(httpline);

		if(map[httpline]){
			duplicatedCount++;
		}else{
			map[httpline] = true;
		}
	}
	
	console.log();
	console.log('list size : ' + list.length);
	console.log('duplicated count : ' + duplicatedCount);
	console.log('max http count in tcp connection : ' + maxHttpCount);
});