const socket = io();
let audioActual = null;
let volumenLocal = 1.0;

const inputCanal = document.getElementById('inputCanal');
const btnGuardarCanal = document.getElementById('btnGuardarCanal');

const volSlider = document.getElementById('vol-slider');
const volText = document.getElementById('vol-text');

const delaySlider = document.getElementById('delay-slider');
const delayText = document.getElementById('delay-text');

const checkSoloSubs = document.getElementById('check-solo-subs');

const statusBanner = document.getElementById('status-banner');
const bannerIcon = document.getElementById('banner-icon');
const bannerText = document.getElementById('banner-text');
const btnLimpieza = document.getElementById('btnLimpieza');
const btnApagar = document.getElementById('btnApagar');

const inputPalabraFiltro = document.getElementById('inputPalabraFiltro');
const btnAgregarPalabraFiltro = document.getElementById('btnAgregarPalabraFiltro');
const listaBlacklistWords = document.getElementById('listaBlacklistWords');
const btnLimpiarPalabras = document.getElementById('btnLimpiarPalabras');

const inputUserFiltro = document.getElementById('inputUserFiltro');
const btnAgregarUserFiltro = document.getElementById('btnAgregarUserFiltro');
const listaBlacklistUsers = document.getElementById('listaBlacklistUsers');

const listaColaTTS = document.getElementById('listaColaTTS');
const colaVacíaHTML = '<li style="color:var(--text-muted); justify-content: center; border:none; background:transparent;">Cola vacía</li>';

const btnSubirSonido = document.getElementById('btnSubirSonido');
const inputNombreSonido = document.getElementById('inputNombreSonido');
const inputFileAudio = document.getElementById('inputFileAudio');

const modalGestor = document.getElementById('modalGestor');
const btnAbrirGestor = document.getElementById('btnAbrirGestor');
const btnCerrarGestor = document.getElementById('btnCerrarGestor');
const listaGestorSonidos = document.getElementById('listaGestorSonidos');

document.body.addEventListener('click', () => {
    if(!statusBanner.classList.contains('active')) {
        statusBanner.classList.remove('waiting');
        statusBanner.classList.add('active');
        bannerIcon.innerText = '🟢';
        bannerText.innerText = 'Sistema TTS Activo y Escuchando';
    }
}, { once: true });
btnGuardarCanal.addEventListener('click', () => {
    const canal = inputCanal.value.trim().replace('#','').toLowerCase();
    if (canal) {
        socket.emit('actualizar-canal', canal);
        btnGuardarCanal.innerText = 'Actualizando...';
        setTimeout(() => btnGuardarCanal.innerText = 'Conectar', 2000);
    }
});

volSlider.addEventListener('input', (e) => {
    const nuevoValor = e.target.value;
    volumenLocal = nuevoValor / 100;
    volText.innerText = nuevoValor + '%';
    if(audioActual){
        audioActual.volume = volumenLocal;
    }
    socket.emit('actualizar-volumen', volumenLocal);
});

delaySlider.addEventListener('input', (e) => {
    const nuevosSegundos = e.target.value;
    delayText.innerText = nuevosSegundos + 's';
    socket.emit('actualizar-delay', parseInt(nuevosSegundos, 10)); 
});

checkSoloSubs.addEventListener('change', (e) => {
    const activado = e.target.checked;
    socket.emit('actualizar-permisos', activado);
});

    btnAgregarPalabraFiltro.addEventListener('click', () => {
    const palabra = inputPalabraFiltro.value.trim();
    if (palabra) {
        socket.emit('agregar-palabra-filtro', palabra);
        inputPalabraFiltro.value = '';
    }
});

btnLimpiarPalabras.addEventListener('click', () => {
    if (confirm('¿Seguro que quieres limpiar todo el filtro de palabras?')) {
        socket.emit('limpiar-filtro-palabras');
    }
});

btnLimpieza.addEventListener('click', () => {
    if (audioActual) {
        audioActual.pause();
        audioActual.currentTime = 0;
        audioActual = null;
    }
    listaColaTTS.innerHTML = colaVacíaHTML;
    socket.emit('activar-limpieza');
});

btnApagar.addEventListener('click', () => {
    if (confirm('¿Seguro que quieres apagar el servidor?')) {
        socket.emit('apagar-servidor');
    }
});

btnAgregarUserFiltro.addEventListener('click', () => {
    const username = inputUserFiltro.value.trim().toLowerCase();
    if (username) {
        socket.emit('agregar-blacklisted-user', username);
        inputUserFiltro.value = '';
    }
});

socket.on('sincronizar-canal', (canal) => {
    if (inputCanal) inputCanal.value = canal.replace('#', '');
});

socket.on('sincronizar-volumen', (volDecimal) => {
    volumenLocal = volDecimal;
    const volPorcentaje = Math.round(volDecimal * 100);
    volSlider.value = volPorcentaje;
    volText.innerText = volPorcentaje + '%';
});

socket.on('sincronizar-delay', (segundos) => {
    delaySlider.value = segundos;
    delayText.innerText = segundos + 's';
});

socket.on('sincronizar-permisos', (estadoSoloSubs) => {
    checkSoloSubs.checked = estadoSoloSubs;
});

socket.on('sincronizar-blacklist-words', (words) => {
    listaBlacklistWords.innerHTML = '';
    words.forEach(word => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${word}</span>
            <button onclick="removerPalabra('${word}')" class="btn-delete">×</button>
        `;
        listaBlacklistWords.appendChild(li);
    });
});

socket.on('sincronizar-blacklist-users', (users) => {
    listaBlacklistUsers.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${user}</span>
            <button onclick="removerUser('${user}')" class="btn-delete">×</button>
        `;
        listaBlacklistUsers.appendChild(li);
    });
});
socket.on('play-audio', (data) => {
    audioActual = new Audio(data.url);
    audioActual.volume = volumenLocal;

    audioActual.onended = () => {
        audioActual = null;
        socket.emit('audio-finished', data.item);
    };

    audioActual.play().catch(err => {
        console.error("No se pudo reproducir el audio:", err);
        socket.emit('audio-finished', data.item);
    });
});

socket.on('ejecutar-silenciamiento', () => {
    if (audioActual) {
        audioActual.pause();
        audioActual.currentTime = 0;
        audioActual = null;
    }
});

socket.on('sincronizar-cola', (colaItems) => {
    listaColaTTS.innerHTML = '';
    if (!colaItems || colaItems.length === 0) {
        listaColaTTS.innerHTML = colaVacíaHTML;
        return;
    }
    const itemsVisibles = colaItems.slice(0, 5);
    
    itemsVisibles.forEach((item, index) => {
        const li = document.createElement('li');
        console.log(item);
        const usuario = item.username || item['display-name'];
        const textoMensaje = item.contenidoTTS || item.message || item.text || item.lower || item.sound || '';
        li.innerHTML = `
            <span style="font-size: 13px;">
                <strong>${index === 0 ? '▶️ Sonando:' : `#${index + 1}`}</strong> 
                <span style="color: var(--primary);">${usuario}:</span> 
                <span style="color: #fff;">${textoMensaje}</span>
            </span>
        `;
        listaColaTTS.appendChild(li);
    });
});

function removerPalabra(word) {
    socket.emit('remover-palabra-filtro', word);
}

function removerUser(user) {
    socket.emit('remover-blacklisted-user', user);
}

if (btnSubirSonido) {
    btnSubirSonido.addEventListener('click', async () => {
        const archivo = inputFileAudio.files[0];
        const nombrePersonalizado = inputNombreSonido.value.trim();

        if (!archivo) {
            alert('Por favor selecciona un archivo de audio (.mp3 o .wav)');
            return;
        }

        const formData = new FormData();
        formData.append('archivoAudio', archivo);
        let urlUpload = '/api/upload-sound'
        if (nombrePersonalizado) {
            urlUpload += `?nombre=${encodeURIComponent(nombrePersonalizado)}`;
        }

        btnSubirSonido.innerText = 'Subiendo...';
        btnSubirSonido.disabled = true;

        try {
            const respuesta = await fetch(urlUpload, {
                method: 'POST',
                body: formData
            });

            const resultado = await respuesta.json();

            if (resultado.success) {
                alert(`¡Sonido "${resultado.filename}" subido con éxito!`);
                inputNombreSonido.value = '';
                inputFileAudio.value = '';
            } else {
                alert('Error al subir: ' + (resultado.error || 'Desconocido'));
            }
        } catch (err) {
            console.error('Error de red al subir sonido:', err);
            alert('Error de red al intentar subir el archivo.');
        } finally {
            btnSubirSonido.innerText = 'Subir y Guardar Sonido';
            btnSubirSonido.disabled = false;
        }
    });
}
if(btnAbrirGestor && modalGestor){
    btnAbrirGestor.addEventListener('click', () => {
        modalGestor.style.display = 'flex';
        cargarSonidosLocal();
    });
    btnCerrarGestor.addEventListener('click', () => {
        modalGestor.style.display = 'none';
    });
    modalGestor.addEventListener('click', (e) => {
        if(e.target === modalGestor) modalGestor.style.display = 'none';
    });
}
async function cargarSonidosLocal() {
    listaGestorSonidos.innerHTML = '<li style="justify-content:center; border:none; background:transparent;">Cargando...</li>';
    try {
        const respuesta = await fetch('/api/sounds');
        const data = await respuesta.json();

        if (data.success) {
            listaGestorSonidos.innerHTML = '';
            
            if (data.sounds.length === 0) {
                listaGestorSonidos.innerHTML = '<li style="color:var(--text-muted); justify-content:center; border:none; background:transparent;">No hay sonidos guardados</li>';
                return;
            }

            data.sounds.forEach(sonido => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span style="font-weight: 500;">🎵 ${sonido}</span>
                    <button onclick="eliminarSonidoFS('${sonido}')" class="btn-delete" title="Eliminar sonido">×</button>
                `;
                listaGestorSonidos.appendChild(li);
            });
        }
    } catch (err) {
        console.error("Error al cargar sonidos:", err);
        listaGestorSonidos.innerHTML = '<li style="color:#ff5555; justify-content:center; border:none; background:transparent;">Error al cargar</li>';
    }
}
window.eliminarSonidoFS = async function(filename){
    if (!confirm(`¿Estás seguro de que deseas eliminar el sonido "${filename}"?`)) return;
    try{
        const respuesta = await fetch(`/api/sounds/${filename}`, {
            method: 'DELETE'
        });
        const data = await respuesta.json();
        if(data.success){
            alert(`Sonido "${filename}" eliminado correctamente`);
            cargarSonidosLocal();
        }else{
            alert('Error al eliminar el sonido: ' + (data.error || 'Desconocido'));
        }
    }catch(err){
        console.error('Error de red al eliminar sonido:', err);
        alert('Error de red al intentar eliminar el sonido.');
    }
}
