/* ==========================================================
   LOGIN.JS — formulario de acceso del administrador
   ========================================================== */

if (Auth.estaAutenticado()) window.location.replace('admin.html');

document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const error = document.getElementById('error-msg');

  if (!email.trim() || !password) return;

  if (Auth.iniciarSesion(email, password)) {
    window.location.href = 'admin.html';
  } else {
    error.classList.add('show');
  }
});
