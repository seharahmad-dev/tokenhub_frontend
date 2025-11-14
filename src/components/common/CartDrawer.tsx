// File: src/components/common/CartDrawer.tsx
import React from "react";
import { StoreItemType } from "./StoreItem";

type CartItem = StoreItemType & { qty: number };

export default function CartDrawer({
    open,
    onClose,
    items,
    onInc,
    onDec,
    onRemove,
    onCheckout,
    total,
    checkoutLoading,
}: {
    open: boolean;
    onClose: () => void;
    items: CartItem[];
    onInc: (id: string) => void;
    onDec: (id: string) => void;
    onRemove: (id: string) => void;
    onCheckout: () => void;
    total: number;
    checkoutLoading: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-60 flex mt-[60px]">
            <div className="flex-1" onClick={onClose} />
            <div className="w-[420px] bg-white border-l shadow-xl p-4 overflow-auto">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Cart</h4>
                    <button onClick={onClose} className="text-slate-500">
                        Close
                    </button>
                </div>
                <div className="space-y-3">
                    {items.length === 0 ? (
                        <div className="text-sm text-slate-500">Your cart is empty</div>
                    ) : (
                        items.map((it) => (
                            <div
                                key={it.id}
                                className="flex items-center justify-between border rounded p-2"
                            >
                                <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{it.title}</div>
                                    <div className="text-xs text-slate-500">
                                        🪙 {it.price} · Qty {it.qty}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onDec(it.id)}
                                        className="px-2 py-1 rounded border text-sm"
                                    >
                                        -
                                    </button>
                                    <button
                                        onClick={() => onInc(it.id)}
                                        className="px-2 py-1 rounded border text-sm"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => onRemove(it.id)}
                                        className="px-2 py-1 text-xs text-rose-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between text-sm mb-3">
                        <div>Total</div>
                        <div className="font-medium">🪙 {total}</div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onCheckout}
                            disabled={checkoutLoading || items.length === 0}
                            className="flex-1 px-3 py-2 rounded-md bg-green-600 text-white disabled:opacity-60"
                        >
                            {checkoutLoading ? "Processing…" : "Proceed to Checkout"}
                        </button>
                        <button onClick={onClose} className="px-3 py-2 rounded-md border">
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
