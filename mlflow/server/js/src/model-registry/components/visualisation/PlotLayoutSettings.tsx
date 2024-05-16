import React, { useState, useEffect } from 'react';
import { Input, Switch, Row, Col } from 'antd';
import { LayoutSettings } from './type';

interface PlotLayoutSettingsProps {
  layout: LayoutSettings;
  onChange: (layout: LayoutSettings) => void;
}

const PlotLayoutSettings: React.FC<PlotLayoutSettingsProps> = ({ layout, onChange }) => {
  const [title, setTitle] = useState<string>(layout.title.toString() || '');
  const [xAxisTitle, setXAxisTitle] = useState<string>(
    typeof layout.xaxis?.title === 'string' ? layout.xaxis?.title.text : '',
  );
  const [yAxisTitle, setYAxisTitle] = useState<string>(
    typeof layout.yaxis?.title === 'string' ? layout.yaxis?.title.text : '',
  );

  const [showLegend, setShowLegend] = useState<boolean>(layout.showlegend || false);

  useEffect(() => {
    setTitle(layout.title.toString() || '');
  }, [layout.title]);

  useEffect(() => {
    setXAxisTitle(layout.xaxis?.title?.text || '');
  }, [layout.xaxis?.title?.text]);

  useEffect(() => {
    setYAxisTitle(layout.yaxis?.title?.text || '');
  }, [layout.yaxis?.title?.text]);

  useEffect(() => {
    setShowLegend(layout.showlegend || false);
  }, [layout.showlegend]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    onChange({ ...layout, title: value });
  };

  const handleXAxisTitleChange = (value: string) => {
    setXAxisTitle(value);
    onChange({ ...layout, xaxis: { ...layout.xaxis, title: value } });
  };

  const handleYAxisTitleChange = (value: string) => {
    setYAxisTitle(value);
    onChange({ ...layout, yaxis: { ...layout.yaxis, title: value } });
  };

  const handleLegendChange = (checked: boolean) => {
    setShowLegend(checked);
    onChange({ ...layout, showlegend: checked });
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <div>
          <label>Title:</label>
          <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} />
        </div>
      </Col>
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
          <label>Show Legend:</label>
          <Switch checked={showLegend} onChange={handleLegendChange} />
        </div>
      </Col>
    </Row>
  );
};

export default PlotLayoutSettings;
