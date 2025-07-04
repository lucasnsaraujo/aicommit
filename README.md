# AICommit

CLI para gerar mensagens de commit automaticamente usando GPT.
dasds
## Características

- ✨ Gera mensagens de commit seguindo Conventional Commits
- 🔍 Compara mudanças com qualquer branch
- 🤖 Integração com OpenAI GPT-4
- 📱 Menu interativo com inquirer
- ⚡ Commit automático após aprovação
- 🔧 Configuração simples da API key

## Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Compilar o projeto

```bash
npm run build
```

### 3. Instalar globalmente

```bash
npm run install-global
```

## Configuração

### Configurar API Key da OpenAI

```bash
aicommit config
```

Ou use o menu interativo:

```bash
aicommit
```

## Uso

### Comando direto

```bash
# Gerar commit automaticamente
aicommit commit

# Especificar branch para comparar
aicommit commit -b main
```

### Menu interativo

```bash
aicommit
```

## Como funciona

1. **Detecta mudanças**: Usa `git diff` para obter as mudanças locais
2. **Escolhe branch**: Permite escolher qual branch usar para comparação
3. **Gera mensagem**: Envia o diff para o GPT gerar uma mensagem seguindo Conventional Commits
4. **Confirma commit**: Mostra a mensagem gerada e pergunta se deve fazer o commit
5. **Executa commit**: Faz `git add -A` e `git commit` com a mensagem gerada

## Exemplos de mensagens geradas

```
feat: add campos AI ao bloco Feature da coleção Hero
- Adicionado aiPrompt e aiDescription ao schema do bloco Feature
- Atualizada UI do admin para renderizar novos campos
- Removido arquivo de configuração AI não utilizado
```

```
fix: corrigir validação de email no formulário de contato
- Atualizada regex para aceitar domínios com pontos múltiplos
- Adicionada mensagem de erro mais específica
```

## Desenvolvimento

```bash
# Executar em modo desenvolvimento
npm run dev

# Compilar
npm run build

# Executar compilado
npm start
```

## Configuração

O arquivo de configuração fica em `~/.aicommit/config.json` e contém:

```json
{
  "apiKey": "sua-api-key-aqui"
}
```

## Requisitos

- Node.js 18+
- Git
- API key da OpenAI
- Repositório Git inicializado 