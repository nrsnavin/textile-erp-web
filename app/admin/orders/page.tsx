'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ordersApi } from '@/lib/api/orders';
import type { Order, OrderFilterParams, OrderStatus } from '@/lib/api/types';

const { Title } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  DRAFT:         'default',
  CONFIRMED:     'processing',
  IN_PRODUCTION: 'blue',
  QC_PASSED:     'cyan',
  DISPATCHED:    'success',
  CANCELLED:     'error',
};

const STATUSES: OrderStatus[] = [
  'DRAFT',
  'CONFIRMED',
  'IN_PRODUCTION',
  'QC_PASSED',
  'DISPATCHED',
  'CANCELLED',
];

export default function OrdersPage() {
  const router = useRouter();
  const [msg, msgCtx] = message.useMessage();
  const [filters, setFilters] = useState<OrderFilterParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.list(filters),
  });

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (v: string, r: Order) => (
        <a
          onClick={() => router.push(`/admin/orders/${r.id}`)}
          style={{ fontWeight: 500 }}
        >
          {v}
        </a>
      ),
    },
    {
      title: 'Buyer',
      key: 'buyer',
      render: (_: unknown, r: Order) =>
        r.buyer?.name ?? r.buyerId.slice(0, 8) + '…',
    },
    {
      title: 'Delivery Date',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 130,
      render: (v: string) => format(new Date(v), 'dd MMM yyyy'),
    },
    {
      title: 'Season',
      dataIndex: 'season',
      key: 'season',
      width: 100,
      render: (v?: string) => v ?? <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Total Qty',
      dataIndex: 'totalQty',
      key: 'totalQty',
      width: 100,
      render: (v: number) => v?.toLocaleString() ?? 0,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (v: OrderStatus) => (
        <Tag color={ORDER_STATUS_COLOR[v] ?? 'default'}>
          {v.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v: string) => format(new Date(v), 'dd MMM yyyy'),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, r: Order) => (
        <Tooltip title="View">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/orders/${r.id}`)}
          />
        </Tooltip>
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
          Orders
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/admin/orders/new')}
        >
          New Order
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }} bodyStyle={{ padding: '16px 20px' }}>
        <Space wrap>
          <Search
            placeholder="Search by PO number or buyer…"
            allowClear
            style={{ width: 260 }}
            onSearch={(v) => setFilters((f) => ({ ...f, search: v || undefined, page: 1 }))}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 160 }}
            options={STATUSES.map((s) => ({ label: s.replace(/_/g, ' '), value: s }))}
            onChange={(v) => setFilters((f) => ({ ...f, status: v, page: 1 }))}
          />
          <RangePicker
            placeholder={['Delivery from', 'Delivery to']}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                setFilters((f) => ({
                  ...f,
                  from: dates[0]!.toISOString(),
                  to: dates[1]!.toISOString(),
                  page: 1,
                }));
              } else {
                setFilters((f) => ({ ...f, from: undefined, to: undefined, page: 1 }));
              }
            }}
          />
        </Space>
      </Card>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Table
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          onRow={(r) => ({
            onClick: () => router.push(`/admin/orders/${r.id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: data?.meta?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} orders`,
            onChange: (page, limit) => setFilters((f) => ({ ...f, page, limit })),
          }}
          scroll={{ x: 900 }}
        />
      </Card>
    </>
  );
}
