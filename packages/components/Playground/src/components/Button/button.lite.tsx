import './button.scss';
import SubButton from '@components/SubButton/sub-button.lite';

export default function Button(props) {
	return (
		<div>
			<button></button>
			<button className='active'></button>
			<SubButton />
		</div>
	);
}
