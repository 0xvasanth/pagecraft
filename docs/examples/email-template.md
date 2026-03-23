# Example: Email Template

This example builds an email template editor with the `email` canvas preset (600px wide, no pagination), personalization variables, and HTML export for sending.

## Setup

```tsx
import { useRef, useCallback } from 'react';
import { SmartPage, type SmartPageRef } from 'smartpage';

function EmailEditor() {
  const ref = useRef<SmartPageRef>(null);

  const variables = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'company', label: 'Company Name' },
    { key: 'unsubscribe_url', label: 'Unsubscribe URL' },
    { key: 'logo_url', label: 'Logo URL' },
  ];

  const handleSendTest = useCallback(async () => {
    const html = ref.current?.getHTML();
    if (!html) return;

    // Replace variables with test data
    const testHtml = fillVariables(html, {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      company: 'ACME Corp',
      unsubscribe_url: 'https://example.com/unsubscribe',
      logo_url: 'https://example.com/logo.png',
    });

    await fetch('/api/send-test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test Email',
        html: wrapInEmailLayout(testHtml),
      }),
    });
  }, []);

  const handleSaveTemplate = useCallback(() => {
    const html = ref.current?.getHTML();
    const variables = ref.current?.getVariables();
    console.log('Template saved:', { html, variables });
    // Save to your backend
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
        <button onClick={handleSaveTemplate}>Save Template</button>
        <button onClick={handleSendTest}>Send Test</button>
      </div>
      <SmartPage
        ref={ref}
        canvas="email"
        toolbar={{
          preset: 'full',
          disable: ['pageBreak', 'codeBlock', 'taskList'],
        }}
        variables={variables}
        placeholder="Design your email template..."
        className="flex-1"
        content={EMAIL_TEMPLATE}
        actions={{
          import: false,
          preview: true,
          print: false,
          export: true,
        }}
      />
    </div>
  );
}
```

## Email Template Content

```tsx
const EMAIL_TEMPLATE = `
<p>Hi <span data-variable="first_name" class="template-variable">{{first_name}}</span>,</p>

<p>Thank you for signing up with <span data-variable="company" class="template-variable">{{company}}</span>. We are excited to have you on board.</p>

<p>Here is what you can do next:</p>

<ul>
  <li>Complete your profile</li>
  <li>Explore our features</li>
  <li>Invite your team</li>
</ul>

<p>If you have any questions, reply to this email and we will get back to you.</p>

<p>Best regards,<br>The Team</p>

<hr>

<p style="font-size: 10pt; color: #6b7280;">
  You are receiving this email because you signed up at <span data-variable="company" class="template-variable">{{company}}</span>.
  <a href="#">Unsubscribe</a>
</p>
`;
```

## Utility Functions

### Fill Variables

Replace template variable spans with actual values:

```ts
function fillVariables(html: string, data: Record<string, string>): string {
  return html.replace(
    /<span[^>]*data-variable="([^"]*)"[^>]*>.*?<\/span>/g,
    (_, key) => data[key] ?? `{{${key}}}`
  );
}
```

### Wrap in Email Layout

Wrap the editor's raw HTML in an email-safe layout:

```ts
function wrapInEmailLayout(bodyHtml: string): string {
  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <style>',
    '    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.5; color: #1a1a1a; background: #f5f5f5; }',
    '    .email-wrapper { max-width: 600px; margin: 0 auto; background: #fff; padding: 32px; }',
    '    img { max-width: 100%; height: auto; }',
    '    a { color: #2563eb; }',
    '    ul, ol { padding-left: 1.5em; }',
    '    hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5em 0; }',
    '  </style>',
    '</head>',
    '<body>',
    `  <div class="email-wrapper">${bodyHtml}</div>`,
    '</body>',
    '</html>',
  ].join('\n');
}
```

## Key Differences from Document Mode

| Aspect | Document (A4) | Email |
|--------|---------------|-------|
| Canvas | `canvas="a4"` | `canvas="email"` |
| Width | 210mm (A4) | 600px |
| Pagination | Yes, visual page breaks | No |
| Page break button | Shown | Auto-hidden |
| Header/footer | Supported | Not typically used |
| Export method | `getPdfHTML()` | `getHTML()` + custom wrapper |

## Sending Emails

Use `getHTML()` (not `getPdfHTML()`) for email content. `getPdfHTML()` includes `@page` rules and print-specific CSS that email clients ignore or mishandle.

```tsx
// For email sending, use getHTML() and wrap it yourself
const rawHtml = ref.current.getHTML();
const emailHtml = wrapInEmailLayout(fillVariables(rawHtml, userData));

// Send via your email service (SendGrid, Postmark, SES, etc.)
await sendEmail({
  to: user.email,
  subject: 'Welcome!',
  html: emailHtml,
});
```

## Complete Code

```tsx
import { useRef, useCallback, useState } from 'react';
import { SmartPage, type SmartPageRef } from 'smartpage';

function fillVariables(html: string, data: Record<string, string>): string {
  return html.replace(
    /<span[^>]*data-variable="([^"]*)"[^>]*>.*?<\/span>/g,
    (_, key) => data[key] ?? `{{${key}}}`
  );
}

function wrapInEmailLayout(bodyHtml: string): string {
  return [
    '<!DOCTYPE html>',
    '<html><head>',
    '<meta charset="UTF-8">',
    '<style>',
    'body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.5; color: #1a1a1a; background: #f5f5f5; }',
    '.email-wrapper { max-width: 600px; margin: 0 auto; background: #fff; padding: 32px; }',
    'img { max-width: 100%; height: auto; }',
    'a { color: #2563eb; }',
    'ul, ol { padding-left: 1.5em; }',
    'hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5em 0; }',
    '</style>',
    '</head><body>',
    '<div class="email-wrapper">' + bodyHtml + '</div>',
    '</body></html>',
  ].join('\n');
}

export default function EmailTemplateEditor() {
  const ref = useRef<SmartPageRef>(null);
  const [saved, setSaved] = useState(false);

  const variables = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'company', label: 'Company Name' },
    { key: 'unsubscribe_url', label: 'Unsubscribe URL' },
  ];

  const handleSave = useCallback(() => {
    const html = ref.current?.getHTML();
    const vars = ref.current?.getVariables();
    console.log({ html, variables: vars });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handlePreviewFilled = useCallback(() => {
    const html = ref.current?.getHTML();
    if (!html) return;

    const filled = fillVariables(html, {
      first_name: 'Jane',
      last_name: 'Doe',
      company: 'ACME Corp',
      unsubscribe_url: '#',
    });

    const fullHtml = wrapInEmailLayout(filled);
    // Open preview in new tab using Blob URL
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={handleSave}>{saved ? 'Saved' : 'Save Template'}</button>
        <button onClick={handlePreviewFilled}>Preview with Data</button>
      </div>
      <SmartPage
        ref={ref}
        canvas="email"
        toolbar={{
          preset: 'full',
          disable: ['pageBreak', 'codeBlock', 'taskList'],
        }}
        variables={variables}
        placeholder="Design your email..."
        className="flex-1"
        actions={{
          import: false,
          preview: true,
          print: false,
          export: true,
        }}
      />
    </div>
  );
}
```
