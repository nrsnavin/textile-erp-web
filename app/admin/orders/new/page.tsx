'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { buyersApi } from '@/lib/api/buyers';
import { itemsApi } from '@/lib/api/items';
import type { CreateOrderDto, CreateOrderLineDto } from '@/lib/api/types';

const { Title, Text } = Typography;

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

interface LineRow extends Omit<CreateOrderLineDto, 'sizesJson'> {
  key: string;
  sizesJson: Record<string, number>;
}

function makeEmptyLine(): LineRow {
  return {
    key: crypto.randomUUID(),
    itemId: '',
    styleCode: '',
    colour: '',
    sizesJson: {},
    unitPrice: undefined,
  };
}

export default function NewOrderPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [lines, setLines] = useState<LineRow[]>([makeEmptyLine()]);
  const [msg, msgCtx] = message.useMessage();

  const { data: buyersData } = useQuery({
    queryKey: ['buyers', 'all'],
    queryFn: () => buyersApi.list({ limit: 200, isActive: true }),
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items', 'all'],
    queryFn: () => itemsApi.list({ limit: 500 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateOrderDto) => ordersApi.create(data),
    onSuccess: (order) => {
      msg.success(`Order ${order.poNumber} created!`);
      router.push(`/admin/orders/${order.id}`);
    },
    onError: (e: Error) => msg.error(e.message),
  });

  async function handleNext() {
    await form.validateFields();
    setStep(1);
  }

  async function handleSubmit() {
    if (lines.length === 0) {
      msg.error('Add at least one line item');
      return;
    }
    const invalid = lines.find((l) => !l.itemId || !l.styleCode);
    if (invalid) {
      msg.error('Each line must have an item and a style code');
      return;
    }

    const values = form.getFieldsValue();
    const payload: CreateOrderDto = {
      buyerId: values.buyerId,
      poNumber: values.poNumber,
      deliveryDate: values.deliveryDate?.toISOString(),
      season: values.season || undefined,
      remarks: values.remarks || undefined,
      lines: lines.map(({ key, ...l }) => ({
        ...l,
        colour: l.colour || undefined,
        sizesJson: l.sizesJson,
      })),
    };
    createMutation.mutate(payload);
  }

  function addLine() {
    setLines((prev) => [...prev, makeEmptyLine()]);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function updateLine(key: string, field: keyof Omit<LineRow, 'key' | 'sizesJson'>, value: unknown) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
  }

  function updateSize(key: string, size: string, value: number | null) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l.sizesJson };
        if (value && value > 0) {
          next[size] = value;
        } else {
          delete next[size];
        }
        return { ...l, sizesJson: next };
      }),
    );
  }

  function lineTotal(line: LineRow) {
    return Object.values(line.sizesJson).reduce((a, b) => a + b, 0);
  }

  const grandTotal = lines.reduce((acc, l) => acc + lineTotal(l), 0);

  const lineColumns = [
    {
      title: 'Style Code',
      key: 'styleCode',
      width: 130,
      render: (_: unknown, r: LineRow) => (
        <Input
          placeholder="e.g. TS-001"
          value={r.styleCode}
          onChange={(e) => updateLine(r.key, 'styleCode', e.target.value)}
        />
      ),
    },
    {
      title: 'Item',
      key: 'itemId',
      width: 180,
      render: (_: unknown, r: LineRow) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select item"
          value={r.itemId || undefined}
          showSearch
          optionFilterProp="label"
          options={itemsData?.data?.map((i) => ({ label: i.name, value: i.id })) ?? []}
          onChange={(v) => updateLine(r.key, 'itemId', v)}
        />
      ),
    },
    {
      title: 'Colour',
      key: 'colour',
      width: 110,
      render: (_: unknown, r: LineRow) => (
        <Input
          placeholder="e.g. Navy"
          value={r.colour}
          onChange={(e) => updateLine(r.key, 'colour', e.target.value)}
        />
      ),
    },
    {
      title: (
        <span>
          Sizes{' '}
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
            (qty per size)
          </Text>
        </span>
      ),
      key: 'sizes',
      width: 380,
      render: (_: unknown, r: LineRow) => (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {SIZES.map((s) => (
            <div key={s} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{s}</div>
              <InputNumber
                min={0}
                size="small"
                style={{ width: 52 }}
                value={r.sizesJson[s] ?? null}
                onChange={(v) => updateSize(r.key, s, v)}
                controls={false}
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Total',
      key: 'total',
      width: 70,
      render: (_: unknown, r: LineRow) => (
        <Text strong>{lineTotal(r).toLocaleString()}</Text>
      ),
    },
    {
      title: 'Unit Price',
      key: 'unitPrice',
      width: 110,
      render: (_: unknown, r: LineRow) => (
        <InputNumber
          min={0}
          value={r.unitPrice ?? null}
          onChange={(v) => updateLine(r.key, 'unitPrice', v ?? undefined)}
          style={{ width: '100%' }}
          placeholder="0.00"
          prefix="$"
          controls={false}
        />
      ),
    },
    {
      title: '',
      key: 'remove',
      width: 40,
      render: (_: unknown, r: LineRow) => (
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
          onClick={() => (step === 1 ? setStep(0) : router.push('/admin/orders'))}
        />
        <Title level={3} style={{ margin: 0 }}>
          New Order
        </Title>
      </div>

      <Steps
        current={step}
        items={[{ title: 'Order Header' }, { title: 'Line Items' }]}
        style={{ marginBottom: 24, maxWidth: 400 }}
      />

      {step === 0 && (
        <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Form form={form} layout="vertical">
            <Row gutter={24}>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label="Buyer"
                  name="buyerId"
                  rules={[{ required: true, message: 'Select a buyer' }]}
                >
                  <Select
                    placeholder="Select buyer"
                    showSearch
                    optionFilterProp="label"
                    options={buyersData?.data?.map((b) => ({ label: b.name, value: b.id })) ?? []}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label="PO Number"
                  name="poNumber"
                  rules={[{ required: true, message: 'PO number is required' }]}
                >
                  <Input placeholder="e.g. PO-2024-001" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label="Delivery Date"
                  name="deliveryDate"
                  rules={[{ required: true, message: 'Select delivery date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item label="Season" name="season">
                  <Input placeholder="e.g. SS25, AW24 (optional)" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={3} placeholder="Optional notes or special instructions" />
            </Form.Item>
          </Form>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Button onClick={() => router.push('/admin/orders')}>Cancel</Button>
            <Button type="primary" onClick={handleNext}>
              Next: Add Lines
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Table
            dataSource={lines}
            columns={lineColumns}
            rowKey="key"
            pagination={false}
            scroll={{ x: 1050 }}
            footer={() => (
              <Button type="dashed" icon={<PlusOutlined />} onClick={addLine} block>
                Add Line
              </Button>
            )}
          />

          {/* Totals summary */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <div
              style={{
                background: '#f8f9fa',
                borderRadius: 8,
                padding: '12px 20px',
                minWidth: 240,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Total Styles</span>
                <strong>{lines.length}</strong>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Total Pieces</strong>
                <strong style={{ color: '#1e50a0', fontSize: 16 }}>
                  {grandTotal.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={() => setStep(0)}>Back</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createMutation.isPending}
            >
              Create Order
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
