'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
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
import { purchaseOrdersApi } from '@/lib/api/suppliers';
import type { PoFilterParams, PurchaseOrder, PurchaseOrderStatus } from '@/lib/api/types';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PO_STATUS_COLOR: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'default',
  SENT: 'processing',
  ACKNOWLEDGED: 'blue',
  PART_RECEIVED: 'warning',
  CLOSED: 'success',
  CANCELLED: 'error',
};

const STATUSES: PurchaseOrderStatus[] = [
  'DRAFT',
  'SENT',
  'ACKNOWLEDGED',
  'PART_RECEIVED',
  'CLOSED',
  'CANCELLED',
];

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<PoFilterParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  const [msg, msgCtx] = message.useMessage();

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', filters],
    queryFn: () => purchaseOrdersApi.list(filters),
  });

  function calcTotal(po: PurchaseOrder) {
    return po.lines?.reduce((sum, l) => {
      const base = l.qty * l.rate;
      const gst = (base * l.gstPct) / 100;
      return sum + base + gst;
    }, 0) ?? 0;
  }

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (v: string, r: PurchaseOrder) => (
        <a onClick={() => router.push(`/admin/purchase-orders/${r.id}`)} style={{ fontWeight: 500 }}>
          {v}
        </a>
      ),
    },
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_: unknown, r: PurchaseOrder) => r.supplier?.name ?? r.supplierId.slice(0, 8) + '…',
    },
    {
      title: 'PO Date',
      dataIndex: 'poDate',
      key: 'poDate',
      render: (v: string) => format(new Date(v), 'dd MMM yyyy'),
      width: 120,
    },
    {
      title: 'Expected',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      render: (v: string) => format(new Date(v), 'dd MMM yyyy'),
      width: 120,
    },
    {
      title: 'Lines',
      key: 'lines',
      width: 70,
      render: (_: unknown, r: PurchaseOrder) => r.lines?.length ?? 0,
    },
    {
      title: 'Total (incl. GST)',
      key: 'total',
      width: 150,
      render: (_: unknown, r: PurchaseOrder) => {
        const total = calcTotal(r);
        return total > 0 ? `₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (v: PurchaseOrderStatus) => (
        <Tag color={PO_STATUS_COLOR[v] ?? 'default'}>{v.replace('_', ' ')}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => format(new Date(v), 'dd MMM yyyy'),
      width: 120,
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, r: PurchaseOrder) => (
        <Tooltip title="View">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/purchase-orders/${r.id}`)}
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
          Purchase Orders
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/admin/purchase-orders/new')}
        >
          New PO
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }} bodyStyle={{ padding: '16px 20px' }}>
        <Space wrap>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 160 }}
            options={STATUSES.map((s) => ({ label: s.replace('_', ' '), value: s }))}
            onChange={(v) => setFilters((f) => ({ ...f, status: v, page: 1 }))}
          />
          <RangePicker
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
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: data?.meta?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} purchase orders`,
            onChange: (page, limit) => setFilters((f) => ({ ...f, page, limit })),
          }}
          scroll={{ x: 900 }}
        />
      </Card>
    </>
  );
}
