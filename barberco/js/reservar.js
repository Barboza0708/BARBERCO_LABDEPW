/* ==========================================================
   RESERVAR.JS — asistente de reservación en 4 pasos
   ========================================================== */

const state = {
  barbero: null,   // { id, nombre }
  servicio: null,  // { id, nombre, precio, duracion }
  fecha: '',
  hora: ''
};

const $ = id => document.getElementById(id);

/* ---------- navegación entre pasos ---------- */
function irAPaso(n) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  $(`panel-${n}`).classList.add('active');

  document.querySelectorAll('.step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i + 1 < n) s.classList.add('done');
    if (i + 1 === n) s.classList.add('active');
  });

  if (n === 3 && state.fecha) pintarHorarios();   // la duración pudo cambiar al elegir otro servicio
  if (n === 4) pintarResumen();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-goto]').forEach(btn =>
  btn.addEventListener('click', () => irAPaso(Number(btn.dataset.goto))));

/* ---------- paso 1: barberos ---------- */
function pintarBarberos() {
  const lista = DB.barberos({ soloActivos: true });
  $('barberos-grid').innerHTML = lista.length ? lista.map(b => `
    <button type="button" class="select-card" data-id="${Utils.esc(b.id)}">
      <span class="check" aria-hidden="true">✓</span>
      ${Utils.avatar(b, 'card-initials', 'card-photo')}
      <div class="card-name">${Utils.esc(b.nombre)}</div>
      <div class="card-sub">${Utils.esc(b.especialidad || 'Barbero profesional')}</div>
    </button>`).join('')
    : '<p class="slots-empty">No hay barberos disponibles por ahora.</p>';
}

$('barberos-grid').addEventListener('click', e => {
  const card = e.target.closest('.select-card');
  if (!card) return;
  document.querySelectorAll('#barberos-grid .select-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  const b = DB.barbero(card.dataset.id);
  state.barbero = { id: b.id, nombre: b.nombre };
  state.hora = '';
  $('btn-next-1').disabled = false;
});

$('btn-next-1').addEventListener('click', () => irAPaso(2));

/* ---------- paso 2: servicios ---------- */
function pintarServicios() {
  const lista = DB.servicios({ soloActivos: true }).sort((a, b) => a.precio - b.precio);
  $('servicios-grid').innerHTML = lista.length ? lista.map(s => `
    <button type="button" class="select-card" data-id="${Utils.esc(s.id)}">
      <span class="check" aria-hidden="true">✓</span>
      <div class="card-name">${Utils.esc(s.nombre)}</div>
      <div class="card-sub card-sub--desc">${Utils.esc(s.descripcion)}</div>
      <div class="card-price">${Utils.dinero(s.precio)}</div>
      <div class="card-duration">${Number(s.duracion_min)} min</div>
    </button>`).join('')
    : '<p class="slots-empty">No hay servicios disponibles por ahora.</p>';
}

$('servicios-grid').addEventListener('click', e => {
  const card = e.target.closest('.select-card');
  if (!card) return;
  document.querySelectorAll('#servicios-grid .select-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  const s = DB.servicio(card.dataset.id);
  state.servicio = { id: s.id, nombre: s.nombre, precio: s.precio, duracion: s.duracion_min };
  state.hora = '';
  $('btn-next-2').disabled = false;
});

$('btn-next-2').addEventListener('click', () => irAPaso(3));

/* ---------- paso 3: fecha, horario y datos ---------- */
$('fecha-input').min = Utils.hoyISO();

$('fecha-input').addEventListener('change', () => {
  state.fecha = $('fecha-input').value;
  state.hora = '';
  pintarHorarios();
  validarPaso3();
});

function pintarHorarios() {
  const grid = $('slots-grid');
  if (!state.fecha || !state.barbero || !state.servicio) return;

  // Si eligió una fecha anterior a hoy escribiéndola a mano
  if (state.fecha < Utils.hoyISO()) {
    grid.innerHTML = '<p class="slots-empty">Elige una fecha de hoy en adelante.</p>';
    return;
  }

  const { cerrado, slots } = DB.horarios(state.barbero.id, state.fecha, state.servicio.duracion);

  if (cerrado) {
    grid.innerHTML = '<p class="slots-empty">El barbero no trabaja este día.</p>';
  } else if (!slots.some(s => s.disponible)) {
    grid.innerHTML = '<p class="slots-empty">Sin horarios disponibles este día.</p>';
  } else {
    grid.innerHTML = slots.map(s => `
      <button type="button" class="slot${s.disponible ? '' : ' taken'}${s.hora === state.hora ? ' selected' : ''}"
              data-hora="${s.hora}" ${s.disponible ? '' : 'disabled'}>${s.hora}</button>`).join('');
  }
}

$('slots-grid').addEventListener('click', e => {
  const slot = e.target.closest('.slot');
  if (!slot || slot.disabled) return;
  document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
  slot.classList.add('selected');
  state.hora = slot.dataset.hora;
  validarPaso3();
});

const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const telefonoValido = v => v.replace(/\D/g, '').length >= 8;

function validarPaso3() {
  const ok = $('input-nombre').value.trim().length >= 2
    && emailValido($('input-email').value.trim())
    && telefonoValido($('input-telefono').value)
    && state.fecha && state.hora;
  $('btn-next-3').disabled = !ok;
}

['input-nombre', 'input-telefono', 'input-email'].forEach(id =>
  $(id).addEventListener('input', validarPaso3));

$('btn-next-3').addEventListener('click', () => irAPaso(4));

/* ---------- paso 4: resumen y confirmación ---------- */
function datosCliente() {
  return {
    nombre: $('input-nombre').value.trim(),
    telefono: $('input-telefono').value.trim(),
    email: $('input-email').value.trim().toLowerCase()
  };
}

function pintarResumen() {
  const c = datosCliente();
  $('error-msg').classList.remove('show');
  $('summary-box').innerHTML = `
    <div class="summary-row"><span>Barbero</span><span>${Utils.esc(state.barbero.nombre)}</span></div>
    <div class="summary-row"><span>Servicio</span><span>${Utils.esc(state.servicio.nombre)}</span></div>
    <div class="summary-row"><span>Duración</span><span>${Number(state.servicio.duracion)} min</span></div>
    <div class="summary-row"><span>Fecha</span><span>${Utils.esc(Utils.fecha(state.fecha))}</span></div>
    <div class="summary-row"><span>Hora</span><span>${Utils.esc(state.hora)}</span></div>
    <div class="summary-row"><span>Cliente</span><span>${Utils.esc(c.nombre)}</span></div>
    <div class="summary-row"><span>Contacto</span><span>${Utils.esc(c.telefono)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${Utils.dinero(state.servicio.precio)}</span></div>`;
}

$('btn-confirm').addEventListener('click', () => {
  const resultado = DB.agregarReservacion({
    barberoId: state.barbero.id,
    servicioId: state.servicio.id,
    fecha: state.fecha,
    hora: state.hora,
    cliente: datosCliente(),
    notas: $('input-notas').value.trim()
  });

  if (!resultado.ok) {
    const err = $('error-msg');
    err.textContent = resultado.error;
    err.classList.add('show');
    return;
  }
  mostrarExito(resultado.reservacion);
});

function mostrarExito(r) {
  document.querySelector('.stepper').style.display = 'none';
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  $('success-detail').innerHTML = `
    <p><strong>Barbero:</strong> ${Utils.esc(r.barberoNombre)}</p>
    <p><strong>Servicio:</strong> ${Utils.esc(r.servicioNombre)}</p>
    <p><strong>Fecha:</strong> ${Utils.esc(Utils.fecha(r.fecha, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
    <p><strong>Hora:</strong> ${Utils.esc(r.hora)}</p>`;
  $('success-screen').classList.add('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- arranque ---------- */
pintarBarberos();
pintarServicios();
