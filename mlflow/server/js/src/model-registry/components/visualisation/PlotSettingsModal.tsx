import React, { useState } from 'react';
import Plot from 'react-plotly.js';

interface PlotSettingsModalProps {
	isOpen: boolean;
	onRequestClose: () => void;
	plotData: { name: string; x: string[]; y: number[] } | null;
}

const PlotSettingsModal: React.FC<PlotSettingsModalProps> = ({ isOpen, onRequestClose, plotData }) => {
	const [showGrid, setShowGrid] = useState<boolean>(false);

	const handleGridChange = () => {
		setShowGrid(!showGrid);
	};

	return (
		<div style={{ display: isOpen ? 'block' : 'none', position: 'fixed', zIndex: 999, top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', }}>
			<div style={{ backgroundColor: '#fff', margin: '100px auto', padding: '20px', borderRadius: '8px', maxWidth: '80%', maxHeight: '80%', overflow: 'auto', }}>
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
								showlegend: true,
							}}
							config={{ displaylogo: false, editable:true}}
							style={{ width: '100%', height: '80%' }}
						/>
						<div style={{ marginTop: '20px' }}>
							<h3>Plot Settings</h3>
							<label>
								<input type="checkbox" checked={showGrid} onChange={handleGridChange} />
								Show Grid
							</label>
							{/* todo*/}
						</div>
					</>
				)}
				<button onClick={onRequestClose} style={{ marginTop: '20px' }}>Close</button>
			</div>
		</div>
	);
};

export default PlotSettingsModal;
