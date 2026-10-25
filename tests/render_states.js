const fs = require('fs');
const vm = require('vm');

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync('frontend/js/helpers.js', 'utf8'), context);

const failures = [];

function check(name, condition) {
  if (!condition) {
    failures.push(name);
  }
}

check('out of range page', context.feedResultState(31, 0) === 'out-of-range');
check('empty marketplace', context.feedResultState(0, 0) === 'empty');
check('populated page', context.feedResultState(31, 12) === 'projects');

const both = context.contactActionKinds(true, 'lead@example.com', 'https://wa.me/123');
check('mailto and url together', both.indexOf('mailto') !== -1 && both.indexOf('url') !== -1);

const missing = context.projectMissingHtml();
check('not-found copy', missing.includes('Project not found') && missing.includes('Back to feed'));
check('not-found has no retry', !missing.includes('Try again') && !missing.includes('modal-retry'));

check('other student cannot edit', context.canEditProject(3, 7) === false);
check('owner can edit', context.canEditProject(7, 7) === true);

const missingStats = context.repoStatsSummary(null);
check('null snapshot is unavailable', missingStats.state === 'unavailable' && missingStats.language === null);
const noLanguage = context.repoStatsSummary({ stars: 2, language: null, pushed_at: null });
check('missing language is not invented', noLanguage.state === 'ready' && noLanguage.language === null && noLanguage.stars === 2);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('render states ok');
