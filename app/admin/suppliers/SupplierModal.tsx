'use client';

import { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { suppliersApi } from '@/lib/api/suppliers';
import type { Supplier, CreateSupplierDto, SupplierService } from '@/lib/api/types';

interface Props {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_TERMS = ['NET30', 'NET60', 'NET90', 'IMMEDIATE', 'ADVANCE'];
const SERVICES: SupplierService[] = [
  'FABRIC',
  'KNITTING',
  'DYEING',
  'PRINTING',
  'SEWING',
  'PACKING',
  'EMBROIDERY',
];

export default function SupplierModal({ open, supplier, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<CreateSupplierDto>();
  const [msg, msgCtx] = message.useMessage();

  useEffect(() => {
    if (open) {
      if (supplier) {
        form.setFieldsValue(supplier);
      } else {
        form.resetFields();
      }
    }
  }, [open, supplier, form]);

  const createMutation = useMutation({
    mutationFn: (data: CreateSupplierDto) => suppliersApi.create(data),
    onSuccess,
    onError: (e: Error) => msg.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateSupplierDto>) =>
      suppliersApi.update(supplier!.id, data),
    onSuccess,
    onError: (e: Error) => msg.error(e.message),
  });

  async function handleSubmit() {
    const values = await form.validateFields();
    if (supplier) {
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
        title={supplier ? 'Edit Supplier' : 'Add New Supplier'}
        open={open}
        onCancel={onClose}
        onOk={handleSubmit}
        okText={supplier ? 'Update' : 'Create'}
        confirmLoading={loading}
        width={720}
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
                <Input placeholder="Supplier company name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Contact Person" name="contactPerson">
                <Input placeholder="John Doe" />
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
                <Input placeholder="supplier@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="+91 9876543210" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="GSTIN"
                name="gstin"
                rules={[
                  {
                    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                    message: 'Enter a valid GSTIN',
                  },
                ]}
              >
                <Input placeholder="22AAAAA0000A1Z5" maxLength={15} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="PAN"
                name="pan"
                rules={[
                  {
                    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                    message: 'Enter a valid PAN (e.g. ABCDE1234F)',
                  },
                ]}
              >
                <Input placeholder="ABCDE1234F" maxLength={10} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Payment Terms" name="paymentTerms">
                <Select
                  placeholder="Select terms"
                  allowClear
                  options={PAYMENT_TERMS.map((t) => ({ label: t, value: t }))}
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

          <Form.Item label="Services Offered" name="services">
            <Select
              mode="multiple"
              placeholder="Select services"
              options={SERVICES.map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Bank Name" name="bankName">
                <Input placeholder="State Bank of India" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Bank IFSC"
                name="bankIfsc"
                rules={[
                  {
                    pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                    message: 'Enter a valid IFSC (e.g. SBIN0000001)',
                  },
                ]}
              >
                <Input placeholder="SBIN0000001" maxLength={11} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Bank Account" name="bankAccount">
                <Input placeholder="1234567890" />
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
            <Input.TextArea rows={2} placeholder="Full address" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
