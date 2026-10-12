import React, { useState } from 'react';
import { Calculator, ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface SimulatorProps {
  onSelectSolution?: (data: { siteType: string; need: string; estimate: string }) => void;
  onNavigateToContact?: () => void;
}

export const CeeSimulator: React.FC<SimulatorProps> = ({ onNavigateToContact }) => {
  const [siteType, setSiteType] = useState<'tertiaire' | 'industrie' | 'residentiel'>('tertiaire');
  const [surfaceM2, setSurfaceM2] = useState<number>(2500);
  const [targetSolution, setTargetSolution] = useState<string>('froid');

  // Realistic French CEE and energy engineering heuristics
  const calculateEstimates = () => {
    let kwhCumacPerUnit = 420;
    let baseCoverage = 0.72; // 72%
    let typicalSavingPercent = 22;

    if (siteType === 'industrie') {
      if (targetSolution === 'recup-chaleur') {
        kwhCumacPerUnit = 850;
        baseCoverage = 0.78;
        typicalSavingPercent = 28;
      } else if (targetSolution === 'froid') {
        kwhCumacPerUnit = 680;
        baseCoverage = 0.75;
        typicalSavingPercent = 24;
      } else {
        kwhCumacPerUnit = 520;
        baseCoverage = 0.70;
        typicalSavingPercent = 18;
      }
    } else if (siteType === 'tertiaire') {
      if (targetSolution === 'froid') {
        kwhCumacPerUnit = 600;
        baseCoverage = 0.76;
        typicalSavingPercent = 25;
      } else if (targetSolution === 'gtb') {
        kwhCumacPerUnit = 380;
        baseCoverage = 0.68;
        typicalSavingPercent = 20;
      } else if (targetSolution === 'destratification') {
        kwhCumacPerUnit = 310;
        baseCoverage = 0.65;
        typicalSavingPercent = 22;
      }
    } else {
      // Résidentiel collectif
      kwhCumacPerUnit = 390;
      baseCoverage = 0.74;
      typicalSavingPercent = 26;
    }

    const estimatedKwhCumac = Math.round((surfaceM2 * kwhCumacPerUnit) / 1000) * 1000;
    const estimatedSavingsPercent = typicalSavingPercent;
    const estimatedCeeCoverage = Math.round(baseCoverage * 100);

    return {
      kwhCumac: estimatedKwhCumac.toLocaleString('fr-FR'),
      savingsPercent: estimatedSavingsPercent,
      ceeCoverage: estimatedCeeCoverage
    };
  };

  const results = calculateEstimates();

  return (
    <div className="card-pexen p-6 sm:p-8 lg:p-10 shadow-sm border border-px-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-px-border/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-px-primary-dark mb-1">
            <Calculator className="w-4 h-4 text-px-primary" />
            <span>Outil d'Ingénierie & Faisabilité</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold text-px-navy">
            Simulateur d'éligibilité CEE & Économies d'Énergie
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Évaluez en direct le potentiel de valorisation CEE de vos installations techniques selon les barèmes de l'Ademe.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-slate-500 bg-px-surface px-3 py-1.5 rounded-full border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Fiches CEE officielles France 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
        {/* Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Site type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              1. Typologie de votre site
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-px-surface rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSiteType('tertiaire')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  siteType === 'tertiaire'
                    ? 'bg-white text-px-navy shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-px-navy'
                }`}
              >
                Tertiaire / Distribution
              </button>
              <button
                type="button"
                onClick={() => setSiteType('industrie')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  siteType === 'industrie'
                    ? 'bg-white text-px-navy shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-px-navy'
                }`}
              >
                Site Industriel
              </button>
              <button
                type="button"
                onClick={() => setSiteType('residentiel')}
                className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  siteType === 'residentiel'
                    ? 'bg-white text-px-navy shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-px-navy'
                }`}
              >
                Résidentiel Collectif
              </button>
            </div>
          </div>

          {/* Solution target */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              2. Solution technique prioritaire
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'froid', label: 'Froid & HP Flottante', badge: 'BAT-TH-134' },
                { id: 'recup-chaleur', label: 'Récupération Chaleur', badge: 'IND-UT-103' },
                { id: 'gtb', label: 'GTB / Décret BACS', badge: 'BAT-TH-116' },
                { id: 'destratification', label: 'Déstratification', badge: 'BAT-TH-142' },
                { id: 'isolation', label: 'Matelas & Calorifugeage', badge: 'BAT-TH-106' },
                { id: 'pac', label: 'Pompe à chaleur (PAC)', badge: 'BAT-TH-163' }
              ].map((sol) => (
                <button
                  key={sol.id}
                  type="button"
                  onClick={() => setTargetSolution(sol.id)}
                  className={`text-left p-3 rounded-xl border text-xs sm:text-sm transition-all ${
                    targetSolution === sol.id
                      ? 'border-px-primary bg-px-primary/5 text-px-navy font-semibold ring-1 ring-px-primary'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="truncate">{sol.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{sol.badge}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Surface slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <span>3. Surface ou échelle du bâtiment</span>
              <span className="text-px-navy font-mono text-sm lowercase font-bold">{surfaceM2.toLocaleString('fr-FR')} m²</span>
            </div>
            <input
              type="range"
              min={500}
              max={25000}
              step={250}
              value={surfaceM2}
              onChange={(e) => setSurfaceM2(Number(e.target.value))}
              className="w-full accent-px-primary bg-slate-200 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>500 m² (Magasin / Atelier)</span>
              <span>10 000 m² (Hypermarché / Usine)</span>
              <span>25 000 m² (Hub Logistique)</span>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-px-navy to-px-navy-2 rounded-2xl p-6 sm:p-7 text-white flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-px-primary-light uppercase tracking-wider mb-4">
              <Zap className="w-4 h-4 text-px-primary-light" />
              <span>Projection d'Impact Estimée</span>
            </div>

            <div className="space-y-5">
              <div className="border-b border-white/10 pb-4">
                <div className="text-xs text-slate-300">Volume CEE éligible estimé</div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white mt-0.5">
                  ~ {results.kwhCumac} <span className="text-sm font-normal text-slate-400">kWh cumac</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Montage et valorisation intégrale par PEXEN</div>
              </div>

              <div className="border-b border-white/10 pb-4">
                <div className="text-xs text-slate-300">Prise en charge financière CEE</div>
                <div className="text-2xl sm:text-3xl font-bold text-px-primary-light mt-0.5">
                  Jusqu'à {results.ceeCoverage} %
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Reste à charge drastiquement réduit</div>
              </div>

              <div>
                <div className="text-xs text-slate-300">Économies sur facture énergétique</div>
                <div className="text-2xl sm:text-3xl font-bold text-white mt-0.5">
                  - {results.savingsPercent} %
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Sur le poste technique concerné</div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-px-primary-light shrink-0" />
              <span>Contrôle systématique par un organisme accrédité COFRAC</span>
            </div>

            <button
              onClick={onNavigateToContact}
              className="w-full btn-primary-pexen !py-3 text-center !w-full justify-center group"
            >
              <span>Parler de votre projet</span>
              <ArrowRight className="w-4 h-4 btn-arrow" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
