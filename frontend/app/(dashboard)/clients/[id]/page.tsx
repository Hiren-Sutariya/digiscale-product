"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserProfile } from "@/services/api";
import { ArrowLeft, Building, MapPin, Phone, FileText, Calendar, IndianRupee, ExternalLink, ChevronLeft, ChevronDown, Check } from "lucide-react";
import Link from "next/link";

interface Client {
  id: number;
  name: string;
  company: string | null;
  address: string | null;
  contact: string | null;
}

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [quoteFilter, setQuoteFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let initialLoad = true;
    try {
      const cachedClients = JSON.parse(sessionStorage.getItem("digiscale_clients") || "[]");
      const cachedClient = cachedClients.find((c: any) => c.id.toString() === clientId);
      if (cachedClient) {
        setClient(cachedClient);
        const cachedQuotes = JSON.parse(sessionStorage.getItem("digiscale_client_quotes") || "{}");
        if (cachedQuotes[cachedClient.name.toLowerCase()]) {
          setQuotations(cachedQuotes[cachedClient.name.toLowerCase()]);
        }
        setLoading(false);
        initialLoad = false;
      }
    } catch (e) {}

    fetchClientDetails(initialLoad);
  }, [clientId]);

  const fetchClientDetails = async (showLoading: boolean = true) => {
    try {
      if (showLoading) setLoading(true);
      const profile = await getUserProfile();
      if (!profile) throw new Error("Not authenticated");

      const targetUserId = (profile.role === "Staff" && profile.admin_id) ? profile.admin_id.toString() : profile.id.toString();

      // Fetch client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('user_id', targetUserId)
        .single();

      if (clientError) throw clientError;
      if (!clientData) throw new Error("Client not found");

      setClient(clientData);

      // Fetch quotations for this client
      // Since quotations are saved with client_name, we match by name
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotations')
        .select('id, quote_number, quote_date, total_amount, created_at, is_order_done, staff_name')
        .eq('user_id', targetUserId)
        .ilike('client_name', clientData.name)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;
      
      setQuotations(quotesData || []);
    } catch (err: any) {
      setError(err.message || "Failed to load client details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex flex-col items-center justify-center gap-2">
          <p className="font-bold">{error || "Client not found"}</p>
          <button 
            onClick={() => router.back()}
            className="text-sm bg-white px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50/50 relative">
      <div className="w-full space-y-6">
        
        {/* Header / Back Button & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <button 
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-650 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 w-fit"
          >
            <ChevronLeft className="h-4 w-4 text-slate-400 group-hover:text-slate-650 transition-transform group-hover:-translate-x-0.5" />
            Back to Clients
          </button>

          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm w-full sm:w-44 justify-between"
            >
              <span>
                {quoteFilter === "all" ? `All Orders (${quotations.length})` : 
                 quoteFilter === "done" ? `Done (${quotations.filter(q => q.is_order_done).length})` : 
                 `Follow Up (${quotations.filter(q => !q.is_order_done).length})`}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 sm:right-0 sm:left-auto top-full mt-2 w-full sm:w-44 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 p-1.5 z-20">
                  <button 
                    onClick={() => { setQuoteFilter("all"); setIsFilterOpen(false); }} 
                    className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition ${quoteFilter === "all" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    All Orders ({quotations.length})
                    {quoteFilter === "all" && <Check className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => { setQuoteFilter("done"); setIsFilterOpen(false); }} 
                    className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition ${quoteFilter === "done" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    Done ({quotations.filter(q => q.is_order_done).length})
                    {quoteFilter === "done" && <Check className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => { setQuoteFilter("followup"); setIsFilterOpen(false); }} 
                    className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition ${quoteFilter === "followup" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    Follow Up ({quotations.filter(q => !q.is_order_done).length})
                    {quoteFilter === "followup" && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Client Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-3 line-clamp-2">
              <div className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                <Building className="h-4 w-4 text-slate-500" />
              </div>
              <span className="line-clamp-2" title={client.company ? `${client.company} | ${client.name}` : client.name}>
                {client.company ? `${client.company} | ${client.name}` : client.name}
              </span>
            </h2>
          </div>
          
          <div className="flex flex-col gap-2 min-w-[200px] sm:max-w-[350px] shrink-0">
            <div className="flex items-start gap-2 text-slate-800">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span className="text-sm font-semibold line-clamp-2 text-left" title={client.address || ""}>{client.address || "No address provided"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm font-semibold">{client.contact || "No contact provided"}</span>
            </div>
          </div>
        </div>

      {/* Quotations List */}
      <div>

        {quotations.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-slate-300" />
            </div>
            <h4 className="text-slate-900 font-bold text-base mb-1.5">No Quotations Yet</h4>
            <p className="text-slate-500 text-sm font-medium max-w-sm">You haven't sent any quotations to {client.name} yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quotations.filter(q => {
              if (quoteFilter === "all") return true;
              if (quoteFilter === "done") return q.is_order_done;
              if (quoteFilter === "followup") return !q.is_order_done;
              return true;
            }).map((quote) => (
              <div 
                key={quote.id} 
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-black rounded-md group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                      {quote.quote_number}
                    </span>
                    {quote.is_order_done && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider rounded-md">
                        Done
                      </span>
                    )}
                    {quote.staff_name && (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[8px] font-bold text-blue-600 ring-1 ring-inset ring-blue-500/20 uppercase tracking-wide">
                        👤 {quote.staff_name}
                      </span>
                    )}
                  </div>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                </div>
                
                <div className="mb-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                  <p className="text-xs font-bold text-slate-700">{new Date(quote.quote_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                
                <div className="pt-3 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Amount</p>
                    <p className="text-base font-black text-slate-900 flex items-center gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                      {quote.total_amount?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
