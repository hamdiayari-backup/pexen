import { useEffect } from 'react';

/**
 * Animations scroll PEXEN Maquette — mêmes libs que Ultra (GSAP / ScrollTrigger / WOW),
 * ciblées sur .px-maq-root.
 */

declare global {
  interface Window {
    gsap?: any;
    ScrollTrigger?: any;
    SplitText?: any;
    WOW?: any;
  }
}

function loadCss(href: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`link[data-maq-fx="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.maqFx = href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-maq-fx="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === '1') resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.dataset.maqFx = src;
    s.onload = () => {
      s.dataset.loaded = '1';
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

async function ensureLibs() {
  await loadCss('/themes/ultra-s/css/animate.css');
  await loadScript('/themes/ultra-s/js/gsap.min.js');
  await loadScript('/themes/ultra-s/js/ScrollTrigger.min.js');
  await loadScript('/themes/ultra-s/js/SplitText.js');
  await loadScript('/themes/ultra-s/js/wow.min.js');
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initMaquetteEffects(root: HTMLElement) {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const SplitText = window.SplitText;
  if (!gsap || !ScrollTrigger) return () => undefined;

  gsap.registerPlugin(ScrollTrigger);
  const cleanups: Array<() => void> = [];
  const reduced = prefersReducedMotion();

  /* Progress bar */
  let progressEl = document.querySelector<HTMLElement>('.px-maq-scroll-progress');
  if (!progressEl) {
    progressEl = document.createElement('div');
    progressEl.className = 'px-maq-scroll-progress';
    progressEl.setAttribute('aria-hidden', 'true');
    root.prepend(progressEl);
  }
  if (!reduced) {
    gsap.set(progressEl, { scaleX: 0, transformOrigin: 'left center' });
    const progTween = gsap.to(progressEl, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.35,
      },
    });
    cleanups.push(() => {
      progTween.scrollTrigger?.kill();
      progTween.kill();
    });
  }

  /* Titres */
  if (!reduced && SplitText) {
    root.querySelectorAll<HTMLElement>('.px-maq-sec__title:not([data-px-split]), .px-maq-hero__title:not([data-px-split])').forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
      el.dataset.pxSplit = '1';
      try {
        const split = new SplitText(el, { type: 'chars, words' });
        const tween = gsap.from(split.chars, {
          duration: 0.8,
          y: 16,
          autoAlpha: 0,
          stagger: 0.016,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%' },
        });
        cleanups.push(() => {
          tween?.scrollTrigger?.kill();
          tween?.kill();
          split.revert();
          delete el.dataset.pxSplit;
        });
      } catch {
        /* ignore */
      }
    });
  }

  /* Compteurs KPIs */
  root.querySelectorAll<HTMLElement>('[data-px-count]:not([data-px-counted])').forEach((el) => {
    el.dataset.pxCounted = '1';
    const raw = el.dataset.pxCount || '0';
    const target = Number(String(raw).replace(/[^\d.-]/g, ''));
    const prefix = el.dataset.pxPrefix || '';
    const suffix = el.dataset.pxSuffix || '';
    const decimals = String(raw).includes('.') ? 1 : 0;
    if (!Number.isFinite(target)) return;

    const render = (v: number) => {
      const rawN = decimals ? v.toFixed(decimals) : String(Math.round(v));
      const [intPart, decPart] = rawN.split('.');
      const spaced = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
      const n = decPart ? `${spaced},${decPart}` : spaced;
      el.innerHTML = `${prefix}<span class="px-maq-count-n">${n}</span>${suffix ? `<span class="px-maq-count-s">${suffix}</span>` : ''}`;
    };

    if (reduced) {
      render(target);
      return;
    }

    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: target,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onStart: () => render(0),
      onUpdate: () => render(obj.v),
      onComplete: () => render(target),
    });
    cleanups.push(() => {
      tween.scrollTrigger?.kill();
      tween.kill();
      delete el.dataset.pxCounted;
    });
  });

  /* Timeline steps */
  root.querySelectorAll<HTMLElement>('.px-maq-steps:not([data-px-tl])').forEach((tl) => {
    tl.dataset.pxTl = '1';
    if (!reduced) {
      const activateAll = () => tl.setAttribute('data-px-tl-active', '1');
      const stLine = ScrollTrigger.create({
        trigger: tl,
        start: 'top 75%',
        onEnter: activateAll,
        onEnterBack: activateAll,
      });
      cleanups.push(() => {
        stLine.kill();
        tl.removeAttribute('data-px-tl-active');
      });
    }
    const steps = Array.from(tl.querySelectorAll<HTMLElement>('.px-maq-steps__item'));
    steps.forEach((step, i) => {
      if (reduced) {
        step.classList.add('is-active');
        return;
      }
      const st = ScrollTrigger.create({
        trigger: step,
        start: 'top 80%',
        onEnter: () => step.classList.add('is-active'),
        onEnterBack: () => step.classList.add('is-active'),
      });
      const tween = gsap.from(step, {
        autoAlpha: 0,
        y: 24,
        duration: 0.6,
        delay: i * 0.05,
        ease: 'power2.out',
        scrollTrigger: { trigger: step, start: 'top 88%' },
      });
      cleanups.push(() => {
        st.kill();
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    });
    cleanups.push(() => delete tl.dataset.pxTl);
  });

  /* Infinity reveal */
  if (!reduced) {
    root.querySelectorAll<HTMLElement>('.px-maq-inf:not([data-px-inf])').forEach((inf) => {
      inf.dataset.pxInf = '1';
      const tween = gsap.from(inf, {
        autoAlpha: 0,
        scale: 0.92,
        duration: 1.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: inf, start: 'top 90%' },
      });
      cleanups.push(() => {
        tween.scrollTrigger?.kill();
        tween.kill();
        delete inf.dataset.pxInf;
      });
    });
  }

  /* Sections fade-up */
  if (!reduced) {
    root.querySelectorAll<HTMLElement>('main section').forEach((sec) => {
      if (sec.classList.contains('px-maq-hero')) return;
      if (sec.dataset.pxSecAnim === '1') return;
      sec.dataset.pxSecAnim = '1';
      const tween = gsap.from(sec, {
        autoAlpha: 0.2,
        y: 36,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: sec, start: 'top 90%', toggleActions: 'play none none none' },
      });
      cleanups.push(() => {
        tween.scrollTrigger?.kill();
        tween.kill();
        delete sec.dataset.pxSecAnim;
      });
    });
  }

  /* Cards stagger */
  if (!reduced) {
    const cardSel =
      '.px-maq-enjeux__card, .px-maq-inter__item, .px-maq-masonry__tile, .px-maq-masonry__extra, .px-maq-quali__card, .px-maq-secteurs__item, .px-ultra-tera-card';
    root.querySelectorAll<HTMLElement>(cardSel).forEach((card, i) => {
      if (card.dataset.pxCardAnim === '1') return;
      card.dataset.pxCardAnim = '1';
      const tween = gsap.from(card, {
        autoAlpha: 0,
        y: 28,
        duration: 0.6,
        delay: (i % 5) * 0.05,
        ease: 'power2.out',
        scrollTrigger: { trigger: card, start: 'top 93%' },
      });
      cleanups.push(() => {
        tween.scrollTrigger?.kill();
        tween.kill();
        delete card.dataset.pxCardAnim;
      });
    });
  }

  /* WOW */
  let wow: any;
  if (typeof window.WOW === 'function') {
    wow = new window.WOW({
      boxClass: 'wow',
      animateClass: 'animated',
      offset: 80,
      mobile: true,
      live: true,
    });
    wow.init();
  }

  ScrollTrigger.refresh();

  return () => {
    cleanups.forEach((fn) => fn());
    try {
      wow?.sync?.();
    } catch {
      /* ignore */
    }
  };
}

export function useMaquetteEffects(currentPath: string) {
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;

    const run = async () => {
      try {
        await ensureLibs();
      } catch {
        return;
      }
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        const root = document.querySelector<HTMLElement>('.px-maq-root');
        if (!root) return;
        dispose = initMaquetteEffects(root);
      });
    };

    void run();

    return () => {
      cancelled = true;
      dispose?.();
      window.ScrollTrigger?.getAll?.().forEach((t: { kill: () => void }) => t.kill());
    };
  }, [currentPath]);
}
