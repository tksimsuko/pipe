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
	// console.log('############# request ###############');
	// console.log(httpContent.generateString())
});
pipe.on('response', (httpContent, tcpContent) => {
	// console.log('############# response ###############');
	// console.log(httpContent.generateString())
});
pipe.on('error', (err) => {
	console.log('error', err);
});