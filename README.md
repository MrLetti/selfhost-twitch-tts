# Self-Host Twitch TTS 🎙️

Sistema **TTS self-hosteable** que lee el chat de Twitch y se reproduce directamente en tu PC (ideal para OBS). Sin costo, sin APIs de pago.

---

## ✨ Características

- 📢 Lee mensajes con `!tts` del chat de Twitch directamente en tu PC
- 🎵 **Sonido rápido** con `!nombre_sonido` (sin texto, solo el sonido)
- 🌐 Motor **Google TTS gratis** (sin API key) o **TTS local** del sistema (RECOMENDADO GOOGLE, LOCAL ES HORRIBLE)
- 🔇 Filtros configurables: blacklist de usuarios/palabras, cooldown, skip de URLs
- 🔄 Baja latencia (sin retrasos de Discord), ideal para streams

---

## 📋 Requisitos

- **Node.js 18+** https://nodejs.org/es/download
- Token de Twitch (opcional — sin él no podrán tirar comandos como !sonidos) https://twitchtokengenerator.com

## 🚀 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y editar variables de entorno (Opcional)
cp .env.example .env
# Edita .env y agrega tu TWITCH_OAUTH_TOKEN si quieres que el bot responda en el chat

# 3. Editar configuración
# Edita config.json con el nombre de tu canal de Twitch
```

---

## ⚙️ Configuración

### `config.json`

```jsonc
{
  "twitch": {
    "channel": "tu_canal", // Sin # — nombre de tu canal de Twitch
    "bot_username": "nombre_bot", // Solo si usas TWITCH_OAUTH_TOKEN
  },

  "tts": {
    "engine": "google", // "google" (recomendado) o "local"
    "language": "es", // Código de idioma: es, en, pt, de...
    "say_username": true, // ¿Decir "Usuario dice: ..." antes del mensaje?
    "max_length": 200, // Caracteres máximos a leer
    "speed": 1.0, // Velocidad de voz (solo engine "local")
    "volume": 1.0, // Volumen global (0.0 - 1.0) Configurable desde navegador
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
/sounds/risa.wav    →  !tts jaja (risa) xd           |   !risa
/sounds/hype.mp3    →  !tts gana (hype) gg           |   !hype
```

---

## ▶️ Uso

Abrir una consola de windows en la carpeta src del poyecto (click derecho en la carpeta -> abrir con terminal) y escribir:

```bash
node index.js
```

Ingresar al siguiente enlace en navegador:

```
http://localhost:3000
```

## y capturar este navegador en OBS. (Hacer pequeña la página para que no se note en el directo)

## 📁 Estructura del proyecto

```
discord-twitch-tts/
├── src/
│   ├── index.js        ← Entry point, orquesta todo
│   ├── twitch.js       ← Conexión al chat de Twitch
│   ├── tts.js          ← Generación de audio TTS
│   ├── soundboard.js   ← Gestión de sonidos personalizados
│   ├── queue.js        ← Cola de audio (evita superposición)
│   └── filters.js      ← Filtros de mensajes
├── sounds/             ← 🎵 PON TUS SONIDOS AQUÍ
├── public/             ← 🖥️  Pega la URL de este archivo en OBS para ver el reproductor
├── temp/               ← Archivos TTS temporales (auto-limpiados)
├── config.json         ← Toda la configuración
├── .env                ← Tokens secretos (no subir a git)
└── README.md
```

---
