# Self-Host Twitch TTS 🎙️

Sistema **TTS self-hosteable** que lee el chat de Twitch y se reproduce directamente en tu PC (ideal para OBS). Sin costo, sin APIs de pago. Incluye un **Panel de Control Web interactivo** para moderación en tiempo real.

---

## ✨ Características

- 📢 Lee mensajes con `!tts` del chat de Twitch directamente en tu PC.
- 🎵 **Sonido rápido** con `!nombre_sonido` (sin texto, solo el sonido) y combinación de sonidos intercalados mediante `(nombre_sonido)`.
- 🎛️ **Panel de Control Web en Tiempo Real**:
- Cola visual de mensajes TTS pendientes y en reproducción (máx. 5 en vista).
- Control deslizante de Volumen Global.
- Control deslizante de Retraso (**Delay**) dinámico.
- Interruptor de modo **Solo Subs, VIPs y Mods**.
- **Filtro de palabras prohibidas** y **Bloqueo de usuarios** interactivos en caliente.
- 🚨 **Botón de Apagado de Emergencia (Pánico)** para vaciar la cola y silenciar el audio al instante.

- 🌐 Motor **Google TTS gratis** (sin API key) o **TTS local** del sistema.
- 🔄 Baja latencia, ideal para streams.

---

## 📋 Requisitos

- **Node.js 18+** [https://nodejs.org/es/download](https://nodejs.org/es/download)
- Token de Twitch (opcional — sin él no podrán tirar comandos como !sonidos donde el bot debe responder en el chat) [https://twitchtokengenerator.com](https://twitchtokengenerator.com)

## 🚀 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y editar variables de entorno
# En Linux / macOS / PowerShell (Windows):
cp .env.example .env

# En CMD clásico de Windows:
copy .env.example .env

# *Edita .env y agrega tu TWITCH_OAUTH_TOKEN si quieres que el bot responda en el chat*

# 3. Copiar y editar config.json.example a config.json
# En Linux / macOS / PowerShell (Windows):
cp config.json.example config.json

# En CMD clásico de Windows:
copy config.json.example config.json

# *Edita config.json con el nombre de tu canal de Twitch*
```

---

## ⚙️ Configuración

### `config.json`

```jsonc
{
  "twitch": {
    "channel": "tu_canal", // Sin # — nombre de tu canal de Twitch
  },

  "tts": {
    "engine": "google", // "google" (recomendado) o "local"
    "language": "es", // Código de idioma: es, en, pt, de...
    "say_username": true, // ¿Decir "Usuario dice: ..." antes del mensaje?
    "max_length": 200, // Caracteres máximos a leer
    "speed": 1.0, // Velocidad de voz (solo engine "local")
    "volume": 1.0, // Volumen global (0.0 - 1.0) Configurable desde el panel web
    "delay_seconds": 3, // Retraso inicial en segundos antes de reproducir la cola Configurable desde el panel web
  },

  "filters": {
    "skip_commands": true, // Ignorar mensajes que empiecen con !
    "skip_urls": true, // Ignorar mensajes con links
    "user_cooldown_seconds": 0, // Segundos entre mensajes por usuario (0 = sin límite)
    "blacklisted_users": [], // ["usuario1", "usuario2"]
    "blacklisted_words": [], // Palabras prohibidas ["palabra1", "palabra2", ...]
  },

  "sounds": {
    "enabled": true,
    "prefix": "!", // Prefijo para comandos de sonido
    "folder": "./sounds", // Carpeta de tus sonidos personalizados
  },
}
```

---

## 🎵 Agregar tus propios sonidos

1. Copia tus archivos de audio a la carpeta `/sounds`

- Formatos soportados: `.mp3` `.wav` `.ogg` `.flac` `.m4a`

2. Úsalos en el chat de Twitch de dos formas:

### Modo A — Intercalado en TTS

Escribe `!tts` seguido de tu mensaje, y pon el nombre del sonido entre paréntesis donde quieras que suene:

```
!tts oye mira esto (krem) qué genial verdad (risa) adiós!

```

Resultado:

```
🔊 TTS: "oye mira esto"  →  🔊 krem.mp3  →  🔊 TTS: "qué genial verdad"  →  🔊 risa.mp3  →  🔊 TTS: "adiós!"

```

Si el nombre entre paréntesis no corresponde a ningún sonido, lo lee como texto normal.

### Modo B — Sonido rápido

```
!krem          →  reproduce krem.mp3 directamente (sin texto)
!risa          →  reproduce risa.mp3 directamente

```

**Ejemplos de archivos:**

```
/sounds/risa.wav    →  !tts jaja (risa) xd          |   !risa
/sounds/hype.mp3    →  !tts gana (hype) gg          |   !hype

```

---

## ▶️ Uso

Abre una terminal en la carpeta principal del proyecto y arranca el servidor:

```bash
npm start

```

### 🖥️ Configuración en OBS y Panel de Control:

1. Abre tu navegador web e ingresa a:

```
http://localhost:3000

```

_Aquí verás el **Panel de Control interactivo** con los sliders de volumen, delay, filtros en vivo, el botón de pánico y la lista de la cola de pendientes a la derecha._ 2. **Haz clic en el banner superior** de la página para desbloquear y activar el audio del navegador. 3. Agrega esa misma URL (`http://localhost:3000`) como una fuente de **Navegador (Browser Source)** en OBS para que reproduzca los audios en tu directo (puedes ocultarla o hacerla pequeña para que no estorbe visualmente).

---

## 📁 Estructura del proyecto

```
selfhost-twitch-tts/
├── public/
│   ├── css/
│   │   └── style.css        ← Estilos
│   └── index.html           ← Panel Web de control y reproductor
├── sounds/                  ←PON TUS SONIDOS AQUÍ
├── src/
│   ├── config/
│   │   └── configManager.js ← Gestor de lectura/escritura de configuración
│   ├── core/
│   │   ├── queue.js         ← Cola de audio con eventos y sincronización
│   │   └── twitchManager.js ← Conexión principal al chat de Twitch
│   ├── handlers/
│   │   └── twitchHandler.js ← Lógica de comandos (!tts, sonidos, filtros)
│   ├── services/
│   │   ├── filters.js       ← Filtros de mensajes, blacklist y permisos
│   │   ├── soundboard.js    ← Gestión de sonidos personalizados
│   │   ├── tts.js           ← Generación de audio TTS (Google / Local)
│   │   └── ttsService.js    ← Procesador y unificador de segmentos de audio
│   ├── app.js               ← Servidor Express y WebSockets del Panel
│   └── index.js             ← Entry point, orquesta todo el sistema
├── temp/                    ← Archivos TTS temporales (auto-limpiados)
├── config.json              ← Configuración persistente del sistema
├── .env                     ← Tokens secretos (Twitch OAuth)
├── .env.example             ← Plantilla de variables de entorno
└── README.md
```
