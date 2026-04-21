/*
=========================================================
ANH VALIDATION ENGINE
Alpha Runtime Validator + Trust Badge Injector
Version: Alpha-1.3
System: Akshat Network Hub ValidationSystem
=========================================================
*/

(function () {

"use strict";

/*
=========================================================
CONFIG
=========================================================
*/

const VAULT_PATH =
window.location.origin +
"/ValidationSystem/vault/alpha-vault.json";

const AUTO_HIDE_TIME = 6000;

const BADGE_STYLES = {

trusted: "#16c784",
caution: "#f5a623",
unverified: "#ff4d4f"

};


/*
=========================================================
HELPERS
=========================================================
*/

function normalizeURL(url) {

try {

let u = new URL(url);

return u.origin + u.pathname.replace(/\/$/, "");

} catch {

return url;

}

}


function strictMatch(metaA, metaB) {

return (

normalizeURL(metaA.url) === normalizeURL(metaB.url)
&& metaA.title === metaB.title
&& metaA.description === metaB.description
&& metaA.icon === metaB.icon

);

}


/*
=========================================================
BADGE UI ENGINE
=========================================================
*/

function injectBadge(status, tier, message) {

if (document.getElementById("anh-trust-badge")) return;

let badgeWrapper = document.createElement("div");

badgeWrapper.id = "anh-trust-badge";

badgeWrapper.style = `
position:fixed;
bottom:20px;
right:20px;
z-index:99999;
font-family:system-ui;
`;

badgeWrapper.innerHTML = `

<div style="
background:${BADGE_STYLES[status]};
color:white;
padding:14px 20px;
border-radius:14px;
box-shadow:0 6px 18px rgba(0,0,0,.25);
font-size:14px;
line-height:1.5;
max-width:260px;
animation:fadeSlide .35s ease;
">

<div style="
display:flex;
justify-content:space-between;
align-items:center;
">

<b>ANH Trust Status</b>

<button id="anh-close-btn"
style="
background:transparent;
border:none;
color:white;
font-size:16px;
cursor:pointer;
">
✕
</button>

</div>

<div style="margin-top:6px">

${message}<br>
Tier: ${tier}

</div>

</div>

<style>

@keyframes fadeSlide {

from {

opacity:0;
transform:translateY(20px);

}

to {

opacity:1;
transform:translateY(0);

}

}

</style>

`;

document.body.appendChild(badgeWrapper);


/* CLOSE BUTTON */

document
.getElementById("anh-close-btn")
.onclick = () => badgeWrapper.remove();


/* AUTO DISMISS */

setTimeout(() => {

if (badgeWrapper)
badgeWrapper.remove();

}, AUTO_HIDE_TIME);

}


/*
=========================================================
VALIDATION ENGINE
=========================================================
*/

async function validatePage() {

if (!window.ANH_ID || !window.ANH_META) {

injectBadge(
"unverified",
"UNKNOWN",
"Scripto identity missing"
);

return;

}


try {

let response = await fetch(VAULT_PATH);

if (!response.ok)
throw "Vault load failed";


let vault = await response.json();


if (!vault.entries) {

injectBadge(
"unverified",
"UNKNOWN",
"Vault format invalid"
);

return;

}


let entry = vault.entries.find(
e => e.urlId === window.ANH_ID
);


if (!entry) {

injectBadge(
"caution",
"TIER-3",
"urlId not found in vault"
);

return;

}


/*
=========================================================
STRICT META MATCH CHECK
=========================================================
*/

let match = strictMatch(window.ANH_META, entry);

if (!match) {

injectBadge(
"caution",
entry.tier,
"Meta mismatch detected"
);

return;

}


/*
=========================================================
TIER ROUTING ENGINE
=========================================================
*/

switch (entry.tier) {

case "TIER-1":

injectBadge(
"trusted",
"TIER-1",
"Verified via Alpha Vault"
);

break;


case "TIER-2":

injectBadge(
"trusted",
"TIER-2",
"Script signature validated"
);

break;


case "TIER-3":

injectBadge(
"caution",
"TIER-3",
"Decision loop verification applied"
);

break;


default:

injectBadge(
"unverified",
"UNKNOWN",
"Tier classification invalid"
);

}

}


catch (error) {

injectBadge(
"unverified",
"UNKNOWN",
"Vault unreachable"
);

console.warn(
"ANH Validator Error:",
error
);

}

}


/*
=========================================================
BOOT ENGINE
=========================================================
*/

window.addEventListener(
"DOMContentLoaded",
validatePage
);

})();