import React from 'react';
import { AlertTriangle, TrendingDown, Coffee, Lightbulb, CheckCircle2 } from 'lucide-react';
import { LeakItem } from '@/src/types/finance';
import { formatRupiah } from '@/src/utils/formatters';

interface LeakDetectorProps {
  leaks: LeakItem[];
}

export const LeakDetector: React.FC<LeakDetectorProps> = ({ leaks }) => {
  const totalProjectedAnnualLeak = leaks.reduce((acc, l) => acc + l.projectedAnnualCost, 0);

  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-bold text-stone-900">
              Deteksi "Bocor Halus" (Pengeluaran Berulang)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Analisis mingguan terhadap pos pengeluaran mikro yang tampak kecil namun menguras tabungan dalam setahun
          </p>
        </div>

        {leaks.length > 0 && (
          <div className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/80 self-start sm:self-auto">
            <span className="text-[11px] text-amber-800 font-medium">Total Potensi Bocor/Tahun: </span>
            <span className="text-xs font-extrabold text-amber-900">
              {formatRupiah(totalProjectedAnnualLeak)}
            </span>
          </div>
        )}
      </div>

      {leaks.length === 0 ? (
        <div className="py-8 px-4 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-stone-800">
            Belum Ada Pola Bocor Halus yang Mengkhawatirkan
          </p>
          <p className="text-[11px] text-stone-500 mt-1 max-w-md mx-auto">
            Pengeluaran harian Anda tercatat rapi dan proporsional. Terus catat transaksi setiap malam selama 15 menit untuk menjaga kesadaran finansial!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {leaks.map((leak) => (
              <div
                key={leak.id}
                className="bg-stone-50/70 border border-stone-200 rounded-xl p-4 flex flex-col justify-between hover:bg-white hover:border-amber-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Coffee className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">
                          {leak.title}
                        </h4>
                        <span className="text-[10px] text-stone-500">
                          {leak.categoryName}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100/90 text-amber-800 shrink-0">
                      {leak.frequencyThisMonth}x bulan ini
                    </span>
                  </div>

                  {leak.sampleDescriptions.length > 0 && (
                    <div className="text-[11px] text-stone-600 bg-white/80 p-2 rounded-lg border border-stone-200/60 mb-3">
                      <p className="text-[10px] font-medium text-stone-400 mb-0.5">Catatan sampel:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-stone-700">
                        {leak.sampleDescriptions.slice(0, 2).map((sample, idx) => (
                          <li key={idx} className="truncate">{sample}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-stone-200/60 mt-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-stone-500 text-[11px]">Rata-rata Mingguan:</span>
                    <span className="font-bold text-stone-800">{formatRupiah(leak.weeklyAverage)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-800 text-[11px] font-medium flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-amber-700" />
                      Proyeksi 1 Tahun:
                    </span>
                    <span className="font-extrabold text-amber-900">{formatRupiah(leak.projectedAnnualCost)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rekomendasi Taktis */}
          <div className="mt-4 p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-emerald-900">
                Langkah Mandiri Mengatasi Bocor Halus:
              </p>
              <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                Tetapkan anggaran khusus di <strong>Pos Jajan & Hiburan</strong> setiap awal minggu (misal Rp 150.000). Jika saldo di pos tersebut habis sebelum hari Minggu, tunda jajan tanpa mengambil dari <strong>Dompet Harian</strong> atau <strong>Tabungan</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
