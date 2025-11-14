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
    <div className="fixed inset-0 z-[100] flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl overflow-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-normal text-slate-900">Shopping Cart</h2>
              <p className="text-sm text-slate-500 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <span className="text-5xl">🛒</span>
              </div>
              <h3 className="text-lg font-normal text-slate-800 mb-2">Your cart is empty</h3>
              <p className="text-sm text-slate-500">Browse the store and add items to your cart</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => (
                <div key={it.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 hover:border-blue-100 transition">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-white border border-slate-100 overflow-hidden flex-shrink-0">
                      {it.image ? <img src={it.image} alt={it.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-normal text-slate-900 mb-1 truncate">{it.title}</h4>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 text-blue-600">
                          <span>🪙</span>
                          <span className="font-medium">{it.price}</span>
                        </div>
                        <span className="text-slate-400">×</span>
                        <span className="text-slate-600 font-normal">{it.qty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
                          <button onClick={() => onDec(it.id)} className="px-3 py-1.5 hover:bg-slate-50 transition-colors rounded-l-lg">
                            <span className="text-slate-700 font-medium">−</span>
                          </button>
                          <span className="px-4 py-1.5 text-sm font-normal text-slate-800 border-x border-slate-200">{it.qty}</span>
                          <button onClick={() => onInc(it.id)} className="px-3 py-1.5 hover:bg-slate-50 transition-colors rounded-r-lg">
                            <span className="text-slate-700 font-medium">+</span>
                          </button>
                        </div>
                        <button onClick={() => onRemove(it.id)} className="ml-auto px-3 py-1.5 text-sm font-normal text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-5">
          <div className="rounded-xl p-4 mb-4 bg-gradient-to-br from-blue-50 to-white border border-blue-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Subtotal</span>
              <span className="text-sm font-normal text-slate-700">🪙 {total}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-base font-normal text-slate-800">Total</span>
              <span className="text-lg font-semibold text-blue-600">🪙 {total}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={onCheckout} disabled={checkoutLoading || items.length === 0} className="w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-normal disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 shadow">
              {checkoutLoading ? "Processing..." : "Complete Purchase"}
            </button>
            <button onClick={onClose} className="w-full px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-normal hover:bg-slate-50 transition-colors">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
