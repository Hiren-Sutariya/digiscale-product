import re

with open("app/(dashboard)/clients/page.tsx", "r") as f:
    content = f.read()

content = re.sub(r'import \{ toast \} from "react-hot-toast";\n', '', content)
content = re.sub(r'toast\.error\((.*?)\);', r'alert(\1);', content)
content = re.sub(r'toast\.success\((.*?)\);', r'alert(\1);', content)

with open("app/(dashboard)/clients/page.tsx", "w") as f:
    f.write(content)
print("Updated toast to alert")
