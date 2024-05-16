import React from 'react';
import { Modal, Button } from 'antd';

interface MergeChartsModalProps {
	visible: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	setMergeMetricsChart: (value: boolean) => void;
}

const MergeChartsModal: React.FC<MergeChartsModalProps> = ({ visible, onConfirm, onCancel, setMergeMetricsChart }) => {
	const handleMergeConfirm = () => {
		setMergeMetricsChart(true);
		onConfirm();
	};

	return (
		<Modal
			visible={visible}
			title="Merge Charts"
			onCancel={onCancel}
			footer={[
				<Button key="cancel" onClick={onCancel}>
					Cancel
				</Button>,
				<Button key="confirm" type="primary" onClick={handleMergeConfirm}>
					Confirm
				</Button>,
			]}
		>
			<p>Do you want to merge the Charts?</p>
		</Modal>
	);
};

export default MergeChartsModal;
