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
	const handledTypings = HandlePropRemoval(lines, propsToRemove).join('\n');
	const finalTypings = [...typeLines.slice(0, propsPos), handledTypings, ...typeLines.slice(propsPos + 1)];

	component.types = finalTypings;

	return component;
};
