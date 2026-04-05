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
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { suppliersApi } from '@/lib/api/suppliers';
import type { Supplier, SupplierFilterParams, SupplierService, PaymentTerms } from '@/lib/api/types';
import SupplierModal from './SupplierModal';

const { Title } = Typography;
const { Search } = Input;

const SERVICE_COLORS: Record<SupplierService, string> = {
  FABRIC: 'blue',
  KNITTING: 'purple',
  DYEING: 'cyan',
  PRINTING: 'geekblue',
  SEWING: 'magenta',
  PACKING: 'orange',
  EMBROIDERY: 'gold',
};

const SERVICES: SupplierService[] = [
  'FABRIC',
  'KNITTING',
  'DYEING',
  'PRINTING',
  'SEWING',
  'PACKING',
  'EMBROIDERY',
];

export default function SuppliersPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filters, setFilters] = useState<SupplierFilterParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [msg, msgCtx] = message.useMessage();

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () => suppliersApi.list(filters),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => suppliersApi.deactivate(id),
    onSuccess: () => {
      msg.success('Supplier deactivated');
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (e: Error) => msg.error(e.message),
  });

  function openCreate() {
    setEditingSupplier(null);
    setModalOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setModalOpen(true);
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Supplier) => (
        <a
          onClick={() => router.push(`/admin/suppliers/${record.id}`)}
          style={{ fontWeight: 500 }}
        >
          {name}
        </a>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      render: (v?: string) => v ?? <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Services',
      dataIndex: 'services',
      key: 'services',
      render: (services?: SupplierService[]) =>
        services?.length
          ? services.map((s) => (
              <Tag key={s} color={SERVICE_COLORS[s]} style={{ marginBottom: 2 }}>
                {s}
              </Tag>
            ))
          : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Vendor Score',
      dataIndex: 'vendorScore',
      key: 'vendorScore',
      width: 110,
      render: (v: number) => {
        const color = v >= 80 ? '#52c41a' : v >= 50 ? '#faad14' : '#ff4d4f';
        return <span style={{ color, fontWeight: 600 }}>{v?.toFixed(1)}</span>;
      },
    },
    {
      title: 'Payment Terms',
      dataIndex: 'paymentTerms',
      key: 'paymentTerms',
      render: (v?: PaymentTerms) => v ?? <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'GSTIN',
      dataIndex: 'gstin',
      key: 'gstin',
      ellipsis: true,
      render: (v?: string) => v ?? <span style={{ color: '#bbb' }}>—</span>,
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
      width: 100,
      render: (_: unknown, record: Supplier) => (
        <Space size={4}>
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/admin/suppliers/${record.id}`)}
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
          {record.isActive && (
            <Tooltip title="Deactivate">
              <Popconfirm
                title="Deactivate this supplier?"
                onConfirm={() => deactivateMutation.mutate(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" size="small" danger icon={<StopOutlined />} />
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
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Suppliers
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Supplier
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }} bodyStyle={{ padding: '16px 20px' }}>
        <Space wrap>
          <Search
            placeholder="Search suppliers..."
            allowClear
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
            onSearch={(v) => setFilters((f) => ({ ...f, search: v || undefined, page: 1 }))}
          />
          <Select
            placeholder="Service"
            allowClear
            style={{ width: 150 }}
            options={SERVICES.map((s) => ({ label: s, value: s }))}
            onChange={(v) => setFilters((f) => ({ ...f, service: v, page: 1 }))}
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
            showTotal: (total) => `${total} suppliers`,
            onChange: (page, limit) => setFilters((f) => ({ ...f, page, limit })),
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <SupplierModal
        open={modalOpen}
        supplier={editingSupplier}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          qc.invalidateQueries({ queryKey: ['suppliers'] });
          msg.success(editingSupplier ? 'Supplier updated' : 'Supplier created');
        }}
      />
    </>
  );
}
