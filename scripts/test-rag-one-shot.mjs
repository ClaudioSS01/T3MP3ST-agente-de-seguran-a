#!/usr/bin/env node
/**
 * test-rag-one-shot.mjs — teste ISOLADO: uma pergunta específica que
 * SEM os livros o modelo não teria como saber com precisão.
 *
 * A pergunta de teste: "Segundo Alison do CSIRT PoP-MG, qual é a melhor
 * solução de Frame Busting contra clickjacking?"
 *
 * Isso é MUITO específico do livro `Clickjacking.pdf`:
 *   - Nome do autor: Alison
 *   - Instituição: CSIRT PoP-MG
 *   - Técnica específica citada: "exibir página em branco por padrão"
 *
 * Um LLM base (sem RAG) não conhece esse autor específico — deve dizer que
 * não sabe ou inventar. Com RAG, o chunk do livro é recuperado e o LLM cita
 * a solução real ("exibir página em branco").
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';

const OLLAMA = 'http://127.0.0.1:11434';
const EMBED_MODEL = 'nomic-embed-text';
const CHAT_MODEL = 'qwen2.5-coder:7b';
const RAG_DIR = 'docs/rag-data';

async function embed(text) {
  const r = await fetch(OLLAMA + '/api/embed', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  return (await r.json()).embeddings[0];
}
async function chat(system, user) {
  const t0 = Date.now();
  const r = await fetch(OLLAMA + '/api/chat', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: CHAT_MODEL, stream: false,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      options: { temperature: 0.2, num_predict: 400 },
    }),
    signal: AbortSignal.timeout(300000),
  });
  const d = await r.json();
  return { text: d.message?.content || '', ms: Date.now() - t0 };
}
function cosine(a, b) { let s=0,na=0,nb=0; for(let i=0;i<a.length;i++){s+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];} return s/(Math.sqrt(na)*Math.sqrt(nb)); }

const QUESTION = 'No livro sobre Clickjacking do CSIRT PoP-MG (autor Alison), qual é a técnica de Frame Busting recomendada como melhor solução? Explique especificamente como o comportamento padrão da página deve funcionar.';

console.log('\n🎯 Teste RAG one-shot');
console.log(`   Pergunta: "${QUESTION.slice(0, 80)}..."`);
console.log('');

// Carrega corpus
const manifest = JSON.parse(readFileSync(join(RAG_DIR, '_manifest.json'), 'utf8'));
const allChunks = [];
for (const b of manifest.books) {
  const doc = JSON.parse(gunzipSync(readFileSync(join(RAG_DIR, b.file))).toString());
  doc.chunks.forEach(c => allChunks.push({ ...c, source: doc.source }));
}
console.log(`📚 Corpus: ${manifest.books.length} livros, ${allChunks.length} chunks`);

// Embed + retrieve
const qVec = await embed(QUESTION);
const scored = allChunks
  .map(c => ({ ...c, sim: cosine(qVec, c.embedding) }))
  .sort((a, b) => b.sim - a.sim)
  .slice(0, 3);
console.log(`\n🔍 Top-3 chunks recuperados:`);
scored.forEach((s, i) => console.log(`  #${i+1} sim=${s.sim.toFixed(3)} · ${s.source}`));

// ══════ Chamada A: SEM RAG ══════
console.log('\n════════════════ A) LLM SEM RAG ════════════════');
const SYSTEM = 'Você é o Comandante T3MP3ST. Responda em português técnico, conciso. Se não souber com certeza, diga "não tenho essa informação nos meus livros" ao invés de inventar.';
const respA = await chat(SYSTEM, QUESTION);
console.log(`(${(respA.ms/1000).toFixed(1)}s, ${respA.text.length} chars)`);
console.log(respA.text);

// ══════ Chamada B: COM RAG ══════
console.log('\n════════════════ B) LLM COM RAG ════════════════');
const SYSTEM_RAG = SYSTEM + '\n\nQuando houver bloco <context>, use APENAS as fontes citadas e diga o número [n] em cada afirmação.';
const ctxLines = ['<context>'];
scored.forEach((s, i) => {
  ctxLines.push(`[${i+1}] fonte: ${s.source}`);
  ctxLines.push(s.text.slice(0, 900));
  ctxLines.push('');
});
ctxLines.push('</context>');
const userB = ctxLines.join('\n') + '\n\nPergunta: ' + QUESTION;

const respB = await chat(SYSTEM_RAG, userB);
console.log(`(${(respB.ms/1000).toFixed(1)}s, ${respB.text.length} chars)`);
console.log(respB.text);

// ══════ Análise ══════
console.log('\n════════════════ Análise ════════════════');
const hasFrameBusting = /frame\s?bust/i;
const hasPaginaBranco = /(p[aá]gina[s]? em branco|blank page)/i;
const hasCitation = /\[\d+\]/;
const hasCsirt = /csirt|pop-mg|alison/i;
const naoSei = /(não sei|nao sei|não tenho|não conheço|não estou familiarizado|specific author|não posso confirmar|não há informação)/i;

console.log(`\nSEM RAG:`);
console.log(`  - Cita "Frame Busting": ${hasFrameBusting.test(respA.text) ? '✅' : '❌'}`);
console.log(`  - Menciona "página em branco": ${hasPaginaBranco.test(respA.text) ? '✅' : '❌'}`);
console.log(`  - Menciona CSIRT/PoP-MG/Alison: ${hasCsirt.test(respA.text) ? '✅' : '❌'}`);
console.log(`  - Admite não saber: ${naoSei.test(respA.text) ? '✅ honesto' : '⚠️ pode ter inventado'}`);

console.log(`\nCOM RAG:`);
console.log(`  - Cita "Frame Busting": ${hasFrameBusting.test(respB.text) ? '✅' : '❌'}`);
console.log(`  - Menciona "página em branco": ${hasPaginaBranco.test(respB.text) ? '✅' : '❌'}`);
console.log(`  - Menciona CSIRT/PoP-MG/Alison: ${hasCsirt.test(respB.text) ? '✅' : '❌'}`);
console.log(`  - Cita [n] (fonte numerada): ${hasCitation.test(respB.text) ? '✅' : '❌'}`);

const verdict = (
  hasPaginaBranco.test(respB.text) && !hasPaginaBranco.test(respA.text) ||
  hasCitation.test(respB.text) ||
  hasCsirt.test(respB.text) && !hasCsirt.test(respA.text)
);
console.log(`\n${verdict ? '✅' : '❌'} Veredito: RAG ${verdict ? 'ADICIONOU conhecimento específico dos livros' : 'não adicionou informação nova'}.`);
