'use client';

import { Card, Col, Row, Space, Statistic, Table, Tag, Typography, Spin, Empty } from 'antd';
import {
  TeamOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  RiseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { buyersApi } from '@/lib/api/buyers';
import { suppliersApi, purchaseOrdersApi } from '@/lib/api/suppliers';
import type { PurchaseOrder } from '@/lib/api/types';
import { format } from 'date-fns';

const { Title, Text } = Typography;

const PO_STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default',
  SENT: 'processing',
  ACKNOWLEDGED: 'blue',
  PART_RECEIVED: 'warning',
  CLOSED: 'success',
  CANCELLED: 'error',
};

function StatCard({
  title,
  value,
  icon,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <Statistic
          title={<Text type="secondary" style={{ fontSize: 13 }}>{title}</Text>}
          value={loading ? '—' : value}
          valueStyle={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}
          loading={loading}
        />
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: buyers, isLoading: loadingBuyers } = useQuery({
    queryKey: ['buyers', 'summary'],
    queryFn: () => buyersApi.list({ limit: 1 }),
  });

  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers', 'summary'],
    queryFn: () => suppliersApi.list({ limit: 1 }),
  });

  const { data: pos, isLoading: loadingPos } = useQuery({
    queryKey: ['purchase-orders', 'recent'],
    queryFn: () => purchaseOrdersApi.list({ limit: 10, sortBy: 'createdAt', sortDir: 'desc' }),
  });

  const poColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (v: string, r: PurchaseOrder) => (
        <a href={`/admin/purchase-orders/${r.id}`}>{v}</a>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: ['supplier', 'name'],
      key: 'supplier',
      render: (_: unknown, r: PurchaseOrder) => r.supplier?.name ?? r.supplierId,
    },
    {
      title: 'PO Date',
      dataIndex: 'poDate',
      key: 'poDate',
      render: (v: string) => format(new Date(v), 'dd MMM yyyy'),
    },
    {
      title: 'Expected',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      render: (v: string) => format(new Date(v), 'dd MMM yyyy'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={PO_STATUS_COLOR[v] ?? 'default'}>{v.replace('_', ' ')}</Tag>
      ),
    },
    {
      title: 'Lines',
      dataIndex: 'lines',
      key: 'lines',
      render: (lines: unknown[]) => lines?.length ?? 0,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Dashboard
        </Title>
        <Text type="secondary">Welcome back! Here's your textile ERP overview.</Text>
      </div>

      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Buyers"
            value={buyers?.meta?.total ?? 0}
            icon={<TeamOutlined />}
            color="#1e50a0"
            loading={loadingBuyers}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Suppliers"
            value={suppliers?.meta?.total ?? 0}
            icon={<ShopOutlined />}
            color="#52c41a"
            loading={loadingSuppliers}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Purchase Orders"
            value={pos?.meta?.total ?? 0}
            icon={<ShoppingCartOutlined />}
            color="#fa8c16"
            loading={loadingPos}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Open POs"
            value={
              pos?.data?.filter((p) =>
                ['DRAFT', 'SENT', 'ACKNOWLEDGED', 'PART_RECEIVED'].includes(p.status),
              ).length ?? 0
            }
            icon={<FileTextOutlined />}
            color="#eb2f96"
            loading={loadingPos}
          />
        </Col>
      </Row>

      {/* Recent POs */}
      <Card
        title={
          <Space>
            <ShoppingCartOutlined />
            Recent Purchase Orders
          </Space>
        }
        extra={<a href="/admin/purchase-orders">View All</a>}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {loadingPos ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={pos?.data ?? []}
            columns={poColumns}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: <Empty description="No purchase orders yet" /> }}
            size="small"
          />
        )}
      </Card>
    </div>
  );
}

