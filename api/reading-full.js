module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { birthday, birthtime, gender, location, topic, lang, plan } = req.body || {};

  // ── Current date context (always injected so Claude knows "now") ──────────
  const now        = new Date();
  const curYear    = now.getFullYear();
  const curMonth   = now.getMonth() + 1; // 1-12
  const curMonthPad = String(curMonth).padStart(2, '0');

  // Rolling 12-month window: from today → same month next year
  const windowStart = `${curYear}-${curMonthPad}`;           // e.g. "2026-05"
  const windowEnd   = `${curYear + 1}-${curMonthPad}`;       // e.g. "2027-05"
  const windowEndYear = curYear + 1;

  // Remaining months this year (for "rest of year" phrasing)
  const remainingMonths = 12 - curMonth; // e.g. if May → 7 months left

  // Month name helper
  const MONTH_NAMES_EN = ['January','February','March','April','May','June',
                           'July','August','September','October','November','December'];
  const MONTH_NAMES_FR = ['janvier','février','mars','avril','mai','juin',
                           'juillet','août','septembre','octobre','novembre','décembre'];
  const curMonthNameEN = MONTH_NAMES_EN[curMonth - 1];
  const curMonthNameFR = MONTH_NAMES_FR[curMonth - 1];

  // ── Topic labels ───────────────────────────────────────────────────────────
  const topicMap = {
    personality: {
      en: 'personality, core nature, innate strengths and shadow traits',
      fr: 'personnalité, nature profonde, forces innées et zones d\'ombre'
    },
    career: {
      en: 'career path, life purpose, professional opportunities and peak timing',
      fr: 'trajectoire professionnelle, vocation, opportunités et timing de pointe'
    },
    wealth: {
      en: 'wealth destiny, financial cycles, money patterns and upcoming earning windows',
      fr: 'destin financier, cycles de richesse, schémas monétaires et fenêtres de prospérité à venir'
    },
    love: {
      en: 'love and relationships, upcoming romantic timing, partner dynamics and emotional patterns',
      fr: 'amour et relations, timing romantique à venir, dynamiques de couple et schémas émotionnels'
    },
    health: {
      en: 'health tendencies, body constitution, vulnerable systems and upcoming energy cycles',
      fr: 'tendances de santé, constitution corporelle, systèmes vulnérables et cycles d\'énergie à venir'
    },
    yearly: {
      en: `the next 12 months (${curMonthNameEN} ${curYear} → ${curMonthNameEN} ${windowEndYear}): key turning points, monthly highlights and timing advice`,
      fr: `les 12 prochains mois (${curMonthNameFR} ${curYear} → ${curMonthNameFR} ${windowEndYear}) : tournants clés, points forts mensuels et conseils de timing`
    }
  };

  const topicLabel = (topicMap[topic] || topicMap.personality)[lang] || topicMap[topic].en;

  // ── Depth note by plan ─────────────────────────────────────────────────────
  const depthNote = plan === 'yearly'
    ? (lang === 'fr'
        ? 'Rapport VIP annuel — analyse la plus approfondie, 450-550 mots.'
        : 'Annual VIP report — deepest analysis, 450-550 words.')
    : plan === 'monthly'
    ? (lang === 'fr'
        ? 'Rapport mensuel — analyse approfondie, 320-420 mots.'
        : 'Monthly report — in-depth analysis, 320-420 words.')
    : (lang === 'fr'
        ? 'Rapport unique — analyse complète, 260-360 mots.'
        : 'Single report — complete analysis, 260-360 words.');

  // ── Time window instruction ────────────────────────────────────────────────
  const timeWindowEN = `
CRITICAL TIME RULES — follow exactly:
- Today's date is ${curMonthNameEN} ${curYear} (${windowStart}).
- Your forecast window is the NEXT 12 MONTHS: ${windowStart} through ${windowEnd}.
- There are ${remainingMonths} months remaining in ${curYear}, then the full year ${windowEndYear}.
- NEVER reference any month or period that has already passed.
- NEVER analyse 2025 or any earlier year as a future period — those are in the past.
- All timing advice, peak periods, and cautions must fall within ${windowStart}–${windowEnd}.
- When you mention seasons or months, make sure they are UPCOMING, not past.`;

  const timeWindowFR = `
RÈGLES TEMPORELLES STRICTES — à respecter absolument :
- La date d'aujourd'hui est ${curMonthNameFR} ${curYear} (${windowStart}).
- La fenêtre de prévision est les 12 PROCHAINS MOIS : de ${windowStart} à ${windowEnd}.
- Il reste ${remainingMonths} mois en ${curYear}, puis toute l'année ${windowEndYear}.
- Ne jamais mentionner un mois ou une période déjà passé(e).
- Ne jamais analyser 2025 ou une année antérieure comme période future — c'est le passé.
- Tous les conseils de timing, périodes favorables et mises en garde doivent se situer entre ${windowStart} et ${windowEnd}.
- Quand vous mentionnez des saisons ou des mois, assurez-vous qu'ils sont À VENIR, pas passés.`;

  // ── System prompts ─────────────────────────────────────────────────────────
  const systemPrompt = lang === 'fr'
    ? `Tu es Ming Li, maître en astrologie chinoise classique (BaZi Quatre Piliers + Zi Wei Dou Shu), formé aux quatre grandes écoles : Xu Leiwu, Liang Xiangren, Yuan Shushan et Wei Qianli.

Tu rédiges la section "${topicLabel}" d'un rapport complet payant.

${timeWindowFR}

Règles rédactionnelles :
${depthNote}
- Analyse concrète et personnalisée — JAMAIS générique
- Mentionne des éléments astrologiques précis (Maître du Jour, structure du thème, grande chance en cours, etc.)
- Donne des conseils pratiques et applicables immédiatement
- Cite des mois ou trimestres spécifiques dans la fenêtre ${windowStart}–${windowEnd}
- Entoure les termes clés importants avec <span class="highlight">...</span>
- Écris en paragraphes fluides, sépare chaque paragraphe par une ligne vide
- Ton : chaleureux, professionnel, jamais alarmiste
- Réponds uniquement en français
- Aucun titre, sous-titre, liste à puces, ni markdown`

    : `You are Ming Li, a master of classical Chinese astrology (BaZi Four Pillars + Zi Wei Dou Shu), trained in four great schools: Xu Leiwu, Liang Xiangren, Yuan Shushan, and Wei Qianli.

You are writing the "${topicLabel}" section of a paid full destiny report.

${timeWindowEN}

Writing rules:
${depthNote}
- Concrete and personalised analysis — NEVER generic
- Reference specific astrological elements (Day Master, chart structure, current 10-year cycle, etc.)
- Give practical, immediately actionable guidance
- Cite specific months or quarters within the ${windowStart}–${windowEnd} window
- Wrap key terms in <span class="highlight">...</span>
- Write in flowing paragraphs, separate each with a blank line
- Tone: warm, professional, never alarmist
- Reply in English only
- No titles, subheadings, bullet points, or markdown`;

  // ── User prompt ────────────────────────────────────────────────────────────
  const userPrompt = lang === 'fr'
    ? `Date de naissance : ${birthday}
Heure de naissance : ${birthtime} (heure locale)
Genre : ${gender}
Ville : ${location}
Section à analyser : ${topicLabel}
Date d'aujourd'hui : ${curMonthNameFR} ${curYear}
Fenêtre de prévision : ${curMonthNameFR} ${curYear} → ${curMonthNameFR} ${windowEndYear}`

    : `Birth date: ${birthday}
Birth time: ${birthtime} (local time)
Gender: ${gender}
City: ${location}
Section to analyse: ${topicLabel}
Today's date: ${curMonthNameEN} ${curYear}
Forecast window: ${curMonthNameEN} ${curYear} → ${curMonthNameEN} ${windowEndYear}`;

  // ── API call ───────────────────────────────────────────────────────────────
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.SITE_URL || 'https://mingli-lovat.vercel.app',
        'X-Title': 'Ming Li Full Report'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        max_tokens: 900,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ]
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    res.status(200).json({ content });

  } catch (err) {
    console.error('reading-full error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
