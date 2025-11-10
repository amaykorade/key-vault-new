import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';

export interface ConfigFile {
  auth?: {
    token: string;
    name?: string;
    lastLogin?: string;
  };
}

export interface ProjectConfig {
  setup: {
    projectId: string;
    environment: string;
    folder: string;
  };
}

function getConfigDirectory() {
  if (process.env.KEYVAULT_CONFIG_DIR) return process.env.KEYVAULT_CONFIG_DIR;

  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'KeyVault');
    }

  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg) {
    return path.join(xdg, 'keyvault');
  }

  return path.join(os.homedir(), '.config', 'keyvault');
}

const CONFIG_DIR = getConfigDirectory();
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.yaml');
const PROJECT_CONFIG_PATH = path.join(process.cwd(), '.keyvault.yaml');

function ensureDirSync(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function loadConfig(): Promise<ConfigFile> {
  try {
    const data = await fs.promises.readFile(CONFIG_PATH, 'utf8');
    return YAML.parse(data) || {};
  } catch {
    return {};
  }
}

export async function saveConfig(config: ConfigFile) {
  ensureDirSync(CONFIG_DIR);
  const yaml = YAML.stringify(config);
  await fs.promises.writeFile(CONFIG_PATH, yaml, 'utf8');
}

export async function loadProjectConfig(): Promise<ProjectConfig | null> {
  try {
    const data = await fs.promises.readFile(PROJECT_CONFIG_PATH, 'utf8');
    return YAML.parse(data);
  } catch {
    return null;
  }
}

export async function saveProjectConfig(config: ProjectConfig) {
  const yaml = YAML.stringify(config);
  await fs.promises.writeFile(PROJECT_CONFIG_PATH, yaml, 'utf8');
}

export function configPaths() {
  return {
    configDir: CONFIG_DIR,
    configFile: CONFIG_PATH,
    projectConfigFile: PROJECT_CONFIG_PATH,
  };
}

