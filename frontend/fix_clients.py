import re
with open("app/(dashboard)/clients/page.tsx", "r") as f:
    content = f.read()

content = content.replace('className="max-w-7xl mx-auto space-y-6"', 'className="w-full space-y-6"')

with open("app/(dashboard)/clients/page.tsx", "w") as f:
    f.write(content)
print("Updated clients.tsx")
