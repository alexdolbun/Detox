const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const util = require('util');

const exec = util.promisify(cp.exec);

process.env.recordPerformance = 'all';

const N = Number(process.env.BENCHMARK_TIMES || "2");
const BENCHMARK_SUBSTRING = ' benchmark #';
const FLAG_EMOJI = /^[✓✗] /;

function template(_it_) {
  return function (name, ...args) {
    for (let index = 1; index <= N; index++) {
      _it_(name + BENCHMARK_SUBSTRING + index, ...args);
    }
  };
}

function isBenchmarkDir(dirname) {
  return dirname.includes(BENCHMARK_SUBSTRING);
}

function extractBenchmarkName(dirname) {
  const startIndex = FLAG_EMOJI.test(dirname) ? 2 : 0;
  return dirname.slice(startIndex, dirname.lastIndexOf(BENCHMARK_SUBSTRING));
}

async function queryDtxRec(dtxRecPath) {
  const cmd = [
    `dtxinst`
    `--document "${dtxRecPath}"`,
    `--entity "EventSample"`,
    `-k "name, additionalInfoStart, additionalInfoEnd, timestamp, duration"`,
    `--predicate 'category = "Performance"'`,
    `--fetch`,
  ].join(' ');

  const { stdout } = await exec(cmd, { encoding: 'utf8' });
  const events = stdout.split('\n').map(j => JSON.parse(j));

  return events;
}

async function collectStats() {
  const artifactsDir = process.env.artifactsLocation;
  const inferDtxRecPath = (testDir) => path.join(artifactsDir, testDir, 'test.dtxrec');
  const profiles = _.chain(fs.readdirSync(artifactsDir))
    .filter(isBenchmarkDir)
    .groupBy(extractBenchmarkName)
    .mapValues((dirnames, benchmarkName) => ({
      name: benchmarkName,
      dtxRecPaths: dirnames.map(inferDtxRecPath),
    }))
    .values()
    .value();

  console.log(profiles);
}

module.exports = {
  benchmark: Object.assign(template(it), {
    only: template(it.only),
    skip: template(it.skip),
  }),
  collectStats,
};
