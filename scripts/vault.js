/*
=========================================================
ValidationSystem — Alpha-1.1 Vault Logic Engine
File: scripts/vault.js
Author: Akshat Network Hub Ecosystem

Purpose:
Primary identity registry interface for ANH validation layer.
Handles:

• Vault loading
• Entry lookup
• Metadata verification
• Domain normalization
• Tier routing support
• Duplicate detection
• Runtime decision helpers

Compatible with:
vault/alpha-vault.json schema (Alpha-1.1)
=========================================================
*/

(function () {

"use strict";

/*
=========================================================
UTILITY FUNCTIONS
=========================================================
*/

function normalizeURL(url) {

try {

let parsed = new URL(url);

return parsed.hostname.replace(/^www\./, "");

} catch {

return null;

}

}

function normalizePath(url) {

try {

let parsed = new URL(url);

return parsed.pathname.replace(/\/$/, "");

} catch {

return null;

}

}

/*
=========================================================
ALPHA VAULT CLASS
=========================================================
*/

class AlphaVaultEngine {

constructor() {

this.vault = null;

this.entries = [];

this.rules = {};

this.routingHints = {};

this.ready = false;

}

/*
=========================================================
LOAD VAULT DATABASE
=========================================================
*/

async loadVault(vaultPath = "/vault/alpha-vault.json") {

try {

let response = await fetch(vaultPath, {

cache: "no-store"

});

if (!response.ok) {

throw new Error("Vault file missing");

}

this.vault = await response.json();

this.entries = this.vault.entries || [];

this.rules = this.vault.rules || {};

this.routingHints = this.vault.routingAgentHints || {};

this.ready = true;

console.log("Alpha Vault Loaded");

} catch (err) {

console.warn("Vault loading failed:", err.message);

this.ready = false;

}

}

/*
=========================================================
CHECK IF VAULT READY
=========================================================
*/

isReady() {

return this.ready;

}

/*
=========================================================
ENTRY LOOKUP BY ID
=========================================================
*/

getEntryById(urlId) {

if (!this.ready) return null;

return this.entries.find(entry => entry.urlId === urlId);

}

/*
=========================================================
ENTRY LOOKUP BY DOMAIN
=========================================================
*/

getEntryByDomain(domain) {

if (!this.ready) return null;

domain = normalizeURL(domain);

return this.entries.find(entry => {

let entryDomain = normalizeURL(entry.url);

return entryDomain === domain;

});

}

/*
=========================================================
VERIFY REQUIRED FIELDS
=========================================================
*/

verifyRequiredFields(meta) {

if (!meta) return false;

let required = this.rules.requiredFields || [];

return required.every(field => meta[field] !== undefined);

}

/*
=========================================================
STRICT METADATA MATCH ENGINE
=========================================================
*/

verifyMetadata(meta) {

if (!this.ready) return false;

if (!meta || !meta.urlId) return false;

let entry = this.getEntryById(meta.urlId);

if (!entry) return false;

if (!this.verifyRequiredFields(meta)) {

console.warn("Metadata missing required fields");

return false;

}

if (this.rules.matchingPolicy === "STRICT_META_MATCH") {

return (

normalizeURL(entry.url) === normalizeURL(meta.url) &&

entry.title === meta.title &&

entry.description === meta.description &&

entry.icon === meta.icon

);

}

return false;

}

/*
=========================================================
CHECK ENTRY STATUS ACTIVE
=========================================================
*/

isActive(urlId) {

let entry = this.getEntryById(urlId);

if (!entry) return false;

return entry.status === "active";

}

/*
=========================================================
CHECK DUPLICATE URL ID
=========================================================
*/

detectDuplicate(urlId) {

let matches = this.entries.filter(entry => entry.urlId === urlId);

return matches.length > 1;

}

/*
=========================================================
DOMAIN TRUST MATCH ENGINE
=========================================================
*/

domainTrusted(currentURL) {

if (!this.ready) return false;

let normalized = normalizeURL(currentURL);

return this.entries.some(entry => {

let entryDomain = normalizeURL(entry.url);

if (this.routingHints.allowSubdomainTrust) {

return normalized.endsWith(entryDomain);

}

return normalized === entryDomain;

});

}

/*
=========================================================
ICON PATH NORMALIZATION SUPPORT
=========================================================
*/

normalizeIconPath(iconPath) {

if (!iconPath) return null;

if (this.routingHints.allowRelativeIconPaths) {

return iconPath;

}

try {

return new URL(iconPath).href;

} catch {

return null;

}

}

/*
=========================================================
CHECKSUM PLACEHOLDER (FUTURE SECURITY)
=========================================================
*/

verifyChecksum(entry) {

/*
Reserved for future hash verification engine
Example upgrade:

SHA256(meta) === checksum
*/

return true;

}

/*
=========================================================
GET TIER ROUTING STRATEGY
=========================================================
*/

getTierRouting(tier) {

if (!this.rules.tierRouting) return null;

return this.rules.tierRouting[tier];

}

/*
=========================================================
GLOBAL TRUST CHECK (FAST PATH)
=========================================================
*/

quickTrustCheck(meta) {

if (!this.verifyMetadata(meta)) return false;

if (!this.isActive(meta.urlId)) return false;

if (this.detectDuplicate(meta.urlId)) {

console.warn("Duplicate URL ID detected");

return false;

}

return true;

}

}

/*
=========================================================
INITIALIZE GLOBAL VAULT ENGINE
=========================================================
*/

window.AlphaVault = new AlphaVaultEngine();

/*
=========================================================
AUTO LOAD VAULT ON PAGE READY
=========================================================
*/

document.addEventListener("DOMContentLoaded", async () => {

await window.AlphaVault.loadVault();

if (window.AlphaVault.isReady()) {

console.log("AlphaVault ready for Tier-1 validation");

} else {

console.warn("Vault not ready — fallback mode enabled");

}

});

})();