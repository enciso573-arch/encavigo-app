/* Controles del catálogo. No inicia sesiones ni lee o escribe en Firebase. */
(function () {
  'use strict';
  const normalizar = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  document.addEventListener('DOMContentLoaded', () => {
    const d = document, buscar = d.getElementById('buscarPromos'), zona = d.getElementById('ubicacionPromos'), alertas = d.getElementById('notifBtn');
    const dialogo = d.getElementById('catalogoDialogo'), titulo = d.getElementById('catalogoTitulo'), contenido = d.getElementById('catalogoContenido');
    let origen, alertasActivas = false;
    const anunciadas = new Set();
    for (const b of d.querySelectorAll('#opEstrellas button')) {
      b.removeAttribute('onclick');
      b.addEventListener('click', () => window.opEstrella(Number(b.textContent)));
    }
    const sesionActiva = () => {
      const s = window.encaviSession;
      return !!s && !s.caducada && Date.now() - Number(s.timestamp) < 24 * 3600000 && ['demo', 'qr'].includes(s.origen);
    };
    function cerrar() { dialogo.hidden = true; origen?.focus(); }
    d.getElementById('catalogoCerrar').onclick = cerrar;
    dialogo.addEventListener('click', e => { if (e.target === dialogo) cerrar(); });
    d.addEventListener('keydown', e => {
      if (dialogo.hidden) return;
      if (e.key === 'Escape') cerrar();
      if (e.key === 'Tab') {
        const controles = [...dialogo.querySelectorAll('button,input')];
        const primero = controles[0], ultimo = controles[controles.length - 1];
        if (e.shiftKey && d.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && d.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      }
    });
    d.getElementById('mapBtn')?.addEventListener('click', () => { if (sesionActiva()) window.openMap?.(); });
    function abrir(nombre, boton) {
      if (!sesionActiva()) return false;
      origen = boton; titulo.textContent = nombre; contenido.replaceChildren(); dialogo.hidden = false;
      d.getElementById('catalogoCerrar').focus(); return true;
    }
    function texto(t) { const p = d.createElement('p'); p.textContent = t; contenido.append(p); return p; }
    function boton(t, fn) { const b = d.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = fn; contenido.append(b); return b; }
    const estado = mensaje => { d.getElementById('catalogoEstado').textContent = mensaje; };
    window.encaviCoincideBusqueda = c => !window.encaviBusqueda || normalizar([c.title, c.desc, c.badge].join(' ')).includes(normalizar(window.encaviBusqueda));
    buscar?.addEventListener('click', () => {
      if (!abrir('Buscar promociones', buscar)) return;
      const label = d.createElement('label'); label.htmlFor = 'consultaPromos'; label.textContent = 'Negocio, comida o servicio'; contenido.append(label);
      const input = d.createElement('input'); input.id = 'consultaPromos'; input.type = 'search'; input.placeholder = 'Ejemplo: comida o masaje'; input.value = window.encaviBusqueda || ''; contenido.append(input);
      const cantidad = texto('');
      const actualizar = () => { window.encaviBusqueda = input.value.trim(); window.actualizarCatalogo?.(); const n = (window.loadedCampaigns || []).filter(c => window.egSaleHoy?.(c) && window.encaviCoincideBusqueda(c)).length; cantidad.textContent = n + (n === 1 ? ' promoción disponible.' : ' promociones disponibles.'); estado(window.encaviBusqueda ? 'Búsqueda: ' + window.encaviBusqueda : ''); };
      input.addEventListener('input', actualizar);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') cerrar(); });
      boton('Ver resultados', cerrar); boton('Quitar búsqueda', () => { input.value = ''; actualizar(); cerrar(); });
      actualizar(); input.focus();
    });
    zona?.addEventListener('click', () => {
      if (!abrir('Ubicación de las promociones', zona)) return;
      texto('La cercanía se calcula con la ubicación de tu teléfono. No cambia el vehículo al que pertenece tu código.');
      const aviso = texto(window.__ENCAVI_ENTORNO__ === 'demo' ? 'Esta demostración muestra negocios de ejemplo; no solicita tu ubicación.' : 'Puedes consultar el mapa sin compartir tu ubicación.');
      boton('Ver mapa', () => { cerrar(); window.openMap?.(); });
      if (window.__ENCAVI_ENTORNO__ !== 'demo') boton('Usar mi ubicación', () => {
        aviso.textContent = 'Buscando tu ubicación…';
        window.solicitarUbicacion?.((ok, mensaje) => { aviso.textContent = mensaje; if (ok) actualizarZona(); });
      });
    });
    function actualizarZona() {
      const label = zona?.querySelector('.loc-text'); if (!label) return;
      label.textContent = Number.isFinite(window.currentLat) ? 'Ubicación del teléfono' : window.egZonaRuta === 'vallarta' ? 'Puerto Vallarta · Ver ubicación' : window.egZonaRuta === 'bahia' ? 'Bahía de Banderas · Ver ubicación' : 'Ver ubicación';
    }
    alertas?.addEventListener('click', () => {
      if (!abrir('Alertas de cercanía', alertas)) return;
      texto('Avisan de promociones a menos de 500 metros mientras esta página está abierta y tiene una ubicación precisa.');
      const aviso = texto(alertasActivas ? 'Las alertas están activas en esta página.' : 'Las alertas están desactivadas.');
      if (window.__ENCAVI_ENTORNO__ === 'demo') { aviso.textContent = 'Las alertas reales están desactivadas en la demostración.'; return; }
      if (!('Notification' in window)) { aviso.textContent = 'Este navegador no permite estas notificaciones. Puedes consultar la cercanía en el mapa.'; return; }
      boton(alertasActivas ? 'Desactivar alertas' : 'Activar alertas', async () => {
        if (alertasActivas) { alertasActivas = false; alertas.setAttribute('aria-pressed', 'false'); aviso.textContent = 'Alertas desactivadas.'; return; }
        try {
          const permiso = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
          if (permiso !== 'granted') { aviso.textContent = 'El permiso está bloqueado. Puedes cambiarlo en los ajustes del navegador.'; return; }
          window.solicitarUbicacion?.((ok, mensaje) => {
            alertasActivas = ok; alertas.setAttribute('aria-pressed', String(ok)); aviso.textContent = ok ? 'Alertas activas mientras mantengas abierta esta página.' : mensaje;
            if (ok) window.actualizarRadar?.(window.currentLat, window.currentLng);
          });
        } catch (_) { aviso.textContent = 'No fue posible activar las notificaciones en este navegador.'; }
      });
    });
    window.addEventListener('encavi-ubicacion', actualizarZona);
    window.addEventListener('encavi-catalogo', actualizarZona);
    window.addEventListener('encavi-cerca', async e => {
      if (!alertasActivas || !sesionActiva() || Notification.permission !== 'granted') return;
      for (const c of e.detail || []) {
        if (anunciadas.has(c.id)) continue; anunciadas.add(c.id);
        try {
          const opciones = { body: c.desc + ' · A ' + Math.round(c.distKm * 1000) + ' m', tag: 'encavi-' + c.id, icon: '/icon-192.png' };
          const reg = await navigator.serviceWorker?.getRegistration();
          if (reg) await reg.showNotification('EncaviGO · ' + c.title, opciones); else new Notification('EncaviGO · ' + c.title, opciones);
        } catch (_) { estado('Hay promociones cerca de ti. Consúltalas en el mapa.'); }
      }
    });
    actualizarZona();
  });
})();
