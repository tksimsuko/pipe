const fs = require('fs');
const captureFile = fs.openSync(captureFileName(), 'a');

function TCPCapture(){
	//TCP接続が確立した時間
	const tcpTimestamp = Date.now();
	//キャプチャデータを格納する変数
	const capture = {
		date: formatDateMillSec(tcpTimestamp),
		requests: [],
		responses: [],
		timestamp: tcpTimestamp
	};

	//HTTPリクエスト電文の読み込みが終了したタイミングで呼ぶ
	//timestampはHTTPContentが生成された時間をセットする
	this.HTTPRequestCapture = (httpContent) => {
		capture.requests.push(httpContent);
	};
	//HTTPリクエスト電文の読み込みが終了したタイミングで呼ぶ
	//timestampはHTTPContentが生成された時間をセットする
	this.HTTPResponseCapture = (httpContent) => {
		capture.responses.push(httpContent);
	};
	//TCP処理が終了したタイミングで呼ぶ
	this.outputToFile = () => {
		fs.writeSync(captureFile, JSON.stringify(capture) + '\n');
	};
}

function formatDateMillSec(timestamp){
	var dateObj = new Date(timestamp);

	var year = dateObj.getFullYear();
	var month = dateObj.getMonth() + 1;
	var date = dateObj.getDate();
	var hour = dateObj.getHours();
	var minute = dateObj.getMinutes();
	var second = dateObj.getSeconds();
	var milliSec = dateObj.getMilliseconds();

	return year + '/' + month + '/' + date + ' ' + hour + ':' + minute + ':' + second + '.' + milliSec;
}
function captureFileName(){
	var dateObj = new Date();

	var year = dateObj.getFullYear();
	var month = dateObj.getMonth() + 1;
	var date = dateObj.getDate();
	var hour = dateObj.getHours();
	var minute = dateObj.getMinutes();
	var second = dateObj.getSeconds();
	var milliSec = dateObj.getMilliseconds();

	return './data/capture-' + year + '_' + month + '_' + date + '_' + hour + '_' + minute + '_' + second + '_' + milliSec;
}

module.exports = TCPCapture;