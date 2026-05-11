module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question, context, userData, lang, plan } = req.body || {};

  const systemPrompt = lang === 'fr'
    ? `Tu es Ming Li, expert en astrologie chinoise classique (BaZi et Zi Wei Dou Shu).
L'utilisateur vient de recevoir son rapport complet. Tu réponds à ses questions en te basant sur son rapport.

Rapport de l'utilisateur :
${context}

Informations de naissance : ${userData?.birthday}, ${userData?.birthtime}, ${userData?.gender}, ${userData?.location}

Règles :
- Réponds de manière chaleureuse, précise et personnalisée
- Fais référence à des éléments spécifiques de son rapport
- Réponse de 100-200 mots maximum
- Entoure les termes clés avec <span class="highlight">...</span>
- Réponds uniquement en français
- Aucun titre ni markdown`
    : `You are Ming Li, an expert in classical Chinese astrology (BaZi and Zi Wei Dou Shu).
The user has just received their full destiny report. Answer their questions based on their report.

User's report:
${context}

Birth info: ${userData?.birthday}, ${userData?.birthtime}, ${userData?.gender}, ${userData?.location}

Rules:
- Warm, precise, personalised response
- Reference specific elements from their report
- 100-200 words maximum
- Wrap key terms in <span class="highlight">...</span>
- Reply in English only
- No titles or markdown`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.SITE_URL || 'https://mingli-lovat.vercel.app',
        'X-Title': 'Ming Li Chat'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: question }
        ]
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '';
    res.status(200).json({ answer });

  } catch (err) {
    console.error('chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
