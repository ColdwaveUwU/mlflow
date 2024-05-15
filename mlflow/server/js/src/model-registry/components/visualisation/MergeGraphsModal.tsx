import React from 'react';
import { Modal, Button } from 'antd';

interface MergeGraphsModalProps {
	visible: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	setMergeMetricsGraph: (value: boolean) => void;
}

const MergeGraphsModal: React.FC<MergeGraphsModalProps> = ({ visible, onConfirm, onCancel, setMergeMetricsGraph }) => {
	const handleMergeConfirm = () => {
		setMergeMetricsGraph(true);
		onConfirm();
	};

	return (
		<Modal
			visible={visible}
			title="Merge Graphs"
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
			<p>Do you want to merge the graphs?</p>
		</Modal>
	);
};

export default MergeGraphsModal;
