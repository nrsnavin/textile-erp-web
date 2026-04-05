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
  Timeline,
  Typography,
  message,
  Tabs,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { buyersApi } from '@/lib/api/buyers';
import type { Buyer } from '@/lib/api/types';
import BuyerModal from '../BuyerModal';

const { Title, Text } = Typography;

const SEGMENT_COLOR: Record<string, string> = { A: 'green', B: 'blue', C: 'orange' };

export default function BuyerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, msgCtx] = message.useMessage();

  const { data: buyer, isLoading } = useQuery({
    queryKey: ['buyer', params.id],
    queryFn: () => buyersApi.get(params.id),
  });

  const { data: stats } = useQuery({
    queryKey: ['buyer-stats', params.id],
    queryFn: () => buyersApi.stats(params.id),
    enabled: !!buyer,
  });

  const { data: audit } = useQuery({
    queryKey: ['buyer-audit', params.id],
    queryFn: () => buyersApi.audit(params.id),
    enabled: !!buyer,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => buyersApi.deactivate(params.id),
    onSuccess: () => {
      msg.success('Buyer deactivated');
      qc.invalidateQueries({ queryKey: ['buyer', params.id] });
    },
    onError: (e: Error) => msg.error(e.message),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => buyersApi.reactivate(params.id),
    onSuccess: () => {
      msg.success('Buyer reactivated');
      qc.invalidateQueries({ queryKey: ['buyer', params.id] });
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

  if (!buyer) {
    return <div>Buyer not found.</div>;
  }

  const auditColumns = [
    { title: 'Action', dataIndex: 'action', key: 'action', width: 100 },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => format(new Date(v), 'dd MMM yyyy HH:mm'),
    },
    { title: 'By', dataIndex: 'userId', key: 'userId', ellipsis: true },
    { title: 'IP', dataIndex: 'ipAddress', key: 'ipAddress', width: 130 },
  ];

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
            onClick={() => router.push('/admin/buyers')}
          />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {buyer.name}
            </Title>
            <Space style={{ marginTop: 4 }}>
              <Tag color={buyer.isActive ? 'success' : 'error'}>
                {buyer.isActive ? 'Active' : 'Inactive'}
              </Tag>
              {buyer.segment && (
                <Tag color={SEGMENT_COLOR[buyer.segment]}>Segment {buyer.segment}</Tag>
              )}
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID: {buyer.id.slice(0, 8)}…
              </Text>
            </Space>
          </div>
        </Space>

        <Space>
          <Button icon={<EditOutlined />} onClick={() => setModalOpen(true)}>
            Edit
          </Button>
          {buyer.isActive ? (
            <Popconfirm
              title="Deactivate this buyer?"
              onConfirm={() => deactivateMutation.mutate()}
            >
              <Button danger icon={<StopOutlined />}>
                Deactivate
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Reactivate this buyer?"
              onConfirm={() => reactivateMutation.mutate()}
            >
              <Button icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>
                Reactivate
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total Orders', value: stats?.totalOrders ?? '—' },
          { title: 'GMV', value: stats ? `${buyer.currency} ${stats.gmv?.toLocaleString()}` : '—' },
          {
            title: 'Outstanding',
            value: stats
              ? `${buyer.currency} ${stats.outstandingBalance?.toLocaleString()}`
              : '—',
          },
          {
            title: 'Avg Order Value',
            value: stats
              ? `${buyer.currency} ${stats.averageOrderValue?.toLocaleString()}`
              : '—',
          },
        ].map(({ title, value }) => (
          <Col xs={12} sm={6} key={title}>
            <Card style={{ borderRadius: 10, textAlign: 'center' }}>
              <Statistic title={title} value={value} valueStyle={{ fontSize: 20 }} />
            </Card>
          </Col>
        ))}
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
                  <Descriptions.Item label="Name">{buyer.name}</Descriptions.Item>
                  <Descriptions.Item label="Country">{buyer.country}</Descriptions.Item>
                  <Descriptions.Item label="Currency">{buyer.currency}</Descriptions.Item>
                  <Descriptions.Item label="Email">{buyer.email ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Phone">{buyer.phone ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Website">
                    {buyer.website ? (
                      <a href={buyer.website} target="_blank" rel="noreferrer">
                        {buyer.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Terms">
                    {buyer.paymentTerms ?? '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Credit Limit">
                    {buyer.creditLimit != null
                      ? `${buyer.currency} ${buyer.creditLimit.toLocaleString()}`
                      : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Credit Days">
                    {buyer.creditDays != null ? `${buyer.creditDays} days` : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tax ID">{buyer.taxId ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Segment">
                    {buyer.segment ? (
                      <Tag color={SEGMENT_COLOR[buyer.segment]}>{buyer.segment}</Tag>
                    ) : (
                      '—'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created">
                    {format(new Date(buyer.createdAt), 'dd MMM yyyy')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Address" span={3}>
                    {buyer.address ?? '—'}
                  </Descriptions.Item>
                </Descriptions>
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

      <BuyerModal
        open={modalOpen}
        buyer={buyer}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          qc.invalidateQueries({ queryKey: ['buyer', params.id] });
          qc.invalidateQueries({ queryKey: ['buyers'] });
          msg.success('Buyer updated');
        }}
      />
    </>
  );
}
