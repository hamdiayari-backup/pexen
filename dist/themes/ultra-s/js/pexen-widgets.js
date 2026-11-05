/**
 * PEXEN — WhatsApp + Assistant IA (thème ultra-s)
 */
(function () {
  'use strict';

  var WA_PHONE = '33141935280';
  var WA_DEFAULT =
    'Bonjour PEXEN, je souhaite échanger sur un projet de performance énergétique.';
  var AI_ENDPOINT = '/api/ai/chat';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function timeNow() {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- WhatsApp ---------- */
  function initWhatsApp() {
    var wrap = el('div', 'px-fab px-fab--wa');
    wrap.innerHTML =
      '<button type="button" class="px-fab__btn px-fab__btn--wa" aria-label="Contacter PEXEN sur WhatsApp">' +
      '<span class="px-fab__pulse" aria-hidden="true"></span>' +
      '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>' +
      '</button>' +
      '<div class="px-fab__panel px-fab__panel--wa" hidden>' +
      '<div class="px-fab__panel-head">' +
      '<div><strong>Permanence WhatsApp PEXEN</strong><span>Ingénieurs en ligne · rappel sous 48 h</span></div>' +
      '<button type="button" class="px-fab__close" aria-label="Fermer">&times;</button>' +
      '</div>' +
      '<div class="px-fab__panel-body">' +
      '<p class="px-fab__bubble">Bonjour ! Échangez directement avec un ingénieur d’affaires PEXEN sur vos installations ou dossiers CEE.</p>' +
      '<label>Votre message</label>' +
      '<textarea rows="3" class="px-wa-msg"></textarea>' +
      '<button type="button" class="px-fab__send px-fab__send--wa">Ouvrir dans WhatsApp</button>' +
      '<p class="px-fab__hint">Ligne directe : <a href="tel:+33141935280">01 41 93 52 80</a></p>' +
      '</div></div>';

    document.body.appendChild(wrap);
    var panel = wrap.querySelector('.px-fab__panel');
    var ta = wrap.querySelector('.px-wa-msg');
    ta.value = WA_DEFAULT;

    wrap.querySelector('.px-fab__btn').addEventListener('click', function () {
      panel.hidden = !panel.hidden;
    });
    wrap.querySelector('.px-fab__close').addEventListener('click', function () {
      panel.hidden = true;
    });
    wrap.querySelector('.px-fab__send').addEventListener('click', function () {
      var url =
        'https://wa.me/' +
        WA_PHONE +
        '?text=' +
        encodeURIComponent(ta.value.trim() || WA_DEFAULT);
      window.open(url, '_blank', 'noopener,noreferrer');
      panel.hidden = true;
    });
  }

  /* ---------- AI fallback ---------- */
  function offlineReply(q) {
    var lower = q.toLowerCase();
    if (lower.indexOf('haute pression') !== -1 || lower.indexOf('flottante') !== -1) {
      return "La Haute Pression Flottante (BAT-TH-134 / IND-UT-116) asservit la pression de condensation à la température extérieure : 15 à 25 % d’économie électrique sur les compresseurs, souvent financée jusqu’à 80 % via les CEE.";
    }
    if (lower.indexOf('bacs') !== -1 || lower.indexOf('gtb') !== -1 || lower.indexOf('décret') !== -1) {
      return "Le Décret BACS impose une GTB classe A ou B : obligatoire depuis le 1er janvier 2025 pour CVC > 290 kW, et dès 2030 pour > 70 kW. PEXEN vous accompagne avec valorisation CEE (BAT-TH-116).";
    }
    if (lower.indexOf('cee') !== -1 || lower.indexOf('financement') !== -1) {
      return "PEXEN monte et valorise vos CEE de A à Z. Froid, chaleur fatale, GTB, calorifugeage : le reste à charge est fortement réduit, avec contrôle COFRAC en fin de chantier.";
    }
    if (lower.indexOf('étape') !== -1 || lower.indexOf('méthode') !== -1) {
      return "Méthode PEXEN en 4 étapes : 1) Prévisite & audit 2) Dimensionnement & offre CEE 3) Installation sans rupture d’activité 4) Contrôle COFRAC & suivi des économies.";
    }
    return "Chez PEXEN, nous auditons vos installations, concevons la solution, réalisons les travaux sans interruption et sécurisons le financement CEE. Composez le 01 41 93 52 80 ou utilisez le formulaire de contact — réponse sous 48 h ouvrées.";
  }

  /* ---------- AI widget ---------- */
  function initAi() {
    var history = [];
    var loading = false;
    var wrap = el('div', 'px-fab px-fab--ai');
    wrap.innerHTML =
      '<button type="button" class="px-fab__btn px-fab__btn--ai" aria-label="Ouvrir le conseiller PEXEN">' +
      '<span class="px-fab__ai-ico" aria-hidden="true">✦</span>' +
      '<span class="px-fab__ai-label"><strong>Conseil PEXEN</strong><em>En ligne — réponse immédiate</em></span>' +
      '</button>' +
      '<div class="px-fab__panel px-fab__panel--ai" hidden>' +
      '<div class="px-fab__panel-head">' +
      '<div><strong>Conseiller PEXEN®</strong><span>En ligne · répond en quelques secondes</span></div>' +
      '<button type="button" class="px-fab__close" aria-label="Fermer">&times;</button>' +
      '</div>' +
      '<div class="px-fab__chips">' +
      '<button type="button" data-q="Comment fonctionne la Haute Pression Flottante ?">HP Flottante</button>' +
      '<button type="button" data-q="Mon site est-il soumis au Décret BACS ?">Décret BACS</button>' +
      '<button type="button" data-q="Quel est le reste à charge avec les CEE ?">Financement CEE</button>' +
      '<button type="button" data-q="Quelles sont les 4 étapes d\'un chantier PEXEN ?">Méthode</button>' +
      '</div>' +
      '<div class="px-fab__msgs" role="log" aria-live="polite"></div>' +
      '<div class="px-fab__panel-foot">' +
      '<a href="#contact" class="px-fab__cta">Parler à un expert →</a>' +
      '<form class="px-ai-form">' +
      '<input type="text" class="px-ai-input" placeholder="HP flottante, BACS, CEE…" maxlength="2000" autocomplete="off">' +
      '<button type="submit" class="px-fab__send px-fab__send--ai" aria-label="Envoyer">➤</button>' +
      '</form></div></div>';

    document.body.appendChild(wrap);
    var panel = wrap.querySelector('.px-fab__panel');
    var msgs = wrap.querySelector('.px-fab__msgs');
    var input = wrap.querySelector('.px-ai-input');
    var form = wrap.querySelector('.px-ai-form');

    function addMsg(sender, text) {
      var row = el('div', 'px-fab__msg px-fab__msg--' + sender);
      row.innerHTML =
        '<div class="px-fab__msg-bubble"><p>' +
        escapeHtml(text).replace(/\n/g, '<br>') +
        '</p><time>' +
        timeNow() +
        '</time></div>';
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
    }

    addMsg(
      'ai',
      'Bonjour, je suis le conseiller en ligne PEXEN®. Comment puis-je vous éclairer sur vos groupes froids, le Décret BACS, vos récupérations de chaleur ou vos dossiers CEE ?'
    );

    async function send(question) {
      question = (question || '').trim();
      if (!question || loading) return;
      loading = true;
      addMsg('user', question);
      input.value = '';
      var status = el('div', 'px-fab__typing', 'Le conseiller rédige…');
      msgs.appendChild(status);

      var reply = null;
      try {
        var res = await fetch(AI_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: question,
            history: history.slice(-4),
          }),
        });
        if (res.ok) {
          var data = await res.json();
          reply = data.reply || null;
        }
      } catch (e) {
        /* offline */
      }

      if (!reply) reply = offlineReply(question);
      status.remove();
      addMsg('ai', reply);
      history.push({ role: 'user', parts: [{ text: question }] });
      history.push({ role: 'model', parts: [{ text: reply }] });
      loading = false;
    }

    wrap.querySelector('.px-fab__btn').addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) input.focus();
    });
    wrap.querySelector('.px-fab__close').addEventListener('click', function () {
      panel.hidden = true;
    });
    wrap.querySelector('.px-fab__cta').addEventListener('click', function () {
      panel.hidden = true;
    });
    wrap.querySelectorAll('.px-fab__chips button').forEach(function (b) {
      b.addEventListener('click', function () {
        send(b.getAttribute('data-q'));
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      send(input.value);
    });
  }

  /* ---------- Contact form ---------- */
  function initContactForm() {
    var form = document.getElementById('px-contact-form');
    if (!form) return;
    var msg = document.getElementById('px-contact-msg');
    var btn = form.querySelector('[type="submit"]');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (msg) {
        msg.className = 'px-form-msg';
        msg.textContent = '';
      }
      var fd = new FormData(form);
      var body = {};
      fd.forEach(function (v, k) {
        body[k] = typeof v === 'string' ? v : String(v);
      });
      if (form.querySelector('[name="rgpdAccepted"]')) {
        body.rgpdAccepted = form.querySelector('[name="rgpdAccepted"]').checked;
      }
      if (btn) {
        btn.disabled = true;
        btn.dataset.label = btn.innerHTML;
        btn.innerHTML = 'Envoi en cours…';
      }
      try {
        var res = await fetch('/api/public/forms/contact-main/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        var data = await res.json().catch(function () {
          return {};
        });
        if (res.ok && data.ok) {
          if (msg) {
            msg.className = 'px-form-msg px-form-msg--ok';
            msg.textContent =
              'Merci. Votre demande est bien reçue — un ingénieur PEXEN vous répond sous 48 h ouvrées.';
          }
          form.reset();
        } else {
          var err =
            data.error ||
            (data.fields && Object.values(data.fields)[0]) ||
            'Envoi impossible. Appelez le 01 41 93 52 80.';
          if (msg) {
            msg.className = 'px-form-msg px-form-msg--err';
            msg.textContent = err;
          }
        }
      } catch (err) {
        if (msg) {
          msg.className = 'px-form-msg px-form-msg--err';
          msg.textContent = 'Réseau indisponible. Écrivez-nous à contact@pexen.fr ou au 01 41 93 52 80.';
        }
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.label || 'Envoyer ma demande';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initWhatsApp();
      initAi();
      initContactForm();
    });
  } else {
    initWhatsApp();
    initAi();
    initContactForm();
  }
})();
