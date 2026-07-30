import re
with open("app/(dashboard)/clients/page.tsx", "r") as f:
    content = f.read()

# Import getUserProfile
if 'getUserProfile' not in content:
    content = content.replace('import { supabase } from "@/lib/supabase";', 'import { supabase } from "@/lib/supabase";\nimport { getUserProfile } from "@/services/api";')

# Update fetchClients
content = re.sub(
    r'const { data: { user } } = await supabase\.auth\.getUser\(\);\s*if \(\!user\) return;\s*const { data, error } = await supabase\s*\.from\(\'clients\'\)\s*\.select\(\'\*\'\)\s*\.eq\(\'user_id\', user\.id\)',
    'const profile = await getUserProfile();\n      if (!profile) return;\n\n      const { data, error } = await supabase\n        .from(\'clients\')\n        .select(\'*\')\n        .eq(\'user_id\', profile.id.toString())',
    content
)

# Update handleSave
content = re.sub(
    r'const { data: { user } } = await supabase\.auth\.getUser\(\);\s*if \(\!user\) throw new Error\("Not authenticated"\);\s*const clientData = {\s*name: formData\.name\.trim\(\),\s*company: formData\.company\.trim\(\) \|\| null,\s*address: formData\.address\.trim\(\) \|\| null,\s*contact: formData\.contact\.trim\(\) \|\| null,\s*user_id: user\.id\s*};',
    'const profile = await getUserProfile();\n      if (!profile) throw new Error("Not authenticated");\n\n      const clientData = {\n        name: formData.name.trim(),\n        company: formData.company.trim() || null,\n        address: formData.address.trim() || null,\n        contact: formData.contact.trim() || null,\n        user_id: profile.id.toString()\n      };',
    content
)

content = re.sub(
    r'\.eq\(\'user_id\', user\.id\);',
    '.eq(\'user_id\', profile.id.toString());',
    content
)

# Update handleDelete
content = re.sub(
    r'const { data: { user } } = await supabase\.auth\.getUser\(\);\s*if \(\!user\) return;\s*const { error } = await supabase\s*\.from\(\'clients\'\)\s*\.delete\(\)\s*\.eq\(\'id\', id\)\s*\.eq\(\'user_id\', user\.id\);',
    'const profile = await getUserProfile();\n      if (!profile) return;\n\n      const { error } = await supabase\n        .from(\'clients\')\n        .delete()\n        .eq(\'id\', id)\n        .eq(\'user_id\', profile.id.toString());',
    content
)

with open("app/(dashboard)/clients/page.tsx", "w") as f:
    f.write(content)
print("Updated clients.tsx auth")
