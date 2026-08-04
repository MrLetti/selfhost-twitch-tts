# Self-Host Twitch TTS 🎙️

Sistema **TTS self-hosteable** que lee el chat de Twitch y se reproduce directamente en tu PC (ideal para OBS). Sin costo, sin APIs de pago. Incluye un **Panel de Control Web interactivo** para moderación en tiempo real.

⚠️ **Aviso importante sobre Hosting:** Este bot está diseñado específicamente para **ejecutarse de forma local en tu PC** (Self-Host) donde utilices OBS. No es compatible con servicios Serverless en la nube ya que requiere conexiones WebSockets persistentes (24/7), lectura de archivos en tiempo real y reproducir el audio directamente en tu hardware local.

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
  - 📂 **Centro de Sonidos (Modal)**: Ventana flotante integrada para subir nuevos audios y eliminar los existentes de manera gráfica sin recargar la página.
  - 🚨 **Botón de Apagado de Emergencia (Pánico)** para vaciar la cola y silenciar el audio al instante.
- 🌐 Motor **Google TTS gratis** (sin API key) o **TTS local** del sistema.
- 🔄 Baja latencia, ideal para streams.

---

## 📋 Requisitos

- **Node.js 18+** [https://nodejs.org/es/download](https://nodejs.org/es/download)
- Token de Twitch (opcional — sin él no podrán tirar comandos como !sonidos donde el bot debe responder en el chat) [https://twitchtokengenerator.com](https://twitchtokengenerator.com)

---

## ⁉️Como abrir una consola/terminal

### En Windows
- Desde la barra de direcciones: Abre tu carpeta en el Explorador de Archivos, haz clic en la barra de direcciones en la parte superior (donde dice la ruta de la carpeta), borra el texto, escribe cmd y presiona Enter.

- Con el menú contextual: Haz clic derecho en un espacio vacío dentro de la carpeta. Luego, selecciona Abrir Terminal.

### En Linux

- Con el clic derecho (interfaz gráfica): En la gran mayoría de los gestores de archivos (como Nautilus en Ubuntu o Thunar en Linux Mint), simplemente entra a la carpeta, haz clic derecho en un espacio vacío y selecciona la opción Abrir en la terminal (o Open in Terminal).

- Atajo de teclado rápido: Si usas entornos como KDE Plasma (con el gestor Dolphin), puedes simplemente presionar la tecla F4 para desplegar un panel de terminal integrado directamente en la parte inferior de esa misma carpeta.

## 🚀 Instalación

> Todo lo relacionado a copiar y pegar, también se puede hacer a mano con interfaz gráfica y cambiando el nombre. Decisión del usuario de como hacer este procedimiento

En la **carpeta del proyecto**, abrir una consola(terminal) y ejecutar los siguientes comandos. 

### 1. Instalar dependencias

Primero, descarga e instala todos los paquetes necesarios para que el proyecto funcione:

```bash
npm install

```

### 2. Configurar variables de entorno

Debes crear tu propio archivo `.env` a partir del archivo de ejemplo. Copia y pega el comando correspondiente a tu terminal:

**Para Linux, macOS o PowerShell:**

```bash
cp .env.example .env

```

**Para CMD clásico de Windows:**

```cmd
copy .env.example .env

```

> **Nota importante:** Abre el nuevo archivo `.env` que acabas de crear y agrega tu `TWITCH_OAUTH_TOKEN` si deseas que el bot tenga permisos para responder en el chat.

### 3. Configurar el archivo JSON

Por último, necesitas generar tu archivo de configuración `config.json` basándote en el ejemplo. Usa el comando adecuado para tu sistema:

**Para Linux, macOS o PowerShell (Windows):**

```bash
cp config.json.example config.json

```

**Para CMD clásico de Windows:**

```cmd
copy config.json.example config.json

```

## ▶️ Uso

Abre una terminal en la carpeta principal del proyecto y arranca el servidor localmente:

```bash
npm start
```

### 🖥️ Configuración en OBS y Panel de Control:

1. Abre tu navegador web e ingresa a:

```text
http://localhost:3000
```

_(Aquí verás el **Panel de Control interactivo** con los sliders de volumen, delay, filtros en vivo, el botón de pánico, el Gestor de Sonidos y la lista de la cola a la derecha)._ 2. **Haz clic en el banner superior** de la página para desbloquear y activar el audio del navegador. 3. Agrega esa misma URL (`http://localhost:3000`) como una fuente de **Navegador (Browser Source)** en OBS para que reproduzca los audios en tu directo (puedes ocultarla o hacerla pequeña para que no estorbe visualmente).

---

---

## ⚙️ Configuración

### `config.json`

```jsonc
{
  "twitch": {
    "channel": "tu_canal", // nombre de tu canal de Twitch(usuario sin mayusculas)
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

Puedes agregar sonidos de dos formas:

1. **Desde la interfaz web:** Haz clic en el botón principal **"🎵 Abrir Gestor de Sonidos"** en el panel de control y usa la ventana emergente para subir tus archivos `.mp3` o `.wav`. En esta misma ventana podrás gestionar y eliminar los audios antiguos.
2. **Manualmente:** Copia tus archivos de audio a la carpeta `/sounds` (formatos soportados: `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`).

### Úsalos en el chat de Twitch de dos formas:

#### Modo A — Intercalado en TTS

Escribe `!tts` seguido de tu mensaje, y pon el nombre del sonido entre paréntesis donde quieras que suene:

```text
!tts oye mira esto (krem) qué genial verdad (risa) adiós!
```

_Resultado:_

```text
🔊 TTS: "oye mira esto"  →  🔊 krem.mp3  →  🔊 TTS: "qué genial verdad"  →  🔊 risa.mp3  →  🔊 TTS: "adiós!"
```

_(Si el nombre entre paréntesis no corresponde a ningún sonido, lo lee como texto normal)._

#### Modo B — Sonido rápido

```text
!krem          →  reproduce krem.mp3 directamente (sin texto)
!risa          →  reproduce risa.mp3 directamente
```

---

## 📁 Estructura del proyecto

```text
selfhost-twitch-tts/
├── public/
│   ├── css/
│   │   └── style.css          ← Estilos del panel web
│   ├── js/
│   │   └── socketLogic.js     ← Lógica de WebSockets del panel
│   └── index.html             ← Panel Web de control y reproductor
├── sounds/                    ← PON TUS SONIDOS AQUÍ (.gitkeep, .mp3, etc.)
├── src/
│   ├── config/
│   │   └── configManager.js   ← Gestor de lectura/escritura de configuración
│   ├── core/
│   │   ├── queue.js           ← Cola de audio con eventos y sincronización
│   │   └── twitchManager.js   ← Conexión principal al chat de Twitch
│   ├── handlers/
│   │   └── twitchHandler.js   ← Lógica de comandos (!tts, sonidos, filtros)
│   ├── services/
│   │   ├── filters.js         ← Filtros de mensajes, blacklist y permisos
│   │   ├── soundboard.js      ← Gestión de sonidos personalizados
│   │   ├── tts.js             ← Generación de audio TTS (Google / Local)
│   │   └── ttsService.js      ← Procesador y unificador de segmentos de audio
│   ├── app.js                 ← Servidor Express, WebSockets y rutas de API
│   └── index.js               ← Entry point, orquesta todo el sistema
├── temp/                      ← Archivos TTS temporales (auto-limpiados)
├── config.json                ← Configuración persistente del sistema
├── .env                       ← Tokens secretos (Twitch OAuth)
├── .env.example               ← Plantilla de variables de entorno
└── README.md
```
