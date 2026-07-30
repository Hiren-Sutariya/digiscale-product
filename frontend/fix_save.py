import re

with open("components/layout/QuotationView.tsx", "r") as f:
    content = f.read()

auto_save_logic = """
      if (error) throw error;

      if (clientName) {
        const clientExists = clientsList.some(c => c.name.toLowerCase() === clientName.toLowerCase());
        if (!clientExists) {
          const newClient = {
            name: clientName,
            company: clientCompany || null,
            address: clientAddress || null,
            user_id: currentUserId
          };
          const { error: clientError } = await supabase.from('clients').insert([newClient]);
          if (!clientError) {
            setClientsList([...clientsList, newClient]);
          }
        }
      }
"""

content = re.sub(
    r'if \(error\) throw error;\n\s+setSavedQuotes\(updatedQuotes\);',
    auto_save_logic + '\n      setSavedQuotes(updatedQuotes);',
    content
)

with open("components/layout/QuotationView.tsx", "w") as f:
    f.write(content)
print("Updated handleSaveQuotation auto-save logic")
