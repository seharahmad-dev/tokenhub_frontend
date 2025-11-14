// StorePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import StoreItem, { StoreItemType } from "../../components/common/StoreItem";
import CartDrawer from "../../components/common/CartDrawer";
import axios from "axios";
import StudentNavbar from "@/components/student/StudentNavbar";

type CartItem = StoreItemType & { qty: number };

function loadStudentFromSession(): { _id?: string; [k: string]: any } | null {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed._id && parsed.id) parsed._id = parsed.id;
    return parsed;
  } catch {
    return null;
  }
}

export default function StorePage() {
  const [student, setStudent] = useState<{ _id?: string; [k: string]: any } | null>(() => loadStudentFromSession());

  const [items, setItems] = useState<StoreItemType[]>(() => {
    const base: Omit<StoreItemType, "id">[] = [
      { title: "USB-C Multiport Hub", price: 25, description: "Expand ports: HDMI, USB-A, SD, PD passthrough", image: "" },
      { title: "65W Power Bank", price: 40, description: "High-capacity fast charging for laptops & phones", image: "" },
      { title: "Bluetooth Headset", price: 30, description: "On-campus calls and lectures with noise reduction", image: "" },
      { title: "Adjustable Laptop Stand", price: 20, description: "Ergonomic aluminum stand for better posture", image: "" },
      { title: "Portable SSD 512GB", price: 55, description: "Fast external storage for projects & backups", image: "" },
      { title: "Wireless Mouse (Silent)", price: 15, description: "Comfortable silent clicks, ideal for libraries", image: "" },
      { title: "Mechanical Keyboard (Compact)", price: 45, description: "Tactile keys for faster typing", image: "" },
      { title: "Laptop Privacy Filter", price: 18, description: "Keep your screen private in public spaces", image: "" },
      { title: "Webcam 1080p", price: 28, description: "Sharp video for online presentations", image: "" },
      { title: "USB Microphone (Plug & Play)", price: 35, description: "Clear audio for recordings & calls", image: "" },
      { title: "Cable Organizer Kit", price: 10, description: "Keep chargers and cables tidy", image: "" },
      { title: "Wireless Charger Stand", price: 22, description: "Fast wireless charging while you work", image: "" },
      { title: "Noise-Isolating Earbuds", price: 18, description: "Compact earbuds for studying & commuting", image: "" },
      { title: "Mini Projector (Portable)", price: 60, description: "Project slides & movies for group study", image: "" },
      { title: "Screen Cleaning Kit", price: 8, description: "Keep displays spotless and smudge-free", image: "" },
      { title: "Router (Portable)", price: 50, description: "Create a quick local network when needed", image: "" },
      { title: "Cable Lock (Laptop)", price: 12, description: "Secure your laptop in shared spaces", image: "" },
      { title: "Laptop Skin (Matte)", price: 9, description: "Protective & stylish skin for laptops", image: "" },
      { title: "USB-C to Ethernet Adapter", price: 14, description: "Stable wired internet when Wi-Fi lags", image: "" },
      { title: "Laptop Cooling Pad", price: 20, description: "Keep temps down during heavy tasks", image: "" },
    ];
    return base.map((b, i) => ({ id: `tech-${i + 1}`, ...b }));
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [availableTokens, setAvailableTokens] = useState<number | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);

  useEffect(() => {
    const onStorage = () => setStudent(loadStudentFromSession());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const fetchTokens = async () => {
      const s = student ?? loadStudentFromSession();
      if (!s?._id) {
        setAvailableTokens(null);
        return;
      }
      setLoadingTokens(true);
      try {
        const baseURL = import.meta.env.VITE_TOKEN_API || "";
        const resp = await axios.get(`${baseURL}/token/${s._id}/total`, { withCredentials: true, timeout: 5000 });
        const data = resp?.data?.data ?? resp?.data;

        let avail: number | undefined;
        if (data && typeof data === "object") {
          if (typeof data.availableTokens === "number") avail = data.availableTokens;
          else if (data.token && typeof data.token.availableTokens === "number") avail = data.token.availableTokens;
          else if (typeof data.totalTokens === "number") avail = data.totalTokens;
          else if (data.token && typeof data.token.totalTokens === "number") avail = data.token.totalTokens;
        }
        setAvailableTokens(avail ?? null);
      } catch (err) {
        console.error("Failed to fetch tokens", err);
        setAvailableTokens(null);
      } finally {
        setLoadingTokens(false);
      }
    };
    fetchTokens();
  }, [student?._id]);

  // ----- image fetch logic (DummyJSON primary, FakeStore fallback) -----
  useEffect(() => {
    let mounted = true;
    const cache: Record<string, string | null> = {};
    const fakeStoreCache: string[] | null = null;

    // helper: try DummyJSON search by query -> returns first image url or null
    const fetchFromDummy = async (q: string) => {
      if (cache[q] !== undefined) return cache[q];
      try {
        const url = `https://dummyjson.com/products/search?q=${encodeURIComponent(q)}`;
        const r = await axios.get(url, { timeout: 6000 });
        const list = r?.data?.products ?? [];
        if (Array.isArray(list) && list.length > 0) {
          // prefer image from product.images if available
          const prod = list[0];
          const img = (prod?.images && prod.images.length > 0 && prod.images[0]) || prod?.thumbnail || null;
          cache[q] = img;
          return img;
        }
      } catch (e) {
        // ignore
      }
      cache[q] = null;
      return null;
    };

    // helper: fallback to FakeStore - fetch once, try to match by keywords
    let fakeStoreProducts: any[] | null = null;
    const fetchFakeStore = async (q: string) => {
      if (cache[q] !== undefined) return cache[q];
      try {
        if (!fakeStoreProducts) {
          const r = await axios.get(`https://fakestoreapi.com/products`, { timeout: 8000 });
          fakeStoreProducts = Array.isArray(r?.data) ? r.data : [];
        }
        const match = fakeStoreProducts.find((p) => (p.title || "").toLowerCase().includes(q.toLowerCase().split(" ")[0]));
        const img = match?.image ?? null;
        cache[q] = img;
        return img;
      } catch (e) {
        cache[q] = null;
        return null;
      }
    };

    // main: attempt to fetch images for items; update state batch-wise
    (async () => {
      const updated = [...items];
      // process sequentially to avoid hammering APIs
      for (let i = 0; i < updated.length; i++) {
        const it = updated[i];
        const q = it.title.replace(/[()]/g, " ").split(" - ")[0];
        let img = await fetchFromDummy(q);
        if (!img) img = await fetchFakeStore(q);
        // if still null, try more generic keyword (first word)
        if (!img) {
          const kw = q.split(" ")[0];
          if (kw && kw.length > 2) {
            img = await fetchFromDummy(kw) || await fetchFakeStore(kw);
          }
        }
        // final fallback: placeholder image URL (CDN-friendly)
        if (!img) img = `https://via.placeholder.com/800x600.png?text=${encodeURIComponent(it.title)}`;

        if (!mounted) return;
        // update the specific item in state (preserve other fields)
        setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, image: img } : p)));
        // tiny delay to be polite (optional)
        await new Promise((res) => setTimeout(res, 120));
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ----- rest unchanged: cart handlers, checkout -----
  const addToCart = (it: StoreItemType) => {
    setCart((p) => {
      const f = p.find((x) => x.id === it.id);
      if (f) return p.map((x) => (x.id === it.id ? { ...x, qty: x.qty + 1 } : x));
      return [...p, { ...it, qty: 1 }];
    });
    setCartOpen(true);
  };

  const inc = (id: string) => setCart((p) => p.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)));
  const dec = (id: string) => setCart((p) => p.map((x) => (x.id === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x)));
  const remove = (id: string) => setCart((p) => p.filter((x) => x.id !== id));

  const total = useMemo(() => cart.reduce((s, it) => s + it.price * it.qty, 0), [cart]);

  const handleCheckout = async () => {
    setMessage(null);
    const s = student ?? loadStudentFromSession();
    if (!s?._id) {
      setMessage("You must be signed in to buy items.");
      return;
    }

    if (availableTokens != null && total > availableTokens) {
      setMessage("Insufficient balance. Please top-up tokens.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const baseURL = import.meta.env.VITE_TOKEN_API || "";
      const url = `${baseURL}/token/${s._id}/substract`;
      const resp = await axios.post(
        url,
        { amount: total, reason: "Purchase", meta: { items: cart } },
        { withCredentials: true, timeout: 8000 }
      );

      if (resp.status >= 200 && resp.status < 300) {
        const returned = resp?.data?.token ?? resp?.data ?? null;
        const newAvail = returned?.availableTokens ?? returned?.totalTokens ?? null;

        setMessage("Purchase successful — tokens deducted.");
        if (typeof newAvail === "number") setAvailableTokens(newAvail);
        else setAvailableTokens((prev) => (prev == null ? prev : prev - total));
        setCart([]);
        setCartOpen(false);
      } else {
        setMessage("Purchase failed. Please try again.");
      }
    } catch (err: any) {
      const res = err?.response;
      if (res && res.data && (res.data.error === "INSUFFICIENT_BALANCE" || res.data.message?.toLowerCase?.().includes("insufficient"))) {
        setMessage("Purchase failed: insufficient balance.");
      } else if (res && res.data && typeof res.data.message === "string") {
        setMessage(`Purchase failed: ${res.data.message}`);
      } else {
        setMessage("Network error while attempting purchase.");
      }
      console.error("Checkout error", err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentNavbar />
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Campus Tech Store</h1>
            <p className="mt-1 text-slate-600 max-w-lg">Redeem tokens for tech essentials and accessories — curated for students.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 text-center">
              <div className="text-xs text-slate-500">Available Balance</div>
              <div className="text-xl font-semibold text-blue-600">
                {loadingTokens ? <span className="text-sm">Loading...</span> : availableTokens != null ? `${availableTokens} tokens` : <span className="text-sm text-slate-400">--</span>}
              </div>
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition"
            >
              Cart
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.toLowerCase().includes("success") ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{message.toLowerCase().includes("success") ? "✓" : "⚠"}</span>
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((it) => (
            <StoreItem key={it.id} item={it} onAdd={addToCart} />
          ))}
        </div>

        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          items={cart}
          onInc={inc}
          onDec={dec}
          onRemove={remove}
          onCheckout={handleCheckout}
          total={total}
          checkoutLoading={checkoutLoading}
        />
      </div>
    </div>
  );
}
