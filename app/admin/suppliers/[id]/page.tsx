'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
  Tabs,
  Popconfirm,
  Progress,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  StopOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { suppliersApi, purchaseOrdersApi } from '@/lib/api/suppliers';
import type { Supplier, PurchaseOrder, SupplierService } from '@/lib/api/types';
import SupplierModal from '../SupplierModal';

const { Title, Text } = Typography;

const SERVICE_COLORS: Record<SupplierService, string> = {
  FABRIC: 'blue',
  KNITTING: 'purple',
  DYEING: 'cyan',
  PRINTING: 'geekblue',
  SEWING: 'magenta',
  PACKING: 'orange',
  EMBROIDERY: 'gold',
};

const PO_STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default',
  SENT: 'processing',
  ACKNOWLEDGED: 'blue',
  PART_RECEIVED: 'warning',
  CLOSED: 'success',
  CANCELLED: 'error',
};

export default function SupplierDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, msgCtx] = message.useMessage();

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', params.id],
    queryFn: () => suppliersApi.get(params.id),
  });

  const { data: stats } = useQuery({
    queryKey: ['supplier-stats', params.id],
    queryFn: () => suppliersApi.stats(params.id),
    enabled: !!supplier,
  });

  const { data: audit } = useQuery({
    queryKey: ['supplier-audit', params.id],
    queryFn: () => suppliersApi.audit(params.id),
    enabled: !!supplier,
  });

  const { data: pos } = useQuery({
    queryKey: ['purchase-orders', { supplierId: params.id }],
    queryFn: () => purchaseOrdersApi.list({ supplierId: params.id, limit: 50 }),
    enabled: !!supplier,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => suppliersApi.deactivate(params.id),
    onSuccess: () => {
      msg.success('Supplier deactivated');
      qc.invalidateQueries({ queryKey: ['supplier', params.id] });
    },
    onError: (e: Error) => msg.error(e.message),
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!supplier) return <div>Supplier not found.</div>;

  const poColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (v: string, r: PurchaseOrder) => (
        <a onClick={() => router.push(`/admin/purchase-orders/${r.id}`)}>{v}</a>
      ),
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
      title: 'Lines',
      dataIndex: 'lines',
      key: 'lines',
      render: (lines: unknown[]) => lines?.length ?? 0,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={PO_STATUS_COLOR[v] ?? 'default'}>{v.replace('_', ' ')}</Tag>
      ),
    },
  ];

  const auditColumns = [
    { title: 'Action', dataIndex: 'action', key: 'action', width: 100 },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => format(new Date(v), 'dd MMM yyyy HH:mm'),
    },
    { title: 'By', dataIndex: 'userId', key: 'userId', ellipsis: true },
  ];

  const vendorScore = supplier.vendorScore ?? 100;
  const scoreColor = vendorScore >= 80 ? '#52c41a' : vendorScore >= 50 ? '#faad14' : '#ff4d4f';

  return (
    <>
      {msgCtx}

      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Space align="start">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin/suppliers')}
          />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {supplier.name}
            </Title>
            <Space style={{ marginTop: 4 }}>
              <Tag color={supplier.isActive ? 'success' : 'error'}>
                {supplier.isActive ? 'Active' : 'Inactive'}
              </Tag>
              {supplier.services?.map((s) => (
                <Tag key={s} color={SERVICE_COLORS[s]}>
                  {s}
                </Tag>
              ))}
            </Space>
          </div>
        </Space>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => setModalOpen(true)}>
            Edit
          </Button>
          {supplier.isActive && (
            <Popconfirm
              title="Deactivate this supplier?"
              onConfirm={() => deactivateMutation.mutate()}
            >
              <Button danger icon={<StopOutlined />}>
                Deactivate
              </Button>
            </Popconfirm>
          )}
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() =>
              router.push(`/admin/purchase-orders/new?supplierId=${params.id}`)
            }
          >
            New PO
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic
              title="Total Purchase Orders"
              value={stats?.totalPOs ?? pos?.meta?.total ?? 0}
              valueStyle={{ fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 10 }}>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              Vendor Score
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 28, fontWeight: 700, color: scoreColor }}>
                {vendorScore.toFixed(1)}
              </Text>
              <Progress
                percent={vendorScore}
                strokeColor={scoreColor}
                showInfo={false}
                style={{ flex: 1 }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic
              title="Total Value"
              value={
                stats?.totalValue
                  ? `₹ ${stats.totalValue.toLocaleString()}`
                  : '—'
              }
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="details"
        items={[
          {
            key: 'details',
            label: 'Details',
            children: (
              <Card style={{ borderRadius: 12 }}>
                <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered size="small">
                  <Descriptions.Item label="Name">{supplier.name}</Descriptions.Item>
                  <Descriptions.Item label="Contact Person">
                    {supplier.contactPerson ?? '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">{supplier.email ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Phone">{supplier.phone ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="GSTIN">{supplier.gstin ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="PAN">{supplier.pan ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Payment Terms">
                    {supplier.paymentTerms ?? '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Credit Days">
                    {supplier.creditDays != null ? `${supplier.creditDays} days` : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Bank Name">
                    {supplier.bankName ?? '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Bank IFSC">
                    {supplier.bankIfsc ?? '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Bank Account">
                    {supplier.bankAccount ?? '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Website">
                    {supplier.website ? (
                      <a href={supplier.website} target="_blank" rel="noreferrer">
                        {supplier.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created">
                    {format(new Date(supplier.createdAt), 'dd MMM yyyy')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Address" span={2}>
                    {supplier.address ?? '—'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ),
          },
          {
            key: 'purchase-orders',
            label: `Purchase Orders (${pos?.meta?.total ?? 0})`,
            children: (
              <Card style={{ borderRadius: 12 }}>
                <Table
                  dataSource={pos?.data ?? []}
                  columns={poColumns}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'audit',
            label: 'Audit Trail',
            children: (
              <Card style={{ borderRadius: 12 }}>
                <Table
                  dataSource={audit ?? []}
                  columns={auditColumns}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
        ]}
      />

      <SupplierModal
        open={modalOpen}
        supplier={supplier}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          qc.invalidateQueries({ queryKey: ['supplier', params.id] });
          qc.invalidateQueries({ queryKey: ['suppliers'] });
          msg.success('Supplier updated');
        }}
      />
    </>
  );
}
