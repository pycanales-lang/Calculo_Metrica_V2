document.addEventListener('DOMContentLoaded', function() {
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbywR2KoNRTbW6nPPTVpCRGXuS1bWYnZ8DXJTMf6YG2nzbYiTOOCDp-R7sKi0_xAghBa/exec";

    // --- ELEMENTOS DEL DOM ---
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.getElementById('app-main-content');
    const btnIngresar = document.getElementById('btn-ingresar');
    const errorMsg = document.getElementById('auth-error');
    const selectEsquema = document.getElementById('select-esquema');
    const helpContent = document.getElementById('help-content-dinamico');
    const modalGuia = document.getElementById('modal-guia');
    const btnGuia = document.getElementById('btn-guia');
    const closeGuia = document.getElementById('close-guia');

    // --- SEGURIDAD: Bloqueo de Captura de Pantalla ---
    document.addEventListener('keydown', function(e) {
        if (e.key === 'PrintScreen' || (e.ctrlKey && e.pKey)) {
            alert('Captura de pantalla no permitida por seguridad corporativa.');
            document.body.style.display = 'none';
            setTimeout(() => { document.body.style.display = 'block'; }, 1000);
            e.preventDefault();
        }
    });

    window.onblur = function() {
        mainContent.classList.add('blur-content');
    };
    window.onfocus = function() {
        mainContent.classList.remove('blur-content');
    };

    function generarMarcaAgua(nombreVendedor) {
        const wm = document.getElementById('watermark');
        if (!wm) return;
        
        wm.innerHTML = ""; // Limpiar
        
        // Creamos un texto breve: Nombre + ID o solo Nombre
        const textoSeguridad = `${nombreVendedor} • TIGO POS • `;
        
        // Generamos suficientes repeticiones para cubrir el fondo con espaciado
        for (let i = 0; i < 60; i++) {
            const span = document.createElement('span');
            span.innerText = textoSeguridad;
            wm.appendChild(span);
        }
    }

    // --- LÓGICA DE LOGIN ---
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
                loginScreen.style.display = 'none';
                mainContent.style.display = 'block';
                document.getElementById('saludo-vendedor').innerText = `ASESOR: ${data.nombre}`;
            } else {
                errorMsg.style.display = 'block';
            }
        } catch(e) { 
            alert("Error de red o URL incorrecta"); 
        } finally {
            btnIngresar.innerText = "VALIDAR Y ENTRAR";
        }
    };

    // --- CONTROL DE VISTAS (STAFF VS CORRETAJE) ---
    function ajustarInterfazModo() {
        const modo = selectEsquema.value;
        const campoPos = document.getElementById('input-POSPAGO').parentElement;
        const campoPre = document.getElementById('input-PREPAGO').parentElement;
        
        // Ajustes de auditoría (filas 3 y 4 son pospago)
        const settingsRows = document.querySelectorAll('.set-row');

        if (modo === "CORRETAJE") {
            // Ocultar Pospago y Prepago en inputs y configuración
            campoPos.style.display = 'none';
            campoPre.style.display = 'none';
            if(settingsRows[2]) settingsRows[2].style.display = 'none';
            if(settingsRows[3]) settingsRows[3].style.display = 'none';
            
            helpContent.innerHTML = `<div class="img-container"><span>MÉTRICA CORRETAJE</span><img src="assets/metrica-corretaje.png"></div>`;
        } else {
            // Mostrar todo para Staff
            campoPos.style.display = 'block';
            campoPre.style.display = 'block';
            if(settingsRows[2]) settingsRows[2].style.display = 'flex';
            if(settingsRows[3]) settingsRows[3].style.display = 'flex';
            
            helpContent.innerHTML = `<div class="img-container"><span>STAFF</span><img src="assets/politica-staff.png"></div>`;
        }
    }

    selectEsquema.onchange = ajustarInterfazModo;
    ajustarInterfazModo(); // Ejecución inicial

    // --- MODAL DE GUÍA (?) ---
    if (btnGuia) {
        btnGuia.onclick = () => modalGuia.classList.remove('hidden');
    }
    if (closeGuia) {
        closeGuia.onclick = () => modalGuia.classList.add('hidden');
    }

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

        // --- NUEVA LÓGICA DE SUMATORIA PARA ACELERADOR (PLUS) ---
        // Para el acelerador Staff: Suma B2B + HOGAR + (Hasta 3 Pospagos)
        let posParaPlus = (modo === "STAFF" && posIn > 3) ? 3 : posIn;
        const totalParaPlus = b2b + hog + posParaPlus;

        // Determinar si aplica acelerador (31 o más instalaciones según imagen)
        const acelera = (modo === "STAFF" && totalParaPlus >= 31);
        
        // Tasas de pago según Métrica Directa HOME
        const T_STAFF = acelera ? [0.20, 0.20, 0.30, 0.30, 0.50] : [0.15, 0.15, 0.20, 0.30, 0.45];
        const T_CORR = (totalParaPlus >= 16) ? [0.50, 0.50, 0.75, 0.75, 1.00] : (totalParaPlus >= 9 ? [0.50, 0.50, 0.50, 0.50, 0.50] : [0.30, 0.30, 0.30, 0.40, 0.50]);
        const tA = (modo === "STAFF") ? T_STAFF : T_CORR;

        const calc = (cant, val, pct, esLl) => {
            let s = 0;
            tA.forEach(t => { 
                if (modo === "CORRETAJE" && !esLl && totalParaPlus === 0) s += 0; 
                else s += (cant * val * pct * t); 
            });
            return Math.round(s);
        };

        // --- LÓGICA DE PAGO (COMISIÓN) ---
        // Se muestran hasta 5, pero se pagan hasta 3 en Staff
        let posParaPago = (modo === "STAFF" && posIn > 3) ? 3 : (posIn > 5 ? 5 : posIn);
        
        // Alerta visual si supera el tope de pago de 3
        document.getElementById('alert-pospago').classList.toggle('hidden', !(modo === "STAFF" && posIn > 3));

        const r = {
            "B2B": calc(b2b, VAL_HOG, PCT_HOG, true),
            "HOGAR": calc(hog, VAL_HOG, PCT_HOG, true)
        };
        
        if (modo !== "CORRETAJE") {
            r["POSPAGO"] = calc(posParaPago, VAL_POS, PCT_POS, false);
            r["PREPAGO"] = calc(pre, 25000, 0.60, false);
        }

        let tot = 0; let f = "";
        for (let k in r) { 
            tot += r[k]; 
            f += `<div class="row-item"><span>${k}</span><strong>Gs. ${r[k].toLocaleString('es-PY')}</strong></div>`; 
        }

        if (modo === "STAFF") {
            tot += 2900000; // Sueldo Fijo
            f += `<div class="row-item" style="border-top: 1px solid #333; margin-top:5px; padding-top:10px;"><span>SUELDO BÁSICO</span><strong>Gs. 2.900.000</strong></div>`;
            
            if (acelera) {
                // Escala de Acelerador según imagen: 31-35 (700k), 36-40 (1M), 41-45 (1.5M), 46-50 (1.8M)
                let bon = totalParaPlus >= 46 ? 1800000 : totalParaPlus >= 41 ? 1500000 : totalParaPlus >= 36 ? 1000000 : 700000;
                tot += bon;
                document.getElementById('display-bono').innerText = "🚀 PLUS STAFF ACTIVO (Cant: " + totalParaPlus + ")";
                f += `<div class="row-item" style="color: #2ecc71;"><span>PLUS ACELERADOR</span><strong>Gs. ${bon.toLocaleString('es-PY')}</strong></div>`;
            } else {
                document.getElementById('display-bono').innerText = "";
            }
        } else {
            // Viáticos Corretaje según escala previa
            const vT = {6:800000, 9:900000, 15:1200000, 20:1500000, 25:1700000};
            let vK = Object.keys(vT).reverse().find(k => totalParaPlus >= k);
            let vV = vK ? vT[vK] : 0;
            tot += vV;
            document.getElementById('display-bono').innerText = vV > 0 ? "🚚 VIÁTICO INCLUIDO" : "";
        }

        document.getElementById('grid-detalles').innerHTML = f;
        document.getElementById('display-total').innerText = "Gs. " + tot.toLocaleString('es-PY');
        document.getElementById('resultados-area').classList.remove('hidden');
    };
});
