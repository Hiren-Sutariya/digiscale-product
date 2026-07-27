import re

with open('/Users/apple/Desktop/digiscale product/frontend/app/(dashboard)/projects/page.tsx', 'r') as f:
    content = f.read()

# Find the start of tbody
start_idx = content.find('<tbody className="divide-y divide-slate-100">')

# Find the end of tbody
end_idx = content.find('</tbody>', start_idx) + len('</tbody>')

if start_idx == -1 or end_idx == -1:
    print("Could not find tbody")
    exit(1)

new_tbody = """<tbody 
                        className="divide-y divide-slate-100 transition-colors"
                        onDragOver={(ev) => { ev.preventDefault(); ev.currentTarget.classList.add("bg-blue-50/30"); }}
                        onDragLeave={(ev) => { ev.currentTarget.classList.remove("bg-blue-50/30"); }}
                        onDrop={(ev) => {
                          ev.preventDefault();
                          ev.currentTarget.classList.remove("bg-blue-50/30");
                          const files = Array.from(ev.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                          if (!files.length) return;
                          
                          files.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const src = e.target?.result as string;
                              const img = new window.Image();
                              img.onload = () => {
                                const canvas = document.createElement("canvas");
                                const maxDim = 800;
                                let { width, height } = img;
                                if (width > height) { if (width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; } }
                                else { if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; } }
                                canvas.width = width; canvas.height = height;
                                canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
                                const url = canvas.toDataURL("image/jpeg", 0.7);
                                setDraftProducts(prev => [{ name: "", stock: 0, cartonQty: 1, rate: "", length: "", color: "", unit_type: "pcs", description: "", photoUrl: url, warehouse: "" }, ...prev]);
                              };
                              img.src = src;
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      >
                        {draftProducts.map((draft, idx) => (
                          <tr key={`draft-${idx}`} className="text-xs bg-blue-50/20 border-l-4 border-l-blue-400">
                            <td className="py-3 px-4">
                              <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden relative">
                                {draft.photoUrl ? (
                                  <img src={draft.photoUrl} alt="draft" className="h-full w-full object-contain" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">
                                    <ImageIcon className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <input type="text" placeholder="Product Name" className="w-full text-xs font-bold p-1.5 border border-slate-200 rounded" value={draft.name || ""} onChange={(e) => handleUpdateDraft(idx, "name", e.target.value)} />
                            </td>
                            <td className="py-3 px-4">
                              <input type="text" placeholder="Color" className="w-20 text-xs p-1.5 border border-slate-200 rounded" value={draft.color || ""} onChange={(e) => handleUpdateDraft(idx, "color", e.target.value)} />
                            </td>
                            <td className="py-3 px-4">
                              <input type="text" placeholder="Length" className="w-16 text-xs p-1.5 border border-slate-200 rounded" value={draft.length || ""} onChange={(e) => handleUpdateDraft(idx, "length", e.target.value)} />
                            </td>
                            <td className="py-3 px-4">
                              <input type="number" placeholder="Stock" className="w-16 text-xs p-1.5 border border-slate-200 rounded" value={draft.stock || ""} onChange={(e) => handleUpdateDraft(idx, "stock", e.target.value)} />
                            </td>
                            <td className="py-3 px-4">
                              <input type="number" placeholder="Carton Qty" className="w-16 text-xs p-1.5 border border-slate-200 rounded" value={draft.cartonQty || ""} onChange={(e) => handleUpdateDraft(idx, "cartonQty", e.target.value)} />
                            </td>
                            <td className="py-3 px-4">
                              <input type="text" placeholder="Warehouse" className="w-24 text-xs p-1.5 border border-slate-200 rounded" value={draft.warehouse || ""} onChange={(e) => handleUpdateDraft(idx, "warehouse", e.target.value)} />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <input type="text" placeholder="Rate" className="w-16 text-xs p-1.5 border border-slate-200 rounded text-right" value={draft.rate || ""} onChange={(e) => handleUpdateDraft(idx, "rate", e.target.value)} />
                                <select className="text-xs p-1 border border-slate-200 rounded" value={draft.unit_type || "pcs"} onChange={(e) => handleUpdateDraft(idx, "unit_type", e.target.value)}>
                                  <option value="pcs">pcs</option>
                                  <option value="dzn">dzn</option>
                                </select>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-black text-right">—</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2 justify-center">
                                <button onClick={() => handleSaveDraftRow(idx)} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition" title="Save Product"><Check className="h-4 w-4" /></button>
                                <button onClick={() => setDraftProducts(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 transition" title="Discard"><X className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredProducts.map((prod) => {
                          const cartonCount = prod.cartonQty > 0 ? Math.ceil(prod.stock / prod.cartonQty) : 0;
                          
                          if (editingProductRowId === prod.id && editingProductState) {
                            return (
                              <tr key={prod.id} className="text-xs bg-amber-50/20 border-l-4 border-l-amber-400">
                                <td className="py-3 px-4">
                                  <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden relative">
                                    {editingProductState.photoUrl ? (
                                      <img src={editingProductState.photoUrl} alt="edit" className="h-full w-full object-contain" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400">
                                        <ImageIcon className="h-5 w-5" />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <input type="text" placeholder="Product Name" className="w-full text-xs font-bold p-1.5 border border-slate-200 rounded" value={editingProductState.name || ""} onChange={(e) => handleUpdateEditState("name", e.target.value)} />
                                </td>
                                <td className="py-3 px-4">
                                  <input type="text" placeholder="Color" className="w-20 text-xs p-1.5 border border-slate-200 rounded" value={editingProductState.color || ""} onChange={(e) => handleUpdateEditState("color", e.target.value)} />
                                </td>
                                <td className="py-3 px-4">
                                  <input type="text" placeholder="Length" className="w-16 text-xs p-1.5 border border-slate-200 rounded" value={editingProductState.length || ""} onChange={(e) => handleUpdateEditState("length", e.target.value)} />
                                </td>
                                <td className="py-3 px-4">
                                  <input type="number" placeholder="Stock" className="w-16 text-xs p-1.5 border border-slate-200 rounded" value={editingProductState.stock || ""} onChange={(e) => handleUpdateEditState("stock", e.target.value)} />
                                </td>
                                <td className="py-3 px-4">
                                  <input type="number" placeholder="Carton Qty" className="w-16 text-xs p-1.5 border border-slate-200 rounded" value={editingProductState.cartonQty || ""} onChange={(e) => handleUpdateEditState("cartonQty", e.target.value)} />
                                </td>
                                <td className="py-3 px-4">
                                  <input type="text" placeholder="Warehouse" className="w-24 text-xs p-1.5 border border-slate-200 rounded" value={editingProductState.warehouse || ""} onChange={(e) => handleUpdateEditState("warehouse", e.target.value)} />
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    <input type="text" placeholder="Rate" className="w-16 text-xs p-1.5 border border-slate-200 rounded text-right" value={editingProductState.rate || ""} onChange={(e) => handleUpdateEditState("rate", e.target.value)} />
                                    <select className="text-xs p-1 border border-slate-200 rounded" value={editingProductState.unit_type || "pcs"} onChange={(e) => handleUpdateEditState("unit_type", e.target.value)}>
                                      <option value="pcs">pcs</option>
                                      <option value="dzn">dzn</option>
                                    </select>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-black text-right">
                                  ₹{( (editingProductState.stock ? parseInt(editingProductState.stock as any) : 0) * (parseFloat(editingProductState.rate || "0") || 0) ).toLocaleString()}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex gap-2 justify-center">
                                    <button onClick={handleSaveEditRow} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition" title="Save Changes"><Check className="h-4 w-4" /></button>
                                    <button onClick={() => { setEditingProductRowId(null); setEditingProductState(null); }} className="p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition" title="Cancel"><X className="h-4 w-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={prod.id} className="text-xs text-slate-800 hover:bg-slate-50/40 transition">
                              <td className="py-4 px-6">
                                <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-1.5">
                                  {prod.photoUrl ? (
                                    <img src={prod.photoUrl} alt={prod.name} className="h-full w-full object-contain" />
                                  ) : (
                                    <ImageIcon className="h-5 w-5 text-slate-300" />
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 font-bold">
                                <p className="text-slate-900 font-extrabold text-sm">{prod.name}</p>
                                {prod.description && (
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{prod.description}</p>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                {prod.color ? (
                                  <div className="flex flex-wrap gap-1">
                                    {prod.color.split(",").map((c, i) => (
                                      <span key={i} className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 whitespace-nowrap">
                                        {c.trim()}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-350 text-xs">—</span>
                                )}
                              </td>
                              <td className="py-4 px-6 font-semibold text-slate-600">
                                {prod.length || "—"}
                              </td>
                              <td className="py-4 px-6">
                                <p className="font-extrabold text-slate-800">{prod.stock} units</p>
                                <p className="text-[10px] text-slate-400 font-medium">Available</p>
                              </td>
                              <td className="py-4 px-6">
                                <p className="font-bold text-slate-700">{prod.cartonQty} / Carton</p>
                                <p className="text-[10px] text-slate-400 font-medium">{cartonCount} boxes total</p>
                              </td>
                              <td className="py-4 px-6 font-semibold text-slate-700">
                                {prod.warehouse || "—"}
                              </td>
                              <td className="py-4 px-6 text-right font-extrabold text-slate-800">
                                {prod.rate ? `${prod.rate} ${prod.unit_type || "pcs"}` : ""}
                              </td>
                              <td className="py-4 px-6 text-right font-black text-slate-900">
                                ₹{(prod.stock * (parseFloat(prod.rate) || 0)).toLocaleString()}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEditProductClick(prod)}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-655 hover:bg-slate-50 transition"
                                    title="Edit Product"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>"""

content = content[:start_idx] + new_tbody + content[end_idx:]

with open('/Users/apple/Desktop/digiscale product/frontend/app/(dashboard)/projects/page.tsx', 'w') as f:
    f.write(content)

print("Updated tbody successfully.")
