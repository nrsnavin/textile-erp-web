'use client';

import { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Row,
  Col,
  message,
} from 'antd';
import { useMutation } from '@tanstack/react-query';
import { buyersApi } from '@/lib/api/buyers';
import type { Buyer, CreateBuyerDto } from '@/lib/api/types';

interface Props {
  open: boolean;
  buyer: Buyer | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_TERMS = ['NET30', 'NET60', 'NET90', 'IMMEDIATE', 'ADVANCE'];
const SEGMENTS = ['A', 'B', 'C'];

export default function BuyerModal({ open, buyer, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<CreateBuyerDto>();
  const [msg, msgCtx] = message.useMessage();

  useEffect(() => {
    if (open) {
      if (buyer) {
        form.setFieldsValue(buyer);
      } else {
        form.resetFields();
        form.setFieldsValue({ currency: 'USD' });
      }
    }
  }, [open, buyer, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateBuyerDto) => buyersApi.create(data),
    onSuccess,
    onError: (e: Error) => msg.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateBuyerDto>) => buyersApi.update(buyer!.id, data),
    onSuccess,
    onError: (e: Error) => msg.error(e.message),
  });

  async function handleSubmit() {
    const values = await form.validateFields();
    if (buyer) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const loading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {msgCtx}
      <Modal
        title={buyer ? 'Edit Buyer' : 'Add New Buyer'}
        open={open}
        onCancel={onClose}
        onOk={handleSubmit}
        okText={buyer ? 'Update' : 'Create'}
        confirmLoading={loading}
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Name is required', min: 2 }]}
              >
                <Input placeholder="Buyer company name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Country"
                name="country"
                rules={[
                  { required: true, message: 'Country is required' },
                  { max: 2, message: 'Use 2-letter country code (e.g. US, IN)' },
                ]}
              >
                <Input placeholder="US" maxLength={2} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ type: 'email', message: 'Enter a valid email' }]}
              >
                <Input placeholder="buyer@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="+1 234 567 8900" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Currency" name="currency">
                <Input placeholder="USD" maxLength={3} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Segment" name="segment">
                <Select
                  placeholder="Select segment"
                  allowClear
                  options={SEGMENTS.map((s) => ({ label: `Segment ${s}`, value: s }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Payment Terms" name="paymentTerms">
                <Select
                  placeholder="Select terms"
                  allowClear
                  options={PAYMENT_TERMS.map((t) => ({ label: t, value: t }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Credit Limit"
                name="creditLimit"
                rules={[{ type: 'number', min: 0, message: 'Must be ≥ 0' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  min={0}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v?.replace(/,/g, '') as unknown as number}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Credit Days"
                name="creditDays"
                rules={[{ type: 'number', min: 0, message: 'Must be ≥ 0' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="30" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tax ID / GST" name="taxId">
                <Input placeholder="VAT / GST / Tax number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Website"
                name="website"
                rules={[{ type: 'url', message: 'Enter a valid URL' }]}
              >
                <Input placeholder="https://example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Address" name="address">
            <Input.TextArea rows={2} placeholder="Full shipping / billing address" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
