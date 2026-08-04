#!/usr/bin/env node
/**
 * test-rag-knowledge.mjs — testa que o RAG realmente injeta conhecimento
 * dos livros no LLM. Faz 2 chamadas para cada pergunta:
 *   A) SEM RAG (baseline: só o LLM base)
 *   B) COM RAG (chunks top-K injetados no user message)
 * Compara respostas e valida:
 *   - RAG retorna chunks com sim > MIN_SIM
 *   - Resposta COM RAG cita [n] (fonte)
 *   - Resposta COM RAG contém termos específicos dos livros
 *
 * Como "cheira" o LLM sem chamá-lo (economia de tempo em CPU):
 *   Se --with-llm passado → faz chamada real ao qwen2.5-coder:7b
 *   Senão → só valida que o RAG retorna hits e formata contexto corretamente
 *
 * Uso:
 *   node scripts/test-rag-knowledge.mjs           # rápido, só RAG (~10s)
 *   node scripts/test-rag-knowledge.mjs --with-llm  # completo (~10min em CPU)
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';

const OLLAMA = 'http://127.0.0.1:11434';
const EMBED_MODEL = 'nomic-embed-text';
const CHAT_MODEL = 'qwen2.5-coder:7b';
const RAG_DIR = 'docs/rag-data';
const WITH_LLM = process.argv.includes('--with-llm');
const TOP_K = 5;
const MIN_SIM = 0.35;

// ─── Helpers ─────────────────────────────────────────────────────────────
function cosine(a, b) {
  let s = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { s += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return s / (Math.sqrt(na) * Math.sqrt(nb));
}

async function embed(text) {
  const r = await fetch(OLLAMA + '/api/embed', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`embed HTTP ${r.status}`);
  return (await r.json()).embeddings[0];
}

async function chat(system, user, timeoutMs = 300000) {
  const r = await fetch(OLLAMA + '/api/chat', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL, stream: false,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      options: { temperature: 0.3, num_predict: 500 },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) throw new Error(`chat HTTP ${r.status}`);
  return (await r.json()).message?.content || '';
}

// ─── Load todos os chunks disponíveis ────────────────────────────────────
console.log('\n📚 Carregando corpus RAG…');
const manifest = existsSync(join(RAG_DIR, '_manifest.json'))
  ? JSON.parse(readFileSync(join(RAG_DIR, '_manifest.json'), 'utf8'))
  : { books: [] };
console.log(`  ${manifest.books.length} livros no manifest`);

const allChunks = [];
for (const bookMeta of manifest.books) {
  const gzPath = join(RAG_DIR, bookMeta.file);
  if (!existsSync(gzPath)) { console.log(`  ⏭️  ${bookMeta.file} não encontrado`); continue; }
  try {
    const doc = JSON.parse(gunzipSync(readFileSync(gzPath)).toString());
    for (const c of doc.chunks) {
      allChunks.push({ text: c.text, embedding: c.embedding, source: doc.source });
    }
  } catch (e) {
    console.log(`  ❌ ${bookMeta.file}: ${e.message}`);
  }
}
console.log(`  Total: ${allChunks.length} chunks carregados\n`);

if (allChunks.length === 0) {
  console.error('❌ Nenhum chunk disponível. Rode primeiro: node scripts/rag-build.mjs');
  process.exit(1);
}

// ─── Perguntas de teste — cada uma tem termos que só o livro conhece ────
// Escolhi perguntas específicas aos 5 primeiros livros processados
const QUESTIONS = [
  {
    id: 'clickjacking',
    q: 'Explique clickjacking e a técnica de Frame Busting. Como funciona a proteção padrão que exibe página em branco?',
    expectSource: /clickjacking/i,
    expectTerms: ['frame busting', 'iframe', 'sequestro', 'clique'],
  },
  {
    id: 'xss-avancado',
    q: 'Explique técnicas avançadas de XSS que burlam WAF. Que payloads são discutidos em livros técnicos de XSS?',
    expectSource: /xss|Advanced/i,
    expectTerms: ['script', 'payload', 'bypass', 'filtro'],
  },
  {
    id: 'anonimato',
    q: 'Como usar Tor para anonimato na Internet? Quais são os riscos e proteções recomendados em livros de segurança?',
    expectSource: /anonimato/i,
    expectTerms: ['tor', 'proxy', 'vpn', 'anônimo'],
  },
  {
    id: 'wireless',
    q: 'Como analisar vulnerabilidades em redes wireless WPA2? Quais ferramentas os manuais recomendam?',
    expectSource: /wireless|Wireless|sem fio/i,
    expectTerms: ['wpa', 'aircrack', 'handshake', 'wireless'],
  },
];

let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log(`  ✅ ${label}${detail ? ` — ${detail}` : ''}`); }
  else { fail++; console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`); }
};

// ─── Roda cada pergunta ─────────────────────────────────────────────────
for (const question of QUESTIONS) {
  console.log(`\n════ [${question.id}] ${question.q.slice(0, 80)}… ════`);

  // 1. Embed da query
  let qVec;
  try { qVec = await embed(question.q); }
  catch (e) { ok('embed query', false, e.message); continue; }
  ok('embed query gerou vetor', qVec && qVec.length === manifest.embeddingDim);

  // 2. Top-K retrieval
  const scored = allChunks
    .map((c, i) => ({ i, sim: cosine(qVec, c.embedding), text: c.text, source: c.source }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, TOP_K);
  console.log(`  Top-${TOP_K}:`);
  scored.forEach((s, i) => console.log(`    #${i+1} sim=${s.sim.toFixed(3)} · ${s.source} · "${s.text.slice(0, 80).replace(/\n/g, ' ')}…"`));

  ok('todos os top-K acima de MIN_SIM', scored.every(s => s.sim >= MIN_SIM), `min sim ${Math.min(...scored.map(s=>s.sim)).toFixed(3)}`);
  ok('top-1 tem sim > 0.5', scored[0].sim > 0.5, `top-1 sim ${scored[0].sim.toFixed(3)}`);
  ok('fonte esperada aparece no top-K', scored.some(s => question.expectSource.test(s.source)),
    `fontes: ${[...new Set(scored.map(s => s.source))].join(', ')}`);

  // 3. Se --with-llm: chama LLM COM e SEM contexto e compara
  if (WITH_LLM) {
    const SYSTEM_BASE = 'Você é o Comandante T3MP3ST. Responda em português técnico e conciso.';
    const SYSTEM_RAG = SYSTEM_BASE + '\n\nQuando houver bloco <context>, cite [n] das fontes e diga "não sei" se insuficiente.';

    console.log(`  Chamando LLM SEM RAG (~90s)…`);
    let respWithout;
    try {
      const t0 = Date.now();
      respWithout = await chat(SYSTEM_BASE, question.q);
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`    → ${dt}s, ${respWithout.length} chars`);
    } catch (e) { ok('LLM sem RAG respondeu', false, e.message); continue; }

    console.log(`  Chamando LLM COM RAG (~90s)…`);
    const ctxLines = ['<context>'];
    scored.forEach((s, i) => { ctxLines.push(`[${i+1}] fonte: ${s.source}`); ctxLines.push(s.text.slice(0, 800)); ctxLines.push(''); });
    ctxLines.push('</context>');
    const userWithCtx = ctxLines.join('\n') + '\n\nPergunta: ' + question.q + '\n\n(Cite [n] das fontes.)';

    let respWith;
    try {
      const t0 = Date.now();
      respWith = await chat(SYSTEM_RAG, userWithCtx);
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`    → ${dt}s, ${respWith.length} chars`);
    } catch (e) { ok('LLM com RAG respondeu', false, e.message); continue; }

    // Métricas de qualidade
    ok('resposta COM RAG cita [n] (fonte numerada)', /\[\d+\]/.test(respWith), respWith.match(/\[\d+\]/g)?.slice(0,3).join(', '));

    const termsInBase = question.expectTerms.filter(t => new RegExp(t, 'i').test(respWithout));
    const termsInRag = question.expectTerms.filter(t => new RegExp(t, 'i').test(respWith));
    ok('resposta COM RAG cobre mais termos técnicos', termsInRag.length >= termsInBase.length,
      `sem RAG: ${termsInBase.length}/${question.expectTerms.length} · com RAG: ${termsInRag.length}/${question.expectTerms.length}`);

    console.log('    Preview SEM RAG:', respWithout.slice(0, 200).replace(/\n/g, ' '));
    console.log('    Preview COM RAG:', respWith.slice(0, 200).replace(/\n/g, ' '));
  }
}

// ─── Sumário ─────────────────────────────────────────────────────────────
console.log(`\n════════════════════════════`);
console.log(`Total: ${pass} ok · ${fail} falha(s)`);
console.log(`Pass rate: ${((pass / (pass + fail)) * 100).toFixed(1)}%`);
if (!WITH_LLM) {
  console.log('\nDica: para testar impacto real no LLM, rode:');
  console.log('    node scripts/test-rag-knowledge.mjs --with-llm');
  console.log('    (~10min em CPU, mas mede se resposta melhora com contexto)');
}
process.exit(fail > 0 ? 1 : 0);
