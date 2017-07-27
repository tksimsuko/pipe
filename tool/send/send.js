// HTTPリクエスト電文を断続的に送信する
// コマンドラインで実行する
// 引数は全て必須
//   argv[2] : ファイルパス　送信する電文を収めたファイルのパス
//   argv[3] : 期間 （秒） 
//   argv[4] : 一度に送信する回数
//   argv[5] : リクエストを送り切る時間 （秒）　Ramp-up
//   argv[6] : 待ち時間 （秒） Ramp-up後の空き時間
// 
// rewrite.json
// hostname <String> required
// port <Number> required
//
const net = require('net');
const fs = require('fs');
const readline = require('readline');
const rewrite = require('./rewrite');

var filePath = process.argv[2];
var term = parseInt(process.argv[3]);
var sendCount = parseInt(process.argv[4]);
var rampUp = parseInt(process.argv[5]);
var waitTime = parseInt(process.argv[6]);
var sendInterval = 1000 / (sendCount / rampUp);//リクエストの間隔(ミリ秒)を算出
var startTime;
var endTime;

//集計
var counts = {
	tcp: 0,
	http: 0,
	clientError: 0
};

//電文データの読み込み
var requests = [];
var lineReader = readline.createInterface({
	input: fs.createReadStream(filePath)
});
lineReader.on('line', (line) => {
	requests.push(JSON.parse(line));
});
lineReader.on('close', () => {
	//送信開始
	startTime = Date.now();
	endTime = startTime + (term * 1000);
		
	execute();
});

setTimeout(() => {
	console.log(counts);
}, ((term + 5) * 1000));

////////// function
function execute(){
	//リクエスト回数分 送信する
	for(var i=0; i<sendCount; i++){
		sendRequestsTimeout(sendInterval * i);
	}

	
	setTimeout(() => {
		//送信完了後 rampUp経過後

		//waitTimeだけ待つ
		var waitEnd = Date.now() + (waitTime * 1000);
		while(Date.now() <= waitEnd){
		}
		
		if(term > 0 && Date.now() <= endTime){//期間を判定
			//次の処理
			execute();
		}
	}, rampUp * 1000);
}
function sendRequestsTimeout(interval){
	setTimeout(() => {
		sendRequests();
	}, interval);
}
function sendRequests(){
	var firstTcpRequest = requests[0];

	var len = requests.length;
	for(var i=0; i<len; i++){
		var tcpRequest = requests[i];
		if(i === 0){
			sendTcpRequest(tcpRequest);
			continue;
		}

		var interval = tcpRequest.timestamp - firstTcpRequest.timestamp;//TCPリクエストの間隔
		sendTcpRequestTimeout(tcpRequest, interval);
	}
}
function sendTcpRequestTimeout(tcpRequest, interval){
	setTimeout(() => {
		sendTcpRequest(tcpRequest);
	}, interval);
}
function sendTcpRequest(tcpRequest){
	//カウント
	counts.tcp++;

	var httpRequests = tcpRequest.requests;
	var firstRequest = httpRequests[0];

	var hostname = rewrite.hostname || 'localhost';
	var port = rewrite.port || 80;
	var socket = net.createConnection(port, hostname, () => {
		var len = httpRequests.length;
		for(var i=0; i<len; i++){
			var httpRequest = httpRequests[i];
			var isLast = (i + 1) === len;
			if(i === 0){
				send(socket, httpRequest, isLast);
				continue;
			}

			var interval = httpRequest.timestamp - firstRequest.timestamp;//HTTPリクエストの間隔
			sendTimeout(socket, httpRequest, isLast, interval);
		}
	});

	socket.on('data', (buffer) => {
		//データが届いても何もしない
	});
	socket.on('end', () => {
		//何もしない
	});
	socket.on('error', (error) => {
		//カウント
		counts.clientError++;
	});
}
function sendTimeout(socket, httpRequest, isLast, interval){
	setTimeout(() => {
		send(socket, httpRequest, isLast);
	}, interval);
}
function send(socket, httpRequest, isLast){
	//カウント
	counts.http++;

	// socket.write(generateTelegram(httpRequest));
	if(isLast){
		socket.end();
	}
}
function generateTelegram(httpRequest){
	//ライン
	var meta = httpRequest.line.toString() + '\r\n';
	//ヘッダー
	meta += generateHeaderString(httpRequest.headers);//header情報を生成 Hostヘッダをリライトする
	//空白行
	meta += '\r\n';

	var result = Buffer.from(meta);

	if(httpRequest.body && httpRequest.body.length > 0){
		//ボディ
		var bodyBuffer = Buffer.from(httpRequest.body.data);
		result = Buffer.concat([result, bodyBuffer]);
	}
	return result;
}
//header情報を生成 
// Hostヘッダをリライトする
function generateHeaderString(headers){
	var headerString = '';
	//ヘッダ
	var len = headers.length;
	for(var i=0; i<len; i++){
		var headerData = headers[i];
		var name = headerData.name;
		var value = headerData.value;

		//hostヘッダの書き換え
		if(name.toLowerCase() === 'host'){
			if(typeof(rewrite.port) === 'number'){
				value = rewrite.hostname + ':' + rewrite.port;
			}else{
				value = rewrite.hostname;
			}
		}

		headerString += name + ': ' + value + '\r\n';
	}
	return headerString;
}