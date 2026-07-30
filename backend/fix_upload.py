import re
with open("app/api/upload.py", "r") as f:
    content = f.read()

content = re.sub(r'from app\.models\.project import ProjectImage\n', '', content)
content = re.sub(r'project_id: Optional\[int\] = Form\(None\),', 'project_id: Optional[int] = Form(None), # Deprecated', content)
content = re.sub(
    r'    # Create DB record if project_id is provided[\s\S]*?    image_id = None[\s\S]*?        image_id = db_image\.id',
    '    image_id = None',
    content
)

with open("app/api/upload.py", "w") as f:
    f.write(content)
print("Updated upload.py")
