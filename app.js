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

const pipe = require('./lib/pipe.js');
const setting = require('./setting');

pipe.listen(setting, () => {
	console.log('http server start', setting);
});
pipe.on('request', (httpContent, tcpContent) => {
	
});
pipe.on('response', (httpContent, tcpContent) => {
	
});
pipe.on('error', (err) => {
	console.log('error', err);
});