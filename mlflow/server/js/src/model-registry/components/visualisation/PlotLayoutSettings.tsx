import React, { useState, useEffect } from 'react';
import { Input, Switch, Row, Col, Select, Divider } from 'antd';
import { LayoutSettings } from './type';

const { Option } = Select;

interface PlotLayoutSettingsProps {
	layout: LayoutSettings;
	onChange: (layout: LayoutSettings) => void;
}

const PlotLayoutSettings: React.FC<PlotLayoutSettingsProps> = ({ layout, onChange }) => {
	const [title, setTitle] = useState<string>(layout.title?.text || '');
	const [xAxisTitle, setXAxisTitle] = useState<string>(
		typeof layout.xaxis?.title === 'string' ? layout.xaxis?.title : layout.xaxis?.title?.text || '',
	);
	const [yAxisTitle, setYAxisTitle] = useState<string>(
		typeof layout.yaxis?.title === 'string' ? layout.yaxis?.title : layout.yaxis?.title?.text || '',
	);

	const [showLegend, setShowLegend] = useState<boolean>(layout.showlegend || false);
	const [titleFontSize, setTitleFontSize] = useState<number>(layout.title?.font?.size || 14);
	const [titleFontFamily, setTitleFontFamily] = useState<string>(layout.title?.font?.family || 'Arial');

	const [axisFontSize, setAxisFontSize] = useState<number>(layout.xaxis?.title?.font?.size || layout.yaxis?.title?.font?.size || 12);
	const [axisFontFamily, setAxisFontFamily] = useState<string>(layout.xaxis?.title?.font?.family || layout.yaxis?.title?.font?.family || 'Arial');

	useEffect(() => {
		const newTitle = typeof layout.title === 'string' ? layout.title : layout.title?.text || '';
		setTitle(newTitle || '');
	}, [layout.title]);

	useEffect(() => {
		const newTitle = typeof layout.xaxis?.title === 'string' ? layout.xaxis?.title : layout.xaxis?.title?.text || '';
		if (newTitle !== xAxisTitle) {
			setXAxisTitle(newTitle);
		}
	}, [layout.xaxis?.title, xAxisTitle]);

	useEffect(() => {
		const newTitle = typeof layout.yaxis?.title === 'string' ? layout.yaxis?.title : layout.yaxis?.title?.text || '';
		if (newTitle !== yAxisTitle) {
			setYAxisTitle(newTitle);
		}
	}, [layout.yaxis?.title, yAxisTitle]);

	useEffect(() => {
		if (layout.showlegend !== showLegend) {
			setShowLegend(layout.showlegend || false);
		}
	}, [layout.showlegend, showLegend]);

	useEffect(() => {
		if (layout.title?.font?.size !== titleFontSize) {
			setTitleFontSize(layout.title?.font?.size || 14);
		}
		if (layout.title?.font?.family !== titleFontFamily) {
			setTitleFontFamily(layout.title?.font?.family || 'Arial');
		}
	}, [layout.title?.font, titleFontFamily, titleFontSize]);

	useEffect(() => {
		const axisFontSize = layout.xaxis?.title?.font?.size || layout.yaxis?.title?.font?.size || 12;
		if (axisFontSize !== titleFontSize) {
			setAxisFontSize(axisFontSize);
		}
		const axisFontFamily = layout.xaxis?.title?.font?.family || layout.yaxis?.title?.font?.family || 'Arial';
		setAxisFontFamily(axisFontFamily);
	}, [layout.xaxis?.title?.font, layout.yaxis?.title?.font, titleFontSize]);

	const handleTitleChange = (value: string) => {
		setTitle(value);
		onChange({
			...layout,
			title: { ...layout.title, text: value, font: { ...layout.title?.font, size: titleFontSize, family: titleFontFamily } },
		});
	};

	const handleXAxisTitleChange = (value: string) => {
		setXAxisTitle(value);
		onChange({ ...layout, xaxis: { ...layout.xaxis, title: { text: value, font: { size: axisFontSize, family: axisFontFamily } } } });
	};

	const handleYAxisTitleChange = (value: string) => {
		setYAxisTitle(value);
		onChange({ ...layout, yaxis: { ...layout.yaxis, title: { text: value, font: { size: axisFontSize, family: axisFontFamily } } } });
	};

	const handleLegendChange = (checked: boolean) => {
		setShowLegend(checked);
		onChange({ ...layout, showlegend: checked });
	};

	const handleTitleFontSizeChange = (value: number) => {
		setTitleFontSize(value);
		onChange({ ...layout, title: { ...layout.title, font: { ...layout.title?.font, size: value, family: titleFontFamily } } });
	};

	const handleTitleFontFamilyChange = (value: string) => {
		setTitleFontFamily(value);
		onChange({ ...layout, title: { ...layout.title, font: { ...layout.title?.font, size: titleFontSize, family: value } } });
	};

	const handleAxisFontSizeChange = (value: number) => {
		setAxisFontSize(value);
		onChange({
			...layout,
			xaxis: { ...layout.xaxis, title: { ...layout.xaxis?.title, font: { size: value, family: axisFontFamily } } },
			yaxis: { ...layout.yaxis, title: { ...layout.yaxis?.title, font: { size: value, family: axisFontFamily } } },
		});
	};

	const handleAxisFontFamilyChange = (value: string) => {
		setAxisFontFamily(value);
		onChange({
			...layout,
			xaxis: { ...layout.xaxis, title: { ...layout.xaxis?.title, font: { size: axisFontSize, family: value } } },
			yaxis: { ...layout.yaxis, title: { ...layout.yaxis?.title, font: { size: axisFontSize, family: value } } },
		});
	};

	return (
		<div>
			<Divider orientation="left">Font Settings</Divider>
			<Row gutter={[16, 16]}>
				<Col span={12}>
					<div>
						<label>Title Font Family:</label>
						<Select
							value={titleFontFamily}
							onChange={handleTitleFontFamilyChange}
							style={{ width: '100%' }}
							dropdownClassName="font-select-dropdown"
						>
							<Option value="Arial">Arial</Option>
							<Option value="Helvetica">Helvetica</Option>
							<Option value="Times New Roman">Times New Roman</Option>
							<Option value="Courier New">Courier New</Option>
							<Option value="Verdana">Verdana</Option>
						</Select>
					</div>
				</Col>
				<Col span={12}>
					<div>
						<label>Axis Font Family:</label>
						<Select
							value={axisFontFamily}
							onChange={handleAxisFontFamilyChange}
							style={{ width: '100%' }}
							dropdownClassName="font-select-dropdown"
						>
							<Option value="Arial">Arial</Option>
							<Option value="Helvetica">Helvetica</Option>
							<Option value="Times New Roman">Times New Roman</Option>
							<Option value="Courier New">Courier New</Option>
							<Option value="Verdana">Verdana</Option>
						</Select>
					</div>
				</Col>
			</Row>
			<Divider orientation="left">Title Settings</Divider>
			<Row gutter={[16, 16]}>
				<Col span={12}>
					<div>
						<label>Title:</label>
						<Input value={title} onChange={(e) => handleTitleChange(e.target.value)} />
					</div>
				</Col>
				<Col span={12}>
					<div>
						<label>Title Font Size:</label>
						<Input
							type="number"
							value={titleFontSize}
							onChange={(e) => handleTitleFontSizeChange(Number(e.target.value))}
						/>
					</div>
				</Col>
			</Row>
			<Divider orientation="left">Axis Settings</Divider>
			<Row gutter={[16, 16]}>
				<Col span={12}>
					<div>
						<label>X-Axis Title:</label>
						<Input value={xAxisTitle} onChange={(e) => handleXAxisTitleChange(e.target.value)} />
					</div>
				</Col>
				<Col span={12}>
					<div>
						<label>Y-Axis Title:</label>
						<Input value={yAxisTitle} onChange={(e) => handleYAxisTitleChange(e.target.value)} />
					</div>
				</Col>
				<Col span={12}>
					<div>
						<label>Axis Font Size:</label>
						<Input
							type="number"
							value={axisFontSize}
							onChange={(e) => handleAxisFontSizeChange(Number(e.target.value))}
						/>
					</div>
				</Col>
			</Row>
			<Divider orientation="left">Other Settings</Divider>
			<Row gutter={[16, 16]}>
				<Col span={12}>
					<div>
						<label>Show Legend:</label>
						<Switch checked={showLegend} onChange={handleLegendChange} />
					</div>
				</Col>
			</Row>
		</div>
	);


};

export default PlotLayoutSettings;
