const HTTPContent = require('./httpcontent.js');

function TCPContent(){
	this.requests = [];
	this.responses = [];

	this.timestamp = Date.now();//内部では使用しない
	this.attachment;//外部から受け渡しするデータ　内部では使用しない

	this.readRequestPromise = Promise.resolve();
	this.readResponsePromise = Promise.resolve();
}

TCPContent.prototype.processReadRequest = function(buffer, onBufferReadEnd, onHTTPRequestEnd){
	return this.readRequestPromise = this.readRequestPromise.then(() => {
		return new Promise((resolve, reject) => {
			this.readBuffer(buffer, this.requests, onHTTPRequestEnd);
			onBufferReadEnd();
			resolve();
		});
	});
};
TCPContent.prototype.processReadResponse = function(buffer, onBufferReadEnd, onHTTPResponseEnd){
	return this.readResponsePromise = this.readResponsePromise.then(() => {
		return new Promise((resolve, reject) => {
			this.readBuffer(buffer, this.responses, onHTTPResponseEnd);
			onBufferReadEnd();
			resolve();
		});
	});
};
TCPContent.prototype.writableRequestBuffer = function(){
	//書き込み可能なHTTPリクエストを生成する
	return writableHTTPBuffer(this.requests);
};
TCPContent.prototype.generateResponseBuffer = function(){
	//書き込み可能なHTTPレスポンスを生成する
	return writableHTTPBuffer(this.responses);
};
TCPContent.prototype.isResponseEnd = function(){
	var len = this.responses.length;
	for(var i=0; i<len; i++){
		var content = this.responses[i];
		if(!content.isWriteEnd){
			return false;
		}
	}
	return true;
};
TCPContent.prototype.rewriteRequestHostHeader = function(hostname, port){
	var value = '';
	if(port){
		value = hostname + ':' + port;
	}else{
		value = hostname;
	}

	var len = this.requests.length;
	for(var i=0; i<len; i++){
		var httpContent = this.requests[i];
		if(httpContent.isReadEnd && !httpContent.isWriteEnd){
			//読み込みが完了していて、書き込んでいないContent
			//hostヘッダの書き換え
			httpContent.writeHeader('host', value);
		}
	}
};
TCPContent.prototype.readBuffer = function(buffer, contentList, onReadEnd){
	if(contentList.length === 0 || contentList[contentList.length - 1].isReadEnd){
		//bufferの先頭に改行がある場合、除外する
		buffer = removeLeadingBlankLine(buffer);
		//HTTPContentの生成
		const httpContent = new HTTPContent(onReadEnd);
		contentList.push(httpContent);
	}

	var currentContent = contentList[contentList.length - 1];
	
	//読み込み
	var remainBuffer = currentContent.read(buffer);
	if(remainBuffer){
		//次を読み込んだ場合、再度読み込み開始
		this.readBuffer(remainBuffer, contentList, onReadEnd);
	}
};

///// private function
function writableHTTPBuffer(contentList){
	const result = [];

	var len = contentList.length;
	for(var i=0; i<len; i++){
		var httpContent = contentList[i];
		if(httpContent.isReadEnd && !httpContent.isWriteEnd){
			//読み込みが完了していて、書き込んでいないContent
			result.push(httpContent.writeBuffer());
		}
	}

	return Buffer.concat(result);
}

function removeLeadingBlankLine(buffer){
	var blankLineBuffer = Buffer.from('\r\n');
	while(buffer.indexOf(blankLineBuffer) === 0){
		buffer = buffer.slice(2, buffer.length);
	}
	return buffer;
}


module.exports = TCPContent;