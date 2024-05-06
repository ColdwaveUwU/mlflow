import React, { useState } from 'react';
import { Switch, Row, Col } from 'antd';

interface PlotLayoutSettingsProps {
    layout: { [key: string]: any };
    onChange: (layout: { [key: string]: any }) => void;
}

const PlotLayoutSettings: React.FC<PlotLayoutSettingsProps> = ({ layout, onChange }) => {
    const [showLegend, setShowLegend] = useState<boolean>(layout['showlegend'] || false);

    const handleLegendChange = (checked: boolean) => {
        setShowLegend(checked);
        onChange({ ...layout, showlegend: checked });
    };

    return (
        <Row gutter={[16, 16]}>
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
