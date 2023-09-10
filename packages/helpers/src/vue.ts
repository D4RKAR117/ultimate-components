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
