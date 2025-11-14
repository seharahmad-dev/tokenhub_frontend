// File: src/components/common/StoreItem.tsx
import React from "react";

export type StoreItemType = {
    id: string;
    title: string;
    price: number; // in tokens
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
        <div className="border rounded-lg p-4 flex flex-col justify-between bg-white">
            <div>
                <div className="h-32 w-full bg-slate-100 rounded-md mb-3 flex items-center justify-center text-slate-400">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.title}
                            className="h-32 object-cover rounded"
                        />
                    ) : (
                        <span>Image</span>
                    )}
                </div>
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm">
                    <span>🪙</span>
                    <span className="font-medium">{item.price}</span>
                </div>
                <button
                    onClick={() => onAdd(item)}
                    className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700"
                >
                    Add
                </button>
            </div>
        </div>
    );
}
