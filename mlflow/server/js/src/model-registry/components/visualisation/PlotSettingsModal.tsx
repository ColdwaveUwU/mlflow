import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Button, Tabs, Modal } from 'antd';
import PlotLayoutSettings from './PlotLayoutSettings';
import { LayoutSettings, ChartSetting } from './type';

const { TabPane } = Tabs;

interface PlotSettingsModalProps {
	isOpen: boolean;
	onRequestClose: () => void;
	plot: ChartSetting | null;
	onChangeLayout: (layout: LayoutSettings) => void;
}

const PlotSettingsModal: React.FC<PlotSettingsModalProps> = ({
	isOpen,
	onRequestClose,
	plot,
	onChangeLayout, 
}) => {
	const [localLayout, setLocalLayout] = useState<LayoutSettings | null>(null);

	useEffect(() => {
		if (isOpen && plot) {
			setLocalLayout(plot.layout);
		}
	}, [isOpen, plot]);

	const handleApplyChanges = () => {
		if (plot && localLayout) {
			onChangeLayout(localLayout);
		}
		onRequestClose();
	};

	const handleLayoutChange = (updatedLayout: LayoutSettings) => {
		setLocalLayout(updatedLayout);
	};

	return (
		<Modal
			centered
			confirmLoading
			title="Plot Settings"
			visible={isOpen}
			onCancel={onRequestClose}
			onOk={handleApplyChanges}
			footer={[
				<Button key="apply" type="primary" onClick={handleApplyChanges}>
					Apply Changes
				</Button>,
				<Button key="cancel" onClick={onRequestClose}>
					Cancel
				</Button>,
			]}
			width="70%"
		>
			{plot && localLayout && (
				<>
					<Plot
						data={Array.isArray(plot.data) ? plot.data : [plot.data]}
						layout={{
							...localLayout,
						}}
						config={{ displaylogo: false }}
						style={{ width: '100%', height: '100%' }}
					/>
					<Tabs>
						<TabPane tab="Layout" key="layout">
							<PlotLayoutSettings layout={localLayout} onChange={handleLayoutChange} />
						</TabPane>
						<TabPane tab="Data" key="data"></TabPane>
					</Tabs>
				</>
			)}
		</Modal>
	);
};

export default PlotSettingsModal;
