import { Toaster } from "@/components/ui/sonner";
import { Home, Package, Settings } from "lucide-react";
import { useState } from "react";
import type { CustomerBalance } from "./backend.d";
import { BatchUdhaarScreen } from "./components/BatchUdhaarScreen";
import { CustomerProfile } from "./components/CustomerProfile";
import { HomeScreen } from "./components/HomeScreen";
import { ProductsScreen } from "./components/ProductsScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { TransactionHistory } from "./components/TransactionHistory";

export type Screen =
  | { id: "home" }
  | { id: "customerProfile"; customer: CustomerBalance }
  | { id: "transactionHistory"; customer: CustomerBalance }
  | { id: "batchUdhaar"; customer: CustomerBalance }
  | { id: "products" }
  | { id: "settings" };

export type NavTab = "home" | "products" | "settings";

export default function App() {
  const [screen, setScreen] = useState<Screen>({ id: "home" });
  const [activeTab, setActiveTab] = useState<NavTab>("home");

  const navigate = (s: Screen) => {
    if (s.id === "home" || s.id === "products" || s.id === "settings") {
      setActiveTab(s.id as NavTab);
    }
    setScreen(s);
  };

  const goHome = () => navigate({ id: "home" });

  const isTopLevel =
    screen.id === "home" ||
    screen.id === "products" ||
    screen.id === "settings";

  return (
    <div
      className="flex flex-col h-full max-w-[480px] mx-auto bg-background"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <main className="flex-1 overflow-hidden flex flex-col">
        {screen.id === "home" && <HomeScreen navigate={navigate} />}
        {screen.id === "customerProfile" && (
          <CustomerProfile
            customerBalance={screen.customer}
            navigate={navigate}
            onBack={goHome}
          />
        )}
        {screen.id === "transactionHistory" && (
          <TransactionHistory
            customerBalance={screen.customer}
            onBack={() =>
              navigate({ id: "customerProfile", customer: screen.customer })
            }
          />
        )}
        {screen.id === "batchUdhaar" && (
          <BatchUdhaarScreen
            customerId={screen.customer.customer.id}
            customerName={screen.customer.customer.name}
            customerMobile={screen.customer.customer.mobile}
            onClose={() =>
              navigate({ id: "customerProfile", customer: screen.customer })
            }
            onSaved={() =>
              navigate({ id: "customerProfile", customer: screen.customer })
            }
          />
        )}
        {screen.id === "products" && <ProductsScreen navigate={navigate} />}
        {screen.id === "settings" && <SettingsScreen navigate={navigate} />}
      </main>

      {isTopLevel && (
        <nav
          className="flex items-center justify-around border-t border-border bg-card py-2"
          style={{ minHeight: 56 }}
        >
          <button
            type="button"
            data-ocid="nav.home.link"
            className={`flex flex-col items-center gap-0.5 px-5 py-1 rounded-lg ${
              activeTab === "home" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => navigate({ id: "home" })}
          >
            <Home size={22} />
            <span className="text-[10px] font-semibold">Home</span>
          </button>
          <button
            type="button"
            data-ocid="nav.products.link"
            className={`flex flex-col items-center gap-0.5 px-5 py-1 rounded-lg ${
              activeTab === "products"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => navigate({ id: "products" })}
          >
            <Package size={22} />
            <span className="text-[10px] font-semibold">Products</span>
          </button>
          <button
            type="button"
            data-ocid="nav.settings.link"
            className={`flex flex-col items-center gap-0.5 px-5 py-1 rounded-lg ${
              activeTab === "settings"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => navigate({ id: "settings" })}
          >
            <Settings size={22} />
            <span className="text-[10px] font-semibold">Settings</span>
          </button>
        </nav>
      )}
      <Toaster position="top-center" />
    </div>
  );
}
