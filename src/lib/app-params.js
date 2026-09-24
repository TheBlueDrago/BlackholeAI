const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

// Which Base44 app and server the site talks to is fixed at build time (Cloudflare env).
// Links used to be able to change it (?app_id=… or ?app_base_url=… was read from the address
// and remembered), which could send a visitor's login to another server later. When a build
// setting is missing it now falls back to this app's own id, or to nothing (same-origin
// addresses through the /api proxy), never to a value from a link or one saved from a link.
const APP_ID = "6a8b5eb7787b8a4d6a18f662";
const FALLBACK = { app_id: APP_ID };
const builtIn = (paramName, value) => {
	if (!isNode) storage.removeItem(`base44_${paramName}`); // forget anything saved from an old link
	return value || FALLBACK[paramName] || null;
};

const getAppParams = () => {
	// Only acts on the page load it's in: remembering it logged the browser out on every visit.
	if (!isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}
	return {
		appId: builtIn("app_id", import.meta.env.VITE_BASE44_APP_ID),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
		functionsVersion: builtIn("functions_version", import.meta.env.VITE_BASE44_FUNCTIONS_VERSION),
		appBaseUrl: builtIn("app_base_url", import.meta.env.VITE_BASE44_APP_BASE_URL),
	}
}


export const appParams = {
	...getAppParams()
}
