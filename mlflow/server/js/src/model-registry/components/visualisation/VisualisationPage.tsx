import React, { useEffect, useState, useRef } from 'react';
import Plot from 'react-plotly.js';
import { HTTPMethods, fetchEndpoint } from 'common/utils/FetchUtils';
import { RunEntity, ModelVersionInfoEntity, RunDatasetWithTags } from 'experiment-tracking/types';
import { Input, Button } from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';
import { Spacer } from '../../../../src/shared/building_blocks/Spacer';
import PlotSettingsModal from './PlotSettingsModal'; 

interface ModelVersionResponse {
	model_versions: ModelVersionInfoEntity[];
}

interface DataSetInputs {
	inputs: RunDatasetWithTags;
}

type RunInfoEntityResponse = {
	run: RunEntity & DataSetInputs;
};

interface ModelNameProps {
	name: string;
}

const VisualisationPage: React.FC<ModelNameProps> = ({ name }) => {
	const [data, setData] = useState<{ name: string; x: string[]; y: number[] }[]>([]);
	const [filteredData, setFilteredData] = useState<{ name: string; x: string[]; y: number[] }[]>([]);
	const [selectedMetric, setSelectedMetric] = useState<string>('');
	const [inputValue, setInputValue] = useState<string>('');
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
	const [plotSettingsModalOpen, setPlotSettingsModalOpen] = useState<boolean>(false); 
	const [selectedPlotData, setSelectedPlotData] = useState<{ name: string; x: string[]; y: number[] } | null>(null); 
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const apiUrlModelVersions = 'ajax-api/2.0/mlflow/model-versions/search';
		fetchEndpoint({ relativeUrl: apiUrlModelVersions, method: HTTPMethods.GET }).then((value: unknown) => {
			const response = value as ModelVersionResponse;
			const filteredData = response.model_versions
				.filter((modelVersion: ModelVersionInfoEntity) => modelVersion.name === name)
				.map((modelVersion: ModelVersionInfoEntity) => ({
					run_id: modelVersion.run_id,
					creation_timestamp: modelVersion.creation_timestamp,
				}));
			const apiUrlRunId = 'ajax-api/2.0/mlflow/runs/get';

			const fetchPromises = filteredData.map(async (filterData) => {
				const queryParams = new URLSearchParams({
					run_id: filterData.run_id,
				});

				const url = `${apiUrlRunId}?${queryParams}`;

				const response = await fetchEndpoint({ relativeUrl: url, method: HTTPMethods.GET });
				return response as RunEntity;
			});

			const runs = Promise.all(fetchPromises)
				.then((response) => {
					return response;
				})
				.catch((error) => {
					console.error('Request execution error', error);
				});

			runs.then((response: unknown) => {
				const runInfoArr = response as RunInfoEntityResponse[];
				const metricData: { name: string; x: string[]; y: number[] }[] = [];
				runInfoArr.forEach((runInfo) => {
					runInfo.run.data.metrics.forEach((metric) => {
						const metricIndex = metricData.findIndex((item) => item.name === metric.key);
						if (metricIndex !== -1) {
							metricData[metricIndex].x.push(new Date(metric.timestamp).toISOString());
							metricData[metricIndex].y.push(metric.value);
						} else {
							metricData.push({
								name: metric.key,
								x: [new Date(metric.timestamp).toISOString()],
								y: [metric.value],
							});
						}
					});
				});
				setData(metricData);
				setFilteredData(metricData);
			});
		});
	}, [name]);

	useEffect(() => {
		setFilteredData(data.filter((metric) => metric.name.includes(inputValue)));
	}, [data, inputValue]);

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setInputValue(value);
		setSelectedMetric(value);
	};

	const handleDragStart = (index: number) => {
		setDraggedIndex(index);
	};

	const handleDragOver = (index: number) => {
		setHighlightedIndex(index);
	};

	const handleDragEnd = (index: number) => {
		if (draggedIndex !== null && draggedIndex !== index) {
			const newData = [...filteredData];
			[newData[draggedIndex], newData[index]] = [newData[index], newData[draggedIndex]];
			setFilteredData(newData);
			setDraggedIndex(index);
		}
		setDraggedIndex(null);
		setHighlightedIndex(null);
	};

	const handleDrop = (index: number) => {
		if (draggedIndex !== null && draggedIndex !== index) {
			const newData = [...filteredData];
			[newData[draggedIndex], newData[index]] = [newData[index], newData[draggedIndex]];
			setFilteredData(newData);
			setDraggedIndex(null);
			setHighlightedIndex(null);
		}
	};


	const handleDoubleClickPlot = (plotData: { name: string; x: string[]; y: number[] }) => {
		setSelectedPlotData(plotData);
		setPlotSettingsModalOpen(true);
	};

	const handleClosePlotSettingsModal = () => {
		setPlotSettingsModalOpen(false);
	};

	return (
		<div>
			<div style={{ marginBottom: '12px' }}>
				<Spacer direction="horizontal" size="small">
					<Input
						prefix={<i className="fas fa-search" style={{ fontStyle: 'normal' }} />}
						type="text"
						value={inputValue}
						onChange={handleInputChange}
						placeholder="Enter metric name"
					/>
					<span data-test-id="search-button">
						<Button
							componentId="codegen_mlflow_app_src_shared_building_blocks_searchbox.tsx_79"
							data-test-id="search-button"
						>
							<FormattedMessage
								defaultMessage="Refresh"
								description="String for the search button to search objects in MLflow"
							/>
						</Button>
					</span>
				</Spacer>
			</div>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'flex-start',
					gap: '20px',
				}}
				ref={containerRef}
				onDrop={(e) => {
					e.preventDefault();
					if (highlightedIndex !== null) {
						handleDrop(highlightedIndex);
					}
				}}
				onDragOver={(e) => {
					e.preventDefault();
				}}
			>
				{filteredData.map((metric, index) => {
					return (
						<div
							key={metric.name}
							className="draggable"
							style={{
								flex: '0 0 calc(33.33% - 20px)',
								cursor: 'pointer',
								border: index === highlightedIndex ? '2px solid red' : '2px solid #ccc',
								marginBottom: '20px',
								borderRadius: '10px',
								padding: '10px',
								overflow: 'hidden',
							}}
							draggable
							onDragStart={() => handleDragStart(index)}
							onDragOver={() => handleDragOver(index)}
							onDragEnd={() => handleDragEnd(index)}
							onDoubleClick={() => handleDoubleClickPlot(metric)} 
						>
							<Plot
								data={[
									{
										x: metric.x.map((timestamp) => new Date(timestamp).toLocaleString()),
										y: metric.y,
										type: 'scatter',
										mode: 'lines+markers',
										marker: { color: 'blue' },
									},
								]}
								layout={{
									title: metric.name,
									xaxis: { title: 'Time' },
									yaxis: { title: 'Value' },
								}}
								config={{ displaylogo: false }}
								style={{ width: '100%', height: '100%' }}
							/>
						</div>
					);
				})}
				{selectedMetric !== '' && filteredData.every((metric) => !metric.name.includes(selectedMetric)) && (
					<div style={{ width: '100%', textAlign: 'center', marginTop: '20px' }}>No found metric</div>
				)}
			</div>
			<PlotSettingsModal
				isOpen={plotSettingsModalOpen}
				onRequestClose={handleClosePlotSettingsModal}
				plotData={selectedPlotData}
			/>
		</div>
	);
};

export default VisualisationPage;
