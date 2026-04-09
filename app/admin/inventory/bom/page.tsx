'use client';

import {
  Button,
  Card,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { inventoryApi } from '@/lib/api/inventory';
import type { Bom } from '@/lib/api/types';

const { Title, Text } = Typography;

export default function BomListPage() {
  const router = useRouter();
  const [msg, msgCtx] = message.useMessage();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', 'boms'],
    queryFn: () => inventoryApi.listBoms({ limit: 100 }),
  });

  const columns = [
    {
      title: 'Finished Good',
      key: 'item',
      render: (_: unknown, r: Bom) =>
        r.item?.name ?? r.itemId.slice(0, 8) + '…',
    },
    {
      title: 'Style Code',
      dataIndex: 'styleCode',
      key: 'styleCode',
      width: 140,
      render: (v?: string) => v ?? <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 90,
      render: (v: number) => <Tag>v{v}</Tag>,
    },
    {
      title: 'Components',
      key: 'lines',
      width: 120,
      render: (_: unknown, r: Bom) => {
        const count = r.lines?.length ?? 0;
        return (
          <Text type={count > 0 ? undefined : 'secondary'}>
            {count > 0 ? `${count} lines` : '—'}
          </Text>
        );
      },
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (v: boolean) => (
        <Switch
          size="small"
          checked={v}
          disabled
        />
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
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, r: Bom) => (
        <Space size={4}>
          <Tooltip title="View BOM">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/admin/inventory/bom/${r.id}`)}
            />
          </Tooltip>
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
          Bills of Materials
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/admin/inventory/bom/new')}
        >
          New BOM
        </Button>
      </div>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Table
          dataSource={data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => `${t} BOMs`,
          }}
          scroll={{ x: 700 }}
          locale={{ emptyText: 'No BOMs found. Create your first BOM.' }}
        />
      </Card>
    </>
  );
}
