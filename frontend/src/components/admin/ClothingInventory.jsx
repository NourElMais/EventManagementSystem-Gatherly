import React, { useEffect, useMemo, useState } from "react";
import api, { adminAPI, clothingAPI } from "../../services/api";
import { AlertTriangle, Plus, Shirt } from "lucide-react";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

const SIZE_SUGGESTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

const createEmptyStockRow = () => ({
  id: Math.random().toString(36).slice(2),
  size: "S",
  qty: "",
});

const buildAssetUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
  if (!base) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

export default function ClothingInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newItem, setNewItem] = useState({
    clothingLabel: "",
    description: "",
    picture: null, // file
    stockRows: [createEmptyStockRow()],
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [stockForms, setStockForms] = useState({});
  const [stockErrors, setStockErrors] = useState({});
  useBodyScrollLock(showAddModal);

  useEffect(() => {
    let cancelled = false;
    const loadInventory = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await adminAPI.listClothing();
        if (!cancelled) {
          setInventory(data || []);
        }
      } catch (err) {
        // Fallback to public clothing list if admin endpoint is blocked
        try {
          const { data } = await clothingAPI.getClothing();
          if (!cancelled) {
            setInventory(data || []);
            setError("");
          }
        } catch (fallbackErr) {
          if (!cancelled) {
            const message =
              err.response?.data?.message ||
              fallbackErr.response?.data?.message ||
              "Failed to load clothing";
            setError(message);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadInventory();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalLowStock = useMemo(
    () =>
      inventory.reduce((count, item) => {
        const low = item.stock?.filter((entry) => entry.stockQty <= 2).length || 0;
        return count + low;
      }, 0),
    [inventory]
  );

  const handleAddRow = () => {
    setNewItem((prev) => ({
      ...prev,
      stockRows: [...prev.stockRows, createEmptyStockRow()],
    }));
  };

  const handleRemoveRow = (rowId) => {
    setNewItem((prev) => ({
      ...prev,
      stockRows: prev.stockRows.length > 1 ? prev.stockRows.filter((row) => row.id !== rowId) : prev.stockRows,
    }));
  };

  const updateRow = (rowId, field, value) => {
    setNewItem((prev) => ({
      ...prev,
      stockRows: prev.stockRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    }));
  };

  const handleAddClothing = async (event) => {
    event.preventDefault();
    if (!newItem.clothingLabel.trim()) {
      setAddError("Dress label is required");
      return;
    }

    setAdding(true);
    setAddError("");
    try {
      const payload = {
        clothingLabel: newItem.clothingLabel.trim(),
        description: newItem.description.trim() || null,
        picture: newItem.picture?.trim() || null,
        stock: newItem.stockRows
          .map((row) => ({
            size: row.size.trim().toUpperCase(),
            stockQty: Number(row.qty),
          }))
          .filter((row) => row.size && Number.isInteger(row.stockQty) && row.stockQty >= 0),
      };

      const { data } = await adminAPI.createClothing(payload);
      setInventory((prev) => [data, ...prev]);
      setNewItem({
        clothingLabel: "",
        description: "",
        picture: "",
        stockRows: [createEmptyStockRow()],
      });
      setShowAddModal(false);
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to add clothing");
    } finally {
      setAdding(false);
    }
  };

  const handleStockFormChange = (clothesId, field, value) => {
    setStockForms((prev) => ({
      ...prev,
      [clothesId]: {
        ...(prev[clothesId] || { size: "", amount: "" }),
        [field]: value,
      },
    }));
  };

  const handleAddStock = async (clothesId) => {
    const form = stockForms[clothesId] || { size: "", amount: "" };
    const size = form.size.trim().toUpperCase();
    const amount = Number(form.amount);

    if (!size || !Number.isInteger(amount) || amount <= 0) {
      setStockErrors((prev) => ({
        ...prev,
        [clothesId]: "Enter a size and a positive quantity",
      }));
      return;
    }

    setStockErrors((prev) => ({ ...prev, [clothesId]: "" }));
    try {
      const { data } = await adminAPI.addClothingStock(clothesId, { size, amount });
      setInventory((prev) =>
        prev.map((item) => (item.clothesId === clothesId ? { ...item, stock: data.stock } : item))
      );
      setStockForms((prev) => ({
        ...prev,
        [clothesId]: { size, amount: "" },
      }));
    } catch (err) {
      setStockErrors((prev) => ({
        ...prev,
        [clothesId]: err.response?.data?.message || "Failed to update stock",
      }));
    }
  };

  return (
    <>
      <section className="px-4 pb-16 space-y-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-white rounded-3xl shadow p-6 border border-gray-100 space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ocean font-semibold">
                    <Shirt size={18} /> Inventory
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Available dresses</h3>
                  <p className="text-sm text-gray-500">
                    Monitor every size. {totalLowStock > 0 ? `${totalLowStock} sizes running low.` : "All stocked!"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAddError("");
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2 rounded-2xl bg-ocean text-white font-semibold flex items-center gap-2 shadow hover:bg-ocean/90"
                >
                  <Plus size={16} /> New outfit
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
                Loading dresses...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">{error}</div>
            ) : inventory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
                No dresses tracked yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {inventory.map((item) => {
                  const form = stockForms[item.clothesId] || { size: "", amount: "" };
                  const lowStock = (item.stock || []).filter((entry) => entry.stockQty <= 2);
                  return (
                    <article key={item.clothesId} className="rounded-2xl border border-gray-100 p-5 space-y-4 bg-cream/40">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-ocean font-semibold">Outfit</p>
                          <h4 className="text-lg font-semibold text-gray-900">{item.clothingLabel}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{item.description || "No description yet."}</p>
                        </div>
                        {item.picture && (
                          <img
                            src={buildAssetUrl(item.picture)}
                            alt={item.clothingLabel}
                            className="w-20 h-20 object-cover rounded-2xl border border-white shadow-sm"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">Stock</p>
                        {item.stock?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {item.stock.map((stock) => (
                              <span
                                key={`${item.clothesId}-${stock.size}`}
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  stock.stockQty === 0
                                    ? "bg-red-100 text-red-600"
                                    : stock.stockQty <= 2
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-white border border-gray-200 text-gray-700"
                                }`}
                              >
                                {stock.size}: {stock.stockQty}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No sizes recorded.</p>
                        )}
                      </div>

                      {lowStock.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2">
                          <AlertTriangle size={14} />
                          {lowStock.length} size{lowStock.length > 1 ? "s" : ""} running low
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">Add stock</p>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Size"
                            value={form.size}
                            onChange={(e) => handleStockFormChange(item.clothesId, "size", e.target.value)}
                            className="col-span-1 rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-ocean/40 focus:outline-none"
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="Quantity"
                            value={form.amount}
                            onChange={(e) => handleStockFormChange(item.clothesId, "amount", e.target.value)}
                            className="col-span-1 rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-ocean/40 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddStock(item.clothesId)}
                            className="col-span-1 bg-ocean text-white rounded-2xl text-sm font-semibold px-3 py-2 hover:bg-ocean/90"
                          >
                            Add
                          </button>
                        </div>
                        {stockErrors[item.clothesId] && (
                          <p className="text-xs text-red-500">{stockErrors[item.clothesId]}</p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full relative p-6 space-y-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setAddError("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
            <div className="flex flex-col gap-1">
              <p className="text-xs uppercase tracking-[0.3em] text-ocean font-semibold">Wardrobe</p>
              <h3 className="text-xl font-semibold text-gray-900">Add a new outfit</h3>
              <p className="text-sm text-gray-500">Track new dresses and their available sizes.</p>
            </div>
            <form className="space-y-4" onSubmit={handleAddClothing}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Label *</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-ocean/40 focus:outline-none"
                    placeholder="Emerald Gown"
                    value={newItem.clothingLabel}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, clothingLabel: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Photo</label>
                  <div className="mt-1">
                    {newItem.picture ? (
                      <div className="relative">
                        <img
                          src={newItem.picture}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-2xl border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setNewItem((prev) => ({ ...prev, picture: null }))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-ocean transition">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                          </svg>
                          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-500">PNG, JPG or GIF</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setNewItem((prev) => ({ ...prev, picture: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <textarea
                  className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-ocean/40 focus:outline-none"
                  placeholder="Floor-length silk gown with detachable straps..."
                  rows={3}
                  value={newItem.description}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Initial stock (optional)</label>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="text-sm font-semibold text-ocean inline-flex items-center gap-1"
                  >
                    <Plus size={16} /> Add size
                  </button>
                </div>
                <div className="space-y-2">
                  {newItem.stockRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4">
                        <label className="text-xs text-gray-500">Size</label>
                        <input
                          type="text"
                          list="size-suggestions"
                          value={row.size}
                          onChange={(e) => updateRow(row.id, "size", e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-ocean/40 focus:outline-none"
                        />
                        <datalist id="size-suggestions">
                          {SIZE_SUGGESTIONS.map((size) => (
                            <option value={size} key={size} />
                          ))}
                        </datalist>
                      </div>
                      <div className="col-span-4">
                        <label className="text-xs text-gray-500">Quantity</label>
                        <input
                          type="number"
                          min="0"
                          value={row.qty}
                          onChange={(e) => updateRow(row.id, "qty", e.target.value)}
                          className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-ocean/40 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-4 flex justify-end">
                        <button
                          type="button"
                          className="text-xs text-gray-500 hover:text-gray-800"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={newItem.stockRows.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {addError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{addError}</div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError("");
                  }}
                  className="px-5 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2.5 rounded-2xl bg-ocean text-white font-semibold flex items-center gap-2 disabled:opacity-60"
                >
                  {adding ? "Saving..." : "Add clothing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
