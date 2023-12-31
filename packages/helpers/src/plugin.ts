import type { Plugin } from '@builder.io/mitosis';
import { MergeCssIntoMitosisComponent } from './css';
import {
	IntegrateVModelWithComponent,
	ManageComponentVModelTypings,
	AddDefinePropsToComponent,
	AddDefineEmitsToComponent,
} from './vue';

export type ProcessStyleOptions = {
	/**
	 *  The base path to resolve relative imports from at the component processing
	 *  @default process.cwd()
	 */
	path?: string;

	/**
	 *  should the component name be appended to the resolution path? e.g `./src/components/MyComponent` for a component named `MyComponent` if not provided or false will stay as is
	 * @default false
	 */
	shouldAppendCmpName?: boolean;
};

/**
 *  A plugin to handle style files imports
 *
 * @param options  The options for the plugin
 * @returns  The plugin
 */
export const ProcessStylesPlugin: Plugin = (options: ProcessStyleOptions) => ({
	json: {
		pre(component) {
			console.info('[Mitosis Plugin][Styles Import Plugin] Processing styles for component:', component.name);
			const final = MergeCssIntoMitosisComponent(component, options.path, options.shouldAppendCmpName);
			return final;
		},
	},
});

/**
 *  A plugin to add vModel support to components using the vModel metadata added to mitosis component.
 *  Replaces the prop drilling callback with the vue event model
 *  **This plugin is only for vue 3 output components that use composition api and typescript**
 *
 * @returns  The plugin
 */
export const AddVModelPlugin: Plugin = () => ({
	json: {
		post(component) {
			console.info('[Mitosis Plugin][VModel Plugin] Adding vModel to component:', component.name);
			let final = IntegrateVModelWithComponent(component);
			final = ManageComponentVModelTypings(final);
			return final;
		},
	},
	code: {
		pre(code, json) {
			let final = code;
			final = AddDefinePropsToComponent(final, json);
			final = AddDefineEmitsToComponent(final, json);
			return final;
		},
	},
});

/**
 *  Plugin to add typed props to components using the defineProps api
 *  **This plugin is only for vue 3 output components that use composition api and typescript**
 *
 *  if you use the `AddVModelPlugin` plugin you do not need to use this plugin as it already adds typed props
 *
 * @returns The plugin
 */
export const AddTypedPropsPlugin: Plugin = () => ({
	code: {
		pre(code, json) {
			return AddDefinePropsToComponent(code, json);
		},
	},
});
