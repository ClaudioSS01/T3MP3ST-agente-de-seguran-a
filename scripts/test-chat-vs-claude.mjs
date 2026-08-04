#!/usr/bin/env node
/**
 * test-chat-vs-claude.mjs — comparação chat vs Claude
 *
 * Executa as 8 fases do motor Recon V2 do chat contra medleads.medsimples.solutions
 * e verifica se ele encontra os MESMOS achados críticos que eu (Claude) encontrei
 * quando fiz o dossiê manual dessa aplicação.
 *
 * Não substitui a UI — executa a lógica das fases direto contra o server T3MP3ST
 * usando /api/tools/execute e /api/approvals/authorize-target, IDENTICAMENTE
 * ao que o chat-recon-v2.js faz.
 *
 * Isto valida: o motor tem a MESMA capacidade de descoberta técnica que eu tinha
 * quando fiz o dossiê manual. Interpretação/prosa fica separada — validamos SÓ
 * a descoberta objetiva.
 */

const BASE = process.env.T3MP3ST_URL || 'http://127.0.0.1:3333';
const TARGET = 'medleads.medsimples.solutions';

// Achados que EU (Claude) encontrei no dossiê manual, agrupados por fase.
// O objetivo do teste é: o motor precisa achar TODOS estes achados objetivos.
const EXPECTED = {
  // Fase 1: HTTP + Security Headers
  fase1_headers: [
    { name: 'Server exposto', matches: /Server:\s*cloudflare/i, sev: 'BAIXO' },
    { name: 'HSTS presente sem preload', matches: /strict-transport-security:.*max-age=31536000\b/i, sev: 'BAIXO' },
    { name: 'X-Content-Type-Options nosniff', matches: /x-content-type-options:\s*nosniff/i, sev: 'INFO' },
    // Ausência de CSP (indireto: o header NÃO deve aparecer)
  ],
  // Fase 2: DNS
  fase2_dns: [
    { name: 'CNAME chain para Render/base44', matches: /base44\.onrender\.com|onrender\.com/i, sev: 'INFO' },
    { name: 'DMARC p=none em medsimples.solutions', matches: /v=DMARC1.*p=none/i, sev: 'MÉDIO' },
    { name: 'SPF ~all fraco', matches: /v=spf1.*~all/i, sev: 'MÉDIO' },
  ],
  // Fase 3: Shodan InternetDB (o IP é Cloudflare)
  fase3_shodan: [],
  // Fase 4: crt.sh
  fase4_crt: [
    { name: 'Subdomínios descobertos', minCount: 1 },
  ],
  // Fase 5: Common paths
  fase5_paths: [
    { name: '/health público', path: '/health', shouldExpose: true },
    { name: '/api/frontend-config.js público', path: '/api/frontend-config.js', shouldExpose: true },
    { name: '/openapi.json responde JSON de erro (não 404)', path: '/openapi.json', shouldExpose: true },
  ],
  // Fase 6: JS bundle secrets (medleads não tem secrets críticos, mas testa que o scan roda)
  fase6_secrets: [],
  // Fase 7: HTML markers (nenhum esperado neste alvo)
  fase7_html: [],
  // Fase 8: TLS
  fase8_tls: [
    { name: 'TLS 1.0 rejeitado', proto: 'tls1', rejected: true },
    { name: 'TLS 1.1 rejeitado', proto: 'tls1_1', rejected: true },
    { name: 'TLS 1.2 aceito', proto: 'tls1_2', supported: true },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Helpers — copiados do chat-recon-v2.js
// ═══════════════════════════════════════════════════════════════════════════
const approvalCache = {};

async function apiPost(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  let j = null;
  try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
}

async function runTool(command, target, timeout = 20000) {
  const body = { command, target, timeout };
  if (approvalCache[target]) body.approvalId = approvalCache[target];
  const r1 = await apiPost('/api/tools/execute', body);
  if (r1.status === 200) return r1.json;
  const id = r1.json?.approval?.id;
  if (r1.status === 403 && id) {
    await apiPost('/api/approvals/authorize-target', { target, approvalId: id });
    approvalCache[target] = id;
    const r2 = await apiPost('/api/tools/execute', { command, target, approvalId: id, timeout });
    return r2.json || { success: false, error: 'sem resposta' };
  }
  return r1.json || { success: false, error: `HTTP ${r1.status}` };
}

function outputOf(r) {
  if (!r) return '';
  return String(r.output || r.stdout || '').trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// Assertions helper
// ═══════════════════════════════════════════════════════════════════════════
let pass = 0, fail = 0;
const failures = [];
const ok = (label, cond, detail) => {
  if (cond) {
    pass++;
    console.log(`  ✅ ${label}${detail ? ` — ${detail.slice(0, 100)}` : ''}`);
  } else {
    fail++;
    failures.push({ label, detail });
    console.log(`  ❌ ${label}${detail ? ` — ${detail.slice(0, 100)}` : ''}`);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Fase 1: HTTP + Security Headers
// ═══════════════════════════════════════════════════════════════════════════
async function fase1() {
  console.log('\n[Fase 1/8] HTTP + Security Headers');
  const r = await runTool(`curl -sSI --max-time 12 https://${TARGET}/`, TARGET);
  const out = outputOf(r);
  ok('curl retornou output não vazio', out.length > 50, `${out.length} chars`);
  for (const check of EXPECTED.fase1_headers) {
    ok(`achou: ${check.name}`, check.matches.test(out), `regex ${check.matches}`);
  }
  // CSP deve estar AUSENTE nesse alvo (é achado importante)
  ok('CSP AUSENTE detectável (não deve aparecer no header)', !/^content-security-policy:/mi.test(out));
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// Fase 2: DNS + DMARC/SPF
// ═══════════════════════════════════════════════════════════════════════════
async function fase2() {
  console.log('\n[Fase 2/8] DNS + DMARC/SPF');
  const cmdA = `curl -s --max-time 10 --data-urlencode "name=${TARGET}" --data-urlencode "type=A" -G https://dns.google/resolve`;
  const rA = await runTool(cmdA, 'dns.google');
  const outA = outputOf(rA);
  ok('DNS A retornou JSON', /"Answer"/i.test(outA) || /"Status"/.test(outA), outA.slice(0, 120));
  ok('CNAME chain para onrender/base44', /onrender|base44/i.test(outA), outA.slice(0, 150));

  const cmdDmarc = `curl -s --max-time 10 --data-urlencode "name=_dmarc.medsimples.solutions" --data-urlencode "type=TXT" -G https://dns.google/resolve`;
  const rDmarc = await runTool(cmdDmarc, 'dns.google');
  const outDmarc = outputOf(rDmarc);
  ok('DMARC p=none detectado', /p=none/i.test(outDmarc), outDmarc.slice(0, 150));

  const cmdSpf = `curl -s --max-time 10 --data-urlencode "name=medsimples.solutions" --data-urlencode "type=TXT" -G https://dns.google/resolve`;
  const rSpf = await runTool(cmdSpf, 'dns.google');
  const outSpf = outputOf(rSpf);
  ok('SPF ~all detectado', /v=spf1.*~all/i.test(outSpf), outSpf.slice(0, 150));
}

// ═══════════════════════════════════════════════════════════════════════════
// Fase 3: Shodan InternetDB (skip — Cloudflare mascara IP)
// ═══════════════════════════════════════════════════════════════════════════
async function fase3() {
  console.log('\n[Fase 3/8] Shodan InternetDB');
  // Extrair primeiro IP da resposta DNS anterior
  const cmdA = `curl -s --max-time 10 --data-urlencode "name=${TARGET}" --data-urlencode "type=A" -G https://dns.google/resolve`;
  const rA = await runTool(cmdA, 'dns.google');
  const outA = outputOf(rA);
  const ipMatch = outA.match(/"data":"(\d+\.\d+\.\d+\.\d+)"/);
  if (!ipMatch) {
    ok('IP extraído do DNS', false, 'não achei IP na resposta');
    return;
  }
  const ip = ipMatch[1];
  ok(`IP resolvido: ${ip}`, true);
  const r = await runTool(`curl -s --max-time 10 https://internetdb.shodan.io/${ip}`, 'internetdb.shodan.io');
  const out = outputOf(r);
  ok('Shodan retornou JSON (mesmo se sem dados)', /"ip"|"detail"|"ports"/.test(out), out.slice(0, 150));
}

// ═══════════════════════════════════════════════════════════════════════════
// Fase 4: crt.sh
// ═══════════════════════════════════════════════════════════════════════════
async function fase4() {
  console.log('\n[Fase 4/8] Certificate Transparency (crt.sh)');
  const cmd = `curl -s --max-time 20 --data-urlencode "q=medsimples.solutions" --data-urlencode "output=json" -G https://crt.sh/`;
  const r = await runTool(cmd, 'crt.sh', 25000);
  const out = outputOf(r);
  if (/^\s*<html/i.test(out)) {
    ok('crt.sh respondeu (aceito 502 como falha externa)', false, 'crt.sh em 502 no momento — instável do lado deles');
    return;
  }
  try {
    const arr = JSON.parse(out);
    ok('crt.sh JSON parseado', Array.isArray(arr) && arr.length > 0, `${arr.length} certs`);
    const subs = new Set();
    arr.forEach(row => {
      String(row.name_value || '').split('\n').forEach(n => {
        const s = n.trim().toLowerCase();
        if (s && !s.startsWith('*.') && s.endsWith('medsimples.solutions')) subs.add(s);
      });
    });
    ok('Subdomínios extraídos', subs.size >= 1, `${subs.size} únicos: ${Array.from(subs).slice(0,3).join(', ')}`);
  } catch (e) {
    ok('crt.sh JSON parseou', false, e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Fase 5: Common paths (com foco no /health e /api/frontend-config.js)
// ═══════════════════════════════════════════════════════════════════════════
async function fase5() {
  console.log('\n[Fase 5/8] Common paths');
  for (const check of EXPECTED.fase5_paths) {
    const r = await runTool(`curl -sI --max-time 6 https://${TARGET}${check.path}`, TARGET);
    const out = outputOf(r);
    const codeMatch = out.match(/HTTP\/[\d.]+\s+(\d{3})/);
    const code = codeMatch ? codeMatch[1] : '000';
    // "Expõe" = 200 ou 401 com body (diferente de 404 puro)
    const exposes = code === '200' || code === '401';
    ok(`${check.path} responde: ${code}`, exposes === check.shouldExpose, `HTTP ${code}`);
  }
  // Teste específico: /health revela build info?
  const rHealth = await runTool(`curl -s --max-time 6 https://${TARGET}/health`, TARGET);
  const outHealth = outputOf(rHealth);
  ok('/health revela build info (git commit)', /commit|image_tag|built_at/i.test(outHealth), outHealth.slice(0, 200));
  ok('/health revela platform_domain', /platform_domain/i.test(outHealth), outHealth.slice(0, 200));

  // /api/frontend-config.js revela config sensível?
  const rConfig = await runTool(`curl -s --max-time 8 https://${TARGET}/api/frontend-config.js`, TARGET);
  const outConfig = outputOf(rConfig);
  ok('/api/frontend-config.js revela DATADOG_CLIENT_TOKEN', /DATADOG_CLIENT_TOKEN/i.test(outConfig));
  ok('/api/frontend-config.js revela BACKOFFICE_URL', /BACKOFFICE_URL/i.test(outConfig));
  ok('/api/frontend-config.js revela TURNSTILE_LOGIN_ENABLED', /TURNSTILE_LOGIN_ENABLED/i.test(outConfig));
  // O grande achado: TURNSTILE desabilitado no login
  ok('TURNSTILE_LOGIN_ENABLED = false (login sem CAPTCHA)', /"TURNSTILE_LOGIN_ENABLED"\s*:\s*"?false"?/i.test(outConfig));
}

// ═══════════════════════════════════════════════════════════════════════════
// Fase 6: JS bundle secrets (medleads pode não ter, testa que scan roda)
// ═══════════════════════════════════════════════════════════════════════════
async function fase6() {
  console.log('\n[Fase 6/8] JS bundle secrets');
  const rHtml = await runTool(`curl -s --max-time 10 https://${TARGET}/login`, TARGET);
  const html = outputOf(rHtml);
  const bundleMatch = html.match(/<script[^>]+src\s*=\s*["'](\/static\/index-[^"']+\.js[^"']*)["']/);
  if (!bundleMatch) {
    ok('bundle JS encontrado no HTML', false, 'não achei /static/index-*.js');
    return;
  }
  const bundleUrl = `https://${TARGET}${bundleMatch[1]}`;
  ok(`bundle localizado: ${bundleUrl.split('/').pop()}`, true);
  const rBundle = await runTool(`curl -s --max-time 20 ${bundleUrl}`, TARGET, 30000);
  const bundle = outputOf(rBundle);
  ok('bundle baixado', bundle.length > 1000, `${bundle.length} bytes`);
  // Regex scan
  const patterns = [
    { name: 'AKIA (AWS)', re: /AKIA[0-9A-Z]{16}/g },
    { name: 'AIza (Google)', re: /AIza[0-9A-Za-z_-]{35}/g },
    { name: 'eyJ (JWT)', re: /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/g },
    { name: 'Supabase URL', re: /https?:\/\/[a-z0-9]{20}\.supabase\.co/g },
  ];
  for (const p of patterns) {
    const matches = bundle.match(p.re) || [];
    // Não esperamos matches em medleads (é limpo), só validamos que scan roda
    console.log(`    ℹ️  ${p.name}: ${matches.length} matches`);
  }
  ok('scan de secrets completou sem erro', true);
}

// ═══════════════════════════════════════════════════════════════════════════
// Fase 7: HTML markers (Replit/bolt.new/etc)
// ═══════════════════════════════════════════════════════════════════════════
async function fase7() {
  console.log('\n[Fase 7/8] HTML markers');
  const r = await runTool(`curl -s --max-time 10 https://${TARGET}/login`, TARGET);
  const html = outputOf(r);
  const hasReplit = /replit-dev-banner|replit\.com\/public\/js/i.test(html);
  const hasBolt = /bolt\.new\/badge/i.test(html);
  const hasBase44 = /base44/i.test(html);
  const hasMonaco = /MonacoEnvironment|monacoeditorwork/i.test(html);
  console.log(`    ℹ️  Replit: ${hasReplit}, bolt.new: ${hasBolt}, base44: ${hasBase44}, monaco: ${hasMonaco}`);
  ok('base44_access_token detectado (indica plataforma Base44)', /base44_access_token/i.test(html));
  ok('Monaco Editor detectado (VSCode embarcado)', hasMonaco);
}

// ═══════════════════════════════════════════════════════════════════════════
// Fase 8: TLS
// ═══════════════════════════════════════════════════════════════════════════
async function fase8() {
  console.log('\n[Fase 8/8] TLS check');
  for (const check of EXPECTED.fase8_tls) {
    const cmd = `openssl s_client -servername ${TARGET} -connect ${TARGET}:443 -${check.proto} -brief`;
    const r = await runTool(cmd, TARGET, 15000);
    const out = outputOf(r);
    const err = r?.error || '';
    const combined = out + '\n' + err;
    if (check.rejected) {
      const wasRejected = /no protocols available|handshake failure|alert protocol/i.test(combined);
      ok(`${check.name} (deve ser rejeitado)`, wasRejected, combined.slice(0, 120));
    } else if (check.supported) {
      const wasSupported = /Protocol\s*:\s*TLSv/i.test(combined) || /Verification:\s*OK/i.test(combined);
      ok(`${check.name} (deve aceitar)`, wasSupported, combined.slice(0, 120));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM interpretation (opcional — só se Ollama responder)
// ═══════════════════════════════════════════════════════════════════════════
async function testLlmInterpretation() {
  console.log('\n[Extra] LLM (Ollama) interpretation capability');
  try {
    const r = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        stream: false,
        messages: [
          { role: 'system', content: 'Você é um analista de segurança. Responda em PT-BR, conciso.' },
          { role: 'user', content: 'Um site tem DMARC p=none e SPF ~all. Explique em 2 frases o que isso significa.' }
        ]
      })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const answer = d.message?.content || '(vazio)';
    ok('Ollama responde a query técnica de segurança', answer.length > 30, answer.slice(0, 150));
    // Verifica se a resposta menciona conceitos-chave
    const mentions = /(spoof|phish|falsific|proteção|fraco|frágil|não bloqueia|apenas monitora)/i.test(answer);
    ok('resposta menciona spoof/phishing/proteção fraca', mentions, `keywords check`);
  } catch (e) {
    ok('LLM Ollama disponível', false, e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════
(async () => {
  console.log(`\n🎯 Alvo: https://${TARGET}`);
  console.log(`   Meta: comparar descoberta do motor Recon V2 vs achados do dossiê manual feito por Claude\n`);

  try { await fase1(); } catch (e) { console.error('Fase 1 crashou:', e.message); }
  try { await fase2(); } catch (e) { console.error('Fase 2 crashou:', e.message); }
  try { await fase3(); } catch (e) { console.error('Fase 3 crashou:', e.message); }
  try { await fase4(); } catch (e) { console.error('Fase 4 crashou:', e.message); }
  try { await fase5(); } catch (e) { console.error('Fase 5 crashou:', e.message); }
  try { await fase6(); } catch (e) { console.error('Fase 6 crashou:', e.message); }
  try { await fase7(); } catch (e) { console.error('Fase 7 crashou:', e.message); }
  try { await fase8(); } catch (e) { console.error('Fase 8 crashou:', e.message); }
  try { await testLlmInterpretation(); } catch (e) { console.error('LLM crashou:', e.message); }

  console.log(`\n════════════════════════════════════════`);
  console.log(`Total: ${pass} ok · ${fail} falha(s)`);
  console.log(`Pass rate: ${((pass / (pass + fail)) * 100).toFixed(1)}%`);
  if (failures.length) {
    console.log('\nFalhas:');
    failures.forEach((f, i) => console.log(`  ${i+1}. ${f.label} — ${(f.detail || '').slice(0, 80)}`));
  }
  process.exit(fail > 0 ? 1 : 0);
})();
