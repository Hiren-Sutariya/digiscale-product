"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getUserProfile, getUserSettings, updateUserSettings } from "@/services/api";
import { Plus, Search, Edit2, Trash2, X, MapPin, Building, Phone, FileText, Award, CheckCircle2, Check, Star } from "lucide-react";
import Link from "next/link";

interface Client {
  id: number;
  name: string;
  company: string | null;
  address: string | null;
  contact: string | null;
}

export default function ClientsPage() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");
    }
  }, []);

  const TRANSLATIONS: Record<string, Record<string, string>> = {
    en: {
      addNewClient: "Add New Client",
      editClient: "Edit Client",
      customerName: "Customer Name",
      companyName: "Company Name",
      contactDetails: "Contact Details",
      address: "Address",
      cancel: "Cancel",
      saveClient: "Save Client",
      saving: "Saving...",
      searchPlaceholder: "Search clients...",
      regularClientLabel: "Regular Client:",
      ordersLabel: "Orders",
      noClientsHeading: "No clients found",
      noClientsQueryDesc: "No clients match your search query.",
      noClientsEmptyDesc: "Add your first client to speed up your quotation workflow.",
      regularClientStarBadge: "Regular Client",
      viewQuotesLink: "View {count} Quote(s)",
      zeroQuotes: "0 Quotes",
      ordersDoneLabel: "Orders Done",
      deleteClientHeading: "Delete Client",
      deleteClientConfirmText: "Are you sure you want to delete {name}? This action cannot be undone.",
      deleteBtn: "Delete Client",
      deletingText: "Deleting...",
      changeRegularSetup: "Change Regular Client Setup",
      changeRegularSetupConfirm: "Are you sure you want to set the requirement for Regular Clients to {count} order{plural}?",
      regularZeroWarning: "Setting this to 0 means nobody will be marked as a Regular Client.",
      confirmChange: "Confirm Change",
      contactPlaceholder: "Phone or Email",
      addressPlaceholder: "Full business address",
    },
    gu: {
      addNewClient: "નવો ગ્રાહક ઉમેરો",
      editClient: "ગ્રાહક સુધારો",
      customerName: "ગ્રાહકનું નામ",
      companyName: "કંપનીનું નામ",
      contactDetails: "સંપર્ક વિગત",
      address: "સરનામું",
      cancel: "રદ કરો",
      saveClient: "ગ્રાહક સાચવો",
      saving: "સાચવી રહ્યું છે...",
      searchPlaceholder: "ગ્રાહકો શોધો...",
      regularClientLabel: "નિયમિત ગ્રાહક:",
      ordersLabel: "ઓર્ડર્સ",
      noClientsHeading: "કોઈ ગ્રાહકો મળ્યા નથી",
      noClientsQueryDesc: "તમારી શોધ સાથે કોઈ ગ્રાહકો મેળ ખાતા નથી.",
      noClientsEmptyDesc: "તમારા કોટેશન વર્કફ્લોને ઝડપી બનાવવા માટે તમારા પ્રથમ ગ્રાહકને ઉમેરો.",
      regularClientStarBadge: "નિયમિત ગ્રાહક",
      viewQuotesLink: "જુઓ {count} કોટેશન",
      zeroQuotes: "૦ કોટેશન્સ",
      ordersDoneLabel: "ઓર્ડર્સ પૂરા થયા",
      deleteClientHeading: "ગ્રાહક કાઢી નાખો",
      deleteClientConfirmText: "શું તમે ખરેખર {name} ને કાઢી નાખવા માંગો છો? આ પ્રક્રિયા પાછી ખેંચી શકાશે નહીં.",
      deleteBtn: "ગ્રાહક કાઢી નાખો",
      deletingText: "કાઢી રહ્યું છે...",
      changeRegularSetup: "નિયમિત ગ્રાહક સેટઅપ બદલો",
      changeRegularSetupConfirm: "શું તમે ખરેખર નિયમિત ગ્રાહકો માટેની જરૂરિયાત {count} ઓર્ડર{plural} પર સેટ કરવા માંગો છો?",
      regularZeroWarning: "આને 0 પર સેટ કરવાનો અર્થ છે કે કોઈને પણ નિયમિત ગ્રાહક તરીકે ચિહ્નિત કરવામાં આવશે નહીં.",
      confirmChange: "ફેરફારની પુષ્ટિ કરો",
      contactPlaceholder: "ફોન અથવા ઈમેલ",
      addressPlaceholder: "સંપૂર્ણ ધંધાકીય સરનામું",
    },
    hi: {
      addNewClient: "नया ग्राहक जोड़ें",
      editClient: "ग्राहक संपादित करें",
      customerName: "ग्राहक का नाम",
      companyName: "कंपनी का नाम",
      contactDetails: "संपर्क विवरण",
      address: "पता",
      cancel: "रद्द करें",
      saveClient: "ग्राहक सहेजें",
      saving: "सहेज रहा है...",
      searchPlaceholder: "ग्राहक खोजें...",
      regularClientLabel: "नियमित ग्राहक:",
      ordersLabel: "ऑर्डर",
      noClientsHeading: "कोई ग्राहक नहीं मिला",
      noClientsQueryDesc: "आपकी खोज से कोई ग्राहक मेल नहीं खाता।",
      noClientsEmptyDesc: "अपने कोटेशन वर्कफ़्लो को तेज़ करने के लिए अपना पहला ग्राहक जोड़ें।",
      regularClientStarBadge: "नियमित ग्राहक",
      viewQuotesLink: "देखें {count} कोटेशन",
      zeroQuotes: "0 कोटेशन",
      ordersDoneLabel: "ऑर्डर पूर्ण",
      deleteClientHeading: "ग्राहक हटाएं",
      deleteClientConfirmText: "क्या आप वाकई {name} को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।",
      deleteBtn: "ग्राहक हटाएं",
      deletingText: "हटाया जा रहा है...",
      changeRegularSetup: "नियमित ग्राहक सेटअप बदलें",
      changeRegularSetupConfirm: "क्या आप वाकई नियमित ग्राहकों के लिए आवश्यकता को {count} ऑर्डर{plural} पर सेट करना चाहते हैं?",
      regularZeroWarning: "इसे 0 पर सेट करने का अर्थ है कि किसी को भी नियमित ग्राहक के रूप में चिह्नित नहीं किया जाएगा।",
      confirmChange: "परिवर्तन की पुष्टि करें",
      contactPlaceholder: "फोन या ईमेल",
      addressPlaceholder: "व्यवसाय का पूरा पता",
    },
    es: {
      addNewClient: "Agregar Nuevo Cliente",
      editClient: "Editar Cliente",
      customerName: "Nombre del Cliente",
      companyName: "Nombre de la Empresa",
      contactDetails: "Detalles de Contacto",
      address: "Dirección",
      cancel: "Cancelar",
      saveClient: "Guardar Cliente",
      saving: "Guardando...",
      searchPlaceholder: "Buscar clientes...",
      regularClientLabel: "Cliente Regular:",
      ordersLabel: "Pedidos",
      noClientsHeading: "No se encontraron clientes",
      noClientsQueryDesc: "Ningún cliente coincide con su búsqueda.",
      noClientsEmptyDesc: "Agregue su primer cliente para acelerar su flujo de trabajo de cotización.",
      regularClientStarBadge: "Cliente Regular",
      viewQuotesLink: "Ver {count} Cotización(es)",
      zeroQuotes: "0 Cotizaciones",
      ordersDoneLabel: "Pedidos Realizados",
      deleteClientHeading: "Eliminar Cliente",
      deleteClientConfirmText: "¿Está seguro de que desea eliminar a {name}? Esta acción no se puede deshacer.",
      deleteBtn: "Eliminar Cliente",
      deletingText: "Eliminando...",
      changeRegularSetup: "Cambiar Configuración de Cliente Regular",
      changeRegularSetupConfirm: "¿Está seguro de que desea establecer el requisito para Clientes Regulares en {count} pedido{plural}?",
      regularZeroWarning: "Establecer esto en 0 significa que nadie será marcado como Cliente Regular.",
      confirmChange: "Confirmar Cambio",
      contactPlaceholder: "Teléfono o Correo",
      addressPlaceholder: "Dirección comercial completa",
    }
  };

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  const [clients, setClients] = useState<Client[]>([]);
  const [clientQuotes, setClientQuotes] = useState<Record<string, any[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [regularThreshold, setRegularThreshold] = useState<string>("");
  const [savedThreshold, setSavedThreshold] = useState<string>("0");
  const [updatingThreshold, setUpdatingThreshold] = useState(false);
  const [thresholdConfirmValue, setThresholdConfirmValue] = useState<number | null>(null);
  
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
      const [profile, settings] = await Promise.all([
        getUserProfile(), 
        getUserSettings().catch(() => null)
      ]);
      if (!profile) return;
      
      if (settings) {
        const val = settings.regular_client_threshold ?? 0;
        setRegularThreshold(val === 0 ? "" : val.toString());
        setSavedThreshold(val.toString());
      }

      const [clientsRes, quotesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('user_id', profile.id.toString())
          .order('name', { ascending: true }),
        supabase
          .from('quotations')
          .select('id, client_name, quote_number, quote_date, total_amount, created_at, is_order_done')
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
      
      try {
        sessionStorage.setItem("digiscale_clients", JSON.stringify(clientsRes.data || []));
        sessionStorage.setItem("digiscale_client_quotes", JSON.stringify(quotesMap));
      } catch (e) {}
    } catch (err: any) {
      alert(err.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveThresholdClick = () => {
    const num = regularThreshold === "" ? 0 : parseInt(regularThreshold) || 0;
    if (num < 0) return;
    setThresholdConfirmValue(num);
  };

  const executeSaveThreshold = async () => {
    if (thresholdConfirmValue === null) return;
    setUpdatingThreshold(true);
    try {
      await updateUserSettings({ regular_client_threshold: thresholdConfirmValue });
      setSavedThreshold(thresholdConfirmValue.toString());
      setRegularThreshold(thresholdConfirmValue === 0 ? "" : thresholdConfirmValue.toString());
      setThresholdConfirmValue(null);
    } catch (e) {
      console.error("Failed to update regular client threshold", e);
    } finally {
      setUpdatingThreshold(false);
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
    <div className="px-2.5 sm:px-8 pt-1.5 sm:pt-4 pb-6 flex-1 flex flex-col overflow-hidden bg-slate-50/50 min-h-0 w-full">
      {/* Static Toolbar Header */}
      <div className="shrink-0 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between mb-1.5 sm:mb-3 w-full">
        {/* Toolbar */}
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between w-full">
          <div className="flex gap-2 w-full lg:max-w-3xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between lg:justify-end gap-2 w-full lg:w-auto">
            <div className="hidden sm:flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition group">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span className="text-xs font-bold text-slate-700">{t("regularClientLabel")}</span>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm group-focus-within:border-blue-200 transition-colors">
                <input 
                  type="number" 
                  value={regularThreshold}
                  placeholder="0"
                  onChange={(e) => setRegularThreshold(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (regularThreshold === "" ? "0" : regularThreshold) !== savedThreshold && handleSaveThresholdClick()}
                  className="w-6 text-center text-xs font-bold text-slate-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent placeholder-slate-400"
                  min="0"
                  disabled={updatingThreshold}
                />
                <span className="text-[10px] font-bold text-slate-400">{t("ordersLabel")}</span>
              </div>
              {(regularThreshold === "" ? "0" : regularThreshold) !== savedThreshold && (
                <button 
                  onClick={handleSaveThresholdClick}
                  disabled={updatingThreshold}
                  className="p-1 ml-1 hover:bg-blue-50 text-blue-600 rounded-md transition bg-blue-50/50"
                  title="Save"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white transition shadow-sm active:scale-95 shrink-0 w-full lg:w-auto cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{t("addNewClient")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto min-h-0 pt-1 sm:pt-6 pb-20 sm:pb-8">

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
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t("noClientsHeading")}</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {searchQuery ? t("noClientsQueryDesc") : t("noClientsEmptyDesc")}
            </p>
            {!searchQuery && (
              <button
                onClick={() => openModal()}
                className="mt-6 text-blue-600 font-semibold hover:text-blue-700 text-sm"
              >
                + {t("addNewClient")}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClients.map((client) => {
              const quotes = clientQuotes[client.name?.toLowerCase()] || [];
              const doneQuotes = quotes.filter(q => q.is_order_done).length;
              const savedNum = parseInt(savedThreshold) || 0;
              const isRegularClient = savedNum > 0 && doneQuotes >= savedNum;
              
              return (
              <div 
                key={client.id}
                className={`bg-white rounded-2xl border ${isRegularClient ? 'border-amber-300 shadow-amber-100' : 'border-slate-200'} p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}
              >
                {isRegularClient ? (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1 z-10">
                    <Award className="w-3 h-3" />
                    {t("regularClientStarBadge")}
                  </div>
                ) : null}
                
                <div className="flex justify-between items-start mb-4">
                  <div className={isRegularClient ? "pr-24" : "pr-14"}>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base pr-4 line-clamp-2">
                      {client.company ? `${client.company} | ${client.name}` : client.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity absolute right-4 top-4 md:top-10 bg-slate-100/80 md:bg-white/80 backdrop-blur-sm rounded-lg p-0.5 border border-slate-200/50 md:border-transparent z-10">
                    <button 
                      onClick={() => openModal(client)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => confirmDelete(client.id, client.name)}
                      className="p-1.5 text-slate-500 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors"
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
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{lang === "gu" ? "કોટેશન્સ" : lang === "hi" ? "कोटेशन" : lang === "es" ? "Cotizaciones" : "Quotations"}</span>
                    </div>
                    
                    {quotes.length > 0 ? (
                      <Link
                        href={`/clients/${client.id}`}
                        className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {t("viewQuotesLink").replace("{count}", quotes.length.toString())}
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">
                        {t("zeroQuotes")}
                      </span>
                    )}
                  </div>
                  
                  {quotes.length > 0 && (
                    <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2 px-3 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-slate-600">{t("ordersDoneLabel")}</span>
                      </div>
                      <span className="text-sm font-black text-emerald-600">{doneQuotes} <span className="text-xs text-slate-400 font-medium">/ {quotes.length}</span></span>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}

      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-900 text-lg">
                {editingId ? t('editClient') : t('addNewClient')}
              </h2>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-650 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="client-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">{t('customerName')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder={lang === "gu" ? "દા.ત. નરેન્દ્ર મોદી" : lang === "hi" ? "जैसे राहुल कुमार" : "e.g. John Doe"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">{t('companyName')}</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder={lang === "gu" ? "દા.ત. લિફો આર્ટિફિશિયલ" : lang === "hi" ? "जैसे एक्मे कॉर्प" : "e.g. Acme Corp"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">{t('contactDetails')}</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder={t('contactPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">{t('address')}</label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    placeholder={t('addressPlaceholder')}
                  />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-bold text-slate-655 hover:text-slate-900 transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                form="client-form"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('saveClient')
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
                {t("deleteClientHeading")}
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
                {t("deleteClientConfirmText").replace("{name}", deleteConfirmName)}
              </p>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={executeDelete}
                disabled={deleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-red-500/20 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("deletingText")}
                  </>
                ) : (
                  t("deleteBtn")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Threshold Confirmation Modal */}
      {thresholdConfirmValue !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setThresholdConfirmValue(null)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                {t('changeRegularSetup')}
              </h2>
              <button 
                onClick={() => setThresholdConfirmValue(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-600 text-sm">
                Are you sure you want to set the requirement for Regular Clients to <span className="font-bold text-slate-900">{thresholdConfirmValue} order{thresholdConfirmValue === 1 ? '' : 's'}</span>?
              </p>
              {thresholdConfirmValue === 0 && (
                <p className="text-amber-600 text-sm mt-3 font-medium bg-amber-50 p-3 rounded-lg border border-amber-200/50">
                  Setting this to 0 means <span className="font-bold">nobody</span> will be marked as a Regular Client.
                </p>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setThresholdConfirmValue(null)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeSaveThreshold}
                disabled={updatingThreshold}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
              >
                {updatingThreshold ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Confirm Change'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
