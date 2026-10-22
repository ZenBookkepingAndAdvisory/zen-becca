/* Becca: Zen team member, client support chat (instant replies are automated).
   Answers common questions from the site's own content (FAQs, services, pricing, deadlines, areas),
   offers next steps, and hands over to the team with an enquiry when she can't help.
   Optional: set window.ZEN_CONFIG.beccaAI to a server endpoint to let a live AI model answer
   questions Becca can't match (the endpoint must keep any API key on the server). */
(function () {
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');
  const boot = (DATA) => {
  if (document.querySelector('.bc-launch')) return;
  const ARROW = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const icon = () => ARROW;
  const Z = { sendEnquiry: (d) => (window.ZenSend ? window.ZenSend(d) : Promise.resolve(false)) };
  const CFG = Object.assign({ beccaPhoto: 'https://s3.amazonaws.com/webflow-prod-assets/686f941b8da58389d3edd9a6/6ad9f20b65b098cbeea627a9_p-becca.webp' }, window.ZEN_CONFIG || {});
  const PRICE = { 'Zen Essentials': 120, 'Zen Growth': 250, 'Zen Performance': 400, 'Zen Complete': 575, 'Zen Pinnacle': 800 };
  const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const firstSentences = (t, n = 2) => (t.match(/[^.!?]+[.!?]+/g) || [t]).slice(0, n).join(' ').trim();

  /* ---------- language helpers ---------- */
  const STOP = new Set('a an the and or but if of to in on at for with by from is are was were be been being do does did can could should would will shall may might must i me my we our you your it its this that these those there here what which who whom how when where why am have has had not no yes so as about into than then too very just also any some all more most such only own same other get got need needs want wants please hi hello hey thanks thank zen us'.split(' '));
  const SYN = { cost: 'price', costs: 'price', fee: 'price', fees: 'price', charge: 'price', charges: 'price', pricing: 'price', prices: 'price', expensive: 'price', cheap: 'price', much: 'price', quote: 'price', mtd: 'digital', itsa: 'digital', accountant: 'accountancy', accountants: 'accountancy', accounting: 'accountancy', bookkeeper: 'bookkeeping', books: 'bookkeeping', limited: 'ltd', company: 'ltd', companies: 'ltd', director: 'ltd', directors: 'ltd', selfemployed: 'soletrader', freelancer: 'soletrader', freelance: 'soletrader', wages: 'payroll', salary: 'payroll', staff: 'payroll', employees: 'payroll', employee: 'payroll', deadline: 'deadline', deadlines: 'deadline', due: 'deadline', date: 'deadline', dates: 'deadline', when: 'deadline', switch: 'switching', change: 'switching', move: 'switching', moving: 'switching', landlord: 'property', landlords: 'property', rental: 'property', rent: 'property', meet: 'meeting', meeting: 'meeting', office: 'meeting', visit: 'meeting', located: 'location', based: 'location', where: 'location', area: 'location', areas: 'location', plymouth: 'location', cornwall: 'location', devon: 'location', exeter: 'location', login: 'portal', log: 'portal', upload: 'portal', documents: 'portal', xero: 'software', quickbooks: 'software', freeagent: 'software', cloud: 'software', app: 'software', apps: 'software', phone: 'contact', call: 'contact', email: 'contact', ring: 'contact', speak: 'contact', talk: 'contact', human: 'contact', person: 'contact', complaint: 'complain', complaints: 'complain', keep: 'retention', kept: 'retention', retain: 'retention', retention: 'retention', cookie: 'cookie', cookies: 'cookie', unhappy: 'complain', privacy: 'data', gdpr: 'data', id: 'aml', identity: 'aml', laundering: 'aml', passport: 'aml', return: 'return', returns: 'return', sa: 'assessment', tax: 'tax', taxes: 'tax' };
  const norm = (w) => { w = w.toLowerCase().replace(/[’']/g, ''); if (SYN[w]) return SYN[w]; let s = w; if (s.length > 5 && s.endsWith('ing')) s = s.slice(0, -3); else if (s.length > 4 && s.endsWith('ies')) s = s.slice(0, -3) + 'y'; else if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1); return SYN[s] || s; };
  const toks = (t) => { const raw = strip(t).toLowerCase().replace(/self[\s-]*employed/g, 'selfemployed').replace(/sole[\s-]*trader/g, 'soletrader').replace(/self[\s-]*assessment/g, 'assessment').replace(/making tax digital/g, 'digital').replace(/year[\s-]*end/g, 'yearend').match(/[a-z0-9£]+/g) || []; return raw.map(norm).filter((w) => w.length > 1 && !STOP.has(w)); };

  const KB = DATA.kb; KB.forEach((o) => { o.t = toks((o.k || '') + ' ' + (o.q || '') + ' ' + (o.k2 || '')); });

  // document frequency for weighting
  const DF = {}; KB.forEach((e) => new Set(e.t).forEach((w) => { DF[w] = (DF[w] || 0) + 1; }));
  const idf = (w) => Math.log(1 + KB.length / (1 + (DF[w] || 0)));
  const TAXQ = /\b(tax|taxed|allowance|rate|rates|threshold|wage|mileage|national insurance|ni|dividend|isa|pension|student loan|benefit)\b/i;
  const KEYS = { price: 'price', complain: 'complain', becca: 'becca', ann: 'ann', keep: 'retention', cookies: 'cookie' };
  /* ---------- spelling: fix typos before searching ---------- */
  const FIX = { recieve: 'receive', recieved: 'received', reciept: 'receipt', reciepts: 'receipts', seperate: 'separate', acount: 'account', acounts: 'accounts', accout: 'account', accouts: 'accounts', acountant: 'accountant', accoutant: 'accountant', acountants: 'accountants', buisness: 'business', busness: 'business', bussiness: 'business', busines: 'business', bookeeping: 'bookkeeping', bookkeping: 'bookkeeping', bookeping: 'bookkeeping', bokkeeping: 'bookkeeping', bookeeper: 'bookkeeper', payrole: 'payroll', payrol: 'payroll', assesment: 'assessment', assessmant: 'assessment', asessment: 'assessment', expences: 'expenses', expence: 'expense', morgage: 'mortgage', mortage: 'mortgage', mortguage: 'mortgage', compnay: 'company', comapny: 'company', limted: 'limited', limitied: 'limited', definately: 'definitely', tomorow: 'tomorrow', whats: 'what is', wat: 'what', wot: 'what', u: 'you', ur: 'your', r: 'are', pls: 'please', plz: 'please', thx: 'thanks', ty: 'thank you', vat: 'vat', hmrc: 'hmrc', paye: 'paye', cis: 'cis', mtd: 'mtd', p11d: 'p11d' };
  const EXTRA = 'hello thanks please help need want much many cost costs price business company companies work self employed freelance contractor contractors invoice invoices receipt receipts expense expenses mileage pension dividend dividends salary director directors partner partnership sole trader limited accountant accountants accounting bookkeeping bookkeeper payroll mortgage property landlord landlords rental income tax taxes return returns deadline deadlines penalty penalties refund rebate register registration registered start starting startup switch switching change changing software xero quickbooks freeagent cloud spreadsheet bank statement statements meeting appointment office phone email address location plymouth exeter devon cornwall truro newquay bodmin camborne redruth falmouth penzance prime minister president king queen government weather football rugby cricket sport sports game games joke jokes life news film films movie music song recipe recipes holiday holidays travel hotel restaurant dog cat pet health doctor school university love date dating';
  let VOC = null;
  const vocab = () => {
    if (VOC) return VOC;
    VOC = new Map();
    const addW = (t, n) => (strip(t).toLowerCase().replace(/[’']/g, '').match(/[a-z]+/g) || []).forEach((w) => { if (w.length > 1) VOC.set(w, (VOC.get(w) || 0) + n); });
    KB.forEach((e) => { addW((e.k || '') + ' ' + (e.q || '') + ' ' + (e.k2 || ''), 3); addW(e.a || '', 1); });
    addW(Object.keys(SYN).join(' '), 5); addW([...STOP].join(' '), 5); addW(EXTRA, 4);
    return VOC;
  };
  const dist = (a, b, max) => {
    const la = a.length, lb = b.length; if (Math.abs(la - lb) > max) return max + 1;
    let p2 = null, p = Array.from({ length: lb + 1 }, (_, j) => j);
    for (let i = 1; i <= la; i++) {
      const c = [i]; let low = i;
      for (let j = 1; j <= lb; j++) {
        let v = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (p2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
        c[j] = v; if (v < low) low = v;
      }
      if (low > max) return max + 1; p2 = p; p = c;
    }
    return p[lb];
  };
  const SPELLCACHE = {};
  const fixWord = (w) => {
    const lw = w.toLowerCase();
    if (FIX[lw]) return FIX[lw];
    if (lw.length < 4) return w;
    if (SPELLCACHE[lw] !== undefined) return SPELLCACHE[lw] || w;
    const V = vocab();
    const known = (x) => V.has(x);
    if (known(lw) || known(lw.replace(/ies$/, 'y')) || known(lw.replace(/(es|s|ed|ing|ly)$/, '')) || known(lw.replace(/(ing|ed)$/, 'e'))) { SPELLCACHE[lw] = ''; return w; }
    const max = lw.length <= 5 ? 1 : lw.length <= 8 ? 2 : 3;
    let best = '', bd = max + 1, bfirst = 1, bf = 0;
    V.forEach((f, cand) => {
      if (cand.length < 3 || Math.abs(cand.length - lw.length) > max) return;
      const d = dist(lw, cand, max); if (d > max) return;
      const first = cand[0] === lw[0] ? 0 : 1;
      if (d < bd || (d === bd && (first < bfirst || (first === bfirst && f > bf)))) { best = cand; bd = d; bfirst = first; bf = f; }
    });
    SPELLCACHE[lw] = best;
    return best || w;
  };
  const spell = (q) => String(q)
    .replace(/\bbook[\s-]+keep(ing|er|ers)?\b/gi, (m, x) => 'bookkeep' + (x || 'ing'))
    .replace(/\bpay[\s-]+roll\b/gi, 'payroll')
    .replace(/[A-Za-z0-9’']+/g, (w) => (/[’'0-9]/.test(w) ? w : fixWord(w)));
  const DOMAIN = new Set(toks('account accounts accountancy accountant accounting audit audits tax taxes taxed vat payroll paye bookkeeping bookkeeper books hmrc invoice invoices pension pensions profit profits loss losses company companies ltd limited business businesses self employed selfemployed assessment expense expenses receipt receipts mortgage dividend dividends salary wage wages insurance return returns deadline deadlines fee fees price prices cost costs quote quotes charge xero quickbooks freeagent software cloud cis p11d mtd digital budget budgets forecast forecasts cash flow bank loan loans grant grants invest investment property properties landlord landlords rent rental capital gains inheritance payment payments director directors sole trader soletrader partnership partners charity money finance finances financial record records contact zen becca ann team service services advice adviser advisor allowance allowances threshold rates rate refund rebate penalty penalties employee employees staff pay paid register registration utr ni national corporation income turnover vehicle mileage car van equipment asset assets depreciation statement statements reconciliation reconcile year end yearend accounts portal login documents upload id identity aml gdpr privacy cookie cookies complaint complain switch switching industry industries retail hospitality care startup startups influencer garage manufacturing professional sole formation secretarial structure enquiry enquiries investigation guide guides download newsletter'));
  const search = (q) => {
    const qt = [...new Set(toks(q))]; if (!qt.length) return [];
    return KB.map((e) => { const set = new Set(e.t); let s = 0; qt.forEach((w) => { if (set.has(w)) s += idf(w); }); const cover = qt.filter((w) => set.has(w)).length / qt.length; return { e, s: s * (0.6 + cover) * (e.boost || 1) / Math.sqrt(1 + set.size / 25) }; })
      .map((r) => { if (/\b(do you|can you|help|offer|provide|work with)\b/i.test(q) && /^(svc|grp|ind)-/.test(r.e.id)) r.s *= 1.5; if (KEYS[r.e.id] && qt.includes(KEYS[r.e.id]) && !(r.e.id === 'price' && TAXQ.test(q))) r.s *= 2; if (r.e.tax && TAXQ.test(q)) r.s *= 1.3; if (/^\s*what (is|are)\b/i.test(q) && /^svc-/.test(r.e.id)) r.s *= 1.4; if (/\b(i run|i own|i have an?|i.?m an?|i am an?|my (business|company) is)\b/i.test(q) && /^ind-/.test(r.e.id)) r.s *= 1.8; return r; })
      .filter((r) => r.s > 0).sort((a, b) => b.s - a.s);
  };

  /* ---------- UI ---------- */
  const css = `
.bc-launch .sr,.bc-panel .sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}
.bc-launch{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:900;display:flex;align-items:center;gap:10px;border:0;cursor:pointer;padding:0;background:none;font:inherit}
.bc-launch .bc-pill{background:#fff;color:#3b1f6e;font:600 14.5px var(--font-d,inherit);padding:10px 16px;border-radius:99px;box-shadow:0 12px 30px -16px rgba(80,30,150,.55);white-space:nowrap}
.bc-launch .bc-dot{position:relative;width:60px;height:60px;border-radius:50%;background:var(--g2,linear-gradient(135deg,#7b3fe4,#e27aa8));display:grid;place-items:center;color:#fff;box-shadow:0 16px 34px -14px rgba(110,40,190,.8)}
.bc-launch .bc-dot svg{width:28px;height:28px}
.bc-launch .bc-dot::after{content:"";position:absolute;right:3px;top:3px;width:13px;height:13px;border-radius:50%;background:#35c46a;border:2px solid #fff}
.bc-launch[aria-expanded=true]{display:none}
@media(max-width:640px){.bc-launch .bc-pill{display:none}}
.bc-panel{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:901;width:min(400px,calc(100vw - 36px));height:min(640px,calc(100vh - 36px));background:#fff;border-radius:24px;box-shadow:0 30px 70px -20px rgba(60,20,120,.5);display:flex;flex-direction:column;overflow:hidden;transform-origin:bottom right;animation:bcIn .22s ease}
.bc-panel[hidden]{display:none}
@keyframes bcIn{from{opacity:0;transform:translateY(12px) scale(.97)}}
@media(max-width:640px){.bc-panel{right:0;bottom:0;width:100vw;height:100dvh;border-radius:0}}
.bc-head{display:flex;align-items:center;gap:12px;padding:16px 16px 14px;background:var(--g2,linear-gradient(135deg,#7b3fe4,#e27aa8));color:#fff}
.bc-av{flex:none;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.22);border:2px solid rgba(255,255,255,.7);display:grid;place-items:center;font:700 19px var(--font-d,inherit);position:relative;overflow:hidden}
.bc-av img{width:100%;height:100%;object-fit:cover}
.bc-head-t{flex:1;min-width:0}.bc-head-t strong{display:block;font:700 17px var(--font-d,inherit)}
.bc-head-t small{display:flex;align-items:center;gap:6px;font-size:12.5px;opacity:.92}
.bc-head-t small::before{content:"";width:8px;height:8px;border-radius:50%;background:#7dffa9}
.bc-x,.bc-reset{flex:none;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.18);color:#fff;cursor:pointer;display:grid;place-items:center}
.bc-x:hover,.bc-reset:hover{background:rgba(255,255,255,.3)}
.bc-x svg,.bc-reset svg{width:18px;height:18px}
.bc-log{flex:1;overflow-y:auto;padding:16px 14px 8px;background:linear-gradient(180deg,#fbf7fe,#fdf6fa);display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}
.bc-msg{max-width:86%;padding:11px 14px;border-radius:18px;font-size:14.5px;line-height:1.5;color:#2c2340;word-wrap:break-word}
.bc-msg p{margin:0 0 8px}.bc-msg p:last-child{margin:0}.bc-msg ul{margin:4px 0 8px;padding-left:18px}.bc-msg li{margin:3px 0}
.bc-msg a{color:#6a3fc8}
.bc-bot{align-self:flex-start;background:#fff;border:1px solid #eee3f8;border-bottom-left-radius:6px;box-shadow:0 6px 16px -14px rgba(80,30,150,.6)}
.bc-me{align-self:flex-end;background:var(--g2,linear-gradient(135deg,#7b3fe4,#e27aa8));color:#fff;border-bottom-right-radius:6px}
.bc-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;align-self:flex-start;max-width:92%}
.bc-links a{display:inline-flex;align-items:center;gap:4px;font:600 13px var(--font-d,inherit);color:#5b2d9e;background:#f3eafc;border-radius:99px;padding:6px 11px;text-decoration:none}
.bc-links a:hover{background:#e8d9fa}.bc-links a svg{width:13px;height:13px}
.bc-chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px 4px;background:#fdf6fa}
.bc-chips button{border:1.5px solid #dcc6f3;background:#fff;color:#5b2d9e;border-radius:99px;padding:7px 12px;font:600 13px var(--font-d,inherit);cursor:pointer}
.bc-chips button:hover{border-color:#a676e0;background:#faf5ff}
.bc-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:#fff;border:1px solid #eee3f8;border-radius:18px;border-bottom-left-radius:6px}
.bc-typing i{width:7px;height:7px;border-radius:50%;background:#b48ce6;animation:bcDot 1s infinite}
.bc-typing i:nth-child(2){animation-delay:.15s}.bc-typing i:nth-child(3){animation-delay:.3s}
@keyframes bcDot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}
.bc-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #f0e6f8;background:#fff}
.bc-form input{flex:1;min-width:0;border:1.5px solid #e2d3f2;border-radius:99px;padding:11px 16px;font:15px var(--font-b,inherit);outline:none}
.bc-form input:focus{border-color:#9b6be0;box-shadow:0 0 0 3px rgba(155,107,224,.15)}
.bc-send{flex:none;width:44px;height:44px;border-radius:50%;border:0;background:var(--g2,linear-gradient(135deg,#7b3fe4,#e27aa8));color:#fff;cursor:pointer;display:grid;place-items:center}
.bc-send svg{width:19px;height:19px}
.bc-foot{padding:0 14px 10px;background:#fff;font-size:11.5px;color:#7a6f8a;text-align:center;line-height:1.4}
.bc-lead{display:grid;gap:8px;margin-top:6px}
.bc-lead input,.bc-lead textarea{border:1.5px solid #e2d3f2;border-radius:12px;padding:9px 12px;font:14px var(--font-b,inherit);width:100%;box-sizing:border-box}
.bc-lead button{border:0;border-radius:12px;padding:10px;background:var(--g2,linear-gradient(135deg,#7b3fe4,#e27aa8));color:#fff;font:600 14px var(--font-d,inherit);cursor:pointer}
.bc-lead small{color:#7a6f8a;font-size:12px}
.bc-msg .bc-small{font-size:12.5px;color:#7a6f8a;margin-top:6px}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const chatIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>';
  const sendIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const resetIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg>';
  const avatar = CFG.beccaPhoto ? `<img src="${CFG.beccaPhoto}" alt="">` : 'B';

  const root = document.createElement('div');
  root.innerHTML = `<button class="bc-launch" type="button" aria-expanded="false" aria-controls="bc-panel"><span class="bc-pill">Questions? Ask Becca</span><span class="bc-dot">${chatIco}<span class="sr">Open chat with Becca</span></span></button>
  <section class="bc-panel" id="bc-panel" role="dialog" aria-label="Chat with Becca from the Zen team" hidden>
    <div class="bc-head"><span class="bc-av">${avatar}</span><div class="bc-head-t"><strong>Becca</strong><small>Client Support at Zen</small></div><button class="bc-reset" type="button" title="Start a new chat" aria-label="Start a new chat">${resetIco}</button><button class="bc-x" type="button" aria-label="Close chat">${icon('close')}</button></div>
    <div class="bc-log" role="log" aria-live="polite"></div>
    <div class="bc-chips"></div>
    <form class="bc-form"><label class="sr" for="bc-in">Type your question</label><input id="bc-in" autocomplete="off" placeholder="Type your question…" maxlength="400"><button class="bc-send" type="submit" aria-label="Send">${sendIco}</button></form>
    <p class="bc-foot">Instant replies in this chat are automated and give general information, not advice. For help with your situation, <a href="/contact">talk to the team</a>.</p>
  </section>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const btn = $('.bc-launch'), panel = $('.bc-panel'), log = $('.bc-log'), chipsEl = $('.bc-chips'), form = $('.bc-form'), input = $('#bc-in');

  let history = [];
  const save = () => { try { sessionStorage.setItem('zen-becca', JSON.stringify(history.slice(-40))); } catch (e) {} };
  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const linkHtml = (links) => links && links.length ? `<div class="bc-links">${links.map(([t, h]) => `<a href="${h}" data-bc-link${/^https?:/.test(h) ? ' target="_blank" rel="noopener"' : ''}>${esc(t)}${icon('arrow')}</a>`).join('')}</div>` : '';
  const render = (m) => {
    const d = document.createElement('div');
    d.innerHTML = m.who === 'me' ? `<div class="bc-msg bc-me">${esc(m.text)}</div>` : `<div class="bc-msg bc-bot">${m.html}</div>${linkHtml(m.links)}`;
    [...d.children].forEach((c) => log.appendChild(c)); scroll();
  };
  const setChips = (list) => { chipsEl.innerHTML = (list || []).map((c) => `<button type="button">${esc(c)}</button>`).join(''); chipsEl.hidden = !(list && list.length); };
  const push = (m, store = true) => { if (store) { history.push(m); save(); } render(m); };
  const typing = (ms) => new Promise((res) => { const t = document.createElement('div'); t.className = 'bc-typing'; t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); scroll(); setTimeout(() => { t.remove(); res(); }, ms); });

  const pageContext = () => {
    const p = location.pathname.replace(/\/$/, '') || '/';
    const s = (DATA.svc || {})[p];
    if (s) return { name: s.replace(/ Services$/, ''), chips: ['Tell me about ' + s, 'How much do you charge?'] };
    if (p === '/pricing') return { name: 'pricing', chips: ['Can I pick individual services?', 'What’s in Zen Growth?'] };
    if (p.indexOf('/accountant-') === 0 || p === '/areas') return { name: 'local support', chips: ['Do you meet in person?', 'How do I get started?'] };
    return null;
  };
  const START = ['How much do you charge?', 'Can I switch from my current accountant?', 'Does MTD apply to me?', 'What is the dividend allowance?', 'What are the tax deadlines?', 'Book a free call'];
  const greet = () => {
    const c = pageContext();
    push({ who: 'bot', html: `<p>Hi, I’m Becca from the Zen team.</p><p>${c ? `I see you’re looking at ${esc(c.name)}. ` : ''}I can answer quick questions about our services, prices, deadlines, tax rates and how we work. What can I help with?</p>` });
    setChips(c ? [...c.chips, 'Book a free call'] : START);
  };

  /* ---------- enquiry hand-off ---------- */
  const leadForm = (q) => {
    const id = 'bc' + Date.now();
    const d = document.createElement('div'); d.className = 'bc-msg bc-bot';
    d.innerHTML = `<p>I’ll pass this to a member of the team and they’ll get back to you. Just add your details:</p><form class="bc-lead" id="${id}"><input name="name" placeholder="Your name" autocomplete="name" required><input name="email" type="email" placeholder="Email address" autocomplete="email" required><input name="phone" type="tel" placeholder="Phone (optional)" autocomplete="tel"><textarea name="message" rows="3" placeholder="Your question">${esc(q || '')}</textarea><button type="submit">Send to the team</button><small>We’ll only use your details to reply. See our <a href="#privacy">Privacy Policy</a>.</small></form>`;
    log.appendChild(d); scroll(); setChips([]);
    d.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target; const data = Object.fromEntries(new FormData(f));
      if (!data.name.trim() || !/.+@.+\..+/.test(data.email)) { f.querySelector(!data.name.trim() ? '[name=name]' : '[name=email]').focus(); return; }
      f.querySelector('button').disabled = true;
      let ok = false;
      try { ok = Z.sendEnquiry ? await Z.sendEnquiry({ ...data, source: 'Becca chat' }) : false; } catch (err) { ok = false; }
      d.remove();
      push({ who: 'me', text: 'Sent my details to the team' });
      await typing(500);
      push({ who: 'bot', html: ok === 'preview' ? `<p>Thanks, ${esc(data.name.split(' ')[0])}. This is a preview of the website, so nothing was sent this time. On the live site your message goes straight to the team.</p>` : ok ? `<p>Thanks, ${esc(data.name.split(' ')[0])}. The team has your message and will be in touch soon. Is there anything else I can help with?</p>` : `<p>Sorry, something went wrong sending that. Please call us on ${CONTACT.phone} or email <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>.</p>` });
      setChips(START.slice(0, 3));
    });
  };

  /* ---------- answering ---------- */
  const SMALL = [
    [/^(hi|hello|hey|hiya|good (morning|afternoon|evening))\b/i, '<p>Hello! What would you like to know? You can ask me about our services, prices, Making Tax Digital, deadlines or how to get started.</p>'],
    [/\b(thanks|thank you|cheers|ta)\b/i, '<p>You’re welcome! Is there anything else I can help with?</p>'],
    [/\b(are you (a )?(real|human|bot|robot|ai)|who are you)\b/i, '<p>I’m Becca from the Zen team. To help you straight away, the replies in this chat are automated and come from our website, so it isn’t me typing live. If you’d like to talk to a real person, leave a message and we’ll get back to you.</p>'],
    [/\b(bye|goodbye|see you)\b/i, '<p>Thanks for chatting. Have a lovely day!</p>']
  ];
  const ADVICE = /\b(should i|can i claim|is it allowable|how much tax (will|do) i|my (tax|return|accounts|bill)|work out my|calculate my)\b/i;
  const answer = async (q) => {
    push({ who: 'me', text: q }); setChips([]);
    const asked = q; q = spell(q);
    const ql = q.toLowerCase();
    await typing(450 + Math.min(900, q.length * 12));
    if (/leave a message|message for ann|speak to (ann|someone|a person|a human)|talk to (ann|someone|a person|a human)|call me back|callback/.test(ql)) return leadForm('');
    if (/^book a free call$/i.test(q) || /\bbook\b.*\bcall\b/.test(ql)) { push({ who: 'bot', html: '<p>Lovely! You can book a free, no-obligation call through our contact page, or I can pass your details to the team now and someone will get in touch.</p>', links: [L('Go to contact page', '#contact')] }); return setChips(['Leave a message for the team']); }
    for (const [re, html] of SMALL) if (re.test(q) && q.split(/\s+/).length <= 6) { push({ who: 'bot', html }); return setChips(START.slice(0, 3)); }
    const res = search(q);
    const top = res[0], second = res[1];
    const qtk = [...new Set(toks(q))];
    const wsum = qtk.reduce((n, w) => n + idf(w), 0) || 1;
    const cov = top ? qtk.filter((w) => top.e.t.includes(w)).reduce((n, w) => n + idf(w), 0) / wsum : 0;
    const onTopic = qtk.some((w) => DOMAIN.has(w));
    const passage = !!top && /^p-/.test(top.e.id);
    if (top && top.s >= 2.2 && (onTopic || cov >= 0.45 && !passage)) {
      const caveat = ADVICE.test(q) ? '<p><em>This is general information. For advice on your own situation, it’s best to speak to a member of the team.</em></p>' : '';
      push({ who: 'bot', html: top.e.a + caveat, links: top.e.links });
      const more = res.slice(1, 4).filter((r) => r.s > top.s * 0.55 && r.e.q && r.e.q !== top.e.q).map((r) => r.e.q);
      return setChips([...(top.e.chips || []), ...more].slice(0, 3).concat(['Leave a message for the team']));
    }
    if (CFG.beccaAI) {
      try {
        const r = await fetch(CFG.beccaAI, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, history: history.slice(-10).map((m) => ({ role: m.who === 'me' ? 'user' : 'assistant', text: m.text || strip(m.html) })) }) });
        const j = await r.json();
        if (j && j.answer) { push({ who: 'bot', html: `<p>${esc(j.answer).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>` }); return setChips(['Leave a message for the team', 'Book a free call']); }
      } catch (e) { /* fall through */ }
    }
    if (qtk.length && !onTopic && (cov < 0.45 || passage || !top || top.s < 2.2)) {
      push({ who: 'bot', html: '<p>That doesn’t sound like something an accountancy practice like ours can help with, so I don’t think I’m the right person to answer it. If you’d still like an answer, I can pass your question to a member of the team.</p>' });
      setChips(['Leave a message for the team', 'What services do you offer?']);
      window.__beccaLast = asked;
      return;
    }
    if (top && top.s >= 1.1) {
      push({ who: 'bot', html: '<p>I’m not completely sure I’ve understood. Did you mean one of these?</p>' });
      return setChips([top.e.q, second && second.e.q, 'Leave a message for the team'].filter(Boolean));
    }
    push({ who: 'bot', html: '<p>I’m sorry, I don’t have an answer to that one. A member of the team can help: would you like me to pass your question on?</p>' });
    setChips(['Leave a message for the team', 'What services do you offer?']);
    window.__beccaLast = asked;
  };

  /* ---------- events ---------- */
  const open = () => { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); if (!log.children.length) { if (history.length) history.forEach((m) => render(m)); else greet(); if (!chipsEl.innerHTML) setChips(START.slice(0, 3)); } setTimeout(() => input.focus(), 60); };
  const close = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); };
  btn.addEventListener('click', open);
  $('.bc-x').addEventListener('click', close);
  $('.bc-reset').addEventListener('click', () => { history = []; save(); log.innerHTML = ''; greet(); input.focus(); });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); const q = input.value.trim(); if (!q) return; input.value = ''; answer(q); });
  chipsEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const t = b.textContent; if (t === 'Leave a message for the team') { push({ who: 'me', text: t }); return leadForm(window.__beccaLast || ''); } answer(t); });
  log.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (a && innerWidth <= 640) close(); });
  try { history = JSON.parse(sessionStorage.getItem('zen-becca') || '[]') || []; } catch (e) { history = []; }
  window.ZenBecca = { open, ask: (q) => { open(); answer(q); } };
  };
  const load = () => fetch(BASE + 'becca-kb.json').then((r) => r.json()).then(boot).catch(() => {});
  if (document.readyState === 'complete') setTimeout(load, 800); else window.addEventListener('load', () => setTimeout(load, 800));
})();
