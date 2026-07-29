const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '..', '..', 'config.json');

function getConfig() {
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`❌ Error al leer config.json: ${err.message}`);
    return {};
  }
}

function watchConfig(onUpdate) {
  fs.watch(configPath, (eventType) => {
    if (eventType === 'change') {
      try {
        const freshConfig = getConfig();
        if (onUpdate) onUpdate(freshConfig);
      } catch (e) {
        console.error(`❌ Error al recargar config.json: ${e.message}`);
      }
    }
  });
}

function guardarConfig(clave, valor) {
  try {
    const configParseado = getConfig();
    
    if (!configParseado.tts) configParseado.tts = {};
    configParseado.tts[clave] = valor;
    
    fs.writeFileSync(configPath, JSON.stringify(configParseado, null, 2));
  } catch (err) {
    console.error(`❌ Error guardando ${clave} en config.json:`, err.message);
  }
}

module.exports = { getConfig, watchConfig, guardarConfig };