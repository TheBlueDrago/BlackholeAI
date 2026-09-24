// The hidden "website" field on public forms (src/components/Honeypot.jsx). People never see
// it; bots fill it. Such a submission is answered as if it worked, but nothing is saved.
export const filledByBot = (body) => !!(body && typeof body.website === "string" && body.website.trim());
