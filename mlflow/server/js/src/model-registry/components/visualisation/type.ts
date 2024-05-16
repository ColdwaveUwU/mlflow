import { PlotData } from 'plotly.js';
import { RunEntity, ModelVersionInfoEntity, RunDatasetWithTags } from 'experiment-tracking/types';

export interface ModelVersionResponse {
    model_versions: ModelVersionInfoEntity[];
}

export interface DataSetInputs {
    inputs: RunDatasetWithTags;
}

export type RunInfoEntityResponse = {
    run: RunEntity & DataSetInputs;
};

export interface DropIndex {
    index: number;
    dropIndex: number;
}

export type ChartData = {
    name: string;
    x: string[];
    y: number[];
    type: Plotly.PlotType;
    mode: PlotData['mode'];
    xaxis: PlotData['xaxis'];
    yaxis: PlotData['yaxis'];
};
export type LayoutSettings = {
    title: Plotly.Layout['title'];
    xaxis: Plotly.Layout['xaxis'];
    yaxis: Plotly.Layout['yaxis'];
    showlegend: Plotly.Layout['showlegend'];
    grid: Plotly.Layout['grid'];
};
export type ChartSetting = { data: ChartData; layout: LayoutSettings };

export type MergedChart = {
    layout: LayoutSettings;
    data: ChartData[];
};

export interface ModelNameProps {
    name: string;
}
