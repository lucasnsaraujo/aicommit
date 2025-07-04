import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface Config {
  apiKey?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.aicommit');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getConfig(): Config {
  try {
    ensureConfigDir();
    if (!fs.existsSync(CONFIG_FILE)) {
      return {};
    }
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao ler configuração:', error);
    return {};
  }
}

export function saveConfig(config: Config): void {
  try {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    throw error;
  }
}

export function setApiKey(apiKey: string): void {
  const config = getConfig();
  config.apiKey = apiKey;
  saveConfig(config);
}

export function hasApiKey(): boolean {
  const config = getConfig();
  return !!config.apiKey;
} 