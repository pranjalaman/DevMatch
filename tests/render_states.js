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

const october = new Date(2026, 9, 26);
const choices = context.joiningYearChoices(october);
check('october 2026 choices run from 2026 back to 2021', choices.join(',') === '2026,2025,2024,2023,2022,2021');
check('july 2027 still uses the calendar year', context.joiningYearChoices(new Date(2027, 6, 31)).join(',') === '2027,2026,2025,2024,2023,2022');
check('github profile link', context.isGithubProfileLink('https://github.com/ada') === true);
check('github repo is not a profile link', context.isGithubProfileLink('https://github.com/ada/devmatch') === false);

const year3 = context.cardStandingPresentation('Year 3');
check('year 3 card attribute', year3.attribute === ' data-standing="3"' && year3.text === 'Year 3');
const year1 = context.cardStandingPresentation('Year 1');
check('year 1 uses yellow', year1.tone === '--yellow');
const finished = context.cardStandingPresentation('Finished');
check('finished has no year color', finished.text === 'Finished' && finished.attribute === '' && finished.tone === '');

const css = fs.readFileSync('frontend/css/components.css', 'utf8');
for (const [number, tone] of [['1', '--yellow'], ['2', '--green'], ['3', '--blue'], ['4', '--pink'], ['5', '--purple']]) {
  check('css ' + tone, css.includes(`.card[data-standing="${number}"] { background: var(${tone}); }`));
}
check('no second dark card palette', !css.includes('[data-theme="dark"] .card[data-standing'));

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('render states ok');
