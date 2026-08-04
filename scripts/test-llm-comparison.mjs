#!/usr/bin/env node
/**
 * test-llm-comparison.mjs — compara múltiplos modelos LLM locais (Ollama)
 * em 3 tarefas técnicas de segurança que o Comandante do T3MP3ST
 * precisa fazer bem.
 *
 * Métrica de qualidade: pontuação heurística baseada em palavras-chave
 * técnicas + tamanho da resposta + coerência estrutural + tempo de resposta.
 *
 * Uso:
 *   node scripts/test-llm-comparison.mjs
 *   node scripts/test-llm-comparison.mjs --models qwen2.5:3b,llama3.1:8b
 */

const OLLAMA = 'http://127.0.0.1:11434';
const args = process.argv.slice(2);
const modelsFromArg = (args.find(a => a.startsWith('--models='))?.split('=')[1] || '').split(',').filter(Boolean);

const SYSTEM_PROMPT_SEC = `Você é o Comandante do T3MP3ST, um analista de segurança ofensiva.
Responde em português técnico, conciso mas profundo. Estruture com:
- O que é (1-2 frases)
- Por que é perigoso (impacto de negócio)
- Como corrigir (comando ou config exata)
Não invente resultados. Se não sabe, diga.`;

const TESTS = [
  {
    id: 'dmarc',
    prompt: 'Um alvo tem DMARC `v=DMARC1; p=none;` e SPF `v=spf1 include:_spf.google.com ~all`. Explique tecnicamente o problema e como corrigir.',
    // Palavras-chave que uma boa resposta deve mencionar (parcial credit)
    keywords: ['spoof', 'phish', 'reject', 'quarantine', 'hard fail', '-all', 'soft', 'e-mail', 'email', 'fraud', 'monitor'],
    minKeywords: 4,
    minLength: 300,
  },
  {
    id: 'turnstile',
    prompt: 'Um app tem TURNSTILE_LOGIN_ENABLED=false no config público, sem rate limit no /api/auth/login, e Access-Control-Allow-Origin: * nesse endpoint. Qual o risco combinado? Ordene por severidade.',
    keywords: ['credential stuffing', 'brute force', 'CORS', 'CAPTCHA', 'rate limit', 'ALTO', 'crítico', 'ATAQUE', 'password spray'],
    minKeywords: 4,
    minLength: 300,
  },
  {
    id: 'headers',
    prompt: `Interprete estes headers HTTP tecnicamente e priorize os 3 principais problemas:

HTTP/1.1 200 OK
Server: nginx/1.25.2
Content-Type: text/html
Access-Control-Allow-Origin: *
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN

O que está ausente ou fraco?`,
    keywords: ['CSP', 'Content-Security-Policy', 'preload', 'includeSubDomains', 'Permissions-Policy', 'CORS', 'wildcard', 'X-Powered', 'server', 'exposto', 'clickjacking', 'frame-ancestors'],
    minKeywords: 4,
    minLength: 300,
  },
];

async function listModels() {
  const r = await fetch(`${OLLAMA}/api/tags`);
  const d = await r.json();
  return (d.models || []).map(m => m.name);
}

async function askModel(model, systemPrompt, userPrompt) {
  const start = Date.now();
  const r = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model, stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: { temperature: 0.3, num_predict: 700 },
    })
  });
  const elapsed = Date.now() - start;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  return { text: d.message?.content || '', ms: elapsed, evalCount: d.eval_count || 0 };
}

function scoreResponse(response, test) {
  const text = (response.text || '').toLowerCase();
  const found = test.keywords.filter(k => text.includes(k.toLowerCase()));
  const kwScore = Math.min(1, found.length / test.keywords.length); // 0-1
  const lenScore = Math.min(1, response.text.length / (test.minLength * 2)); // 0-1
  const hasStructure = /\d\.|—|:|\*\*|##/.test(response.text) ? 0.2 : 0;
  const totalScore = (kwScore * 0.6 + lenScore * 0.2 + hasStructure) * 100;
  return {
    found,
    foundCount: found.length,
    kwPct: (kwScore * 100).toFixed(0),
    length: response.text.length,
    hasStructure: hasStructure > 0,
    score: totalScore,
    passed: found.length >= test.minKeywords && response.text.length >= test.minLength,
  };
}

(async () => {
  console.log('\n🎯 Benchmark LLM — Comandante T3MP3ST\n');

  let allModels;
  try {
    allModels = await listModels();
  } catch (e) {
    console.error('❌ Não consegui conectar ao Ollama. Rode `ollama serve` primeiro.');
    process.exit(2);
  }

  const models = modelsFromArg.length ? modelsFromArg : allModels;
  console.log(`Modelos disponíveis: ${allModels.join(', ')}`);
  console.log(`Testando: ${models.join(', ')}\n`);

  const results = {}; // model → { totalScore, testResults: [] }

  for (const model of models) {
    if (!allModels.includes(model)) {
      console.log(`⏭️  ${model} não instalado — pulando`);
      continue;
    }
    console.log(`\n════ ${model} ════`);
    results[model] = { totalScore: 0, totalMs: 0, testResults: [] };
    for (const test of TESTS) {
      process.stdout.write(`  [${test.id}] `);
      let response;
      try {
        response = await askModel(model, SYSTEM_PROMPT_SEC, test.prompt);
      } catch (e) {
        console.log(`❌ erro: ${e.message}`);
        results[model].testResults.push({ test: test.id, error: e.message, score: 0 });
        continue;
      }
      const scored = scoreResponse(response, test);
      results[model].testResults.push({
        test: test.id, ...scored, ms: response.ms, evalCount: response.evalCount,
        preview: response.text.slice(0, 140),
      });
      results[model].totalScore += scored.score;
      results[model].totalMs += response.ms;
      console.log(`score ${scored.score.toFixed(0)}/100 · kw ${scored.foundCount}/${test.keywords.length} · ${response.text.length} chars · ${(response.ms/1000).toFixed(1)}s${scored.passed ? ' ✅' : ''}`);
      console.log(`         ↳ preview: ${response.text.slice(0, 120).replace(/\n/g, ' ')}...`);
    }
    const avg = results[model].totalScore / TESTS.length;
    const avgMs = results[model].totalMs / TESTS.length;
    console.log(`  Total: ${avg.toFixed(1)}/100 · latência média ${(avgMs/1000).toFixed(1)}s`);
  }

  console.log('\n════════ Ranking Final ════════');
  const ranked = Object.entries(results)
    .map(([m, r]) => ({ model: m, avg: r.totalScore / TESTS.length, avgMs: r.totalMs / TESTS.length }))
    .sort((a, b) => b.avg - a.avg);
  ranked.forEach((r, i) => {
    const emoji = ['🥇', '🥈', '🥉'][i] || '  ';
    console.log(`  ${emoji} ${r.model.padEnd(30)} score ${r.avg.toFixed(1)}/100 · ${(r.avgMs/1000).toFixed(1)}s média`);
  });

  const winner = ranked[0];
  if (winner) {
    console.log(`\n🏆 Vencedor: ${winner.model} (score ${winner.avg.toFixed(1)})`);
    console.log(`   Para definir como padrão:`);
    console.log(`   echo 'TEMPEST_LOCAL_MODEL=${winner.model}' >> ~/.t3mp3st/.env`);
  }
})();
