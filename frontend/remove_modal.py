import re

with open('/Users/apple/Desktop/digiscale product/frontend/app/(dashboard)/projects/page.tsx', 'r') as f:
    content = f.read()

start_idx = content.find('{/* ADD / EDIT PRODUCT MODAL */}')
if start_idx == -1:
    print("Could not find start of Product Modal")
    exit(1)

end_idx = content.find('{/* CUSTOM CONFIRMATION MODAL */}', start_idx)

if end_idx == -1:
    print("Could not find end of Product Modal")
    exit(1)

content = content[:start_idx] + content[end_idx:]

with open('/Users/apple/Desktop/digiscale product/frontend/app/(dashboard)/projects/page.tsx', 'w') as f:
    f.write(content)

print("Removed Product Modal successfully.")
