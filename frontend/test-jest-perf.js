const { jest } = require('@jest/globals');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const dom = new JSDOM();
global.window = dom.window;
global.performance = dom.window.performance;

const spy = jest.spyOn(global.performance, 'now').mockReturnValue(0);
console.log("mocked:", performance.now());
