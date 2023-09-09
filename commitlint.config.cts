import type { UserConfig } from '@commitlint/types';

import { getScopes } from './utils/scopes';

const Configuration: UserConfig = {
	/*
	 * Resolve and load @commitlint/config-conventional from node_modules.
	 * Referenced packages must be installed
	 */
	extends: ['@commitlint/config-conventional'],
	/*
	 * Resolve and load @commitlint/format from node_modules.
	 * Referenced package must be installed
	 */
	formatter: '@commitlint/format',
	/*
	 * Whether commitlint uses the default ignore rules.
	 */
	defaultIgnores: true,
	/*
	 * Custom URL to show upon failure
	 */
	helpUrl: 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
	rules: {
		'scope-enum': [2, 'always', [...getScopes()]],
	},
};

module.exports = Configuration;
