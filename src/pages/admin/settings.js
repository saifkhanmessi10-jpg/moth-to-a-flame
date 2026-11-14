// Palace settings — residency, payouts, house standards, the Keeper's profile and preview tools.
import * as store from '../../store.js';
import { esc, money, pct, icon, toast, confirmDialog } from '../../ui.js';

export const meta = { title: 'Palace Settings' };

const SCHEDULES = [['weekly', 'Weekly'], ['fortnightly', 'Fortnightly'], ['monthly', 'Monthly']];
const rateFmt = (r) => pct(r, Number.isInteger(Math.round((r || 0) * 1000) / 10) ? 0 : 1);

export function render(ctx) {
  const s = store.getSettings();
  const open = s.applicationsOpen !== false;
  const schedule = s.payoutSchedule || 'weekly';
  const pending = store.listApplications('pending').length;
  const user = ctx.user || {};
  return `
  <div class="ad-two">
    <section class="panel">
      <div class="panel-head"><div><div class="eyebrow">Residency</div><h3 class="h3 mt-1">Applications</h3></div><span class="badge ${open ? 'badge-ok' : 'badge-mute'}">${open ? 'Open' : 'Closed'}</span></div>
      <label class="ad-setting">
        <span><b class="ad-name">Accept residency applications</b><span class="muted small ad-block">${open ? 'Makers can apply from the Palace. Each application waits for your decision.' : 'The application form is closed. Applications already received can still be decided.'}</span></span>
        <span class="switch"><input type="checkbox" data-applications ${open ? 'checked' : ''} aria-label="Accept residency applications"><span></span></span>
      </label>
      <a class="link-arrow mt-3" href="#/keeper/applications">${pending} awaiting review</a>
    </section>

    <section class="panel">
      <div class="panel-head"><div><div class="eyebrow">The Palace fee</div><h3 class="h3 mt-1">Currently ${rateFmt(s.feeRate)}</h3></div></div>
      <p class="muted small">The fee taken on every transaction, and any custom rate for a single maison, are managed alongside payouts so the effect on money is always in view.</p>
      <a class="btn btn-ghost btn-sm mt-3" href="#/keeper/finance">${icon('coins')} Open Fees &amp; Payouts</a>
    </section>
  </div>

  <section class="panel">
    <div class="panel-head"><div><div class="eyebrow">Payouts</div><h3 class="h3 mt-1">How maisons are paid</h3></div><span class="faint small">Now: ${esc(schedule)}, minimum ${money(s.minPayout || 0)}</span></div>
    <form data-payouts novalidate>
      <div class="form-grid">
        <label class="field"><span class="label">Payout schedule</span><select class="select" name="schedule">${SCHEDULES.map(([id, l]) => `<option value="${id}" ${id === schedule ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span class="label">Minimum payout (USD)</span><input class="input" type="number" name="min" min="0" max="10000" step="1" inputmode="decimal" value="${+((s.minPayout || 0) / 100).toFixed(2)}"></label>
      </div>
      <p class="hint" data-payouts-error hidden>Enter a minimum between 0 and 10,000 dollars.</p>
      <div class="row row-wrap mt-3"><button class="btn btn-gold btn-sm">Save payout settings</button><span class="hint" style="margin:0">Requests already made are not affected.</span></div>
    </form>
  </section>

  <section class="panel">
    <div class="panel-head"><div><div class="eyebrow">House standards</div><h3 class="h3 mt-1">What every maison agrees to</h3></div><span class="faint small">For reference</span></div>
    <ul class="ad-standards">
      <li><b>Hand-poured</b><span class="muted small">Every candle is poured by the maker, not bought in.</span></li>
      <li><b>Small batch</b><span class="muted small">Production stays limited; the Palace is not a wholesale outlet.</span></li>
      <li><b>Dispatch within two working days</b><span class="muted small">The promise made to patrons on every storefront.</span></li>
      <li><b>Late after three days</b><span class="muted small">A parcel still placed or in preparation after three days is flagged on the <a class="link" href="#/keeper/orders">orders page</a>.</span></li>
    </ul>
  </section>

  <section class="panel">
    <div class="panel-head"><div><div class="eyebrow">Keeper profile</div><h3 class="h3 mt-1">Your details</h3></div></div>
    <form data-profile novalidate>
      <div class="form-grid">
        <label class="field"><span class="label">Name</span><input class="input" name="name" maxlength="80" autocomplete="name" value="${esc(user.name || '')}"></label>
        <label class="field"><span class="label">Email</span><input class="input" type="email" name="email" maxlength="120" autocomplete="email" value="${esc(user.email || '')}"></label>
      </div>
      <p class="hint" data-profile-error hidden>Enter a name and a valid email address.</p>
      <div class="row row-wrap mt-3"><button class="btn btn-gold btn-sm">Save profile</button><span class="hint" style="margin:0">The email is also what you sign in with.</span></div>
    </form>
  </section>

  <section class="panel ad-danger-zone">
    <div class="panel-head"><div><div class="eyebrow">Preview tools</div><h3 class="h3 mt-1">Restore seeded data</h3></div></div>
    <p class="muted small" style="max-width:68ch">Returns the whole Palace to its original preview state: maisons, pieces, orders, payouts, applications, conversations and settings. Everything changed in this browser is discarded.</p>
    <button type="button" class="btn btn-danger btn-sm mt-3" data-reset>Restore seeded data</button>
  </section>`;
}

export function mount(root, ctx) {
  const apps = root.querySelector('[data-applications]');
  apps.onchange = () => {
    store.updateSettings({ applicationsOpen: apps.checked });
    toast(apps.checked ? 'Residency applications are open.' : 'Residency applications are closed.');
    ctx.refresh();
  };

  const payouts = root.querySelector('[data-payouts]');
  payouts.onsubmit = async (e) => {
    e.preventDefault();
    const schedule = payouts.querySelector('[name="schedule"]').value;
    const raw = payouts.querySelector('[name="min"]').value.trim();
    const dollars = Number(raw);
    const err = root.querySelector('[data-payouts-error]');
    if (raw === '' || !isFinite(dollars) || dollars < 0 || dollars > 10000 || !SCHEDULES.some(([id]) => id === schedule)) { err.hidden = false; return; }
    err.hidden = true;
    const minPayout = Math.round(dollars * 100);
    const ok = await confirmDialog({ title: 'Change payout settings?', body: `Maisons will be paid ${esc(schedule)}, with a minimum payout of ${money(minPayout)}. Requests already made are not affected.`, confirm: 'Save settings' });
    if (!ok) return;
    store.updateSettings({ payoutSchedule: schedule, minPayout });
    toast('Payout settings saved.');
    ctx.refresh();
  };

  const profile = root.querySelector('[data-profile]');
  profile.onsubmit = (e) => {
    e.preventDefault();
    const name = profile.querySelector('[name="name"]').value.trim();
    const email = profile.querySelector('[name="email"]').value.trim().toLowerCase();
    const err = root.querySelector('[data-profile-error]');
    const taken = store.listUsers().some((u) => u.id !== ctx.user.id && String(u.email).toLowerCase() === email);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || taken) {
      err.textContent = taken ? 'Another account already uses that email address.' : 'Enter a name and a valid email address.';
      err.hidden = false; return;
    }
    err.hidden = true;
    store.updateUser(ctx.user.id, { name, email });
    toast('Your profile has been saved.');
    ctx.refresh();
  };

  root.querySelector('[data-reset]').onclick = async () => {
    const ok = await confirmDialog({ title: 'Restore the seeded Palace?', body: 'Every change made in this browser will be discarded: decisions, orders, payouts, fee changes, curation, settings and your profile. This cannot be undone.', confirm: 'Restore seeded data', danger: true });
    if (!ok) return;
    store.resetDemo();
    if (store.getUser('u_admin')) store.signInAs('u_admin'); // the reset clears the session; keep the Keeper in the office
    toast('The preview has been restored.');
    ctx.navigate('/keeper');
  };
}
