module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { birthday, birthtime, gender, location, topic, lang, plan } = req.body || {};

  const topicMap = {
    personality: { en: 'personality, core nature, innate strengths and shadow traits', fr: 'personnalité, nature profonde, forces innées et zones d\'ombre' },
    career:      { en: 'career path, life purpose, professional peak years and ideal directions', fr: 'trajectoire professionnelle, vocation, années de pointe et directions idéales' },
    wealth:      { en: 'wealth destiny, financial cycles, money patterns and peak earning periods', fr: 'destin financier, cycles de richesse, schémas monétaires et périodes de prospérité' },
    love:        { en: 'love and relationships, marriage timing, partner compatibility and emotional patterns', fr: 'amour et relations, timing du mariage, compatibilité et schémas émotionnels' },
    health:      { en: 'health tendencies, body constitution, vulnerable systems and longevity cycles', fr: 'tendances de santé, constitution corporelle, systèmes vulnérables et cycles de longévité' },
    yearly:      { en: 'the year ahead in 2025-2026: key turning points, monthly highlights and timing advice', fr: 'l\'année à venir 2025-2026 : tournants clés, points forts mensuels et conseils de timing' }
  };

  const topicLabel = (topicMap[topic] || topicMap.personality)[lang] || topicMap[topic].en;

  const depthNote = plan === 'yearly'
    ? (lang === 'fr' ? 'Rapport VIP annuel — analyse la plus approfondie, 400-500 mots.' : 'Annual VIP report — deepest analysis, 400-500 words.')
    : plan === 'monthly'
    ? (lang === 'fr' ? 'Rapport mensuel — analyse approfondie, 300-400 mots.' : 'Monthly report — in-depth analysis, 300-400 words.')
    : (lang === 'fr' ? 'Rapport unique — analyse complète, 250-350 mots.' : 'Single report — complete analysis, 250-350 words.');

  const systemPrompt = lang === 'fr'
    ? `Tu es Ming Li, maître en astrologie chinoise classique (BaZi Quatre Piliers + Zi Wei Dou Shu), formé aux quatre grandes écoles : Xu Leiwu, Liang Xiangren, Yuan Shushan et Wei Qianli.

Tu rédiges la section "${topicLabel}" d'un rapport complet payant.

Règles strictes :
${depthNote}
- Analyse concrète et personnalisée — JAMAIS générique
- Mentionne des éléments astrologique précis (Maître du Jour, structure de format, grande chance en cours, etc.)
- Donne des conseils pratiques applicables
- Cite des périodes ou années spécifiques quand c'est pertinent (ex: 2026, 2027)
- Entoure les termes clés importants avec <span class="highlight">...</span>
- Écris en paragraphes fluides, sépare chaque paragraphe par une ligne vide
- Ton : chaleureux, professionnel, jamais alarmiste
- Réponds uniquement en français
- Aucun titre, sous-titre, liste à puces, ni markdown`
    : `You are Ming Li, a master of classical Chinese astrology (BaZi Four Pillars + Zi Wei Dou Shu), trained in four great schools: Xu Leiwu, Liang Xiangren, Yuan Shushan, and Wei Qianli.

You are writing the "${topicLabel}" section of a paid full destiny report.

Strict rules:
${depthNote}
- Concrete and personalised analysis — NEVER generic
- Reference specific astrological elements (Day Master, chart structure, current 10-year cycle, etc.)
- Give practical, actionable guidance
- Cite specific periods or years when relevant (e.g. 2026, 2027)
- Wrap key terms in <span class="highlight">...</span>
- Write in flowing paragraphs, separate each with a blank line
- Tone: warm, professional, never alarmist
- Reply in English only
- No titles, subheadings, bullet points, or markdown`;

  const userPrompt = `Birth date: ${birthday}
Birth time: ${birthtime} (local time)
Gender: ${gender}
City: ${location}
Section to analyse: ${topicLabel}`;

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
        max_tokens: 800,
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
