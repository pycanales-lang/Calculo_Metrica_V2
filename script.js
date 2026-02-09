document.addEventListener('DOMContentLoaded', function() {
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbywR2KoNRTbW6nPPTVpCRGXuS1bWYnZ8DXJTMf6YG2nzbYiTOOCDp-R7sKi0_xAghBa/exec";

    // --- SEGURIDAD: Bloqueo de Captura de Pantalla ---
    document.addEventListener('keydown', function(e) {
        if (e.key === 'PrintScreen' || (e.ctrlKey && e.pKey)) {
            alert('Captura de pantalla no permitida por seguridad corporativa.');
            document.body.style.display = 'none'; // Desaparece el contenido
            setTimeout(() => { document.body.style.display = 'block'; }, 1000);
            e.preventDefault();
        }
    });

    // --- LÓGICA DE LOGIN ---
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.getElementById('app-main-content');
    const btnIngresar = document.getElementById('btn-ingresar');
    const errorMsg = document.getElementById('auth-error');

    btnIngresar.onclick = async function() {
        const ch = document.getElementById('input-auth-ch').value.trim();
        if(!ch) return;
        
        btnIngresar.innerText = "VERIFICANDO...";
        try {
            const res = await fetch(`${WEB_APP_URL}?action=validarCH&ch=${ch}`);
            const data = await res.json();
            if (data.autorizado) {
                loginScreen.style.display = 'none';
                mainContent.style.display = 'block';
                document.getElementById('saludo-vendedor').innerText = `ASESOR: ${data.nombre}`;
            } else {
                errorMsg.style.display = 'block';
            }
        } catch(e) { alert("Error de red"); }
        btnIngresar.innerText = "VALIDAR Y ENTRAR";
    };

    // --- MOTOR DE CÁLCULO (Todo lo que ya teníamos) ---
    const selectEsquema = document.getElementById('select-esquema');
    const helpContent = document.getElementById('help-content-dinamico');

    function actualizarAyuda() {
        if (selectEsquema.value === "STAFF") {
            helpContent.innerHTML = `<div class="img-container"><span>STAFF</span><img src="assets/politica-staff.png"></div>`;
        } else {
            helpContent.innerHTML = `<div class="img-container"><span>CORRETAJE M3+</span><img src="assets/metrica-corretaje.png"></div>`;
        }
    }
    selectEsquema.onchange = actualizarAyuda;
    actualizarAyuda();

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

        const llaves = b2b + hog;
        const acelera = (modo === "STAFF" && llaves >= 31);
        
        const T_STAFF = acelera ? [0.20, 0.20, 0.30, 0.30, 0.50] : [0.15, 0.15, 0.20, 0.30, 0.45];
        const T_CORR = (llaves >= 16) ? [0.50, 0.50, 0.75, 0.75, 1.00] : (llaves >= 9 ? [0.50, 0.50, 0.50, 0.50, 0.50] : [0.30, 0.30, 0.30, 0.40, 0.50]);
        const tA = (modo === "STAFF") ? T_STAFF : T_CORR;

        const calc = (cant, val, pct, esLl) => {
            let s = 0;
            tA.forEach(t => { if (modo === "CORRETAJE" && !esLl && llaves === 0) s+=0; else s += (cant * val * pct * t); });
            return Math.round(s);
        };

        let posC = (modo === "STAFF" && posIn > 3) ? 3 : posIn;
        document.getElementById('alert-pospago').classList.toggle('hidden', !(modo === "STAFF" && posIn > 3));

        const r = {
            "B2B": calc(b2b, VAL_HOG, PCT_HOG, true),
            "HOG": calc(hog, VAL_HOG, PCT_HOG, true),
            "POS": calc(posC, VAL_POS, PCT_POS, false),
            "PRE": calc(pre, 25000, 0.60, false)
        };

        let tot = 0; let f = "";
        for (let k in r) { tot += r[k]; f += `<div class="row-item"><span>${k}</span><strong>Gs. ${r[k].toLocaleString('es-PY')}</strong></div>`; }

        if (modo === "STAFF") {
            tot += 2900000;
            f += `<div class="row-item"><span>BÁSICO</span><strong>Gs. 2.900.000</strong></div>`;
            if (acelera) {
                let bon = llaves >= 46 ? 1800000 : llaves >= 41 ? 1500000 : llaves >= 36 ? 1000000 : 700000;
                tot += bon;
                document.getElementById('display-bono').innerText = "🚀 ACELERADOR QTY ACTIVO";
            }
        } else {
            const vT = {6:800000, 9:900000, 15:1200000, 20:1500000, 25:1700000};
            let vK = Object.keys(vT).reverse().find(k => llaves >= k);
            let vV = vK ? vT[vK] : 0;
            tot += vV;
            document.getElementById('display-bono').innerText = vV > 0 ? "🚚 VIÁTICO INCLUIDO" : "";
        }

        document.getElementById('grid-detalles').innerHTML = f;
        document.getElementById('display-total').innerText = "Gs. " + tot.toLocaleString('es-PY');
        document.getElementById('resultados-area').classList.remove('hidden');
    };

    // 1. Crear marca de agua con el nombre del vendedor validado
function generarMarcaAgua(nombreVendedor) {
    const wm = document.getElementById('watermark');
    wm.innerHTML = ""; // Limpiar
    for (let i = 0; i < 20; i++) {
        wm.innerHTML += `<span>${nombreVendedor} - CONFIDENCIAL</span>`;
    }
}

// 2. Detectar si el usuario cambia de pestaña o minimiza (común al intentar capturas o grabar)
window.onblur = function() {
    document.getElementById('app-main-content').classList.add('blur-content');
};
window.onfocus = function() {
    document.getElementById('app-main-content').classList.remove('blur-content');
};

// 3. Modificar la validación para activar la marca de agua
// (Dentro de tu función btnIngresar.onclick)
if (data.autorizado) {
    generarMarcaAgua(data.nombre); // El nombre que viene del Google Sheet
    // ... resto del login
}
});
