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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Client Details</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">View and manage information for {client.name}</p>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">{client.name}</h2>
            {client.company && (
              <div className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg inline-flex mb-4">
                <Building className="w-4 h-4" />
                <span>{client.company}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3 min-w-[250px] bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-start gap-3 text-slate-700">
              <MapPin className="w-5 h-5 mt-0.5 text-slate-400 shrink-0" />
              <span className="text-sm font-medium leading-relaxed">{client.address || "No address provided"}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <Phone className="w-5 h-5 text-slate-400 shrink-0" />
              <span className="text-sm font-bold">{client.contact || "No contact provided"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quotations List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Sent Quotations</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Total {quotations.length} quotation{quotations.length !== 1 ? 's' : ''} sent to this client
              </p>
            </div>
          </div>
        </div>

        {quotations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h4 className="text-slate-900 font-bold text-lg mb-2">No Quotations Yet</h4>
            <p className="text-slate-500 font-medium max-w-sm">You haven't sent any quotations to {client.name} yet. Create one from the Quotations tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotations.map((quote) => (
              <div 
                key={quote.id} 
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded-lg group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                      {quote.quote_number}
                    </span>
                    {quote.is_order_done && (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-md">
                        Order Done
                      </span>
                    )}
                  </div>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(quote.quote_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-lg font-black text-slate-900 flex items-center gap-1">
                      <IndianRupee className="w-4 h-4 text-slate-400" />
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
  );
}
