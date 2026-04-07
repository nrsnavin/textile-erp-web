'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Table,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { inventoryApi } from '@/lib/api/inventory';
import { itemsApi } from '@/lib/api/items';
import type { CreateBomDto, CreateBomLineDto } from '@/lib/api/types';

const { Title } = Typography;

const UNITS = ['PCS', 'KG', 'MTR', 'LTR', 'SET', 'ROLL', 'BOX'];

interface BomLineRow extends CreateBomLineDto {
  key: string;
}

function makeEmptyLine(): BomLineRow {
  return {
    key: crypto.randomUUID(),
    rawItemId: '',
    qty: 1,
    unit: 'MTR',
    wastagePct: 0,
  };
}

export default function NewBomPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [lines, setLines] = useState<BomLineRow[]>([makeEmptyLine()]);
  const [msg, msgCtx] = message.useMessage();

  const { data: itemsData } = useQuery({
    queryKey: ['items', 'all'],
    queryFn: () => itemsApi.list({ limit: 500 }),
  });

  // Separate finished goods (FINISHED_GOODS category) and raw materials
  const finishedGoods = itemsData?.data?.filter((i) => i.category === 'FINISHED_GOODS') ?? [];
  const rawMaterials = itemsData?.data?.filter((i) => i.category !== 'FINISHED_GOODS') ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateBomDto) => inventoryApi.createBom(data),
    onSuccess: () => {
      msg.success('BOM created successfully');
      router.push('/admin/inventory/bom');
    },
    onError: (e: Error) => msg.error(e.message),
  });

  async function handleSubmit() {
    const values = await form.validateFields();
    if (lines.length === 0) {
      msg.error('Add at least one component line');
      return;
    }
    const invalid = lines.find((l) => !l.rawItemId || l.qty <= 0);
    if (invalid) {
      msg.error('Each component must have an item and a positive quantity');
      return;
    }

    const payload: CreateBomDto = {
      itemId: values.itemId,
      styleCode: values.styleCode || undefined,
      remarks: values.remarks || undefined,
      lines: lines.map(({ key, ...l }) => l),
    };
    createMutation.mutate(payload);
  }

  function addLine() {
    setLines((prev) => [...prev, makeEmptyLine()]);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function updateLine(key: string, field: keyof Omit<BomLineRow, 'key'>, value: unknown) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
  }

  const lineColumns = [
    {
      title: 'Raw Material / Component',
      key: 'rawItemId',
      render: (_: unknown, r: BomLineRow) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select raw material"
          value={r.rawItemId || undefined}
          showSearch
          optionFilterProp="label"
          options={
            rawMaterials.length > 0
              ? rawMaterials.map((i) => ({ label: `${i.name} (${i.category})`, value: i.id }))
              : itemsData?.data?.map((i) => ({ label: i.name, value: i.id })) ?? []
          }
          onChange={(v) => updateLine(r.key, 'rawItemId', v)}
        />
      ),
    },
    {
      title: 'Qty',
      key: 'qty',
      width: 100,
      render: (_: unknown, r: BomLineRow) => (
        <InputNumber
          min={0.001}
          step={0.001}
          value={r.qty}
          onChange={(v) => updateLine(r.key, 'qty', v ?? 0)}
          style={{ width: '100%' }}
          controls={false}
        />
      ),
    },
    {
      title: 'Unit',
      key: 'unit',
      width: 110,
      render: (_: unknown, r: BomLineRow) => (
        <Select
          value={r.unit}
          onChange={(v) => updateLine(r.key, 'unit', v)}
          style={{ width: '100%' }}
          options={UNITS.map((u) => ({ label: u, value: u }))}
        />
      ),
    },
    {
      title: 'Wastage %',
      key: 'wastagePct',
      width: 110,
      render: (_: unknown, r: BomLineRow) => (
        <InputNumber
          min={0}
          max={100}
          value={r.wastagePct}
          onChange={(v) => updateLine(r.key, 'wastagePct', v ?? 0)}
          style={{ width: '100%' }}
          suffix="%"
          controls={false}
        />
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 50,
      render: (_: unknown, r: BomLineRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLine(r.key)}
          disabled={lines.length === 1}
        />
      ),
    },
  ];

  return (
    <>
      {msgCtx}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin/inventory/bom')}
        />
        <Title level={3} style={{ margin: 0 }}>
          New Bill of Materials
        </Title>
      </div>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Form form={form} layout="vertical">
          <Row gutter={24}>
            <Col xs={24} sm={12} lg={10}>
              <Form.Item
                label="Finished Good"
                name="itemId"
                rules={[{ required: true, message: 'Select the finished good item' }]}
              >
                <Select
                  placeholder="Select finished good"
                  showSearch
                  optionFilterProp="label"
                  options={
                    finishedGoods.length > 0
                      ? finishedGoods.map((i) => ({ label: i.name, value: i.id }))
                      : itemsData?.data?.map((i) => ({ label: i.name, value: i.id })) ?? []
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item label="Style Code" name="styleCode">
                <Input placeholder="e.g. TS-001 (optional)" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} placeholder="Optional notes about this BOM" />
          </Form.Item>
        </Form>

        <Divider>Components</Divider>

        <Table
          dataSource={lines}
          columns={lineColumns}
          rowKey="key"
          pagination={false}
          scroll={{ x: 700 }}
          footer={() => (
            <Button type="dashed" icon={<PlusOutlined />} onClick={addLine} block>
              Add Component
            </Button>
          )}
        />

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={() => router.push('/admin/inventory/bom')}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={createMutation.isPending}
          >
            Create BOM
          </Button>
        </div>
      </Card>
    </>
  );
}
