import React, { useEffect, useState, useRef, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { HTTPMethods, fetchEndpoint } from 'common/utils/FetchUtils';
import { RunEntity, ModelVersionInfoEntity, RunDatasetWithTags } from 'experiment-tracking/types';
import { Input, Button, Spinner, TabPane, Tabs } from '@databricks/design-system';
import { Row, Col } from 'antd';
import { FormattedMessage } from 'react-intl';
import { Spacer } from '../../../../src/shared/building_blocks/Spacer';
import PlotSettingsModal from './PlotSettingsModal';
import MergeGraphsModal from './MergeGraphsModal';
import { PlotData } from 'plotly.js';

interface ModelVersionResponse {
	model_versions: ModelVersionInfoEntity[];
}

interface DataSetInputs {
	inputs: RunDatasetWithTags;
}

type RunInfoEntityResponse = {
	run: RunEntity & DataSetInputs;
};

interface DropIndex {
	index: number;
	dropIndex: number;
}

type ChartData = {
	name: string;
	x: string[];
	y: number[];
	type: Plotly.PlotType;
	mode: PlotData['mode'];
	xaxis: PlotData['xaxis'];
	yaxis: PlotData['yaxis'];
};
type LayoutSettings = { title: Plotly.Layout['title']; xaxis: Plotly.Layout['xaxis']; yaxis: Plotly.Layout['yaxis'] };
type ChartSetting = { data: ChartData; layout: LayoutSettings };

type MergedChart = {
	layout: LayoutSettings;
	data: ChartData[];
};

interface ModelNameProps {
	name: string;
}

const VisualisationPage: React.FC<ModelNameProps> = ({ name }) => {
	const [data, setData] = useState<ChartSetting[]>([]);
	const [filteredData, setFilteredData] = useState<ChartSetting[]>([]);
	const [selectedMetric, setSelectedMetric] = useState<string>('');
	const [inputValue, setInputValue] = useState<string>('');
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
	const [plotSettingsModalOpen, setPlotSettingsModalOpen] = useState<boolean>(false);
	const [selectedPlotData, setSelectedPlotData] = useState<ChartSetting | null>(null);
	const [searchNotFound, setSearchNotFound] = useState<boolean>(false);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [fetchingData, setFetchingData] = useState<boolean>(false);

	const [metricsType, setMetricsType] = useState<string>('offline');

	const [mergeModalVisible, setMergeModalVisible] = useState<boolean>(false);
	const [mergeMetricsGraph, setMergeMetricsGraph] = useState<boolean>(false);

	const [traceSettings, setTraceSettings] = useState<{ type: Plotly.PlotType; mode: PlotData['mode'] }>({
		type: 'scatter',
		mode: 'lines+markers',
	});
	const [layoutSettings, setLayout] = useState<LayoutSettings>({
		title: 'noname',
		xaxis: { title: 'Time' },
		yaxis: { title: 'Value' },
	});

	const [dropIndex, setDropIndex] = useState<DropIndex>({
		index: 0,
		dropIndex: 0,
	});

	const containerRef = useRef<HTMLDivElement>(null);

	const fetchData = useCallback(async () => {
		setRefreshing(true);
		const metricData: ChartSetting[] = [];
		if (metricsType === 'offline') {
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
			runInfoArr.forEach((runInfo) => {
				runInfo.run.data.metrics.forEach((metric) => {
					const metricIndex = metricData.findIndex((item) => item.layout.title === metric.key);
					if (metricIndex !== -1) {
						metricData[metricIndex].data.x.push(new Date(metric.timestamp).toISOString());
						metricData[metricIndex].data.y.push(metric.value);
					} else {
						metricData.push({
							data: {
								name: metric.key,
								x: [new Date(metric.timestamp).toISOString()],
								y: [metric.value],
								type: 'scatter',
								mode: 'lines+markers',
								xaxis: 'x1',
								yaxis: 'y1',
							},
							layout: {
								title: metric.key.toString(),
								xaxis: { title: 'Time' },
								yaxis: { title: 'Time' },
							},
						});
					}
				});
			});
		} else {
			setFetchingData(true);
		}
		setData(metricData);
		setFilteredData(metricData);
		setRefreshing(false);
		setFetchingData(false);
	}, [metricsType, name]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		setFilteredData(data.filter((metric) => metric.layout.title.toString().includes(inputValue)));
	}, [data, inputValue]);

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setInputValue(value);
		setSelectedMetric(value);
		setSearchNotFound(false);
	};

	useEffect(() => {
		const foundMetric = data.find((metric) => metric.layout.title.toString().includes(inputValue));
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
			setData(newData);
			setDraggedIndex(index);
		}
		setDraggedIndex(null);
		setHighlightedIndex(null);
	};

	const handleDrop = (index: number) => {
		if (draggedIndex !== null && draggedIndex !== index) {
			const newData = [...filteredData];
			setMergeModalVisible(true);
			[newData[draggedIndex], newData[index]] = [newData[index], newData[draggedIndex]];
			const dropInfo = { index: index, dropIndex: draggedIndex };
			setDropIndex(dropInfo);
			setFilteredData(newData);
			setData(newData);
			setDraggedIndex(null);
			setHighlightedIndex(null);
		}
	};

	const handleMergeConfirm = () => {
		setMergeMetricsGraph(true);
		setMergeModalVisible(false);
	};

	const handleMergeCancel = () => {
		setMergeMetricsGraph(false);
		setMergeModalVisible(false);
	};

	const handleDoubleClickPlot = (plotData: ChartSetting) => {
		setSelectedPlotData(plotData);
		setPlotSettingsModalOpen(true);
	};

	const handleClosePlotSettingsModal = () => {
		setPlotSettingsModalOpen(false);
	};

	useEffect(() => {
		if (mergeMetricsGraph && Object.keys(dropIndex).length !== 0) {
			const newLayout = filteredData[dropIndex.dropIndex].layout;
			newLayout.title = `${newLayout.title}-${filteredData[dropIndex.index].layout.title}`;
			const mergedGraph: MergedChart = {
				data: [
					...(Array.isArray(filteredData[dropIndex.dropIndex].data)
						? filteredData[dropIndex.dropIndex].data.map((dataItem: ChartData) => ({
							name: dataItem.name,
							x: [...dataItem.x],
							y: [...dataItem.y],
							type: traceSettings.type,
							mode: traceSettings.mode,
							xaxis: '',
							yaxis: '',
						}))
						: [
							{
								name: filteredData[dropIndex.dropIndex].data.name,
								x: [...filteredData[dropIndex.dropIndex].data.x],
								y: [...filteredData[dropIndex.dropIndex].data.y],
								type: traceSettings.type,
								mode: traceSettings.mode,
								xaxis: '',
								yaxis: '',
							},
						]),
					...(Array.isArray(filteredData[dropIndex.index].data)
						? filteredData[dropIndex.index].data.map((dataItem: ChartData) => ({
							name: dataItem.name,
							x: [...dataItem.x],
							y: [...dataItem.y],
							type: traceSettings.type,
							mode: traceSettings.mode,
							xaxis: '',
							yaxis: '',
						}))
						: [
							{
								name: filteredData[dropIndex.index].data.name,
								x: [...filteredData[dropIndex.index].data.x],
								y: [...filteredData[dropIndex.index].data.y],
								type: traceSettings.type,
								mode: traceSettings.mode,
								xaxis: '',
								yaxis: '',
							},
						]),
				],
				layout: newLayout,
			};

			const newData = filteredData.filter((_, index) => index !== dropIndex.dropIndex && index !== dropIndex.index);
			newData.splice(dropIndex.dropIndex, 0, mergedGraph);
			setData(newData);
			setMergeMetricsGraph(false);
		}
	}, [mergeMetricsGraph, filteredData, dropIndex, traceSettings.type, traceSettings.mode]);

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
					<Button data-test-id="search-button" componentId={''} onClick={fetchData}>
						{refreshing || fetchingData ? (
							<Spinner />
						) : (
							<FormattedMessage
								defaultMessage="Refresh"
								description="String for the search button to search objects in MLflow"
							/>
						)}
					</Button>
				</Spacer>
				<Tabs activeKey={metricsType} onChange={(key) => setMetricsType(key)}>
					<TabPane tab="Offline Metrics" key="offline" />
					<TabPane tab="Other Metrics" key="other" />
				</Tabs>
			</div>
			{searchNotFound && !fetchingData && (
				<div style={{ color: 'red', marginBottom: '12px' }}>Metric not found. Please enter a valid metric name.</div>
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
							key={metric.layout.title.toString()}
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
									data={Array.isArray(metric.data) ? metric.data : [metric.data]}
									layout={{
										...metric.layout,
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
				layout={layoutSettings[selectedPlotData?.name ?? ''] || {}}
				onChangeLayout={(newLayout) =>
					setLayout((prevLayout) => ({
						...prevLayout,
						[selectedPlotData?.name ?? '']: newLayout,
					}))
				}
			/>
			<MergeGraphsModal
				visible={mergeModalVisible}
				onConfirm={handleMergeConfirm}
				onCancel={handleMergeCancel}
				setMergeMetricsGraph={setMergeMetricsGraph}
			/>
		</div>
	);
};

export default VisualisationPage;
