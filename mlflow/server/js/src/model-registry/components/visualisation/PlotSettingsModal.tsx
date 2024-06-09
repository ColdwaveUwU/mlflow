import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Button, Modal, Drawer, Tabs } from 'antd';
import PlotLayoutSettings from './PlotLayoutSettings';
import PlotDataSettings from './PlotDataSettings';
import { LayoutSettings, ChartSetting, ChartData } from './type';

const { TabPane } = Tabs;

interface PlotSettingsModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  plot: ChartSetting | null;
  onChangePlot: (layout: LayoutSettings, data: ChartData[] | ChartData) => void;
}

const PlotSettingsModal: React.FC<PlotSettingsModalProps> = ({
  isOpen,
  onRequestClose,
  plot,
  onChangePlot,
}) => {
  const [localLayout, setLocalLayout] = useState<LayoutSettings | null>(null);
  const [localData, setLocalData] = useState<ChartData[] | ChartData | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedDataIndex, setSelectedDataIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && plot) {
      setLocalLayout(plot.layout);
      setLocalData(plot.data);
    } else {
      setLocalLayout(null); 
      setLocalData(null); 
      setSelectedDataIndex(null); 
    }
  }, [isOpen, plot]);

  const handleApplyChanges = () => {
    if (plot && localLayout && localData) {
      onChangePlot(localLayout, localData);
    }
    onRequestClose();
  };

  const handleLayoutChange = (updatedLayout: LayoutSettings) => {
    setLocalLayout(updatedLayout);
  };

  const handleDataChange = (updatedData: ChartData[] | ChartData) => {
    setLocalData(updatedData);
  };

  const handleOpenDrawer = () => {
    setIsDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
  };

  return (
    <Modal
      centered
      title="Plot Settings"
      visible={isOpen}
      onCancel={onRequestClose}
      onOk={handleApplyChanges}
      footer={[
        <Button key="apply" type="primary" onClick={handleApplyChanges}>
          Apply Changes
        </Button>,
        <Button key="cancel" onClick={onRequestClose}>
          Cancel
        </Button>,
      ]}
      width="60%"
    >
      {plot && localLayout && localData && (
        <>
          <Plot
            data={Array.isArray(localData) ? localData : [localData]}
            layout={localLayout}
            config={{ displaylogo: false }}
            style={{ width: '100%', height: '400px' }}
          />
          <Button type="primary" onClick={handleOpenDrawer} style={{ margin: '16px 0' }}>
            Open Settings
          </Button>
          <Drawer
            title="Plot Settings"
            placement="left"
            closable
            onClose={handleCloseDrawer}
            visible={isDrawerVisible}
            width="30%"
            bodyStyle={{ padding: '16px' }}
          >
            <Tabs>
              <TabPane tab="Layout" key="layout">
                <PlotLayoutSettings layout={localLayout} onChange={handleLayoutChange} />
              </TabPane>
              <TabPane tab="Data" key="data">
                <PlotDataSettings
                  data={localData}
                  onChangeData={handleDataChange}
                  selectedDataIndex={selectedDataIndex}
                  setSelectedDataIndex={setSelectedDataIndex}
                />
              </TabPane>
            </Tabs>
          </Drawer>
        </>
      )}
    </Modal>
  );
};

export default PlotSettingsModal;