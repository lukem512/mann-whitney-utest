// Mann-Whitney U test
// Luke Mitchell, April 2016
// https://github.com/lukem512/mann-whitney-utest

// The object key used to store the observation value.
var __key = 'val';

// Rank the list.
// Inspired by https://gist.github.com/gungorbudak/1c3989cc26b9567c6e50
var rank = function(list) {

	// First, sort in ascending order
	list.sort(function(a, b) {
		return (a[__key] - b[__key]);
	});

	// Second, add the rank to the objects
	list = list.map(function(item, index) {
		item.rank = index + 1;
		return item;
	});

	// Third, use median values for groups with the same rank
	for (var i = 0; i < list.length; /* nothing */ ) {
		var count = 1;
		var total = list[i].rank;

		for (var j = 0; list[i + j + 1] && (list[i + j][__key] === list[i + j + 1][__key]); j++) {
			total += list[i + j + 1].rank;
			count++;
		}

		var rank = (total / count);

		for (var k = 0; k < count; k++) {
			list[i + k].rank = rank;
		}

		i = i + count;
	}

	return list;
};

// Compute the rank of a sample, given a ranked
// list and a list of observations for that sample.
var sampleRank = function(rankedList, observations) {

	// Clone the array
	var __observations = observations.slice(0);

	// Compute the rank
	var rank = 0;
	rankedList.forEach(function(observation) {
		var index = __observations.indexOf(observation[__key]);
		if (index > -1) {
			// Add the rank to the sum
			rank += observation.rank;

			// Remove the observation from the list
    		__observations.splice(index, 1);
		}
	});

	return rank;
};

// Compute the U value of a sample,
// given the rank and the list of observations
// for that sample.
var uValue = function(rank, observations) {
	var k = observations.length;
	return rank - ((k * (k+1)) / 2);
};

// Check the U values are valid.
// This utilises a property of the Mann-Whitney U test
// that ensures the sum of the U values equals the product
// of the number of observations.
var check = module.exports.check = function(u, samples) {
	return (u[0] + u[1]) == (samples[0].length * samples[1].length);
};

// Approximate the crticial value for the samples.
// This is necessary when the sample sizes are greater than 20
// as the U tables are limited to 20x20.
// https://en.wikipedia.org/wiki/Mann%E2%80%93Whitney_U_test#Normal_approximation_and_tie_correction
var criticalValue = module.exports.criticalValue = function(u, samples) {
	var uVal = Math.min(u[0], u[1]);
	var prod = samples[0].length * samples[1].length;
	var n  = samples[0].length + samples[1].length;
	var mean = prod / 2;

	// Count the ranks
	var counts = {};
	samples.forEach(function(sample) {
		sample.forEach(function(o) {
			if (!counts[o]) counts[o] = 1;
			else counts[o]++;
		});
	});

	// Find any tied ranks
	var ties = Object.keys(counts)
		.filter(function(key) { return counts[key] > 1 })
		.map(function(tie) { return counts[tie] });
	var k = ties.length;

	// Compute correction
	var correction = 0;
	for (var i = 0; i < k; i++) {
		correction += (Math.pow(ties[i],3) - ties[i]) / (n * (n-1));
	}

	// Compute standard deviation using correction for ties
	var stddev = Math.sqrt(
		(prod/12) * ((n + 1) - correction)
	);

	// Approximate the critical value
	var z = Math.abs((uVal - mean) / stddev);
	return z;
};

// Test the result for significance.
// A result is significant if the lesser U-value is
// less than the critical value.
var significant = module.exports.significant = function(u, samples) {
	return (Math.min(u[0], u[1]) < criticalValue(u, samples));
};

// Perform te Mann-Whitney U test on an array of samples.
// The input should be of the form [[a, b, c], [e, f, g]]
// where {a, b, ..., g} are numeric values forming two
// samples.
var test = module.exports.test = function(samples, key) {

	// Perform validation
	if (!Array.isArray(samples)) throw Error('Samples must be an array');
	if (samples.length !== 2) throw Error('Samples must contain exactly two samples');

	for (var i = 0; i < 2; i++) {
		if (!samples[i] || samples[i].length == 0) throw Error('Samples cannot be empty');
		if (!Array.isArray(samples[i])) throw Error('Sample ' + i + ' must be an array');
	}

	// Rank the entire list of observations
	var all = samples[0].concat(samples[1]);

	var unranked = all.map(function(val) {
		var result = {};
		result[__key] = val;
		return result;
	});

	var ranked = rank(unranked);

	// Compute the rank of each sample
	var ranks = [];
	for (var i = 0; i < 2; i++) {
		ranks[i] = sampleRank(ranked, samples[i]);
	}

	// Compute the U values
	var us = [];
	for (var i = 0; i < 2; i++) {
		us[i] = uValue(ranks[i], samples[i]);
	}

	// An optimisation is to use a property of the U test
	// to calculate the U value of sample 1 based on the value
	// of sample 0
	// var u[1] = (samples[0].length * samples[1].length) - u[0];

	// Return the array of U values
	return us;
};
