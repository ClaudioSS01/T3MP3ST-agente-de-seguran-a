#!/usr/bin/env node
/**
 * set-default-model.mjs — troca o TEMPEST_LOCAL_MODEL no ~/.t3mp3st/.env
 * Uso: node scripts/set-default-model.mjs qwen2.5-coder:7b
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const model = process.argv[2];
if (!model) {
  console.error('Uso: node scripts/set-default-model.mjs <nome-do-modelo>');
  console.error('Ex:  node scripts/set-default-model.mjs qwen2.5-coder:7b');
  process.exit(1);
}

const envDir = join(homedir(), '.t3mp3st');
const envFile = join(envDir, '.env');

if (!existsSync(envDir)) mkdirSync(envDir, { recursive: true });

let lines = [];
if (existsSync(envFile)) {
  lines = readFileSync(envFile, 'utf8').split(/\r?\n/);
}

// Remove qualquer linha TEMPEST_LOCAL_MODEL existente
lines = lines.filter(l => !l.match(/^TEMPEST_LOCAL_MODEL=/));

// Garante que outras chaves defaults existem
const has = (key) => lines.some(l => l.startsWith(`${key}=`));
if (!has('LLM_PROVIDER')) lines.push('LLM_PROVIDER=local');
if (!has('TEMPEST_LOCAL_BASE_URL')) lines.push('TEMPEST_LOCAL_BASE_URL=http://localhost:11434/api');
if (!has('T3MP3ST_PORT')) lines.push('T3MP3ST_PORT=3333');
if (!has('T3MP3ST_FULL_ARSENAL')) lines.push('T3MP3ST_FULL_ARSENAL=true');

// Adiciona no topo (visibilidade)
lines.unshift(`TEMPEST_LOCAL_MODEL=${model}`);
lines = lines.filter((l, i) => l.trim() !== '' || i < lines.length - 1);

writeFileSync(envFile, lines.join('\n') + '\n', 'utf8');
console.log(`✅ TEMPEST_LOCAL_MODEL=${model} escrito em ${envFile}`);
console.log(`ℹ️  Reinicie o servidor T3MP3ST para pegar a mudança:`);
console.log(`    ./00_killall.sh --keep-ollama   # ou 00_killall.bat`);
console.log(`    ./00_iniciar.sh                 # ou 00_Iniciar.bat`);
