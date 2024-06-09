import React from 'react';
import { Modal, Button } from 'antd';

interface EmptyInputFormProps {
	visible: boolean;
	onConfirm: () => void;
}

const EmptyInputForm: React.FC<EmptyInputFormProps> = ({ visible, onConfirm}) => {
	const hadleFormConfirm = () => {
		onConfirm();
	};

	return (
		<Modal
			visible={visible}
			title="Empty"
			footer={[
				<Button key="confirm" type="primary" onClick={hadleFormConfirm}>
					Ok
				</Button>,
			]}
		>
			<p>Please enter the url.</p>
		</Modal>
	);
};

export default EmptyInputForm;
