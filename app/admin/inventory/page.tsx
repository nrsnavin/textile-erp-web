'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, HistoryOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api/inventory';
import { itemsApi } from '@/lib/api/items';
import type { StockBalance, StockLedgerEntry, LedgerEntryType } from '@/lib/api/types';

const { Title, Text } = Typography;
const { Search } = Input;

type ModalType = 'adjust' | 'issue' | 'return' | 'transfer' | 'opening' | null;

const ENTRY_TYPE_COLOR: Record<LedgerEntryType, string> = {
  GRN_IN:           'green',
  OPENING_STOCK:    'blue',
  RETURN_FROM_PROD: 'cyan',
  TRANSFER_IN:      'geekblue',
  ADJUSTMENT:       'orange',
  ISSUE_TO_PROD:    'red',
  TRANSFER_OUT:     'volcano',
};

const ENTRY_TYPE_LABEL: Record<LedgerEntryType, string> = {
  GRN_IN:           'GRN In',
  OPENING_STOCK:    'Opening',
  RETURN_FROM_PROD: 'Return',
  TRANSFER_IN:      'Transfer In',
  ADJUSTMENT:       'Adjustment',
  ISSUE_TO_PROD:    'Issue',
  TRANSFER_OUT:     'Transfer Out',
};

export default function InventoryPage() {
  const qc = useQueryClient();
  const [msg, msgCtx] = message.useMessage();
  const [locationFilter, setLocationFilter] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [form] = Form.useForm();

  // Movement history drawer
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<StockBalance | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['inventory', 'stock', locationFilter],
    queryFn: () => inventoryApi.listStock(locationFilter),
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items', 'all'],
    queryFn: () => itemsApi.list({ limit: 500 }),
  });

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory', 'movements', historyItem?.itemId, historyItem?.location, historyPage],
    queryFn: () =>
      inventoryApi.getMovements({
        itemId:   historyItem!.itemId,
        location: historyItem!.location,
        page:     historyPage,
        limit:    20,
      }),
    enabled: historyOpen && !!historyItem,
  });

  function openHistory(record: StockBalance) {
    setHistoryItem(record);
    setHistoryPage(1);
    setHistoryOpen(true);
  }

  const adjustMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.adjustStock(data),
    onSuccess: () => {
      msg.success('Stock adjusted');
      qc.invalidateQueries({ queryKey: ['inventory', 'stock'] });
      qc.invalidateQueries({ queryKey: ['inventory', 'movements'] });
      setModalType(null);
      form.resetFields();
    },
    onError: (e: Error) => msg.error(e.message),
  });

  const issueMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.issueToProduction(data),
    onSuccess: () => {
      msg.success('Issued to production');
      qc.invalidateQueries({ queryKey: ['inventory', 'stock'] });
      qc.invalidateQueries({ queryKey: ['inventory', 'movements'] });
      setModalType(null);
      form.resetFields();
    },
    onError: (e: Error) => msg.error(e.message),
  });

  const returnMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.returnFromProduction(data),
    onSuccess: () => {
      msg.success('Return recorded');
      qc.invalidateQueries({ queryKey: ['inventory', 'stock'] });
      qc.invalidateQueries({ queryKey: ['inventory', 'movements'] });
      setModalType(null);
      form.resetFields();
    },
    onError: (e: Error) => msg.error(e.message),
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.transferStock(data),
    onSuccess: () => {
      msg.success('Transfer complete');
      qc.invalidateQueries({ queryKey: ['inventory', 'stock'] });
      qc.invalidateQueries({ queryKey: ['inventory', 'movements'] });
      setModalType(null);
      form.resetFields();
    },
    onError: (e: Error) => msg.error(e.message),
  });

  const openingMutation = useMutation({
    mutationFn: (data: any) => inventoryApi.setOpeningStock(data),
    onSuccess: () => {
      msg.success('Opening stock set');
      qc.invalidateQueries({ queryKey: ['inventory', 'stock'] });
      qc.invalidateQueries({ queryKey: ['inventory', 'movements'] });
      setModalType(null);
      form.resetFields();
    },
    onError: (e: Error) => msg.error(e.message),
  });

  async function handleSubmit() {
    const values = await form.validateFields();
    if (modalType === 'adjust')   adjustMutation.mutate(values);
    if (modalType === 'issue')    issueMutation.mutate(values);
    if (modalType === 'return')   returnMutation.mutate(values);
    if (modalType === 'transfer') transferMutation.mutate(values);
    if (modalType === 'opening')  openingMutation.mutate(values);
  }

  const isPending =
    adjustMutation.isPending   ||
    issueMutation.isPending    ||
    returnMutation.isPending   ||
    transferMutation.isPending ||
    openingMutation.isPending;

  const locations = Array.from(new Set((stockData ?? []).map((s) => s.location))).filter(Boolean);

  const filtered = (stockData ?? []).filter((s) => {
    if (!search) return true;
    const name = s.item?.name?.toLowerCase() ?? '';
    const code = s.itemId.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const actionMenu: MenuProps = {
    items: [
      { key: 'opening',  label: 'Set Opening Stock' },
      { key: 'adjust',   label: 'Adjust Stock' },
      { key: 'issue',    label: 'Issue to Production' },
      { key: 'return',   label: 'Return from Production' },
      { key: 'transfer', label: 'Transfer Between Locations' },
    ],
    onClick: ({ key }) => {
      form.resetFields();
      setModalType(key as ModalType);
    },
  };

  const stockColumns = [
    {
      title: 'Item Code',
      key: 'itemCode',
      width: 120,
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
      width: 130,
      render: (_: unknown, r: StockBalance) =>
        r.item?.category ? (
          <Text>{r.item.category.replace(/_/g, ' ')}</Text>
        ) : (
          <span style={{ color: '#bbb' }}>—</span>
        ),
    },
    { title: 'Location', dataIndex: 'location', key: 'location', width: 120 },
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
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, r: StockBalance) => (
        <Button
          type="text"
          icon={<HistoryOutlined />}
          size="small"
          onClick={() => openHistory(r)}
          title="View movement history"
        />
      ),
    },
  ];

  const movementColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: 'Type',
      dataIndex: 'entryType',
      key: 'entryType',
      width: 140,
      render: (v: LedgerEntryType) => (
        <Tag color={ENTRY_TYPE_COLOR[v] ?? 'default'}>
          {ENTRY_TYPE_LABEL[v] ?? v}
        </Tag>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      width: 90,
      render: (v: number) => (
        <Text strong style={{ color: v >= 0 ? '#389e0d' : '#cf1322' }}>
          {v >= 0 ? `+${v}` : v}
        </Text>
      ),
    },
    {
      title: 'Balance After',
      dataIndex: 'balanceQty',
      key: 'balanceQty',
      width: 110,
      render: (v: number) => v?.toLocaleString(),
    },
    {
      title: 'Ref',
      key: 'ref',
      width: 100,
      render: (_: unknown, r: StockLedgerEntry) =>
        r.refType ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.refType}
          </Text>
        ) : (
          <span style={{ color: '#bbb' }}>—</span>
        ),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (v: string) => v ?? <span style={{ color: '#bbb' }}>—</span>,
    },
  ];

  const modalTitles: Record<NonNullable<ModalType>, string> = {
    adjust:   'Adjust Stock',
    issue:    'Issue to Production',
    return:   'Return from Production',
    transfer: 'Transfer Between Locations',
    opening:  'Set Opening Stock',
  };

  const itemOptions = itemsData?.data?.map((i) => ({ label: `${i.name}`, value: i.id })) ?? [];

  return (
    <>
      {msgCtx}

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          Inventory — Stock Balances
        </Title>
        <Dropdown menu={actionMenu}>
          <Button type="primary">
            Stock Movement <DownOutlined />
          </Button>
        </Dropdown>
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
          columns={stockColumns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} items` }}
          scroll={{ x: 900 }}
          locale={{ emptyText: 'No stock records found' }}
        />
      </Card>

      {/* Movement History Drawer */}
      <Drawer
        title={
          historyItem
            ? `Movement History — ${historyItem.item?.name ?? historyItem.itemId} (${historyItem.location})`
            : 'Movement History'
        }
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        width={780}
        destroyOnClose
      >
        <Table
          dataSource={movementsData?.data ?? []}
          columns={movementColumns}
          rowKey="id"
          loading={movementsLoading}
          pagination={{
            current:   historyPage,
            pageSize:  20,
            total:     movementsData?.meta?.total ?? 0,
            onChange:  (p) => setHistoryPage(p),
            showTotal: (t) => `${t} entries`,
          }}
          scroll={{ x: 700 }}
          size="small"
          locale={{ emptyText: 'No movements recorded yet' }}
        />
      </Drawer>

      {/* Unified Stock Movement Modal */}
      <Modal
        title={modalType ? modalTitles[modalType] : ''}
        open={!!modalType}
        onCancel={() => { setModalType(null); form.resetFields(); }}
        onOk={handleSubmit}
        okText="Confirm"
        confirmLoading={isPending}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* Item selector — all modals */}
          <Form.Item
            label="Item"
            name="itemId"
            rules={[{ required: true, message: 'Select an item' }]}
          >
            <Select
              placeholder="Select item"
              showSearch
              optionFilterProp="label"
              options={itemOptions}
            />
          </Form.Item>

          {/* Transfer: from/to locations */}
          {modalType === 'transfer' ? (
            <>
              <Form.Item
                label="From Location"
                name="fromLocation"
                rules={[{ required: true, message: 'Enter source location' }]}
              >
                <Input placeholder="e.g. WAREHOUSE-A" />
              </Form.Item>
              <Form.Item
                label="To Location"
                name="toLocation"
                rules={[{ required: true, message: 'Enter destination location' }]}
              >
                <Input placeholder="e.g. STORE-1" />
              </Form.Item>
            </>
          ) : (
            <Form.Item label="Location" name="location" initialValue="MAIN">
              <Input placeholder="e.g. MAIN, WAREHOUSE-A" />
            </Form.Item>
          )}

          {/* Quantity */}
          <Form.Item
            label={modalType === 'adjust' ? 'Quantity Adjustment' : 'Quantity'}
            name="qty"
            rules={[{ required: true, message: 'Enter quantity' }]}
            extra={modalType === 'adjust' ? 'Use a negative number to reduce stock.' : undefined}
          >
            <InputNumber style={{ width: '100%' }} placeholder={modalType === 'adjust' ? 'e.g. 50 or -20' : 'e.g. 30'} />
          </Form.Item>

          {/* Rate — only for opening stock */}
          {modalType === 'opening' && (
            <Form.Item label="Cost Rate (optional)" name="rate">
              <InputNumber style={{ width: '100%' }} placeholder="Cost per unit" min={0} />
            </Form.Item>
          )}

          {/* Reason — required for adjustments */}
          {modalType === 'adjust' ? (
            <Form.Item
              label="Reason"
              name="reason"
              rules={[{ required: true, message: 'Reason is required for adjustments' }]}
            >
              <Input.TextArea rows={2} placeholder="Reason for adjustment" />
            </Form.Item>
          ) : (
            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={2} placeholder="Optional remarks" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
