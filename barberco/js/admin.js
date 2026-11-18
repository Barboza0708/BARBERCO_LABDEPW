/* ==========================================================
   ADMIN.JS — panel de administración (agenda, reservaciones, gestión)
   ========================================================== */

const $ = id => document.getElementById(id);

let fechaAgenda = Utils.hoyISO();

/* ---------- navegación entre secciones ---------- */
const TITULOS = { agenda: 'Agenda del día', reservaciones: 'Reservaciones', gestion: 'Gestión' };

function mostrarSeccion(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.section === id));
  $(`sec-${id}`).classList.add('active');
  $('topbar-title').textContent = TITULOS[id];

  if (id === 'agenda') pintarAgenda();
  if (id === 'reservaciones') pintarReservaciones();
  if (id === 'gestion') pintarGestion();
}

document.querySelectorAll('.nav-item').forEach(btn =>
  btn.addEventListener('click', () => mostrarSeccion(btn.dataset.section)));

$('btn-logout').addEventListener('click', () => Auth.cerrarSesion());

/* ---------- acciones por estado (se usan en las dos tablas) ---------- */
function accionesHtml(r) {
  const id = Utils.esc(r.id);
  const botones = [];
  if (r.estado === 'pendiente')
    botones.push(`<button type="button" class="btn-sm confirm" data-id="${id}" data-estado="confirmada">Confirmar</button>`);
  if (r.estado === 'confirmada')
    botones.push(`<button type="button" class="btn-sm complete" data-id="${id}" data-estado="completada">Completar</button>`);
  if (r.estado === 'pendiente' || r.estado === 'confirmada')
    botones.push(`<button type="button" class="btn-sm cancel" data-id="${id}" data-estado="cancelada">Cancelar</button>`);
  return botones.join('') || '<span class="cell-sub">—</span>';
}

const badge = estado =>
  `<span class="badge badge-${Utils.esc(estado)}">${Utils.esc(Utils.estadoLabel(estado))}</span>`;

function alCambiarEstado(e) {
  const btn = e.target.closest('[data-estado]');
  if (!btn) return;
  if (DB.cambiarEstado(btn.dataset.id, btn.dataset.estado)) {
    Utils.toast(`Estado actualizado: ${Utils.estadoLabel(btn.dataset.estado)}`);
    pintarAgenda();
    if ($('sec-reservaciones').classList.contains('active')) pintarReservaciones();
  }
}
$('agenda-tbody').addEventListener('click', alCambiarEstado);
$('reservaciones-tbody').addEventListener('click', alCambiarEstado);

/* ---------- agenda del día ---------- */
function cambiarDia(n) {
  const d = new Date(fechaAgenda + 'T12:00:00');
  d.setDate(d.getDate() + n);
  fechaAgenda = Utils.hoyISO(d);
  pintarAgenda();
}

$('btn-prev-day').addEventListener('click', () => cambiarDia(-1));
$('btn-next-day').addEventListener('click', () => cambiarDia(1));
$('btn-today').addEventListener('click', () => { fechaAgenda = Utils.hoyISO(); pintarAgenda(); });
$('filter-barbero').addEventListener('change', pintarAgenda);

function pintarAgenda() {
  $('agenda-date-display').textContent = Utils.fecha(fechaAgenda, { weekday: 'long', day: 'numeric', month: 'long' });

  const barberoId = $('filter-barbero').value;
  const filas = DB.reservaciones()
    .filter(r => r.fecha === fechaAgenda && (!barberoId || r.barberoId === barberoId))
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const pendientes = filas.filter(r => r.estado === 'pendiente' || r.estado === 'confirmada');
  const completadas = filas.filter(r => r.estado === 'completada');
  $('stat-hoy').textContent = filas.length;
  $('stat-pendientes').textContent = pendientes.length;
  $('stat-completadas').textContent = completadas.length;
  $('stat-ingresos').textContent = Utils.dinero(completadas.reduce((suma, r) => suma + Number(r.precio), 0));

  $('agenda-tbody').innerHTML = filas.length ? filas.map(r => `
    <tr>
      <td><strong>${Utils.esc(r.hora)}</strong></td>
      <td>${Utils.esc(r.cliente.nombre)}<br><span class="cell-sub">${Utils.esc(r.cliente.telefono)}</span></td>
      <td>${Utils.esc(r.servicioNombre)}<br><span class="cell-sub">${Number(r.duracion)} min</span></td>
      <td class="muted">${Utils.esc(r.barberoNombre)}</td>
      <td>${badge(r.estado)}</td>
      <td><div class="row-actions">${accionesHtml(r)}</div></td>
    </tr>`).join('')
    : '<tr><td colspan="6" class="table-empty">Sin reservaciones para este día.</td></tr>';
}

/* ---------- todas las reservaciones ---------- */
$('filter-estado').addEventListener('change', pintarReservaciones);
$('filter-barbero-2').addEventListener('change', pintarReservaciones);

function pintarReservaciones() {
  const estado = $('filter-estado').value;
  const barberoId = $('filter-barbero-2').value;

  const filas = DB.reservaciones()
    .filter(r => (!estado || r.estado === estado) && (!barberoId || r.barberoId === barberoId))
    .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora))
    .slice(0, 100);

  $('reservaciones-tbody').innerHTML = filas.length ? filas.map(r => `
    <tr>
      <td class="muted">${Utils.esc(Utils.fecha(r.fecha, { day: 'numeric', month: 'short', year: 'numeric' }))}</td>
      <td>${Utils.esc(r.hora)}</td>
      <td>${Utils.esc(r.cliente.nombre)}</td>
      <td class="muted">${Utils.esc(r.cliente.telefono)}</td>
      <td>${Utils.esc(r.servicioNombre)}</td>
      <td class="muted">${Utils.esc(r.barberoNombre)}</td>
      <td>${badge(r.estado)}</td>
      <td><div class="row-actions">${accionesHtml(r)}</div></td>
    </tr>`).join('')
    : '<tr><td colspan="8" class="table-empty">Sin reservaciones.</td></tr>';
}

/* ---------- gestión de barberos y servicios ---------- */
function toggleHtml(tabla, item) {
  return `<button type="button" class="toggle-active ${item.activo ? 'on' : ''}"
            data-tabla="${tabla}" data-id="${Utils.esc(item.id)}"
            aria-pressed="${item.activo}" aria-label="${item.activo ? 'Desactivar' : 'Activar'} ${Utils.esc(item.nombre)}"
            title="${item.activo ? 'Activo' : 'Inactivo'}"></button>`;
}

function pintarGestion() {
  $('barberos-list').innerHTML = DB.barberos().map(b => `
    <div class="mgmt-item">
      <div class="mgmt-item-info">
        <div class="mgmt-item-name">${Utils.esc(b.nombre)}</div>
        <div class="mgmt-item-sub">${Utils.esc(b.especialidad || 'Sin especialidad')}</div>
      </div>
      <div class="mgmt-actions">${toggleHtml('barberos', b)}</div>
    </div>`).join('') || '<p class="table-empty">Aún no hay barberos.</p>';

  $('servicios-list').innerHTML = DB.servicios().sort((a, b) => a.precio - b.precio).map(s => `
    <div class="mgmt-item">
      <div class="mgmt-item-info">
        <div class="mgmt-item-name">${Utils.esc(s.nombre)}</div>
        <div class="mgmt-item-sub">${Utils.dinero(s.precio)} · ${Number(s.duracion_min)} min</div>
      </div>
      <div class="mgmt-actions">${toggleHtml('servicios', s)}</div>
    </div>`).join('') || '<p class="table-empty">Aún no hay servicios.</p>';
}

$('sec-gestion').addEventListener('click', e => {
  const toggle = e.target.closest('.toggle-active');
  if (toggle) {
    const activo = DB.alternarActivo(toggle.dataset.tabla, toggle.dataset.id);
    Utils.toast(activo ? 'Activado' : 'Desactivado');
    pintarGestion();
    return;
  }
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) abrirModal(abrir.dataset.abrir);
});

$('btn-reset').addEventListener('click', () => {
  if (!confirm('Se borrarán todas las reservaciones y se restaurarán los barberos y servicios de ejemplo. ¿Continuar?')) return;
  DB.restablecer();
  llenarSelectsBarberos();
  pintarGestion();
  pintarAgenda();
  Utils.toast('Datos restablecidos');
});

/* ---------- modales de alta ---------- */
function abrirModal(tipo) {
  const caja = $('modal-box');

  if (tipo === 'barbero') {
    caja.innerHTML = `
      <h3>Nuevo Barbero</h3>
      <div class="form-field"><label for="m-nombre">Nombre completo</label><input type="text" id="m-nombre" placeholder="Nombre Apellido"></div>
      <div class="form-field"><label for="m-esp">Especialidad</label><input type="text" id="m-esp" placeholder="Corte clásico y degradado"></div>
      <div class="form-field"><label for="m-foto">Ruta de la foto (opcional)</label><input type="text" id="m-foto" placeholder="img/barberos/nombre.jpg"></div>
      <div class="modal-actions">
        <button type="button" class="btn-ghost" data-accion="cerrar">Cancelar</button>
        <button type="button" class="btn-primary" data-accion="guardar-barbero">Guardar</button>
      </div>`;
  } else {
    caja.innerHTML = `
      <h3>Nuevo Servicio</h3>
      <div class="form-field"><label for="m-nombre">Nombre</label><input type="text" id="m-nombre" placeholder="Corte básico"></div>
      <div class="form-field"><label for="m-desc">Descripción</label><textarea id="m-desc" placeholder="Descripción breve del servicio..."></textarea></div>
      <div class="form-row">
        <div class="form-field"><label for="m-precio">Precio ($)</label><input type="number" id="m-precio" placeholder="150" min="0"></div>
        <div class="form-field"><label for="m-dur">Duración (min)</label><input type="number" id="m-dur" placeholder="30" min="10" step="5"></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-ghost" data-accion="cerrar">Cancelar</button>
        <button type="button" class="btn-primary" data-accion="guardar-servicio">Guardar</button>
      </div>`;
  }
  $('modal-overlay').classList.add('show');
  $('m-nombre').focus();
}

function cerrarModal() {
  $('modal-overlay').classList.remove('show');
}

$('modal-box').addEventListener('click', e => {
  const accion = e.target.closest('[data-accion]')?.dataset.accion;
  if (accion === 'cerrar') cerrarModal();

  if (accion === 'guardar-barbero') {
    const nombre = $('m-nombre').value.trim();
    if (!nombre) { Utils.toast('Escribe el nombre del barbero'); return; }
    DB.agregarBarbero({ nombre, especialidad: $('m-esp').value.trim(), foto: $('m-foto').value.trim() });
    cerrarModal(); llenarSelectsBarberos(); pintarGestion(); Utils.toast('Barbero agregado');
  }

  if (accion === 'guardar-servicio') {
    const nombre = $('m-nombre').value.trim();
    const precio = parseFloat($('m-precio').value);
    const duracion = parseInt($('m-dur').value, 10);
    if (!nombre || isNaN(precio) || precio < 0 || isNaN(duracion) || duracion < 10) {
      Utils.toast('Completa nombre, precio y duración (mínimo 10 min)');
      return;
    }
    DB.agregarServicio({ nombre, descripcion: $('m-desc').value.trim(), precio, duracion_min: duracion });
    cerrarModal(); pintarGestion(); Utils.toast('Servicio agregado');
  }
});

$('modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) cerrarModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });

/* ---------- selects de barberos ---------- */
function llenarSelectsBarberos() {
  const opciones = '<option value="">Todos los barberos</option>' +
    DB.barberos().map(b => `<option value="${Utils.esc(b.id)}">${Utils.esc(b.nombre)}</option>`).join('');
  ['filter-barbero', 'filter-barbero-2'].forEach(id => {
    const valor = $(id).value;
    $(id).innerHTML = opciones;
    $(id).value = valor;
  });
}

/* ---------- arranque ---------- */
$('topbar-date').textContent = Utils.fecha(Utils.hoyISO(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
llenarSelectsBarberos();
pintarAgenda();
