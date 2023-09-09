import sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import postEnv from 'postcss-preset-env';
import cssnano from 'cssnano';
import { readFile } from 'fs/promises';
import { PathLike } from 'fs';

export const loadSassToCssString = async (filePath: PathLike) => {
	try {
		const loadedFile = await readFile(filePath, 'utf-8');
		const result = await sass.compileStringAsync(loadedFile);
		const { css } = await postcss([autoprefixer(), postEnv(), cssnano()]).process(result.css);

		return css;
	} catch (error) {
		console.log(`Error loading sass file for processing: ${error}`);
		return null;
	}
};
