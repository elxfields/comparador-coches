/**
 * Comparador de coches — servicio de sincronización en tu cuenta de Google.
 *
 * Guarda en un archivo de tu Google Drive (comparador-coches-datos.json):
 *   - los coches, tus ajustes (precios, viajes, pesos) y la cola de vídeos.
 * El móvil y el PC envían sus cambios aquí y reciben la versión combinada.
 *
 * Instalación (una sola vez):
 *   1. Pega este código en un proyecto nuevo de https://script.google.com
 *   2. Ejecuta la función «configurar» y acepta los permisos.
 *      En el registro de ejecución aparece la CLAVE para la app.
 *   3. Implementar → Nueva implementación → Aplicación web
 *      (Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario).
 *      Copia la URL de la aplicación web.
 *   4. En la app: Ajustes → Sincronización: pega la URL y la CLAVE.
 *
 * Sin la CLAVE nadie puede leer ni escribir tus datos aunque conozca la URL.
 */

const PROPS = PropertiesService.getScriptProperties();
const FILE_NAME = 'comparador-coches-datos.json';

function configurar() {
  let token = PROPS.getProperty('TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    PROPS.setProperty('TOKEN', token);
  }
  let fileId = PROPS.getProperty('FILE');
  let ok = false;
  if (fileId) { try { DriveApp.getFileById(fileId).getName(); ok = true; } catch (e) { ok = false; } }
  if (!ok) {
    const f = DriveApp.createFile(FILE_NAME, JSON.stringify(emptyDoc()), 'application/json');
    PROPS.setProperty('FILE', f.getId());
  }
  Logger.log('Archivo de datos en Drive: ' + FILE_NAME);
  Logger.log('CLAVE PARA LA APP: ' + token);
}

/** Si alguna vez la clave se filtra: ejecuta esto y pon la nueva en tus dispositivos. */
function cambiarClave() {
  PROPS.deleteProperty('TOKEN');
  configurar();
}

function doGet() {
  return out({ ok: true, msg: 'Comparador de coches: servicio activo' });
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: false, error: 'json' }); }
  const token = PROPS.getProperty('TOKEN');
  if (!token || !req || req.token !== token) return out({ ok: false, error: 'clave' });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return out({ ok: false, error: 'ocupado' });
  try {
    const file = DriveApp.getFileById(PROPS.getProperty('FILE'));
    let doc = {};
    try { doc = JSON.parse(file.getBlob().getDataAsString() || '{}'); } catch (x) { doc = {}; }

    if (req.op === 'ping') return out({ ok: true });

    if (req.op === 'sync') {
      const merged = mergeDoc(doc, req.doc || {});
      file.setContent(JSON.stringify(merged));
      return out({ ok: true, doc: merged });
    }

    if (req.op === 'add') {
      const n = addLinks(doc = normDoc(doc), req.links || []);
      if (n) file.setContent(JSON.stringify(doc));
      return out({ ok: true, added: n });
    }

    return out({ ok: false, error: 'op' });
  } finally {
    lock.releaseLock();
  }
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ===== Lógica de combinación (idéntica a la de la app) ===== */
/* SYNC-MERGE-INICIO */
function emptyDoc() { return { v: 1, cars: [], del: {}, cfg: null, queue: [], qdel: {} }; }
function normDoc(d) {
  d = d && typeof d === 'object' ? d : {};
  return {
    v: 1,
    cars: Array.isArray(d.cars) ? d.cars : [],
    del: d.del && typeof d.del === 'object' ? d.del : {},
    cfg: d.cfg && typeof d.cfg === 'object' ? d.cfg : null,
    queue: Array.isArray(d.queue) ? d.queue : [],
    qdel: d.qdel && typeof d.qdel === 'object' ? d.qdel : {}
  };
}
function ytIdOf(u) {
  const m = String(u || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
// Une dos versiones: en cada coche / vídeo gana el cambio más reciente (campo «u»);
// los borrados (del / qdel) ganan si son posteriores al último cambio.
function mergeDoc(a, b) {
  a = normDoc(a); b = normDoc(b);
  const maxMap = (x, y) => { const r = Object.assign({}, x); Object.keys(y).forEach(k => { r[k] = Math.max(r[k] || 0, y[k] || 0); }); return r; };
  const pick = (list, key) => {
    const m = new Map();
    list.forEach(it => { if (!it) return; const k = String(it[key]); const o = m.get(k); if (!o || (it.u || 0) > (o.u || 0)) m.set(k, it); });
    return Array.from(m.values());
  };
  const del = maxMap(a.del, b.del), qdel = maxMap(a.qdel, b.qdel);
  // Solo se descarta lo que tiene un borrado registrado posterior (o igual) a su último cambio.
  const gone = (t, u) => t != null && t >= (u || 0);
  const cars = pick(a.cars.concat(b.cars), 'id').filter(c => !gone(del[c.id], c.u));
  const queue = pick(a.queue.concat(b.queue), 'yt').filter(q => !gone(qdel[q.yt], q.u));
  const cfg = !a.cfg ? b.cfg : !b.cfg ? a.cfg : ((b.cfg.t || 0) > (a.cfg.t || 0) ? b.cfg : a.cfg);
  return { v: 1, cars: cars, del: del, cfg: cfg, queue: queue, qdel: qdel };
}
// Añade enlaces a la cola compartida (sin duplicados). Devuelve cuántos añadió.
function addLinks(doc, links) {
  const now = Date.now();
  let n = 0;
  links.forEach(l => {
    const yt = ytIdOf(l && l.url);
    if (!yt) return;
    const q = doc.queue.find(x => x.yt === yt);
    if (q && q.st !== 'err' && q.st !== 'skip') return;
    if (doc.cars.some(c => (c.src || []).some(s => ytIdOf(s.url) === yt))) return;
    doc.queue = doc.queue.filter(x => x.yt !== yt);
    doc.queue.push({ yt: yt, url: 'https://www.youtube.com/watch?v=' + yt, canal: String((l && l.canal) || '').slice(0, 80), st: 'pend', msg: '', added: now, u: now });
    n++;
  });
  return n;
}
/* SYNC-MERGE-FIN */
