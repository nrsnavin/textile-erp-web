'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Typography,
  theme,
  Space,
  Breadcrumb,
  Spin,
} from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  InboxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
  KeyOutlined,
  BellOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth.store';
import { authClient, tokenStore } from '@/lib/auth/auth-client';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: '/admin/dashboard',       icon: <DashboardOutlined />,    label: 'Dashboard' },
  { key: '/admin/buyers',          icon: <TeamOutlined />,         label: 'Buyers' },
  { key: '/admin/orders',          icon: <FileTextOutlined />,     label: 'Orders' },
  { key: '/admin/suppliers',       icon: <ShopOutlined />,         label: 'Suppliers' },
  { key: '/admin/purchase-orders', icon: <ShoppingCartOutlined />, label: 'Purchase Orders' },
  { key: '/admin/inventory',       icon: <InboxOutlined />,        label: 'Inventory' },
];

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((part, idx) => {
    const href = '/' + parts.slice(0, idx + 1).join('/');
    const label =
      part === 'admin'
        ? 'Home'
        : part.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return { label, href };
  });
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { token } = theme.useToken();
  const { user, clearAuth, initFromSession } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady]         = useState(false);

  useEffect(() => {
    initFromSession();
    // Check if there's a session; redirect to login if not
    const rt = tokenStore.getRefreshToken();
    if (!rt) {
      router.replace('/auth/login');
    } else {
      setReady(true);
    }
  }, []);

  const activeKey    = NAV_ITEMS.find((item) => pathname.startsWith(item.key))?.key ?? '';
  const breadcrumbs  = getBreadcrumbs(pathname);

  async function handleLogout() {
    const access  = tokenStore.getAccessToken();
    const refresh = tokenStore.getRefreshToken();
    if (access) {
      try { await authClient.logout(access, refresh ?? undefined); } catch { /* ignore */ }
    }
    clearAuth();
    router.replace('/auth/login');
  }

  const userMenuItems = [
    { key: 'profile',         icon: <UserOutlined />,  label: 'Profile' },
    { key: 'change-password', icon: <KeyOutlined />,   label: 'Change Password' },
    { type: 'divider' as const },
    { key: 'logout',          icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  function onUserMenuClick({ key }: { key: string }) {
    if (key === 'logout')          handleLogout();
    if (key === 'change-password') router.push('/admin/change-password');
  }

  // Show spinner while checking session
  if (!ready) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        collapsedWidth={64}
        style={{
          background: '#0d1b2e',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {collapsed ? (
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, #1e50a0, #2d78d4)',
              borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16,
            }}>T</div>
          ) : (
            <Space>
              <div style={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, #1e50a0, #2d78d4)',
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', fontWeight: 700,
                fontSize: 16, flexShrink: 0,
              }}>T</div>
              <Text style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Textile ERP</Text>
            </Space>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          style={{ background: '#0d1b2e', border: 'none', marginTop: 8 }}
          items={NAV_ITEMS.map((item) => ({
            ...item,
            onClick: () => router.push(item.key),
          }))}
        />
      </Sider>

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <Layout style={{ marginLeft: collapsed ? 64 : 220, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          height: 64,
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            <Breadcrumb
              items={breadcrumbs.map(({ label, href }) => ({
                title: <Link href={href}>{label}</Link>,
              }))}
            />
          </Space>

          <Space size={16}>
            <Button type="text" icon={<BellOutlined />} style={{ fontSize: 16 }} />
            <Dropdown
              menu={{ items: userMenuItems, onClick: onUserMenuClick }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  style={{ background: token.colorPrimary }}
                  size={34}
                  icon={<UserOutlined />}
                />
                {!collapsed && (
                  <Text style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name ?? 'User'}
                  </Text>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Page content */}
        <Content style={{ margin: '24px', minHeight: 'calc(100vh - 112px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
