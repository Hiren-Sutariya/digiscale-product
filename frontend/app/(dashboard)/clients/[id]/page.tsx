"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserProfile } from "@/services/api";
import { ArrowLeft, Building, MapPin, Phone, FileText, Calendar, IndianRupee, ExternalLink } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClientDetails();
  }, [clientId]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      if (!profile) throw new Error("Not authenticated");

      // Fetch client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('user_id', profile.id.toString())
        .single();

      if (clientError) throw clientError;
      if (!clientData) throw new Error("Client not found");

      setClient(clientData);

      // Fetch quotations for this client
      // Since quotations are saved with client_name, we match by name
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotations')
        .select('id, quote_number, quote_date, total_amount, created_at, is_order_done')
        .eq('user_id', profile.id.toString())
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
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50/50 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Client Details</h1>
        </div>

      {/* Client Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-1.5">{client.name}</h2>
            {client.company && (
              <div className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-md inline-flex mb-2">
                <Building className="w-3.5 h-3.5" />
                <span className="text-sm">{client.company}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="flex items-start gap-2.5 text-slate-600">
              <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              <span className="text-sm font-medium leading-relaxed">{client.address || "No address provided"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm font-bold">{client.contact || "No contact provided"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quotations List */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Client Orders</h3>
            </div>
          </div>
          <div>
            <select
              value={quoteFilter}
              onChange={(e) => setQuoteFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
            >
              <option value="all">All Orders ({quotations.length})</option>
              <option value="done">Done ({quotations.filter(q => q.is_order_done).length})</option>
              <option value="followup">Follow Up ({quotations.filter(q => !q.is_order_done).length})</option>
            </select>
          </div>
        </div>

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
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-black rounded-md group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                      {quote.quote_number}
                    </span>
                    {quote.is_order_done && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider rounded-md">
                        Done
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
