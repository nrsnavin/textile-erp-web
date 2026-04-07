'use client';

import {
  Button,
  Card,
  Col,
  Descriptions,
  Popconfirm,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ordersApi } from '@/lib/api/orders';
import type { Order, OrderLine, OrderRevision, OrderStatus } from '@/lib/api/types';

const { Title, Text } = Typography;

const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  DRAFT:         'default',
  CONFIRMED:     'processing',
  IN_PRODUCTION: 'blue',
  QC_PASSED:     'cyan',
  DISPATCHED:    'success',
  CANCELLED:     'error',
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [msg, msgCtx] = message.useMessage();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['orders', params.id],
    queryFn: () => ordersApi.get(params.id),
  });

  const confirmMutation = useMutation({
    mutationFn: () => ordersApi.confirm(params.id),
    onSuccess: () => {
      msg.success('Order confirmed');
      qc.invalidateQueries({ queryKey: ['orders', params.id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e: Error) => msg.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(params.id),
    onSuccess: () => {
      msg.success('Order cancelled');
      qc.invalidateQueries({ queryKey: ['orders', params.id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e: Error) => msg.error(e.message),
  });

  const dispatchMutation = useMutation({
    mutationFn: () => ordersApi.dispatch(params.id),
    onSuccess: () => {
      msg.success('Order marked as dispatched');
      qc.invalidateQueries({ queryKey: ['orders', params.id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e: Error) => msg.error(e.message),
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return <Text type="danger">Order not found.</Text>;
  }

  const lines: OrderLine[] = order.lines ?? order.linesJson ?? [];

  function formatSizes(sizesJson: Record<string, number>) {
    return Object.entries(sizesJson)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}:${v}`)
      .join('  ');
  }

  const lineColumns = [
    { title: 'Style Code', dataIndex: 'styleCode', key: 'styleCode', width: 120 },
    {
      title: 'Item',
      key: 'item',
      render: (_: unknown, r: OrderLine) => r.item?.name ?? r.itemId.slice(0, 8) + '…',
    },
    {
      title: 'Colour',
      dataIndex: 'colour',
      key: 'colour',
      width: 100,
      render: (v?: string) => v ?? <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Sizes',
      key: 'sizes',
      render: (_: unknown, r: OrderLine) => (
        <Text code style={{ fontSize: 12 }}>
          {formatSizes(r.sizesJson ?? {})}
        </Text>
      ),
    },
    {
      title: 'Qty',
      key: 'qty',
      width: 80,
      render: (_: unknown, r: OrderLine) => {
        const total = Object.values(r.sizesJson ?? {}).reduce((a, b) => a + b, 0);
        return total.toLocaleString();
      },
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 110,
      render: (v?: number) =>
        v != null ? `$${v.toFixed(2)}` : <span style={{ color: '#bbb' }}>—</span>,
    },
  ];

  const revisions: OrderRevision[] = order.revisions ?? [];

  return (
    <>
      {msgCtx}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin/orders')}
        />
        <Title level={3} style={{ margin: 0 }}>
          Order — {order.poNumber}
        </Title>
        <Tag color={ORDER_STATUS_COLOR[order.status]}>{order.status.replace(/_/g, ' ')}</Tag>
      </div>

      {/* Header card */}
      <Card style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Row gutter={[0, 0]} justify="space-between" align="middle">
          <Col>
            <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
              <Descriptions.Item label="Buyer">
                <Text strong>{order.buyer?.name ?? order.buyerId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="PO Number">
                <Text strong>{order.poNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Date">
                {format(new Date(order.deliveryDate), 'dd MMM yyyy')}
              </Descriptions.Item>
              <Descriptions.Item label="Season">
                {order.season ?? <span style={{ color: '#bbb' }}>—</span>}
              </Descriptions.Item>
              <Descriptions.Item label="Total Qty">
                {(order.totalQty ?? 0).toLocaleString()} pcs
              </Descriptions.Item>
              <Descriptions.Item label="Total Styles">
                {order.totalStyles ?? lines.length}
              </Descriptions.Item>
              {order.remarks && (
                <Descriptions.Item label="Remarks" span={3}>
                  {order.remarks}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>
          <Col>
            <Space>
              {order.status === 'DRAFT' && (
                <Popconfirm
                  title="Confirm this order?"
                  description="The buyer will be notified and production can begin."
                  onConfirm={() => confirmMutation.mutate()}
                  okText="Confirm"
                  cancelText="Cancel"
                >
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={confirmMutation.isPending}
                  >
                    Confirm Order
                  </Button>
                </Popconfirm>
              )}
              {order.status === 'QC_PASSED' && (
                <Popconfirm
                  title="Mark as Dispatched?"
                  description="This action confirms shipment to the buyer."
                  onConfirm={() => dispatchMutation.mutate()}
                  okText="Dispatch"
                  cancelText="Cancel"
                >
                  <Button
                    type="primary"
                    icon={<RocketOutlined />}
                    loading={dispatchMutation.isPending}
                  >
                    Mark Dispatched
                  </Button>
                </Popconfirm>
              )}
              {(order.status === 'DRAFT' ||
                order.status === 'CONFIRMED' ||
                order.status === 'IN_PRODUCTION') && (
                <Popconfirm
                  title="Cancel this order?"
                  description="This cannot be undone."
                  onConfirm={() => cancelMutation.mutate()}
                  okText="Yes, Cancel"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    loading={cancelMutation.isPending}
                  >
                    Cancel Order
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Lines table */}
      <Card
        title="Line Items"
        style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table
          dataSource={lines}
          columns={lineColumns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 700 }}
          locale={{ emptyText: 'No line items' }}
        />
      </Card>

      {/* Revisions timeline */}
      {revisions.length > 0 && (
        <Card
          title="Revision History"
          style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <Timeline
            items={revisions.map((rev) => ({
              key: rev.id,
              children: (
                <div>
                  <Text strong>Revision #{rev.revisionNo}</Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    {format(new Date(rev.createdAt), 'dd MMM yyyy, HH:mm')}
                  </Text>
                  {rev.reason && (
                    <div style={{ color: '#666', marginTop: 2, fontStyle: 'italic' }}>
                      Reason: {rev.reason}
                    </div>
                  )}
                  {rev.changedFields && Object.keys(rev.changedFields).length > 0 && (
                    <ul style={{ margin: '6px 0 0 0', paddingLeft: 18, fontSize: 13 }}>
                      {Object.entries(rev.changedFields).map(([field, diff]) => (
                        <li key={field}>
                          <Text code>{field}</Text>:{' '}
                          <Text delete style={{ color: '#cf1322' }}>
                            {String(diff.before)}
                          </Text>
                          {' → '}
                          <Text style={{ color: '#389e0d' }}>{String(diff.after)}</Text>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ),
            }))}
          />
        </Card>
      )}
    </>
  );
}
