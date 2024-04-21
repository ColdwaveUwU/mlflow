import { HTTPMethods, fetchEndpoint } from 'common/utils/FetchUtils';
import { RunEntity, ModelVersionInfoEntity, RunDatasetWithTags } from 'experiment-tracking/types';
import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

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

	useEffect(() => {
		const apiUrlModelVersions = 'ajax-api/2.0/mlflow/model-versions/search';
		fetchEndpoint({ relativeUrl: apiUrlModelVersions, method: HTTPMethods.GET }).then((value: unknown) => {
			const response = value as ModelVersionResponse;
			const filteredData = response.model_versions
				.filter((modelVersion: ModelVersionInfoEntity) => modelVersion.name === name)
				.map((modelVersion: ModelVersionInfoEntity) => ({
					run_id: modelVersion.run_id,
					creation_timestamp: modelVersion.creation_timestamp
				}));
			const apiUrlRunId = 'ajax-api/2.0/mlflow/runs/get';

			const fetchPromises = filteredData.map(async filterData => {
				const queryParams = new URLSearchParams({
					run_id: filterData.run_id,
				});

				const url = `${apiUrlRunId}?${queryParams}`;

				const response = await fetchEndpoint({ relativeUrl: url, method: HTTPMethods.GET });
				return response as RunEntity;
			});

			const runs = Promise.all(fetchPromises).then((response) => {
				return response
			}).catch(error => {
				console.error('Request execution error', error);
			});

			runs.then((response: unknown) => {
				const runInfoArr = response as RunInfoEntityResponse[];
				const metricData: { name: string; x: string[]; y: number[] }[] = [];
				runInfoArr.forEach(runInfo => {
					runInfo.run.data.metrics.forEach(metric => {
						const metricIndex = metricData.findIndex(item => item.name === metric.key);
						if (metricIndex !== -1) {
							metricData[metricIndex].x.push(new Date(metric.timestamp).toISOString());
							metricData[metricIndex].y.push(metric.value);
						} else {
							metricData.push({
								name: metric.key,
								x: [new Date(metric.timestamp).toISOString()],
								y: [metric.value]
							});
						}
					});
				});
				setData(metricData);
			})
		});
	}, [name]);

	return (
		<div>
			{data.map(metric => (
				<div key={metric.name}>
					<h2>{metric.name}</h2>
					<Plot
						data={[
							{
								x: metric.x.map(timestamp => new Date(timestamp).toLocaleString()),
								y: metric.y,
								type: 'scatter',
								mode: 'lines+markers',
								marker: { color: 'blue' },
							}
						]}
						layout={{
							width: 800,
							height: 400,
							title: metric.name,
							xaxis: { title: 'Time' },
							yaxis: { title: 'Value' },
						}}
					/>
				</div>
			))}
		</div>
	);
};

export default VisualisationPage;


