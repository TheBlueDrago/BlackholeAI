// Checkout runs on Base44 Payments. When Base44's monthly integration allowance is used
// up, its functions answer 402 — show that as "temporarily unavailable" rather than
// "Request failed with status code 402".
export function paymentError(e, fallback = "Could not start checkout.") {
  const status = e?.response?.status;
  const data = e?.response?.data;
  if (status === 402 || data?.extra_data?.reason === "integration_credits_limit_reached") {
    return "Payments are temporarily unavailable. Please try again later — you haven't been charged.";
  }
  return data?.error || e?.message || fallback;
}
