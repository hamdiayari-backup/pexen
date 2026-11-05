import { useEffect } from 'react';

/**
 * Dynamisme scroll PEXEN Ultra — vision Amina :
 * progression, timeline process, compteurs, parallax différencié, révélations sobres.
 * Pas de gadgets, pas d’uppercase forcé.
 */

declare global {
  interface Window {
    gsap?: any;
    ScrollTrigger?: any;
    SplitText?: any;
    WOW?: any;
    jarallax?: any;
  }
}

function loadCss(href: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`link[data-ultra-fx="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.ultraFx = href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-ultra-fx="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === '1') resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.dataset.ultraFx = src;
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
  await loadScript('/themes/ultra-s/js/jarallax.min.js');
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initUltraEffects(root: HTMLElement) {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const SplitText = window.SplitText;
  /* Timeline / compteurs doivent tourner même si SplitText échoue */
  if (!gsap || !ScrollTrigger) return () => undefined;

  gsap.registerPlugin(ScrollTrigger);
  const cleanups: Array<() => void> = [];
  const reduced = prefersReducedMotion();

  /* ——— 1. Barre de progression de scroll ——— */
  let progressEl = document.querySelector<HTMLElement>('.px-ultra-scroll-progress');
  if (!progressEl) {
    progressEl = document.createElement('div');
    progressEl.className = 'px-ultra-scroll-progress';
    progressEl.setAttribute('aria-hidden', 'true');
    root.prepend(progressEl);
  }
  if (!reduced) {
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
    gsap.set(progressEl, { scaleX: 0, transformOrigin: 'left center' });
    cleanups.push(() => {
      progTween.scrollTrigger?.kill();
      progTween.kill();
    });
  } else {
    progressEl.style.transform = 'scaleX(0)';
  }

  /* ——— Titres : lettres (sobre) ——— */
  if (!reduced && SplitText) {
    root.querySelectorAll<HTMLElement>('.sec-title:not([data-px-split])').forEach((el) => {
      /* Titres déjà à l’écran : ne pas les laisser en opacity 0 si ScrollTrigger ne déclenche pas. */
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
      el.dataset.pxSplit = '1';
      try {
        const split = new SplitText(el, { type: 'chars, words' });
        const tween = gsap.from(split.chars, {
          duration: 0.85,
          delay: 0.04,
          y: 18,
          autoAlpha: 0,
          stagger: 0.018,
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
        delete el.dataset.pxSplit;
      }
    });
  }

  /* ——— Images anim-zoom ——— */
  if (!reduced) {
    root.querySelectorAll<HTMLElement>('.anim-zoom:not([data-px-zoom])').forEach((img) => {
      img.dataset.pxZoom = '1';
      if (!img.parentElement?.classList.contains('zoom-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'zoom-wrap';
        wrap.style.overflow = 'hidden';
        img.parentNode?.insertBefore(wrap, img);
        wrap.appendChild(img);
      }
      const wrap = img.parentElement!;
      const tween = gsap
        .timeline({ scrollTrigger: { trigger: wrap, start: 'top 100%' } })
        .from(img, { duration: 1.6, autoAlpha: 0, scale: 1.12, ease: 'power2.out', clearProps: 'all' });
      cleanups.push(() => {
        tween.scrollTrigger?.kill();
        tween.kill();
        delete img.dataset.pxZoom;
      });
    });
  }

  /* ——— Barres skill ——— */
  root.querySelectorAll<HTMLElement>('.progress-wrap:not([data-px-prog])').forEach((wrap) => {
    wrap.dataset.pxProg = '1';
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          wrap.querySelectorAll<HTMLElement>('.progress-item').forEach((item) => {
            const bar = item.querySelector<HTMLElement>('.count-bar');
            const pct = item.getAttribute('data-percent') || '0%';
            if (bar) {
              bar.style.width = '0%';
              requestAnimationFrame(() => {
                bar.style.transition = reduced ? 'none' : 'width 1.1s ease';
                bar.style.width = pct;
              });
            }
          });
          io.disconnect();
        });
      },
      { threshold: 0.35 }
    );
    io.observe(wrap);
    cleanups.push(() => {
      io.disconnect();
      delete wrap.dataset.pxProg;
    });
  });

  /* ——— 3. Timeline process : autoplay 01→05 à l’entrée viewport ——— */
  root.querySelectorAll<HTMLElement>('.px-ultra-timeline:not([data-px-tl])').forEach((tl) => {
    tl.dataset.pxTl = '1';
    if (!tl.querySelector('.px-ultra-timeline__progress')) {
      const track = document.createElement('div');
      track.className = 'px-ultra-timeline__track';
      const fill = document.createElement('div');
      fill.className = 'px-ultra-timeline__progress';
      track.appendChild(fill);
      tl.prepend(track);
    }
    const fill = tl.querySelector<HTMLElement>('.px-ultra-timeline__progress');
    const steps = Array.from(tl.querySelectorAll<HTMLElement>('.px-ultra-tl-step'));
    const section = tl.closest('section') || tl.parentElement;
    const phases = section?.querySelectorAll<HTMLElement>('.px-ultra-timeline-phases > div');

    const setProgress = (p: number) => {
      const t = Math.max(0, Math.min(1, p));
      if (fill) {
        fill.style.transformOrigin = 'left center';
        fill.style.transform = `scaleX(${t})`;
      }
      steps.forEach((step, i) => {
        const threshold = steps.length <= 1 ? 0 : i / (steps.length - 1);
        step.classList.toggle('is-active', t >= threshold - 0.001);
      });
      if (phases && phases.length >= 3) {
        phases[0].classList.toggle('is-on', t >= 0);
        phases[1].classList.toggle('is-on', t >= 0.4);
        phases[2].classList.toggle('is-on', t >= 0.75);
      }
    };

    if (reduced) {
      setProgress(1);
      cleanups.push(() => delete tl.dataset.pxTl);
      return;
    }

    setProgress(0);
    steps.forEach((s) => s.classList.remove('is-active'));
    phases?.forEach((ph) => ph.classList.remove('is-on'));

    const state = { p: 0 };
    let tween: { kill: () => void } | null = null;
    let playing = false;

    const play = () => {
      if (playing) return;
      playing = true;
      tween?.kill();
      state.p = 0;
      setProgress(0);
      steps.forEach((s) => {
        s.classList.remove('is-active');
        gsap.set(s, { autoAlpha: 0.4, y: 22 });
      });
      phases?.forEach((ph) => ph.classList.remove('is-on'));
      tween = gsap.to(state, {
        p: 1,
        duration: 4,
        ease: 'power1.inOut',
        onUpdate: () => setProgress(state.p),
        onComplete: () => {
          setProgress(1);
          playing = false;
        },
      });
      steps.forEach((step, i) => {
        gsap.to(step, {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          delay: 0.15 + i * 0.55,
          ease: 'power2.out',
        });
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) play();
        });
      },
      { threshold: [0.25, 0.4], rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(section || tl);

    const st = ScrollTrigger.create({
      trigger: section || tl,
      start: 'top 80%',
      onEnter: play,
      onEnterBack: play,
    });

    requestAnimationFrame(() => {
      const rect = (section || tl).getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.2) play();
    });

    cleanups.push(() => {
      io.disconnect();
      st.kill();
      tween?.kill();
      delete tl.dataset.pxTl;
    });
  });

  /* ——— 4. Compteurs enjeux ——— */
  root.querySelectorAll<HTMLElement>('[data-px-count]:not([data-px-counted])').forEach((el) => {
    el.dataset.pxCounted = '1';
    const raw = el.dataset.pxCount || '0';
    const target = Number(String(raw).replace(/[^\d.-]/g, ''));
    const prefix = el.dataset.pxPrefix || '';
    const suffix = el.dataset.pxSuffix || '';
    const decimals = String(raw).includes('.') ? 1 : 0;
    if (!Number.isFinite(target)) return;

    const formatSuffix = (rawSuffix: string) => {
      const trimmed = rawSuffix.trim();
      const m = trimmed.match(/^GWh\s+cumac(\*?)$/i);
      if (m) {
        return `<span class="px-ultra-count-s px-ultra-count-s--stack"><span class="px-ultra-count-s__unit">GWh</span><span class="px-ultra-count-s__sub">cumac${
          m[1] ? '<sup class="px-ultra-count-s__star">*</sup>' : ''
        }</span></span>`;
      }
      if (trimmed.endsWith('*')) {
        return `<span class="px-ultra-count-s">${trimmed.slice(0, -1)}<sup class="px-ultra-count-s__star">*</sup></span>`;
      }
      return `<span class="px-ultra-count-s">${rawSuffix}</span>`;
    };

    const render = (v: number) => {
      /* Toujours arrondir les entiers (évite 1 649 m² en fin d’anim) */
      const rawN = decimals ? Number(v).toFixed(decimals) : String(Math.round(v));
      const [intPart, decPart] = rawN.split('.');
      const spaced = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
      const n = decPart ? `${spaced},${decPart}` : spaced;
      el.innerHTML = `${prefix}<span class="px-ultra-count-n">${n}</span>${suffix ? formatSuffix(suffix) : ''}`;
    };

    if (reduced) {
      render(target);
      return;
    }

    /* Valeur réelle déjà dans le HTML (SEO / captures) — l’anim ne démarre qu’au scroll */
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

  /* ——— Parallax Jarallax ——— */
  if (typeof window.jarallax === 'function') {
    const nodes = root.querySelectorAll('.jarallax');
    if (nodes.length) {
      window.jarallax(nodes, { speed: 0.45 });
      cleanups.push(() => {
        try {
          window.jarallax?.(nodes, 'destroy');
        } catch {
          /* ignore */
        }
      });
    }
  }

  /* ——— 6. Parallax différencié : ambiance / photos / schémas ——— */
  if (!reduced) {
    root.querySelectorAll<HTMLElement>('.px-ultra-parallax').forEach((el) => {
      const speed = Number(el.dataset.pxSpeed || '0.12');
      const tween = gsap.to(el, {
        y: () => speed * 180,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.7 },
      });
      cleanups.push(() => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    });

    root.querySelectorAll<HTMLElement>('.px-ultra-atm__photo').forEach((el) => {
      const tween = gsap.fromTo(
        el,
        { scale: 1.1, y: -40 },
        {
          scale: 1,
          y: 40,
          ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement || el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
      cleanups.push(() => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    });

    root.querySelectorAll<HTMLElement>('.px-ultra-atm__schema').forEach((el) => {
      const tween = gsap.to(el, {
        y: 60,
        x: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8,
        },
      });
      cleanups.push(() => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    });
  }

  /* ——— Sections : entrée une fois (pas de reverse clignotant) ——— */
  if (!reduced) {
    root.querySelectorAll<HTMLElement>('main section').forEach((sec) => {
      if (sec.classList.contains('px-hero')) return;
      if (sec.dataset.pxSecAnim === '1') return;
      sec.dataset.pxSecAnim = '1';
      const tween = gsap.from(sec, {
        autoAlpha: 0.25,
        y: 40,
        duration: 0.85,
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

  /* ——— Cartes ——— */
  if (!reduced) {
    root.querySelectorAll<HTMLElement>('.px-ultra-serv-col, .px-ultra-tera-card, .px-card').forEach((card, i) => {
      if (card.dataset.pxCardAnim === '1') return;
      card.dataset.pxCardAnim = '1';
      const tween = gsap.from(card, {
        autoAlpha: 0,
        y: 32,
        duration: 0.65,
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

  /* ——— 7. CTA final : révélation ——— */
  if (!reduced) {
    root.querySelectorAll<HTMLElement>('.px-ultra-cta-band:not([data-px-cta])').forEach((cta) => {
      cta.dataset.pxCta = '1';
      const inner = cta.querySelector('.container');
      if (!inner) return;
      const tween = gsap.from(inner, {
        autoAlpha: 0,
        y: 36,
        scale: 0.98,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: cta, start: 'top 85%' },
      });
      cleanups.push(() => {
        tween.scrollTrigger?.kill();
        tween.kill();
        delete cta.dataset.pxCta;
      });
    });
  }

  /* ——— WOW ——— */
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

/** Hook Shell Ultra — rejoue à chaque navigation. */
export function useUltraEffects(currentPath: string) {
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
        const root = document.querySelector<HTMLElement>('.px-ultra-root');
        if (!root) return;
        dispose = initUltraEffects(root);
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
