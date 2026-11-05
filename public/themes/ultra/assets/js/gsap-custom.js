(function ($) {
  "use strict";

  // scrollTrigger
  var ST = typeof ScrollTrigger !== "undefined" ? ScrollTrigger : (gsap.plugins && gsap.plugins.ScrollTrigger);
  var SS = typeof ScrollSmoother !== "undefined" ? ScrollSmoother : (window.ScrollSmoother);
  if (!ST || !SS) {
    console.warn("GSAP Scroll plugins missing — smooth scroll désactivé");
    return;
  }
  gsap.registerPlugin(ST, SS);

  // smooth scroller
  ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 0.5,
    effects: true,
    smoothTouch: 0.1,
    normalizeScroll: false,
    ignoreMobileResize: true,
  });

  // scroll back position
  const sbitems = document.querySelectorAll(".sb-item");
  if (sbitems.length) {
    gsap.matchMedia().add("(min-width: 992px)", () => {
      gsap.fromTo(
        ".sb-item",
        {
          y: (i) => [300, 100, 300][i],
        },
        {
          y: 0,
          scrollTrigger: {
            trigger: ".scroll-back-pos",
            start: "top center",
            end: "bottom 95%",
            scrub: true,
          },
        },
      );
    });
  }

  // pin panel
  gsap.matchMedia().add("(min-width: 992px)", () => {
    const panels = gsap.utils.toArray(".pin-panel");
    panels.forEach((panel, i) => {
      ScrollTrigger.create({
        trigger: panel,
        start: "top 120",
        endTrigger: ".panel-wrap",
        end: "bottom+=380 bottom",
        pin: true,
        pinSpacing: false,
        scrub: true,
      });
    });
  });

  // image reveal
  if ($(".reveal").length) {
    let revealContainers = document.querySelectorAll(".reveal");
    revealContainers.forEach((container) => {
      let image = container.querySelector("img");
      let tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          toggleActions: "play none none none",
        },
      });
      tl.set(container, {
        autoAlpha: 1,
      });
      tl.from(container, 1, {
        xPercent: -100,
        ease: Power2.out,
      });
      tl.from(image, 1, {
        xPercent: 100,
        scale: 1,
        delay: -1,
        ease: Power2.out,
      });
    });
  }

  /* animation text */
  function aniText() {
    // ani-text-1
    if ($(".ani-text-1").length) {
      let aniTextEl = document.querySelectorAll(".ani-text-1");
      aniTextEl.forEach((element) => {
        if (element.animation) {
          element.animation.progress(1).kill();
          element.split.revert();
        }

        element.split = new SplitText(element, {
          type: "lines,words,chars",
          linesClass: "split-line",
        });
        gsap.set(element, { perspective: 400 });
        gsap.set(element.split.chars, {
          opacity: 0,
          x: "50",
        });

        element.animation = gsap.to(element.split.chars, {
          scrollTrigger: { trigger: element, start: "top 90%" },
          x: "0",
          y: "0",
          rotateX: "0",
          opacity: 1,
          duration: 1,
          ease: Back.easeOut,
          stagger: 0.02,
        });
      });
    }

    // ani-text-2
    if ($(".ani-text-2").length) {
      let aniTextEl = document.querySelectorAll(".ani-text-2");
      aniTextEl.forEach((element) => {
        let aniSpText = new SplitText(element, { type: "chars, words" });
        gsap.from(aniSpText.chars, {
          duration: 1,
          delay: 0.1,
          x: 20,
          autoAlpha: 0,
          stagger: 0.03,
          ease: "power2.out",
          scrollTrigger: { trigger: element, start: "top 85%" },
        });
      });
    }

    // ani-text-3
    if ($(".ani-text-3").length) {
      let aniTextEl = document.querySelectorAll(".ani-text-3");
      aniTextEl.forEach((element) => {
        let aniSpText = new SplitText(element, { type: "chars, words" });
        gsap.from(aniSpText.words, {
          duration: 1,
          delay: 0.5,
          x: 20,
          autoAlpha: 0,
          stagger: 0.05,
          scrollTrigger: { trigger: element, start: "top 85%" },
        });
      });
    }
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      aniText();
    });
  } else {
    window.addEventListener("load", aniText);
  }
})(jQuery);
