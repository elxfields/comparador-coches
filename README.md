# Comparador de coches

App web (tambiÃ©n instalable en Android) para comparar coches con datos extraÃ­dos de vÃ­deos de YouTube
mediante Gemini. Los datos se sincronizan entre dispositivos a travÃ©s de un script en tu cuenta de Google.

## Archivos
- `index.html` â€” la app completa.
- `manifest.webmanifest`, `sw.js`, `icons/` â€” lo necesario para instalarla en el mÃ³vil y que aparezca
  en el menÃº Â«CompartirÂ» de Android.
- `google-apps-script/Codigo.gs` â€” el servicio de sincronizaciÃ³n (se pega en script.google.com).
- `tools/make-icons.js` â€” regenera los iconos (`node tools/make-icons.js`).
- `comparador-coches.html` â€” redirige a `index.html` (direcciÃ³n antigua).
- `datos.json` â€” copia local de la base (no se publica; ver .gitignore).

## CÃ³mo funciona
- **AÃ±adir vÃ­deos:** pega enlaces en la cola o, en el mÃ³vil, Compartir â†’ Â«CochesÂ» desde YouTube.
- **Procesar:** el dispositivo con Â«Este dispositivo procesa la colaÂ» marcado (el PC) llama a Gemini,
  que ve el vÃ­deo y devuelve los datos; se fusionan solos en la base.
- **Control de tokens** (Ajustes â†’ LÃ­mites de uso): tokens al dÃ­a, tokens por vÃ­deo, vÃ­deos al dÃ­a,
  pausa entre vÃ­deos. Se consulta el tamaÃ±o antes (gratis) y el vÃ­deo se analiza a baja resoluciÃ³n
  (â‰ˆ4 k tokens por minuto de vÃ­deo). Errores 429/503 de Google: espera y reintenta sola.
- **Modelos de respaldo:** si el modelo principal de Gemini estÃ¡ saturado (503) o sin cuota (429),
  se prueba al momento con otro modelo Flash (automÃ¡tico o configurable en Ajustes).
- **Completar ficha** (botÃ³n en cada coche o Â«Completar todas las fichasÂ»): Gemini con bÃºsqueda de
  Google rellena solo los datos que faltan, priorizando fabricante, km77, ev-database, Spritmonitor
  y Euro NCAP, y guarda la URL de cada dato (ðŸŒ en la ficha). Va a la cola y lo hace el PC.
- **ImÃ¡genes:** miniatura del vÃ­deo de origen o un enlace a una foto propia.
- **Rutas largas** (Comparar; parÃ¡metros en Ajustes â†’ Rutas largas): Getafe â†’ Pontevedra y
  Getafe â†’ Albacete por defecto, en condiciones favorables y desfavorables (frÃ­o y viento):
  paradas, tiempo cargando, tiempo total y coste. â‰ˆ indica valores estimados por falta de datos reales.
- **SincronizaciÃ³n** (Ajustes â†’ SincronizaciÃ³n con Google): coches, precios, viajes, pesos y cola se
  comparten; en cada coche o vÃ­deo gana el cambio mÃ¡s reciente. Filtros, selecciÃ³n y clave de Gemini
  son de cada dispositivo. La URL y la clave del script nunca estÃ¡n en el cÃ³digo.
- **datos.json:** si la app se abre desde el servidor local de pruebas (puerto 8765), tambiÃ©n se
  guarda una copia en esta carpeta.

## Seguridad
El cÃ³digo es pÃºblico (GitHub Pages), pero no contiene ningÃºn dato ni clave: los coches viven en tu
Google Drive y las claves (Gemini y script) solo en cada dispositivo.
