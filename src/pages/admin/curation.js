// Curation — what the Palace shows: the announcement, featured maisons and editorial edits.
import * as store from '../../store.js';
import { esc, money, icon, mothMark, monogram, candleArt, toast, modal, confirmDialog } from '../../ui.js';

export const meta = { title: 'Curation' };

const getEdits = () => (Array.isArray(store.getSettings().edits) ? store.getSettings().edits : []);
const saveEdits = (edits) => store.updateSettings({ edits: edits.map((e) => ({ ...e, productIds: [...(e.productIds || [])] })) });

function editCard(e) {
  const products = (e.productIds || []).map((id) => store.getProduct(id)).filter(Boolean);
  return `<article class="panel ad-edit">
    <div class="panel-head">
      <div><h3 class="h3">${esc(e.title || 'Untitled edit')}</h3>${e.subtitle ? `<p class="muted small">${esc(e.subtitle)}</p>` : ''}</div>
      <span class="faint small">${products.length} piece${products.length === 1 ? '' : 's'}</span>
    </div>
    ${products.length ? `<div class="ad-thumbs">${products.map((p) => { const shop = store.getShop(p.shopId); const hidden = p.status !== 'live' || shop?.status !== 'live'; return `
      <a class="ad-thumb ${hidden ? 'ad-thumb-off' : ''}" href="#/palace/product/${esc(p.id)}" title="${esc(p.name)}">
        <span class="art-frame">${candleArt(p, { lit: false })}</span>
        <span class="ad-thumb-name">${esc(p.name)}</span>
        <span class="faint tiny">${hidden ? 'Not on show' : esc(shop?.name || '')}</span>
      </a>`; }).join('')}</div>` : '<p class="muted small">No pieces chosen yet. An empty edit is not worth showing in the lobby.</p>'}
    <div class="row row-wrap mt-3" style="--gap:10px">
      <button type="button" class="btn btn-gold btn-sm" data-pick="${esc(e.id)}">Choose pieces</button>
      <button type="button" class="btn btn-ghost btn-sm" data-rename="${esc(e.id)}">${icon('edit')} Rename</button>
      <button type="button" class="btn btn-danger btn-sm" data-delete="${esc(e.id)}">${icon('trash')} Delete</button>
    </div>
  </article>`;
}

export function render() {
  const settings = store.getSettings();
  const live = store.listShops({ status: 'live' });
  const featured = live.filter((s) => store.isFeatured(s.id)).length;
  const edits = getEdits();
  return `
  <div class="page-head">
    <p class="muted" style="max-width:60ch">What guests meet when they step into the Palace. Changes here are live as soon as you make them.</p>
    <a class="btn btn-ghost btn-sm" href="#/palace">${icon('eye')} View the lobby</a>
  </div>

  <section class="panel">
    <div class="panel-head"><div><div class="eyebrow">Announcement bar</div><h3 class="h3 mt-1">One line across the top of the Palace</h3></div>
      <span class="badge ${settings.announcement ? 'badge-ok' : 'badge-mute'}">${settings.announcement ? 'Showing' : 'Hidden'}</span></div>
    <form class="ad-inline-form" data-announce>
      <label class="field ad-wide"><span class="label">Announcement text</span><input class="input" name="announcement" maxlength="120" value="${esc(settings.announcement || '')}" placeholder="Leave empty to hide the bar"></label>
      <button class="btn btn-gold btn-sm">Save announcement</button>
    </form>
    <p class="hint">Keep it quiet and factual. Leaving the field empty hides the bar.</p>
  </section>

  <section class="panel">
    <div class="panel-head"><div><div class="eyebrow">Featured maisons</div><h3 class="h3 mt-1">${featured} of ${live.length} live maisons featured</h3></div></div>
    <p class="muted small mb-2">Featured maisons appear in the Palace lobby and on the house homepage. Only live maisons can be shown.</p>
    ${live.length ? `<div class="ad-feature-list">${live.map((s) => `
      <label class="ad-setting">
        <span class="ad-cell">${monogram(s, 38)}<span class="grow"><b>${esc(s.name)}</b><small>${esc(s.tagline || s.location || '')}</small></span></span>
        <span class="switch"><input type="checkbox" data-featured="${esc(s.id)}" ${store.isFeatured(s.id) ? 'checked' : ''} aria-label="Feature ${esc(s.name)}"><span></span></span>
      </label>`).join('')}</div>` : '<p class="muted">There are no live maisons to feature.</p>'}
  </section>

  <section>
    <div class="page-head mb-2">
      <div><div class="eyebrow">Editorial edits</div><h2 class="h3 mt-1">${edits.length ? `${edits.length} edit${edits.length === 1 ? '' : 's'} in the lobby` : 'No edits yet'}</h2></div>
      <button type="button" class="btn btn-gold btn-sm" data-new>${icon('plus')} New edit</button>
    </div>
    ${edits.length ? `<div class="stack" style="--gap:20px">${edits.map(editCard).join('')}</div>` : `<div class="empty">${mothMark(44)}<p>An edit is a small, titled selection of pieces from across the maisons. Create the first one.</p></div>`}
  </section>`;
}

function editForm(ctx, edit) {
  modal({
    eyebrow: 'Editorial edit', title: edit ? 'Rename this edit' : 'A new edit',
    body: `<form data-edit-form>
      <label class="field"><span class="label">Title</span><input class="input" name="title" maxlength="60" value="${esc(edit?.title || '')}" placeholder="The Evening Edit"></label>
      <label class="field"><span class="label">Subtitle (optional)</span><input class="input" name="subtitle" maxlength="90" value="${esc(edit?.subtitle || '')}" placeholder="Resin, smoke and low light"></label>
      <p class="hint" data-edit-error hidden>Give the edit a title.</p></form>`,
    actions: [{ label: 'Cancel', kind: 'ghost' }, { label: edit ? 'Save' : 'Create edit', kind: 'gold', onClick: (el, close) => {
      const title = el.querySelector('[name="title"]').value.trim();
      const subtitle = el.querySelector('[name="subtitle"]').value.trim();
      if (!title) { el.querySelector('[data-edit-error]').hidden = false; return; }
      const edits = getEdits();
      if (edit) saveEdits(edits.map((e) => (e.id === edit.id ? { ...e, title, subtitle } : e)));
      else saveEdits([...edits, { id: `edit_${Date.now().toString(36)}`, title, subtitle, productIds: [] }]);
      close(); toast(edit ? 'The edit has been renamed.' : `${title} has been created. Choose its pieces next.`); ctx.refresh();
    } }],
  });
}

function picker(ctx, edit) {
  const products = store.listProducts({ publicOnly: true, sort: 'name' });
  const chosen = new Set(edit.productIds || []);
  const m = modal({
    eyebrow: 'Choose pieces', title: edit.title || 'Untitled edit', width: 640,
    body: `<label class="field"><span class="label">Search pieces</span><input class="input" type="search" data-pick-q placeholder="Piece or maison" autocomplete="off"></label>
      <div class="ad-pick" role="group" aria-label="Pieces on show in the Palace">${products.map((p) => { const shop = store.getShop(p.shopId); return `
        <label class="ad-pick-row" data-hay="${esc(`${p.name} ${shop?.name || ''} ${p.category || ''}`.toLowerCase())}">
          <input type="checkbox" value="${esc(p.id)}" ${chosen.has(p.id) ? 'checked' : ''}>
          <span class="table-thumb">${candleArt(p, { lit: false })}</span>
          <span class="grow"><b>${esc(p.name)}</b><small>${esc(shop?.name || '')} · ${money(p.price)}</small></span>
        </label>`; }).join('') || '<p class="muted" style="padding:16px">No pieces are on show in the Palace.</p>'}</div>
      <p class="hint" data-pick-count></p>
      <p class="hint">Only pieces currently on show can be chosen. Drafts and pieces from maisons that are not live are left out.</p>`,
    actions: [{ label: 'Cancel', kind: 'ghost' }, { label: 'Save pieces', kind: 'gold', onClick: (el, close) => {
      const ids = [...el.querySelectorAll('.ad-pick input:checked')].map((i) => i.value);
      const kept = (edit.productIds || []).filter((id) => ids.includes(id));
      const productIds = [...kept, ...ids.filter((id) => !kept.includes(id))];
      saveEdits(getEdits().map((e) => (e.id === edit.id ? { ...e, productIds } : e)));
      close(); toast(`${edit.title || 'The edit'} now holds ${productIds.length} piece${productIds.length === 1 ? '' : 's'}.`); ctx.refresh();
    } }],
  });
  const el = m.el;
  const count = () => { const n = el.querySelectorAll('.ad-pick input:checked').length; el.querySelector('[data-pick-count]').textContent = `${n} piece${n === 1 ? '' : 's'} chosen`; };
  count();
  el.querySelector('.ad-pick').addEventListener('change', count);
  el.querySelector('[data-pick-q]').addEventListener('input', (e) => {
    const needle = e.target.value.trim().toLowerCase();
    el.querySelectorAll('.ad-pick-row').forEach((row) => { row.hidden = !!needle && !row.dataset.hay.includes(needle); });
  });
}

export function mount(root, ctx) {
  const form = root.querySelector('[data-announce]');
  form.onsubmit = (e) => {
    e.preventDefault();
    const text = form.querySelector('[name="announcement"]').value.trim();
    store.updateSettings({ announcement: text });
    toast(text ? 'The announcement has been updated.' : 'The announcement bar is now hidden.');
    ctx.refresh();
  };
  root.querySelectorAll('[data-featured]').forEach((sw) => {
    sw.onchange = () => {
      const s = store.getShop(sw.dataset.featured);
      store.setFeatured(sw.dataset.featured, sw.checked);
      toast(sw.checked ? `${s?.name || 'The maison'} is now featured.` : `${s?.name || 'The maison'} is no longer featured.`);
      ctx.refresh();
    };
  });
  const find = (id) => getEdits().find((e) => e.id === id);
  root.querySelector('[data-new]').onclick = () => editForm(ctx, null);
  root.querySelectorAll('[data-rename]').forEach((b) => { b.onclick = () => { const e = find(b.dataset.rename); if (e) editForm(ctx, e); }; });
  root.querySelectorAll('[data-pick]').forEach((b) => { b.onclick = () => { const e = find(b.dataset.pick); if (e) picker(ctx, e); }; });
  root.querySelectorAll('[data-delete]').forEach((b) => {
    b.onclick = async () => {
      const e = find(b.dataset.delete); if (!e) return;
      const ok = await confirmDialog({ title: 'Delete this edit?', body: `${esc(e.title || 'This edit')} will be removed from the lobby. The pieces themselves are not affected.`, confirm: 'Delete edit', danger: true });
      if (!ok) return;
      saveEdits(getEdits().filter((x) => x.id !== e.id));
      toast('The edit has been deleted.'); ctx.refresh();
    };
  });
}
