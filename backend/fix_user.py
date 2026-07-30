import re
with open("app/models/user.py", "r") as f:
    content = f.read()

content = re.sub(r'    projects = relationship\("Project", back_populates="owner", cascade="all, delete-orphan"\)\n', '', content)

with open("app/models/user.py", "w") as f:
    f.write(content)
print("Updated user.py")
