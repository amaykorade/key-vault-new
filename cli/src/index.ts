#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import ora from 'ora';
import open from 'open';
import { loadConfig, saveConfig, loadProjectConfig, saveProjectConfig, ConfigFile, ProjectConfig } from './lib/config.js';
import { apiGet, ApiError, apiBaseUrl } from './lib/api.js';
import { ensureAuthToken, ensureSetupConfig } from './lib/helpers.js';
import { spawn } from 'node:child_process';
import process from 'node:process';

const program = new Command();

program
  .name('keyvault')
  .description('Key Vault CLI')
  .version('0.1.0');

program
  .command('login')
  .description('Authenticate the CLI with your Key Vault account')
  .option('-t, --token <token>', 'Provide a CLI token directly')
  .option('-n, --name <name>', 'Friendly name for this device (stored with the token)')
  .action(async (options) => {
    const config = await loadConfig();
    let token = options.token as string | undefined;

    if (!token) {
      console.log(chalk.cyan('Opening the Key Vault dashboard to generate a CLI token...\n'));
      const dashboardUrl = 'https://key-vault-new.vercel.app/cli';
      try {
        await open(dashboardUrl, { wait: false });
      } catch {
        console.log(chalk.yellow('Unable to automatically open the browser. Please visit:\n'));
        console.log(chalk.green(dashboardUrl));
      }

      const response = await prompts({
        type: 'password',
        name: 'token',
        message: 'Paste the CLI token here',
        validate: (value: string) => (value && value.startsWith('kv_cli_') ? true : 'Token must start with kv_cli_'),
      });

      token = response.token;
    }

    if (!token) {
      console.error(chalk.red('No token provided. Login aborted.'));
      process.exitCode = 1;
      return;
    }

    const updatedConfig: ConfigFile = {
      ...config,
      auth: {
        token,
        name: options.name || config.auth?.name,
        lastLogin: new Date().toISOString(),
      },
    };

    await saveConfig(updatedConfig);
    console.log(chalk.green('✓ Token saved. CLI is authenticated.'));
  });

program
  .command('whoami')
  .description('Show information about the currently authenticated account')
  .action(async () => {
    const token = await ensureAuthToken();
    const spinner = ora('Fetching profile…').start();
    try {
      const data = await apiGet('/cli/profile', token);
      spinner.stop();
      console.log(chalk.green('Authenticated as:'));
      console.log(`  ${chalk.bold(data.user.name || data.user.email)}`);
      console.log(`  Email: ${data.user.email}`);
      if (data.user.name) {
        console.log(`  Name:  ${data.user.name}`);
      }
      console.log(chalk.gray(`API Base: ${apiBaseUrl()}`));
    } catch (error) {
      spinner.stop();
      if (error instanceof ApiError) {
        console.error(chalk.red(`Failed to fetch profile: ${error.message}`));
      } else {
        console.error(chalk.red('Failed to fetch profile'), error);
      }
      process.exitCode = 1;
    }
  });

program
  .command('setup')
  .description('Configure the default project, environment, and folder for this directory')
  .action(async () => {
    const token = await ensureAuthToken();
    const spinner = ora('Fetching organizations…').start();
    try {
      const orgResponse = await apiGet('/cli/organizations', token);
      spinner.stop();

      if (!orgResponse.organizations.length) {
        console.error(chalk.red('No organizations found. Please create one in the dashboard first.'));
        process.exitCode = 1;
        return;
      }

      const orgChoices = orgResponse.organizations.map((org: any) => ({
        title: `${org.name} (${org.role})`,
        value: org.id,
      }));

      const { organizationId } = await prompts({
        type: 'select',
        name: 'organizationId',
        message: 'Select organization',
        choices: orgChoices,
      });

      const projectResponse = await apiGet(`/cli/projects?organizationId=${organizationId}`, token);
      if (!projectResponse.projects.length) {
        console.error(chalk.red('No projects found. Create one in the dashboard.'));
        process.exitCode = 1;
        return;
      }

      const { projectId } = await prompts({
        type: 'select',
        name: 'projectId',
        message: 'Select project',
        choices: projectResponse.projects.map((project: any) => ({
          title: `${project.name} (${project.accessType})`,
          value: project.id,
        })),
      });

      const envResponse = await apiGet(`/cli/environments?projectId=${projectId}`, token);
      const { environment } = await prompts({
        type: 'select',
        name: 'environment',
        message: 'Select environment',
        choices: envResponse.environments.map((env: any) => ({
          title: env.label,
          value: env.slug,
        })),
      });

      const folderResponse = await apiGet(`/cli/folders?projectId=${projectId}&environment=${environment}`, token);

      const folderChoices = folderResponse.folders.length
        ? folderResponse.folders.map((folder: any) => ({
            title: `${folder.name} (${folder.environment})`,
            value: folder.slug,
          }))
        : [{ title: 'default', value: 'default' }];

      const { folder } = await prompts({
        type: 'select',
        name: 'folder',
        message: 'Select folder',
        choices: folderChoices,
      });

      const config: ProjectConfig = {
        setup: {
          projectId,
          environment,
          folder,
        },
      };

      await saveProjectConfig(config);
      console.log(chalk.green('✓ Project configuration saved to .keyvault.yaml'));
    } catch (error) {
      spinner.stop();
      if (error instanceof ApiError) {
        console.error(chalk.red(`Setup failed: ${error.message}`));
      } else {
        console.error(chalk.red('Setup failed'), error);
      }
      process.exitCode = 1;
    }
  });

program
  .command('run')
  .description('Execute a command with secrets injected into the environment')
  .allowUnknownOption()
  .allowExcessArguments()
  .argument('[...cmd]', 'Command to run')
  .action(async (_, command) => {
    const token = await ensureAuthToken();
    const projectConfig = await ensureSetupConfig();

    const args = command.args.filter((arg: string) => arg !== '--');
    if (!args.length) {
      console.error(chalk.red('Please provide a command to run, e.g. keyvault run -- npm start'));
      process.exitCode = 1;
      return;
    }

    const spinner = ora('Fetching secrets…').start();
    try {
      const query = new URLSearchParams({
        projectId: projectConfig.setup.projectId,
        environment: projectConfig.setup.environment,
        folder: projectConfig.setup.folder,
        format: 'json',
      });
      const data = await apiGet(`/cli/secrets/download?${query.toString()}`, token);
      spinner.stop();

      const secrets = data.secrets || {};
      const [commandName, ...commandArgs] = args;

      console.log(chalk.gray(`Injecting ${Object.keys(secrets).length} secrets`));

      const childEnv = {
        ...process.env,
        ...secrets,
        KEYVAULT_PROJECT_ID: projectConfig.setup.projectId,
        KEYVAULT_ENVIRONMENT: projectConfig.setup.environment,
        KEYVAULT_FOLDER: projectConfig.setup.folder,
      };

      const child = spawn(commandName, commandArgs, {
        stdio: 'inherit',
        env: childEnv,
        shell: process.platform === 'win32',
      });

      child.on('exit', (code: number | null) => {
        process.exitCode = code === null ? 1 : code;
      });
    } catch (error) {
      spinner.stop();
      if (error instanceof ApiError) {
        console.error(chalk.red(`Failed to fetch secrets: ${error.message}`));
      } else {
        console.error(chalk.red('Failed to fetch secrets'), error);
      }
      process.exitCode = 1;
    }
  });

program.parse();

