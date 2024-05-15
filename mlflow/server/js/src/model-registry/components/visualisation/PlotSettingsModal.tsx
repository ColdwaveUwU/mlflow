import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { Button, Tabs, Modal } from 'antd';
import PlotLayoutSettings from './PlotLayoutSettings';

const { TabPane } = Tabs;

interface PlotSettingsModalProps {
	isOpen: boolean;
	onRequestClose: () => void;
	plotData: { name: string; x: string[]; y: number[] } | null;
	layout: { [key: string]: any };
	onChangeLayout: (layout: { [key: string]: any }) => void;
}

const PlotSettingsModal: React.FC<PlotSettingsModalProps> = ({
	isOpen,
	onRequestClose,
	plotData,
	layout,
	onChangeLayout,
}) => {
	const [localLayout, setLocalLayout] = useState(layout);

	const handleLayoutChange = (newLayout: { [key: string]: any }) => {
		setLocalLayout(newLayout);
	};

	const handleApplyChanges = () => {
		onChangeLayout(localLayout);
		onRequestClose();
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
			{plotData && (
				<>
					<Plot
						data={[
							{
								x: plotData.x.map((timestamp) => new Date(timestamp).toLocaleString()),
								y: plotData.y,
								type: 'scatter',
								mode: 'lines+markers',
								marker: { color: 'blue' },
							},
						]}
						layout={{
							title: plotData.name,
							xaxis: { title: 'Time' },
							yaxis: { title: 'Value' },
							...localLayout,
						}}
						config={{ displaylogo: false }}
						style={{ width: '100%', height: '100%' }}
					/>
					<Tabs>
						<TabPane tab="Layout" key="layout">
							<PlotLayoutSettings layout={localLayout} onChange={handleLayoutChange} />
						</TabPane>
					</Tabs>
				</>
			)}
		</Modal>
	);
};

export default PlotSettingsModal;
