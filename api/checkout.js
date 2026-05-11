const Stripe = require('stripe');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!STRIPE_SECRET_KEY) {
    return res.status(200).json({ url: null, error: 'Stripe not configured yet' });
  }

  const { plan, lang } = req.body;

  const PRICE_MAP = {
    en: {
      single:  process.env.PRICE_SINGLE_USD,
      monthly: process.env.PRICE_MONTHLY_USD,
      yearly:  process.env.PRICE_YEARLY_USD,
    },
    fr: {
      single:  process.env.PRICE_SINGLE_EUR,
      monthly: process.env.PRICE_MONTHLY_EUR,
      yearly:  process.env.PRICE_YEARLY_EUR,
    }
  };

  const langKey = lang === 'fr' ? 'fr' : 'en';
  const priceId = PRICE_MAP[langKey][plan];

  if (!priceId) {
    return res.status(200).json({ url: null, error: 'Price not configured' });
  }

  try {
    const stripe = Stripe(STRIPE_SECRET_KEY);
    const mode = plan === 'single' ? 'payment' : 'subscription';
    const siteUrl = process.env.SITE_URL || 'https://mingli-lovat.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/`,
      locale: langKey === 'fr' ? 'fr' : 'en',
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
