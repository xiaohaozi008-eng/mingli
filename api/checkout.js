module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
 
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
 
  // Stripe not yet configured — return graceful message
  if (!STRIPE_SECRET_KEY) {
    return res.status(200).json({ url: null, message: 'Stripe not configured yet' });
  }
 
  var plan = (req.body || {}).plan || '';
  var lang = (req.body || {}).lang || 'en';
 
  var PRICE_MAP = {
    en: {
      single:  process.env.PRICE_SINGLE_USD  || '',
      monthly: process.env.PRICE_MONTHLY_USD || '',
      yearly:  process.env.PRICE_YEARLY_USD  || ''
    },
    fr: {
      single:  process.env.PRICE_SINGLE_EUR  || '',
      monthly: process.env.PRICE_MONTHLY_EUR || '',
      yearly:  process.env.PRICE_YEARLY_EUR  || ''
    }
  };
 
  var langKey = lang === 'fr' ? 'fr' : 'en';
  var priceId = (PRICE_MAP[langKey] || {})[plan] || '';
 
  if (!priceId) {
    return res.status(200).json({ url: null, message: 'Price ID not configured for this plan' });
  }
 
  try {
    var stripe = require('stripe')(STRIPE_SECRET_KEY);
    var mode   = plan === 'single' ? 'payment' : 'subscription';
    var siteUrl = process.env.SITE_URL || 'https://mingli-lovat.vercel.app';
 
    var session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: siteUrl + '/success.html',
      cancel_url:  siteUrl + '/',
      locale: langKey === 'fr' ? 'fr' : 'en'
    });
 
    return res.status(200).json({ url: session.url });
 
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
