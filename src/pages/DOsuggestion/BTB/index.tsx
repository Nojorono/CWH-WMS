import React, { useState } from "react";
import { BtbDetail, DUMMY_BTB_DETAIL } from "./dummyData";
import { showErrorToast } from "../../../components/toast";

const BtbSearch = () => {
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [btbDetail, setBtbDetail] = useState<BtbDetail | null>(null);

  // Simulasi pemanggilan API
  const handleSearch = () => {
    if (!searchInput.trim()) {
      showErrorToast("Harap masukkan Callplan Number!");
      return;
    }

    setIsLoading(true);

    // Simulasi delay dari server (1 detik)
    setTimeout(() => {
      setBtbDetail(DUMMY_BTB_DETAIL);
      setIsLoading(false);
    }, 1000);
  };

  // Fungsi untuk mengulang pencarian
  const handleReset = () => {
    setSearchInput("");
    setBtbDetail(null);
  };

  const showResult = Boolean(btbDetail);
  const items = btbDetail?.items ?? [];
  const skuCount = items.length;

  return (
    <div className="p-4 md:p-8 text-slate-800 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* KOTAK PENCARIAN */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <label className="block text-sm font-semibold text-slate-600 mb-2">
            Callplan Number
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Contoh: KRW/2026/7/000007.1"
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className={`bg-[#F97316] hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isLoading ? "opacity-80 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <span>Mencari...</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Cari BTB</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Masukkan Callplan Number dari SPB terkait untuk menampilkan BTB yang
            perlu dicek kesesuaiannya.
          </p>
        </div>

        {/* EMPTY STATE */}
        {!showResult && (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-slate-600 font-bold text-lg mb-1">
              Belum ada data ditampilkan
            </h3>
            <p className="text-sm text-slate-400">
              Masukkan Callplan Number di atas, lalu klik 'Cari BTB' untuk
              melihat BTB yang perlu dicek.
            </p>
          </div>
        )}

        {/* HASIL PENCARIAN */}
        {showResult && btbDetail && (
          <div className="space-y-6 animate-fade-in">
            {/* Card Utama */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative">
              {/* Banner Info BTB */}
              <div className="bg-[#FFF7ED] rounded-lg p-4 flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
                    Detail BTB
                  </p>
                  <h2 className="text-[#F97316] font-bold text-xl">
                    {btbDetail.btbNumber}
                  </h2>
                </div>
                <button
                  onClick={handleReset}
                  className="text-[#F97316] hover:text-orange-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-y-6 gap-x-4 mb-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    SPB Number
                  </p>
                  <p className="font-bold text-slate-700">
                    {btbDetail.spbNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Sales Name
                  </p>
                  <p className="font-bold text-slate-700 uppercase">
                    {btbDetail.salesName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal BTB
                  </p>
                  <p className="font-bold text-slate-700">{btbDetail.btbDate}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Total Qty
                  </p>
                  <p className="font-bold text-slate-700">
                    {btbDetail.totalQty} {btbDetail.totalUom}
                  </p>
                </div>
              </div>

              {/* Tabel Item */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-bold text-slate-700 text-sm">
                    Detail Item ({skuCount} SKU)
                  </h3>
                </div>
                <div className="max-h-72 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-500 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-semibold w-12 bg-white">
                          No
                        </th>
                        <th className="px-4 py-3 font-semibold bg-white">
                          Item Name
                        </th>
                        <th className="px-4 py-3 font-semibold bg-white">
                          SKU
                        </th>
                        <th className="px-4 py-3 font-semibold text-right bg-white">
                          Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 bg-white">
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-8 text-center text-slate-400 italic"
                          >
                            Tidak ada item
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => (
                          <tr
                            key={item.id}
                            className={
                              index < items.length - 1
                                ? "border-b border-slate-100"
                                : ""
                            }
                          >
                            <td className="px-4 py-3 text-slate-400">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {item.itemName}
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {item.sku}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-[#F97316]">
                              {item.qty}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Konfirmasi Form */}
              <div className="border border-[#F97316] rounded-lg p-5 bg-white">
                <h3 className="font-bold text-slate-700 mb-4 text-center">
                  Apakah data BTB ini sudah sesuai dengan fisik barang?
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex-1 border border-slate-300 rounded-lg py-2.5 flex items-center justify-center gap-2 text-slate-600 font-semibold hover:bg-slate-50 transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Sesuai
                  </button>
                  <div className="flex-1 relative">
                    <button className="w-full border border-slate-300 rounded-lg py-2.5 flex items-center justify-center gap-2 text-slate-600 font-semibold hover:bg-slate-50 transition">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Tidak Sesuai
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BtbSearch;
