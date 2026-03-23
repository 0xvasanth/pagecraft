# Example: Invoice Template

This example builds a complete invoice template editor with line items (for-loop), conditional discount (if-block), template variables, and PDF export.

## Setup

```tsx
import { useRef, useCallback } from 'react';
import {
  SmartPage,
  type SmartPageRef,
  forBlock,
  ifBlock,
} from 'smartpage';

function InvoiceEditor() {
  const ref = useRef<SmartPageRef>(null);

  const variables = [
    { key: 'invoice_number', label: 'Invoice Number' },
    { key: 'invoice_date', label: 'Invoice Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'client_name', label: 'Client Name' },
    { key: 'client_email', label: 'Client Email' },
    { key: 'client_address', label: 'Client Address' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'tax_rate', label: 'Tax Rate' },
    { key: 'tax_amount', label: 'Tax Amount' },
    { key: 'discount_amount', label: 'Discount Amount' },
    { key: 'total', label: 'Total' },
    // For-loop item variables
    { key: 'items', label: 'Line Items' },
    { key: 'item.description', label: 'Item Description' },
    { key: 'item.quantity', label: 'Item Quantity' },
    { key: 'item.unit_price', label: 'Item Unit Price' },
    { key: 'item.amount', label: 'Item Amount' },
    // Conditional
    { key: 'has_discount', label: 'Has Discount' },
  ];

  const handleExportPdf = useCallback(async () => {
    const html = ref.current?.getPdfHTML({ title: 'Invoice' });
    if (!html) return;

    // Send to your server for PDF generation
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    });

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={handleExportPdf}>Download PDF</button>
      </div>
      <SmartPage
        ref={ref}
        canvas="a4"
        toolbar="document"
        variables={variables}
        blocks={[forBlock, ifBlock]}
        header="<p><strong>ACME Corporation</strong></p>"
        footer="<p>Thank you for your business</p>"
        placeholder="Design your invoice template..."
        className="flex-1"
        content={INVOICE_TEMPLATE}
        actions={{
          import: false,
          preview: true,
          print: true,
          export: true,
        }}
      />
    </div>
  );
}
```

## Invoice Template Content

Pre-populate the editor with an invoice layout:

```tsx
const INVOICE_TEMPLATE = `
<h1>INVOICE</h1>
<table>
  <tr>
    <td><strong>Invoice #:</strong> <span data-variable="invoice_number" class="template-variable">{{invoice_number}}</span></td>
    <td><strong>Date:</strong> <span data-variable="invoice_date" class="template-variable">{{invoice_date}}</span></td>
  </tr>
  <tr>
    <td><strong>Due Date:</strong> <span data-variable="due_date" class="template-variable">{{due_date}}</span></td>
    <td></td>
  </tr>
</table>

<h3>Bill To</h3>
<p>
  <span data-variable="client_name" class="template-variable">{{client_name}}</span><br>
  <span data-variable="client_email" class="template-variable">{{client_email}}</span><br>
  <span data-variable="client_address" class="template-variable">{{client_address}}</span>
</p>

<h3>Line Items</h3>
<table>
  <tr>
    <th>Description</th>
    <th>Qty</th>
    <th>Unit Price</th>
    <th>Amount</th>
  </tr>
  <tr>
    <td><span data-variable="item.description" class="template-variable">{{item.description}}</span></td>
    <td><span data-variable="item.quantity" class="template-variable">{{item.quantity}}</span></td>
    <td><span data-variable="item.unit_price" class="template-variable">{{item.unit_price}}</span></td>
    <td><span data-variable="item.amount" class="template-variable">{{item.amount}}</span></td>
  </tr>
</table>

<table>
  <tr>
    <td></td>
    <td><strong>Subtotal:</strong></td>
    <td><span data-variable="subtotal" class="template-variable">{{subtotal}}</span></td>
  </tr>
  <tr>
    <td></td>
    <td><strong>Tax (<span data-variable="tax_rate" class="template-variable">{{tax_rate}}</span>):</strong></td>
    <td><span data-variable="tax_amount" class="template-variable">{{tax_amount}}</span></td>
  </tr>
  <tr>
    <td></td>
    <td><strong>Total:</strong></td>
    <td><strong><span data-variable="total" class="template-variable">{{total}}</span></strong></td>
  </tr>
</table>
`;
```

## Server-Side PDF Generation (Puppeteer)

```ts
// api/generate-pdf.ts (Node.js server)
import puppeteer from 'puppeteer';

export async function POST(request: Request) {
  const { html } = await request.json();

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();

  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
    },
  });
}
```

## Filling the Template

After export, replace variable spans with actual data:

```ts
function fillTemplate(html: string, data: Record<string, string>): string {
  return html.replace(
    /<span[^>]*data-variable="([^"]*)"[^>]*>.*?<\/span>/g,
    (_, key) => data[key] ?? `{{${key}}}`
  );
}

const filledHtml = fillTemplate(ref.current.getPdfHTML({ title: 'Invoice' }), {
  invoice_number: 'INV-2024-001',
  invoice_date: '2024-01-15',
  due_date: '2024-02-15',
  client_name: 'Jane Doe',
  client_email: 'jane@example.com',
  client_address: '123 Main St, City, State 12345',
  subtotal: '$1,500.00',
  tax_rate: '10%',
  tax_amount: '$150.00',
  total: '$1,650.00',
});
```
