// src/pages/faculty/StorePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import StoreItem, { StoreItemType } from "../../components/common/StoreItem";
import CartDrawer from "../../components/common/CartDrawer";
import axios from "axios";
import StudentNavbar from "@/components/student/StudentNavbar";

type CartItem = StoreItemType & { qty: number };

// Helper: load student from sessionStorage (defensive)
function loadStudentFromSession(): { _id?: string;[k: string]: any } | null {
    try {
        const raw = sessionStorage.getItem("user");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        // Best-effort normalize id field names
        if (!parsed._id && parsed.id) {
            parsed._id = parsed.id;
        }
        return parsed;
    } catch (err) {
        return null;
    }
}

export default function StorePage() {
    // note: no redux selector usage for 'student' — we load from sessionStorage
    const [student, setStudent] = useState<{ _id?: string;[k: string]: any } | null>(() => loadStudentFromSession());

    const [items] = useState<StoreItemType[]>(() => {
        // generate 20 demo items
        return Array.from({ length: 20 }).map((_, i) => ({
            id: `item-${i + 1}`,
            title: `Token Pack ${i + 1}`,
            price: 10 + (i % 10) * 5,
            description: `Useful item #${i + 1}`,
        }));
    });

    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Now we specifically track availableTokens (actionable balance)
    const [availableTokens, setAvailableTokens] = useState<number | null>(null);
    const [loadingTokens, setLoadingTokens] = useState(false);

    // if user changes in another tab you could re-hydrate
    useEffect(() => {
        const onStorage = () => setStudent(loadStudentFromSession());
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // fetch token balance using studentId from sessionStorage
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

                // prefer availableTokens field if present, otherwise fallback to totalTokens
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

    const addToCart = (it: StoreItemType) => {
        setCart(prev => {
            const found = prev.find(p => p.id === it.id);
            if (found) return prev.map(p => p.id === it.id ? { ...p, qty: p.qty + 1 } : p);
            return [...prev, { ...it, qty: 1 }];
        });
        setCartOpen(true);
    };

    const inc = (id: string) => setCart(prev => prev.map(p => p.id === id ? { ...p, qty: p.qty + 1 } : p));
    const dec = (id: string) => setCart(prev => prev.map(p => p.id === id ? { ...p, qty: Math.max(1, p.qty - 1) } : p));
    const remove = (id: string) => setCart(prev => prev.filter(p => p.id !== id));

    const total = useMemo(() => cart.reduce((s, it) => s + it.price * it.qty, 0), [cart]);

    const handleCheckout = async () => {
        setMessage(null);
        // re-load session student if needed
        const s = student ?? loadStudentFromSession();
        if (!s?._id) {
            setMessage("You must be signed in to buy items.");
            return;
        }

        // quick balance check (client-side) — use availableTokens (actionable balance)
        if (availableTokens != null && total > availableTokens) {
            setMessage("Insufficient balance. Please top-up tokens.");
            return;
        }

        setCheckoutLoading(true);
        try {
            const baseURL = import.meta.env.VITE_TOKEN_API || "";
            // endpoint POST /token/:studentId/substract
            const url = `${baseURL}/token/${s._id}/substract`;
            const resp = await axios.post(
                url,
                { amount: total, reason: "Purchase", meta: { items: cart } },
                { withCredentials: true, timeout: 8000 }
            );

            if (resp.status >= 200 && resp.status < 300) {
                // prefer returned availableTokens if API supplies it, otherwise fallback to token.totalTokens
                const returned = resp?.data?.token ?? resp?.data ?? null;
                const newAvail = returned?.availableTokens ?? returned?.totalTokens ?? null;

                setMessage("Purchase successful — tokens deducted.");
                if (typeof newAvail === "number") {
                    setAvailableTokens(newAvail);
                } else {
                    // fallback: subtract locally
                    setAvailableTokens(prev => (prev == null ? prev : prev - total));
                }
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
        <div>
            <StudentNavbar />
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Token Store</h2>
                    <div className="inline-flex items-center gap-3">                        
                        <button onClick={() => setCartOpen(true)} className="px-3 py-2 rounded bg-blue-600 text-white">Open Cart ({cart.length})</button>
                    </div>
                </div>

                {message && <div className="mt-4 text-sm text-rose-600">{message}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                    {items.map(it => (
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
