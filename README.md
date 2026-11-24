# Comparador de coches

App web (también instalable en Android) para comparar coches con datos extraídos de vídeos de YouTube
mediante Gemini. Los datos se sincronizan entre dispositivos a través de un script en tu cuenta de Google.

## Archivos
- `index.html` — la app completa.
- `manifest.webmanifest`, `sw.js`, `icons/` — lo necesario para instalarla en el móvil y que aparezca
  en el menú «Compartir» de Android.
- `google-apps-script/Codigo.gs` — el servicio de sincronización (se pega en script.google.com).
- `tools/make-icons.js` — regenera los iconos (`node tools/make-icons.js`).
- `comparador-coches.html` — redirige a `index.html` (dirección antigua).
- `datos.json` — copia local de la base (no se publica; ver .gitignore).

## Cómo funciona
- **Añadir vídeos:** pega enlaces en la cola o, en el móvil, Compartir → «Coches» desde YouTube.
- **Procesar:** el dispositivo con «Este dispositivo procesa la cola» marcado (el PC) llama a Gemini,
  que ve el vídeo y devuelve los datos; se fusionan solos en la base.
- **Control de tokens** (Ajustes → Límites de uso): tokens al día, tokens por vídeo, vídeos al día,
  pausa entre vídeos. Se consulta el tamaño antes (gratis) y el vídeo se analiza a baja resolución
  (≈4 k tokens por minuto de vídeo). Errores 429/503 de Google: espera y reintenta sola.
- **Modelos de respaldo:** si el modelo principal de Gemini está saturado (503) o sin cuota (429),
  se prueba al momento con otro modelo Flash (automático o configurable en Ajustes).
- **Completar ficha** (botón en cada coche o «Completar todas las fichas»; automático para coches
  nuevos): Gemini con búsqueda de Google rellena solo los datos que faltan, priorizando fabricante,
  km77, ev-database, Spritmonitor y Euro NCAP, y guarda la URL de cada dato (🌐 en la ficha).
  Va a la cola y lo hace el PC.
- **Imágenes:** foto oficial (fabricante o sala de prensa) buscada con «Completar ficha» y comprobada
  antes de guardarla, o un enlace propio. No se usan miniaturas de YouTube.
- **Datos completos:** porcentaje total y por apartado en cada ficha y en Comparar.
- **Rutas largas** (Comparar y Gráficos; parámetros en Ajustes → Rutas largas): Getafe → Pontevedra y
  Getafe → Albacete por defecto, en condiciones favorables y desfavorables (frío y viento):
  paradas, tiempo cargando, tiempo total y coste. ≈ indica valores estimados por falta de datos reales.
- **Curvas de carga** (evkx.net): potencia de carga rápida según el % de batería. Se ven en la ficha,
  en Comparar y en Gráficos → Carga, y las rutas calculan el tiempo de carga recorriendo la curva real.
  También la ventana de carga óptima en viaje y la química/tensión de la batería.
- **Gráficos** agrupados por tema (costes, viajes, prestaciones, consumos, carga, dimensiones,
  seguridad, opinión, equipamiento, puntuación), con todos los coches o solo los de Comparar.
- **Sincronización** (Ajustes → Sincronización con Google): coches, precios, viajes, rutas, pesos y
  cola se comparten; en cada coche o vídeo gana el cambio más reciente. Filtros, selección y clave de
  Gemini son de cada dispositivo. La URL y la clave del script nunca están en el código.
- **datos.json:** si la app se abre desde el servidor local de pruebas (puerto 8765), también se
  guarda una copia en esta carpeta.

## Seguridad
El código es público (GitHub Pages), pero no contiene ningún dato ni clave: los coches viven en tu
Google Drive y las claves (Gemini y script) solo en cada dispositivo.
