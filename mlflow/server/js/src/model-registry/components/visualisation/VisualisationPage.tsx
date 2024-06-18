import React, { useEffect, useState, useRef, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { HTTPMethods, fetchEndpoint } from 'common/utils/FetchUtils';
import { RunEntity, ModelVersionInfoEntity, RunDatasetWithTags } from 'experiment-tracking/types';
import { Input, Button, Spinner, TabPane, Tabs } from '@databricks/design-system';
import { Row, Col } from 'antd';
import { FormattedMessage } from 'react-intl';
import { Spacer } from '../../../../src/shared/building_blocks/Spacer';
import PlotSettingsModal from './PlotSettingsModal';
import MergeChartsModal from './MergeChartsModal';
import { PlotData } from 'plotly.js';
import {
  ModelVersionResponse,
  RunInfoEntityResponse,
  DropIndex,
  ChartData,
  LayoutSettings,
  ChartSetting,
  MergedChart,
  ModelNameProps,
} from './type';
import MergeErrorChartModal from './MergeErrorChartModal';
import EmptyInputForm from './EmptyInputForm';

const VisualisationPage: React.FC<ModelNameProps> = ({ name }) => {
  const [data, setData] = useState<ChartSetting[]>([]);
  const [filteredData, setFilteredData] = useState<ChartSetting[]>([]);
  const [_, setSelectedMetric] = useState<string>('');
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
  const [mergeMetricsChart, setMergeMetricsChart] = useState<boolean>(false);
  const [errorMerge, setErrorMerge] = useState<boolean>(false);
  const [errorInput, setErrorInput] = useState<boolean>(false);
  const [traceSettings, setTraceSettings] = useState<{ type: Plotly.PlotType; mode: PlotData['mode'] }>({
    type: 'scatter',
    mode: 'lines+markers',
  });
  const [dropIndex, setDropIndex] = useState<DropIndex>({
    index: 0,
    dropIndex: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState<string>('');

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
          version: modelVersion.version,
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
      runInfoArr.forEach((runInfo, index) => {
        runInfo.run.data.metrics.forEach((metric) => {
          const metricIndex = metricData.findIndex((item) => item.layout.title === metric.key);
          if (metricIndex !== -1) {
            metricData[metricIndex].data[0].x.push(filteredData[index].version);
            metricData[metricIndex].data[0].y.push(metric.value);
          } else {
            metricData.push({
              data: [
                {
                  name: metric.key,
                  x: [filteredData[index].version],
                  y: [metric.value],
                  type: 'scatter',
                  mode: 'lines+markers',
                  xaxis: 'x1',
                  yaxis: 'y1',
                  fill: 'none',
                },
              ],
              layout: {
                title: metric.key.toString(),
                xaxis: { title: 'Version' },
                yaxis: { title: 'Value' },
                showlegend: true,
                grid: {},
              },
            });
          }
        });
      });
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
      if (
        filteredData[draggedIndex].layout.xaxis.title.text === filteredData[index].layout.xaxis.title.text ||
        filteredData[draggedIndex].layout.yaxis.title.text === filteredData[index].layout.yaxis.title.text
      ) {
        const newData = [...filteredData];
        setMergeModalVisible(true);
        [newData[draggedIndex], newData[index]] = [newData[index], newData[draggedIndex]];
        const dropInfo = { index: index, dropIndex: draggedIndex };
        setDropIndex(dropInfo);
        setFilteredData(newData);
        setData(newData);
      } else {
        setErrorMerge(true);
      }
      setDraggedIndex(null);
      setHighlightedIndex(null);
    }
  };

  const handleMergeConfirm = () => {
    setMergeMetricsChart(true);
    setMergeModalVisible(false);
  };

  const handleMergeErrorConfirm = () => {
    setErrorMerge(false);
  };

  const handleEmptyInputConfirm = () => {
    setErrorInput(false)
  }

  const handleMergeCancel = () => {
    setMergeMetricsChart(false);
    setErrorMerge(false);
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
    if (mergeMetricsChart && Object.keys(dropIndex).length !== 0) {
      const { dropIndex: dropIndexValue, index: dropIndexToMerge } = dropIndex;
      const { layout: layoutToMerge, data: dataToMerge } = filteredData[dropIndexValue];
      const { layout: layoutToDrop, data: dataToDrop } = filteredData[dropIndexToMerge];

      const mergedLayoutTitle = `${typeof layoutToMerge.title === 'object' ? layoutToMerge.title.text : layoutToMerge.title
        }-${typeof layoutToDrop.title === 'object' ? layoutToDrop.title.text : layoutToDrop.title}`;

      const mergedData = [
        ...(Array.isArray(dataToMerge)
          ? dataToMerge.map(({ name, x, y }) => ({
            name,
            x: [...x],
            y: [...y],
            type: traceSettings.type,
            mode: traceSettings.mode,
            xaxis: '',
            yaxis: '',
          }))
          : [
            {
              name: dataToMerge.name,
              x: [...dataToMerge.x],
              y: [...dataToMerge.y],
              type: traceSettings.type,
              mode: traceSettings.mode,
              xaxis: '',
              yaxis: '',
            },
          ]),
        ...(Array.isArray(dataToDrop)
          ? dataToDrop.map(({ name, x, y }) => ({
            name,
            x: [...x],
            y: [...y],
            type: traceSettings.type,
            mode: traceSettings.mode,
            xaxis: '',
            yaxis: '',
          }))
          : [
            {
              name: dataToDrop.name,
              x: [...dataToDrop.x],
              y: [...dataToDrop.y],
              type: traceSettings.type,
              mode: traceSettings.mode,
              xaxis: '',
              yaxis: '',
            },
          ]),
      ];

      const mergedChart = { data: mergedData, layout: { ...layoutToMerge, title: mergedLayoutTitle } };

      const newData = filteredData.filter((_, index) => index !== dropIndexValue && index !== dropIndexToMerge);
      newData.splice(dropIndexValue, 0, mergedChart);

      setData(newData);
      setMergeMetricsChart(false);
    }
  }, [mergeMetricsChart, filteredData, dropIndex, traceSettings]);

  const onChangePlot = (
    updatedLayout: LayoutSettings | undefined,
    updatedData: ChartData | ChartData[] | undefined,
  ) => {
    const newChart = {
      data: updatedData,
      layout: updatedLayout,
    };
    if (updatedLayout && updatedData) {
      const updatedData = data.map((plot) => {
        if (plot && plot.layout.title === selectedPlotData?.layout.title) {
          plot = newChart;
          return plot;
        }
        return plot;
      });
      setData(updatedData);
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const loadMetricsFromLocalStorage = (): ChartSetting[] => {
    const storedMetrics = localStorage.getItem('customMetrics');
    return storedMetrics ? JSON.parse(storedMetrics) : [];
  };

  useEffect(() => {
    if (metricsType === 'other') {
      const storedMetrics = loadMetricsFromLocalStorage();
      setData((prevData) => [...prevData, ...storedMetrics]);
      setFilteredData((prevData) => [...prevData, ...storedMetrics]);
    }
  }, [metricsType]);

  const handleUrlSubmit = async () => {
    if (/^(ftp|http|https):\/\/[^ "]+$/.test(url)) {
      setFetchingData(true);
      const apiUrl = `ajax-api/2.0/mlflow/custom-metrics/get-from-url?url=${url}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      const groupedMetrics = {};

      data.custom_metrics.forEach((item) => {
        if (!groupedMetrics[item.name]) {
          groupedMetrics[item.name] = { version: [], value: [] };
        }
        groupedMetrics[item.name].version.push(item.version);
        groupedMetrics[item.name].value.push(item.value);
      });

      const newCharts = Object.keys(groupedMetrics).map((name) => ({
        data: [
          {
            name: name,
            x: groupedMetrics[name].version,
            y: groupedMetrics[name].value,
            type: 'scatter',
            mode: 'lines+markers',
            xaxis: 'x1',
            yaxis: 'y1',
            fill: 'none',
          },
        ],
        layout: {
          title: name.toString(),
          xaxis: { title: 'Version' },
          yaxis: { title: 'Value' },
          showlegend: true,
          grid: {},
        },
      }));

      const storedMetrics = JSON.parse(localStorage.getItem('customMetrics')) || [];
      const mergedMetrics = [...storedMetrics];
      newCharts.forEach((newChart) => {
        const existingChart = mergedMetrics.find((chart) => chart.layout.title === newChart.layout.title);
        if (existingChart) {
          existingChart.data[0].x.push(...newChart.data[0].x);
          existingChart.data[0].y.push(...newChart.data[0].y);
        } else {
          mergedMetrics.push(newChart);
        }
      });
      localStorage.setItem('customMetrics', JSON.stringify(mergedMetrics));

      setData(mergedMetrics);
      setFilteredData(mergedMetrics);
      setFetchingData(false);
    } else {
      setErrorInput(true);
    }
  };
  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const convertToCSV = (data: ChartSetting['data']): string => {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = ['Name', 'X', 'Y'];
    const rows = data.flatMap((trace) =>
      trace.x.map((xVal, index) => `${trace.name},${xVal},${trace.y[index]}`)
    );

    return [headers.join(','), ...rows].join('\n');
  };

  const resetMetrics = () => {
    localStorage.removeItem('customMetrics');
    setData([]);
    setFilteredData([]);
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
          <TabPane tab="Other Metrics" key="other">
            <Spacer direction="horizontal" size="small">
              <Input type="text" value={url} onChange={handleUrlChange} placeholder="Enter microservice URL" />
              <Button onClick={handleUrlSubmit} componentId={''}>
                {fetchingData ? (
                  <Spinner />
                ) : (
                  <FormattedMessage defaultMessage="Submit URL" description=""></FormattedMessage>
                )}
              </Button>
              <Button onClick={resetMetrics} componentId={''} style={{ marginLeft: '10px' }}>
                Reset Metrics
              </Button>
            </Spacer>
          </TabPane>
        </Tabs>
      </div>
      {searchNotFound && !fetchingData && <div style={{ color: 'red', marginBottom: '12px' }}>Metric not found.</div>}
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
                  config={{ displaylogo: false, responsive: true }}
                  style={{ width: '100%', height: '100%' }}
                />
                <Button
                  onClick={() => {
                    const csvContent = convertToCSV(metric.data);
                    const filename = `${metric.layout.title}.csv`;
                    downloadCSV(filename, csvContent);
                  }}
                  componentId={''}
                  style={{ marginTop: '10px' }}
                >
                  Download CSV
                </Button>
              </div>
            </Col>
          ))}

        </Row>
      )}
      <PlotSettingsModal
        isOpen={plotSettingsModalOpen}
        onRequestClose={handleClosePlotSettingsModal}
        plot={selectedPlotData}
        onChangePlot={onChangePlot}
      />

      <MergeChartsModal
        visible={mergeModalVisible}
        onConfirm={handleMergeConfirm}
        onCancel={handleMergeCancel}
        setMergeMetricsChart={setMergeMetricsChart}
      />

      <MergeErrorChartModal visible={errorMerge} onConfirm={handleMergeErrorConfirm} />
      <EmptyInputForm visible={errorInput} onConfirm={handleEmptyInputConfirm}></EmptyInputForm>
    </div>
  );
};

export default VisualisationPage;
