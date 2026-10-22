# Becca – Zen Bookkeeping & Advisory chat

Files loaded by the Zen Bookkeeping & Advisory website (Webflow).

- `becca.js` – Becca's chat window and answer engine.
- `becca-kb.json` – her answers, taken from the website's own content and the 2026/27 tax facts.

The website loads `becca.js` from jsDelivr, and `becca.js` then fetches `becca-kb.json` from the same place.
Replies are automated and give general information, not advice.

To update the answers, replace `becca-kb.json`. jsDelivr can take up to 12 hours to show changes unless the cache is purged.
