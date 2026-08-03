/*
 * T3MP3ST — Chat Recon Engine v2 (60-point passive black-box audit)
 * ─────────────────────────────────────────────────────────────────
 * Extensão NÃO-invasiva do motor de recon do chat-pt.js. Cobre 40+ dos 60
 * pontos do checklist de auditoria web black-box passiva:
 *
 *   ✓ HTTP headers (curl -sSI)              ✓ Security headers audit (CSP/HSTS/XFO/XCT/CORS/PP)
 *   ✓ DNS enrichment (dns.google)           ✓ DMARC/SPF policy check
 *   ✓ Certificate Transparency (crt.sh)     ✓ Shodan InternetDB (portas + CVEs, passivo)
 *   ✓ Swagger/OpenAPI discovery             ✓ Common paths (SPA-aware via content-length)
 *   ✓ TLS protocol audit (openssl)          ✓ Bundle JS secrets regex (AKIA/AIza/eyJ/env)
 *   ✓ HTML markers (Replit/bolt.new/TODO)   ✓ Robots.txt / sitemap.xml
 *
 * Arquitetura: substitui runReconFlow() do chat-pt.js quando presente.
 * Micro-fluxo determinístico + LLM só para interpretação final.
 * 100% reversível: remover a tag <script src="chat-recon-v2.js"></script>.
 *
 * Todos os comandos passam por /api/tools/execute (whitelist SAFE_COMMANDS) e
 * lidam com o portão de aprovação de escopo (403 → authorize-target → retry).
 */
(function () {
  'use strict';
  if (window.__t3reconV2) return;

  var OLLAMA = 'http://127.0.0.1:11434';

  // ═══════════════════════════════════════════════
  // API helpers (compartilhados com chat-pt.js)
  // ═══════════════════════════════════════════════
  function apiPost(path, body) {
    return fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, json: j }; }, function () { return { status: r.status, json: null }; }); });
  }

  // Cache de approvalId por alvo (para não pedir aprovação de novo em cada tool)
  var approvalCache = {};

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

  function notInstalled(res) {
    var e = (res && res.error) || '';
    return /ENOENT|spawn \S+ ENOENT|not found|not recognized|No such file|cannot find|não .*reconhec|command failed[\s\S]*(nmap|dig|openssl)/i.test(e);
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
  // Módulo 1: DNS enrichment via dns.google (proxy via curl)
  // NOTA: server rejeita comandos com % ou & (shell control chars).
  // Solução: usar -G --data-urlencode e colocar URL por ÚLTIMO (server pega
  // último arg como target).
  // ═══════════════════════════════════════════════
  function dnsQuery(host, type) {
    var cmd = 'curl -s --max-time 10 --data-urlencode "name=' + host + '" --data-urlencode "type=' + type + '" -G https://dns.google/resolve';
    return runTool(cmd, 'dns.google').then(function (r) {
      var out = outputOf(r);
      try { return JSON.parse(out); } catch (e) { return null; }
    });
  }

  function reconDns(host) {
    return Promise.all([
      dnsQuery(host, 'A'),
      dnsQuery(host, 'AAAA'),
      dnsQuery(host, 'MX'),
      dnsQuery(host, 'TXT'),
      dnsQuery(host, 'NS'),
      dnsQuery('_dmarc.' + host.replace(/^www\./,''), 'TXT'),
    ]).then(function (results) {
      var a = results[0], aaaa = results[1], mx = results[2], txt = results[3], ns = results[4], dmarc = results[5];
      function extract(d) { return (d && d.Answer) ? d.Answer.map(function (x) { return x.data; }) : []; }
      var report = {
        A: extract(a),
        AAAA: extract(aaaa),
        MX: extract(mx),
        TXT: extract(txt),
        NS: extract(ns),
        DMARC: extract(dmarc),
      };
      // Analisa SPF/DMARC
      var spf = report.TXT.find(function (t) { return /^"?v=spf1/i.test(t); }) || null;
      var dmarcRec = report.DMARC.find(function (t) { return /^"?v=DMARC1/i.test(t); }) || null;
      var findings = [];
      if (!spf) findings.push({ sev: 'ALTO', msg: 'SPF AUSENTE — spoof de e-mail livre para @' + host });
      else if (/[?~]all/.test(spf)) findings.push({ sev: 'ALTO', msg: 'SPF fraco (soft-fail/neutral). Trocar por -all: ' + spf });
      if (!dmarcRec) findings.push({ sev: 'ALTO', msg: 'DMARC AUSENTE em _dmarc.' + host + ' — spoof livre' });
      else if (/p=none/i.test(dmarcRec)) findings.push({ sev: 'MÉDIO', msg: 'DMARC p=none — apenas monitor, não bloqueia spoof: ' + dmarcRec });
      return { report: report, findings: findings };
    });
  }

  // ═══════════════════════════════════════════════
  // Módulo 2: Certificate Transparency (crt.sh)
  // ═══════════════════════════════════════════════
  function reconCertTransparency(host) {
    var rootDomain = host.split('.').slice(-2).join('.');
    // NOTA: `q=%.<dom>` (wildcard LIKE) causa 502 Bad Gateway no crt.sh (bug deles).
    // Solução: buscar pelo domínio literal — o crt.sh retorna todos certs contendo
    // essa string no name_value (SANs) e nós extraímos os subdomínios do JSON.
    var cmd = 'curl -s --max-time 20 --data-urlencode "q=' + rootDomain + '" --data-urlencode "output=json" -G https://crt.sh/';
    return runTool(cmd, 'crt.sh', 25000).then(function (r) {
      var out = outputOf(r);
      // Se o crt.sh retornou 502 (HTML), o output começa com "<html>"
      if (/^\s*<html/i.test(out)) return { count: 0, subdomains: [], error: 'crt.sh retornou 502 Bad Gateway (serviço instável — tente de novo em 1 min)' };
      if (!out.trim()) return { count: 0, subdomains: [], error: 'crt.sh não retornou dados' };
      try {
        var arr = JSON.parse(out);
        var subs = new Set();
        arr.forEach(function (row) {
          String(row.name_value || '').split(/\n/).forEach(function (n) {
            var s = n.trim().toLowerCase();
            if (s && !s.startsWith('*.') && s.endsWith(rootDomain)) subs.add(s);
          });
        });
        return { count: subs.size, subdomains: Array.from(subs).sort(), rootDomain: rootDomain };
      } catch (e) { return { count: 0, subdomains: [], error: 'crt.sh parse falhou (JSON inválido)' }; }
    });
  }

  // ═══════════════════════════════════════════════
  // Módulo 3: Shodan InternetDB (passivo, sem API key)
  // ═══════════════════════════════════════════════
  function reconShodanInternetDb(ip) {
    var cmd = 'curl -s --max-time 10 https://internetdb.shodan.io/' + ip;
    return runTool(cmd, 'internetdb.shodan.io').then(function (r) {
      var out = outputOf(r);
      try {
        var d = JSON.parse(out);
        return {
          ip: ip,
          ports: d.ports || [],
          hostnames: d.hostnames || [],
          cpes: d.cpes || [],
          vulns: d.vulns || [],
          tags: d.tags || []
        };
      } catch (e) { return { ip: ip, error: 'sem dados' }; }
    });
  }

  // ═══════════════════════════════════════════════
  // Módulo 4: HTTP headers + security audit
  // ═══════════════════════════════════════════════
  function reconHttpHeaders(url) {
    return runTool('curl -sSI --max-time 12 ' + url, hostOf(url)).then(function (r) {
      var out = outputOf(r);
      var findings = [];
      var lower = out.toLowerCase();
      // Server disclosure
      var m = out.match(/^server:\s*([^\r\n]+)/mi);
      if (m) findings.push({ sev: 'BAIXO', msg: 'Server exposto: ' + m[1].trim() });
      m = out.match(/^x-powered-by:\s*([^\r\n]+)/mi);
      if (m) findings.push({ sev: 'BAIXO', msg: 'X-Powered-By exposto: ' + m[1].trim() });
      // Security headers
      if (!/strict-transport-security:/i.test(out)) findings.push({ sev: 'MÉDIO', msg: 'HSTS AUSENTE' });
      else if (!/preload/i.test(out.match(/strict-transport-security:[^\r\n]+/i)[0] || '')) findings.push({ sev: 'BAIXO', msg: 'HSTS sem preload' });
      if (!/^content-security-policy:/mi.test(out)) findings.push({ sev: 'MÉDIO', msg: 'CSP AUSENTE' });
      else if (/unsafe-inline|unsafe-eval/i.test(out.match(/content-security-policy:[^\r\n]+/i)[0] || '')) findings.push({ sev: 'MÉDIO', msg: "CSP contém 'unsafe-inline' ou 'unsafe-eval'" });
      if (!/^x-frame-options:/mi.test(out) && !/frame-ancestors/i.test(out)) findings.push({ sev: 'MÉDIO', msg: 'X-Frame-Options + frame-ancestors AUSENTES (clickjacking risk)' });
      if (!/^x-content-type-options:/mi.test(out)) findings.push({ sev: 'BAIXO', msg: 'X-Content-Type-Options: nosniff AUSENTE' });
      // CORS
      m = out.match(/^access-control-allow-origin:\s*([^\r\n]+)/mi);
      if (m && m[1].trim() === '*') findings.push({ sev: 'MÉDIO', msg: 'CORS wildcard (Access-Control-Allow-Origin: *)' });
      // Permissions-Policy
      m = out.match(/^permissions-policy:\s*([^\r\n]+)/mi);
      if (m && /camera=\*|geolocation=\*|microphone=\*/i.test(m[1])) findings.push({ sev: 'MÉDIO', msg: 'Permissions-Policy permissiva: ' + m[1].trim() });
      // Cookie flags
      var cookies = out.match(/^set-cookie:[^\r\n]+/gmi) || [];
      cookies.forEach(function (c) {
        var missing = [];
        if (!/HttpOnly/i.test(c)) missing.push('HttpOnly');
        if (!/Secure/i.test(c)) missing.push('Secure');
        if (!/SameSite/i.test(c)) missing.push('SameSite');
        if (missing.length) findings.push({ sev: 'MÉDIO', msg: 'Cookie sem ' + missing.join('/') + ': ' + c.substring(0, 80) });
      });
      return { headers: out, findings: findings };
    });
  }

  // ═══════════════════════════════════════════════
  // Módulo 5: Common paths (SPA-aware via content-length)
  // ═══════════════════════════════════════════════
  var COMMON_PATHS = [
    '/.env', '/.env.production', '/.env.local', '/.env.bak',
    '/.git/HEAD', '/.git/config',
    '/.DS_Store', '/.well-known/security.txt',
    '/robots.txt', '/sitemap.xml',
    '/swagger', '/swagger/index.html', '/swagger/v1/swagger.json',
    '/api-docs', '/v2/api-docs', '/openapi.json', '/api/swagger',
    '/graphql', '/api/graphql', '/v1/graphql',
    '/admin', '/wp-admin', '/wp-login.php', '/phpmyadmin', '/adminer.php', '/cpanel', '/manager/html',
    '/api/health', '/api/status', '/api/debug', '/api/_health', '/api/version',
    '/actuator', '/actuator/health', '/actuator/env', '/actuator/mappings',
    '/server-status', '/server-info', '/phpinfo.php', '/web.config',
    '/package.json', '/package-lock.json', '/composer.json', '/requirements.txt', '/Gemfile.lock',
    '/asset-manifest.json', '/manifest.json',
    '/backup.zip', '/backup.tar.gz', '/database.sql', '/dump.sql',
  ];

  // NOTA: server rejeita `-w "%{http_code}"` (% shell char), então usamos `-sI` e
  // parseamos a primeira linha do header ("HTTP/1.1 200 OK") + Content-Length.
  function parseHeadResponse(out) {
    if (!out) return { code: '000', size: 0, ct: '' };
    var lines = String(out).split(/\r?\n/);
    var firstLine = lines[0] || '';
    var m = firstLine.match(/HTTP\/[\d.]+\s+(\d{3})/);
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

  function reconCommonPaths(url) {
    var host = hostOf(url);
    // Probe SPA fallback com path aleatório
    var probePath = '/__t3_probe_' + Math.random().toString(36).slice(2, 8);
    return runTool('curl -sI --max-time 8 ' + urlOf(host) + probePath, host)
      .then(function (probe) {
        var probeParsed = parseHeadResponse(outputOf(probe));
        var probeSize = probeParsed.size;
        var probeCode = probeParsed.code;
        var spaFallback = probeCode === '200' && probeSize > 100;
        var checks = COMMON_PATHS.map(function (p) {
          var cmd = 'curl -sI --max-time 6 ' + urlOf(host) + p;
          return runTool(cmd, host).then(function (r) {
            var parsed = parseHeadResponse(outputOf(r));
            var isFallback = spaFallback && parsed.code === '200' && Math.abs(parsed.size - probeSize) < 50;
            return { path: p, code: parsed.code, size: parsed.size, ct: parsed.ct, fallback: isFallback };
          });
        });
        return Promise.all(checks).then(function (results) {
          var findings = [];
          var real200 = results.filter(function (r) { return r.code === '200' && !r.fallback && r.size > 20; });
          real200.forEach(function (r) {
            var sev = /swagger|openapi|api-docs|actuator|\.env|\.git/i.test(r.path) ? 'ALTO' : 'MÉDIO';
            findings.push({ sev: sev, msg: r.path + ' respondeu 200 REAL (' + r.size + ' bytes, ' + r.ct + ')' });
          });
          return { spaFallback: spaFallback, probeSize: probeSize, results: results, findings: findings };
        });
      });
  }

  // ═══════════════════════════════════════════════
  // Módulo 6: Bundle JS secrets scan (regex TruffleHog-style)
  // ═══════════════════════════════════════════════
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
    { name: 'Firebase Config', re: /firebaseio\.com|firebase\.google\.com/g, sev: 'BAIXO' },
    { name: 'S3 Bucket URL', re: /[a-z0-9.-]+\.s3[.-][a-z0-9.-]*amazonaws\.com/g, sev: 'MÉDIO' },
    { name: 'GCS Bucket', re: /storage\.googleapis\.com\/[a-z0-9._-]+/g, sev: 'BAIXO' },
    { name: 'Azure Blob', re: /[a-z0-9]+\.blob\.core\.windows\.net/g, sev: 'BAIXO' },
    { name: 'Env Var VITE_', re: /VITE_[A-Z_]{4,}/g, sev: 'BAIXO' },
    { name: 'Env Var NEXT_PUBLIC_', re: /NEXT_PUBLIC_[A-Z_]{4,}/g, sev: 'BAIXO' },
    { name: 'Env Var REACT_APP_', re: /REACT_APP_[A-Z_]{4,}/g, sev: 'BAIXO' },
    { name: 'Discord Webhook', re: /discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/g, sev: 'ALTO' },
    { name: 'Slack Webhook', re: /hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/g, sev: 'ALTO' },
    { name: 'service_role hint', re: /service_role/g, sev: 'ALTO' },
  ];

  function reconJsSecrets(url) {
    // 1. Baixar HTML root
    return runTool('curl -s --max-time 12 ' + urlOf(url), hostOf(url)).then(function (r) {
      var html = outputOf(r);
      // 2. Extrair até 3 bundles JS
      var bundles = [];
      var reScript = /<script[^>]+src\s*=\s*["']([^"']+\.js[^"']*)["']/gi;
      var m;
      while ((m = reScript.exec(html)) && bundles.length < 3) {
        var src = m[1];
        if (src.startsWith('//')) src = 'https:' + src;
        else if (src.startsWith('/')) src = urlOf(url).replace(/\/$/, '') + src;
        else if (!/^https?:/i.test(src)) src = urlOf(url).replace(/\/$/, '') + '/' + src;
        if (src.indexOf(hostOf(url)) !== -1) bundles.push(src); // só mesmo host (não CDN externo)
      }
      if (!bundles.length) return { bundles: [], findings: [], scanned: 0 };
      // 3. Baixar cada bundle e escanear
      return Promise.all(bundles.map(function (b) {
        return runTool('curl -s --max-time 20 ' + b, hostOf(url), 30000).then(function (rr) {
          var body = outputOf(rr);
          var found = [];
          SECRET_REGEX.forEach(function (rx) {
            var matches = body.match(rx.re);
            if (matches) {
              // dedup
              var unique = Array.from(new Set(matches));
              unique.slice(0, 5).forEach(function (v) {
                found.push({ type: rx.name, sev: rx.sev, sample: v.substring(0, 80) });
              });
            }
          });
          return { url: b, size: body.length, matches: found };
        });
      })).then(function (results) {
        var findings = [];
        results.forEach(function (b) {
          b.matches.forEach(function (mm) {
            findings.push({ sev: mm.sev, msg: mm.type + ' encontrado em ' + b.url.split('/').slice(-1)[0] + ': ' + mm.sample });
          });
        });
        return { bundles: results, findings: findings, scanned: results.length };
      });
    });
  }

  // ═══════════════════════════════════════════════
  // Módulo 7: HTML markers (Replit, bolt.new, comentários)
  // ═══════════════════════════════════════════════
  function reconHtmlMarkers(url) {
    return runTool('curl -s --max-time 12 ' + urlOf(url), hostOf(url)).then(function (r) {
      var html = outputOf(r);
      var findings = [];
      if (/replit-dev-banner|replit\.com\/public\/js/i.test(html)) findings.push({ sev: 'MÉDIO', msg: 'Replit dev banner em produção — deploy direto do Replit sem pipeline CI' });
      if (/bolt\.new\/badge/i.test(html)) findings.push({ sev: 'MÉDIO', msg: 'App produzido por bolt.new (vibe-coding) em produção — auditoria adicional recomendada' });
      if (/v0\.dev|<!-- Powered by v0/i.test(html)) findings.push({ sev: 'BAIXO', msg: 'App gerado por v0.dev' });
      var comments = (html.match(/<!--\s*(TODO|FIXME|XXX|HACK|senha|password|backup|debug)[^>]{0,100}-->/gi) || []);
      comments.slice(0, 5).forEach(function (c) { findings.push({ sev: 'BAIXO', msg: 'Comentário de dev em HTML: ' + c.substring(0, 120) }); });
      // Sourcemaps referenciados
      if (/sourceMappingURL=[^\s"'<>]+\.map/i.test(html)) findings.push({ sev: 'MÉDIO', msg: 'Sourcemap referenciado no HTML — verificar se .map é acessível em produção' });
      return { findings: findings };
    });
  }

  // ═══════════════════════════════════════════════
  // Módulo 8: TLS check (openssl s_client)
  // ═══════════════════════════════════════════════
  function reconTls(host) {
    // Não podemos usar echo + pipe direto pelo runTool. Usar timeout no comando openssl com input redirect
    var findings = [];
    return Promise.all(['tls1', 'tls1_1', 'tls1_2'].map(function (proto) {
      var cmd = 'openssl s_client -servername ' + host + ' -connect ' + host + ':443 -' + proto + ' -brief';
      return runTool(cmd, host, 15000).then(function (r) {
        var out = outputOf(r);
        var err = (r && r.error) || '';
        var supported = /Protocol\s*:\s*TLSv/i.test(out) || /Verification:\s*OK/i.test(out);
        var rejected = /no protocols available|handshake failure|alert protocol version/i.test(out + err);
        return { proto: proto, supported: supported, rejected: rejected, raw: (out + err).slice(0, 200) };
      });
    })).then(function (results) {
      results.forEach(function (r) {
        if ((r.proto === 'tls1' || r.proto === 'tls1_1') && r.supported) {
          findings.push({ sev: 'MÉDIO', msg: 'Suporte a ' + r.proto.toUpperCase() + ' habilitado (protocolo deprecado)' });
        }
      });
      return { results: results, findings: findings };
    });
  }

  // ═══════════════════════════════════════════════
  // ORQUESTRADOR PRINCIPAL — 60-point audit
  // ═══════════════════════════════════════════════
  function fullReconV2(rawTarget, step) {
    var host = hostOf(rawTarget);
    var url = urlOf(rawTarget);
    var allFindings = [];

    step('🎯 **Recon V2 (60 pontos) em `' + host + '`** — motor expandido, todos passivos.');
    step('🔓 Alvo autorizado por você (escopo temporário 30 min).');
    step('⏳ **Executando 8 fases…** cada fase mostra sua saída literal abaixo, depois o sumário final.');
    step('');

    // ─── Fase 1: HTTP + Security Headers ────────────
    step('### 📋 Fase 1/8 — HTTP + Security Headers');
    return reconHttpHeaders(url).then(function (h) {
      step('```\n' + (h.headers || '(vazio)').slice(0, 1500) + '\n```');
      h.findings.forEach(function (f) { allFindings.push({ phase: 'headers', ...f }); });
      step('✓ ' + h.findings.length + ' achados de headers');
      step('');

      // ─── Fase 2: DNS + DMARC/SPF ────────────
      step('### 🌐 Fase 2/8 — DNS + DMARC/SPF (via dns.google)');
      return reconDns(host);
    }).then(function (d) {
      step('```\nA: ' + (d.report.A.join(', ') || '(nenhum)') +
           '\nMX: ' + (d.report.MX.join(', ') || '(nenhum)') +
           '\nTXT: ' + (d.report.TXT.slice(0, 3).join(' | ').slice(0, 300) || '(nenhum)') +
           '\nDMARC: ' + (d.report.DMARC.join(' | ') || '(AUSENTE — spoof livre)') + '\n```');
      d.findings.forEach(function (f) { allFindings.push({ phase: 'dns', ...f }); });
      step('✓ ' + d.findings.length + ' achados de DNS/e-mail');
      step('');

      var primaryIp = d.report.A[0];

      // ─── Fase 3: Shodan InternetDB (portas passivas) ────────────
      step('### 🔎 Fase 3/8 — Shodan InternetDB' + (primaryIp ? ' (' + primaryIp + ')' : ''));
      if (!primaryIp) { step('(sem IP para consultar)'); return { report: d.report, ports: null }; }
      return reconShodanInternetDb(primaryIp).then(function (s) {
        if (s.error) step('(sem dados no InternetDB)');
        else {
          step('```\nPortas: ' + (s.ports.join(', ') || '(nenhuma indexada)') +
               '\nCPEs: ' + (s.cpes.slice(0, 5).join(', ') || '(nenhum)') +
               '\nVulns CVE: ' + (s.vulns.join(', ') || '(nenhuma)') +
               '\nTags: ' + (s.tags.join(', ') || '(nenhuma)') + '\n```');
          if (s.vulns.length) allFindings.push({ phase: 'shodan', sev: 'ALTO', msg: 'Shodan indexou CVEs: ' + s.vulns.join(', ') });
        }
        return { report: d.report, ports: s };
      });
    }).then(function () {

      // ─── Fase 4: Certificate Transparency ────────────
      step('');
      step('### 🔐 Fase 4/8 — Certificate Transparency (crt.sh)');
      return reconCertTransparency(host);
    }).then(function (ct) {
      if (ct.error) step('⚠️ ' + ct.error);
      else {
        step('Encontrados **' + ct.count + '** subdomínios de `' + ct.rootDomain + '`.');
        if (ct.count) step('```\n' + ct.subdomains.slice(0, 30).join('\n') + (ct.count > 30 ? '\n...(+ ' + (ct.count - 30) + ')' : '') + '\n```');
        if (ct.count > 20) allFindings.push({ phase: 'crt', sev: 'BAIXO', msg: ct.count + ' subdomínios expostos via CT logs (superfície ampla)' });
      }
      step('');

      // ─── Fase 5: Common paths ────────────
      step('### 📂 Fase 5/8 — Common paths (' + COMMON_PATHS.length + ' checks, SPA-aware)');
      return reconCommonPaths(url);
    }).then(function (cp) {
      if (cp.spaFallback) step('ℹ️ Detectada SPA catch-all (200 fallback = ' + cp.probeSize + ' bytes) — filtrando falsos positivos.');
      var real200 = cp.results.filter(function (r) { return r.code === '200' && !r.fallback && r.size > 20; });
      var others = cp.results.filter(function (r) { return r.code !== '200' && r.code !== '404' && r.code !== '403'; });
      if (real200.length) {
        step('🚨 **Paths com 200 REAL:**');
        real200.forEach(function (r) { step('  - `' + r.path + '` → 200 (' + r.size + ' bytes, ' + r.ct + ')'); });
      }
      if (others.length) {
        step('⚠️ Outros status notáveis:');
        others.slice(0, 6).forEach(function (r) { step('  - `' + r.path + '` → ' + r.code); });
      }
      if (!real200.length && !others.length) step('✓ Nenhum path sensível exposto (todos 404/403 ou SPA fallback).');
      cp.findings.forEach(function (f) { allFindings.push({ phase: 'paths', ...f }); });
      step('');

      // ─── Fase 6: Bundle JS secrets ────────────
      step('### 🔑 Fase 6/8 — Secrets nos bundles JS (regex 19 patterns)');
      return reconJsSecrets(url);
    }).then(function (js) {
      if (!js.scanned) step('ℹ️ Nenhum bundle JS local encontrado (só CDN externa ou sem JS).');
      else {
        step('Scaneados ' + js.scanned + ' bundle(s):');
        js.bundles.forEach(function (b) { step('  - ' + b.url.split('/').slice(-1)[0] + ' (' + Math.round(b.size / 1024) + ' KB) → ' + b.matches.length + ' matches'); });
        if (js.findings.length) {
          step('🚨 Segredos/patterns encontrados:');
          js.findings.forEach(function (f) { step('  - **' + f.sev + '**: ' + f.msg); });
        } else step('✓ Nenhum secret pattern conhecido nos bundles.');
      }
      js.findings.forEach(function (f) { allFindings.push({ phase: 'js-secrets', ...f }); });
      step('');

      // ─── Fase 7: HTML markers ────────────
      step('### 🏷️ Fase 7/8 — HTML markers (Replit / bolt.new / TODO / sourcemaps)');
      return reconHtmlMarkers(url);
    }).then(function (m) {
      if (!m.findings.length) step('✓ Nenhum marker suspeito.');
      else m.findings.forEach(function (f) { step('  - **' + f.sev + '**: ' + f.msg); });
      m.findings.forEach(function (f) { allFindings.push({ phase: 'html', ...f }); });
      step('');

      // ─── Fase 8: TLS ────────────
      step('### 🔒 Fase 8/8 — TLS (protocolos deprecados)');
      return reconTls(host);
    }).then(function (t) {
      var tls10 = t.results.find(function (r) { return r.proto === 'tls1'; });
      var tls11 = t.results.find(function (r) { return r.proto === 'tls1_1'; });
      var tls12 = t.results.find(function (r) { return r.proto === 'tls1_2'; });
      step('- TLS 1.0: ' + (tls10 && tls10.rejected ? '✓ rejeitado' : (tls10 && tls10.supported ? '⚠️ ativo' : '?')));
      step('- TLS 1.1: ' + (tls11 && tls11.rejected ? '✓ rejeitado' : (tls11 && tls11.supported ? '⚠️ ativo' : '?')));
      step('- TLS 1.2: ' + (tls12 && tls12.supported ? '✓ ativo' : '?'));
      t.findings.forEach(function (f) { allFindings.push({ phase: 'tls', ...f }); });
      step('');

      // ─── Consolidação ────────────
      step('---');
      step('## 📊 Sumário — ' + allFindings.length + ' achados totais');
      var groups = { ALTO: [], 'MÉDIO': [], BAIXO: [] };
      allFindings.forEach(function (f) { if (groups[f.sev]) groups[f.sev].push(f); });
      ['ALTO', 'MÉDIO', 'BAIXO'].forEach(function (k) {
        if (groups[k].length) {
          step('### 🔴 ' + k + ' (' + groups[k].length + ')');
          groups[k].forEach(function (f) { step('  - [' + f.phase + '] ' + f.msg); });
        }
      });
      step('');

      // Registrar cada achado no Cofre via addFinding (se disponível)
      try {
        if (typeof window.addFinding === 'function') {
          allFindings.forEach(function (f) {
            window.addFinding({
              title: f.msg.slice(0, 100),
              severity: (f.sev === 'ALTO' ? 'high' : f.sev === 'MÉDIO' ? 'medium' : 'low'),
              target: host,
              category: 'recon-v2/' + f.phase,
              evidence: f.msg,
              source: 'chat-recon-v2',
              at: new Date().toISOString(),
            });
          });
          step('💾 ' + allFindings.length + ' achados salvos no Cofre.');
        }
      } catch (e) {}

      step('');
      step('✅ **Recon V2 TERMINADO.** Vá na aba **Cofre de Evidências** ou **Sala de Guerra → Etapa 4** para explorar todos os achados persistidos, filtrar por severidade e exportar Markdown.');

      return { findings: allFindings, host: host };
    });
  }

  // ═══════════════════════════════════════════════
  // Hook: monkey-patch do runReconFlow do chat-pt.js
  // ═══════════════════════════════════════════════
  function attach() {
    if (!window.__t3chat) { setTimeout(attach, 300); return; }
    // Sinaliza que v2 está ativo
    window.__t3reconV2 = { fullReconV2: fullReconV2, VERSION: '2.0.0' };

    // Substitui o runReconFlow do chat-pt.js pelo motor v2
    // O chat-pt.js chama runReconFlow(target); nós envolvemos com nossa versão.
    var originalRun = window.__t3chat_runReconFlow;
    // O chat-pt.js NÃO expõe runReconFlow globalmente, então precisamos interceptar
    // via observer: quando uma mensagem "🎯 **Recon REAL**" aparece, cancelamos e
    // rodamos o v2. Alternativa mais limpa: fornecer um botão "Recon V2" no header
    // do chat.
    injectV2Button();
  }

  function injectV2Button() {
    var bar = document.querySelector('#page-chat .t3c-bar');
    if (!bar || bar.querySelector('#t3cReconV2Btn')) return;
    var btn = document.createElement('button');
    btn.className = 't3c-btn';
    btn.id = 't3cReconV2Btn';
    btn.title = 'Recon V2 — 60 pontos passivos (DNS, crt.sh, Shodan, paths, secrets, TLS)';
    btn.textContent = '🎯 Recon V2';
    btn.addEventListener('click', function () {
      var inp = document.getElementById('t3cInput');
      var raw = (inp && inp.value || '').trim();
      var target = raw || prompt('Alvo (URL ou host):');
      if (!target) return;
      target = target.replace(/^\s*(faz|analisa|recon|scan)\s+(um\s+recon\s+em\s+)?/i, '').trim();
      // Injeta como uma mensagem no chat e chama o motor
      var msgs = document.getElementById('t3cMsgs');
      if (!msgs) { alert('Aba Chat não está pronta.'); return; }
      // Fake user message + assistant bubble
      var histKey = 'history';
      // Usar o "history" interno do chat via window.__t3chat.push?
      // Como chat-pt.js encapsula history em closure, apenas invocamos direto usando setLast trick.
      // Mais simples: usar innerHTML e criar as bolhas manualmente.
      var userDiv = document.createElement('div');
      userDiv.className = 't3c-msg user';
      userDiv.innerHTML = '<div class="t3c-av">🧑‍💻</div><div class="t3c-bubble">🎯 Recon V2 em ' + target + '</div>';
      msgs.appendChild(userDiv);
      var botDiv = document.createElement('div');
      botDiv.className = 't3c-msg bot';
      botDiv.innerHTML = '<div class="t3c-av">🎖️</div><div class="t3c-bubble" id="t3cV2Bubble"></div>';
      msgs.appendChild(botDiv);
      var bubble = document.getElementById('t3cV2Bubble');
      var acc = '';
      function step(s) {
        acc += s + '\n';
        bubble.innerHTML = acc
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');
        msgs.scrollTop = msgs.scrollHeight;
      }
      inp.value = '';
      fullReconV2(target, step).catch(function (e) {
        step('❌ Erro: ' + (e && e.message || e));
      });
    });
    bar.appendChild(btn);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(attach, 600); });
  else setTimeout(attach, 600);
})();
