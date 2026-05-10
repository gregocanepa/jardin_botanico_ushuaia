# Jardín Botánico — App de Recorrido Autoguiado

PWA offline construida con React + Vite. Funciona sin conexión a internet una vez cacheada.

## Stack

- **React 18** + **React Router 6** — navegación entre estaciones
- **Vite** — bundler y dev server
- **vite-plugin-pwa** — genera el service worker y el manifest automáticamente
- **CSS Modules** — estilos locales por componente
- **JSON estático** — contenido de estaciones (reemplazable por CMS)

## Estructura del proyecto

```
src/
├── components/
│   ├── AudioPlayer.jsx       # Reproductor de audio con progreso
│   └── AudioPlayer.module.css
├── pages/
│   ├── Home.jsx              # Pantalla de inicio: listado de estaciones
│   ├── Home.module.css
│   ├── Station.jsx           # Página de estación individual (acceso por QR)
│   ├── Station.module.css
│   └── NotFound.jsx
├── hooks/
│   └── useStation.js         # Lógica de acceso a datos (JSON → CMS-ready)
├── data/
│   └── stations.json         # Contenido de todas las estaciones
├── assets/
│   ├── audio/                # Archivos .mp3 de narración por estación
│   └── images/               # Fotos de plantas por estación
├── App.jsx                   # Routing principal
├── main.jsx                  # Entry point
└── index.css                 # Variables globales y reset
```

## Comandos

```bash
npm install       # Instalar dependencias
npm run dev       # Dev server en localhost:5173
npm run build     # Build de producción (genera /dist)
npm run preview   # Preview del build local
```

## Agregar una estación nueva

1. Editá `src/data/stations.json` y agregá un objeto con la misma estructura que los existentes
2. Subí el audio a `src/assets/audio/nombre-estacion.mp3`
3. Subí las imágenes a `src/assets/images/`
4. El QR de esa estación debe apuntar a `/estacion/{slug}`

## Deploy en Cloudflare Pages

1. Subí el proyecto a GitHub
2. En Cloudflare Pages: conectá el repo, build command `npm run build`, output directory `dist`
3. Listo — la URL de prueba es `tu-proyecto.pages.dev`

## Modo offline

El service worker (generado por vite-plugin-pwa) cachea automáticamente:
- Todos los archivos del build (HTML, JS, CSS)
- Los archivos de `src/data/stations.json`
- Imágenes y audios con estrategia cache-first

Los visitantes deben abrir la app **una vez con WiFi** antes de entrar al jardín.
