// Serves /pricing with its own link preview (see cloudflare-lib/pagemeta.js).
import { servePage, PAGES } from "../cloudflare-lib/pagemeta.js";

export const onRequestGet = servePage(PAGES.pricing);
