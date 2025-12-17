# Customer Overrides Folder

This folder contains customer-specific configuration and override files.

- Only put files here that are different from the main product.
- Shared code should remain in the main folders (dashboard/, server/, etc).
- Use a subfolder for each customer (e.g., bloom-buddies, acme-corp).

## Example Structure
```
/customers/
    bloom-buddies/
        config.js
        dashboard/
            index.html
    acme-corp/
        config.js
```

## How to Use
- At runtime, load the appropriate config or override files based on the customer.
- If a file does not exist for a customer, use the default from the main codebase.
