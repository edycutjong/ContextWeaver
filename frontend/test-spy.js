const { JSDOM } = require('jsdom');
const dom = new JSDOM();
global.window = dom.window;
global.performance = dom.window.performance;
console.log(performance.now());
performance.now = () => null;
console.log(performance.now());
