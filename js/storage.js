/* ==========================================================
   STORAGE.JS — "base de datos" local usando localStorage
   ----------------------------------------------------------
   Toda la información (barberos, servicios y reservaciones)
   se guarda en el navegador de quien usa la página. No hay
   servidor: otra computadora no verá estas reservaciones.
   ========================================================== */

const DB = (() => {
  const P = APP_CONFIG.storagePrefix;

  /* ---------- lectura / escritura ---------- */
  function leer(llave, respaldo) {
    try {
      const valor = localStorage.getItem(P + llave);
      return valor ? JSON.parse(valor) : respaldo;
    } catch (e) {
      return respaldo;
    }
  }

  function escribir(llave, valor) {
    try {
      localStorage.setItem(P + llave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false; // almacenamiento lleno o bloqueado
    }
  }

  const nuevoId = prefijo => prefijo + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const aMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const aHHMM = min => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');

  /* ---------- inicialización ---------- */
  function iniciar() {
    if (leer('seedVersion', 0) !== APP_CONFIG.seedVersion) {
      escribir('barberos', SEED_DATA.barberos);
      escribir('servicios', SEED_DATA.servicios);
      if (!leer('reservaciones', null)) escribir('reservaciones', []);
      escribir('seedVersion', APP_CONFIG.seedVersion);
    }
  }

  function restablecer() {
    escribir('barberos', SEED_DATA.barberos);
    escribir('servicios', SEED_DATA.servicios);
    escribir('reservaciones', []);
    escribir('seedVersion', APP_CONFIG.seedVersion);
  }

  /* ---------- barberos y servicios ---------- */
  const barberos = ({ soloActivos = false } = {}) =>
    leer('barberos', []).filter(b => !soloActivos || b.activo);

  const servicios = ({ soloActivos = false } = {}) =>
    leer('servicios', []).filter(s => !soloActivos || s.activo);

  const barbero = id => barberos().find(b => b.id === id);
  const servicio = id => servicios().find(s => s.id === id);

  function agregarBarbero({ nombre, especialidad, foto }) {
    const lista = leer('barberos', []);
    lista.push({
      id: nuevoId('b'), nombre, especialidad: especialidad || '', foto: foto || '', activo: true,
      horario: { dias: [1, 2, 3, 4, 5, 6], inicio: '10:00', fin: '19:00' }
    });
    return escribir('barberos', lista);
  }

  function agregarServicio({ nombre, descripcion, precio, duracion_min }) {
    const lista = leer('servicios', []);
    lista.push({ id: nuevoId('s'), nombre, descripcion: descripcion || '', precio, duracion_min, activo: true });
    return escribir('servicios', lista);
  }

  /** Activa o desactiva un barbero ('barberos') o un servicio ('servicios'). */
  function alternarActivo(tabla, id) {
    const lista = leer(tabla, []);
    const item = lista.find(x => x.id === id);
    if (!item) return null;
    item.activo = !item.activo;
    escribir(tabla, lista);
    return item.activo;
  }

  /* ---------- reservaciones ---------- */
  const reservaciones = () => leer('reservaciones', []);

  const reservacionesPorEmail = email =>
    reservaciones().filter(r => r.cliente.email.toLowerCase() === String(email).trim().toLowerCase());

  const estaActiva = r => r.estado === 'pendiente' || r.estado === 'confirmada';

  /** ¿El rango [inicio, fin) choca con una reservación activa del barbero ese día? */
  function hayChoque(barberoId, fecha, inicioMin, finMin) {
    return reservaciones().some(r => {
      if (r.barberoId !== barberoId || r.fecha !== fecha || !estaActiva(r)) return false;
      const s = aMin(r.hora);
      return inicioMin < s + r.duracion && finMin > s;
    });
  }

  /**
   * Horarios del barbero para una fecha, según la duración del servicio.
   * Devuelve { cerrado, slots: [{ hora, disponible }] }.
   */
  function horarios(barberoId, fecha, duracion) {
    const b = barbero(barberoId);
    if (!b) return { cerrado: true, slots: [] };

    const dia = new Date(fecha + 'T12:00:00').getDay();
    if (!b.horario.dias.includes(dia)) return { cerrado: true, slots: [] };

    const ahora = new Date();
    const minutosAhora = fecha === Utils.hoyISO() ? ahora.getHours() * 60 + ahora.getMinutes() : -1;
    const fin = aMin(b.horario.fin);
    const slots = [];

    for (let inicio = aMin(b.horario.inicio); inicio + duracion <= fin; inicio += APP_CONFIG.slotMinutes) {
      const pasado = inicio <= minutosAhora;
      slots.push({
        hora: aHHMM(inicio),
        disponible: !pasado && !hayChoque(barberoId, fecha, inicio, inicio + duracion)
      });
    }
    return { cerrado: false, slots };
  }

  /** Guarda una reservación nueva (vuelve a validar que el horario siga libre). */
  function agregarReservacion({ barberoId, servicioId, fecha, hora, cliente, notas }) {
    const b = barbero(barberoId);
    const s = servicio(servicioId);
    if (!b || !s) return { ok: false, error: 'Barbero o servicio no disponible.' };

    const inicio = aMin(hora);
    if (hayChoque(barberoId, fecha, inicio, inicio + s.duracion_min)) {
      return { ok: false, error: 'Ese horario ya fue reservado. Elige otro.' };
    }

    const lista = reservaciones();
    const nueva = {
      id: nuevoId('r'),
      barberoId, servicioId, fecha, hora,
      // Se guarda una copia de los datos para que el historial no cambie si luego se edita el catálogo
      barberoNombre: b.nombre,
      servicioNombre: s.nombre,
      precio: s.precio,
      duracion: s.duracion_min,
      cliente,
      notas: notas || '',
      estado: 'pendiente',
      creada: new Date().toISOString()
    };
    lista.push(nueva);
    if (!escribir('reservaciones', lista)) {
      return { ok: false, error: 'No se pudo guardar. Revisa que el navegador permita almacenamiento local.' };
    }
    return { ok: true, reservacion: nueva };
  }

  function cambiarEstado(id, estado) {
    const lista = reservaciones();
    const r = lista.find(x => x.id === id);
    if (!r) return false;
    r.estado = estado;
    return escribir('reservaciones', lista);
  }

  return {
    iniciar, restablecer,
    barberos, servicios, barbero, servicio,
    agregarBarbero, agregarServicio, alternarActivo,
    reservaciones, reservacionesPorEmail, horarios, agregarReservacion, cambiarEstado
  };
})();

DB.iniciar();
