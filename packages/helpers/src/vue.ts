import { type BaseNode, type MitosisComponent } from '@builder.io/mitosis';

export type VModel = {
	modelValue: string;
	eventConfig: {
		targetPropName: string;
		vModelPropName: `update:${string}`;
	};
};

/**
 *  Gets the vModel metadata from a mitosis component
 *
 * @param component  The mitosis component to get the vModel metadata from
 * @returns  The vModel metadata from the mitosis component
 */
export const GetVModelMeta = (component: MitosisComponent) => {
	const { meta } = component;
	if (!meta.useMetadata) return [];

	const vModelMeta = (meta.useMetadata['vModel'] || []) as VModel[];

	const validVModelMeta = vModelMeta.filter(({ modelValue, eventConfig }) => {
		if (!modelValue || !eventConfig) return false;
		if (!eventConfig.targetPropName || !eventConfig.vModelPropName) return false;
		const { vModelPropName } = eventConfig;
		const isValid =
			(modelValue === 'value' && vModelPropName === `update:modelValue`) ||
			(modelValue !== 'value' && vModelPropName === `update:${modelValue}`);

		return isValid;
	});

	// Ensure that the array don't contain duplicated config with targetPropName if so, use the first one and remove the duplicates
	const uniqueVModelMeta: VModel[] = validVModelMeta.filter((vModel, index, self) => {
		const { eventConfig } = vModel;
		if (!eventConfig) return false;
		const { targetPropName } = eventConfig;
		const firstIndex = self.findIndex(vModel => {
			const { eventConfig } = vModel;
			if (!eventConfig) return false;
			const { targetPropName: targetPropNameToCompare } = eventConfig;
			return targetPropName === targetPropNameToCompare;
		});
		return index === firstIndex;
	});

	return uniqueVModelMeta;
};

/**
 *  Iterates over the children of a node and calls a callback on each child
 *
 * @param children the children to iterate over
 * @param callback  the callback to call on each child
 * @returns  the modified children
 */
export const IterateChildren = (children: BaseNode[], callback: (child: BaseNode) => BaseNode): BaseNode[] => {
	return children.map(child => {
		const newChild = { ...child };
		if (newChild.children) {
			newChild.children = IterateChildren(newChild.children, callback);
		}
		return callback(newChild);
	});
};

/**
 * Modifies the bindings of a node replacing the target event prop with the vue event model
 *
 * @param node the node to modify the bindings of
 * @param targetEventPropName the event prop name to replace
 * @param replaceWith the vue event model to replace the event prop with
 * @returns the modified node with the replaced event prop
 */
export const ModifyEventBinding = (node: BaseNode, targetEventPropName: string, replaceWith: string) => {
	const { bindings } = node;
	if (!bindings) return node;

	const searchFor = new RegExp(`${targetEventPropName}\\((event(\\.[a-zA-Z]+)*)\\)`);
	const replaceWithStr = `$emit('${replaceWith}', $1)`;

	const bindingsKeys = Object.keys(bindings);

	for (const key of bindingsKeys) {
		const binding = bindings[key];
		if (!binding) continue;
		if (binding.code && binding.code.match(searchFor)) {
			console.info(
				`[Mitosis Plugin][VModel Support Plugin] Replacing in ${binding.code} with ${binding.code.replace(
					searchFor,
					replaceWithStr
				)}`
			);
			binding.code = binding.code.replace(searchFor, replaceWithStr);
			bindings[key] = binding;
		}
	}

	node.bindings = bindings;
	return node;
};

/**
 *  Adds vModel support to a mitosis component using the vModel metadata added to mitosis component
 *
 * @param component Mitosis component to add vModel support replacing the event prop with the vModel event
 * @returns The mitosis component with vModel support
 */
export const IntegrateVModelWithComponent = (component: MitosisComponent) => {
	const vModelMeta = GetVModelMeta(component);

	const { children } = component;

	for (const config of vModelMeta) {
		const newChildren = IterateChildren(children, child => {
			const { bindings } = child;
			if (!bindings) return child;

			const { eventConfig } = config;
			if (!eventConfig || !eventConfig.targetPropName || !eventConfig.vModelPropName) return child;

			const newChild = ModifyEventBinding(child, eventConfig.targetPropName, eventConfig.vModelPropName);
			return newChild;
		});

		component.children = newChildren;
	}

	return component;
};

/**
 * Removes the event props from the typings of a mitosis component to avoid type access errors
 *
 * @param typings  The typings to remove props from
 * @param propsToReplace  The props to remove from the typings
 * @returns  The typings with the prop events removed
 */
export const HandlePropRemoval = (typings: string[], propsToReplace: string[]) => {
	const matchRegex = new RegExp(`(${propsToReplace.join('|')})\\s?:\\s?(.*)`);
	const filtered = typings.filter(line => line.match(matchRegex) === null);
	return filtered;
};

/**
 *  Finds the typings for the props of a mitosis component
 *
 * @param typeLines  The lines of the typings to find the props typings in
 * @param nameOfPropRef  The name of the prop reference to find the typings for
 * @returns  The typings for the prop reference
 */
export const FindPropTypings = (typeLines: string[], nameOfPropRef: string) => {
	const propsTypeRegex = new RegExp(`(type|interface)\\s${nameOfPropRef}\\s(=|{)`);
	const startIndex = typeLines.findIndex((line, index) => {
		return line.match(propsTypeRegex) !== null ? index : -1;
	});
	if (startIndex === -1) return [];

	let endIndex = startIndex + 1;
	let openBraces = 1;

	while (openBraces > 0 && endIndex < typeLines.length) {
		const line = typeLines[endIndex];
		openBraces += ((line && line.match(/{/g)) || []).length;
		openBraces -= ((line && line.match(/}/g)) || []).length;
		endIndex++;
	}
	const finalStartIndex = startIndex > 0 ? startIndex - 1 : startIndex;
	const typings = typeLines.slice(finalStartIndex, endIndex);

	return typings;
};

export const CreateEmitTypings = (typings: string[], modelEvents: VModel[]) => {
	// Given the typings of the props, create the typings for the emit events
	// input will be the typings of the props and the props that will be handled as Events
	// ie interface Props { name: string, age: number, onClick: (event: MouseEvent) => void, onUpdateD }
	// output will be the typings for the emit events
	// ie interface EmitEvents { (e: 'click', data: MouseEvent) => void }
	// will use the modelEvents to get the name of the event and the props that is targeted by the event
	// ie modelEvents = [{ modelValue: 'value', eventConfig: { targetPropName: 'onUpdateValue', vModelPropName: 'update:modelValue' } }]
	// will return the typings for the emit events
	// ie interface EmitEvents { (e: 'update:modelValue', data: string): void }
	// where the target prop params are the params of the emit event

	const InterfaceTemplate = `interface EmitEvents {  REPLACE_SLOT }`;

	const emitTypings = modelEvents
		.map(({ eventConfig }) => {
			const { targetPropName, vModelPropName } = eventConfig;
			const targetPropTypings = typings.find(line => line.includes(targetPropName));
			if (!targetPropTypings) return '';
			const matchRegex = new RegExp(`${targetPropName}\\s?:\\s?(.*)`);
			const match = targetPropTypings.match(matchRegex);
			if (!match) return null;
			const [, params] = match;
			if (!params) return null;
			const paramsRegex = new RegExp(`\\((.*)\\)`);
			const paramsMatch = params.match(paramsRegex);
			if (!paramsMatch) return null;
			const [, paramsStr] = paramsMatch;
			if (!paramsStr) return null;
			const paramsArr = paramsStr.split(',').map(param => param.trim());
			const emitTyping = `(e: '${vModelPropName}',  ${paramsArr.join(', ')}): void`;
			return emitTyping;
		})
		.filter(line => line !== null)
		.join('\n ');

	const finalTypings = InterfaceTemplate.replace('REPLACE_SLOT', emitTypings);

	return finalTypings;
};

/**
 * Removes the event props from the typings of a mitosis component to avoid type access errors
 *
 * @param component component to remove event props from typings
 * @returns  the modified component with the event props removed from typings
 */
export const ManageComponentVModelTypings = (component: MitosisComponent) => {
	const vModelMeta = GetVModelMeta(component);

	const propsToRemove = vModelMeta.map(({ eventConfig }) => eventConfig.targetPropName);

	const { types: typeLines, propsTypeRef } = component;

	if (!typeLines || !propsTypeRef) return component;

	console.info('[Mitosis Plugin][VModel Support Plugin] Removing event props from typings:', propsToRemove);

	const propsPos = typeLines.findIndex(line => line.includes(propsTypeRef));
	const filteredTypeLines = typeLines.at(propsPos)?.trim().split('\n');
	const lines = FindPropTypings(filteredTypeLines || [], propsTypeRef);
	const emitTypings = CreateEmitTypings(lines, vModelMeta);
	const propTypings = HandlePropRemoval(lines, propsToRemove).join('\n');
	const finalTypings = [
		...typeLines.slice(0, propsPos),
		`${propTypings}\n${emitTypings}`,
		...typeLines.slice(propsPos + 1),
	];

	component.types = finalTypings;

	return component;
};

/**
 * Removes the default props property from a component
 *
 * @param code  The code to remove the default props from
 * @returns  The modified code with the default props property removed
 */
export const RemoveDefaultPropsFromCode = (code: string) => {
	// regex to find 'props: [...]' inside the export default object
	const propsRegex = new RegExp(/props\s?:\s?\[([\s\S]*?)\],?\s*/);
	const newCode = code.replace(propsRegex, '');
	return newCode;
};

/**
 *  Adds a defineProps statement to a component to add typed props
 *
 * @param code  The code to add the defineProps statement to
 * @param propsTypeRef  The name of the props type/interface to add to the defineProps statement
 * @returns  The modified code with the defineProps statement added
 */
export const AddDefinePropsStatement = (code: string, propsTypeRef: string) => {
	// should add `const props = defineProps<propsTypeRef>()` where propsTypeRef is the name of the props type/interface
	// should add right above the `export default` statement preserving existing whitespace or code above
	const anchorPosRegex = new RegExp(/export\s+default\s+/);

	const anchorPos = code.search(anchorPosRegex);
	const definePropsStatement = `const props = defineProps<${propsTypeRef}>();\n`;

	// escape without adding defineProps statement if the anchorPos is not found or there already is a defineProps statement
	if (anchorPos === -1 || code.includes('defineProps')) return code;

	const newCode = code.slice(0, anchorPos) + definePropsStatement + code.slice(anchorPos);

	return newCode;
};

/**
 * Adds a defineProps statement to a component to add typed props (Entry point for plugin)
 *
 * @param code  The code to add the defineProps statement to
 * @param component  The component to get the props type reference from
 * @returns The modified code with the defineProps statement added
 */
export const AddDefinePropsToComponent = (code: string, component: MitosisComponent) => {
	const { types: typeLines, propsTypeRef } = component;
	if (!typeLines || !propsTypeRef) return code;

	const removedDefaultPropsCode = RemoveDefaultPropsFromCode(code);

	const newCode = AddDefinePropsStatement(removedDefaultPropsCode, propsTypeRef);

	console.info('[Mitosis Plugin][VModel Support Plugin] Adding defineProps statement to component:', component.name);

	return newCode;
};

/**
 *  Adds a defineEmits statement to a component to add typed emit events
 *
 * @param code  The code to add the defineEmits statement to
 * @returns  The modified code with the defineEmits statement added
 */
export const AddDefineEmitsStatement = (code: string) => {
	// should add `const emit = defineEmits<EmitEvents>()` where EmitEvents is the name of the emit events interface
	// should add right above the `export default` statement preserving existing whitespace or code above
	const anchorPosRegex = new RegExp(/export\s+default\s+/);

	const anchorPos = code.search(anchorPosRegex);
	const defineEmitsStatement = `const emit = defineEmits<EmitEvents>();\n`;

	// escape without adding defineEmits statement if the anchorPos is not found or there already is a defineEmits statement
	if (anchorPos === -1 || code.includes('defineEmits')) return code;

	const newCode = code.slice(0, anchorPos) + defineEmitsStatement + code.slice(anchorPos);

	return newCode;
};

/**
 *  Adds a defineEmits statement to a component to add typed emit events (Entry point for plugin)
 *
 * @param code code to add the defineEmits statement to
 * @param component  The component to get the emit events interface from
 * @returns  The modified code with the defineEmits statement added
 */
export const AddDefineEmitsToComponent = (code: string, component: MitosisComponent) => {
	const { types: typeLines, propsTypeRef } = component;
	if (!typeLines || !propsTypeRef) return code;

	const newCode = AddDefineEmitsStatement(code);

	console.info('[Mitosis Plugin][VModel Support Plugin] Adding defineEmits statement to component:', component.name);

	return newCode;
};
