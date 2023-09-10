import type { Plugin } from '@builder.io/mitosis';
import { MergeCssIntoMitosisComponent } from './css';
import { IntegrateVModelWithComponent } from './vue';

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

export const ProcessStylesPlugin: Plugin = (options: ProcessStyleOptions) => ({
	json: {
		pre(component) {
			console.info('[Mitosis Plugin][Styles Import Plugin] Processing styles for component:', component.name);
			const final = MergeCssIntoMitosisComponent(component, options.path, options.shouldAppendCmpName);
			return final;
		},
	},
});

export const AddVModelPlugin: Plugin = () => ({
	json: {
		post(component) {
			console.info('[Mitosis Plugin][VModel Plugin] Adding vModel to component:', component.name);
			const final = IntegrateVModelWithComponent(component);
			return final;
		},
	},
});
