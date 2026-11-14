// /atelier/products — the maison's candles, with the vessel designer.
import * as store from '../../store.js';
import { esc, money, icon, mothMark, candleArt, statusBadge, toast, modal, confirmDialog, formData } from '../../ui.js';

export const meta = { title: 'Candles' };

let filter = 'all';
const LOW = 5;
const FILTERS = [
  ['all', 'All', () => true],
  ['live', 'Live', (p) => p.status === 'live'],
  ['draft', 'Drafts', (p) => p.status === 'draft'],
  ['low', 'Low stock', (p) => p.status === 'live' && p.stock <= LOW],
];
const TAGS = [['new', 'New arrival'], ['bestseller', 'Most loved'], ['limited', 'Limited edition'], ['gift', 'Suited to gifting']];
const SHAPES = ['tumbler', 'jar', 'coupe', 'tin', 'pillar'];
const DEFAULT_VESSEL = { shape: 'tumbler', body: '#15120f', rim: '#c9a35c', wax: '#efe3c8', label: 'none', ink: '#c9a35c' };
const hex = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : fallback);
const stockNote = (p) => (p.stock <= 0 ? ['is-out', 'Resting'] : p.stock <= LOW ? ['is-low', 'Running low'] : ['', '']);

export function render({ shop }) {
  const all = store.listProducts({ shopId: shop.id });
  if (!FILTERS.some((f) => f[0] === filter)) filter = 'all';
  const rows = all.filter(FILTERS.find((f) => f[0] === filter)[2]);

  if (!all.length) {
    return `<div class="empty">${mothMark(44)}<h2 class="h3">The shelves are waiting</h2>
      <p class="mt-1" style="max-width:52ch;margin-inline:auto">Add your first candle: describe the piece, set its price, and design its vessel. You may keep it as a draft until the batch has rested.</p>
      <button class="btn btn-gold btn-sm mt-3" data-add>${icon('plus')} Add a candle</button></div>`;
  }

  return `
    <div class="vd-toolbar">
      <div class="chips" role="group" aria-label="Filter candles">${FILTERS.map(([id, label, fn]) => `<button class="chip ${id === filter ? 'is-active' : ''}" data-filter="${id}" aria-pressed="${id === filter}">${label} <span class="num" data-count="${id}">${all.filter(fn).length}</span></button>`).join('')}</div>
      <button class="btn btn-gold btn-sm" data-add>${icon('plus')} Add a candle</button>
    </div>

    ${rows.length ? `<section class="panel vd-panel-flush">
      <div class="table-wrap" style="padding-top:8px">
        <table class="table">
          <thead><tr><th>Piece</th><th>Collection</th><th class="right">Price</th><th>In the atelier</th><th>Status</th><th class="right">Action</th></tr></thead>
          <tbody>${rows.map((p) => {
            const [cls, note] = stockNote(p);
            return `<tr data-row="${esc(p.id)}">
              <td><div class="vd-prod"><div class="table-thumb">${candleArt(p, { lit: false })}</div>
                <div><div class="h4">${esc(p.name)}</div><div class="faint tiny">${esc(p.category)}${p.tags?.length ? ` · ${esc(p.tags.join(' · '))}` : ''}</div></div></div></td>
              <td class="muted" style="min-width:140px">${esc(p.collection || '—')}</td>
              <td class="right vd-figure">${money(p.price)}</td>
              <td class="nowrap">
                <div class="vd-stepper" role="group" aria-label="Stock of ${esc(p.name)}">
                  <button type="button" data-step="-1" data-id="${esc(p.id)}" aria-label="One fewer">−</button>
                  <span data-stock aria-live="polite">${p.stock}</span>
                  <button type="button" data-step="1" data-id="${esc(p.id)}" aria-label="One more">+</button>
                </div>
                <span class="vd-stock-note ${cls}" data-stock-note>${note}</span>
              </td>
              <td>${statusBadge(p.status)}</td>
              <td class="right nowrap"><button class="btn btn-sm btn-ghost" data-edit="${esc(p.id)}">${icon('edit')} Edit</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </section>
    <p class="faint small">Stock changes save at once. Drafts stay private to the atelier until you set them live.</p>`
    : `<div class="empty">${mothMark(44)}<p>${filter === 'low' ? 'Every live piece has comfortable stock.' : filter === 'draft' ? 'No drafts are resting in the atelier.' : 'No live pieces yet. Set a draft live when it is ready.'}</p></div>`}`;
}

/* ------------------------------------------------------------ the editor */
function editorBody(p, isNew) {
  const v = { ...DEFAULT_VESSEL, ...(p.vessel || {}) };
  const hasLabel = v.label && v.label !== 'none';
  const f = (label, name, value, attrs = '', cls = '') => `<label class="field ${cls}"><span class="label">${label}</span><input class="input" name="${name}" value="${esc(value ?? '')}" ${attrs}></label>`;
  const colour = (label, name, value, extra = '') => `<label class="vd-color"><span class="label">${label}</span><input type="color" name="${name}" value="${esc(value)}" ${extra}></label>`;
  return `<form class="vd-pform" novalidate>
    <div>
      <div class="form-grid">
        ${f('Name', 'name', p.name, 'required maxlength="80" placeholder="e.g. Carriage House Smoke"', 'span-2')}
        ${f('Collection', 'collection', p.collection, 'maxlength="60" placeholder="e.g. The Hearth"')}
        <label class="field"><span class="label">Category</span><select class="select" name="category">${store.CATEGORIES.map((c) => `<option ${c === p.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        ${f('Price (USD)', 'price', p.price ? (p.price / 100).toFixed(2).replace(/\.00$/, '') : '', 'type="number" min="0" step="0.01" inputmode="decimal" required placeholder="82"')}
        ${f('Stock', 'stock', p.stock ?? 0, 'type="number" min="0" step="1" inputmode="numeric"')}
        <label class="field"><span class="label">Status</span><select class="select" name="status"><option value="live" ${p.status !== 'draft' ? 'selected' : ''}>Live — shown to guests</option><option value="draft" ${p.status === 'draft' ? 'selected' : ''}>Draft — private</option></select></label>
        ${f('Burn time (hours)', 'burnTime', p.burnTime ?? 50, 'type="number" min="1" step="1" inputmode="numeric"')}
        ${f('Weight', 'weight', p.weight ?? '10 oz', 'maxlength="20" placeholder="10 oz"', 'span-2')}
      </div>

      <div class="vd-form-section">
        <div class="eyebrow mb-2">The scent</div>
        <div class="form-grid">
          ${f('Top notes', 'top', p.notes?.top, 'maxlength="80" placeholder="Bergamot, pink pepper"')}
          ${f('Heart notes', 'heart', p.notes?.heart, 'maxlength="80" placeholder="Frankincense, iris"')}
          ${f('Base notes', 'base', p.notes?.base, 'maxlength="80" placeholder="Cedar, soft amber"', 'span-2')}
          <label class="field span-2"><span class="label">Description</span><textarea class="textarea" name="description" maxlength="600" placeholder="A few unhurried lines about the piece.">${esc(p.description || '')}</textarea></label>
        </div>
      </div>

      <fieldset class="vd-fieldset vd-form-section">
        <legend class="eyebrow mb-2">Marks of distinction</legend>
        <div class="vd-checks">${TAGS.map(([t, label]) => `<label class="check"><input type="checkbox" name="tag_${t}" ${p.tags?.includes(t) ? 'checked' : ''}> ${label}</label>`).join('')}</div>
      </fieldset>
      <p class="vd-error" data-error role="alert"></p>
    </div>

    <aside class="vd-designer">
      <div class="eyebrow mb-2">Vessel designer</div>
      <div class="vd-art" data-art></div>
      ${p.image ? `<p class="preview-note mt-2">This piece is shown with its photograph across the Palace. The vessel you design here is kept as its drawn likeness.</p>` : `<p class="faint tiny mt-1 center">Live preview · saved only when you save</p>`}
      <label class="field mt-2"><span class="label">Shape</span><select class="select" name="shape">${SHAPES.map((s) => `<option value="${s}" ${s === v.shape ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select></label>
      <div class="vd-colors">
        ${colour('Body', 'body', hex(v.body, DEFAULT_VESSEL.body))}
        ${colour('Rim', 'rim', hex(v.rim, DEFAULT_VESSEL.rim))}
        ${colour('Wax', 'wax', hex(v.wax, DEFAULT_VESSEL.wax))}
        ${colour('Label', 'label', hasLabel ? hex(v.label, '#efe7d8') : '#efe7d8', hasLabel ? '' : 'disabled')}
        ${colour('Ink', 'ink', hex(v.ink, DEFAULT_VESSEL.ink))}
      </div>
      <label class="check mt-2"><input type="checkbox" name="noLabel" ${hasLabel ? '' : 'checked'}> No label — mark the vessel directly</label>
    </aside>
  </form>`;
}

function openEditor(ctx, product) {
  const shop = ctx.shop;
  const isNew = !product;
  const p = product || { shopId: shop.id, name: '', collection: '', category: store.CATEGORIES[0], price: 0, stock: 12, status: 'draft', burnTime: 50, weight: '10 oz', notes: { top: '', heart: '', base: '' }, description: '', tags: [], vessel: { ...DEFAULT_VESSEL } };

  const read = (form) => {
    const d = formData(form);
    const vessel = { ...DEFAULT_VESSEL, ...(p.vessel || {}), shape: d.shape, body: d.body, rim: d.rim, wax: d.wax, ink: d.ink, label: d.noLabel ? 'none' : d.label };
    const kept = (p.tags || []).filter((t) => !TAGS.some(([k]) => k === t));
    const price = Math.round(parseFloat(d.price) * 100);
    return {
      name: d.name, collection: d.collection, category: d.category, price,
      stock: Math.max(0, Math.round(Number(d.stock) || 0)), status: d.status === 'draft' ? 'draft' : 'live',
      burnTime: Math.max(1, Math.round(Number(d.burnTime) || 50)), weight: d.weight || '10 oz',
      notes: { top: d.top, heart: d.heart, base: d.base }, description: d.description,
      tags: [...kept, ...TAGS.map(([k]) => k).filter((k) => d[`tag_${k}`])], vessel,
    };
  };

  const actions = [];
  if (!isNew) {
    actions.push({ label: 'Delete', kind: 'danger', onClick: async (_el, close) => {
      const ok = await confirmDialog({ title: `Remove ${p.name}?`, body: 'The piece leaves your storefront and every guest’s bag. Past orders keep their record of it. This cannot be undone.', confirm: 'Remove piece', cancel: 'Keep it', danger: true });
      if (!ok) return;
      store.deleteProduct(p.id); close(); toast(`${p.name} has been removed.`); ctx.refresh();
    } });
  }
  actions.push({ label: 'Cancel', kind: 'ghost' });
  actions.push({ label: isNew ? 'Save candle' : 'Save changes', kind: 'gold', onClick: (el, close) => save(el, close) });

  const m = modal({ eyebrow: isNew ? 'A new piece' : 'Edit piece', title: isNew ? 'Add a candle' : p.name, width: 980, body: editorBody(p, isNew), actions });
  const form = m.el.querySelector('form');
  const art = m.el.querySelector('[data-art]');
  const error = m.el.querySelector('[data-error]');

  const draw = () => {
    form.elements.label.disabled = form.elements.noLabel.checked;
    const d = read(form);
    // The designer always shows the drawn vessel, so image is left out of the temporary piece.
    art.innerHTML = candleArt({ shopId: shop.id, name: d.name || 'Your candle', vessel: d.vessel, image: null });
  };
  function save(_el, close) {
    const d = read(form);
    if (!d.name) { error.textContent = 'Please give the piece a name.'; form.elements.name.focus(); return; }
    if (!Number.isFinite(d.price) || d.price <= 0) { error.textContent = 'Please enter a price in dollars, for example 82 or 82.50.'; form.elements.price.focus(); return; }
    const saved = isNew ? store.saveProduct({ ...d, shopId: shop.id }) : store.saveProduct({ ...d, id: p.id });
    if (!saved) { error.textContent = 'This piece could not be saved. Please close and try again.'; return; }
    close(); toast(isNew ? `${d.name} has joined the collection${d.status === 'draft' ? ' as a draft' : ''}.` : `${d.name} has been updated.`); ctx.refresh();
  }
  form.addEventListener('input', () => { error.textContent = ''; draw(); });
  form.addEventListener('change', draw);
  form.addEventListener('submit', (e) => { e.preventDefault(); save(null, m.close); });
  draw();
}

export function mount(root, ctx) {
  const shop = ctx.shop;
  root.querySelectorAll('[data-filter]').forEach((b) => { b.onclick = () => { filter = b.dataset.filter; ctx.refresh(); }; });
  root.querySelectorAll('[data-add]').forEach((b) => { b.onclick = () => openEditor(ctx, null); });

  root.addEventListener('click', (e) => {
    const edit = e.target.closest('[data-edit]');
    if (edit) { const p = store.getProduct(edit.dataset.edit); if (p && p.shopId === shop.id) openEditor(ctx, p); return; }
    const step = e.target.closest('[data-step]');
    if (!step) return;
    const p = store.getProduct(step.dataset.id);
    if (!p || p.shopId !== shop.id) return;
    const stock = Math.max(0, p.stock + Number(step.dataset.step));
    if (stock === p.stock) return;
    store.saveProduct({ id: p.id, stock });
    // Update the row in place so the stepper keeps focus for repeated presses.
    const row = step.closest('[data-row]');
    row.querySelector('[data-stock]').textContent = stock;
    const [cls, note] = stockNote(p);
    const noteEl = row.querySelector('[data-stock-note]');
    noteEl.className = `vd-stock-note ${cls}`; noteEl.textContent = note;
    const all = store.listProducts({ shopId: shop.id });
    FILTERS.forEach(([id, , fn]) => { const c = root.querySelector(`[data-count="${id}"]`); if (c) c.textContent = all.filter(fn).length; });
  });
}
