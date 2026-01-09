import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PrintSuratJalan = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // debug: tampilkan seluruh location supaya terlihat apa shape state-nya
  console.log("PrintSuratJalan location:", location);

  // defensif: terima beberapa kemungkinan nama property di state
  const stateAny = location.state as any | undefined;
  const params = stateAny?.params ?? stateAny?.data ?? stateAny ?? undefined;

  console.log("PrintSuratJalan params (resolved):", params);

  useEffect(() => {
    if (!params) {
      // jika tidak ada params, kembali atau tampilkan pesan
      navigate(-1);
      return;
    }
    // lakukan sesuatu dengan params (fetch, print, dll)
    console.log("received params (effect):", params);
  }, [params, navigate]);

  if (!params) return <div>Data tidak ditemukan</div>;

  return (
    <div>
      <h1>Print Surat Jalan</h1>
      <pre>{JSON.stringify(params, null, 2)}</pre>
      {/* render detail sesuai kebutuhan */}
    </div>
  );
};

export default PrintSuratJalan;
