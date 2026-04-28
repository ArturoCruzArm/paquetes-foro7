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
    F7.trackDecision('event_data_saved', data);
};


F7.getFreshData = function(){
    var stored = F7.getData() || {};
    if(typeof F7.captureCurrentEventData === 'function'){
        var captured = F7.captureCurrentEventData(stored) || stored;
        if(captured && captured.totalHours > 0){
            F7.saveData(captured);
            return captured;
        }
    }
    return stored;
};

F7.getSessionToken = function(){
    var key = 'f7_session_token';
    var token = localStorage.getItem(key);
    if(!token){
        token = (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'f7-' + Date.now() + '-' + Math.random().toString(16).slice(2);
        localStorage.setItem(key, token);
    }
    return token;
};

F7.queueDecision = function(row){
    var key = 'f7_pending_decisions';
    var rows = [];
    try { rows = JSON.parse(localStorage.getItem(key)) || []; } catch(e){}
    rows.push(row);
    if(rows.length > 100) rows = rows.slice(rows.length - 100);
    localStorage.setItem(key, JSON.stringify(rows));
};

F7.trackDecision = function(eventType, payload){
    if(!eventType) return;
    var row = {
        session_token: F7.getSessionToken(),
        event_type: eventType,
        payload: payload || {},
        created_at: new Date().toISOString()
    };

    if(!F7.supabaseKey){
        F7.queueDecision(row);
        return;
    }

    fetch(F7.supabaseUrl + '/rest/v1/quote_decisions', {
        method:'POST',
        headers:F7.supabaseHeaders('return=minimal'),
        body:JSON.stringify(row)
    }).catch(function(){ F7.queueDecision(row); });
};

F7.flushPendingDecisions = function(){
    if(!F7.supabaseKey) return;
    var key = 'f7_pending_decisions';
    var rows = [];
    try { rows = JSON.parse(localStorage.getItem(key)) || []; } catch(e){}
    if(!rows.length) return;
    fetch(F7.supabaseUrl + '/rest/v1/quote_decisions', {
        method:'POST',
        headers:F7.supabaseHeaders('return=minimal'),
        body:JSON.stringify(rows)
    }).then(function(res){ if(res.ok) localStorage.removeItem(key); }).catch(function(){});
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
            items.push({name:'Ampliacion 40x50cm con marco', price:900});
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
            items.push({name:'Dron 4K completo', price:2500});
            items.push({name:'150 fotos impresas 5×7"', price:1270});
            items.push({name:'Ampliación 60×80cm con marco', price:1700});
            items.push({name:'Fotolibro 12×24" + caja + mini', price:3400});
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
            items.push({name:'Dron 4K completo todo el evento', price:2500});
            items.push({name:'Transmision en vivo (YouTube + Facebook) ' + h + ' hrs', price:h*900});
            items.push({name:'200 fotos impresas 5×7"', price:1620});
            items.push({name:'2 ampliaciones 60×80cm con marco', price:3400});
            items.push({name:'Fotolibro 12×24" + caja + mini', price:3400});
            items.push({name:'USB premium + respaldo', price:200});
            items.push({name:'Caja de madera premium grabada', price:500});
            items.push({name:'Invitación web completa', price:2000});
            break;
    }
    return items;
};

/* --- Reglas de descuento y pisos --- */
F7.discountRules = function(mainCount, hours){
    var svc = Math.max(0, mainCount) * 10;
    var hrs = hours >= 6 ? 20 : hours >= 5 ? 15 : hours >= 4 ? 10 : hours >= 3 ? 5 : 0;
    var combined = Math.min(svc + hrs, 60);
    return {
        services: svc,
        hours: hrs,
        combined: combined,
        serviceCap: Math.min(combined, 45),
        editCap: Math.min(combined, 35),
        physicalCap: Math.min(combined, 25)
    };
};

F7.packageStep = [0, 300, 900, 1200, 1500, 1800];

F7.calcPackageRaw = function(pkgIndex, hours, sessionHrs){
    var items = F7.getItems(pkgIndex, hours, sessionHrs);
    var retail = 0;
    items.forEach(function(it){ retail += it.price; });

    var discounts = [0.20, 0.30, 0.35, 0.38, 0.45, 0.50];
    var hrsBonus = hours >= 8 ? 0.05 : hours >= 6 ? 0.03 : 0;
    var disc = Math.min(discounts[pkgIndex] + hrsBonus, 0.60);
    var rawSavings = Math.round(retail * disc);
    var rawPrice = retail - rawSavings;
    return {price:rawPrice, retail:retail, savings:rawSavings, savingsPct:Math.round(disc*100), items:items, adjusted:false};
};

/* --- Calcular precio de paquete --- */
F7.calcPrice = function(pkgIndex, hours, sessionHrs){
    if(hours <= 0) return {price:0,retail:0,savings:0,savingsPct:0,items:[],adjusted:false};

    var r = F7.calcPackageRaw(pkgIndex, hours, sessionHrs);

    // Regla de negocio: cada paquete superior debe ganar mas que el anterior.
    // El descuento puede ser atractivo, pero no puede hacer que un paquete mas completo cueste menos.
    if(pkgIndex > 0){
        var prev = F7.calcPrice(pkgIndex - 1, hours, sessionHrs);
        var minOrderedPrice = prev.price + F7.packageStep[pkgIndex];
        if(r.price < minOrderedPrice){
            r.price = Math.min(r.retail, minOrderedPrice);
            r.adjusted = true;
        }
    }

    r.savings = Math.max(0, r.retail - r.price);
    r.savingsPct = r.retail > 0 ? Math.round((r.savings / r.retail) * 100) : 0;
    return r;
};

/* Exponer F7 globalmente antes de cualquier side effect */
window.F7 = F7;

/* ─── Inyectar CSS del modal de cotización ─── */
try{(function(){
    var style = document.createElement('style');
    style.textContent = ''
    /* Modal overlay */
    +'.q-modal{display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.85);align-items:flex-start;justify-content:center;overflow-y:auto;padding:1rem}'
    +'.q-modal-inner{width:100%;max-width:816px;margin:2rem auto;position:relative}'
    /* Actions bar */
    +'.q-actions{display:flex;gap:.6rem;justify-content:center;margin-bottom:1rem;flex-wrap:wrap}'
    +'.q-btn-print,.q-btn-wa,.q-btn-close{padding:.6rem 1.2rem;border:none;font-size:.75rem;font-weight:600;font-family:"DM Sans",sans-serif;cursor:pointer;letter-spacing:.08em;text-transform:uppercase;border-radius:2px;transition:transform .2s}'
    +'.q-btn-print{background:#c9a84c;color:#0d1b2a}.q-btn-print:hover{transform:translateY(-1px)}'
    +'.q-btn-wa{background:#25D366;color:#fff}.q-btn-wa:hover{transform:translateY(-1px)}'
    +'.q-btn-close{background:transparent;color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.15)}.q-btn-close:hover{color:#fff}'
    /* Quote document */
    +'.quote-doc{background:#fff!important;color:#1a1a1a!important;width:min(100%,816px);min-height:1056px;margin:0 auto;padding:48px 56px;box-sizing:border-box;font-family:"DM Sans",sans-serif;font-size:12px;line-height:1.45;box-shadow:0 18px 60px rgba(0,0,0,.35)}'
    +'.q-header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #c9a84c;padding-bottom:14px;margin-bottom:16px}'
    +'.q-logo{font-family:"Cormorant Garamond",serif;font-size:26px;font-weight:700;color:#c9a84c;letter-spacing:.04em}'
    +'.q-logo span{color:#0d1b2a;font-weight:400}'
    +'.q-company{text-align:right;font-size:.65rem;color:#666;line-height:1.4}'
    +'.q-title{font-family:"Cormorant Garamond",serif;font-size:20px;font-weight:700;text-align:center;color:#0d1b2a;margin:12px 0 10px;letter-spacing:.16em}'
    +'.q-meta{display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:18px;padding:8px 0 10px;border-bottom:1px solid #e8e1d2}'
    +'.q-section{margin-bottom:14px;break-inside:avoid}'
    +'.q-section-title{font-family:"Cormorant Garamond",serif;font-size:14px;font-weight:700;color:#8b6f24;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e8dcc0}'
    +'.quote-doc *{color:inherit}.q-table{width:100%!important;min-width:0!important;max-width:100%!important;border-collapse:collapse;color:#1a1a1a!important;table-layout:fixed;border:1px solid #eee7d8}'
    +'.q-table td{padding:6px 8px;border-bottom:1px solid #eee7d8;font-size:11px;color:#1a1a1a!important;background:#fff!important;vertical-align:top;overflow-wrap:anywhere}'
    +'.q-table td:last-child{text-align:right;white-space:normal;width:34%}'
    +'.q-table .q-total-row td{border-top:2px solid #d8c58d;border-bottom:none;padding-top:7px;background:#fbfaf6!important}'
    +'.q-amount{color:#333;font-weight:500}'
    +'.q-summary{background:#faf8f3!important;color:#1a1a1a!important;padding:12px 16px;margin:16px 0;border:1px solid #e6dbc0;border-left:4px solid #c9a84c;break-inside:avoid}'
    +'.q-sum-row{display:flex;justify-content:space-between;gap:16px;padding:4px 0;font-size:12px}'
    +'.q-discount{color:#888}'
    +'.q-final{font-size:1.1rem;font-weight:700;color:#0d1b2a;border-top:2px solid #c9a84c;padding-top:.6rem;margin-top:.4rem}'
    +'.q-payment{margin-bottom:14px;break-inside:avoid}'
    +'.q-payment ul{list-style:none;padding:0}'
    +'.q-payment li{padding:.2rem 0;font-size:.75rem;color:#333!important}'
    +'.q-payment li::before{content:"✓ ";color:#c9a84c;font-weight:700}'
    +'.q-footer{text-align:center;border-top:1px solid #e8e1d2;padding-top:12px;margin-top:12px;font-size:10px;color:#555!important}'
    +'.q-footer strong{color:#0d1b2a!important}'
    +'.q-modal .quote-doc,.q-modal .quote-doc p,.q-modal .quote-doc div,.q-modal .quote-doc span,.q-modal .quote-doc table,.q-modal .quote-doc tr,.q-modal .quote-doc td,.q-modal .quote-doc li{color:#1a1a1a!important}'
    +'.q-modal .quote-doc .q-section-title,.q-modal .quote-doc .q-logo{color:#c9a84c!important}'
    +'.q-modal .quote-doc .q-logo span,.q-modal .quote-doc .q-final,.q-modal .quote-doc .q-footer strong{color:#0d1b2a!important}'
    +'.q-modal .quote-doc .q-table td{background:#fff!important;color:#1a1a1a!important}'
    +'.q-valid{margin-top:.3rem;font-size:.6rem;color:#aaa;letter-spacing:.1em;text-transform:uppercase}'
    /* Print styles */
    +'@page{size:letter;margin:0} @media print{html,body{background:#fff!important;color:#111!important;width:216mm;min-height:279mm}body>*:not(.q-modal){display:none!important}.q-modal{position:static!important;background:#fff!important;display:block!important;padding:0!important}.q-modal-inner{margin:0!important;max-width:none!important;width:100%!important}.q-actions{display:none!important}.quote-doc{background:#fff!important;color:#111!important;width:216mm;min-height:279mm;padding:14mm 16mm;box-shadow:none!important}.quote-doc *{color:inherit}.q-table{border-color:#ddd!important;min-width:0!important;max-width:100%!important}.q-table td{color:#111!important;background:#fff!important}}'
    +'@media(max-width:500px){.quote-doc{padding:1.5rem 1rem}.q-header{flex-direction:column;text-align:center;gap:.5rem}.q-company{text-align:center}.q-meta{flex-direction:column;gap:.2rem}}';
    document.head.appendChild(style);
})();}catch(e){}
F7.generateQuoteHTML = function(pkgIndex){
    var data = F7.getFreshData();
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
    segsHtml += '<tr class="q-total-row"><td style="color:#1a1a1a!important"><strong>Total cobertura</strong></td><td style="color:#1a1a1a!important"></td><td style="text-align:right;color:#1a1a1a!important"><strong>'+data.totalHours+' hrs</strong></td></tr>';

    // Desglose de items
    var itemsHtml = '';
    r.items.forEach(function(it){
        itemsHtml += '<tr><td style="color:#1a1a1a!important">'+it.name+'</td><td class="q-amount" style="color:#333!important">'+(it.price>0?F7.fmt(it.price):'Incluido')+'</td></tr>';
    });

    return '<div class="quote-doc" id="quoteDoc">'
        +'<div class="q-header"><div class="q-logo">FORO <span>7</span></div><div class="q-company">Fotografía · Video · Producciones<br>León, Guanajuato<br>Tel: 477-920-3776</div></div>'
        +'<div class="q-title">COTIZACIÓN</div>'
        +'<div class="q-meta"><div><strong>Folio:</strong> '+folio+'</div><div><strong>Fecha:</strong> '+fecha+'</div></div>'
        +'<div class="q-section"><div class="q-section-title">Cliente</div>'
        +'<table class="q-table" style="width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed;border-collapse:collapse;box-sizing:border-box"><tr><td>Nombre</td><td>'+(data.name||'—')+'</td></tr><tr><td>Teléfono</td><td>'+(data.phone||'—')+'</td></tr></table></div>'
        +'<div class="q-section"><div class="q-section-title">Evento — Horario de cobertura</div>'
        +'<table class="q-table" style="width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed;border-collapse:collapse;box-sizing:border-box">'+segsHtml+'</table></div>'
        +'<div class="q-section"><div class="q-section-title">Paquete: '+pkg.name+(pkg.badge?' — '+pkg.badge:'')+'</div>'
        +'<table class="q-table" style="width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed;border-collapse:collapse;box-sizing:border-box">'+itemsHtml+'</table></div>'
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
    var data = F7.getFreshData();
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
    var quoteTotal = F7.calcPrice(pkgIndex, data.totalHours, data.sessionHours||0);
    F7.trackDecision('quote_opened', {package_slug:F7.packages[pkgIndex].slug, package_name:F7.packages[pkgIndex].name, hours:data.totalHours, session_hours:data.sessionHours||0, total:quoteTotal.price, retail:quoteTotal.retail, savings:quoteTotal.savings});
    F7.saveToSupabase(data, pkgIndex);
    if(typeof fbq==='function') fbq('track','Lead',{value:quoteTotal.price, currency:'MXN'});
    if(typeof gtag==='function') gtag('event','generate_lead',{value:quoteTotal.price, currency:'MXN'});
};

F7.closeQuote = function(){
    var m = document.getElementById('quoteModal');
    if(m) m.style.display = 'none';
    document.body.style.overflow = '';
};

F7.printQuote = function(){
    F7.trackDecision('quote_pdf_printed', {path:window.location.pathname});
    var doc = document.getElementById('quoteDoc');
    if(!doc){ window.print(); return; }

    var printable = window.open('', '_blank');
    if(!printable){ window.print(); return; }

    var styles = ''
        + '<style>'
        + 'body{margin:0;background:#fff!important;color:#1a1a1a!important;font-family:Arial,sans-serif}'
        + '@page{size:letter;margin:0}.quote-doc{background:#fff!important;color:#1a1a1a!important;width:216mm;min-height:279mm;padding:14mm 16mm;box-sizing:border-box;font-size:12px;line-height:1.45}.quote-doc *{color:inherit}'
        + '.q-header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #c9a84c;padding-bottom:14px;margin-bottom:16px}'
        + '.q-logo{font-family:serif;font-size:28px;font-weight:700;color:#c9a84c}.q-logo span{color:#0d1b2a;font-weight:400}'
        + '.q-company{text-align:right;font-size:10px;color:#666;line-height:1.4}'
        + '.q-title{font-family:serif;font-size:22px;font-weight:700;text-align:center;color:#0d1b2a;margin-bottom:12px;letter-spacing:.12em}'
        + '.q-meta{display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid #eee}'
        + '.q-section{margin-bottom:18px}.q-section-title{font-family:serif;font-size:15px;font-weight:700;color:#c9a84c;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #f0e8d0}'
        + '.q-table{width:100%!important;min-width:0!important;max-width:100%!important;border-collapse:collapse;color:#1a1a1a!important;border:1px solid #eee7d8;table-layout:fixed}.q-table td{padding:6px 8px;border-bottom:1px solid #eee7d8;font-size:11px;color:#1a1a1a!important;background:#fff!important}.q-table td:last-child{text-align:right;white-space:normal;width:34%}'
        + '.q-table .q-total-row td{border-top:1px solid #ddd;border-bottom:none;padding-top:8px}.q-amount{color:#333;font-weight:500}'
        + '.q-summary{background:#faf8f3;padding:14px 16px;margin:18px 0;border-left:3px solid #c9a84c}.q-sum-row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px}.q-discount{color:#888}.q-final{font-size:16px;font-weight:700;color:#0d1b2a;border-top:2px solid #c9a84c;padding-top:8px;margin-top:6px}'
        + '.q-payment ul{list-style:none;padding:0}.q-payment li{padding:3px 0;font-size:11px;color:#555}.q-payment li::before{content:"? ";color:#c9a84c;font-weight:700}'
        + '.q-footer{text-align:center;border-top:1px solid #eee;padding-top:14px;font-size:10px;color:#888}.q-footer strong{color:#0d1b2a}.q-valid{margin-top:4px;font-size:9px;color:#aaa;letter-spacing:.08em;text-transform:uppercase}'
        + '</style>';

    printable.document.open();
    printable.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Cotizaci?n Foro 7</title>' + styles + '</head><body>' + doc.outerHTML + '</body></html>');
    printable.document.close();
    printable.focus();
    printable.addEventListener('load', function(){ printable.print(); }, {once:true});
    setTimeout(function(){ try { printable.print(); } catch(e){} }, 400);
};

F7.sendQuoteWA = function(pkgIndex){
    var data = F7.getFreshData();
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

    F7.trackDecision('quote_whatsapp_clicked', {package_slug:pkg.slug, package_name:pkg.name, hours:data.totalHours, total:r.price, retail:r.retail, savings:r.savings});
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

/* ─── Cotización personalizada (builder) ─── */
F7.generateCustomQuoteHTML = function(info){
    var data = F7.getFreshData() || {};
    var now = new Date();
    var folio = 'F7-C-' + now.getFullYear() + '-' + String(Math.floor(Math.random()*9999)+1).padStart(4,'0');
    var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    var fecha = now.getDate() + ' de ' + meses[now.getMonth()] + ' ' + now.getFullYear();

    var segLabels = {sesion:'Sesión previa',casa:'Casa / arreglo',misa:'Ceremonia / misa',fiesta:'Fiesta / recepción'};
    var segsHtml = '';
    if(data.segments){
        ['sesion','casa','misa','fiesta'].forEach(function(k){
            var seg = data.segments[k];
            if(seg && seg.active) segsHtml += '<tr><td>'+segLabels[k]+'</td><td>'+seg.start+' — '+seg.end+'</td><td style="text-align:right">'+seg.hours+' hrs</td></tr>';
        });
    }
    segsHtml += '<tr class="q-total-row"><td style="color:#1a1a1a!important"><strong>Total cobertura</strong></td><td></td><td style="text-align:right;color:#1a1a1a!important"><strong>'+(data.totalHours||info.hrs)+' hrs</strong></td></tr>';

    var itemsHtml = '';
    info.items.forEach(function(it){
        itemsHtml += '<tr><td style="color:#1a1a1a!important">'+it.name+'</td><td class="q-amount" style="color:#333!important">'+(it.price > 0 ? F7.fmt(it.price) : 'Incluido')+'</td></tr>';
    });

    var savingsPct = info.subtotal > 0 ? Math.round((info.discount / info.subtotal) * 100) : 0;

    return '<div class="quote-doc" id="quoteDoc">'
        +'<div class="q-header"><div class="q-logo">FORO <span>7</span></div><div class="q-company">Fotografía · Video · Producciones<br>León, Guanajuato<br>Tel: 477-920-3776</div></div>'
        +'<div class="q-title">COTIZACIÓN PERSONALIZADA</div>'
        +'<div class="q-meta"><div><strong>Folio:</strong> '+folio+'</div><div><strong>Fecha:</strong> '+fecha+'</div></div>'
        +'<div class="q-section"><div class="q-section-title">Cliente</div>'
        +'<table class="q-table" style="width:100%!important;table-layout:fixed;border-collapse:collapse;box-sizing:border-box"><tr><td>Nombre</td><td>'+(data.name||'—')+'</td></tr><tr><td>Teléfono</td><td>'+(data.phone||'—')+'</td></tr></table></div>'
        +'<div class="q-section"><div class="q-section-title">Evento — Horario de cobertura</div>'
        +'<table class="q-table" style="width:100%!important;table-layout:fixed;border-collapse:collapse;box-sizing:border-box">'+segsHtml+'</table></div>'
        +'<div class="q-section"><div class="q-section-title">Paquete Personalizado</div>'
        +'<table class="q-table" style="width:100%!important;table-layout:fixed;border-collapse:collapse;box-sizing:border-box">'+itemsHtml+'</table></div>'
        +'<div class="q-summary">'
        +'<div class="q-sum-row"><span>Valor individual de servicios</span><span>'+F7.fmt(info.subtotal)+'</span></div>'
        +(info.discount > 0 ? '<div class="q-sum-row q-discount"><span>Descuento por paquete personalizado ('+savingsPct+'%)</span><span>−'+F7.fmt(info.discount)+'</span></div>' : '')
        +'<div class="q-sum-row q-final"><span>TOTAL</span><span>'+F7.fmt(info.total)+' MXN</span></div>'
        +'</div>'
        +'<div class="q-payment"><div class="q-section-title">Formas de pago</div>'
        +'<ul><li>Aparta tu fecha con cualquier monto — sin mínimo</li><li>Parcialidades sin intereses a tu ritmo</li><li>Único requisito: liquidar 8 días antes del evento</li><li>Transferencia bancaria, depósito en efectivo o pago en efectivo</li></ul></div>'
        +'<div class="q-footer"><div>WhatsApp: <strong>477-920-3776</strong></div><div>paquetes.invitados.org</div><div class="q-valid">Cotización válida por 30 días · Precios sujetos a disponibilidad</div></div>'
        +'</div>';
};

F7.showCustomQuote = function(info){
    var html = F7.generateCustomQuoteHTML(info);
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
        +'<button class="q-btn-wa" onclick="F7.sendCustomQuoteWA()">Enviar por WhatsApp</button>'
        +'<button class="q-btn-close" onclick="F7.closeQuote()">Cerrar</button>'
        +'</div>'
        +html
        +'</div>';
    F7._pendingCustomInfo = info;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    modal.addEventListener('click', function(e){ if(e.target === modal) F7.closeQuote(); });
    F7.trackDecision('custom_quote_opened', {total:info.total, subtotal:info.subtotal, discount:info.discount, hours:info.hrs});
    var data = F7.getData() || {};
    F7.saveToSupabase(data, undefined, info);
    if(typeof fbq==='function') fbq('track','Lead',{value:info.total, currency:'MXN'});
    if(typeof gtag==='function') gtag('event','generate_lead',{value:info.total, currency:'MXN'});
};

F7.sendCustomQuoteWA = function(){
    var info = F7._pendingCustomInfo;
    if(!info) return;
    var data = F7.getData() || {};
    var msg = 'Hola, me interesa un *paquete personalizado*:\n\n';
    if(data.name) msg += 'Nombre: ' + data.name + '\n';
    if(data.phone) msg += 'Teléfono: ' + data.phone + '\n';
    var segLabels = {sesion:'Sesión',casa:'Casa',misa:'Misa',fiesta:'Fiesta'};
    var segs = [];
    if(data.segments){ ['sesion','casa','misa','fiesta'].forEach(function(k){ var s=data.segments[k]; if(s&&s.active) segs.push(segLabels[k]+' '+s.start+'–'+s.end); }); }
    if(segs.length) msg += 'Horario: ' + segs.join(', ') + '\n';
    msg += '\nServicios seleccionados:\n';
    info.items.forEach(function(it){ msg += '• ' + it.name + (it.price > 0 ? ' — ' + F7.fmt(it.price) : '') + '\n'; });
    if(info.discount > 0) msg += '\nDescuento: −' + F7.fmt(info.discount);
    msg += '\n\n*Total: ' + F7.fmt(info.total) + ' MXN*';
    F7.trackDecision('custom_quote_wa_clicked', {total:info.total, hours:info.hrs});
    window.open('https://wa.me/5214779203776?text='+encodeURIComponent(msg)+'&utm_source=web&utm_medium=cotizacion&utm_campaign=paquete_custom','_blank');
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


/* --- Supabase normalizado --- */
F7.supabaseUrl = (window.F7_SUPABASE_URL || 'https://nzpujmlienzfetqcgsxz.supabase.co');
F7.supabaseKey = window.F7_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || null;

F7.supabaseHeaders = function(prefer){
    var h = {
        'Content-Type':'application/json',
        'apikey':F7.supabaseKey,
        'Authorization':'Bearer '+F7.supabaseKey,
        'X-F7-Session-Token':F7.getSessionToken()
    };
    if(prefer) h.Prefer = prefer;
    return h;
};

F7.sb = function(path, options){
    options = options || {};
    options.headers = options.headers || F7.supabaseHeaders(options.prefer);
    delete options.prefer;
    return fetch(F7.supabaseUrl + '/rest/v1/' + path, options);
};

F7.catalog = {
    services:{photo:'photo_hour', video:'video_hour', drone:'drone_event', live:'live_hour', web:'web_invitation_full'},
    products:{prints:'prints_5x7', gallery:'web_gallery', frame11:'frame_11x14', frame24:'frame_24x32', usb:'usb_basic', photobook:'photobook_combo', videoComplete:'video_complete', videoSummary:'video_summary', projectionClip:'projection_clip', movie:'cinematic_movie', reel:'reel_vertical', song:'custom_song'},
    packages:{0:'esencial',1:'basico',2:'clasico',3:'plus',4:'premium',5:'master'},
    segments:{sesion:'session',casa:'home',misa:'ceremony',fiesta:'party'}
};

F7.ensureQuoteSession = function(data, pkgIndex){
    if(!F7.supabaseKey) return Promise.resolve(null);
    data = data || F7.getData() || {};
    var payload = {
        session_token:F7.getSessionToken(),
        client_name:data.name || null,
        client_phone:data.phone || null,
        event_type:data.eventType || null,
        source:'builder',
        status:pkgIndex !== undefined ? 'quoted' : 'draft',
        total_hours:data.totalHours || 0
    };
    return F7.sb('quote_sessions?on_conflict=session_token', {
        method:'POST',
        prefer:'resolution=merge-duplicates,return=representation',
        body:JSON.stringify(payload)
    }).then(function(res){ return res.ok ? res.json() : Promise.reject(res); })
      .then(function(rows){ return rows && rows[0] ? rows[0] : null; });
};

F7.resolveCatalogIds = function(table, slugField, rows, idField){
    var slugs = rows.map(function(r){ return r[slugField]; }).filter(Boolean);
    if(!slugs.length) return Promise.resolve(rows);
    var inList = slugs.map(function(s){ return '"' + s + '"'; }).join(',');
    return F7.sb(table + '?slug=in.(' + encodeURIComponent(inList) + ')&select=id,slug', {method:'GET'})
        .then(function(res){ return res.ok ? res.json() : []; })
        .then(function(found){
            var map = {};
            found.forEach(function(x){ map[x.slug] = x.id; });
            rows.forEach(function(r){ r[idField] = map[r[slugField]] || null; delete r[slugField]; });
            return rows.filter(function(r){ return !!r[idField]; });
        });
};

F7.syncSegments = function(quote, data){
    if(!quote || !data || !data.segments) return Promise.resolve();
    var rows = [];
    Object.keys(F7.catalog.segments).forEach(function(k){
        var seg = data.segments[k] || {};
        rows.push({quote_id:quote.id, segment_slug:F7.catalog.segments[k], segment_id:null, active:!!seg.active, start_time:seg.start || null, end_time:seg.end || null, duration_hours:seg.hours || 0});
    });
    return F7.resolveCatalogIds('event_segments', 'segment_slug', rows, 'segment_id').then(function(resolved){
        if(!resolved.length) return null;
        return F7.sb('quote_segments?on_conflict=quote_id,segment_id', {method:'POST', prefer:'resolution=merge-duplicates,return=minimal', body:JSON.stringify(resolved)});
    });
};

F7.syncQuoteBreakdown = function(quote, data, pkgIndex, customInfo){
    if(!quote) return Promise.resolve();
    data = data || F7.getData() || {};
    var totalHours = data.totalHours || (customInfo && customInfo.hrs) || 0;
    var sessionHours = data.sessionHours || 0;
    var result = pkgIndex !== undefined ? F7.calcPrice(pkgIndex, totalHours, sessionHours) : null;
    var services = [];

    if(pkgIndex !== undefined){
        services.push({service_slug:'photo_hour', hours:totalHours, unit_price:600, subtotal:600*totalHours});
        services.push({service_slug:'video_hour', hours:totalHours, unit_price:600, subtotal:600*totalHours});
        if(pkgIndex >= 3) services.push({service_slug:'drone_event', hours:1, unit_price:2500, subtotal:2500});
        if(pkgIndex >= 5) services.push({service_slug:'live_hour', hours:totalHours, unit_price:900, subtotal:900*totalHours});
    }

    var servicePromise = F7.resolveCatalogIds('services', 'service_slug', services.map(function(s){ return {quote_id:quote.id, service_slug:s.service_slug, service_id:null, segment_id:null, hours:s.hours, unit_price:s.unit_price, subtotal:s.subtotal}; }), 'service_id').then(function(rows){
        if(!rows.length) return null;
        return F7.sb('event_segments?slug=eq.total&select=id', {method:'GET'}).then(function(res){ return res.ok ? res.json() : []; }).then(function(segRows){
            var totalSegmentId = segRows && segRows[0] ? segRows[0].id : null;
            rows.forEach(function(r){ r.segment_id = totalSegmentId; });
            return F7.sb('quote_service_hours?on_conflict=quote_id,service_id,segment_id', {method:'POST', prefer:'resolution=merge-duplicates,return=minimal', body:JSON.stringify(rows)});
        });
    });

    var totalPayload = result ? {quote_id:quote.id, retail_total:result.retail, discount_total:result.savings, final_total:result.price, savings_percent:result.savingsPct, calculated_at:new Date().toISOString()} : customInfo ? {quote_id:quote.id, retail_total:customInfo.subtotal || 0, discount_total:customInfo.discount || 0, final_total:customInfo.total || 0, savings_percent:customInfo.subtotal ? Math.round((customInfo.discount/customInfo.subtotal)*100) : 0, calculated_at:new Date().toISOString()} : null;
    var totalPromise = totalPayload ? F7.sb('quote_totals?on_conflict=quote_id', {method:'POST', prefer:'resolution=merge-duplicates,return=minimal', body:JSON.stringify(totalPayload)}) : Promise.resolve();
    return Promise.all([servicePromise, totalPromise]);
};

F7.saveToSupabase = function(data, pkgIndex, customInfo){
    if(!F7.supabaseKey){
        F7.trackDecision('db_not_configured', {reason:'missing_anon_key'});
        return Promise.resolve(null);
    }
    return F7.ensureQuoteSession(data, pkgIndex).then(function(quote){
        if(!quote) return null;
        return Promise.all([F7.syncSegments(quote, data), F7.syncQuoteBreakdown(quote, data, pkgIndex, customInfo)]).then(function(){
            F7.trackDecision(pkgIndex !== undefined ? 'quote_saved' : 'custom_quote_saved', {quote_id:quote.id, package_index:pkgIndex, total:customInfo ? customInfo.total : null});
            F7.flushPendingDecisions();
            return quote;
        });
    }).catch(function(){
        F7.trackDecision('quote_save_failed', {package_index:pkgIndex});
        return null;
    });
};

window.F7 = F7;

})(window);
