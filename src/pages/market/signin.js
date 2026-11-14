// Sign in / create an account, with one-click preview access.
import * as store from '../../store.js';
import { esc, mothMark, formData, toast } from '../../ui.js';

export const meta = { title: 'Sign in' };

let mode = 'signin'; // 'signin' | 'create'
const homeFor = (user) => (user.role === 'admin' ? '/keeper' : user.role === 'vendor' ? '/atelier' : '/account');
const HOME_LABEL = { admin: 'Continue to the Keeper’s Office', vendor: 'Continue to your atelier', patron: 'Continue to your account' };
const DEMO = [
  ['u_patron', 'Patron', 'Celeste Ashworth'],
  ['u_vendor', 'Maison owner', 'Isolde Marchetti · Maison Soleil Noir'],
  ['u_admin', 'Palace Keeper', 'The whole Palace'],
];

const preview = () => `<aside class="mk-auth-preview" aria-label="Preview access">
  <div class="eyebrow">Preview access</div>
  <p class="small muted mt-1">Step into the Palace as any of its people.</p>
  <ul class="mt-2">
    ${DEMO.map(([id, role, who]) => (store.getUser(id) ? `<li><span class="grow"><span class="small">${role}</span><span class="tiny faint">${esc(who)}</span></span>
      <button class="btn btn-sm btn-ghost" type="button" data-enter="${id}">Enter</button></li>` : '')).join('')}
  </ul>
  <p class="preview-note mt-3">Every demo account uses the password “flame”.</p>
</aside>`;

export function render(ctx) {
  const user = ctx.user;
  if (user) {
    return `<section class="section"><div class="container mk-auth">
      <div class="panel panel-gold center mk-auth-card">
        ${mothMark(56)}
        <div class="eyebrow mt-3">You are signed in</div>
        <h1 class="h1 mt-2">${esc(user.name)}</h1>
        <p class="muted mt-1">${esc(user.email || '')}</p>
        <div class="mk-auth-actions mt-4">
          <a class="btn btn-gold btn-block" href="#${homeFor(user)}">${HOME_LABEL[user.role] || HOME_LABEL.patron}</a>
          <button class="btn btn-ghost btn-block" type="button" data-out>Sign out</button>
        </div>
      </div>
      ${preview()}
    </div></section>`;
  }
  const create = mode === 'create';
  return `<section class="section"><div class="container mk-auth">
    <div class="panel panel-gold mk-auth-card">
      <div class="center">${mothMark(48)}<h1 class="h2 mt-2">The private wings</h1>
        <p class="small muted mt-1">Your orders, saved pieces and the maisons you follow.</p></div>
      <div class="tabs mt-3" role="tablist">
        <button class="tab ${create ? '' : 'is-active'}" type="button" role="tab" id="mk-tab-signin" aria-controls="mk-pane-signin" aria-selected="${!create}" data-mode="signin">Sign in</button>
        <button class="tab ${create ? 'is-active' : ''}" type="button" role="tab" id="mk-tab-create" aria-controls="mk-pane-create" aria-selected="${create}" data-mode="create">Create account</button>
      </div>

      <form class="mt-3" id="mk-pane-signin" role="tabpanel" aria-labelledby="mk-tab-signin" data-form="signin" novalidate ${create ? 'hidden' : ''}>
        <div class="field"><label class="label" for="mk-si-email">Email</label><input class="input" id="mk-si-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label class="label" for="mk-si-pass">Password</label><input class="input" id="mk-si-pass" name="password" type="password" autocomplete="current-password" required></div>
        <p class="mk-err mt-2" data-error role="alert" hidden></p>
        <button class="btn btn-gold btn-block mt-3" type="submit">Sign in</button>
      </form>

      <form class="mt-3" id="mk-pane-create" role="tabpanel" aria-labelledby="mk-tab-create" data-form="create" novalidate ${create ? '' : 'hidden'}>
        <div class="field"><label class="label" for="mk-su-name">Full name</label><input class="input" id="mk-su-name" name="name" autocomplete="name" required></div>
        <div class="field"><label class="label" for="mk-su-email">Email</label><input class="input" id="mk-su-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label class="label" for="mk-su-pass">Password</label><input class="input" id="mk-su-pass" name="password" type="password" autocomplete="new-password" required></div>
        <p class="mk-err mt-2" data-error role="alert" hidden></p>
        <button class="btn btn-gold btn-block mt-3" type="submit">Create account</button>
      </form>

      <p class="small muted center mt-4">A maker? <a class="link" href="#/palace/open-a-maison">Apply for residency</a></p>
    </div>
    ${preview()}
  </div></section>`;
}

export function mount(root, ctx) {
  const enter = (user) => { if (user) ctx.navigate(homeFor(user)); };

  root.querySelectorAll('[data-enter]').forEach((b) => b.addEventListener('click', () => enter(store.signInAs(b.dataset.enter))));

  const out = root.querySelector('[data-out]');
  if (out) out.addEventListener('click', () => { store.signOut(); toast('You have been signed out.'); ctx.refresh(); });

  const tabs = [...root.querySelectorAll('[data-mode]')];
  const forms = [...root.querySelectorAll('[data-form]')];
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    mode = tab.dataset.mode;
    tabs.forEach((t) => { const on = t === tab; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); });
    forms.forEach((f) => { f.hidden = f.dataset.form !== mode; });
    forms.find((f) => !f.hidden)?.querySelector('input')?.focus();
  }));

  forms.forEach((form) => form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = formData(form);
    const err = form.querySelector('[data-error]');
    const fail = (message) => { err.textContent = message; err.hidden = false; };
    // Passwords are read raw: formData trims, and a password may begin or end with a space.
    const password = form.querySelector('[name="password"]').value;
    if (!d.email || !password || (form.dataset.form === 'create' && !d.name)) return fail('Please complete every field.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return fail('Please enter a complete email address.');
    const res = form.dataset.form === 'create' ? store.signUp({ name: d.name, email: d.email, password }) : store.signIn(d.email, password);
    if (!res.ok) return fail(res.error);
    err.hidden = true;
    enter(res.user);
  }));
}
