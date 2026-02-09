document.addEventListener('DOMContentLoaded', function() {
    // 1. MODALES Y GUIAS
    document.getElementById('btn-aceptar-modal').onclick = () => document.getElementById('modal-disclaimer').style.display = 'none';
    document.getElementById('btn-guia').onclick = () => document.getElementById('modal-guia').classList.remove('hidden');
    document.getElementById('close-guia').onclick = () => document.getElementById('modal-guia').classList.add('hidden');

    // 2. LIMPIEZA AUTOMÁTICA DE CEROS
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.onfocus = function() { if (this.value == "0") this.value = ""; };
        input.onblur = function() { if (this.value == "") this.value = "0"; };
    });

    // 3. AYUDA DINÁMICA
    const selectEsquema = document.getElementById('select-esquema');
    const helpContent = document.getElementById('help-content-dinamico');

    function actualizarAyuda() {
        if (selectEsquema.value === "STAFF") {
            helpContent.innerHTML = `<div class="img-container"><span>STAFF NIVELES</span><img src="assets/politica-staff.png"></div><div class="img-container"><span>ACELERADOR</span><img src="assets/acelerador.png"></div>`;
        } else {
            helpContent.innerHTML = `<div class="img-container"><span>MÉTRICA CORRETAJE M3+</span><img src="assets/metrica-corretaje.png"></div>`;
        }
    }
    selectEsquema.onchange = actualizarAyuda;
    actualizarAyuda();

    // 4. MOTOR DE CÁLCULO
    document.getElementById('btn-calcular').onclick = function() {
        // Variables Flexibles
        const VAL_HOG = parseInt(document.getElementById('val-hogar').value) || 0;
        const PCT_HOG = (parseInt(document.getElementById('pct-hogar').value) || 0) / 100;
        const VAL_POS = parseInt(document.getElementById('val-pos').value) || 0;
        const PCT_POS = (parseInt(document.getElementById('pct-pos').value) || 0) / 100;

        // Cantidades
        let b2b = parseInt(document.getElementById('input-B2B').value) || 0;
        let hog = parseInt(document.getElementById('input-HOGAR').value) || 0;
        let posIn = parseInt(document.getElementById('input-POSPAGO').value) || 0;
        let pre = parseInt(document.getElementById('input-PREPAGO').value) || 0;
        const modo = selectEsquema.value;

        const llaves = b2b + hog;
        const acelera = (modo === "STAFF" && llaves >= 31);
        
        // Tasas M0-M4
        const T_STAFF = acelera ? [0.20, 0.20, 0.30, 0.30, 0.50] : [0.15, 0.15, 0.20, 0.30, 0.45];
        const T_CORR = (llaves >= 16) ? [0.50, 0.50, 0.75, 0.75, 1.00] : (llaves >= 9 ? [0.50, 0.50, 0.50, 0.50, 0.50] : [0.30, 0.30, 0.30, 0.40, 0.50]);
        const tActual = (modo === "STAFF") ? T_STAFF : T_CORR;

        const calc = (cant, val, pct, esLlave) => {
            let sub = 0;
            tActual.forEach(t => {
                if (modo === "CORRETAJE" && !esLlave && llaves === 0) sub += 0;
                else sub += (cant * val * pct * t);
            });
            return Math.round(sub);
        };

        let posCalc = (modo === "STAFF" && posIn > 3) ? 3 : posIn;
        document.getElementById('alert-pospago').classList.toggle('hidden', !(modo === "STAFF" && posIn > 3));

        const res = {
            "B2B": calc(b2b, VAL_HOG, PCT_HOG, true),
            "HOGAR": calc(hog, VAL_HOG, PCT_HOG, true),
            "POSPAGO": calc(posCalc, VAL_POS, PCT_POS, false),
            "PREPAGO": calc(pre, 25000, 0.60, false)
        };

        let total = 0; let filas = "";
        for (let p in res) {
            total += res[p];
            filas += `<div class="row-item"><span>${p}</span><strong>Gs. ${res[p].toLocaleString('es-PY')}</strong></div>`;
        }

        if (modo === "STAFF") {
            total += 2900000;
            filas += `<div class="row-item" style="font-weight:bold;"><span>BÁSICO</span><strong>Gs. 2.900.000</strong></div>`;
            if (acelera) {
                let bon = llaves >= 46 ? 1800000 : llaves >= 41 ? 1500000 : llaves >= 36 ? 1000000 : 700000;
                total += bon;
                document.getElementById('display-bono').innerText = "🚀 ACELERADOR: Gs. " + bon.toLocaleString('es-PY');
            } else document.getElementById('display-bono').innerText = "";
        } else {
            const vT = {6:800000, 7:900000, 8:1000000, 9:900000, 12:1000000, 15:1200000, 16:1200000, 20:1500000, 25:1700000};
            let vK = Object.keys(vT).map(Number).filter(k => k <= llaves).pop();
            let vV = vK ? vT[vK] : 0;
            total += vV;
            document.getElementById('display-bono').innerText = vV > 0 ? "🚚 VIÁTICO: Gs. " + vV.toLocaleString('es-PY') : "";
        }

        document.getElementById('grid-detalles').innerHTML = filas;
        document.getElementById('display-total').innerText = "Gs. " + total.toLocaleString('es-PY');
        document.getElementById('resultados-area').classList.remove('hidden');
    };
});
