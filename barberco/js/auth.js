/* ==========================================================
   AUTH.JS — acceso de demostración al panel de administración
   ----------------------------------------------------------
   ⚠️  Sin servidor no existe una autenticación real: las
   credenciales viven en js/data.js y cualquiera que abra el
   código las puede ver. Sirve para simular el flujo de login
   en un proyecto escolar, no para proteger datos reales.
   ========================================================== */

const Auth = {
  iniciarSesion(email, password) {
    const ok = email.trim().toLowerCase() === APP_CONFIG.admin.email.toLowerCase()
            && password === APP_CONFIG.admin.password;
    if (ok) sessionStorage.setItem(APP_CONFIG.adminSessionKey, '1');
    return ok;
  },

  cerrarSesion() {
    sessionStorage.removeItem(APP_CONFIG.adminSessionKey);
    window.location.href = 'login.html';
  },

  estaAutenticado() {
    return sessionStorage.getItem(APP_CONFIG.adminSessionKey) === '1';
  },

  /** Redirige al login si no hay sesión. */
  exigirSesion() {
    if (!this.estaAutenticado()) window.location.replace('login.html');
  }
};

// Las páginas protegidas marcan <html data-protegida> y este archivo se carga en el <head>.
if (document.documentElement.hasAttribute('data-protegida')) Auth.exigirSesion();
