// Checkout for products sold on a user-published Blackhole website.
// Money is charged through Base44 Payments (Wix) into the platform account; every sale records the
// platform cut and what the site creator is owed, so payouts can be settled from SiteSale.
// The platform keeps PLATFORM_FEE_RATE of the price plus ALL tax collected at checkout; tax is
// only known once the order is paid, so payments-webhook adds it to platformFee then.
// PUBLIC on purpose: storefront buyers usually have no Blackhole account. Never 401 here.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const CONSTRUCT_URL = 'https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct';
const PLATFORM_FEE_RATE = 0.05; // 5% of the price kept by the platform (tax is kept on top).

export default async function (req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const WIX_API_KEY = Deno.env.get('WIX_CHECKOUT_API_KEY');
    const WIX_SITE_ID = Deno.env.get('WIX_CHECKOUT_SITE_ID');
    if (!WIX_API_KEY || !WIX_SITE_ID) {
      console.error('site-checkout: Wix payment config not set');
      return Response.json({ error: 'Payments not configured' }, { status: 500 });
    }
    const appUrl = req.headers.get('x-base44-app-url') || Deno.env.get('WIX_CHECKOUT_APP_URL') || '';
    if (!appUrl) {
      console.error('site-checkout: no app URL available');
      return Response.json({ error: 'Payments not configured' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    let buyer = null;
    try {
      buyer = await base44.auth.me();
    } catch (_) {
      buyer = null;
    }

    const body = await req.json().catch(() => ({}));
    const siteName = String(body.siteName || '').toLowerCase();
    const productId = String(body.productId || '').toLowerCase();
    const quantity = Number(body.quantity ?? 1);
    if (!siteName || !productId) {
      return Response.json({ error: 'siteName and productId required' }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return Response.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Price comes from the creator's stored product — never from the buyer's request.
    const rows = await base44.asServiceRole.entities.SiteProduct.filter({ siteName, productId });
    const product = rows && rows[0];
    if (!product) {
      return Response.json({ error: 'Unknown product' }, { status: 400 });
    }
    const currency = product.currency || 'USD';
    const total = parseFloat(String(product.price)) * quantity;
    if (!(total >= 0.5)) {
      return Response.json({ error: 'Amount must be at least 0.50' }, { status: 400 });
    }

    const wixRes = await fetch(CONSTRUCT_URL, {
      method: 'POST',
      headers: {
        'Authorization': WIX_API_KEY,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cart: {
          items: [{ name: `${product.name || productId} — ${siteName}.blackhole`, quantity, price: String(product.price) }],
          ...(buyer?.email ? { customerInfo: { email: buyer.email } } : {}),
        },
        callbackUrls: {
          thankYouPageUrl: `${appUrl}/ThankYou`,
          postFlowUrl: `${appUrl}/site/${siteName}`,
        },
      }),
    });

    if (!wixRes.ok) {
      const errText = await wixRes.text();
      console.error('site-checkout: Wix construct failed', { status: wixRes.status, errText });
      return Response.json({ error: 'Could not start checkout' }, { status: 502 });
    }

    const { checkoutSession } = await wixRes.json();
    const checkoutSessionId = checkoutSession?.id;
    const redirectUrl = checkoutSession?.redirectUrl;
    if (!checkoutSessionId || !redirectUrl) {
      console.error('site-checkout: missing checkoutSession id/redirectUrl', checkoutSession);
      return Response.json({ error: 'Could not start checkout' }, { status: 502 });
    }

    const platformFee = total * PLATFORM_FEE_RATE;
    await base44.asServiceRole.entities.SiteSale.create({
      checkoutSessionId,
      status: 'pending',
      siteName,
      creatorId: product.created_by_id || '',
      creatorEmail: product.creatorEmail || '',
      productId,
      productName: product.name || productId,
      quantity,
      currency,
      gross: total.toFixed(2),
      platformFee: platformFee.toFixed(2),
      creatorPayout: (total - platformFee).toFixed(2),
      buyerEmail: buyer?.email || '',
    });

    return Response.json({ redirectUrl });
  } catch (error) {
    console.error('site-checkout: unhandled error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}