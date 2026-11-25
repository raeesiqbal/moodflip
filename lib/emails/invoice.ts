import jsPDF from 'jspdf';
import { minorUnitsToMajor } from '@/lib/payments/pricing';

export type InvoicePurchase = {
  order_number: string; product_name: string; paid_at: string;
  amount_minor: number; currency: string; currency_decimals: number;
  email: string;
};

export function generatePurchaseInvoice(purchase: InvoicePurchase, businessName: string, abn: string): Uint8Array {
  if (!businessName.trim() || !/^\d{11}$/.test(abn.replace(/\s/g, '')) || !purchase.paid_at
    || !Number.isSafeInteger(purchase.amount_minor) || ![0, 2].includes(purchase.currency_decimals)) {
    throw new Error('Invoice information is incomplete');
  }
  const decimals = purchase.currency_decimals as 0 | 2;
  const gross = purchase.amount_minor;
  const gst = Math.round(gross / 11);
  const net = gross - gst;
  const format = (minor: number) => `${purchase.currency} ${minorUnitsToMajor(minor, decimals)}`;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const left = 48;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(79, 67, 139);
  doc.text('TAX INVOICE', left, 60);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(26, 20, 63);
  doc.text(businessName, left, 91);
  doc.text(`ABN ${abn}`, left, 107);
  doc.text(`Invoice number: ${purchase.order_number}`, left, 143);
  doc.text(`Issued: ${new Date(purchase.paid_at).toISOString().slice(0, 10)} UTC`, left, 159);
  doc.text(`Paid: ${new Date(purchase.paid_at).toISOString().slice(0, 10)} UTC`, left, 175);
  doc.text(`Customer: ${purchase.email}`, left, 191);
  doc.setDrawColor(228, 218, 215); doc.line(left, 212, width - left, 212);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', left, 236); doc.text('Amount', width - left, 236, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  const productLines = doc.splitTextToSize(purchase.product_name, width - left * 2 - 140) as string[];
  doc.text(productLines, left, 258);
  doc.text(format(net), width - left, 258, { align: 'right' });
  const totalsY = Math.max(290, 258 + productLines.length * 13 + 18);
  doc.line(left, totalsY, width - left, totalsY);
  doc.text('Subtotal', left, totalsY + 25); doc.text(format(net), width - left, totalsY + 25, { align: 'right' });
  doc.text('GST included (10%)', left, totalsY + 44); doc.text(format(gst), width - left, totalsY + 44, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text('Total paid', left, totalsY + 67); doc.text(format(gross), width - left, totalsY + 67, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(116, 100, 172);
  doc.text('Payment received via Airwallex. For help: contact@moodflip.coach', left, totalsY + 101);
  doc.setCreationDate(new Date(purchase.paid_at));
  return new Uint8Array(doc.output('arraybuffer'));
}
