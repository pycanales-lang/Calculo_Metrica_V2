// CONFIGURACIÓN
const CONFIG = {
    PRODUCTOS: {
        POSPAGO: { nombre: "Pospago", valorPromedio: 15000, porcentajePago: 0.85, comisionNivel: 0.10 },
        B2B: { nombre: "B2B", valorPromedio: 50000, porcentajePago: 0.90, comisionNivel: 0.12 },
        HOGAR: { nombre: "Hogar", valorPromedio: 25000, porcentajePago: 0.80, comisionNivel: 0.15 },
        PREPAGO: { nombre: "Prepago", valorPromedio: 2000, porcentajePago: 1.00, comisionNivel: 0.05 }
    }
};

// FUNCIÓN DE CÁLCULO
function calcularComisiones() {
    let totalVariable = 0;
    let htmlDetalle = "<ul>";

    for (const clave in CONFIG.PRODUCTOS) {
        const producto = CONFIG.PRODUCTOS[clave];
        const input = document.getElementById(`input-${clave}`);
        
        if (input) {
            const cantidad = parseFloat(input.value) || 0;
            const ventaPonderada = cantidad * producto.valorPromedio * producto.porcentajePago;
            const comision = ventaPonderada * producto.comisionNivel;

            totalVariable += comision;

            htmlDetalle += `
                <li style="display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #eee;">
                    <span>${producto.nombre}:</span>
                    <strong>$${comision.toLocaleString('es-AR', {minimumFractionDigits: 2})}</strong>
                </li>`;
        }
    }

    htmlDetalle += "</ul>";
    document.getElementById('detalle-productos').innerHTML = htmlDetalle;
    document.getElementById('total-variable').innerText = `$${totalVariable.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
}

// ASIGNAR EL EVENTO AL BOTÓN
const btn = document.getElementById('btn-calcular');
if (btn) {
    btn.addEventListener('click', calcularComisiones);
    console.log("Botón listo para calcular.");
} else {
    console.error("No se encontró el botón. Revisá el ID en el HTML.");
}
