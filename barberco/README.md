# BarberCo — Sitio web de barbería

Proyecto integrador (**A11 · PIA**) del **Lab de programación web**, hecho con HTML, CSS y JavaScript.

| | |
|---|---|
| **Equipo** | _(nombres de los integrantes)_ |
| **Materia** | Lab de programación web — FIME, UANL |
| **Demo en línea** | _(enlace de GitHub Pages)_ |

---

## Problemática y solución

**Problema.** Muchas barberías pequeñas agendan sus citas por mensajes o llamadas. Eso provoca citas encimadas,
horarios que se olvidan, clientes que no saben qué servicios o precios hay, y poco control de la agenda del día.

**Solución.** BarberCo es un sitio web donde el cliente conoce los servicios y a los barberos, **reserva su cita
en línea** eligiendo barbero, servicio y horario disponible, y puede **consultar o cancelar** sus citas con su correo.
La barbería cuenta además con un **panel de administración** para ver la agenda del día y gestionar reservaciones,
barberos y servicios.

**Alcance.** Es un sitio de front-end: no usa base de datos ni servidor. Todo se guarda en el navegador con
`localStorage`, por lo que las reservaciones solo existen en la computadora donde se hicieron.

## Documentación del proyecto

- 📐 [Planeación del diseño](docs/planeacion/README.md): mapa del sitio, flujo de reservación, wireframes y guía de estilo.
- 🖼️ [Evidencia del funcionamiento](docs/evidencia/)
- ✅ [Validación de HTML y CSS](docs/validacion/)
- 🎤 [Presentación final](docs/presentacion/)

---

## Cómo abrirlo

1. Clona o descarga el repositorio.
2. Abre `index.html` con doble clic (Chrome o Edge recomendados).
   - Opcional: con la extensión **Live Server** de VS Code, o con `python -m http.server` dentro de la carpeta
     y entrando a `http://localhost:8000`.
3. Las fuentes (Google Fonts) necesitan internet; sin conexión se usan fuentes del sistema y todo sigue funcionando.

> Si en Firefox las reservaciones no aparecen entre páginas al abrir con doble clic, usa Chrome/Edge o Live Server.

## Estructura del repositorio

```
barberco/
├── index.html            Página principal (hero, servicios, barberos, horarios)
├── reservar.html         Asistente de reservación en 4 pasos
├── mis-reservas.html     Consultar y cancelar citas con el correo
├── login.html            Acceso del administrador
├── admin.html            Panel: agenda del día, reservaciones y gestión
├── css/
│   ├── base.css          Variables, reset, navegación y botones (compartido)
│   ├── home.css          Estilos de index.html
│   ├── reservar.css      Estilos de reservar.html
│   ├── mis-reservas.css  Estilos de mis-reservas.html
│   ├── login.css         Estilos de login.html
│   └── admin.css         Estilos de admin.html
├── js/
│   ├── data.js           ⭐ Datos iniciales: barberos, servicios y configuración
│   ├── utils.js          Funciones compartidas (escapar HTML, fechas, toast, menú)
│   ├── storage.js        "Base de datos" local (localStorage) y lógica de horarios
│   ├── auth.js           Login de demostración del administrador
│   └── index.js · reservar.js · mis-reservas.js · login.js · admin.js   (uno por página)
├── img/
│   └── barberos/         ⭐ Fotos de los barberos
├── docs/
│   ├── planeacion/       Mapa del sitio, wireframes y guía de estilo
│   ├── evidencia/        Capturas del sitio funcionando
│   ├── validacion/       Capturas de la validación W3C (HTML y CSS)
│   └── presentacion/     Presentación final
├── .gitignore
└── README.md
```

## Fotos de los barberos

1. Guarda las fotos en `img/barberos/`. Ideal: vertical (proporción 3:4, por ejemplo 600 × 800 px).
2. Abre `js/data.js` y en cada barbero cambia `nombre`, `especialidad` y `foto`:

   ```js
   {
     id: 'b1',
     nombre: 'Nombre del barbero',
     especialidad: 'Corte clásico y degradado',
     foto: 'img/barberos/nombre-del-archivo.jpeg',
     ...
   }
   ```
3. Para agregar más barberos, copia un bloque, cambia el `id` (`'b5'`, `'b6'`…) y **sube `seedVersion`**
   en `APP_CONFIG` para que el navegador recargue los datos.
4. Si una foto no existe o la ruta está mal, la página muestra las iniciales del barbero (no se rompe).

Las fotos aparecen en la página principal y en el paso 1 de la reservación.

## Panel de administración

- Entrar desde el enlace "Acceso administrador" del pie de página, o abrir `login.html`.
- Credenciales **de demostración**: `admin@barberco.com` · `admin123` (se cambian en `js/data.js`).
- Permite confirmar, completar y cancelar citas, activar/desactivar barberos y servicios, agregar nuevos y
  restablecer los datos de demostración.
- ⚠️ Es un acceso simulado: sin servidor no hay autenticación real, y las credenciales están en el código.

## Cómo funciona la reservación (sin base de datos)

- Catálogo, citas y clientes se guardan en `localStorage` bajo llaves que empiezan con `barberco.`.
- Los horarios se calculan según la jornada de cada barbero (`horario` en `js/data.js`) y la duración del servicio.
  Una cita de 75 min bloquea todos los horarios que se traslapan con ella.
- No se ofrecen horarios que ya pasaron el día de hoy.
- "Mis reservas" busca por correo **dentro del mismo navegador**.

## Buenas prácticas aplicadas

- HTML semántico (`nav`, `main`, `section`, `article`, `footer`), un solo `<h1>` por página y etiquetas `label` en los formularios.
- CSS separado por página y un `base.css` con variables y componentes compartidos; sin estilos en línea.
- JavaScript separado en archivos, sin `onclick` en el HTML (eventos con `addEventListener`).
- Todo texto que viene de un formulario se escapa antes de mostrarse (evita inyección de HTML).
- Diseño responsivo con menú hamburguesa en móvil y panel admin adaptable.
- Accesibilidad: foco visible, botones reales para las tarjetas de selección, `aria-label` en controles sin texto,
  y respeto a `prefers-reduced-motion`.
- Las fechas usan la hora local (no UTC), así que no se corren de día en la noche.
