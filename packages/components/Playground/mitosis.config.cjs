/* eslint-disable @typescript-eslint/no-var-requires */
const { ProcessStylesPlugin, AddVModelPlugin } = require('@d4rkar117/ultimate-components-helpers');
const { resolve } = require('path');

/**
 * @type {import("@builder.io/mitosis").MitosisConfig}
 */
const config = {
	targets: ['vue', 'react'],
	files: ['src/components/**/*'],
	options: {
		vue: {
			typescript: true,
			defineComponent: false,
			plugins: [
				() =>
					ProcessStylesPlugin({ path: resolve(process.cwd(), 'src/components'), shouldAppendCmpName: true }),
				() => AddVModelPlugin(),
			],
		},
		react: {
			typescript: true,
			stylesType: 'styled-jsx',
			plugins: [
				() =>
					ProcessStylesPlugin({ path: resolve(process.cwd(), 'src/components'), shouldAppendCmpName: true }),
			],
		},
	},
};

module.exports = config;
