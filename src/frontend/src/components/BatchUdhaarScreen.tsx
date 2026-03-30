import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Loader2,
  Minus,
  Plus,
  ScanLine,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { useCamera } from "../camera/useCamera";
import { useCSVProducts } from "../hooks/useCSVProducts";
import { useAddBatchTransaction, useAllProducts } from "../hooks/useQueries";
import { formatCurrency } from "../utils/format";

interface SessionItem {
  barcode: string;
  name: string;
  price: number;
  qty: number;
}

interface Props {
  customerId: bigint;
  customerName: string;
  customerMobile: string;
  onClose: () => void;
  onSaved: () => void;
}

function loadSession(customerId: bigint): SessionItem[] {
  try {
    const raw = localStorage.getItem(`batchSession_${customerId.toString()}`);
    if (raw) return JSON.parse(raw) as SessionItem[];
  } catch (_e) {
    /* ignore */
  }
  return [];
}

function saveSession(customerId: bigint, items: SessionItem[]) {
  localStorage.setItem(
    `batchSession_${customerId.toString()}`,
    JSON.stringify(items),
  );
}

function clearSession(customerId: bigint) {
  localStorage.removeItem(`batchSession_${customerId.toString()}`);
}

function csvToProduct(csv: {
  name: string;
  price: number;
  barcode: string;
}): Product {
  return {
    id: 0n,
    name: csv.name,
    price: csv.price,
    barcode: csv.barcode,
    createdAt: 0n,
  };
}

export function BatchUdhaarScreen({
  customerId,
  customerName,
  onClose,
  onSaved,
}: Props) {
  const [items, setItems] = useState<SessionItem[]>(() =>
    loadSession(customerId),
  );
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: allProducts } = useAllProducts();
  const { csvProducts } = useCSVProducts();
  const addBatchTx = useAddBatchTransaction();

  const {
    isActive,
    isLoading: camLoading,
    error: camError,
    startCamera,
    stopCamera,
    videoRef,
    canvasRef,
    isSupported,
  } = useCamera({ facingMode: "environment", width: 640, height: 480 });

  // Persist session on change
  useEffect(() => {
    saveSession(customerId, items);
  }, [items, customerId]);

  const addOrIncrement = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.barcode === product.barcode);
      if (existing) {
        return prev.map((i) =>
          i.barcode === product.barcode ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          barcode: product.barcode,
          name: product.name,
          price: product.price,
          qty: 1,
        },
      ];
    });
  }, []);

  // BarcodeDetector scanning loop
  useEffect(() => {
    if (scannerOpen && isActive) {
      const BarcodeDetectorAPI = (window as any).BarcodeDetector;
      if (!BarcodeDetectorAPI) return;
      const detector = new BarcodeDetectorAPI({
        formats: [
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "code_128",
          "code_39",
          "qr_code",
        ],
      });
      scanIntervalRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue as string;
            // Try backend products first, then CSV fallback
            const found =
              allProducts?.find((p) => p.barcode === barcode) ??
              (csvProducts.find((p) => p.barcode === barcode)
                ? csvToProduct(csvProducts.find((p) => p.barcode === barcode)!)
                : undefined);
            if (found) {
              addOrIncrement(found);
              toast.success(`Added: ${found.name}`, { duration: 1000 });
            } else {
              toast.error("Product not found", { duration: 1500 });
            }
          }
        } catch (_e) {
          /* silent */
        }
      }, 800);
      return () => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      };
    }
  }, [
    scannerOpen,
    isActive,
    videoRef,
    allProducts,
    csvProducts,
    addOrIncrement,
  ]);

  const openScanner = async () => {
    setScannerOpen(true);
    await startCamera();
  };

  const closeScanner = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    stopCamera();
    setScannerOpen(false);
  };

  const adjustQty = (barcode: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.barcode === barcode ? { ...i, qty: Math.max(1, i.qty + delta) } : i,
        )
        .filter((i) => i.qty > 0),
    );
  };

  const setQty = (barcode: string, val: string) => {
    const n = Number.parseInt(val);
    if (Number.isNaN(n) || n < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.barcode === barcode ? { ...i, qty: n } : i)),
    );
  };

  const removeItem = (barcode: string) => {
    setItems((prev) => prev.filter((i) => i.barcode !== barcode));
  };

  const handleManualAdd = () => {
    const bc = manualBarcode.trim();
    if (!bc) return;
    // Try backend products first, then CSV fallback
    const backendFound = allProducts?.find((p) => p.barcode === bc);
    if (backendFound) {
      addOrIncrement(backendFound);
      setManualBarcode("");
      return;
    }
    const csvFound = csvProducts.find((p) => p.barcode === bc);
    if (csvFound) {
      addOrIncrement(csvToProduct(csvFound));
      setManualBarcode("");
    } else {
      toast.error("Product not found");
    }
  };

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleSaveAll = async () => {
    if (items.length === 0) {
      toast.error("No items to save");
      return;
    }
    const itemsPayload = items.map((i) => ({
      name: i.name,
      price: i.price,
      qty: i.qty,
      barcode: i.barcode,
      subtotal: i.price * i.qty,
    }));
    const result = await addBatchTx.mutateAsync({
      customerId,
      totalAmount: total,
      itemsJson: JSON.stringify(itemsPayload),
      note: "",
    });
    if (result) {
      clearSession(customerId);
      toast.success(`Udhaar saved — ${formatCurrency(total)}`);
      onSaved();
    } else {
      toast.error("Failed to save udhaar");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      data-ocid="batch_udhaar.panel"
    >
      {/* Header */}
      <div className="app-header px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-ocid="batch_udhaar.back.button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 -ml-1"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base leading-tight truncate">
              Batch Udhaar
            </h1>
            <p className="text-white/60 text-xs truncate">{customerName}</p>
          </div>
          {isSupported !== false && (
            <button
              type="button"
              data-ocid="batch_udhaar.scan.button"
              onClick={scannerOpen ? closeScanner : openScanner}
              className="bg-white/15 text-white rounded-lg p-2"
            >
              {scannerOpen ? <CameraOff size={20} /> : <Camera size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Scanner panel */}
      {scannerOpen && (
        <div className="relative bg-black" style={{ height: 220 }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {/* Scan overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-44 h-28 border-2 border-white/60 rounded-lg relative">
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/80 animate-pulse" />
            </div>
          </div>
          {camLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="text-white animate-spin" size={32} />
            </div>
          )}
          {camError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <p className="text-white text-sm text-center px-4">
                {camError.message}
              </p>
            </div>
          )}
          {isActive && !camError && (
            <div className="absolute bottom-2 left-0 right-0 text-center">
              <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                Scanning… point at barcode
              </span>
            </div>
          )}
        </div>
      )}

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {items.length === 0 && (
          <div
            data-ocid="batch_udhaar.empty_state"
            className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          >
            <ScanLine size={52} className="text-muted-foreground/40" />
            <div>
              <p className="text-muted-foreground font-medium">
                Scan a product to begin
              </p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Tap the camera icon above or enter barcode below
              </p>
            </div>
          </div>
        )}

        {items.map((item, idx) => (
          <div
            key={item.barcode}
            data-ocid={`batch_udhaar.item.${idx + 1}`}
            className="bg-card rounded-xl p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatCurrency(item.price)} each
                </p>
              </div>
              <button
                type="button"
                data-ocid={`batch_udhaar.delete_button.${idx + 1}`}
                onClick={() => removeItem(item.barcode)}
                className="text-muted-foreground hover:text-destructive p-1 flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  data-ocid={`batch_udhaar.qty_minus.${idx + 1}`}
                  onClick={() => adjustQty(item.barcode, -1)}
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center active:bg-muted-foreground/20"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => setQty(item.barcode, e.target.value)}
                  className="w-12 h-9 text-center text-sm font-bold bg-muted rounded-lg border-0 outline-none"
                />
                <button
                  type="button"
                  data-ocid={`batch_udhaar.qty_plus.${idx + 1}`}
                  onClick={() => adjustQty(item.barcode, 1)}
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center active:bg-muted-foreground/20"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="font-bold text-sm text-foreground">
                {formatCurrency(item.price * item.qty)}
              </span>
            </div>
          </div>
        ))}

        {/* Manual barcode entry */}
        <div className="flex gap-2 pt-2 pb-4">
          <Input
            data-ocid="batch_udhaar.barcode.input"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
            placeholder="Enter barcode manually…"
            className="flex-1 h-11"
          />
          <Button
            type="button"
            data-ocid="batch_udhaar.manual_add.button"
            variant="outline"
            className="h-11 px-4"
            onClick={handleManualAdd}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="border-t border-border bg-card px-4 pt-4 pb-6">
        <div
          data-ocid="batch_udhaar.total.section"
          className="text-center mb-4"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
            Total
          </p>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(total)}
          </p>
          {items.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {items.length} item{items.length !== 1 ? "s" : ""} ·{" "}
              {items.reduce((s, i) => s + i.qty, 0)} units
            </p>
          )}
        </div>
        <Button
          type="button"
          data-ocid="batch_udhaar.save.primary_button"
          className="w-full h-14 text-base font-bold"
          style={{ backgroundColor: "var(--slate-dark)", color: "white" }}
          onClick={handleSaveAll}
          disabled={addBatchTx.isPending || items.length === 0}
        >
          {addBatchTx.isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : null}
          {addBatchTx.isPending ? "Saving…" : "Save All"}
        </Button>
        <button
          type="button"
          data-ocid="batch_udhaar.cancel.button"
          onClick={onClose}
          className="w-full text-center mt-3 text-sm text-muted-foreground hover:text-foreground py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
