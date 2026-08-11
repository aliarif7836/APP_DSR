module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: [
      'src/world/**/*.ts',
      'src/hooks/**/*.ts',
      'src/steps/**/*.ts',
    ],
    paths: ['src/features/**/*.feature'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
    ],
    formatOptions: { snippetInterface: 'async-await' },
  },
};
