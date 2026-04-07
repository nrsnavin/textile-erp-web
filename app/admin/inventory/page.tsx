'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api/inventory';
import { itemsApi } from '@/lib/api/items';
import type { StockBalance } from '@/lib/api/types';

const { Title, Text } = Typography;
const { Search } = Input;

export default function InventoryPage() {
  const qc = useQueryClient();
  const [msg, msgCtx] = message.useMessage();
  const [locationFilter, setLocationFilter] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm] = Form.useForm();

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['inventory', 'stock', locationFilter],
    queryFn: () => inventoryApi.listStock(locationFilter),
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items', 'all'],
    queryFn: () => itemsApi.list({ limit: 500 }),
  });

  const adjustMutation = useMutation({
    mutationFn: (data: { itemId: string; location: string; qty: number; reason?: string }) =>
      inventoryApi.adjustStock(data),
    onSuccess: () => {
      msg.success('Stock adjusted successfully');
      qc.invalidateQueries({ queryKey: ['inventory', 'stock'] });
      setAdjustOpen(false);
      adjustForm.resetFields();
    },
    onError: (e: Error) => msg.error(e.message),
  });

  async function handleAdjust() {
    const values = await adjustForm.validateFields();
    adjustMutation.mutate(values);
  }

  // Extract unique locations for filter dropdown
  const locations = Array.from(new Set((stockData ?? []).map((s) => s.location))).filter(Boolean);

  const filtered = (stockData ?? []).filter((s) => {
    if (!search) return true;
    const name = s.item?.name?.toLowerCase() ?? '';
    const code = s.itemId.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const columns = [
    {
      title: 'Item Code',
      key: 'itemCode',
      width: 130,
      render: (_: unknown, r: StockBalance) => (
        <Text code style={{ fontSize: 12 }}>
          {r.item?.id?.slice(0, 8) ?? r.itemId.slice(0, 8)}
        </Text>
      ),
    },
    {
      title: 'Item Name',
      key: 'itemName',
      render: (_: unknown, r: StockBalance) => r.item?.name ?? r.itemId,
    },
    {
      title: 'Category',
      key: 'category',
      width: 120,
      render: (_: unknown, r: StockBalance) =>
        r.item?.category ? (
          <Text>{r.item.category.replace(/_/g, ' ')}</Text>
        ) : (
          <span style={{ color: '#bbb' }}>—</span>
        ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: 'On Hand',
      dataIndex: 'onHand',
      key: 'onHand',
      width: 100,
      render: (v: number) => v?.toLocaleString() ?? 0,
    },
    {
      title: 'Reserved',
      dataIndex: 'reserved',
      key: 'reserved',
      width: 100,
      render: (v: number) => v?.toLocaleString() ?? 0,
    },
    {
      title: 'Available',
      dataIndex: 'available',
      key: 'available',
      width: 110,
      render: (v: number) => (
        <Text strong style={{ color: v > 0 ? '#389e0d' : '#cf1322' }}>
          {v?.toLocaleString() ?? 0}
        </Text>
      ),
    },
  ];

  return (
    <>
      {msgCtx}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Inventory — Stock Balances
        </Title>
        <Button
          type="primary"
          onClick={() => setAdjustOpen(true)}
        >
          Adjust Stock
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }} bodyStyle={{ padding: '16px 20px' }}>
        <Space wrap>
          <Search
            placeholder="Search by item name or code…"
            allowClear
            style={{ width: 280 }}
            onSearch={(v) => setSearch(v)}
            onChange={(e) => !e.target.value && setSearch('')}
          />
          <Select
            placeholder="Filter by location"
            allowClear
            style={{ width: 180 }}
            options={locations.map((l) => ({ label: l, value: l }))}
            onChange={(v) => setLocationFilter(v)}
          />
        </Space>
      </Card>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} items` }}
          scroll={{ x: 800 }}
          locale={{ emptyText: 'No stock records found' }}
        />
      </Card>

      {/* Adjust Stock Modal */}
      <Modal
        title="Adjust Stock"
        open={adjustOpen}
        onCancel={() => {
          setAdjustOpen(false);
          adjustForm.resetFields();
        }}
        onOk={handleAdjust}
        okText="Apply Adjustment"
        confirmLoading={adjustMutation.isPending}
        width={520}
        destroyOnClose
      >
        <Form form={adjustForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Item"
            name="itemId"
            rules={[{ required: true, message: 'Select an item' }]}
          >
            <Select
              placeholder="Select item"
              showSearch
              optionFilterProp="label"
              options={itemsData?.data?.map((i) => ({ label: i.name, value: i.id })) ?? []}
            />
          </Form.Item>
          <Form.Item
            label="Location"
            name="location"
            rules={[{ required: true, message: 'Enter a location' }]}
          >
            <Input placeholder="e.g. WAREHOUSE-A, STORE-1" />
          </Form.Item>
          <Form.Item
            label="Quantity Adjustment"
            name="qty"
            rules={[{ required: true, message: 'Enter quantity (negative to reduce)' }]}
            extra="Use a negative number to reduce stock."
          >
            <InputNumber style={{ width: '100%' }} placeholder="e.g. 100 or -50" />
          </Form.Item>
          <Form.Item label="Reason" name="reason">
            <Input.TextArea rows={2} placeholder="Optional reason for adjustment" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
