'use client';

import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
  Popconfirm,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  CheckOutlined,
  LockOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { purchaseOrdersApi } from '@/lib/api/suppliers';
import type { PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus } from '@/lib/api/types';

const { Title, Text } = Typography;

const PO_STATUS_COLOR: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'default',
  SENT: 'processing',
  ACKNOWLEDGED: 'blue',
  PART_RECEIVED: 'warning',
  CLOSED: 'success',
  CANCELLED: 'error',
};


function calcLineTotal(line: PurchaseOrderLine) {
  const base = line.qty * line.rate;
  return base + (base * line.gstPct) / 100;
}

export default function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [msg, msgCtx] = message.useMessage();

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', params.id],
    queryFn: () => purchaseOrdersApi.get(params.id),
  });

  function onStatusSuccess(successMsg: string) {
    msg.success(successMsg);
    qc.invalidateQueries({ queryKey: ['purchase-order', params.id] });
    qc.invalidateQueries({ queryKey: ['purchase-orders'] });
  }

  const sendMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.send(params.id),
    onSuccess: () => onStatusSuccess('PO sent to supplier'),
    onError: (e: Error) => msg.error(e.message),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.acknowledge(params.id),
    onSuccess: () => onStatusSuccess('PO acknowledged'),
    onError: (e: Error) => msg.error(e.message),
  });

  const closeMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.close(params.id),
    onSuccess: () => onStatusSuccess('PO closed'),
    onError: (e: Error) => msg.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.cancel(params.id),
    onSuccess: () => onStatusSuccess('PO cancelled'),
    onError: (e: Error) => msg.error(e.message),
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!po) return <div>Purchase Order not found.</div>;

  const totals = po.lines?.reduce(
    (acc, l) => {
      const base = l.qty * l.rate;
      const tax = (base * l.gstPct) / 100;
      return { base: acc.base + base, tax: acc.tax + tax };
    },
    { base: 0, tax: 0 },
  ) ?? { base: 0, tax: 0 };

  const lineColumns = [
    {
      title: '#',
      key: 'idx',
      width: 50,
      render: (_: unknown, __: unknown, idx: number) => idx + 1,
    },
    {
      title: 'Item ID',
      dataIndex: 'itemId',
      key: 'itemId',
      ellipsis: true,
      render: (v: string) => v.slice(0, 12) + '…',
    },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'HSN', dataIndex: 'hsnCode', key: 'hsnCode', width: 90 },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      width: 80,
      render: (v: number, r: PurchaseOrderLine) => `${v} ${r.unit}`,
    },
    {
      title: 'Received',
      dataIndex: 'receivedQty',
      key: 'receivedQty',
      width: 90,
      render: (v: number, r: PurchaseOrderLine) => `${v} ${r.unit}`,
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
      width: 100,
      render: (v: number) =>
        `₹ ${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'GST %',
      dataIndex: 'gstPct',
      key: 'gstPct',
      width: 70,
      render: (v: number) => `${v}%`,
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      render: (_: unknown, r: PurchaseOrderLine) =>
        `₹ ${calcLineTotal(r).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    },
  ];

  const status = po.status;
  const isCancelled = status === 'CANCELLED';
  const isClosed = status === 'CLOSED';

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
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Space align="start">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin/purchase-orders')}
          />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {po.poNumber}
            </Title>
            <Space style={{ marginTop: 4 }}>
              <Tag color={PO_STATUS_COLOR[status]}>{status.replace('_', ' ')}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Created {format(new Date(po.createdAt), 'dd MMM yyyy')}
              </Text>
            </Space>
          </div>
        </Space>

        {!isCancelled && !isClosed && (
          <Space wrap>
            {status === 'DRAFT' && (
              <Popconfirm
                title="Send this PO to the supplier?"
                onConfirm={() => sendMutation.mutate()}
              >
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={sendMutation.isPending}
                >
                  Send to Supplier
                </Button>
              </Popconfirm>
            )}
            {status === 'SENT' && (
              <Popconfirm
                title="Mark as Acknowledged by supplier?"
                onConfirm={() => acknowledgeMutation.mutate()}
              >
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={acknowledgeMutation.isPending}
                >
                  Mark Acknowledged
                </Button>
              </Popconfirm>
            )}
            {(status === 'ACKNOWLEDGED' || status === 'PART_RECEIVED') && (
              <Popconfirm
                title="Close this Purchase Order?"
                onConfirm={() => closeMutation.mutate()}
              >
                <Button icon={<LockOutlined />} loading={closeMutation.isPending}>
                  Close PO
                </Button>
              </Popconfirm>
            )}
            <Popconfirm
              title="Cancel this Purchase Order?"
              okType="danger"
              onConfirm={() => cancelMutation.mutate()}
            >
              <Button
                danger
                icon={<CloseOutlined />}
                loading={cancelMutation.isPending}
              >
                Cancel
              </Button>
            </Popconfirm>
          </Space>
        )}
      </div>

      {isCancelled && (
        <Alert
          type="error"
          message="This Purchase Order has been cancelled."
          style={{ marginBottom: 16, borderRadius: 8 }}
          showIcon
        />
      )}
      {isClosed && (
        <Alert
          type="success"
          message="This Purchase Order is closed."
          style={{ marginBottom: 16, borderRadius: 8 }}
          showIcon
        />
      )}

      {/* PO Details */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 4 }} size="small">
          <Descriptions.Item label="Supplier">
            {po.supplier ? (
              <a onClick={() => router.push(`/admin/suppliers/${po.supplierId}`)}>
                {po.supplier.name}
              </a>
            ) : (
              po.supplierId
            )}
          </Descriptions.Item>
          <Descriptions.Item label="PO Date">
            {format(new Date(po.poDate), 'dd MMM yyyy')}
          </Descriptions.Item>
          <Descriptions.Item label="Expected Date">
            {format(new Date(po.expectedDate), 'dd MMM yyyy')}
          </Descriptions.Item>
          <Descriptions.Item label="Sent At">
            {po.sentAt ? format(new Date(po.sentAt), 'dd MMM yyyy HH:mm') : '—'}
          </Descriptions.Item>
          {po.remarks && (
            <Descriptions.Item label="Remarks" span={4}>
              {po.remarks}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Line Items */}
      <Card
        title="Line Items"
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table
          dataSource={po.lines ?? []}
          columns={lineColumns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
          size="small"
        />

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
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
              <strong>
                ₹ {totals.base.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
            >
              <span>Total GST</span>
              <strong>
                ₹ {totals.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Grand Total</strong>
              <strong style={{ color: '#1e50a0', fontSize: 16 }}>
                ₹{' '}
                {(totals.base + totals.tax).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
