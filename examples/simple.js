// Mann-Whitney U test
// Luke Mitchell, April 2016
// https://github.com/lukem512/mann-whitney-utest

var mwu = require('../src/mann-whitney');

var samples = [ [30, 14, 6], [12, 15, 16] ];
var u = mwu.test(samples);

if (!mwu.check(u, samples)) {
	console.error('Something went wrong!');
} else {
	console.log('U values', u);
}
