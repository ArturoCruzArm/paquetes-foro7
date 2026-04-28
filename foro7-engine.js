/* ═══════════════════════════════════════════════════════
   FORO 7 — Motor de precios, cotización y persistencia
   Compartido entre index.html y todas las subpáginas
   ═══════════════════════════════════════════════════════ */
(function(window){
'use strict';

var F7 = {};

/* ─── Utilidades ─── */
F7.fmt = function(n){ return '$'+n.toLocaleString('es-MX'); };

/* ─── localStorage ─── */
F7.getData = function(){
    try { return JSON.parse(localStorage.getItem('f7event')) || null; }
    catch(e){ return null; }
};
F7.saveData = function(data){
    localStorage.setItem('f7event', JSON.stringify(data));
};

/* ─── Paquetes ─── */
F7.packages = [
    {id:0, name:'Foto y Video Digital', slug:'foto-digital', badge:'100% Digital', file:'foto-digital.html', utm:'foto_digital'},
    {id:1, name:'Popular', slug:'popular', badge:'', file:'popular.html', utm:'popular'},
    {id:2, name:'Completo', slug:'completo', badge:'', file:'completo.html', utm:'completo'},
    {id:3, name:'Súper Paquete', slug:'super', badge:'★ Recomendado', file:'super-paquete.html', utm:'super'},
    {id:4, name:'Lucido', slug:'lucido', badge:'', file:'lucido.html', utm:'lucido'},
    {id:5, name:'Premium Accesible', slug:'premium', badge:'Todo Incluido', file:'premium-accesible.html', utm:'premium_accesible'}
];

/* ─── Desglose por paquete ─── */
F7.getItems = function(pkgIndex, hours, sessionHrs){
    var items = [];
    var h = hours, sh = sessionHrs;
    var clipProy = 1000 + (sh > 0 ? sh * 250 : 0);

    // Todos los paquetes
    items.push({name:'Cobertura foto+video ' + h + ' hrs', price:h*900});
    items.push({name:'Galería web privada', price:800});
    items.push({name:'Video completo del evento', price:1200+h*250});
    items.push({name:'Mi historia en fotos (collage)', price:0});

    switch(pkgIndex){
        case 0: // Foto y Video Digital
            items.push({name:'1 videoclip de sesión', price:700});
            items.push({name:'Clip para proyección en salón', price:clipProy});
            break;
        case 1: // Popular
            items.push({name:'1 videoclip de sesión', price:700});
            items.push({name:'Clip para proyección en salón', price:clipProy});
            items.push({name:'50 fotos impresas 5×7"', price:570});
            items.push({name:'Ampliación 28×36cm con marco', price:600});
            items.push({name:'USB personalizada', price:200});
            break;
        case 2: // Completo
            items.push({name:'2 videoclips de sesión', price:1400});
            items.push({name:'Video resumen', price:1200+h*150});
            items.push({name:'Clip para proyección en salón', price:clipProy});
            items.push({name:'Visita a casa antes de misa', price:0});
            items.push({name:'100 fotos impresas 5×7"', price:920});
            items.push({name:'Ampliación 40×50cm con marco', price:800});
            items.push({name:'USB personalizada', price:200});
            break;
        case 3: // Súper Paquete
            items.push({name:'3 videoclips de sesión', price:2100});
            items.push({name:'Video resumen', price:1200+h*150});
            items.push({name:'Clip para proyección en salón', price:clipProy});
            items.push({name:'Visita a casa antes de misa', price:0});
            items.push({name:'Sesión en 2 locaciones', price:0});
            items.push({name:'150 fotos impresas 5×7"', price:1270});
            items.push({name:'Ampliación 50×60cm con marco', price:1200});
            items.push({name:'USB personalizada', price:200});
            items.push({name:'Caja rígida personalizada', price:300});
            items.push({name:'Invitación web completa', price:2000});
            break;
        case 4: // Lucido
            items.push({name:'Película cinematográfica (30–50 min)', price:3000+h*400});
            items.push({name:'4 videoclips de sesión', price:2800});
            items.push({name:'Video resumen', price:1200+h*150});
            items.push({name:'Clip para proyección en salón', price:clipProy});
            items.push({name:'Visita a casa antes de misa', price:0});
            items.push({name:'Sesión en 2 locaciones', price:0});
            items.push({name:'Dron 4K incluido', price:1500});
            items.push({name:'150 fotos impresas 5×7"', price:1270});
            items.push({name:'Ampliación 60×80cm con marco', price:1700});
            items.push({name:'Fotolibro 12×24" + caja + mini', price:2400});
            items.push({name:'USB personalizada', price:200});
            items.push({name:'Invitación web completa', price:2000});
            break;
        case 5: // Premium Accesible
            items.push({name:'Película cinematográfica (15–25 min)', price:3000+h*400});
            items.push({name:'5+ videoclips de sesión', price:3500});
            items.push({name:'Video resumen', price:1200+h*150});
            items.push({name:'Clip para proyección en salón', price:clipProy});
            items.push({name:'Visita a casa antes de misa', price:0});
            items.push({name:'Sesión en 3 locaciones', price:0});
            items.push({name:'Dron 4K completo todo el evento', price:1500});
            items.push({name:'Transmisión en vivo (YouTube + Facebook)', price:2500});
            items.push({name:'200 fotos impresas 5×7"', price:1620});
            items.push({name:'2 ampliaciones 60×80cm con marco', price:3400});
            items.push({name:'Fotolibro 12×24" + caja + mini', price:2400});
            items.push({name:'USB premium + respaldo', price:200});
            items.push({name:'Caja de madera premium grabada', price:500});
            items.push({name:'Invitación web completa', price:2000});
            break;
    }
    return items;
};

/* ─── Calcular precio de paquete ─── */
F7.calcPrice = function(pkgIndex, hours, sessionHrs){
    if(hours <= 0) return {price:0,retail:0,savings:0,savingsPct:0,items:[]};
    var items = F7.getItems(pkgIndex, hours, sessionHrs);
    var retail = 0;
    items.forEach(function(it){ retail += it.price; });

    var discounts = [0.20, 0.30, 0.35, 0.38, 0.45, 0.55];
    var hrsBonus = hours >= 8 ? 0.05 : hours >= 6 ? 0.03 : 0;
    var disc = Math.min(discounts[pkgIndex] + hrsBonus, 0.60);

    var savings = Math.round(retail * disc);
    var price = retail - savings;
    return {price:price, retail:retail, savings:savings, savingsPct:Math.round(disc*100), items:items};
};

/* ─── Inyectar CSS del modal de cotización ─── */
(function(){
    var style = document.createElement('style');
    style.textContent = ''
    /* Modal overlay */
    +'.q-modal{display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.85);align-items:flex-start;justify-content:center;overflow-y:auto;padding:1rem}'
    +'.q-modal-inner{width:100%;max-width:600px;margin:2rem auto;position:relative}'
    /* Actions bar */
    +'.q-actions{display:flex;gap:.6rem;justify-content:center;margin-bottom:1rem;flex-wrap:wrap}'
    +'.q-btn-print,.q-btn-wa,.q-btn-close{padding:.6rem 1.2rem;border:none;font-size:.75rem;font-weight:600;font-family:"DM Sans",sans-serif;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;border-radius:2px;transition:transform .2s}'
    +'.q-btn-print{background:#c9a84c;color:#0d1b2a}.q-btn-print:hover{transform:translateY(-1px)}'
    +'.q-btn-wa{background:#25D366;color:#fff}.q-btn-wa:hover{transform:translateY(-1px)}'
    +'.q-btn-close{background:transparent;color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.15)}.q-btn-close:hover{color:#fff}'
    /* Quote document */
    +'.quote-doc{background:#fff;color:#1a1a1a;padding:2.5rem 2rem;font-family:"DM Sans",sans-serif;font-size:.82rem;line-height:1.5}'
    +'.q-header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #c9a84c;padding-bottom:1rem;margin-bottom:1.2rem}'
    +'.q-logo{font-family:"Cormorant Garamond",serif;font-size:1.8rem;font-weight:700;color:#c9a84c}'
    +'.q-logo span{color:#0d1b2a;font-weight:400}'
    +'.q-company{text-align:right;font-size:.65rem;color:#666;line-height:1.4}'
    +'.q-title{font-family:"Cormorant Garamond",serif;font-size:1.4rem;font-weight:700;text-align:center;color:#0d1b2a;margin-bottom:.8rem;letter-spacing:.15em}'
    +'.q-meta{display:flex;justify-content:space-between;font-size:.72rem;color:#666;margin-bottom:1.5rem;padding-bottom:.8rem;border-bottom:1px solid #eee}'
    +'.q-section{margin-bottom:1.5rem}'
    +'.q-section-title{font-family:"Cormorant Garamond",serif;font-size:.95rem;font-weight:700;color:#c9a84c;margin-bottom:.5rem;padding-bottom:.2rem;border-bottom:1px solid #f0e8d0}'
    +'.q-table{width:100%;border-collapse:collapse}'
    +'.q-table td{padding:.35rem .4rem;border-bottom:1px solid #f5f5f5;font-size:.78rem}'
    +'.q-table td:last-child{text-align:right;white-space:nowrap}'
    +'.q-table .q-total-row td{border-top:1px solid #ddd;border-bottom:none;padding-top:.5rem}'
    +'.q-amount{color:#333;font-weight:500}'
    +'.q-summary{background:#faf8f3;padding:1rem 1.2rem;margin:1.5rem 0;border-left:3px solid #c9a84c}'
    +'.q-sum-row{display:flex;justify-content:space-between;padding:.3rem 0;font-size:.82rem}'
    +'.q-discount{color:#888}'
    +'.q-final{font-size:1.1rem;font-weight:700;color:#0d1b2a;border-top:2px solid #c9a84c;padding-top:.6rem;margin-top:.4rem}'
    +'.q-payment{margin-bottom:1.5rem}'
    +'.q-payment ul{list-style:none;padding:0}'
    +'.q-payment li{padding:.2rem 0;font-size:.75rem;color:#555}'
    +'.q-payment li::before{content:"✓ ";color:#c9a84c;font-weight:700}'
    +'.q-footer{text-align:center;border-top:1px solid #eee;padding-top:1rem;font-size:.7rem;color:#888}'
    +'.q-footer strong{color:#0d1b2a}'
    +'.q-valid{margin-top:.3rem;font-size:.6rem;color:#aaa;letter-spacing:.1em;text-transform:uppercase}'
    /* Print styles */
    +'@media print{body>*:not(.q-modal){display:none!important}.q-modal{position:static!important;background:#fff!important;display:block!important;padding:0!important}.q-modal-inner{margin:0!important}.q-actions{display:none!important}.quote-doc{padding:1.5cm;box-shadow:none!important}}'
    +'@media(max-width:500px){.quote-doc{padding:1.5rem 1rem}.q-header{flex-direction:column;text-align:center;gap:.5rem}.q-company{text-align:center}.q-meta{flex-direction:column;gap:.2rem}}';
    document.head.appendChild(style);
})();

/* ─── Generar cotización ─── */
F7.generateQuoteHTML = function(pkgIndex){
    var data = F7.getData();
    if(!data || !data.totalHours) return null;

    var pkg = F7.packages[pkgIndex];
    var r = F7.calcPrice(pkgIndex, data.totalHours, data.sessionHours||0);

    var now = new Date();
    var folio = 'F7-' + now.getFullYear() + '-' + String(Math.floor(Math.random()*9999)+1).padStart(4,'0');
    var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    var fecha = now.getDate() + ' de ' + meses[now.getMonth()] + ' ' + now.getFullYear();

    // Segmentos del evento
    var segLabels = {sesion:'Sesión previa',casa:'Casa / arreglo',misa:'Ceremonia / misa',fiesta:'Fiesta / recepción'};
    var segsHtml = '';
    if(data.segments){
        for(var k in data.segments){
            var seg = data.segments[k];
            if(seg && seg.active){
                segsHtml += '<tr><td>'+segLabels[k]+'</td><td>'+seg.start+' — '+seg.end+'</td><td style="text-align:right">'+seg.hours+' hrs</td></tr>';
            }
        }
    }
    segsHtml += '<tr class="q-total-row"><td><strong>Total cobertura</strong></td><td></td><td style="text-align:right"><strong>'+data.totalHours+' hrs</strong></td></tr>';

    // Desglose de items
    var itemsHtml = '';
    r.items.forEach(function(it){
        itemsHtml += '<tr><td>'+it.name+'</td><td class="q-amount">'+(it.price>0?F7.fmt(it.price):'Incluido')+'</td></tr>';
    });

    return '<div class="quote-doc" id="quoteDoc">'
        +'<div class="q-header"><div class="q-logo">FORO <span>7</span></div><div class="q-company">Fotografía · Video · Producciones<br>León, Guanajuato<br>Tel: 477-920-3776</div></div>'
        +'<div class="q-title">COTIZACIÓN</div>'
        +'<div class="q-meta"><div><strong>Folio:</strong> '+folio+'</div><div><strong>Fecha:</strong> '+fecha+'</div></div>'
        +'<div class="q-section"><div class="q-section-title">Cliente</div>'
        +'<table class="q-table"><tr><td>Nombre</td><td>'+(data.name||'—')+'</td></tr><tr><td>Teléfono</td><td>'+(data.phone||'—')+'</td></tr></table></div>'
        +'<div class="q-section"><div class="q-section-title">Evento — Horario de cobertura</div>'
        +'<table class="q-table" style="table-layout:auto">'+segsHtml+'</table></div>'
        +'<div class="q-section"><div class="q-section-title">Paquete: '+pkg.name+(pkg.badge?' — '+pkg.badge:'')+'</div>'
        +'<table class="q-table">'+itemsHtml+'</table></div>'
        +'<div class="q-summary">'
        +'<div class="q-sum-row"><span>Valor individual de cada servicio</span><span>'+F7.fmt(r.retail)+'</span></div>'
        +'<div class="q-sum-row q-discount"><span>Ahorro por paquete ('+r.savingsPct+'%)</span><span>−'+F7.fmt(r.savings)+'</span></div>'
        +'<div class="q-sum-row q-final"><span>TOTAL</span><span>'+F7.fmt(r.price)+' MXN</span></div>'
        +'</div>'
        +'<div class="q-payment"><div class="q-section-title">Formas de pago</div>'
        +'<ul><li>Aparta tu fecha con cualquier monto — sin mínimo</li><li>Parcialidades sin intereses a tu ritmo</li><li>Único requisito: liquidar 8 días antes del evento</li><li>Transferencia bancaria, depósito en efectivo o pago en efectivo</li></ul></div>'
        +'<div class="q-footer"><div>WhatsApp: <strong>477-920-3776</strong></div><div>paquetes.invitados.org</div><div class="q-valid">Cotización válida por 30 días · Precios sujetos a disponibilidad</div></div>'
        +'</div>';
};

/* ─── Mostrar modal de cotización ─── */
F7.showQuote = function(pkgIndex){
    var data = F7.getData();
    if(!data || !data.totalHours){
        // Sin datos — redirigir a index para llenar splash
        localStorage.setItem('f7_pending_quote', String(pkgIndex));
        if(window.location.pathname.indexOf('index') === -1 && !window.location.pathname.match(/\/$/)){
            window.location.href = 'index.html';
        }
        return;
    }

    var html = F7.generateQuoteHTML(pkgIndex);
    if(!html) return;

    var modal = document.getElementById('quoteModal');
    if(!modal){
        modal = document.createElement('div');
        modal.id = 'quoteModal';
        modal.className = 'q-modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = '<div class="q-modal-inner">'
        +'<div class="q-actions">'
        +'<button class="q-btn-print" onclick="F7.printQuote()">Descargar PDF</button>'
        +'<button class="q-btn-wa" onclick="F7.sendQuoteWA('+pkgIndex+')">Enviar por WhatsApp</button>'
        +'<button class="q-btn-close" onclick="F7.closeQuote()">Cerrar</button>'
        +'</div>'
        +html
        +'</div>';

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Cerrar con clic fuera
    modal.addEventListener('click', function(e){ if(e.target === modal) F7.closeQuote(); });

    // Track
    if(typeof fbq==='function') fbq('track','Lead',{value:F7.calcPrice(pkgIndex, data.totalHours, data.sessionHours||0).price, currency:'MXN'});
    if(typeof gtag==='function') gtag('event','generate_lead',{value:F7.calcPrice(pkgIndex, data.totalHours, data.sessionHours||0).price, currency:'MXN'});
};

F7.closeQuote = function(){
    var m = document.getElementById('quoteModal');
    if(m) m.style.display = 'none';
    document.body.style.overflow = '';
};

F7.printQuote = function(){
    window.print();
};

F7.sendQuoteWA = function(pkgIndex){
    var data = F7.getData();
    if(!data) return;
    var pkg = F7.packages[pkgIndex];
    var r = F7.calcPrice(pkgIndex, data.totalHours, data.sessionHours||0);

    var msg = 'Hola, me interesa el paquete *' + pkg.name + '*\n\n';
    if(data.name) msg += 'Nombre: ' + data.name + '\n';
    if(data.phone) msg += 'Teléfono: ' + data.phone + '\n';
    msg += 'Cobertura: ' + data.totalHours + ' horas\n';

    var segLabels = {sesion:'Sesión',casa:'Casa',misa:'Misa',fiesta:'Fiesta'};
    var segs = [];
    if(data.segments){
        for(var k in data.segments){
            if(data.segments[k] && data.segments[k].active)
                segs.push(segLabels[k]+' '+data.segments[k].start+'–'+data.segments[k].end);
        }
    }
    if(segs.length) msg += 'Horario: ' + segs.join(', ') + '\n';

    msg += '\nPrecio: ' + F7.fmt(r.price) + ' MXN';
    msg += '\nAhorro: ' + F7.fmt(r.savings) + ' (' + r.savingsPct + '%)';
    msg += '\nValor individual: ' + F7.fmt(r.retail);

    window.open('https://wa.me/5214779203776?text=' + encodeURIComponent(msg) + '&utm_source=web&utm_medium=cotizacion&utm_campaign=paquete_' + pkg.utm, '_blank');
};

/* ─── Actualizar precio en página de detalle ─── */
F7.updateDetailPrice = function(pkgIndex){
    var data = F7.getData();
    if(!data || !data.totalHours) return false;

    var r = F7.calcPrice(pkgIndex, data.totalHours, data.sessionHours||0);

    var priceEl = document.querySelector('.pkg-price');
    if(priceEl) priceEl.innerHTML = F7.fmt(r.price) + ' <small>MXN</small>';

    // Update/create savings line
    var saveEl = document.querySelector('.pkg-save-dynamic');
    if(!saveEl){
        saveEl = document.createElement('p');
        saveEl.className = 'pkg-save-dynamic';
        saveEl.style.cssText = 'font-size:.75rem;color:#4ecdc4;margin-top:.3rem';
        var noteEl = document.querySelector('.pkg-note');
        if(noteEl) noteEl.parentNode.insertBefore(saveEl, noteEl);
        else if(priceEl) priceEl.parentNode.insertBefore(saveEl, priceEl.nextSibling);
    }
    saveEl.textContent = 'Ahorras ' + F7.fmt(r.savings) + ' (' + r.savingsPct + '%) · ' + data.totalHours + ' hrs cobertura';

    // Hide static savings line if present
    var staticSave = document.querySelector('p[style*="4ecdc4"]');
    if(staticSave && staticSave !== saveEl) staticSave.style.display = 'none';

    return true;
};

/* ─── Event bar para subpáginas ─── */
F7.showEventBar = function(){
    var data = F7.getData();
    if(!data || !data.totalHours) return;

    var bar = document.createElement('div');
    bar.style.cssText = 'background:#1b2838;border-bottom:1px solid rgba(201,168,76,.18);padding:.5rem 1rem;display:flex;align-items:center;justify-content:center;gap:1rem;font-size:.72rem;flex-wrap:wrap;font-family:"DM Sans",sans-serif';

    var info = '';
    if(data.name) info += '<strong style="color:#c9a84c">' + data.name + '</strong> · ';
    info += '<strong style="color:#c9a84c">' + data.totalHours + ' hrs</strong> <span style="color:rgba(255,255,255,.5)">cobertura</span>';

    var segLabels = {sesion:'Sesión',casa:'Casa',misa:'Misa',fiesta:'Fiesta'};
    var activeSegs = [];
    if(data.segments){
        for(var k in data.segments){
            if(data.segments[k] && data.segments[k].active) activeSegs.push(segLabels[k]);
        }
    }
    if(activeSegs.length) info += ' · <span style="color:rgba(255,255,255,.4)">' + activeSegs.join(' + ') + '</span>';

    bar.innerHTML = info + ' <a href="index.html" style="color:#c9a84c;font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;border:1px solid rgba(201,168,76,.3);padding:.15rem .5rem;margin-left:.5rem;text-decoration:none">Modificar</a>';

    var nav = document.querySelector('.nav');
    if(nav) nav.parentNode.insertBefore(bar, nav.nextSibling);
};

/* ─── Supabase (placeholder — se activa cuando haya anon key) ─── */
F7.supabaseUrl = 'https://nzpujmlienzfetqcgsxz.supabase.co';
F7.supabaseKey = null; // Se configura cuando esté disponible

F7.saveToSupabase = function(data, pkgIndex){
    if(!F7.supabaseKey) return; // No configurado aún
    var payload = {
        nombre: data.name || null,
        telefono: data.phone || null,
        horas_total: data.totalHours,
        horas_sesion: data.sessionHours || 0,
        segmentos: data.segments || {},
        paquete: pkgIndex !== undefined ? F7.packages[pkgIndex].name : null,
        precio: pkgIndex !== undefined ? F7.calcPrice(pkgIndex, data.totalHours, data.sessionHours||0).price : null,
        created_at: new Date().toISOString()
    };
    fetch(F7.supabaseUrl + '/rest/v1/cotizaciones', {
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':F7.supabaseKey,'Authorization':'Bearer '+F7.supabaseKey,'Prefer':'return=minimal'},
        body:JSON.stringify(payload)
    }).catch(function(){});
};

window.F7 = F7;

})(window);
