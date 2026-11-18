/* ==========================================================
   UTILS.JS — funciones de ayuda compartidas
   ========================================================== */

const Utils = {
  /** Escapa texto para insertarlo de forma segura dentro de HTML. */
  esc(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },

  /** Fecha local en formato YYYY-MM-DD (evita el desfase de toISOString que usa UTC). */
  hoyISO(fecha = new Date()) {
    const d = new Date(fecha);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  },

  /** Da formato legible a una fecha ISO (YYYY-MM-DD). */
  fecha(iso, opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', opciones);
  },

  dinero(n) {
    return '$' + Number(n).toFixed(0);
  },

  iniciales(nombre) {
    return String(nombre || '?').trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  },

  estadoLabel(estado) {
    return { pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada', completada: 'Completada' }[estado] || estado;
  },

  /**
   * HTML del avatar de un barbero: su foto si existe, o sus iniciales si no.
   * claseIniciales = clase CSS que se usará en el respaldo de iniciales.
   */
  avatar(barbero, claseIniciales, claseFoto = '') {
    const ini = this.iniciales(barbero.nombre);
    if (!barbero.foto) return `<span class="${claseIniciales}">${this.esc(ini)}</span>`;
    return `<img class="${claseFoto}" src="${this.esc(barbero.foto)}" alt="Foto de ${this.esc(barbero.nombre)}" loading="lazy"
                 data-initials="${this.esc(ini)}" data-fallback-class="${claseIniciales}">`;
  },

  /** Mensaje flotante (usa el elemento #toast si existe en la página). */
  toast(mensaje) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = mensaje;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  },

  /** Menú hamburguesa de la navegación. */
  initNav() {
    const nav = document.querySelector('.site-nav');
    const boton = document.querySelector('.nav-toggle');
    if (!nav || !boton) return;
    const alternar = abierto => {
      nav.classList.toggle('open', abierto);
      boton.setAttribute('aria-expanded', String(abierto));
      boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    };
    boton.addEventListener('click', () => alternar(!nav.classList.contains('open')));
    nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => alternar(false)));
  },

  /** Escribe el año actual en cualquier elemento con id="year". */
  initFooterYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }
};

// Si una foto de barbero no carga, se reemplaza por sus iniciales.
document.addEventListener('error', e => {
  const img = e.target;
  if (img.tagName !== 'IMG' || !img.dataset.initials) return;
  const span = document.createElement('span');
  span.className = img.dataset.fallbackClass || 'avatar-initials';
  span.textContent = img.dataset.initials;
  img.replaceWith(span);
}, true);

document.addEventListener('DOMContentLoaded', () => {
  Utils.initNav();
  Utils.initFooterYear();
});
