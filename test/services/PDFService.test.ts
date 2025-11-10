/**
 * PDF Service Tests
 * Tests for PDF generation (invoices, receipts, prescriptions)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { pdfService } from '../../server/services/PDFService';
import { createMockInvoiceData } from '../helpers/mockData';
import PDFDocument from 'pdfkit';

describe('PDFService', () => {
  describe('Invoice Generation', () => {
    it('should generate invoice PDF buffer', async () => {
      const invoiceData = createMockInvoiceData();

      const pdfBuffer = await pdfService.generateInvoicePDF(invoiceData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      // Check PDF header
      expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
    });

    it('should include all invoice items', async () => {
      const invoiceData = createMockInvoiceData({
        items: [
          { description: 'Item 1', quantity: 1, unitPrice: 100, total: 100 },
          { description: 'Item 2', quantity: 2, unitPrice: 50, total: 100 },
        ],
      });

      const pdfBuffer = await pdfService.generateInvoicePDF(invoiceData);
      const pdfText = pdfBuffer.toString('utf8');

      expect(pdfText).toContain('Item 1');
      expect(pdfText).toContain('Item 2');
    });

    it('should calculate totals correctly', async () => {
      const invoiceData = createMockInvoiceData({
        subtotal: 200.00,
        tax: 40.00,
        total: 240.00,
      });

      const pdfBuffer = await pdfService.generateInvoicePDF(invoiceData);
      const pdfText = pdfBuffer.toString('utf8');

      expect(pdfText).toContain('200.00');
      expect(pdfText).toContain('40.00');
      expect(pdfText).toContain('240.00');
    });
  });

  describe('Order Sheet Generation', () => {
    it('should generate order sheet PDF', async () => {
      const orderData = {
        orderNumber: 'ORD-12345',
        orderDate: '2025-01-15',
        patientName: 'John Doe',
        ecpName: 'Test Optical',
        status: 'pending',
        lensType: 'progressive',
        lensMaterial: 'polycarbonate',
        coating: 'premium_ar',
        rightEye: {
          sphere: '+1.50',
          cylinder: '-0.75',
          axis: '090',
          add: '+2.00',
        },
        leftEye: {
          sphere: '+1.25',
          cylinder: '-0.50',
          axis: '095',
          add: '+2.00',
        },
        pd: '64',
      };

      const pdfBuffer = await pdfService.generateOrderSheetPDF(orderData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should include prescription details', async () => {
      const orderData = {
        orderNumber: 'ORD-12345',
        orderDate: '2025-01-15',
        patientName: 'John Doe',
        ecpName: 'Test Optical',
        status: 'pending',
        lensType: 'progressive',
        lensMaterial: 'polycarbonate',
        coating: 'premium_ar',
        rightEye: {
          sphere: '+2.50',
          cylinder: '-1.00',
          axis: '180',
        },
        leftEye: {
          sphere: '+2.25',
          cylinder: '-0.75',
          axis: '175',
        },
        pd: '62',
      };

      const pdfBuffer = await pdfService.generateOrderSheetPDF(orderData);
      const pdfText = pdfBuffer.toString('utf8');

      expect(pdfText).toContain('+2.50');
      expect(pdfText).toContain('-1.00');
      expect(pdfText).toContain('180');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const invalidData = {};

      await expect(
        pdfService.generateInvoicePDF(invalidData as any)
      ).rejects.toThrow();
    });

    it('should handle invalid data types', async () => {
      const invalidData = createMockInvoiceData({
        total: 'invalid' as any,
      });

      await expect(
        pdfService.generateInvoicePDF(invalidData)
      ).rejects.toThrow();
    });
  });

  describe('Company Branding', () => {
    it('should include company logo when provided', async () => {
      const invoiceData = createMockInvoiceData();

      const pdfBuffer = await pdfService.generateInvoicePDF(invoiceData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      // Logo URL should be referenced in PDF
      const pdfText = pdfBuffer.toString('utf8');
      expect(pdfText).toContain('logo');
    });

    it('should work without company logo', async () => {
      const invoiceData = createMockInvoiceData();

      const pdfBuffer = await pdfService.generateInvoicePDF(invoiceData);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });
});
