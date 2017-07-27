// setting
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
//
// Listener
//    tcpStart
//    request
//    response
//    tcpEnd
//    error
//

const pipe = require('../..//lib/pipe.js');
const TCPCapture = require('./tcpcapture.js');
const setting = require('./setting');

pipe.listen(setting, () => {
	console.log('http server start', setting);
});

pipe.on('tcpStart', (tcpContent) => {
	tcpContent.attachment = new TCPCapture();
});
pipe.on('request', (httpContent, tcpContent) => {
	tcpContent.attachment.HTTPRequestCapture(httpContent);
});
pipe.on('response', (httpContent, tcpContent) => {
	tcpContent.attachment.HTTPResponseCapture(httpContent);
});
pipe.on('tcpEnd', (tcpContent) => {
	tcpContent.attachment.outputToFile();
});
pipe.on('error', (err) => {
	console.log('pipe capture error', err);
});