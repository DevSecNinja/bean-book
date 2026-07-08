/**
 * Validate the bean-review issue from the current GitHub event.
 *
 * Reads the issue from $GITHUB_EVENT_PATH, validates it, writes the comment
 * body to `.issue-comment.md`, and exposes `valid=true|false` via $GITHUB_OUTPUT
 * for later workflow steps. Prints the comment to the log for visibility.
 */

import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { validateIssue, buildComment } from './lib/validate.js';

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath) {
  console.error('GITHUB_EVENT_PATH is not set — run this inside GitHub Actions.');
  process.exit(1);
}

const event = JSON.parse(readFileSync(eventPath, 'utf8'));
const issue = event.issue;
if (!issue) {
  console.error('No issue found in the event payload.');
  process.exit(1);
}

const result = validateIssue(issue);
const comment = buildComment(result, { login: issue.user?.login });

writeFileSync('.issue-comment.md', `${comment}\n`, 'utf8');
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `valid=${result.ok}\n`);
}

console.log(comment);
console.log(`\nvalid=${result.ok}`);
