import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 根据语言选择对应货币的 Price ID
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan, lang } = req.body;
  const langKey = lang === 'fr' ? 'fr' : 'en';
  const priceId = PRICE_MAP[langKey][plan];

  if (!priceId) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  // Single report = one-time payment; Monthly/Yearly = subscription
  const mode = plan === 'single' ? 'payment' : 'subscription';
  const siteUrl = process.env.SITE_URL || 'https://mingli-nine.vercel.app';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/`,
      // 自动检测用户语言显示 Stripe 结账页面
      locale: langKey === 'fr' ? 'fr' : 'en',
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}
