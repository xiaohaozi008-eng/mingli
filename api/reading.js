module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { birthday, birthtime, gender, location, topic, lang } = req.body;

  const topicMap = {
    personality: { en: 'personality & innate talents',  fr: 'personnalité et talents innés' },
    career:      { en: 'career & life purpose',         fr: 'carrière et vocation' },
    wealth:      { en: 'wealth & financial destiny',    fr: 'richesse et destin financier' },
    love:        { en: 'love & relationships',          fr: 'amour et relations' },
    health:      { en: 'health & vitality',             fr: 'santé et vitalité' },
    yearly:      { en: 'the year ahead',                fr: "l'année à venir" }
  };

  const topicLabel = (topicMap[topic] || topicMap.personality)[lang] || topicMap[topic].en;

  const systemPrompt = lang === 'fr'
    ? `Tu es Ming Li, expert en astrologie chinoise classique (BaZi et Zi Wei Dou Shu).
Génère UN aperçu gratuit de 80 à 110 mots sur le thème "${topicLabel}" pour cet utilisateur.
Règles strictes :
- Chaleureux, mystérieux, empathique — jamais générique
- Mentionne naturellement UN élément astrologique précis (ex: "votre Maître du Jour en Eau", "une structure Food God dominante")
- Cite 2026 comme année charnière si pertinent
- Entoure les termes clés avec <span class="highlight">...</span>
- Termine par une phrase qui donne envie d'en savoir plus
- Réponds uniquement en français
- Aucun titre, préambule, ni markdown`
    : `You are Ming Li, an expert in classical Chinese astrology (BaZi and Zi Wei Dou Shu).
Generate ONE free preview of 80–110 words on the topic "${topicLabel}" for this user.
Strict rules:
- Warm, mysterious, empathetic — never generic
- Naturally mention ONE specific astrological element (e.g. "your Water Day Master", "a dominant Food God structure")
- Reference 2026 as a turning-point year where relevant
- Wrap key terms in <span class="highlight">...</span>
- End with a sentence that makes them want to know more
- Reply in English only
- No titles, preamble, or markdown`;

  const userPrompt = `Birth date: ${birthday}
Birth time: ${birthtime} (local time)
Gender: ${gender}
City: ${location}
Topic: ${topicLabel}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.SITE_URL || 'https://mingli-nine.vercel.app',
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
    console.error('OpenRouter error:', err);
    res.status(500).json({ error: 'Reading failed', detail: err.message });
  }
}
