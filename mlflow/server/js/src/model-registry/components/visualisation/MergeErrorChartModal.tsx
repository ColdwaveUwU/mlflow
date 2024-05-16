import React from 'react';
import { Modal, Button } from 'antd';

interface MergeChartsModalProps {
	visible: boolean;
	onConfirm: () => void;
}

const MergeErrorChartModal: React.FC<MergeChartsModalProps> = ({ visible, onConfirm}) => {
	const handleMergeConfirm = () => {
		onConfirm();
	};

	return (
		<Modal
			visible={visible}
			title="Merge Charts"
			footer={[
				<Button key="confirm" type="primary" onClick={handleMergeConfirm}>
					Ok
				</Button>,
			]}
		>
			<p>You cannot merge graphs with different axes.</p>
		</Modal>
	);
};

export default MergeErrorChartModal;
