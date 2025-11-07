import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface PatientProfile {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  customerNumber?: string | null;
}

interface Props {
  selected?: PatientProfile | null;
  onSelect: (p: PatientProfile) => void;
  placeholder?: string;
  className?: string;
}

export default function PatientSearchInput({ selected, onSelect, placeholder, className }: Props) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      const formatted = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        dateOfBirth: p.dateOfBirth,
        customerNumber: `PAT-${p.id.slice(0,8).toUpperCase()}`,
      }));
      setCustomers(formatted);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load patients', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.customerNumber || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className={className}>
      <div className="mb-3">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder || 'Search patients by name, email, phone or ID...'}
            className="pl-10 h-10"
          />
        </div>
      </div>

      <ScrollArea className="h-56">
        <div className="space-y-2 -mr-2 pr-2">
          {loading ? (
            <div className="text-center py-6 text-gray-500 text-sm">Loading patients...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">{searchQuery ? 'No patients found' : 'No patients available'}</div>
          ) : (
            filtered.map((customer) => (
              <button
                key={customer.id}
                onClick={() => onSelect(customer)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selected?.id === customer.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-sm">{customer.name}</div>
                    <div className="text-xs opacity-80 truncate">{customer.email}</div>
                    <div className="text-xs opacity-70 mt-0.5">{customer.customerNumber}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
