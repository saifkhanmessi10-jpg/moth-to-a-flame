// /atelier/settings — maison profile, policies, payout method, availability and the owner's account.
import * as store from '../../store.js';
import { esc, money, pct, statusBadge, toast, confirmDialog, formData } from '../../ui.js';

export const meta = { title: 'Settings' };

const STATUS_COPY = {
  live: ['Your maison is open', 'Guests can visit your storefront and order your pieces.'],
  paused: ['Your maison is resting', 'Your storefront and pieces are hidden from guests. Orders already placed still need to be fulfilled.'],
  suspended: ['The Keeper has suspended this maison', 'Your storefront is closed to guests. Only the Keeper can reopen it; please write to the Palace to resolve this.'],
};

export function render({ shop, user }) {
  const rate = store.feeRateFor(shop);
  const settings = store.getSettings();
  const pol = shop.policies || {};
  const [statusTitle, statusBody] = STATUS_COPY[shop.status] || STATUS_COPY.live;
  const year = new Date().getFullYear();
  return `
    <div class="vd-settings">
      <div class="vd-stack">
        <form class="panel" data-form="profile" novalidate>
          <div class="panel-head"><h2 class="h3">Maison profile</h2><a class="vd-open" href="#/atelier/storefront">Storefront design</a></div>
          <div class="form-grid">
            <label class="field span-2"><span class="label">Maison name</span><input class="input" name="name" value="${esc(shop.name)}" maxlength="60" required></label>
            <label class="field"><span class="label">Location</span><input class="input" name="location" value="${esc(shop.location || '')}" maxlength="60" placeholder="Savannah, Georgia"></label>
            <label class="field"><span class="label">Founded</span><input class="input" name="founded" type="number" inputmode="numeric" min="1700" max="${year}" step="1" value="${esc(shop.founded || '')}" placeholder="${year}"></label>
          </div>
          <p class="hint mt-2">Your storefront address stays the same when the name changes: /palace/shop/${esc(shop.slug)}</p>
          <p class="vd-error" data-error role="alert"></p>
          <div class="vd-form-foot"><button class="btn btn-gold btn-sm">Save profile</button></div>
        </form>

        <form class="panel" data-form="policies">
          <div class="panel-head"><h2 class="h3">Policies</h2><span class="faint tiny caps">Shown to guests</span></div>
          <p class="vd-note mb-3">${esc(shop.frontDesk.name)}, your front desk, quotes these to guests word for word. Keep them exact.</p>
          <label class="field"><span class="label">Shipping</span><textarea class="textarea" name="shipping" maxlength="600" style="min-height:96px">${esc(pol.shipping || '')}</textarea></label>
          <label class="field"><span class="label">Returns</span><textarea class="textarea" name="returns" maxlength="600" style="min-height:96px">${esc(pol.returns || '')}</textarea></label>
          <label class="field"><span class="label">Gifting</span><textarea class="textarea" name="gifting" maxlength="600" style="min-height:96px">${esc(pol.gifting || '')}</textarea></label>
          <div class="vd-form-foot"><button class="btn btn-gold btn-sm">Save policies</button></div>
        </form>

        <form class="panel" data-form="account" novalidate>
          <div class="panel-head"><h2 class="h3">Owner account</h2><span class="faint tiny caps">How you sign in</span></div>
          <div class="form-grid">
            <label class="field"><span class="label">Your name</span><input class="input" name="name" value="${esc(user?.name || '')}" maxlength="60" autocomplete="name" required></label>
            <label class="field"><span class="label">Email</span><input class="input" name="email" type="email" value="${esc(user?.email || '')}" maxlength="120" autocomplete="email" required></label>
          </div>
          <p class="vd-error" data-error role="alert"></p>
          <div class="vd-form-foot"><button class="btn btn-gold btn-sm">Save account</button></div>
        </form>
      </div>

      <div class="vd-stack">
        <section class="panel ${shop.status === 'suspended' ? '' : 'panel-gold'}">
          <div class="panel-head"><h2 class="h3">Availability</h2>${statusBadge(shop.status)}</div>
          <h3 class="h4">${statusTitle}</h3>
          <p class="vd-note mt-1">${statusBody}</p>
          <div class="mt-3">${shop.status === 'suspended'
            ? `<button class="btn btn-ghost btn-sm" disabled>Reopening is with the Keeper</button>`
            : shop.status === 'paused'
              ? `<button class="btn btn-gold btn-sm" data-status="live">Reopen the maison</button>`
              : `<button class="btn btn-ghost btn-sm" data-status="paused">Pause the maison</button>`}</div>
        </section>

        <form class="panel" data-form="payout">
          <div class="panel-head"><h2 class="h3">Payout method</h2><a class="vd-open" href="#/atelier/payouts">Payouts</a></div>
          <label class="field"><span class="label">Account label</span><input class="input" name="label" value="${esc(shop.payoutMethod?.label || '')}" maxlength="60" placeholder="Bank account ending 4821"></label>
          <p class="hint">A label for your own reference. In this preview no bank details are held and no payment is taken.</p>
          <div class="vd-form-foot"><button class="btn btn-gold btn-sm">Save method</button></div>
        </form>

        <section class="panel">
          <div class="panel-head"><h2 class="h3">Palace terms</h2><span class="faint tiny caps">Your residency</span></div>
          <ul class="vd-terms">
            <li><span>Palace fee</span><span class="vd-figure">${rate > 0 ? `${pct(rate, 0)} of each sale` : 'No commission'}</span></li>
            <li><span>Smallest payout</span><span class="vd-figure">${money(settings.minPayout || 0)}</span></li>
            <li><span>Payouts settled</span><span style="text-transform:capitalize">${esc(settings.payoutSchedule || 'weekly')}</span></li>
          </ul>
          <div class="vd-block-label mt-3">House standards</div>
          <ul class="vd-standards">
            <li>Hand-poured, small-batch work only. The Palace is not a place for factory candles.</li>
            <li>Parcels leave the atelier within three days of an order.</li>
            <li>Delivery is complimentary and insured on every Palace order.</li>
            <li>The fee is fixed on each parcel at checkout; later changes never rewrite past orders.</li>
          </ul>
          ${rate === 0 ? `<p class="preview-note mt-2">As the founding house, this maison pays no commission.</p>` : shop.feeOverride != null ? `<p class="preview-note mt-2">The Keeper has set a rate for this maison that differs from the Palace-wide ${pct(settings.feeRate, 0)}.</p>` : ''}
        </section>
      </div>
    </div>`;
}

export function mount(root, ctx) {
  const shop = ctx.shop;
  const on = (name, handler) => {
    const form = root.querySelector(`[data-form="${name}"]`); if (!form) return;
    const err = form.querySelector('[data-error]');
    form.addEventListener('input', () => { if (err) err.textContent = ''; });
    form.addEventListener('submit', (e) => { e.preventDefault(); handler(formData(form), (msg) => { if (err) err.textContent = msg; else toast(msg); }); });
  };

  on('profile', (d, fail) => {
    if (!d.name) return fail('Please give the maison a name.');
    const year = new Date().getFullYear();
    const founded = d.founded === '' ? shop.founded : Math.round(Number(d.founded));
    if (d.founded !== '' && (!Number.isFinite(founded) || founded < 1700 || founded > year)) return fail(`Please enter a founding year between 1700 and ${year}.`);
    store.updateShop(shop.id, { name: d.name, location: d.location, founded });
    toast('The maison profile has been saved.'); ctx.refresh();
  });
  on('policies', (d) => {
    store.updateShop(shop.id, { policies: { ...(shop.policies || {}), shipping: d.shipping, returns: d.returns, gifting: d.gifting } });
    toast('Your policies have been saved. The front desk will quote them from now on.'); ctx.refresh();
  });
  on('payout', (d) => {
    store.updateShop(shop.id, { payoutMethod: { type: 'bank', ...(shop.payoutMethod || {}), label: d.label || 'Not yet connected' } });
    toast('Your payout method has been saved.'); ctx.refresh();
  });
  on('account', (d, fail) => {
    if (!d.name) return fail('Please enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(d.email)) return fail('Please enter a complete email address.');
    const email = d.email.toLowerCase();
    if (store.listUsers().some((u) => u.id !== ctx.user.id && u.email.toLowerCase() === email)) return fail('Another account already uses that address.');
    store.updateUser(ctx.user.id, { name: d.name, email });
    toast('Your account has been saved.'); ctx.refresh();
  });

  root.querySelectorAll('[data-status]').forEach((b) => { b.onclick = async () => {
    if (shop.status === 'suspended') return;
    const to = b.dataset.status === 'paused' ? 'paused' : 'live';
    const ok = await confirmDialog(to === 'paused'
      ? { title: 'Pause the maison?', body: 'Your storefront and pieces will be hidden from guests until you reopen. Orders already placed still need to be prepared and shipped.', confirm: 'Pause the maison', cancel: 'Stay open' }
      : { title: 'Reopen the maison?', body: 'Your storefront and every live piece will be visible to guests again at once.', confirm: 'Reopen', cancel: 'Not yet' });
    if (!ok) return;
    store.updateShop(shop.id, { status: to });
    toast(to === 'paused' ? 'The maison is resting. Reopen whenever you are ready.' : 'The maison is open once more.'); ctx.refresh();
  }; });
}
