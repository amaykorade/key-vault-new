import chalk from 'chalk';
import prompts from 'prompts';
import { loadConfig, loadProjectConfig, ProjectConfig } from './config.js';

export async function ensureAuthToken(): Promise<string> {
  const config = await loadConfig();
  if (config.auth?.token) {
    return config.auth.token;
  }

  console.error(chalk.red('No CLI token found. Run `keyvault login` first.'));
  const response = await prompts({
    type: 'confirm',
    name: 'login',
    message: 'Would you like to run keyvault login now?',
    initial: true,
  });

  if (response.login) {
    console.log(chalk.gray('Hint: keyvault login --token <kv_cli_token>'));
  }

  process.exit(1);
}

export async function ensureSetupConfig(): Promise<ProjectConfig> {
  const config = await loadProjectConfig();
  if (config?.setup?.projectId && config.setup.environment && config.setup.folder) {
    return config;
  }

  console.error(chalk.red('No project configuration found. Run `keyvault setup` in this directory.'));
  process.exit(1);
}

