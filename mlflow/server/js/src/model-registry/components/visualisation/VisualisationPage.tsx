import React, { useEffect, useState, useRef, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { HTTPMethods, fetchEndpoint } from 'common/utils/FetchUtils';
import { RunEntity, ModelVersionInfoEntity, RunDatasetWithTags } from 'experiment-tracking/types';
import { Input, Button, Spinner } from '@databricks/design-system';
import { Row, Col } from 'antd';
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
	const [layout, setLayout] = useState<{ [key: string]: any }>({ xaxis: { title: 'Time' }, yaxis: { title: 'Value' } });
	const [data, setData] = useState<{ name: string; x: string[]; y: number[] }[]>([]);
	const [filteredData, setFilteredData] = useState<{ name: string; x: string[]; y: number[] }[]>([]);
	const [selectedMetric, setSelectedMetric] = useState<string>('');
	const [inputValue, setInputValue] = useState<string>('');
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
	const [plotSettingsModalOpen, setPlotSettingsModalOpen] = useState<boolean>(false);
	const [selectedPlotData, setSelectedPlotData] = useState<{ name: string; x: string[]; y: number[] } | null>(null);
	const [searchNotFound, setSearchNotFound] = useState<boolean>(false);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [fetchingData, setFetchingData] = useState<boolean>(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const fetchData = useCallback(async () => {
		setRefreshing(true);
		setFetchingData(true);
		const apiUrlModelVersions = 'ajax-api/2.0/mlflow/model-versions/search';
		const value = await fetchEndpoint({ relativeUrl: apiUrlModelVersions, method: HTTPMethods.GET });
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

		const runs = await Promise.all(fetchPromises).catch((error) => {
			console.error('Request execution error', error);
			return [];
		});

		const runInfoArr = runs as RunInfoEntityResponse[];
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
		setRefreshing(false);
		setFetchingData(false);
	}, [name]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		setFilteredData(data.filter((metric) => metric.name.includes(inputValue)));
	}, [data, inputValue]);

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setInputValue(value);
		setSelectedMetric(value);
		setSearchNotFound(false);
	};

	useEffect(() => {
		const foundMetric = data.find((metric) => metric.name.includes(inputValue));
		setSearchNotFound(!foundMetric);
	}, [data, inputValue]);

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
			setData(newData)
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
			setData(newData)
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
					<Button
						data-test-id="search-button"
						componentId={''}
						onClick={fetchData}
					>
						{refreshing || fetchingData ? <Spinner /> : (
							<FormattedMessage
								defaultMessage="Refresh"
								description="String for the search button to search objects in MLflow"
							/>
						)}
					</Button>
				</Spacer>
			</div>
			{searchNotFound && !fetchingData && (
				<div style={{ color: 'red', marginBottom: '12px' }}>
					Metric not found. Please enter a valid metric name.
				</div>
			)}
			{fetchingData && (
				<div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
					<Spinner />
				</div>
			)}
			{!fetchingData && (
				<Row
					gutter={[20, 20]}
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
					style={{
						opacity: fetchingData ? 0 : 1,
						transition: 'opacity 0.5s ease-in-out',
					}}
				>
					{filteredData.map((metric, index) => (
						<Col
							key={metric.name}
							span={8}
							style={{
								transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
								transform: index === highlightedIndex ? 'scale(1.05)' : 'none',
								opacity: fetchingData ? 0 : 1,
							}}
						>
							<div
								style={{
									cursor: 'pointer',
									borderRadius: '10px',
									overflow: 'hidden',
									border: '2px solid #ccc',
									transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
									boxShadow: index === draggedIndex ? '0px 0px 10px 0px rgba(0, 0, 0, 0.5)' : 'none',
									transform: index === draggedIndex ? 'scale(1.05)' : 'none',
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
											x: metric.x.map((timestamp) => new Date(timestamp).toLocaleDateString()),
											y: metric.y,
											type: 'scatter',
											mode: 'lines+markers',
											marker: { color: 'blue' },
											name: metric.name
										},
									]}
									layout={{
										title: metric.name,
										...layout[metric.name],
									}}
									config={{ displaylogo: false }}
									style={{ width: '100%', height: '100%' }}
								/>
							</div>
						</Col>
					))}
				</Row>


			)}
			<PlotSettingsModal
				isOpen={plotSettingsModalOpen}
				onRequestClose={handleClosePlotSettingsModal}
				plotData={selectedPlotData}
				layout={layout[selectedPlotData?.name ?? ''] || {}}
				onChangeLayout={(newLayout) =>
					setLayout((prevLayout) => ({
						...prevLayout,
						[selectedPlotData?.name ?? '']: newLayout,
					}))
				}
			/>
		</div>
	);
};

export default VisualisationPage;
