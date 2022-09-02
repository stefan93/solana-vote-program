var util = require('util');
util.inspect.defaultOptions.depth = null; //enable full object reproting in console.log
util.inspect.defaultOptions.maxArrayLength = null
util.inspect.defaultOptions.maxStringLength = null

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
};

