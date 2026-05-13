module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { birthday, birthtime, gender, location, topic, lang } = req.body || {};

  // ── Current date ───────────────────────────────────────────────────────────
  const now      = new Date();
  const curYear  = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const nextYear = curYear + 1;

  const MONTH_NAMES_EN = ['January','February','March','April','May','June',
                           'July','August','September','October','November','December'];
  const MONTH_NAMES_FR = ['janvier','février','mars','avril','mai','juin',
                           'juillet','août','septembre','octobre','novembre','décembre'];
  const curMonthNameEN = MONTH_NAMES_EN[curMonth - 1];
  const curMonthNameFR = MONTH_NAMES_FR[curMonth - 1];

  // ── Topic labels ───────────────────────────────────────────────────────────
  const topicMap = {
    personality: { en: 'personality & innate talents',  fr: 'personnalité et talents innés' },
    career:      { en: 'career & life purpose',         fr: 'carrière et vocation' },
    wealth:      { en: 'wealth & financial destiny',    fr: 'richesse et destin financier' },
    love:        { en: 'love & relationships',          fr: 'amour et relations' },
    health:      { en: 'health & vitality',             fr: 'santé et vitalité' },
    yearly:      { en: `the next 12 months ahead (${curMonthNameEN} ${curYear} onwards)`,
                   fr: `les 12 prochains mois (à partir de ${curMonthNameFR} ${curYear})` }
  };

  const topicLabel = (topicMap[topic] || topicMap.personality)[lang] || topicMap[topic].en;

  // ── System prompts ─────────────────────────────────────────────────────────
  const systemPrompt = lang === 'fr'
    ? `Tu es Ming Li, expert en astrologie chinoise classique (BaZi et Zi Wei Dou Shu).
Génère UN aperçu gratuit de 80 à 110 mots sur le thème "${topicLabel}" pour cet utilisateur.

Règles strictes :
- La date d'aujourd'hui est ${curMonthNameFR} ${curYear}. Toutes les prévisions doivent être dans le FUTUR à partir d'aujourd'hui.
- Ne jamais mentionner 2025 ou tout mois déjà passé comme période future.
- La fenêtre de prévision est ${curMonthNameFR} ${curYear} → ${curMonthNameFR} ${nextYear}.
- Chaleureux, mystérieux, empathique — jamais générique
- Mentionne naturellement UN élément astrologique précis
- Cite ${curYear} ou ${nextYear} comme année clé si pertinent
- Entoure les termes clés avec <span class="highlight">...</span>
- Termine par une phrase qui donne envie d'en savoir plus
- Réponds uniquement en français
- Aucun titre, préambule, ni markdown`

    : `You are Ming Li, an expert in classical Chinese astrology (BaZi and Zi Wei Dou Shu).
Generate ONE free preview of 80-110 words on the topic "${topicLabel}" for this user.

Strict rules:
- Today is ${curMonthNameEN} ${curYear}. All predictions must be in the FUTURE from today.
- Never mention 2025 or any already-passed month as a future period.
- Forecast window: ${curMonthNameEN} ${curYear} → ${curMonthNameEN} ${nextYear}.
- Warm, mysterious, empathetic — never generic
- Naturally mention ONE specific astrological element
- Reference ${curYear} or ${nextYear} as key year where relevant
- Wrap key terms in <span class="highlight">...</span>
- End with a sentence that makes them want to know more
- Reply in English only
- No titles, preamble, or markdown`;

  // ── User prompt ────────────────────────────────────────────────────────────
  const userPrompt = lang === 'fr'
    ? `Date de naissance : ${birthday}
Heure de naissance : ${birthtime} (heure locale)
Genre : ${gender}
Ville : ${location}
Thème : ${topicLabel}
Date d'aujourd'hui : ${curMonthNameFR} ${curYear}`

    : `Birth date: ${birthday}
Birth time: ${birthtime} (local time)
Gender: ${gender}
City: ${location}
Topic: ${topicLabel}
Today's date: ${curMonthNameEN} ${curYear}`;

  // ── API call ───────────────────────────────────────────────────────────────
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.SITE_URL || 'https://mingli-lovat.vercel.app',
        'X-Title': 'Ming Li Destiny Reading'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ]
      })
    });

    const data = await response.json();
    const preview = data.choices?.[0]?.message?.content || '';
    res.status(200).json({ preview });

  } catch (err) {
    console.error('OpenRouter error:', err.message);
    res.status(500).json({ error: 'Reading failed' });
  }
};
