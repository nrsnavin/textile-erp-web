'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Typography,
  message,
  Divider,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { suppliersApi, purchaseOrdersApi } from '@/lib/api/suppliers';
import { itemsApi } from '@/lib/api/items';
import type { CreatePurchaseOrderDto, CreatePoLineDto } from '@/lib/api/types';

const { Title } = Typography;

interface LineFormValue extends CreatePoLineDto {
  key: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [lines, setLines] = useState<LineFormValue[]>([
    { key: crypto.randomUUID(), itemId: '', qty: 1, unit: 'PCS', rate: 0, gstPct: 18 },
  ]);
  const [msg, msgCtx] = message.useMessage();

  const defaultSupplierId = searchParams.get('supplierId') ?? undefined;

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: () => suppliersApi.list({ limit: 100, isActive: true }),
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items', 'all'],
    queryFn: () => itemsApi.list({ limit: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePurchaseOrderDto) => purchaseOrdersApi.create(data),
    onSuccess: (po) => {
      msg.success(`PO ${po.poNumber} created!`);
      router.push(`/admin/purchase-orders/${po.id}`);
    },
    onError: (e: Error) => msg.error(e.message),
  });

  async function handleSubmit() {
    const values = await form.validateFields();
    if (lines.length === 0) {
      msg.error('Add at least one line item');
      return;
    }
    const invalid = lines.find((l) => !l.itemId || l.qty <= 0 || l.rate < 0);
    if (invalid) {
      msg.error('Fill in all line items correctly');
      return;
    }

    const payload: CreatePurchaseOrderDto = {
      supplierId: values.supplierId,
      poDate: values.poDate.toISOString(),
      expectedDate: values.expectedDate.toISOString(),
      remarks: values.remarks,
      lines: lines.map(({ key, ...l }) => l),
    };
    createMutation.mutate(payload);
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { key: crypto.randomUUID(), itemId: '', qty: 1, unit: 'PCS', rate: 0, gstPct: 18 },
    ]);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function updateLine(key: string, field: keyof CreatePoLineDto, value: unknown) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)),
    );
  }

  const totals = lines.reduce(
    (acc, l) => {
      const base = (l.qty ?? 0) * (l.rate ?? 0);
      const tax = (base * (l.gstPct ?? 0)) / 100;
      return { base: acc.base + base, tax: acc.tax + tax };
    },
    { base: 0, tax: 0 },
  );

  const lineColumns = [
    {
      title: 'Item',
      key: 'itemId',
      width: 200,
      render: (_: unknown, record: LineFormValue) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select item"
          value={record.itemId || undefined}
          showSearch
          optionFilterProp="label"
          options={itemsData?.data?.map((i) => ({ label: i.name, value: i.id })) ?? []}
          onChange={(v) => updateLine(record.key, 'itemId', v)}
        />
      ),
    },
    {
      title: 'Description',
      key: 'description',
      width: 160,
      render: (_: unknown, record: LineFormValue) => (
        <Input
          placeholder="Optional"
          value={record.description}
          onChange={(e) => updateLine(record.key, 'description', e.target.value)}
        />
      ),
    },
    {
      title: 'Qty',
      key: 'qty',
      width: 90,
      render: (_: unknown, record: LineFormValue) => (
        <InputNumber
          min={0.001}
          step={0.001}
          value={record.qty}
          onChange={(v) => updateLine(record.key, 'qty', v ?? 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Unit',
      key: 'unit',
      width: 100,
      render: (_: unknown, record: LineFormValue) => (
        <Select
          value={record.unit}
          onChange={(v) => updateLine(record.key, 'unit', v)}
          style={{ width: '100%' }}
          options={['PCS', 'KG', 'MTR', 'SET', 'BOX', 'ROLL'].map((u) => ({
            label: u,
            value: u,
          }))}
        />
      ),
    },
    {
      title: 'Rate (₹)',
      key: 'rate',
      width: 110,
      render: (_: unknown, record: LineFormValue) => (
        <InputNumber
          min={0}
          value={record.rate}
          onChange={(v) => updateLine(record.key, 'rate', v ?? 0)}
          style={{ width: '100%' }}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(v) => v?.replace(/,/g, '') as unknown as number}
        />
      ),
    },
    {
      title: 'GST %',
      key: 'gstPct',
      width: 90,
      render: (_: unknown, record: LineFormValue) => (
        <Select
          value={record.gstPct}
          onChange={(v) => updateLine(record.key, 'gstPct', v)}
          style={{ width: '100%' }}
          options={[0, 5, 12, 18, 28].map((g) => ({ label: `${g}%`, value: g }))}
        />
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 120,
      render: (_: unknown, record: LineFormValue) => {
        const base = (record.qty ?? 0) * (record.rate ?? 0);
        const tax = (base * (record.gstPct ?? 0)) / 100;
        return `₹ ${(base + tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, record: LineFormValue) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeLine(record.key)}
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
          onClick={() => router.push('/admin/purchase-orders')}
        />
        <Title level={3} style={{ margin: 0 }}>
          New Purchase Order
        </Title>
      </div>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Form form={form} layout="vertical" initialValues={{ supplierId: defaultSupplierId }}>
          <Row gutter={24}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                label="Supplier"
                name="supplierId"
                rules={[{ required: true, message: 'Select a supplier' }]}
              >
                <Select
                  placeholder="Select supplier"
                  showSearch
                  optionFilterProp="label"
                  options={
                    suppliersData?.data?.map((s) => ({ label: s.name, value: s.id })) ?? []
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                label="PO Date"
                name="poDate"
                rules={[{ required: true, message: 'Select PO date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                label="Expected Delivery Date"
                name="expectedDate"
                rules={[{ required: true, message: 'Select expected date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} placeholder="Optional remarks or instructions" />
          </Form.Item>
        </Form>

        <Divider>Line Items</Divider>

        <Table
          dataSource={lines}
          columns={lineColumns}
          rowKey="key"
          pagination={false}
          scroll={{ x: 900 }}
          footer={() => (
            <Button type="dashed" icon={<PlusOutlined />} onClick={addLine} block>
              Add Line
            </Button>
          )}
        />

        {/* Totals */}
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              background: '#f8f9fa',
              borderRadius: 8,
              padding: '12px 20px',
              minWidth: 240,
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
            >
              <span>Sub Total</span>
              <strong>₹ {totals.base.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
            >
              <span>GST</span>
              <strong>₹ {totals.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Total</strong>
              <strong style={{ color: '#1e50a0', fontSize: 16 }}>
                ₹{' '}
                {(totals.base + totals.tax).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={() => router.push('/admin/purchase-orders')}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={createMutation.isPending}
          >
            Create Purchase Order
          </Button>
        </div>
      </Card>
    </>
  );
}
