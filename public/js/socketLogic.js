const socket = io();
let audioActual = null;
let volumenLocal = 1.0;

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

document.body.addEventListener('click', () => {
    if(!statusBanner.classList.contains('active')) {
        statusBanner.classList.remove('waiting');
        statusBanner.classList.add('active');
        bannerIcon.innerText = '🟢';
        bannerText.innerText = 'Sistema TTS Activo y Escuchando';
    }
}, { once: true });

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