import re

file_path = "/Users/apple/Desktop/digiscale product/frontend/components/layout/QuotationView.tsx"

with open(file_path, "r") as f:
    content = f.read()

# 1. Replace headers
content = content.replace('<th className="py-2.5 px-3 border-r border-slate-900 text-center w-16">QTY</th>\n                      <th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE CODE</th>', '<th className="py-2.5 px-3 border-r border-slate-900 text-center w-20">CTNS</th>\n                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-16">QTY</th>\n                      <th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE</th>')

content = content.replace('<th className="py-2.5 px-3 border-r border-slate-900 text-center w-16">QTY</th>\n                      <th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE CODE</th>', '<th className="py-2.5 px-3 border-r border-slate-900 text-center w-16">QTY</th>\n                      <th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE</th>')
content = content.replace('<th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE CODE</th>', '<th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE</th>')

content = content.replace('<th className="py-2 px-2 text-right w-20 border-r border-slate-700">Rate</th>', '<th className="py-2 px-2 text-right w-20 border-r border-slate-700">Price</th>')

# 2. Fix the input field value
content = content.replace(
    'value={applyEventMarkup ? (parseFloat(item.rate || "0") * (1 + eventMarkupPercent / 100)).toString() : (item.rate || "")}',
    'value={getItemRate(item.rate || "") || ""}'
)

# 3. Remove forced decimals from toLocaleString
content = content.replace(', { minimumFractionDigits: 2, maximumFractionDigits: 2 }', '')

with open(file_path, "w") as f:
    f.write(content)

print("Done")
