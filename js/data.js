/* ==========================================================
   DATA.JS — configuración y datos iniciales de la barbería
   ----------------------------------------------------------
   ✏️ AQUÍ SE EDITAN LOS BARBEROS (nombre, especialidad, foto).
   Las fotos van en la carpeta  img/barberos/  y aquí solo se
   escribe la ruta, por ejemplo:  foto: 'img/barberos/santiago.jpeg'
   Si la foto no existe, la página muestra las iniciales.
   ========================================================== */

const APP_CONFIG = {
  storagePrefix: 'barberco.',    // prefijo de las llaves en localStorage
  adminSessionKey: 'barberco.adminSession', // llave de sessionStorage para el acceso admin
  seedVersion: 2,               // <--- ¡Lo subimos a 2 para obligar a la página a actualizar los datos!
  slotMinutes: 30,              // cada cuántos minutos se ofrece un horario
  // Acceso de demostración al panel admin (no es seguridad real: no hay servidor)
  admin: { email: 'admin@barberco.com', password: 'admin123' }
};

const SEED_DATA = {
  barberos: [
    {
      id: 'b1',
      nombre: 'Santiago Barboza',
      especialidad: 'Corte clásico y degradado',
      foto: 'img/barberos/santiago.jpeg',
      activo: true,
      horario: { dias: [1, 2, 3, 4, 5, 6], inicio: '10:00', fin: '19:00' } // 0 = domingo … 6 = sábado
    },
    {
      id: 'b2',
      nombre: 'Jairany',
      especialidad: 'Estilismo y barbería moderna',
      foto: 'img/barberos/jairany.jpeg',
      activo: true,
      horario: { dias: [1, 2, 3, 4, 5, 6], inicio: '10:00', fin: '19:00' }
    },
    {
      id: 'b3',
      nombre: 'Mauricio',
      especialidad: 'Diseños y fade avanzado',
      foto: 'img/barberos/mauricio.jpeg',
      activo: true,
      horario: { dias: [2, 3, 4, 5, 6], inicio: '11:00', fin: '20:00' }
    },
    {
      id: 'b4',
      nombre: 'Carlos Oyervides',
      especialidad: 'Barba y afeitado con navaja',
      foto: 'img/barberos/oyervides.jpeg',
      activo: true,
      horario: { dias: [1, 2, 3, 4, 5, 6], inicio: '10:00', fin: '19:00' }
    }
  ],
  servicios: [
    { id: 's1', nombre: 'Corte clásico',      descripcion: 'Corte a tijera o máquina con acabado limpio.',         precio: 150, duracion_min: 30, activo: true },
    { id: 's2', nombre: 'Degradado',           descripcion: 'Fade a la medida: bajo, medio o alto.',                  precio: 180, duracion_min: 45, activo: true },
    { id: 's3', nombre: 'Arreglo de barba',    descripcion: 'Perfilado y recorte con toalla caliente.',              precio: 120, duracion_min: 30, activo: true },
    { id: 's4', nombre: 'Afeitado con navaja', descripcion: 'Afeitado tradicional con espuma y navaja.',             precio: 140, duracion_min: 30, activo: true },
    { id: 's5', nombre: 'Paquete premium',     descripcion: 'Corte + barba + mascarilla. La experiencia completa.',  precio: 320, duracion_min: 75, activo: true }
  ]
};