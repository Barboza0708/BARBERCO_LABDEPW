/* ==========================================================
   INDEX.JS — pinta servicios y barberos en la página principal
   ========================================================== */

function pintarServicios() {
  const grid = document.getElementById('services-grid');
  const lista = DB.servicios({ soloActivos: true }).sort((a, b) => a.precio - b.precio);

  if (!lista.length) {
    grid.innerHTML = '<p class="empty-note">Próximamente nuevos servicios.</p>';
    return;
  }

  grid.innerHTML = lista.map((s, i) => `
    <article class="service-card">
      <div class="service-num">${String(i + 1).padStart(2, '0')}</div>
      <h3 class="service-name">${Utils.esc(s.nombre)}</h3>
      <p class="service-desc">${Utils.esc(s.descripcion)}</p>
      <div class="service-meta">
        <span class="service-price">${Utils.dinero(s.precio)}</span>
        <span class="service-duration">${Number(s.duracion_min)} min</span>
      </div>
    </article>
  `).join('');
}

function pintarBarberos() {
  const grid = document.getElementById('barbers-grid');
  const lista = DB.barberos({ soloActivos: true });

  if (!lista.length) {
    grid.innerHTML = '<p class="empty-note">Próximamente conocerás a nuestro equipo.</p>';
    return;
  }

  grid.innerHTML = lista.map(b => `
    <article class="barber-card">
      <div class="barber-photo">
        ${Utils.avatar(b, 'barber-initials')}
        <div class="barber-overlay"></div>
      </div>
      <div class="barber-info">
        <h3 class="barber-name">${Utils.esc(b.nombre)}</h3>
        <p class="barber-specialty">${Utils.esc(b.especialidad || 'Barbero profesional')}</p>
      </div>
    </article>
  `).join('');
}

pintarServicios();
pintarBarberos();
