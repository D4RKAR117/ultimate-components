import { Show, useMetadata } from '@builder.io/mitosis';

interface Props {
	name: string;
	label: string;
	value: string;
	onUpdateValue: (val: string) => void;
	errorMessage?: string;
}

useMetadata({
	vModel: [
		{
			modelValue: 'value',
			eventConfig: {
				targetPropName: 'onUpdateValue',
				vModelPropName: 'update:modelValue',
			},
		},
	],
});

export default function SuperInputField(props: Props) {
	return (
		<div class='my-super-duper-input-field'>
			<label for={props.name}>{props.label}</label>
			<input
				id={props.name}
				name={props.name}
				value={props.value}
				onChange={event => props.onUpdateValue(event.target.value)}
			/>
			<Show when={props.errorMessage}>
				<p class='form-message danger'>{props.errorMessage}</p>
			</Show>
		</div>
	);
}
