/* ===========================
   Loader
=========================== */
(() => {
  const loader = document.getElementById('loader');
  if (!loader) return;
  const hide = () => {
    if (loader.classList.contains('is-hidden')) return;
    loader.classList.add('is-hidden');
    setTimeout(() => loader.remove(), 350);
  };
  document.addEventListener('DOMContentLoaded', hide, { once: true });
  window.addEventListener('load', hide, { once: true });
  setTimeout(hide, 2000);
})();

/* ===========================
   Lazy-load fallback
=========================== */
document.addEventListener('DOMContentLoaded', () => {
  if (!('loading' in HTMLImageElement.prototype)) {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      const src = img.getAttribute('data-src') || img.getAttribute('src');
      if (src) img.src = src;
    });
  }
});

/* ===========================
   Reveal on scroll
=========================== */
const reveals = document.querySelectorAll('.reveal');
let scrollTimeout;
function revealOnScroll() {
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    for (const el of reveals) {
      const windowHeight = window.innerHeight;
      const elementTop = el.getBoundingClientRect().top;
      const elementVisible = 150;
      if (elementTop < windowHeight - elementVisible) el.classList.add('visible');
    }
    scrollTimeout = null;
  }, 100);
}
window.addEventListener('scroll', revealOnScroll);
revealOnScroll();

/* ===========================
   Theme toggle
=========================== */
const themeToggle = document.getElementById('theme-toggle');
const iconSun = document.getElementById('icon-sun');
const iconMoon = document.getElementById('icon-moon');

function prefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function getStoredTheme() {
  const t = localStorage.getItem('theme');
  return t === 'light' || t === 'dark' ? t : null;
}
function currentIsLight() {
  const stored = getStoredTheme();
  return stored ? stored === 'light' : !prefersDark();
}
function updateThemeIcons(isLight) {
  if (!iconSun || !iconMoon) return;
  iconSun.classList.toggle('is-active', isLight);
  iconMoon.classList.toggle('is-active', !isLight);
}
document.body.classList.toggle('light-theme', currentIsLight());
updateThemeIcons(currentIsLight());

themeToggle?.addEventListener('click', () => {
  const isLight = !document.body.classList.contains('light-theme');
  document.body.classList.toggle('light-theme', isLight);
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  updateThemeIcons(isLight);
});

/* ===========================
   Modals (focus trap + scroll lock)
=========================== */
const modalTriggers = document.querySelectorAll('[data-modal]');
const closeButtons = document.querySelectorAll('.close');
let activeModal = null;
let trapHandler = null;
let openerEl = null;
let backgroundEls = [];

function getFocusable(container) {
  return container
    ? container.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    : [];
}
function trapFocus(e) {
  if (!activeModal || e.key !== 'Tab') return;
  const focusables = Array.from(getFocusable(activeModal));
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}
function openModalById(id, opener) {
  const modal = document.getElementById(id);
  if (!modal || activeModal === modal) return;

  if (!backgroundEls.length) {
    backgroundEls = Array.from(document.body.children)
      .filter(el => el !== modal && !el.classList.contains('modal'));
  }
  backgroundEls.forEach(el => el.setAttribute('aria-hidden', 'true'));

  document.body.classList.add('no-scroll');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  modal.setAttribute('aria-modal', 'true');

  activeModal = modal;
  openerEl = opener || document.activeElement;
  trapHandler = (e) => trapFocus(e);
  document.addEventListener('keydown', trapHandler);

  const focusables = Array.from(getFocusable(modal));
  (focusables[0] || modal).focus();
}
function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.removeAttribute('aria-modal');

  const anyOpen = document.querySelector('.modal.is-open');
  if (!anyOpen) {
    document.body.classList.remove('no-scroll');
    backgroundEls.forEach(el => el.removeAttribute('aria-hidden'));
    backgroundEls = [];
  }

  if (trapHandler) document.removeEventListener('keydown', trapHandler);
  trapHandler = null;
  activeModal = null;

  if (openerEl) { openerEl.focus(); openerEl = null; }
}

modalTriggers.forEach(trigger => {
  const go = (e) => {
    if (trigger.tagName === 'A') e.preventDefault();
    const id = trigger.getAttribute('data-modal');
    if (id) openModalById(id, trigger);
  };
  trigger.addEventListener('click', go);
  trigger.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); }
  });
});
closeButtons.forEach(btn => {
  const doClose = () => closeModal(btn.closest('.modal'));
  btn.addEventListener('click', doClose);
  btn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doClose(); }
  });
});
window.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) closeModal(e.target);
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.is-open').forEach(m => closeModal(m));
  }
});

/* ===========================
   Mobile menu + active underline
=========================== */
const menuToggle = document.getElementById('menu-toggle');
const navbar = document.getElementById('navbar');

menuToggle?.addEventListener('click', () => {
  navbar?.classList.toggle('open');
  const isOpen = navbar?.classList.contains('open');
  document.body.classList.toggle('no-scroll', isOpen);
  menuToggle.setAttribute('aria-expanded', String(!!isOpen));
  if (isOpen) {
    const firstLink = navbar.querySelector('a');
    firstLink?.focus();
  }
  setActiveLink(); setTimeout(updateNavUnderline, 0);
});
document.getElementById('close-menu')?.addEventListener('click', () => {
  navbar?.classList.remove('open');
  document.body.classList.remove('no-scroll');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.focus();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navbar?.classList.contains('open')) {
    navbar.classList.remove('open');
    document.body.classList.remove('no-scroll');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.focus();
  }
});

const MOBILE_MS = 280;
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', e => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile && navbar?.classList.contains('open')) {
      e.preventDefault();
      const targetId = link.getAttribute('href').replace('#', '');
      const target = document.getElementById(targetId);
      navbar.classList.remove('open');
      document.body.classList.remove('no-scroll');
      menuToggle?.setAttribute('aria-expanded', 'false');
      setTimeout(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }), MOBILE_MS);
    } else {
      navbar?.classList.remove('open');
      document.body.classList.remove('no-scroll');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }
  });
});

const navEl = document.getElementById('navbar');
const navLinks = navEl ? navEl.querySelectorAll('a') : [];
const navUnderline = document.getElementById('nav-underline');
const linkTargets = Array.from(navLinks).map(a => a.getAttribute('href')).filter(h => h && h.startsWith('#')).map(h => h.slice(1));
const sections = Array.from(document.querySelectorAll('section')).filter(sec => linkTargets.includes(sec.id));

function activeSectionId(){
  let current='';
  sections.forEach(s=>{ const top=s.offsetTop-200; if (scrollY>=top) current=s.id;});
  return current;
}
function setActiveLink(){
  const cur=activeSectionId();
  navLinks.forEach(a=>{
    a.classList.remove('active');
    if (cur && a.getAttribute('href').includes(cur)) a.classList.add('active');
  });
}
function updateNavUnderline(){
  if (window.matchMedia('(max-width: 768px)').matches || navEl?.classList.contains('open')) {
    if (navUnderline){ navUnderline.style.width='0px'; navUnderline.style.transform='translateX(0)'; }
    return;
  }
  const target = Array.from(navLinks).find(a=>a.classList.contains('active')) || navLinks[0];
  if (!target || !navUnderline || !navEl) return;
  const navRect = navEl.getBoundingClientRect();
  const linkRect = target.getBoundingClientRect();
  const left = linkRect.left - navRect.left;
  const width = linkRect.width;
  navUnderline.style.width = `${width}px`;
  navUnderline.style.transform = `translateX(${left}px)`;
}
let navTick;
function throttledNav(){ if (navTick) return; navTick = setTimeout(()=>{ setActiveLink(); updateNavUnderline(); navTick=null; }, 100); }
window.addEventListener('scroll', throttledNav);
window.addEventListener('resize', throttledNav);
document.addEventListener('DOMContentLoaded', throttledNav);
window.addEventListener('load', throttledNav);
window.addEventListener('hashchange', () => { setActiveLink(); updateNavUnderline(); });
document.querySelector('.logo')?.addEventListener('click', () => {
  setTimeout(() => { setActiveLink(); updateNavUnderline(); }, 300);
});

/* ===========================
   Project search
=========================== */
const projectSearchInput = document.getElementById('project-search');
const projectCards = document.querySelectorAll('.project-card');
const projectCountEl = document.getElementById('project-count');
const noResultsEl = document.createElement('p');
noResultsEl.textContent = 'No projects found.';
noResultsEl.classList.add('no-results');
noResultsEl.style.display='none';
document.getElementById('project-list')?.appendChild(noResultsEl);

function updateProjectResultsCount(n){
  if (projectCountEl) projectCountEl.textContent = `${n} ${n===1?'project':'projects'}`;
}
if (projectSearchInput){
  updateProjectResultsCount(projectCards.length);
  projectSearchInput.addEventListener('input', ()=>{
    const q = projectSearchInput.value.toLowerCase().trim();
    let visible=0;
    projectCards.forEach(c=>{
      const match = c.textContent.toLowerCase().includes(q);
      c.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    noResultsEl.style.display = visible===0 ? 'block' : 'none';
    updateProjectResultsCount(visible);
    throttledNav();
  });
}


(function setupReferencesMarquee(){
  const host = document.getElementById('ref-list');
  if (!host || host.dataset.marqueeInit === 'true') return;
  host.dataset.marqueeInit = 'true';

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pauseBtn = document.getElementById('ref-pause');
  let PAUSED = false;
  function setPaused(next){
    PAUSED = !!next;
    if (pauseBtn){
      pauseBtn.setAttribute('aria-pressed', String(PAUSED));
      pauseBtn.textContent = PAUSED ? 'Play' : 'Pause';
      pauseBtn.setAttribute('aria-label', PAUSED ? 'Resume auto-scroll' : 'Pause auto-scroll');
    }
  }
  pauseBtn?.addEventListener('click', (e) => { e.stopPropagation(); setPaused(!PAUSED); });

  host.addEventListener('click', e=>{
    const card = e.target.closest('.ref-card');
    if (!card || !host.contains(card)) return;
    if (e.target.closest('a,button')) return;
    const id = card.getAttribute('data-modal'); if (id) openModalById(id, card);
  });
  host.addEventListener('keydown', e=>{
    const card = e.target.closest('.ref-card');
    if (!card || !host.contains(card)) return;
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      const id = card.getAttribute('data-modal'); if (id) openModalById(id, card);
    }
  });

  const originals = Array.from(host.children);
  if (!originals.length) return;

  const inner = document.createElement('div');
  inner.className = 'refs-inner';
  Object.assign(inner.style, {
    display: 'flex',
    gap: '1rem',
    width: 'max-content',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
    transform: 'translate3d(0px,0,0)'
  });

  const pushSet = (focusable) => originals.forEach(n=>{
    const c = n.cloneNode(true);
    c.style.flex = '0 0 auto';
    if (!focusable) c.tabIndex = -1; 
    inner.appendChild(c);
  });
  pushSet(true);   
  pushSet(false);  

  host.innerHTML = '';
  host.appendChild(inner);
  host.style.overflowX = 'hidden';
  host.style.overflowY = 'visible';

  const speedAttr = parseFloat(host.getAttribute('data-speed'));
  const SPEED = Number.isFinite(speedAttr) ? Math.max(1, Math.min(speedAttr, 200)) : 20;

  let travel = 1;     
  let basis  = 0;     
  let startTime = performance.now();
  let carried   = 0;  

  function measureTravelExact() {
    return Math.max(1, inner.scrollWidth / 2);
  }

  function getCurrentX(){
    const m = inner.style.transform.match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : 0;
  }

  function layout(preserve = false){
    const oldTravel = travel;
    const visualX   = -getCurrentX(); 

    const hostW = host.clientWidth || 0;
    const maxCard = 28 * 16; 
    basis = Math.min(hostW, maxCard);

    inner.querySelectorAll('.ref-card').forEach(c=>{
      c.style.flex     = `0 0 ${basis}px`;
      c.style.maxWidth = `${basis}px`;
    });

    travel = measureTravelExact();

    if (preserve && oldTravel > 0) {
      const prog   = ((visualX % oldTravel) + oldTravel) % oldTravel;     
      const mapped = (prog / oldTravel) * travel;
      carried      = mapped;
      startTime    = performance.now();
      inner.style.transform = `translate3d(${-mapped}px,0,0)`;
    } else {
      carried   = 0;
      startTime = performance.now();
      inner.style.transform = 'translate3d(0px,0,0)';
    }
  }

  function tick(now){
    if (!reduceMotion && !PAUSED) {
      const dt       = (now - startTime) / 1000;    
      const distance = (dt * SPEED) + carried;      
      const mod      = ((distance % travel) + travel) % travel; 
      const x        = -mod;                        
      inner.style.transform = `translate3d(${x}px,0,0)`;
    }
    requestAnimationFrame(tick);
  }

  layout(false);
  requestAnimationFrame(tick);

  const debouncedLayout = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => layout(true), 120); }; })();
  window.addEventListener('resize', debouncedLayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => layout(true)).catch(()=>{});
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') layout(true); });
})();

/* ===========================
   Contact form — EmailJS (Gmail)
=========================== */
(() => {
  const form       = document.getElementById('contact-form');
  if (!form) return;

  const nameEl     = document.getElementById('name');
  const emailEl    = document.getElementById('email');
  const messageEl  = document.getElementById('message');
  const submitEl   = document.getElementById('contact-submit');
  const honeyEl    = document.getElementById('website');

  const errName    = document.getElementById('err-name');
  const errEmail   = document.getElementById('err-email');
  const errMessage = document.getElementById('err-message');
  const counter    = document.getElementById('message-count');

  const SERVICE_ID  = 'service_d9d62zl';
  const TEMPLATE_ID = 'template_fju8439';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const minLen   = parseInt(messageEl?.getAttribute('minlength') || '10', 10);

  let submittedOnce = false;

  function setError(el, msg, errEl, show) {
    el.classList.toggle('is-invalid', !!msg && !!show);
    el.setAttribute('aria-invalid', msg && show ? 'true' : 'false');
    errEl.textContent = show ? (msg || '') : '';
  }

  function validate({ showErrors = submittedOnce } = {}) {
    let ok = true;

    let nameMsg = '';
    if (!nameEl.value.trim()) nameMsg = 'Please enter your name.';
    ok = ok && !nameMsg;
    setError(nameEl, nameMsg, errName, showErrors);

    let emailMsg = '';
    const e = emailEl.value.trim();
    if (!e) emailMsg = 'Please enter your email.';
    else if (!EMAIL_RE.test(e)) emailMsg = 'Please enter a valid email.';
    ok = ok && !emailMsg;
    setError(emailEl, emailMsg, errEmail, showErrors);

    let msgMsg = '';
    const m = messageEl.value.trim();
    if (!m || m.length < minLen) msgMsg = `Message must be at least ${minLen} characters.`;
    ok = ok && !msgMsg;
    setError(messageEl, msgMsg, errMessage, showErrors);

    if (honeyEl && honeyEl.value) ok = false;

    return ok;
  }

  function updateCount() {
    if (!counter) return;
    const len = messageEl.value.length;
    counter.textContent = `${len}/${minLen}+ characters`;
  }

  submitEl.disabled = false;
  submitEl.setAttribute('aria-disabled', 'false');
  updateCount();
  validate({ showErrors: false });

  ['input', 'blur'].forEach(evt => {
    nameEl.addEventListener(evt,    () => validate());
    emailEl.addEventListener(evt,   () => validate());
    messageEl.addEventListener(evt, () => { updateCount(); validate(); });
  });

  let statusEl = document.createElement('p');
  statusEl.setAttribute('role', 'status');
  statusEl.setAttribute('aria-live', 'polite');
  statusEl.style.marginTop = '.4rem';
  statusEl.style.fontWeight = '700';
  statusEl.textContent = '';
  form.appendChild(statusEl);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    submittedOnce = true;

    if (!validate({ showErrors: true })) {
      const firstInvalid =
        (!nameEl.value.trim()   && nameEl)  ||
        (!emailEl.value.trim()  && emailEl) ||
        (!EMAIL_RE.test(emailEl.value.trim()) && emailEl) ||
        ((messageEl.value.trim().length < minLen) && messageEl);
      firstInvalid?.focus();
      return;
    }

    if (!window.emailjs) {
      statusEl.textContent = 'EmailJS not loaded. Check the script include.';
      return;
    }

    try {
      submitEl.disabled = true;
      submitEl.textContent = 'Sending…';
      statusEl.textContent = '';

      const params = {
        name:    nameEl.value.trim(),
        email:   emailEl.value.trim(),
        message: messageEl.value.trim()
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, params);

      form.reset();
      updateCount();

      validate({ showErrors: false });

      statusEl.textContent = 'Thanks! Your message has been sent.';
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Sorry, there was a problem sending your message. Please try again.';
    } finally {
      submitEl.disabled = false;
      submitEl.textContent = 'Send message';
    }
  });
})();

