document.addEventListener('DOMContentLoaded', function() {
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbywR2KoNRTbW6nPPTVpCRGXuS1bWYnZ8DXJTMf6YG2nzbYiTOOCDp-R7sKi0_xAghBa/exec";

    // --- ELEMENTOS ---
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.getElementById('app-main-content');
    const btnIngresar = document.getElementById('btn-ingresar');
    const errorMsg = document.getElementById('auth-error');
    const selectEsquema = document.getElementById('select-esquema');
    const modalGuia = document.getElementById('modal-guia');
    const btnGuia = document.getElementById('btn-guia');
    const closeGuia = document.getElementById('close-guia');
    const guiaBody = document.getElementById('guia-body');

    // --- SEGURIDAD ---
    function generarMarcaAgua(nombreVendedor) {
        const wm = document.getElementById('watermark');
        wm.innerHTML = "";
        const texto = `${nombreVendedor} • TIGO POS • `;
        for (let i = 0; i < 60; i++) {
            const span = document.createElement('span');
            span.innerText = texto;
            wm.appendChild(span);
        }
    }

    window.onblur = () => mainContent.classList.add('blur-content');
    window.onfocus = () => mainContent.classList.remove('blur-content');

    // --- LOGIN ---
        btnIngresar.onclick = async function() {
        const ch = document.getElementById('input-auth-ch').value.trim();
        if(!ch) return;
        btnIngresar.innerText = "VERIFICANDO...";
        errorMsg.style.display = 'none';
        
        try {
            const res = await fetch(`${WEB_APP_URL}?action=validarCH&ch=${ch}`);
            const data = await res.json();
            if (data.autorizado) {
                generarMarcaAgua(data.nombre);
                document.getElementById('login-screen').classList.add('hidden'); // OCULTA EL AZUL
                document.getElementById('app-main-content').classList.remove('hidden'); // MUESTRA LA CALCU
                document.getElementById('saludo-vendedor').innerText = `ASESOR: ${data.nombre}`;
            } else {
                errorMsg.style.display = 'block';
                btnIngresar.innerText = "VALIDAR Y ENTRAR";
            }
        } catch(e) { 
            alert("Error de conexión con el servidor"); 
            btnIngresar.innerText = "VALIDAR Y ENTRAR";
        }
    };

    // --- AYUDA DINÁMICA ---
    function cargarAyuda() {
        const modo = selectEsquema.value;
        if (modo === "STAFF") {
            guiaBody.innerHTML = `
                <div class="ayuda-card">
                    <h4>Esquema STAFF</h4>
                    <ul>
                        <li><b>Acelerador (Plus):</b> Se activa con 31 o más instalaciones.</li>
                        <li><b>Regla Plus:</b> Suma B2B + Hogar + (Max 3 Pospago).</li>
                        <li><b>Cálculo Pos:</b> Muestra hasta 5 líneas en el detalle.</li>
                        <li><b>Sueldo Fijo:</b> Gs. 2.900.000 asegurado.</li>
                    </ul>
                    <img src="assets/politica-staff.png" style="width:100%; border-radius:8px;">
                </div>`;
        } else {
            guiaBody.innerHTML = `
                <div class="ayuda-card">
                    <h4>Esquema CORRETAJE</h4>
                    <ul>
                        <li><b>Foco:</b> Solo B2B y Hogar.</li>
                        <li><b>Viáticos:</b> Escala de 6, 9, 15, 20 y 25 inst.</li>
                        <li><b>Niveles:</b> M0 a M4 se potencian al superar 16 ventas.</li>
                    </ul>
                    <img src="assets/metrica-corretaje.png" style="width:100%; border-radius:8px;">
                </div>`;
        }
    }

    btnGuia.onclick = () => { cargarAyuda(); modalGuia.classList.remove('hidden'); };
    closeGuia.onclick = () => modalGuia.classList.add('hidden');

    // --- LÓGICA DE VISIBILIDAD ---
    function ajustarVistas() {
        const modo = selectEsquema.value;
        const posInput = document.getElementById('input-POSPAGO').parentElement;
        const preInput = document.getElementById('input-PREPAGO').parentElement;
        const auditoriaRows = document.querySelectorAll('.set-row');

        if (modo === "CORRETAJE") {
            posInput.style.display = 'none';
            preInput.style.display = 'none';
            if(auditoriaRows[2]) auditoriaRows[2].style.display = 'none';
            if(auditoriaRows[3]) auditoriaRows[3].style.display = 'none';
        } else {
            posInput.style.display = 'block';
            preInput.style.display = 'block';
            if(auditoriaRows[2]) auditoriaRows[2].style.display = 'flex';
            if(auditoriaRows[3]) auditoriaRows[3].style.display = 'flex';
        }
    }
    selectEsquema.onchange = ajustarVistas;
    ajustarVistas();

    // --- MOTOR DE CÁLCULO ---
    document.getElementById('btn-calcular').onclick = function() {
        const VAL_HOG = parseInt(document.getElementById('val-hogar').value) || 0;
        const PCT_HOG = (parseInt(document.getElementById('pct-hogar').value) || 0) / 100;
        const VAL_POS = parseInt(document.getElementById('val-pos').value) || 0;
        const PCT_POS = (parseInt(document.getElementById('pct-pos').value) || 0) / 100;

        let b2b = parseInt(document.getElementById('input-B2B').value) || 0;
        let hog = parseInt(document.getElementById('input-HOGAR').value) || 0;
        let posIn = parseInt(document.getElementById('input-POSPAGO').value) || 0;
        let pre = parseInt(document.getElementById('input-PREPAGO').value) || 0;
        const modo = selectEsquema.value;

        // Lógica Plus: B2B + Hogar + (Max 3 Pospago)
        let posParaValidarPlus = (modo === "STAFF" && posIn > 3) ? 3 : posIn;
        const llavesParaPlus = b2b + hog + posParaValidarPlus;
        const llavesTotales = b2b + hog;

        const acelera = (modo === "STAFF" && llavesParaPlus >= 31);
        const T_STAFF = acelera ? [0.20, 0.20, 0.30, 0.30, 0.50] : [0.15, 0.15, 0.20, 0.30, 0.45];
        const T_CORR = (llavesTotales >= 16) ? [0.50, 0.50, 0.75, 0.75, 1.00] : (llavesTotales >= 9 ? [0.50, 0.50, 0.50, 0.50, 0.50] : [0.30, 0.30, 0.30, 0.40, 0.50]);
        const tA = (modo === "STAFF") ? T_STAFF : T_CORR;

        const calc = (cant, val, pct, esLl) => {
            let s = 0;
            tA.forEach(t => { 
                if (modo === "CORRETAJE" && !esLl && llavesTotales === 0) s += 0; 
                else s += (cant * val * pct * t); 
            });
            return Math.round(s);
        };

        // Pospago: Mostramos hasta 5 según pedido
        let posParaCalcular = (posIn > 5) ? 5 : posIn;
        document.getElementById('alert-pospago').classList.toggle('hidden', !(modo === "STAFF" && posIn > 5));

        const r = { "B2B": calc(b2b, VAL_HOG, PCT_HOG, true), "HOGAR": calc(hog, VAL_HOG, PCT_HOG, true) };
        if (modo !== "CORRETAJE") {
            r["POSPAGO"] = calc(posParaCalcular, VAL_POS, PCT_POS, false);
            r["PREPAGO"] = calc(pre, 25000, 0.60, false);
        }

        let tot = 0; let f = "";
        for (let k in r) { 
            tot += r[k]; 
            f += `<div class="row-item"><span>${k}</span><strong>Gs. ${r[k].toLocaleString('es-PY')}</strong></div>`; 
        }

        if (modo === "STAFF") {
            tot += 2900000;
            f += `<div class="row-item" style="border-top: 1px solid #ddd; margin-top:5px; padding-top:10px;"><span>SUELDO FIJO</span><strong>Gs. 2.900.000</strong></div>`;
            if (acelera) {
                let bon = llavesParaPlus >= 46 ? 1800000 : llavesParaPlus >= 41 ? 1500000 : llavesParaPlus >= 36 ? 1000000 : 700000;
                tot += bon;
                document.getElementById('display-bono').innerText = `🚀 PLUS ACTIVO (${llavesParaPlus} LLAVES)`;
                f += `<div class="row-item" style="color:#00a1de;"><span>BONO QTY</span><strong>Gs. ${bon.toLocaleString('es-PY')}</strong></div>`;
            } else { document.getElementById('display-bono').innerText = ""; }
        } else {
            const vT = {6:800000, 9:900000, 15:1200000, 20:1500000, 25:1700000};
            let vK = Object.keys(vT).reverse().find(k => llavesTotales >= k);
            let vV = vK ? vT[vK] : 0;
            tot += vV;
            document.getElementById('display-bono').innerText = vV > 0 ? "🚚 VIÁTICO INCLUIDO" : "";
        }

        document.getElementById('grid-detalles').innerHTML = f;
        document.getElementById('display-total').innerText = "Gs. " + tot.toLocaleString('es-PY');
        document.getElementById('resultados-area').classList.remove('hidden');
    };
});
