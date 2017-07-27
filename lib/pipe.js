const net = require('net');
const server = net.createServer();

const EventEmitter = require('events').EventEmitter;
const eventEmitter = new EventEmitter();

const TCPContent = require('./tcpcontent.js');
const rewrite = {};

////////// exports
//setting
//  net server option
//      port <Number> - Optional.
//      host <String> - Optional.
//      backlog <Number> - Optional.
//      path <String> - Optional.
//      exclusive <Boolean> - Optional.
//  rewrite setting
//      rewrite
//         host <String> - Optional
//         port <Number> - Optional
exports.listen = (setting, callback) => {
	rewrite.host = setting.rewrite.host || 'localhost';
	rewrite.port = setting.rewrite.port || 80;

	server.listen(setting, () => {
		server.on('connection', tcpConnection);
		server.on('error', (err) => {
			//サーバーエラー
			eventEmitter.emit('error', err);
		});

		if(callback){
			callback();
		}
	});
};
exports.on = function(eventName, callback){
	eventEmitter.on(eventName, callback);
};

////////// function
function tcpConnection(socket){
	const tcpContent = new TCPContent();
	const serverSocket = net.connect(rewrite.port, rewrite.host);	
	
	//TCP接続の確立　イベント
	eventEmitter.emit('tcpStart', tcpContent);
	//From クライアントソケット
	socket.on('data', (buffer) => {
		//読み込み
		tcpContent.processReadRequest(buffer, () => {
			//bufferの読み込み完了
			//リクエスト書き換え
			rewriteServerRequest(tcpContent);
			//リクエスト送信
			serverRequest(serverSocket, tcpContent);
		}, (httpContent) => {
			//HTTPリクエストの読み込み完了
			eventEmitter.emit('request', httpContent, tcpContent);
		}).catch((err) => {
			//内部エラー
			eventEmitter.emit('tcpEnd', tcpContent);
			eventEmitter.emit('error', err);
		});
	});
	socket.on('error', (err) => {
		//クライアント 通信エラー
		socket.destroy();
		serverSocket.destroy();
		eventEmitter.emit('tcpEnd', tcpContent);
		eventEmitter.emit('error', err);
	});

	//To サーバーソケット
	serverSocket.on('data', (buffer) => {
		//読み込み
		tcpContent.processReadResponse(buffer, () => {
			//bufferの読み込み完了
			//レスポンス送信
			clientResponse(socket, tcpContent);

			//終了
			if(tcpContent.isResponseEnd()){
				serverSocket.end();
				socket.end();

				//TCP接続 終了イベント
				eventEmitter.emit('tcpEnd', tcpContent);
			}
		}, (httpContent) => {
			//HTTPレスポンスの読み込み完了
			eventEmitter.emit('response', httpContent, tcpContent);
		}).catch((err) => {
			//内部エラー
			socket.destroy();
			serverSocket.destroy();
			eventEmitter.emit('tcpEnd', tcpContent);
			eventEmitter.emit('error', err);
		});
	});
	serverSocket.on('error', (err) => {
		//サーバー 通信エラー
		socket.destroy();
		serverSocket.destroy();
		eventEmitter.emit('tcpEnd', tcpContent);
		eventEmitter.emit('error', err);
	});
}
function rewriteServerRequest(tcpContent){
	tcpContent.rewriteRequestHostHeader(rewrite.host, rewrite.port);
}
function serverRequest(serverSocket, tcpContent){
	const requestBuffer = tcpContent.writableRequestBuffer();
	if(requestBuffer.length > 0){
		serverSocket.write(requestBuffer);
	}
}
function clientResponse(socket, tcpContent){
	const responseBuffer = tcpContent.generateResponseBuffer();
	if(responseBuffer.length > 0){
		socket.write(responseBuffer);
	}
}