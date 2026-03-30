import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import type { CustomerBalance } from "./backend.d";
import { BatchUdhaarScreen } from "./components/BatchUdhaarScreen";
import { CustomerProfile } from "./components/CustomerProfile";
import { HomeScreen } from "./components/HomeScreen";
import { ProductsScreen } from "./components/ProductsScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { Sidebar } from "./components/Sidebar";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (s: Screen) => {
    if (s.id === "home" || s.id === "products" || s.id === "settings") {
      setActiveTab(s.id as NavTab);
    }
    setScreen(s);
  };

  const goHome = () => navigate({ id: "home" });

  return (
    <div
      className="flex flex-col h-full max-w-[480px] mx-auto bg-background"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigate={navigate}
        activeTab={activeTab}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {screen.id === "home" && (
          <HomeScreen
            navigate={navigate}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
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
        {screen.id === "products" && (
          <ProductsScreen
            navigate={navigate}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
        {screen.id === "settings" && (
          <SettingsScreen
            navigate={navigate}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
      </main>

      <Toaster position="bottom-center" />
    </div>
  );
}
