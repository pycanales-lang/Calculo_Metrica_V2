document.addEventListener('DOMContentLoaded', function() {
    // 1. MODALES Y GUÍA
    const modalIni = document.getElementById('modal-disclaimer');
    const modalGuia = document.getElementById('modal-guia');
    document.getElementById('btn-aceptar-modal').onclick = () => modalIni.style.display = 'none';
    document.getElementById('btn-guia').onclick = () => modalGuia.classList.remove('hidden');
    document.getElementById('close-guia').onclick = () => modalGuia.classList.add('hidden');

    // 2. LIMPIEZA DE INPUTS
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.onfocus = function() { if (this.value == "0") this.value = ""; };
        input.onblur = function() { if (this.value == "") this.value = "0"; };
    });

    // 3. AYUDA MEMORIA DINÁMICA
    const selectEsquema = document.getElementById('select-esquema');
    const helpContent = document.getElementById('help-content-dinamico');

    function actualizarAyuda() {
        if (selectEsquema.value === "STAFF") {
            helpContent.innerHTML = `
                <div class="img-container"><span>POLÍTICA STAFF</span><img src="assets/politica-staff.png"></div>
                <div class="img-container"><span>ACELERADOR QTY</span><img src="assets/acelerador.png"></div>`;
        } else {
            helpContent.innerHTML = `
                <div class="img-container"><span>MÉTRICA CORRETAJE M3 EN ADELANTE</span><img src="assets/metrica-corretaje.png"></div>`;
        }
    }
    selectEsquema.onchange = actualizarAyuda;
    actualizarAyuda();

    // 4. LÓGICA DE CÁLCULO
    const DATA = {
        PRECIOS: { B2B: 140000, HOGAR: 140000, POS: 75000, PRE: 25000 },
        PAGOS: { HOGAR: 0.65, B2B: 0.65, POS: 0.65, PRE: 0.60 },
        STAFF_NORM: [0.15, 0.15, 0.20, 0.30, 0.45],
        STAFF_ACEL: [0.20, 0.20, 0.30, 0.30, 0.50],
        CORR_TASAS: { N1: [0.30, 0.30, 0.30, 0.40, 0.50], N2: [0.50, 0.50, 0.50, 0.50, 0.50], N3: [0.50, 0.50, 0.75, 0.75, 1.00] },
        BÁSICO: 2900000
    };

    document.getElementById('btn-calcular').onclick = function() {
        let b2b = parseInt(document.getElementById('input-B2B').value) || 0;
        let hog = parseInt(document.getElementById('input-HOGAR').value) || 0;
        let posIn = parseInt(document.getElementById('input-POSPAGO').value) || 0;
        let pre = parseInt(document.getElementById('input-PREPAGO').value) || 0;
        const modo = selectEsquema.value;

        // Tope Pospago Staff
        let posCalc = (modo === "STAFF" && posIn > 3) ? 3 : posIn;
        document.getElementById('alert-pospago').classList.toggle('hidden', !(modo === "STAFF" && posIn > 3));

        const llaves = b2b + hog;
        const acelera = (modo === "STAFF" && llaves >= 31);
        let total = 0; let filas = "";

        const fnCalc = (cant, val, pct, esLlave) => {
            let sub = 0;
            let t = (modo === "STAFF") ? (acelera ? DATA.STAFF_ACEL : DATA.STAFF_NORM) : DATA.CORR_TASAS[llaves >= 16 ? 'N3' : (llaves >= 9 ? 'N2' : 'N1')];
            for (let i=0; i<5; i++) {
                if (modo === "CORRETAJE" && !esLlave && llaves === 0) sub += 0; // Regla corretaje móvil
                else sub += (cant * val * pct * t[i]);
            }
            return Math.round(sub);
        };

        const r = { "B2B": fnCalc(b2b, DATA.PRECIOS.B2B, DATA.PAGOS.B2B, true), "HOG": fnCalc(hog, DATA.PRECIOS.HOGAR, DATA.PAGOS.HOGAR, true), "POS": fnCalc(posCalc, DATA.PRECIOS.POS, DATA.PAGOS.POS, false), "PRE": fnCalc(pre, DATA.PRECIOS.PRE, DATA.PAGOS.PRE, false) };

        for (let k in r) { total += r[k]; filas += `<div class="row-item"><span>${k}</span><strong>Gs. ${r[k].toLocaleString('es-PY')}</strong></div>`; }

        if (modo === "STAFF") {
            total += DATA.BÁSICO;
            filas += `<div class="row-item" style="font-weight:bold;"><span>BÁSICO</span><strong>Gs. ${DATA.BÁSICO.toLocaleString('es-PY')}</strong></div>`;
            if (acelera) {
                let bon = llaves>=46 ? 1800000 : llaves>=41 ? 1500000 : llaves>=36 ? 1000000 : 700000;
                total += bon;
                document.getElementById('display-bono').innerText = "🚀 ACELERADOR: Gs. " + bon.toLocaleString('es-PY');
            } else document.getElementById('display-bono').innerText = "";
        } else {
            const vTable = {6:800000, 7:900000, 8:1000000, 9:900000, 12:1000000, 15:1200000, 16:1200000, 20:1500000, 25:1700000};
            let vKey = Object.keys(vTable).map(Number).filter(k => k <= llaves).pop();
            let vVal = vKey ? vTable[vKey] : 0;
            total += vVal;
            document.getElementById('display-bono').innerText = vVal > 0 ? "🚚 VIÁTICO: Gs. " + vVal.toLocaleString('es-PY') : "";
        }

        document.getElementById('grid-detalles').innerHTML = filas;
        document.getElementById('display-total').innerText = "Gs. " + total.toLocaleString('es-PY');
        document.getElementById('resultados-area').classList.remove('hidden');
    };
});
