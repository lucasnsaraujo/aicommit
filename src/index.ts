#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { generateCommitMessage } from './ai.js';
import { getConfig, hasApiKey, setApiKey } from './config.js';
import { createCommit, getBranches, getCurrentBranch, getGitDiff } from './git.js';

const program = new Command();

program
  .name('aicommit')
  .description('CLI para gerar commits automaticamente usando AI')
  .version('1.0.0');

program
  .command('commit')
  .description('Gerar e fazer commit automaticamente')
  .option('-b, --branch <branch>', 'Branch para comparar (padrão: branch atual)')
  .action(async (options) => {
    await commitCommand(options.branch);
  });

program
  .command('config')
  .description('Configurar API key da OpenAI')
  .action(async () => {
    await configCommand();
  });

async function commitCommand(targetBranch?: string) {
  try {
    // Verificar se API key está configurada
    if (!hasApiKey()) {
      console.log(chalk.red('❌ API key da OpenAI não configurada.'));
      console.log(chalk.yellow('Execute: aicommit config'));
      return;
    }

    const currentBranch = await getCurrentBranch();
    console.log(chalk.blue(`📍 Branch atual: ${currentBranch}`));

    // Se não especificou branch, verificar opções disponíveis
    let finalTargetBranch: string | null = targetBranch || null;
    
    if (!finalTargetBranch) {
      const branches = await getBranches();
      const availableBranches = branches.filter(b => b !== currentBranch);
      
      if (availableBranches.length === 0) {
        // Não há outras branches, usar mudanças locais apenas
        console.log(chalk.yellow('⚠️  Não há outras branches disponíveis para comparar.'));
        console.log(chalk.blue('🔍 Verificando mudanças locais não commitadas...'));
        finalTargetBranch = null; // Sinaliza para usar apenas mudanças locais
      } else {
        const { selectedBranch } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedBranch',
            message: 'Escolha a branch para comparar:',
            choices: [
              ...availableBranches,
              { name: '📝 Apenas mudanças locais (não comparar com branch)', value: 'LOCAL_ONLY' }
            ],
            default: availableBranches.includes('main') ? 'main' : availableBranches[0]
          }
        ]);
        finalTargetBranch = selectedBranch === 'LOCAL_ONLY' ? null : selectedBranch;
      }
    }

    if (finalTargetBranch) {
      console.log(chalk.blue(`🔍 Comparando com: ${finalTargetBranch}`));
    } else {
      console.log(chalk.blue('🔍 Analisando mudanças locais'));
    }

    console.log(chalk.blue(`🔍 Comparando com: ${finalTargetBranch}`));

    // Obter diff
    const spinner = ora('Obtendo mudanças...').start();
    let diff: string;
    try {
      diff = await getGitDiff(finalTargetBranch);
      spinner.stop();
    } catch (error) {
      spinner.stop();
      console.log(chalk.red('❌ Erro ao obter mudanças:'));
      console.log(chalk.yellow(`   ${error instanceof Error ? error.message : error}`));
      
      if (error instanceof Error && error.message.includes('não tem commits ainda')) {
        console.log(chalk.blue('\n💡 Dica: Para repositórios novos, faça o primeiro commit manualmente:'));
        console.log(chalk.cyan('   git add -A'));
        console.log(chalk.cyan('   git commit -m "feat: initial commit"'));
      }
      return;
    }

    if (!diff.trim()) {
      console.log(chalk.yellow('⚠️  Nenhuma mudança encontrada.'));
      return;
    }

    console.log(chalk.green(`📝 Mudanças encontradas (${diff.split('\n').length} linhas)`));

    // Gerar mensagem de commit
    const aiSpinner = ora('Gerando mensagem de commit com AI...').start();
    const commitMessage = await generateCommitMessage(diff);
    aiSpinner.stop();

    console.log(chalk.green('\n✨ Mensagem de commit gerada:'));
    console.log(chalk.cyan('─'.repeat(50)));
    console.log(commitMessage);
    console.log(chalk.cyan('─'.repeat(50)));

    // Confirmar commit
    const { shouldCommit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldCommit',
        message: 'Fazer commit com esta mensagem?',
        default: true
      }
    ]);

    if (shouldCommit) {
      const commitSpinner = ora('Fazendo commit...').start();
      await createCommit(commitMessage);
      commitSpinner.stop();
      console.log(chalk.green('✅ Commit realizado com sucesso!'));
    } else {
      console.log(chalk.yellow('❌ Commit cancelado.'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Erro:'), error instanceof Error ? error.message : error);
  }
}

async function configCommand() {
  const currentApiKey = getConfig().apiKey;
  
  console.log(chalk.blue('🔧 Configuração da API Key da OpenAI'));
  
  if (currentApiKey) {
    console.log(chalk.green('✅ API key já configurada'));
    const { reconfigure } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'reconfigure',
        message: 'Deseja reconfigurar a API key?',
        default: false
      }
    ]);
    
    if (!reconfigure) {
      return;
    }
  }

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Digite sua API key da OpenAI:',
      validate: (input) => {
        if (!input.trim()) {
          return 'API key é obrigatória';
        }
        if (!input.startsWith('sk-')) {
          return 'API key deve começar com "sk-"';
        }
        return true;
      }
    }
  ]);

  setApiKey(apiKey);
  console.log(chalk.green('✅ API key configurada com sucesso!'));
}

async function mainMenu() {
  console.log(chalk.blue.bold('\n🤖 AICommit - Gerador Automático de Commits\n'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'O que você deseja fazer?',
      choices: [
        { name: '🚀 Gerar e fazer commit', value: 'commit' },
        { name: '⚙️  Configurar API key', value: 'config' },
        { name: '❌ Sair', value: 'exit' }
      ]
    }
  ]);

  switch (action) {
    case 'commit':
      await commitCommand();
      break;
    case 'config':
      await configCommand();
      break;
    case 'exit':
      console.log(chalk.blue('👋 Até logo!'));
      process.exit(0);
  }
}

// Se executado sem argumentos, mostrar menu
if (process.argv.length === 2) {
  mainMenu();
} else {
  program.parse();
} 