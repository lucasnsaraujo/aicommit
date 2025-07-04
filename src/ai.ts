import OpenAI from 'openai';
import { getConfig } from './config.js';

export async function generateCommitMessage(diff: string): Promise<string> {
  const config = getConfig();
  
  if (!config.apiKey) {
    throw new Error('API key da OpenAI não configurada');
  }

  const openai = new OpenAI({
    apiKey: config.apiKey,
  });

  const prompt = `
Analise as seguintes mudanças no código e gere uma mensagem de commit seguindo a especificação Conventional Commits.

Regras:
1. Use APENAS inglês
2. Formato: tipo(escopo): título
   - Corpo com lista de mudanças específicas
3. Tipos válidos: feat, fix, docs, style, refactor, test, chore
4. Título deve ser claro e direto (máx 50 caracteres)
5. Use verbos no infinitivo: "add", "fix", "remove", "change"
6. NÃO use palavras vagas como "enhance", "improve", "streamline"
7. Seja específico sobre o que foi alterado

Exemplo:
feat: add AI fields to Feature block in Hero collection
- Added aiPrompt and aiDescription to Feature block schema
- Updated admin UI to render new fields
- Removed unused AI config file

Mudanças no código:
\`\`\`diff
${diff}
\`\`\`

Gere apenas a mensagem de commit, sem explicações adicionais:`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em gerar mensagens de commit seguindo Conventional Commits em inglês. Seja preciso e direto.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const message = completion.choices[0]?.message?.content?.trim();
    
    if (!message) {
      throw new Error('Não foi possível gerar mensagem de commit');
    }

    return message;
  } catch (error) {
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('API key inválida ou expirada');
    }
    throw new Error(`Erro ao gerar mensagem com AI: ${error instanceof Error ? error.message : error}`);
  }
} 