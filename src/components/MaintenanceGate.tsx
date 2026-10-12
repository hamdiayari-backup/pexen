import React, { useEffect, useState } from 'react';
import { Phone, Wrench } from 'lucide-react';

interface MaintenanceState {
  enabled: boolean;
  title: string;
  message: string;
  phone?: string;
  phoneClean?: string;
  logo?: string;
}

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MaintenanceState | null>(null);

  useEffect(() => {
    fetch('/api/public/site-config', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((cfg) =>
        setState({
          ...cfg.settings?.maintenance,
          phone: cfg.general?.phone,
          phoneClean: cfg.general?.phoneClean,
          logo: cfg.branding?.logoDarkUrl,
        })
      )
      .catch(() => setState({ enabled: false, title: '', message: '' }));
  }, []);

  if (!state) return null;
  if (state.enabled) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-px-navy px-6 text-center text-white">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-px-primary/15 blur-3xl" />
        <div className="relative max-w-xl">
          {state.logo ? <img src={state.logo} alt="PEXEN" className="mx-auto mb-10 h-10 object-contain" /> : null}
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <Wrench className="h-6 w-6 text-px-primary" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{state.title || 'Site en maintenance'}</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">{state.message}</p>
          {state.phone ? (
            <a href={`tel:${state.phoneClean || state.phone}`} className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold hover:bg-white/5">
              <Phone className="h-4 w-4 text-px-primary" /> {state.phone}
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
