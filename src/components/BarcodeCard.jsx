import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer } from 'lucide-react';

export default function BarcodeCard({ playerNumber, playerName }) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && playerNumber) {
      try {
        // تنظيف الكود وتحويله لأحرف كبيرة (CODE39 يدعم A-Z و 0-9 فقط)
        const cleanCode = String(playerNumber).trim().toUpperCase();

        JsBarcode(barcodeRef.current, cleanCode, {
          format: "CODE39",        // التحويل إلى CODE39
          width: 2.2,              // عرض الخطوط مناسب لـ 4 خانات
          height: 55,
          displayValue: true,      // إظهار الرقم/الكود تحت الخطوط
          fontSize: 16,
          textMargin: 4,
          font: "monospace",
          lineColor: "#000000",
          background: "#ffffff"
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [playerNumber]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center">
      <div className="text-center mb-1">
        <span className="text-xs font-bold text-gray-500 block">بطاقة دخول ruhul</span>
        <span className="text-sm font-black text-gray-900">{playerName}</span>
      </div>

      <div className="bg-white p-2 rounded-xl flex justify-center">
        <svg ref={barcodeRef}></svg>
      </div>

      <button
        onClick={handlePrint}
        className="mt-3 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
      >
        <Printer size={14} /> طباعة الكرت
      </button>
    </div>
  );
}