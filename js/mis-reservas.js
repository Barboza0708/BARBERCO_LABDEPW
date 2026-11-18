/* ==========================================================
   MIS-RESERVAS.JS — buscar citas por correo y cancelarlas
   ========================================================== */

const $ = id => document.getElementById(id);

let todas = [];            // reservaciones encontradas para el correo buscado
let filtroActual = 'todas';
let citaACancelar = null;  // id de la reservación que se va a cancelar

function ocultarEstados() {
  ['state-none', 'state-error', 'state-empty'].forEach(id => $(id).classList.remove('show'));
  $('results-section').hidden = true;
}

/* ---------- búsqueda ---------- */
$('search-form').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('email-input').value.trim().toLowerCase();
  if (!email) return;

  ocultarEstados();
  todas = DB.reservacionesPorEmail(email)
    .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));

  if (!todas.length) {
    $('state-error-msg').textContent = 'No encontramos reservas con ese correo en este navegador.';
    $('state-error').classList.add('show');
    return;
  }

  filtroActual = 'todas';
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.filtro === 'todas'));
  $('results-section').hidden = false;
  pintarReservas();
});

/* ---------- listado ---------- */
function pintarReservas() {
  const lista = filtroActual === 'todas' ? todas : todas.filter(r => r.estado === filtroActual);
  const cont = $('reservas-list');

  if (!lista.length) {
    cont.innerHTML = '';
    $('state-empty').classList.add('show');
    return;
  }
  $('state-empty').classList.remove('show');

  cont.innerHTML = lista.map(r => {
    const cancelable = r.estado === 'pendiente' || r.estado === 'confirmada';
    return `
      <article class="reserva-card">
        <div class="reserva-main">
          <div class="reserva-header">
            <span class="reserva-servicio">${Utils.esc(r.servicioNombre)}</span>
            <span class="badge badge-${Utils.esc(r.estado)}">${Utils.esc(Utils.estadoLabel(r.estado))}</span>
          </div>
          <div class="reserva-meta">
            <div class="meta-item"><span class="meta-label">Barbero</span><span class="meta-value">${Utils.esc(r.barberoNombre)}</span></div>
            <div class="meta-item"><span class="meta-label">Fecha</span><span class="meta-value">${Utils.esc(Utils.fecha(r.fecha, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))}</span></div>
            <div class="meta-item"><span class="meta-label">Hora</span><span class="meta-value">${Utils.esc(r.hora)}</span></div>
            <div class="meta-item"><span class="meta-label">Duración</span><span class="meta-value">${Number(r.duracion)} min</span></div>
            <div class="meta-item"><span class="meta-label">Total</span><span class="meta-value gold">${Utils.dinero(r.precio)}</span></div>
          </div>
          ${r.notas ? `<div class="reserva-notas">“${Utils.esc(r.notas)}”</div>` : ''}
        </div>
        <div class="reserva-actions">
          ${cancelable ? `<button type="button" class="btn-cancel" data-cancelar="${Utils.esc(r.id)}">Cancelar</button>` : ''}
        </div>
      </article>`;
  }).join('');
}

$('tabs').addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  filtroActual = tab.dataset.filtro;
  pintarReservas();
});

/* ---------- cancelar ---------- */
$('reservas-list').addEventListener('click', e => {
  const btn = e.target.closest('[data-cancelar]');
  if (!btn) return;
  const r = todas.find(x => x.id === btn.dataset.cancelar);
  if (!r) return;

  citaACancelar = r.id;
  $('modal-text').textContent =
    `¿Cancelar “${r.servicioNombre}” del ${Utils.fecha(r.fecha, { day: 'numeric', month: 'long' })} a las ${r.hora}? Esta acción no se puede deshacer.`;
  $('modal-overlay').classList.add('show');
  $('btn-confirm-cancel').focus();
});

function cerrarModal() {
  $('modal-overlay').classList.remove('show');
  citaACancelar = null;
}

$('btn-cerrar-modal').addEventListener('click', cerrarModal);
$('modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) cerrarModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });

$('btn-confirm-cancel').addEventListener('click', () => {
  if (!citaACancelar) return;
  if (DB.cambiarEstado(citaACancelar, 'cancelada')) {
    const r = todas.find(x => x.id === citaACancelar);
    if (r) r.estado = 'cancelada';
  }
  cerrarModal();
  pintarReservas();
});
