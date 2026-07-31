"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getUserProfile } from "@/services/api";
import { Plus, Search, Edit2, Trash2, X, MapPin, Building, Phone, FileText } from "lucide-react";

interface Client {
  id: number;
  name: string;
  company: string | null;
  address: string | null;
  contact: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientQuotes, setClientQuotes] = useState<Record<string, any[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    address: "",
    contact: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      if (!profile) return;

      const [clientsRes, quotesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('user_id', profile.id.toString())
          .order('name', { ascending: true }),
        supabase
          .from('quotations')
          .select('client_name, quote_number, quote_date, total_amount, created_at')
          .eq('user_id', profile.id.toString())
          .order('created_at', { ascending: false })
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (quotesRes.error) throw quotesRes.error;

      const quotesMap: Record<string, any[]> = {};
      if (quotesRes.data) {
        quotesRes.data.forEach(q => {
          if (q.client_name) {
            const name = q.client_name.toLowerCase();
            if (!quotesMap[name]) quotesMap[name] = [];
            quotesMap[name].push(q);
          }
        });
      }
      
      setClientQuotes(quotesMap);
      setClients(clientsRes.data || []);
    } catch (err: any) {
      alert(err.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (client?: Client) => {
    if (client) {
      setEditingId(client.id);
      setFormData({
        name: client.name || "",
        company: client.company || "",
        address: client.address || "",
        contact: client.contact || "",
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", company: "", address: "", contact: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Name is required");
      return;
    }

    try {
      setSaving(true);
      const profile = await getUserProfile();
      if (!profile) throw new Error("Not authenticated");

      const clientData = {
        name: formData.name.trim(),
        company: formData.company.trim() || null,
        address: formData.address.trim() || null,
        contact: formData.contact.trim() || null,
        user_id: profile.id.toString()
      };

      if (editingId) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingId)
          .eq('user_id', profile.id.toString());
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);
        
        if (error) throw error;
      }

      closeModal();
      fetchClients();
    } catch (err: any) {
      alert(err.message || "Failed to save client");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: number, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setDeleting(true);
      const profile = await getUserProfile();
      if (!profile) return;

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', deleteConfirmId)
        .eq('user_id', profile.id.toString());

      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete client");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8 pb-32 min-h-screen bg-slate-50/50 relative">
      <div className="w-full space-y-6">
        
        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-3xl">
            <div className="relative w-full sm:w-[50%]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-sm active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </button>
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No clients found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {searchQuery ? "No clients match your search query." : "Add your first client to speed up your quotation workflow."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => openModal()}
                className="mt-6 text-blue-600 font-semibold hover:text-blue-700 text-sm"
              >
                + Add New Client
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClients.map((client) => (
              <div 
                key={client.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg truncate pr-4">{client.name}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                      <Building className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium truncate">{client.company || "No company specified"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openModal(client)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => confirmDelete(client.id, client.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-start gap-2 text-slate-600 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-2">{client.address || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{client.contact || "—"}</span>
                  </div>
                </div>

                {/* Brief Quotation Details */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Quotations</span>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {clientQuotes[client.name?.toLowerCase()]?.length || 0}
                    </span>
                  </div>
                  
                  {clientQuotes[client.name?.toLowerCase()]?.length > 0 ? (
                    <div className="space-y-2">
                      {clientQuotes[client.name?.toLowerCase()].slice(0, 3).map(q => (
                        <div key={q.quote_number} className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{q.quote_number}</span>
                            <span className="text-[9px] font-semibold text-slate-400">{new Date(q.quote_date).toLocaleDateString()}</span>
                          </div>
                          <span className="text-xs font-bold text-blue-600">
                            ₹{q.total_amount?.toLocaleString() || 0}
                          </span>
                        </div>
                      ))}
                      {clientQuotes[client.name?.toLowerCase()]?.length > 3 && (
                        <div className="text-center pt-1">
                          <span className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                            +{clientQuotes[client.name?.toLowerCase()].length - 3} more quotations...
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <span className="text-xs font-medium text-slate-400">No quotations sent yet</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-900 text-lg">
                {editingId ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="client-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Customer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Company Name</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Contact Details</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="Phone or Email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Address</label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    placeholder="Full business address"
                  />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="client-form"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Client'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-900 text-lg">
                Delete Client
              </h2>
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-600 text-sm">
                Are you sure you want to delete <span className="font-bold text-slate-900">{deleteConfirmName}</span>? This action cannot be undone.
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={deleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-red-500/20 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Client'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
