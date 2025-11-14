import React from "react";

export type StoreItemType = {
    id: string;
    title: string;
    price: number;
    description?: string;
    image?: string;
};

export default function StoreItem({
    item,
    onAdd,
}: {
    item: StoreItemType;
    onAdd: (it: StoreItemType) => void;
}) {
    return (
        <div className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300">
            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-300">
                        <span className="text-4xl">📦</span>
                    </div>
                )}
            </div>

            <div className="p-5">
                <h3 className="text-base font-semibold text-slate-800 mb-2 line-clamp-1">{item.title}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[2.5rem]">{item.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-base">🪙</span>
                        </div>
                        <span className="text-lg font-bold text-slate-800">{item.price}</span>
                    </div>
                    <button
                        onClick={() => onAdd(item)}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-md shadow-blue-600/20"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}
