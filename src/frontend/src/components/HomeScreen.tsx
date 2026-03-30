import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Screen } from "../App";
import type { CustomerBalance } from "../backend.d";
import { useAllCustomers } from "../hooks/useQueries";
import {
  formatCurrency,
  getInitials,
  getSettings,
  isInactive,
} from "../utils/format";
import { AddCustomerSheet } from "./AddCustomerSheet";

interface Props {
  navigate: (s: Screen) => void;
}

export function HomeScreen({ navigate }: Props) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { data: customers, isLoading } = useAllCustomers();
  const settings = getSettings();

  const filtered = useMemo(() => {
    if (!customers) return [];
    const q = search.toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (cb) =>
        cb.customer.name.toLowerCase().includes(q) ||
        cb.customer.mobile.includes(q),
    );
  }, [customers, search]);

  const totalDue = useMemo(
    () => (customers || []).reduce((s, c) => s + c.remainingBalance, 0),
    [customers],
  );

  return (
    <div className="screen-container">
      {/* Header */}
      <div className="app-header px-4 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Credit Shop</h1>
            <p className="text-white/60 text-xs mt-0.5">
              {customers?.length || 0} customers · {formatCurrency(totalDue)}{" "}
              due
            </p>
          </div>
          <div className="bg-white/10 rounded-full px-3 py-1">
            <span className="text-white/80 text-xs font-medium">Today</span>
          </div>
        </div>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
            size={16}
          />
          <Input
            data-ocid="home.search_input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or mobile…"
            className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10 text-sm"
          />
        </div>
      </div>

      {/* Customer list */}
      <div className="scroll-area px-4 py-4 space-y-2 pb-6">
        {isLoading && (
          <div data-ocid="home.loading_state" className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div
            data-ocid="home.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search size={24} className="text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold">No customers yet</p>
            <p className="text-muted-foreground text-sm mt-1">
              Tap the + button to add your first customer
            </p>
          </div>
        )}

        {!isLoading &&
          filtered.map((cb, idx) => (
            <CustomerRow
              key={cb.customer.id.toString()}
              cb={cb}
              threshold={settings.threshold}
              inactiveDays={settings.inactiveDays}
              index={idx + 1}
              onClick={() => navigate({ id: "customerProfile", customer: cb })}
            />
          ))}
      </div>

      {/* FAB */}
      <button
        type="button"
        data-ocid="home.add_customer.primary_button"
        onClick={() => setAddOpen(true)}
        className="fixed bottom-[72px] right-4 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg text-sm font-bold z-20 text-white"
        style={{ backgroundColor: "var(--slate-dark)" }}
      >
        <Plus size={18} />
        Add Customer
      </button>

      <AddCustomerSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function CustomerRow({
  cb,
  threshold,
  inactiveDays,
  index,
  onClick,
}: {
  cb: CustomerBalance;
  threshold: number;
  inactiveDays: number;
  index: number;
  onClick: () => void;
}) {
  const isHigh = cb.remainingBalance > threshold;
  const inactive = isInactive(cb.lastPaymentDate, inactiveDays);

  return (
    <button
      type="button"
      data-ocid={`customers.item.${index}`}
      className="customer-row w-full text-left"
      onClick={onClick}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: "var(--slate-dark)" }}
      >
        {getInitials(cb.customer.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">
          {cb.customer.name}
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">
          {cb.customer.mobile}
        </p>
        <div className="flex gap-1.5 mt-1.5">
          {isHigh && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle size={10} /> High
            </span>
          )}
          {inactive && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              <Clock size={10} /> Inactive
            </span>
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="text-right flex-shrink-0">
        <p
          className={`text-sm font-bold ${
            cb.remainingBalance > 0 ? "text-destructive" : "text-primary"
          }`}
        >
          {formatCurrency(cb.remainingBalance)}
        </p>
        <p className="text-muted-foreground text-[10px] mt-0.5">remaining</p>
      </div>
    </button>
  );
}
