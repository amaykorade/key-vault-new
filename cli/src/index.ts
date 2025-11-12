#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import ora from 'ora';
import open from 'open';
import { loadConfig, saveConfig, loadProjectConfig, saveProjectConfig, ConfigFile, ProjectConfig } from './lib/config.js';
import packageJson from '../package.json';
import { apiGet, ApiError, apiBaseUrl } from './lib/api.js';
import { ensureAuthToken, ensureSetupConfig } from './lib/helpers.js';
import { spawn } from 'node:child_process';
import process from 'node:process';

const program = new Command();

program
  .name('keyvault')
  .description('Key Vault CLI')
  .version(packageJson.version);

program
  .command('login')
  .description('Authenticate the CLI with your Key Vault account')
  .option('-t, --token <token>', 'Provide a CLI token directly (legacy: manual token entry)')
  .option('-n, --name <name>', 'Friendly name for this device (stored with the token)')
  .action(async (options) => {
    const config = await loadConfig();
    let token = options.token as string | undefined;

    // Legacy manual token flow
    if (token) {
      if (!token.startsWith('kv_cli_')) {
        console.error(chalk.red('Invalid token format. Token must start with kv_cli_'));
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
      return;
    }

    // Browser-based OAuth flow
    console.log(chalk.cyan('\n🔐 Starting CLI authentication...\n'));

    try {
      // Generate device code
      const { apiPost } = await import('./lib/api.js');
      const deviceCodeInfo = await apiPost('/cli/device-code');

      const { deviceCode, userCode, verificationUrl, expiresIn, interval } = deviceCodeInfo;

      console.log(chalk.bold('Step 1: Open this URL in your browser:'));
      console.log(chalk.cyan(verificationUrl));
      console.log(chalk.gray(`\nOr enter this code manually: ${chalk.bold(userCode)}\n`));

      // Open browser
      try {
        await open(verificationUrl, { wait: false });
        console.log(chalk.green('✓ Browser opened. Waiting for authorization...\n'));
      } catch {
        console.log(chalk.yellow('⚠ Unable to automatically open the browser.'));
        console.log(chalk.yellow('Please visit the URL above to authorize the CLI.\n'));
      }

      // Poll for token
      const spinner = ora('Waiting for authorization...').start();
      const startTime = Date.now();
      const expiryTime = startTime + expiresIn * 1000;
      let pollCount = 0;
      const maxPolls = Math.ceil(expiresIn / interval);

      while (Date.now() < expiryTime && pollCount < maxPolls) {
        // Wait before polling (except first time)
        if (pollCount > 0) {
          await new Promise((resolve) => setTimeout(resolve, interval * 1000));
        }
        pollCount++;

        try {
          const status = await apiGet(`/cli/device-code/${deviceCode}`);

          if (status.status === 'approved' && status.token) {
            spinner.stop();
            console.log(chalk.green('\n✓ Authorization successful!\n'));

            // Save token
            const updatedConfig: ConfigFile = {
              ...config,
              auth: {
                token: status.token,
                name: options.name || config.auth?.name || `CLI ${new Date().toLocaleDateString()}`,
                lastLogin: new Date().toISOString(),
              },
            };

            await saveConfig(updatedConfig);
            console.log(chalk.green('✓ Token saved. CLI is authenticated.'));
            return;
          } else if (status.status === 'expired') {
            spinner.stop();
            const errorMsg = status.error || 'Authorization expired';
            console.error(chalk.red(`\n✗ ${errorMsg}`));
            if (errorMsg.includes('not found')) {
              console.error(chalk.yellow('  Tip: Make sure the backend is running and the device code was created successfully.'));
              console.error(chalk.yellow('  Try running: curl http://localhost:4000/health'));
            } else if (errorMsg.includes('already retrieved')) {
              console.error(chalk.yellow('  The token was already retrieved. Please run `keyvault login` again.'));
            } else if (errorMsg.includes('expired')) {
              console.error(chalk.yellow('  Device codes expire after 10 minutes. Please run `keyvault login` again.'));
            }
            process.exitCode = 1;
            return;
          } else if (status.status === 'pending') {
            // Update spinner text to show we're still waiting
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, expiresIn - elapsed);
            spinner.text = `Waiting for authorization... (${remaining}s remaining)`;
            // Continue polling
            continue;
          }
        } catch (error: any) {
          // For network errors, continue polling (might be transient)
          if (error instanceof ApiError) {
            if (error.status === 404) {
              // 404 might mean device code not found, but continue polling in case it's a timing issue
              continue;
            } else if (error.status >= 500) {
              // Server errors, continue polling
              continue;
            } else {
              // Other errors, stop polling
              spinner.stop();
              console.error(chalk.red(`\n✗ Error: ${error.message}`));
              process.exitCode = 1;
              return;
            }
          } else {
            // Network or other errors, continue polling
            continue;
          }
        }
      }

      spinner.stop();
      console.error(chalk.red('\n✗ Authorization timed out. Please try again.'));
      process.exitCode = 1;
    } catch (error) {
      console.error(chalk.red(`\n✗ Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exitCode = 1;
    }
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

