import re

with open("components/layout/QuotationView.tsx", "r") as f:
    content = f.read()

# 1. Add state for clientsList
content = re.sub(
    r'const \[savedQuotes, setSavedQuotes\] = useState<any\[\]>\(\[\]\);',
    'const [savedQuotes, setSavedQuotes] = useState<any[]>([]);\n  const [clientsList, setClientsList] = useState<any[]>([]);',
    content
)

# 2. Update cachedData restoring
content = re.sub(
    r'setSavedQuotes\(cachedData.savedQuotes\);',
    'setSavedQuotes(cachedData.savedQuotes);\n          if (cachedData.clientsList) setClientsList(cachedData.clientsList);',
    content
)

# 3. Update Promise.all in loadData
content = re.sub(
    r"supabase\.from\('quotations'\)\.select\('id, quote_number, client_name, client_company, client_address, quote_date, tax_input, cash_amount, bank_amount, total_amount, apply_event_markup, event_markup_percent, created_at, is_order_done'\)\.eq\('user_id', userId\)\.order\('created_at', \{ ascending: false \}\)\n\s+\]\);",
    "supabase.from('quotations').select('id, quote_number, client_name, client_company, client_address, quote_date, tax_input, cash_amount, bank_amount, total_amount, apply_event_markup, event_markup_percent, created_at, is_order_done').eq('user_id', userId).order('created_at', { ascending: false }),\n          supabase.from('clients').select('*').eq('user_id', userId)\n        ]);",
    content
)
content = re.sub(
    r'const \[\n\s+\{ data: colsData, error: colsErr \},\n\s+\{ data: prodsData, error: prodsErr \},\n\s+\{ data: assignsData, error: assignsErr \},\n\s+\{ data: quotesData, error: quotesErr \}\n\s+\] = await Promise\.all',
    'const [\n          { data: colsData, error: colsErr },\n          { data: prodsData, error: prodsErr },\n          { data: assignsData, error: assignsErr },\n          { data: quotesData, error: quotesErr },\n          { data: clientsData, error: clientsErr }\n        ] = await Promise.all',
    content
)

content = re.sub(
    r'if \(quotesErr\) throw quotesErr;',
    'if (quotesErr) throw quotesErr;\n        if (clientsErr) throw clientsErr;\n        setClientsList(clientsData || []);',
    content
)

content = re.sub(
    r'savedQuotes: parsedQuotes,\n\s+quoteNumber: nextNum',
    'savedQuotes: parsedQuotes,\n            quoteNumber: nextNum,\n            clientsList: clientsData || []',
    content
)
content = re.sub(
    r'savedQuotes: \[\],\n\s+quoteNumber: "Q-1"',
    'savedQuotes: [],\n            quoteNumber: "Q-1",\n            clientsList: clientsData || []',
    content
)

# 4. Modify uniqueClients to include clientsList and fallback to old logic
content = re.sub(
    r'const uniqueClients = useMemo\(\(\) => \{\n\s+const clientsMap = new Map\(\);\n\s+savedQuotes\.forEach\(q => \{\n\s+if \(q\.clientName && !clientsMap\.has\(q\.clientName\.toLowerCase\(\)\)\) \{\n\s+clientsMap\.set\(q\.clientName\.toLowerCase\(\), \{\n\s+name: q\.clientName,\n\s+company: q\.clientCompany \|\| "",\n\s+address: q\.clientAddress \|\| ""\n\s+\}\);\n\s+\}\n\s+\}\);\n\s+return Array\.from\(clientsMap\.values\(\)\);\n\s+\}, \[savedQuotes\]\);',
    'const uniqueClients = useMemo(() => {\n    const clientsMap = new Map();\n    clientsList.forEach(c => {\n      if (c.name && !clientsMap.has(c.name.toLowerCase())) {\n        clientsMap.set(c.name.toLowerCase(), {\n          name: c.name,\n          company: c.company || "",\n          address: c.address || "",\n          contact: c.contact || ""\n        });\n      }\n    });\n    savedQuotes.forEach(q => {\n      if (q.clientName && !clientsMap.has(q.clientName.toLowerCase())) {\n        clientsMap.set(q.clientName.toLowerCase(), {\n          name: q.clientName,\n          company: q.clientCompany || "",\n          address: q.clientAddress || "",\n          contact: ""\n        });\n      }\n    });\n    return Array.from(clientsMap.values());\n  }, [savedQuotes, clientsList]);',
    content
)

# 5. On suggestion click, fill all details
content = re.sub(
    r'setClientName\(client\.name\);\n\s+setClientCompany\(client\.company\);\n\s+setClientAddress\(client\.address\);\n\s+setShowClientSuggestions\(false\);',
    'setClientName(client.name);\n                                setClientCompany(client.company);\n                                setClientAddress(client.address);\n                                setShowClientSuggestions(false);',
    content
)

with open("components/layout/QuotationView.tsx", "w") as f:
    f.write(content)
print("Updated QuotationView fetch logic")
