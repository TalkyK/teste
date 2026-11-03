import { addInteraction, fetchBusinesses, upsertBusiness } from './supabase-client.js';

const STORAGE_KEY = 'procure-aonde-data-v1';
const SESSION_KEY = 'procure-aonde-session-v1';
const BUSINESSES_CLEAR_KEY = 'procure-aonde-businesses-clear-v1';

const categories = [
  { name: 'Alimentação', icon: '🍴', tone: 'food' },
  { name: 'Beleza', icon: '✦', tone: 'beauty' },
  { name: 'Saúde', icon: '♡', tone: 'health' },
  { name: 'Manutenção', icon: '⌁', tone: 'home' },
  { name: 'Transporte', icon: '⌖', tone: 'transport' },
  { name: 'Educação', icon: '▣', tone: 'education' },
  { name: 'Eventos', icon: '♢', tone: 'events' },
  { name: 'Lojas', icon: '▤', tone: 'shops' },
  { name: 'Serviços profissionais', icon: '◆', tone: 'professional' },
];

const starterBusinesses = [];

const state = { businesses: [], query: '', location: '', category: '', sort: 'relevance', editingId: null };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const THEME_KEY = 'procure-aonde-theme';

function setTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  const toggle = $('.theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
    toggle.querySelector('.theme-toggle-icon').textContent = isDark ? '☀' : '☾';
    toggle.querySelector('.theme-toggle-label').textContent = isDark ? 'Modo claro' : 'Modo escuro';
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const preferredTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setTheme(preferredTheme);
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, nextTheme);
  setTheme(nextTheme);
}

async function loadData() {
  try {
    state.businesses = await fetchBusinesses();
  } catch (error) {
    console.error('Não foi possível carregar os dados do Supabase.', error);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      state.businesses = Array.isArray(saved) ? saved : starterBusinesses;
    } catch {
      state.businesses = starterBusinesses;
    }
  }
}

function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.businesses)); }
function categoryInfo(name) { return categories.find((category) => category.name === name) || categories[0]; }
function totalClicks(business) { return Object.values(business.interactions || {}).reduce((sum, value) => sum + value, 0); }
function escapeHtml(value = '') { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])); }
function iconFor(business) { return categoryInfo(business.category).icon; }

function renderCategories() {
  $('#drawer-list').innerHTML = `<a class="drawer-profile-link" href="htmladm.html">Perfil</a><button data-category="">Todas as categorias</button>${categories.map((category) => `<button data-category="${category.name}">${category.icon} &nbsp; ${category.name}</button>`).join('')}`;
}

function getVisibleBusinesses() {
  const normalizedQuery = state.query.toLocaleLowerCase();
  const normalizedLocation = state.location.toLocaleLowerCase();
  let visible = state.businesses.filter((business) => business.status === 'published' &&
    (!normalizedQuery || `${business.name} ${business.category} ${business.description}`.toLocaleLowerCase().includes(normalizedQuery)) &&
    (!normalizedLocation || business.location.toLocaleLowerCase().includes(normalizedLocation)) &&
    (!state.category || business.category === state.category));
  if (state.sort === 'clicks') visible.sort((a, b) => totalClicks(b) - totalClicks(a));
  if (state.sort === 'recent') visible.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return visible;
}

function businessCard(business) {
  const category = categoryInfo(business.category);
  const avatar = business.logo ? `<span class="business-avatar business-logo-avatar"><img src="${escapeHtml(business.logo)}" alt="Logo de ${escapeHtml(business.name)}" /></span>` : `<span class="business-avatar">${iconFor(business)}</span>`;
  const actions = [
    business.whatsapp && `<a class="action-button main" href="${escapeHtml(business.whatsapp)}" target="_blank" rel="noopener" data-interaction="whatsapp" data-id="${business.id}">WhatsApp</a>`,
    business.instagram && `<a class="action-button" href="${escapeHtml(business.instagram)}" target="_blank" rel="noopener" data-interaction="instagram" data-id="${business.id}">Instagram</a>`,
    business.map && `<a class="action-button" href="${escapeHtml(business.map)}" target="_blank" rel="noopener" data-interaction="location" data-id="${business.id}">Localização</a>`,
  ].filter(Boolean).join('');
  return `<article class="business-card"><button class="business-cover ${category.tone}" data-business="${business.id}" aria-label="Ver detalhes de ${escapeHtml(business.name)}">${avatar}</button><div class="business-body"><span class="business-category">${escapeHtml(business.category)}</span><h3>${escapeHtml(business.name)}</h3><p class="business-description">${escapeHtml(business.description)}</p><div class="business-meta"><span>⌖ ${escapeHtml(business.location)}</span><span>◷ ${escapeHtml(business.hours || 'Consulte')}</span></div><div class="business-actions">${actions}<button class="action-button" data-business="${business.id}">Detalhes</button></div></div></article>`;
}

function renderBusinesses() {
  const visible = getVisibleBusinesses();
  $('#business-grid').innerHTML = visible.length ? visible.map(businessCard).join('') : '<div class="empty-state"><h3>Nenhuma empresa encontrada</h3><p>Tente buscar por outro termo ou limpe os filtros.</p><button class="outline-button" data-action="clear-filters">Limpar filtros</button></div>';
  const filters = [state.query && `Busca: “${escapeHtml(state.query)}”`, state.location && `Local: ${escapeHtml(state.location)}`, state.category && `Categoria: ${escapeHtml(state.category)}`].filter(Boolean);
  $('#active-filters').innerHTML = filters.length ? `${filters.join(' · ')} <button class="text-button" data-action="clear-filters">Limpar</button>` : '';
}

async function recordInteraction(id, type) {
  const business = state.businesses.find((item) => item.id === id);
  if (!business) return;
  const key = type === 'view' ? 'view' : type;
  business.interactions = business.interactions || {};
  business.interactions[key] = (business.interactions[key] || 0) + 1;
  saveData();
  try {
    await addInteraction(id, key);
  } catch (error) {
    console.error('Não foi possível registrar a interação no Supabase.', error);
  }
}

function openBusiness(id) {
  const business = state.businesses.find((item) => item.id === id);
  if (!business) return;
  recordInteraction(id, 'view');
  const category = categoryInfo(business.category);
  const contactLinks = [
    business.whatsapp && `<a class="primary-button" href="${escapeHtml(business.whatsapp)}" target="_blank" rel="noopener" data-interaction="whatsapp" data-id="${id}">Conversar no WhatsApp</a>`,
    business.instagram && `<a class="outline-button" href="${escapeHtml(business.instagram)}" target="_blank" rel="noopener" data-interaction="instagram" data-id="${id}">Ver Instagram</a>`,
    business.map && `<a class="outline-button" href="${escapeHtml(business.map)}" target="_blank" rel="noopener" data-interaction="location" data-id="${id}">Abrir localização</a>`,
    business.order && `<a class="outline-button" href="${escapeHtml(business.order)}" target="_blank" rel="noopener" data-interaction="order" data-id="${id}">Fazer um pedido</a>`,
  ].filter(Boolean).join('');
  const avatar = business.logo ? `<span class="business-avatar business-logo-avatar"><img src="${escapeHtml(business.logo)}" alt="Logo de ${escapeHtml(business.name)}" /></span>` : `<span class="business-avatar">${iconFor(business)}</span>`;
  $('#modal-content').innerHTML = `<div class="modal-hero"><div class="business-cover ${category.tone}">${avatar}</div><div><span class="business-category">${escapeHtml(business.category)}</span><h2 id="modal-title">${escapeHtml(business.name)}</h2><p class="business-meta">⌖ ${escapeHtml(business.location)}</p></div></div><p class="modal-description">${escapeHtml(business.description)}</p><p class="business-meta">◷ ${escapeHtml(business.hours || 'Horário não informado')}</p><div class="modal-stat">Este anúncio já recebeu ${totalClicks(business)} interações.</div><div class="modal-actions">${contactLinks}</div>`;
  $('#modal-backdrop').hidden = false; $('#business-modal').hidden = false;
}

function closeModal() { $('#modal-backdrop').hidden = true; $('#business-modal').hidden = true; }
function setCategory(category) { state.category = category; renderCategories(); renderBusinesses(); closeDrawer(); $('#results').scrollIntoView({ behavior: 'smooth' }); }
function closeDrawer() { $('#services-drawer').classList.remove('open'); $('#services-drawer').setAttribute('aria-hidden', 'true'); $('#drawer-backdrop').hidden = true; $('.services-toggle').setAttribute('aria-expanded', 'false'); }
function openDrawer() { $('#services-drawer').classList.add('open'); $('#services-drawer').setAttribute('aria-hidden', 'false'); $('#drawer-backdrop').hidden = false; $('.services-toggle').setAttribute('aria-expanded', 'true'); }
function toggleDrawer() { $('#services-drawer').classList.contains('open') ? closeDrawer() : openDrawer(); }

async function showAdmin() {
  await dataReady;
  if (!hasAdminSession()) { showAuth(); return; }
  if (!getOwnedBusiness()) { showCompanyOnboarding(); return; }
  $('#admin-onboarding').hidden = true; $('#admin-view').hidden = false; document.body.classList.add('admin-active'); $('#admin-panels').appendChild($('#profile-panel')); $('#profile-panel').classList.remove('onboarding-profile'); $('#profile-view').hidden = false; $('#profile-editor').hidden = true; renderAdmin(); window.scrollTo(0, 0);
}
function showPublic() { $('#admin-view').hidden = true; $('#admin-onboarding').hidden = true; document.body.classList.remove('admin-active'); window.scrollTo(0, 0); }
function hasAdminSession() {
  try { return Boolean(JSON.parse(localStorage.getItem(SESSION_KEY))?.registeredAt); } catch { return false; }
}
function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {}; } catch { return {}; } }
function getOwnedBusiness() { const id = getSession().businessId; return id ? state.businesses.find((business) => business.id === id) : null; }
function whatsappLink(value = '') {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const number = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${number}`;
}
function whatsappNumber(value = '') {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('55') ? digits.slice(2) : digits;
}
function safeLink(value = '') { return /^https?:\/\//i.test(value) ? value : ''; }
function showAuth() { $('#auth-modal').hidden = false; $('#modal-backdrop').hidden = false; }
function closeAuth() { if (!hasAdminSession()) return; $('#auth-modal').hidden = true; if ($('#business-modal').hidden) $('#modal-backdrop').hidden = true; }
function logout() { localStorage.removeItem(SESSION_KEY); showPublic(); showAuth(); }
function showCompanyOnboarding() { $('#admin-view').hidden = true; $('#admin-onboarding').hidden = false; document.body.classList.remove('admin-active'); $('#profile-panel-slot').appendChild($('#profile-panel')); $('#profile-panel').classList.add('onboarding-profile'); $('#profile-view').hidden = true; $('#profile-editor').hidden = false; resetForm(); window.scrollTo(0, 0); }
function renderAnalytics() {
  const businesses = [getOwnedBusiness()].filter(Boolean);
  const totals = businesses.reduce((acc, item) => {
    Object.keys(acc).forEach((key) => { acc[key] += item.interactions[key] || 0; });
    return acc;
  }, { view: 0, whatsapp: 0, instagram: 0, location: 0, order: 0 });
  const labels = [['Visualizações', totals.view], ['WhatsApp', totals.whatsapp], ['Instagram', totals.instagram], ['Localização', totals.location], ['Pedidos', totals.order]];
  const max = Math.max(...labels.map(([, value]) => value), 1);
  $('#analytics-bars').innerHTML = labels.map(([label, value]) => `<div class="analytics-row"><span>${label}</span><div class="analytics-track"><i style="width:${Math.max((value / max) * 100, value ? 5 : 0)}%"></i></div><strong>${value}</strong></div>`).join('');
}
function renderAdmin() {
  const businesses = [getOwnedBusiness()].filter(Boolean);
  const totals = businesses.reduce((acc, item) => { Object.keys(acc).forEach((key) => { acc[key] += item.interactions[key] || 0; }); return acc; }, { view: 0, whatsapp: 0, instagram: 0, location: 0, order: 0 });
  const interactions = Object.values(totals).reduce((sum, value) => sum + value, 0);
  $('#stats-grid').innerHTML = [['Interações totais', interactions, '↑ Visão geral'], ['Visualizações', totals.view, '↑ Anúncios vistos'], ['WhatsApp', totals.whatsapp, '↑ Cliques de contato'], ['Localização', totals.location, '↑ Rotas abertas']].map(([label, value, note]) => `<div class="stat-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
  renderProfile(businesses[0]);
  renderAnalytics();
}

function renderProfile(business) {
  if (!business) return;
  fillForm(business.id);
  $('#editor-title').textContent = 'Perfil da Empresa'; $('#profile-status').textContent = business.status === 'published' ? 'Publicado' : 'Rascunho';
  $('#business-logo-preview').style.backgroundImage = business.logo ? `url("${business.logo}")` : '';
  $('#business-logo-placeholder').hidden = Boolean(business.logo);
  $('#profile-name').textContent = business.name;
  $('#profile-category').textContent = business.category;
  $('#profile-description').textContent = business.description;
  $('#profile-location-cover').textContent = business.location;
  $('#profile-hours').textContent = business.hours || 'Horário não informado';
  $('#profile-info-category').textContent = business.category;
  $('#profile-info-location').textContent = business.location;
  $('#profile-info-hours').textContent = business.hours || 'Não informado';
  $('#profile-info-order').textContent = business.order ? 'Link disponível' : 'Não informado';
  $('#profile-logo').style.backgroundImage = business.logo ? `url("${business.logo}")` : '';
  $('#profile-logo-placeholder').hidden = Boolean(business.logo);
  $('#profile-cover').style.backgroundImage = business.cover ? `url("${business.cover}")` : '';
  const totals = business.interactions || {};
  const interactions = Object.entries(totals).filter(([key]) => key !== 'view').reduce((sum, [, value]) => sum + value, 0);
  $('#profile-interactions').textContent = interactions;
  $('#profile-views').textContent = totals.view || 0;
  $('#profile-whatsapp').textContent = totals.whatsapp || 0;
  setProfileLink('#profile-whatsapp-link', whatsappLink(business.whatsapp), 'WhatsApp', 'whatsapp');
  setProfileLink('#profile-order-link', safeLink(business.order), 'Fazer pedido', 'order');
  setProfileLink('#profile-instagram-link', safeLink(business.instagram), 'Instagram', 'instagram');
  setProfileLink('#profile-map-link', safeLink(business.map), 'Como chegar', 'location');
  renderProfilePerformance(business);
}
function setProfileLink(selector, href, label, interaction) { const link = $(selector); link.href = href || '#'; link.classList.toggle('is-disabled', !href); link.setAttribute('aria-disabled', String(!href)); link.dataset.profileInteraction = interaction; link.textContent = label; }
function renderProfilePerformance(business) {
  const values = [['Visualizações', business.interactions?.view || 0], ['WhatsApp', business.interactions?.whatsapp || 0], ['Instagram', business.interactions?.instagram || 0], ['Localização', business.interactions?.location || 0], ['Pedidos', business.interactions?.order || 0]];
  const max = Math.max(...values.map(([, value]) => value), 1);
  $('#profile-performance-bars').innerHTML = values.map(([label, value]) => `<div class="profile-bar"><div><span>${label}</span><strong>${value}</strong></div><i style="width:${Math.max((value / max) * 100, value ? 5 : 0)}%"></i></div>`).join('');
}
function resetForm() { state.editingId = null; state.logoData = ''; state.coverData = ''; $('#editor-title').textContent = 'Cadastro da empresa'; $('#business-form').reset(); $('#business-id').value = ''; $('#business-published').checked = true; $('#business-logo-preview').style.backgroundImage = ''; $('#business-logo-placeholder').hidden = false; $('#form-message').textContent = ''; }
function fillForm(id) {
  const business = state.businesses.find((item) => item.id === id); if (!business) return;
  state.editingId = id; $('#business-id').value = id;
  [['business-name', 'name'], ['business-description', 'description'], ['business-location', 'location'], ['business-hours', 'hours'], ['business-instagram', 'instagram'], ['business-map', 'map'], ['business-order', 'order']].forEach(([field, key]) => { $(`#${field}`).value = business[key] || ''; });
  $('#business-whatsapp').value = whatsappNumber(business.whatsapp || '');
  $('#business-category').value = business.category; $('#business-published').checked = business.status === 'published'; $('#form-message').textContent = ''; $('#profile-panel').scrollIntoView({ behavior: 'smooth' });
}

function handleBusinessSubmit(event) {
  event.preventDefault();
  const submitButton = $('#business-form button[type="submit"]');
  if (submitButton.disabled) return;
  const id = state.editingId || `business-${Date.now()}`;
  const previous = state.businesses.find((item) => item.id === id);
  const business = { id, name: $('#business-name').value.trim(), category: $('#business-category').value, description: $('#business-description').value.trim(), location: $('#business-location').value.trim(), hours: $('#business-hours').value.trim(), whatsapp: whatsappLink($('#business-whatsapp').value.trim()), instagram: $('#business-instagram').value.trim(), map: $('#business-map').value.trim(), order: $('#business-order').value.trim(), logo: state.logoData || previous?.logo || '', cover: state.coverData || previous?.cover || '', status: $('#business-published').checked ? 'published' : 'draft', createdAt: previous?.createdAt || new Date().toISOString().slice(0, 10), interactions: previous?.interactions || { view: 0, whatsapp: 0, instagram: 0, location: 0, order: 0 } };
  if (!business.name || !business.description || !business.location) { $('#form-message').textContent = 'Preencha nome, descrição e localização.'; return; }
  if (previous) state.businesses = state.businesses.map((item) => item.id === id ? business : item); else state.businesses.push(business);
  saveData();
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...getSession(), businessId: id }));
  state.logoData = '';
  state.coverData = '';
  showAdmin();
  renderBusinesses();
  submitButton.disabled = true;
  submitButton.textContent = 'Salvando...';
  upsertBusiness(business)
    .then(() => { $('#form-message').textContent = 'Dados salvos com sucesso.'; })
    .catch((error) => {
      console.error('Não foi possível salvar a empresa no Supabase.', error);
      $('#profile-view').hidden = true;
      $('#profile-editor').hidden = false;
      $('#form-message').textContent = 'Não foi possível salvar os dados. Tente novamente.';
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.textContent = 'Salvar alterações';
    });
}

function search(query, location = $('#hero-location').value) { state.query = query.trim(); state.location = location.trim(); $('#hero-query').value = state.query; $('#hero-location').value = state.location; renderBusinesses(); $('#results').scrollIntoView({ behavior: 'smooth' }); }

document.addEventListener('click', (event) => {
  const categoryButton = event.target.closest('[data-category]'); if (categoryButton) { setCategory(categoryButton.dataset.category); return; }
  const businessButton = event.target.closest('[data-business]'); if (businessButton) { openBusiness(businessButton.dataset.business); return; }
  const interaction = event.target.closest('[data-interaction]'); if (interaction) { recordInteraction(interaction.dataset.id, interaction.dataset.interaction); return; }
  const profileInteraction = event.target.closest('[data-profile-interaction]'); if (profileInteraction && !profileInteraction.classList.contains('is-disabled')) { const business = getOwnedBusiness(); if (business) { recordInteraction(business.id, profileInteraction.dataset.profileInteraction); renderProfile(business); } return; }
  const editButton = event.target.closest('[data-edit]'); if (editButton) { fillForm(editButton.dataset.edit); return; }
  const profileTab = event.target.closest('[data-profile-tab]'); if (profileTab) { const tab = profileTab.dataset.profileTab; $$('.profile-tabs button').forEach((button) => button.classList.toggle('active', button === profileTab)); $$('.profile-tab-content').forEach((content) => content.classList.toggle('active', content.id === `profile-${tab}`)); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'admin') showAdmin(); if (action === 'home') showPublic(); if (action === 'open-services') openDrawer(); if (action === 'toggle-services') toggleDrawer(); if (action === 'close-services') closeDrawer(); if (action === 'close-modal') closeModal(); if (action === 'close-auth') closeAuth(); if (action === 'logout') logout(); if (action === 'toggle-theme') toggleTheme(); if (action === 'edit-profile') { $('#profile-view').hidden = true; $('#profile-editor').hidden = false; } if (action === 'close-profile-editor') { $('#profile-editor').hidden = true; $('#profile-view').hidden = false; } if (action === 'clear-filters') { state.query = ''; state.location = ''; state.category = ''; $('#hero-query').value = ''; $('#hero-location').value = ''; renderCategories(); renderBusinesses(); }
});
if ($('#hero-search-form')) $('#hero-search-form').addEventListener('submit', (event) => { event.preventDefault(); search($('#hero-query').value); });
if ($('#sort-select')) $('#sort-select').addEventListener('change', (event) => { state.sort = event.target.value; renderBusinesses(); });
if ($('#business-form')) $('#business-form').addEventListener('submit', handleBusinessSubmit);
if ($('#business-logo')) $('#business-logo').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => { state.logoData = reader.result; $('#business-logo-preview').style.backgroundImage = `url("${reader.result}")`; $('#business-logo-placeholder').hidden = true; });
  reader.readAsDataURL(file);
});
if ($('#business-cover')) $('#business-cover').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => { state.coverData = reader.result; });
  reader.readAsDataURL(file);
});
if ($('#auth-form')) $('#auth-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!$('#auth-form').reportValidity()) return;
  if (!/^\d{8}$/.test($('#auth-password').value)) { $('#auth-message').textContent = 'A senha deve ter exatamente 8 dígitos.'; return; }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: $('#auth-email').value.trim(), registeredAt: Date.now() }));
  $('#auth-message').textContent = 'Cadastro concluído.';
  closeAuth();
  showAdmin();
});
if ($('#drawer-backdrop')) $('#drawer-backdrop').addEventListener('click', closeDrawer);
if ($('#modal-backdrop')) $('#modal-backdrop').addEventListener('click', () => { if ($('#auth-modal').hidden) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeDrawer(); closeModal(); closeAuth(); } });

initializeTheme();
const dataReady = loadData();
dataReady.then(() => {
  if ($('#business-grid')) {
    renderCategories();
    renderBusinesses();
  }
  if (document.body.dataset.page === 'admin') {
    $('#business-category').innerHTML = categories.map((category) => `<option value="${category.name}">${category.name}</option>`).join('');
    if (hasAdminSession()) showAdmin();
    else showAuth();
  }
});
if ($('#profile-view')) $$('.profile-tab-content').forEach((content, index) => { if (index > 0) content.classList.remove('active'); });
