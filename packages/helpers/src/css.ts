import { compileString } from 'sass';
import { readFileSync, type PathLike } from 'fs';
import { resolve } from 'path';
import { type MitosisComponent } from '@builder.io/mitosis';

/**
 *  Loads a sass file and returns the css string
 *
 * @param filePath  The path to the sass/css file to load
 * @returns  The css string from the sass file
 */
export const loadSassToCssString = (filePath: PathLike) => {
	try {
		const content = readFileSync(filePath, 'utf-8');
		return compileString(content).css;
	} catch (error) {
		console.log(`Error loading sass file for processing: ${error}`);
		return null;
	}
};

/**
 *  Checks if a mitosis component has imported css
 *
 * @param component The mitosis component to check for imported css
 * @returns  Whether or not the mitosis component has imported css
 */
export const MitosisComponentHasImportedCss = (component: MitosisComponent) => {
	const { imports } = component;
	const importRegex = new RegExp(/\.s?css$/);
	return imports.some(imported => imported.path.match(importRegex) && imported.importKind === 'value');
};

/**
 * Extracts css from the imports of a mitosis component
 *
 * @param component  The mitosis component to extract css from
 * @param componentPath  The base path to resolve relative imports from
 * @returns  A string of css from the imports of the mitosis component
 */
export const ExtractCssFromMitosisImports = (component: MitosisComponent, componentPath = process.cwd()) => {
	if (!MitosisComponentHasImportedCss(component)) return '';

	const cssImports = component.imports.filter(({ path }) => path.match(/\.s?css$/));
	const pathsToCssImport = cssImports.map(({ path }) => resolve(componentPath, path));

	const pathCssMap = pathsToCssImport.map(path => {
		const css = loadSassToCssString(path);
		return { path, css: css || '' };
	});

	const css = pathCssMap.map(({ css }) => css).join('\n');
	return css;
};

/**
 * Merges css and scss from imports into the style property of a mitosis component
 *
 * @param component the mitosis component to merge css into
 * @param resolutionPath the base component path to resolve relative imports from
 * @param shouldAppendName should the component name be appended to the resolution path? e.g `./src/components/MyComponent` for a component named `MyComponent` if not provided or false will stay as is
 * @returns the mitosis component with css merged into the style property
 */
export const MergeCssIntoMitosisComponent = (
	component: MitosisComponent,
	resolutionPath = process.cwd(),
	shouldAppendName = false
) => {
	const prevCss = component.style || '';
	const finalPath = shouldAppendName ? resolve(resolutionPath, component.name) : resolutionPath;
	const css = ExtractCssFromMitosisImports(component, finalPath);
	component.imports = RemoveCssImportsFromMitosisComponent(component);

	component.style = `${prevCss}\n${css}`;

	return component;
};

export const RemoveCssImportsFromMitosisComponent = (component: MitosisComponent) => {
	return component.imports.filter(({ path }) => !path.match(/\.s?css$/));
};
