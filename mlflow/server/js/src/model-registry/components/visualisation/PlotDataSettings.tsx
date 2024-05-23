import React, { useState } from 'react';
import { Form, Input, Select } from 'antd';
import { ChartData } from './type';

interface PlotDataSettingsProps {
  data: ChartData[];
  onChangeData: (updatedData: ChartData[]) => void;
  selectedDataIndex: number | null;
  setSelectedDataIndex: (index: number | null) => void;
}

const PlotDataSettings: React.FC<PlotDataSettingsProps> = ({
  data,
  onChangeData,
  selectedDataIndex,
  setSelectedDataIndex,
}) => {
  const [formData, setFormData] = useState<ChartData[]>(data);

  const handleDataSelect = (value: string) => {
    const index = data.findIndex((item) => item.name === value);
    if (index !== -1) {
      setSelectedDataIndex(index);
    } else {
      setSelectedDataIndex(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const newData = [...prevData];
      if (selectedDataIndex !== null) {
        newData[selectedDataIndex] = { ...newData[selectedDataIndex], [name]: value };
      }
      onChangeData(newData);
      return newData;
    });
  };

  const handleFillChange = (value: string) => {
    setFormData((prevData) => {
      const newData = [...prevData];
      if (selectedDataIndex !== null) {
        newData[selectedDataIndex] = { ...newData[selectedDataIndex], fill: value };
      }
      onChangeData(newData);
      return newData;
    });
  };

  return (
    <Form layout="vertical">
      <Form.Item label="Select Data">
        <Select
          value={selectedDataIndex !== null ? data[selectedDataIndex].name : undefined}
          onChange={handleDataSelect}
          style={{ width: '100%' }}
        >
          {data.map((item, index) => (
            <Select.Option key={index} value={item.name}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      {selectedDataIndex !== null && (
        <>
          <Form.Item label="Name">
            <Input
              name="name"
              value={formData[selectedDataIndex].name}
              onChange={handleInputChange}
            />
          </Form.Item>
          <Form.Item label="Fill">
            <Select
              value={formData[selectedDataIndex].fill}
              onChange={handleFillChange}
              style={{ width: '100%' }}
            >
              <Select.Option value="none">None</Select.Option>
              <Select.Option value="tozeroy">To Zero Y</Select.Option>
              <Select.Option value="tozerox">To Zero X</Select.Option>
              <Select.Option value="tonexty">To Next Y</Select.Option>
              <Select.Option value="tonextx">To Next X</Select.Option>
              <Select.Option value="toself">To Self</Select.Option>
              <Select.Option value="tonext">To Next</Select.Option>
            </Select>
          </Form.Item>
        </>
      )}
    </Form>
  );
};

export default PlotDataSettings;