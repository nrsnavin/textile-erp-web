'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { buyersApi } from '@/lib/api/buyers';
import type { Buyer, BuyerFilterParams, BuyerSegment, PaymentTerms } from '@/lib/api/types';
import BuyerModal from './BuyerModal';

const { Title } = Typography;
const { Search } = Input;

const SEGMENT_COLOR: Record<BuyerSegment, string> = {
  A: 'green',
  B: 'blue',
  C: 'orange',
};

export default function BuyersPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filters, setFilters] = useState<BuyerFilterParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [msg, msgCtx] = message.useMessage();

  const { data, isLoading } = useQuery({
    queryKey: ['buyers', filters],
    queryFn: () => buyersApi.list(filters),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => buyersApi.deactivate(id),
    onSuccess: () => {
      msg.success('Buyer deactivated');
      qc.invalidateQueries({ queryKey: ['buyers'] });
    },
    onError: (e: Error) => msg.error(e.message),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => buyersApi.reactivate(id),
    onSuccess: () => {
      msg.success('Buyer reactivated');
      qc.invalidateQueries({ queryKey: ['buyers'] });
    },
    onError: (e: Error) => msg.error(e.message),
  });

  function openCreate() {
    setEditingBuyer(null);
    setModalOpen(true);
  }

  function openEdit(buyer: Buyer) {
    setEditingBuyer(buyer);
    setModalOpen(true);
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Buyer) => (
        <a onClick={() => router.push(`/admin/buyers/${record.id}`)} style={{ fontWeight: 500 }}>
          {name}
        </a>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 90,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      width: 90,
    },
    {
      title: 'Segment',
      dataIndex: 'segment',
      key: 'segment',
      width: 90,
      render: (v?: BuyerSegment) =>
        v ? <Tag color={SEGMENT_COLOR[v]}>{v}</Tag> : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Payment Terms',
      dataIndex: 'paymentTerms',
      key: 'paymentTerms',
      render: (v?: PaymentTerms) => v ?? <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Credit Limit',
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      render: (v?: number) =>
        v != null ? v.toLocaleString() : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'error'}>{v ? 'Active' : 'Inactive'}</Tag>
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
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Buyer) => (
        <Space size={4}>
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/admin/buyers/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          {record.isActive ? (
            <Tooltip title="Deactivate">
              <Popconfirm
                title="Deactivate this buyer?"
                onConfirm={() => deactivateMutation.mutate(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<StopOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          ) : (
            <Tooltip title="Reactivate">
              <Popconfirm
                title="Reactivate this buyer?"
                onConfirm={() => reactivateMutation.mutate(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {msgCtx}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Buyers</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Buyer
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }} bodyStyle={{ padding: '16px 20px' }}>
        <Space wrap>
          <Search
            placeholder="Search buyers..."
            allowClear
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
            onSearch={(v) => setFilters((f) => ({ ...f, search: v || undefined, page: 1 }))}
          />
          <Select
            placeholder="Segment"
            allowClear
            style={{ width: 120 }}
            options={[
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
              { label: 'C', value: 'C' },
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, segment: v, page: 1 }))}
          />
          <Select
            placeholder="Payment Terms"
            allowClear
            style={{ width: 150 }}
            options={['NET30', 'NET60', 'NET90', 'IMMEDIATE', 'ADVANCE'].map((t) => ({
              label: t,
              value: t,
            }))}
            onChange={(v) => setFilters((f) => ({ ...f, paymentTerms: v, page: 1 }))}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 120 }}
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                isActive: v === undefined ? undefined : v === 'true',
                page: 1,
              }))
            }
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
            showTotal: (total) => `${total} buyers`,
            onChange: (page, limit) => setFilters((f) => ({ ...f, page, limit })),
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      <BuyerModal
        open={modalOpen}
        buyer={editingBuyer}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          qc.invalidateQueries({ queryKey: ['buyers'] });
          msg.success(editingBuyer ? 'Buyer updated' : 'Buyer created');
        }}
      />
    </>
  );
}
