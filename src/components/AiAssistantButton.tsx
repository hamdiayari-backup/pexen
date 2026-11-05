import { useSiteConfig } from '../context/SiteConfigContext';
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const PEXEN_SYSTEM_PROMPT = `Tu es l'ingénieur conseil virtuel officiel de PEXEN® (Ingénierie & Performance Énergétique).
Slogan de PEXEN : "Optimiser aujourd'hui. Performer demain."
Téléphone : 01 41 93 52 80 | SLA de rappel : sous 48 h ouvrées | Site : pexen.fr

CONSIGNE STRICTE DE PÉRIMÈTRE ("TRAINÉ SUR CETTE PLATEFORME SEULEMENT") :
Tu es UNIQUEMENT et STRICTEMENT spécialisé sur la plateforme PEXEN, l'efficacité énergétique, le génie frigorifique, le génie climatique (CVC), les Certificats d'Économies d'Énergie (CEE), le Décret Tertiaire et le Décret BACS.
Si un utilisateur te pose une question hors de ce domaine (par exemple sur le cinéma, la politique, la cuisine, le code informatique général, etc.), refuse poliment et recentre immédiatement la discussion sur les installations techniques professionnelles de PEXEN.

BASE DE CONNAISSANCES PEXEN :
1. Cible professionnelle :
- Industrie : Directeurs d'usine, directeurs techniques, responsables maintenance (chimie, agro, pharma, métallurgie...).
- Tertiaire : Grande distribution (Intermarché, Carrefour, etc.), plateformes logistiques (CEDIM), bureaux, santé.
- Résidentiel collectif : Bailleurs sociaux, syndics de copropriété.
- Partenaires : Obligés, délégataires et mandataires CEE.
(Hors cible : particuliers et secteur agricole).

2. Les 6 expertises techniques :
- Froid commercial & industriel : Haute Pression Flottante (BAT-TH-134 / IND-UT-116, économies 15-25%), Basse Pression Flottante (BAT-TH-145 / IND-UT-115), Condenseurs haute efficacité (BAT-EQ-130 / IND-UT-113), Variateurs électroniques VEV (BAT-TH-112 / IND-UT-102), Fermeture de meubles frigorifiques (BAT-TH-124 / 125).
- Récupération de chaleur : sur groupes froids (BAT-TH-139 / IND-UT-103 pour chauffer eau chaude ou locaux gratuitement), chaleur fatale industrielle (IND-UT-137), eaux grises (BAT-TH-154).
- Chauffage & traitement d'air : Remplacement chaudières fioul/gaz par Pompes à chaleur (PAC) air/eau haute température (BAT-TH-163 / IND-UT-117), Déstratification d'air des halls de grande hauteur (BAT-TH-142 / IND-BA-116).
- Pilotage GTB/GTC & Décret BACS : Obligation depuis le 1er janvier 2025 pour CVC > 290 kW, et dès le 1er janvier 2030 pour CVC > 70 kW (fiches BAT-TH-116 / IND-UT-134).
- Isolation technique : Matelas thermiques démontables sur vannes et brides (BAT-TH-106 / IND-UT-121), isolation de toiture terrasse (BAT-TH-107).
- Réglementation CEE & Décret Tertiaire : Obligation pour bâtiments >= 1000 m² (-40% en 2030, -50% en 2040, -60% en 2050, déclaration OPERAT). Montage intégral des dossiers CEE de A à Z.

3. Méthode en 4 étapes & livrables contractuels :
- Étape 01 : Prévisite & audit énergétique terrain -> Remise de la "Pré-étude d'ingénierie détaillée".
- Étape 02 : Dimensionnement & ingénierie technico-financière -> Remise du "Dossier technique, devis ferme et proposition de financement CEE".
- Étape 03 : Installation, pose & mise en service en milieu occupé sans rupture d'activité -> Remise du "PV de réception & fiche d'autocontrôle".
- Étape 04 : Contrôle COFRAC, suivi & performance -> Remise de "l'Attestation de conformité COFRAC et bilan d'économies d'énergie".

4. Chantiers récents :
- Intermarché Super à Trévenans (90) : HP Flottante & variateurs sur centrale froid.
- Colorcon à Bazainville (78) : Récupération de chaleur fatale & matelas thermiques en industrie pharmaceutique.
- Carrefour Market Île-de-France : Condenseurs haute efficacité & vitrage meubles froids.
- CEDIM : Déstratificateurs d'air & GTB sur plateforme logistique de 12 m sous plafond.

5. Partenaires & Assurances :
- Bureau d'études partenaire : Leo Energy (OPQIBI 1717 et 1905).
- Qualifications PEXEN : RGE Ventilation+, RGE Qualisol CESI, SOCOTEC Fluides Frigorigènes Cat. I.
- Assurances : MIC Insurance (RC Pro & Décennale).

TON :
Expert, précis, sérieux, chiffré, bienveillant, orienté ingénierie industrielle. Pas de discours écolo vague, pas de vocabulaire d'artisan. Propose toujours à la fin d'être recontacté sous 48h par un ingénieur d'affaires PEXEN ou de composer le 01 41 93 52 80.`;

interface AiAssistantProps {
  onNavigateToContact: () => void;
}

export const AiAssistantButton: React.FC<AiAssistantProps> = ({ onNavigateToContact }) => {
  const [isOpen, setIsOpen] = useState(false);
  const siteCfg = useSiteConfig();
  const aiCfg = siteCfg?.ai;
  const buttonLabel = aiCfg?.buttonLabel || 'Conseiller PEXEN';
  const statusLabel = aiCfg?.statusLabel || 'En ligne';
  const panelTitle = aiCfg?.panelTitle || buttonLabel;
  const aiSide = siteCfg?.whatsapp.enabled && siteCfg.whatsapp.position === 'bottom-left' ? 'right-5' : 'left-5';
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Bonjour, je suis le conseiller en ligne PEXEN®. Comment puis-je vous éclairer sur vos groupes froids, le Décret BACS, vos récupérations de chaleur ou vos dossiers CEE ?',
      timestamp: 'Maintenant'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickQuestions = [
    'Comment fonctionne la Haute Pression Flottante ?',
    'Mon site est-il soumis au Décret BACS ?',
    'Quel est le reste à charge avec les CEE ?',
    'Quelles sont les 4 étapes d\'un chantier PEXEN ?'
  ];

  const handleSend = async (textToSend?: string) => {
    const question = (textToSend || input).trim();
    if (!question || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const saved = localStorage.getItem('pexen_cookie_consent');
      const ok = saved ? (JSON.parse(saved) as { analytics?: boolean }).analytics === true : false;
      if (ok) (window as Window & { gtag?: (...a: unknown[]) => void }).gtag?.('event', 'pxn_question', { page: window.location.pathname });
    } catch {
      /* ignore */
    }

    try {
      // 1. Try server endpoint first
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: question,
          history: messages.slice(-4).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.reply || 'Je reste à votre disposition pour analyser vos installations techniques.',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      // Continue to fallback
    }

    // 2. Client fallback direct Gemini generation with user key
    try {
      const apiKey = "AQ.Ab8RN6JmfpQV5zphsYU9iWQBOBfI7v3o4QvJCwgun1uHLqNXcw";
      const directRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: PEXEN_SYSTEM_PROMPT }]
            },
            contents: [
              ...messages.slice(-4).map((m) => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
              })),
              {
                role: 'user',
                parts: [{ text: question }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 800
            }
          })
        }
      );

      if (directRes.ok) {
        const data = await directRes.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: generatedText || 'Nos ingénieurs PEXEN sont joignables au 01 41 93 52 80 pour étudier votre installation.',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      // Fallback
    }

    // 3. High-quality offline fallback tailored to PEXEN domain
    const fallbackAnswer = generatePexenKnowledgeResponse(question);
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: fallbackAnswer,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsLoading(false);
  };

  // Specialized offline response matcher in case of network issue
  const generatePexenKnowledgeResponse = (q: string): string => {
    const lower = q.toLowerCase();
    if (lower.includes('haute pression') || lower.includes('hp') || lower.includes('flottante')) {
      return "La Haute Pression Flottante (Fiche BAT-TH-134 en tertiaire / IND-UT-116 en industrie) permet d'asservir la pression de condensation à la température extérieure. Elle permet d'économiser entre 15% et 25% de la consommation électrique des compresseurs frigorifiques tout au long de l'année. Les travaux sont pris en charge jusqu'à 80% par les CEE.";
    }
    if (lower.includes('bacs') || lower.includes('gtb') || lower.includes('décret')) {
      return "Le Décret BACS impose l'installation d'une GTB (Gestion Technique du Bâtiment) de classe A ou B : obligation depuis le 1er janvier 2025 pour les systèmes CVC > 290 kW, et dès le 1er janvier 2030 pour les systèmes > 70 kW. PEXEN vous accompagne dans cette mise en conformité avec valorisation CEE via la fiche BAT-TH-116.";
    }
    if (lower.includes('étape') || lower.includes('méthode') || lower.includes('déroul')) {
      return "Un projet PEXEN se déroule en 4 étapes avec un livrable officiel remis à chaque jalon : 1. Prévisite & audit (Pré-étude remise) | 2. Dimensionnement & ingénierie technico-financière (Dossier & offre CEE) | 3. Installation sans interruption d'activité (PV de réception) | 4. Contrôle COFRAC & suivi des économies.";
    }
    if (lower.includes('cee') || lower.includes('financement') || lower.includes('aide')) {
      return "PEXEN prend en charge le montage et la valorisation de vos Certificats d'Économies d'Énergie de A à Z. Nos solutions (froid, chaleur fatale, GTB, calorifugeage) réduisent fortement le reste à charge, et chaque chantier est certifié par un organisme de contrôle accrédité COFRAC.";
    }
    return "Chez PEXEN, nous auditons vos installations, concevons la solution technique optimale, réalisons les travaux sans rupture d'activité et sécurisons le financement CEE. Vous pouvez échanger directement avec un ingénieur au 01 41 93 52 80 ou formuler votre demande d'étude sous 48 h ouvrées.";
  };

  const sideClass = aiSide === 'right-5' ? 'px-fab--wa' : 'px-fab--ai';

  return (
    <div className={`px-fab ${sideClass}`}>
      {isOpen ? (
        <div className="px-fab__panel px-fab__panel--ai" role="dialog" aria-label={panelTitle}>
          <div className="px-fab__panel-head">
            <div className="d-flex align-items-center gap-3">
              <div>
                <strong>{panelTitle}</strong>
                <span>{statusLabel}</span>
              </div>
            </div>
            <button type="button" className="px-fab__close" onClick={() => setIsOpen(false)} aria-label="Fermer">
              ×
            </button>
          </div>

          <div className="px-fab__chips">
            {quickQuestions.map((q) => (
              <button key={q} type="button" onClick={() => handleSend(q)}>
                {q}
              </button>
            ))}
          </div>

          <div className="px-fab__msgs">
            {messages.map((m) => (
              <div key={m.id} className={`px-fab__msg ${m.sender === 'user' ? 'px-fab__msg--user' : 'px-fab__msg--ai'}`}>
                <div className="px-fab__msg-bubble">
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                  <time>{m.timestamp}</time>
                </div>
              </div>
            ))}
            {isLoading ? <div className="px-fab__typing">Le conseiller rédige sa réponse…</div> : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-fab__panel-foot">
            <button
              type="button"
              className="px-fab__cta"
              onClick={() => {
                setIsOpen(false);
                onNavigateToContact();
              }}
            >
              Parler à un expert →
            </button>
            <form
              className="px-ai-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                className="px-ai-input"
                type="text"
                placeholder="HP flottante, BACS, CEE…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="px-fab__send px-fab__send--ai" disabled={!input.trim() || isLoading} aria-label="Envoyer">
                <Send className="w-4 h-4" style={{ width: 16, height: 16, margin: '0 auto', display: 'block' }} />
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="px-fab__btn px-fab__btn--ai"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={`Ouvrir ${buttonLabel}`}
        aria-expanded={isOpen}
      >
        <span className="px-fab__ai-label">
          <strong>{buttonLabel}</strong>
          <em>{statusLabel}</em>
        </span>
      </button>
    </div>
  );
};
