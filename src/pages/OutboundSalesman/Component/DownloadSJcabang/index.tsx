import React from 'react'

function DownloadSJcabang() {
  return (
    <div>Download SJ Cabang</div>
  )
}

export default DownloadSJcabang


// import React, { useRef } from 'react';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';
 
// function DownloadSJcabang() {
//   const printRef = useRef();
 
//   const handleDownloadPdf = async () => {
//     const element = printRef.current;
//     if (!element) return;
 
//     try {
//       // Mengubah elemen HTML menjadi canvas
//       const canvas = await html2canvas(element, {
//         scale: 2, // Meningkatkan resolusi gambar
//         useCORS: true,
//       });
 
//       const data = canvas.toDataURL('image/png');
 
//       // Setup PDF (A4, Landscape)
//       const pdf = new jsPDF({
//         orientation: 'landscape',
//         unit: 'mm',
//         format: 'a4',
//       });
 
//       const imgProperties = pdf.getImageProperties(data);
//       const pdfWidth = pdf.internal.pageSize.getWidth();
//       const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;
 
//       // Menambahkan gambar ke PDF dan mengunduhnya
//       pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
//       pdf.save('Surat_Jalan_Cabang.pdf');
//     } catch (error) {
//       console.error('Gagal mengunduh PDF', error);
//     }
//   };
 
//   return (
// <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center font-sans">
//       {/* Tombol Aksi */}
// <div className="w-full max-w-[1100px] flex justify-end mb-4 gap-4">
// <button 
//           onClick={handleDownloadPdf}
//           className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-md transition-all font-medium"
// >
// <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
// </svg>
//           Download PDF
// </button>
// </div>
 
//       {/* Area yang akan dicetak ke PDF */}
// <div 
//         ref={printRef} 
//         className="w-full max-w-[1100px] bg-white text-gray-800 p-10 shadow-2xl relative"
// >
//         {/* Header */}
// <div className="flex justify-between items-end mb-6">
// <h1 className="text-2xl font-bold text-blue-900 tracking-wide">PT Niaga Nusa Abadi</h1>
// <div className="flex items-center gap-2">
// <label className="font-semibold text-sm">AMO :</label>
// <input type="text" className="border border-gray-300 bg-blue-50 h-8 w-48 px-2 outline-none" />
// </div>
// </div>
 
//         {/* Form Informasi */}
// <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-8 text-sm">
// <div className="grid grid-cols-[130px_10px_1fr] items-center">
// <label>Nama Pengirim</label><span>:</span>
// <input type="text" className="border border-gray-300 bg-blue-50 h-7 px-2 outline-none w-full" />
// </div>
// <div className="grid grid-cols-[130px_10px_1fr] items-center">
// <label>Nomor Surat Jalan</label><span>:</span>
// <input type="text" className="border border-gray-300 bg-blue-50 h-7 px-2 outline-none w-full" />
// </div>
// <div className="grid grid-cols-[130px_10px_1fr] items-center">
// <label>Nomor Kendaraan</label><span>:</span>
// <input type="text" className="border border-gray-300 bg-blue-50 h-7 px-2 outline-none w-full" />
// </div>
// <div className="grid grid-cols-[130px_10px_1fr] items-center">
// <label>Tujuan</label><span>:</span>
// <input type="text" className="border border-gray-300 bg-blue-50 h-7 px-2 outline-none w-full" />
// </div>
// <div className="grid grid-cols-[130px_10px_1fr] items-center">
// <label>No Segel</label><span>:</span>
// <input type="text" className="border border-gray-300 bg-blue-50 h-7 px-2 outline-none w-full" />
// </div>
// <div className="grid grid-cols-[130px_10px_1fr] items-center">
// <label>Alamat Penerima</label><span>:</span>
// <input type="text" className="border border-gray-300 bg-blue-50 h-7 px-2 outline-none w-full" />
// </div>
// <div className="col-start-2 grid grid-cols-[130px_10px_1fr] items-center">
// <label>Tanggal</label><span>:</span>
// <input type="date" className="border border-gray-300 bg-blue-50 h-7 px-2 outline-none w-full" />
// </div>
// </div>
 
//         {/* Judul Surat Jalan */}
// <div className="text-center mb-4">
// <h2 className="text-2xl font-bold text-blue-900 tracking-wider">SURAT JALAN</h2>
// </div>
 
//         <p className="text-sm mb-2">Harap diterima dengan baik barang sebagai berikut :</p>
 
//         {/* Tabel Barang */}
// <table className="w-full border-collapse border border-gray-400 text-sm mb-6">
// <thead>
// <tr className="bg-gray-50">
// <th className="border border-gray-400 py-2 w-12 text-center font-medium">No</th>
// <th className="border border-gray-400 py-2 font-medium">Nama Barang</th>
// <th className="border border-gray-400 py-2 w-48 font-medium">Banyaknya</th>
// <th className="border border-gray-400 py-2 w-1/3 font-medium">Keterangan</th>
// </tr>
// </thead>
// <tbody>
//             {[1, 2, 3, 4, 5].map((item) => (
// <tr key={item}>
// <td className="border border-gray-400 text-center py-2">{item}</td>
// <td className="border border-gray-400 p-1">
// <input type="text" className="w-full bg-blue-50/50 outline-none h-full px-1" />
// </td>
// <td className="border border-gray-400 p-1">
// <input type="text" className="w-full bg-blue-50/50 outline-none h-full px-1 text-center" />
// </td>
//                 {item === 1 && (
// <td rowSpan="5" className="border border-gray-400 p-2 align-top bg-blue-50/30">
// <textarea className="w-full h-full bg-transparent outline-none resize-none min-h-[120px]"></textarea>
// </td>
//                 )}
// </tr>
//             ))}
// <tr>
// <td colSpan="2" className="border border-gray-400 py-2 text-center font-medium">Total</td>
// <td className="border border-gray-400 p-1">
// <input type="text" className="w-full bg-blue-50/50 outline-none h-full px-1 text-center font-medium" />
// </td>
// <td className="border border-gray-400 bg-blue-50/30"></td>
// </tr>
// </tbody>
// </table>
 
//         {/* Tanggal Diterima */}
// <div className="flex items-center gap-2 mb-1 text-sm font-bold">
// <label>Diterima Tgl :</label>
// <input type="date" className="border border-gray-400 bg-blue-50 h-7 px-2 outline-none w-48 font-normal" />
// </div>
// <p className="text-xs italic text-gray-500 mb-6">* Isikan tanggal diterimanya barang di lokasi tujuan.</p>
 
//         {/* Tanda Tangan */}
// <div className="grid grid-cols-3 gap-6 text-sm">
//           {/* Penerima */}
// <div className="border border-gray-400 flex flex-col h-40">
// <div className="text-center font-medium py-1 border-b border-gray-400 bg-gray-50">Penerima</div>
// <div className="flex-grow bg-blue-50/30 relative">
// <span className="absolute top-2 left-2 text-[10px] bg-red-400 text-white px-1 rounded-sm shadow-sm">SIGN HERE</span>
// </div>
// <div className="h-8 border-t border-dashed border-gray-400 bg-blue-50/30 mx-4 mb-2 mt-auto"></div>
// </div>
 
//           {/* Transporter */}
// <div className="border border-gray-400 flex flex-col h-40">
// <div className="text-center font-medium py-1 border-b border-gray-400 bg-gray-50">Transporter</div>
// <div className="flex-grow bg-blue-50/30 relative">
// <span className="absolute top-2 left-2 text-[10px] bg-red-400 text-white px-1 rounded-sm shadow-sm">SIGN HERE</span>
// </div>
// <div className="h-8 border-t border-dashed border-gray-400 bg-blue-50/30 mx-4 mb-2 mt-auto"></div>
// </div>
 
//           {/* Pengirim */}
// <div className="border border-gray-400 flex flex-col h-40">
// <div className="text-center font-medium py-1 border-b border-gray-400 bg-gray-50">Pengirim</div>
// <div className="flex-grow bg-blue-50/30 relative">
// <span className="absolute top-2 left-2 text-[10px] bg-red-400 text-white px-1 rounded-sm shadow-sm">SIGN HERE</span>
// </div>
// <div className="h-8 border-t border-dashed border-gray-400 bg-blue-50/30 mx-4 mb-2 mt-auto"></div>
// </div>
// </div>
 
//       </div>
// </div>
//   );
// }
 
// export default DownloadSJcabang;