// Residency applications — the Keeper decides who opens a maison in the Palace.
import * as store from '../../store.js';
import { esc, icon, mothMark, statusBadge, toast, modal, confirmDialog, dateFmt, relTime } from '../../ui.js';

export const meta = { title: 'Residency Applications' };

const TABS = [['pending', 'Pending'], ['approved', 'Approved'], ['declined', 'Declined']];
let tab = 'pending';

const initial = (name) => esc((String(name || 'M').replace(/^(maison|atelier|the)\s+/i, '')[0] || 'M').toUpperCase());
const fact = (label, value) => `<div class="ad-fact"><span class="ad-fact-l">${esc(label)}</span><span class="ad-fact-v">${value}</span></div>`;

function card(a) {
  const shop = a.shopId ? store.getShop(a.shopId) : null;
  const decided = a.status !== 'pending';
  return `<article class="panel ad-app ${a.status === 'pending' ? 'panel-gold' : ''}">
    <header class="ad-app-head">
      <span class="monogram" style="--size:54px">${initial(a.maisonName)}</span>
      <div class="grow">
        <h3 class="h3">${esc(a.maisonName)}</h3>
        <div class="muted small">${esc(a.name)} · <span class="faint">${esc(a.email)}</span></div>
      </div>
      ${statusBadge(a.status)}
    </header>
    <div class="ad-facts">
      ${fact('Location', esc(a.location || 'Not given'))}
      ${fact('Website', esc(a.website || 'Not given'))}
      ${fact('Price range', esc(a.priceRange || 'Not given'))}
      ${fact('Applied', `${dateFmt(a.createdAt)} <small class="faint">· ${relTime(a.createdAt)}</small>`)}
    </div>
    <div>
      <div class="label">Specialties</div>
      <p>${esc(a.specialties || 'Not given')}</p>
    </div>
    <div>
      <div class="label">Their story</div>
      <p class="ad-quote">${esc(a.story || 'No story was shared.')}</p>
    </div>
    ${decided ? `<footer class="ad-app-foot ad-app-decided">
        <div><div class="label">${a.status === 'approved' ? 'Residency granted' : 'Declined'}</div>
          <p class="small">${a.decidedAt ? dateFmt(a.decidedAt) : 'Date not recorded'}${a.note ? ` · <span class="muted">${esc(a.note)}</span>` : ''}</p></div>
        ${shop ? `<a class="btn btn-ghost btn-sm" href="#/palace/shop/${esc(shop.slug)}">${icon('eye')} View storefront</a>` : ''}
      </footer>`
    : `<footer class="ad-app-foot">
        <button type="button" class="btn btn-ghost btn-sm btn-danger" data-decline="${esc(a.id)}">Decline</button>
        <button type="button" class="btn btn-gold btn-sm" data-grant="${esc(a.id)}">Grant residency</button>
      </footer>`}
  </article>`;
}

export function render() {
  const all = store.listApplications();
  const counts = Object.fromEntries(TABS.map(([id]) => [id, all.filter((a) => a.status === id).length]));
  const list = all.filter((a) => a.status === tab);
  const open = store.getSettings().applicationsOpen !== false;
  const emptyCopy = { pending: 'No applications are awaiting a decision.', approved: 'No residencies have been granted from this list yet.', declined: 'No applications have been declined.' }[tab];

  return `
  <div class="ad-banner ${open ? '' : 'ad-banner-off'}">
    <span class="badge ${open ? 'badge-ok' : 'badge-mute'}">${open ? 'Applications open' : 'Applications closed'}</span>
    <p class="muted small grow">${open ? 'Makers can apply for residency from the Palace. Each application waits here for your decision.' : 'The application form is closed to new makers. Applications already received can still be decided.'}</p>
    <a class="link-arrow" href="#/keeper/settings">Change in settings</a>
  </div>

  <div class="tabs" role="tablist" aria-label="Application status">
    ${TABS.map(([id, label]) => `<button type="button" role="tab" aria-selected="${id === tab}" class="tab ${id === tab ? 'is-active' : ''}" data-tab="${id}">${label} <span class="ad-count">${counts[id]}</span></button>`).join('')}
  </div>

  ${list.length ? `<div class="ad-apps">${list.map(card).join('')}</div>` : `<div class="empty">${mothMark(44)}<p>${emptyCopy}</p></div>`}`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; ctx.refresh(); }; });

  root.querySelectorAll('[data-grant]').forEach((b) => {
    b.onclick = async () => {
      const a = store.listApplications().find((x) => x.id === b.dataset.grant); if (!a) return;
      const existing = (a.userId && store.getUser(a.userId)) || store.listUsers().find((u) => u.email.toLowerCase() === String(a.email).toLowerCase());
      const ok = await confirmDialog({
        title: `Grant residency to ${a.maisonName}?`,
        body: `This opens the maison in the Palace straight away and gives ${esc(a.name)} access to the Maison Atelier. The Palace fee applies to every order they receive.`,
        confirm: 'Grant residency',
      });
      if (!ok) return;
      const done = store.decideApplication(a.id, 'approved');
      if (!done) { toast('This application has already been decided.'); ctx.refresh(); return; }
      const shop = done.shopId ? store.getShop(done.shopId) : null;
      ctx.refresh();
      toast(`${a.maisonName} is now in residence.`);
      modal({
        eyebrow: 'Residency granted',
        title: `${a.maisonName} is open`,
        body: `<p class="muted">The maison now has a storefront in the Palace and an empty atelier waiting for its first candle.</p>
          <div class="ad-facts mt-3">
            ${fact('Storefront', shop ? `<a class="link" href="#/palace/shop/${esc(shop.slug)}">#/palace/shop/${esc(shop.slug)}</a>` : 'Not available')}
            ${fact('Owner signs in with', esc(a.email))}
            ${fact('Password', existing ? 'Their existing password' : 'flame <small class="faint">· preview</small>')}
          </div>
          <p class="preview-note mt-3">In this preview no email is sent. Share the sign-in details with the maker yourself.</p>`,
        actions: [
          { label: 'Close', kind: 'ghost' },
          ...(shop ? [{ label: 'View storefront', kind: 'gold', onClick: (el, close) => { close(); ctx.navigate(`/palace/shop/${shop.slug}`); } }] : []),
        ],
      });
    };
  });

  root.querySelectorAll('[data-decline]').forEach((b) => {
    b.onclick = () => {
      const a = store.listApplications().find((x) => x.id === b.dataset.decline); if (!a) return;
      modal({
        eyebrow: 'Decline application',
        title: a.maisonName,
        body: `<p class="muted">The application will move to Declined. This cannot be reversed from the Keeper’s Office.</p>
          <label class="field mt-3"><span class="label">A note for the record (optional)</span>
            <textarea class="textarea" name="note" maxlength="400" placeholder="For example: the Palace is reserved for hand-poured, small-batch maisons."></textarea></label>`,
        actions: [
          { label: 'Keep pending', kind: 'ghost' },
          { label: 'Decline application', kind: 'danger', onClick: (el, close) => {
            const noteText = el.querySelector('[name="note"]').value.trim();
            const done = store.decideApplication(a.id, 'declined', noteText);
            close();
            toast(done ? `${a.maisonName} has been declined.` : 'This application has already been decided.');
            ctx.refresh();
          } },
        ],
      });
    };
  });
}
