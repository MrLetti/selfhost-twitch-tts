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

function saveConfig(section, keyOrValue, optionalValue) {
  try {
    const parsedConfig = getConfig();

    if (optionalValue === undefined) {
      parsedConfig[section] = keyOrValue;
    } else {
      if (!parsedConfig[section]) parsedConfig[section] = {};
      parsedConfig[section][keyOrValue] = optionalValue;
    }

    fs.writeFileSync(configPath, JSON.stringify(parsedConfig, null, 2));
  } catch (err) {
    console.error(`❌ Error guardando configuración:`, err.message);
  }
}

module.exports = { getConfig, watchConfig, saveConfig };