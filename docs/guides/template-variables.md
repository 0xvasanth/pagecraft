# Template Variables

Template variables are visual placeholder chips that render as `{{variable_name}}` in exported HTML. They let you build document templates with merge fields that can be filled in later by a template engine.

## How They Work

In the editor, variables appear as styled chips (purple background, monospace font). When exported, they output plain text in the format `{{variable_name}}`, compatible with any template engine.

## Predefined Variables

Pass an array of variables to make them available in the toolbar dropdown:

```tsx
<SmartPage
  ref={ref}
  variables={[
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'company', label: 'Company' },
    { key: 'date', label: 'Date' },
  ]}
/>
```

Each variable has:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `key` | `string` | Yes | The variable identifier, output as `{{key}}` in HTML |
| `label` | `string` | No | Display label shown in the toolbar dropdown. Falls back to `key` |

## Custom Variables

Users can add custom variables beyond the predefined list through the toolbar's variable dropdown. When a user adds a custom variable, it is appended to the internal variables list and becomes available for reuse.

Retrieve the current variables (including user-added ones) via the ref:

```tsx
const allVariables = ref.current.getVariables();
// [{ key: 'first_name', label: 'First Name' }, { key: 'custom_field' }, ...]
```

## Disabling Variables

To remove the template variable feature entirely, pass `false`:

```tsx
<SmartPage ref={ref} variables={false} />
```

This removes the variable button from the toolbar and unregisters the template variable TipTap extension.

## Variables in HTML Output

All three export methods output variables as `<span>` elements with `data-variable` attributes:

```html
<span data-variable="first_name" class="template-variable">{{first_name}}</span>
```

The text content inside the span uses the `{{` and `}}` delimiters by default.

## Using with Template Engines

### Handlebars

```ts
import Handlebars from 'handlebars';

const html = ref.current.getHTML();
// Replace spans with raw variable syntax for Handlebars
const template = html.replace(
  /<span[^>]*data-variable="([^"]*)"[^>]*>.*?<\/span>/g,
  '{{$1}}'
);
const compiled = Handlebars.compile(template);
const result = compiled({ first_name: 'Jane', last_name: 'Doe' });
```

### Jinja2 (Python)

```python
from jinja2 import Template
import re

html = get_html_from_editor()  # your method to retrieve editor HTML
# Strip span wrappers, keep {{variable}} text
template_str = re.sub(
    r'<span[^>]*data-variable="([^"]*)"[^>]*>.*?</span>',
    r'{{\1}}',
    html
)
template = Template(template_str)
result = template.render(first_name="Jane", last_name="Doe")
```

### Mustache

```ts
import Mustache from 'mustache';

const html = ref.current.getHTML();
const template = html.replace(
  /<span[^>]*data-variable="([^"]*)"[^>]*>.*?<\/span>/g,
  '{{$1}}'
);
const result = Mustache.render(template, { first_name: 'Jane', last_name: 'Doe' });
```

## Variable Lifecycle

1. **Insert** -- User picks a variable from the toolbar dropdown (or adds a custom one). The editor inserts a `templateVariable` TipTap node at the cursor position.

2. **Render** -- The node renders as a styled chip in the editor via a React NodeView. The chip displays the variable label (or key if no label).

3. **Export** -- When you call `getHTML()`, `getPdfHTML()`, or `getPreviewHTML()`, the node serializes to `<span data-variable="name" class="template-variable">{{name}}</span>`.

## Complete Example

```tsx
import { useRef } from 'react';
import { SmartPage, type SmartPageRef } from 'smartpage';

function LetterTemplate() {
  const ref = useRef<SmartPageRef>(null);

  const handleGenerate = () => {
    const html = ref.current?.getHTML() ?? '';
    // Replace variable spans with actual values
    const filled = html.replace(
      /<span[^>]*data-variable="([^"]*)"[^>]*>.*?<\/span>/g,
      (_, key) => {
        const values: Record<string, string> = {
          recipient_name: 'Jane Doe',
          sender_name: 'John Smith',
          date: new Date().toLocaleDateString(),
        };
        return values[key] ?? `{{${key}}}`;
      }
    );
    console.log(filled);
  };

  return (
    <div style={{ height: '100vh' }}>
      <SmartPage
        ref={ref}
        variables={[
          { key: 'recipient_name', label: 'Recipient Name' },
          { key: 'sender_name', label: 'Sender Name' },
          { key: 'date', label: 'Date' },
        ]}
      />
      <button onClick={handleGenerate}>Generate Letter</button>
    </div>
  );
}
```
