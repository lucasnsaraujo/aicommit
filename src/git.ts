import { execSync } from 'child_process';

export async function getGitDiff(targetBranch: string | null = null): Promise<string> {
  try {
    // Primeiro verifica se há mudanças staged
    const stagedDiff = execSync('git diff --cached', { encoding: 'utf8' });
    
    if (stagedDiff.trim()) {
      return stagedDiff;
    }

    // Se não há mudanças staged, pega todas as mudanças não commitadas
    const workingDiff = execSync('git diff', { encoding: 'utf8' });
    
    if (workingDiff.trim()) {
      return workingDiff;
    }

    // Se targetBranch for null, significa que queremos apenas mudanças locais
    if (targetBranch === null) {
      return ''; // Não há mudanças locais
    }

    // Verifica se a branch existe
    if (!branchExists(targetBranch)) {
      throw new Error(`Branch "${targetBranch}" não existe. Use uma branch válida.`);
    }

    // Verifica se há commits no repositório
    if (!hasCommits()) {
      throw new Error('Repositório não tem commits ainda. Faça o primeiro commit manualmente.');
    }

    // Se não há mudanças no working directory, compara com a branch especificada
    const branchDiff = execSync(`git diff ${targetBranch}...HEAD`, { encoding: 'utf8' });
    return branchDiff;
  } catch (error) {
    throw new Error(`Erro ao obter diff do git: ${error instanceof Error ? error.message : error}`);
  }
}

export async function getCurrentBranch(): Promise<string> {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    return branch;
  } catch (error) {
    throw new Error(`Erro ao obter branch atual: ${error instanceof Error ? error.message : error}`);
  }
}

export async function getBranches(): Promise<string[]> {
  try {
    // Se não há commits ainda, retorna lista vazia
    if (!hasCommits()) {
      return [];
    }

    const output = execSync('git branch -a', { encoding: 'utf8' });
    const branches = output
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line && !line.startsWith('*'))
      .map((line: string) => line.replace(/^remotes\/origin\//, ''))
      .filter((line: string) => !line.includes('HEAD'))
      .filter((branch: string, index: number, arr: string[]) => arr.indexOf(branch) === index); // remove duplicatas
    
    // Verifica quais branches realmente existem
    const existingBranches = branches.filter(branch => branchExists(branch));

    return existingBranches;
  } catch (error) {
    return [];
  }
}

export async function createCommit(message: string): Promise<void> {
  try {
    // Adiciona todos os arquivos modificados
    execSync('git add -A', { encoding: 'utf8' });
    
    // Faz o commit
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
  } catch (error) {
    throw new Error(`Erro ao fazer commit: ${error instanceof Error ? error.message : error}`);
  }
}

export function hasGitRepository(): boolean {
  try {
    execSync('git rev-parse --git-dir', { encoding: 'utf8', stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function hasChanges(): boolean {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim().length > 0;
  } catch {
    return false;
  }
}

function branchExists(branchName: string): boolean {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
    return true;
  } catch {
    // Tenta verificar se é uma branch remota
    try {
      execSync(`git show-ref --verify --quiet refs/remotes/origin/${branchName}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

function hasCommits(): boolean {
  try {
    execSync('git rev-parse --verify HEAD', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
} 