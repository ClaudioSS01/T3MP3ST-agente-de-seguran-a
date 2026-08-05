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
      step('✅ **Recon V2 TERMINADO** — ' + allFindings.length + ' achados encontrados. Relatório completo abaixo. Clique em **📄 Baixar PDF** para exportar.');

      // Guarda dados para o botão de PDF poder acessar
      window.__t3lastRecon = { host: host, findings: allFindings, at: new Date().toISOString() };

      return { findings: allFindings, host: host };
    });
  }

  // ═══════════════════════════════════════════════
  // Detecção automática de URL/domínio no input do chat
  // ═══════════════════════════════════════════════
  function extractHostOrUrl(text) {
    if (!text) return null;
    var t = String(text).trim();
    // URL http/https
    var m = t.match(/https?:\/\/[^\s"'<>]+/i);
    if (m) return m[0];
    // Domínio (ex: example.com, sub.example.co.uk)
    m = t.match(/\b((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.){1,}[a-z]{2,24})\b/i);
    if (m) return m[1];
    // IPv4
    m = t.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/);
    if (m) return m[1];
    return null;
  }
  function isChatOnlyIntent(text) {
    // Se o texto é uma pergunta pura ou saudação, NÃO trata como recon
    var t = String(text || '').trim().toLowerCase();
    if (!t) return true;
    if (t.length < 4) return true;
    // Se começa com pergunta clássica de chat E não tem URL, é chat
    if (/^(oi|olá|ola|hey|hi|hello|quem é|quem eh|o que|what|como funciona|explica|explique|conta|me diga|me fala|help|ajuda)/i.test(t)) return true;
    return false;
  }

  // ═══════════════════════════════════════════════
  // Persistência das mensagens do V2 (localStorage)
  // O chat-pt.js reseta o DOM quando volta pra aba Chat porque suas bolhas
  // não estão no history interno dele. Persistimos e restauramos aqui.
  // ═══════════════════════════════════════════════
  var STORAGE_KEY = 't3rv2_messages_v1';
  function loadMessages() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveMessage(msg) {
    var arr = loadMessages();
    arr.push(msg);
    // Cap a 20 recons para não explodir localStorage
    if (arr.length > 20) arr = arr.slice(-20);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function updateLastMessage(patch) {
    var arr = loadMessages();
    if (!arr.length) return;
    Object.assign(arr[arr.length - 1], patch);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function restoreMessages() {
    var msgs = document.getElementById('t3cMsgs');
    if (!msgs) return;
    var stored = loadMessages();
    if (!stored.length) return;
    // Se o chat mostra a tela vazia (chips de "Experimente"), limpa e mostra
    // as mensagens salvas por cima.
    if (msgs.querySelector('.t3c-empty')) msgs.innerHTML = '';
    // Só restaura se ainda não estiverem lá (evita duplicar)
    if (msgs.querySelector('[data-t3rv2-msg]')) return;
    stored.forEach(function (m) {
      renderStoredMessage(msgs, m);
    });
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderStoredMessage(msgs, m) {
    var user = document.createElement('div');
    user.className = 't3c-msg user';
    user.setAttribute('data-t3rv2-msg', '1');
    user.innerHTML = '<div class="t3c-av">🧑‍💻</div><div class="t3c-bubble">' + esc(m.query) + '</div>';
    msgs.appendChild(user);

    var bot = document.createElement('div');
    bot.className = 't3c-msg bot';
    bot.setAttribute('data-t3rv2-msg', '1');
    var bubble = document.createElement('div');
    bubble.className = 't3c-bubble';
    bubble.innerHTML = renderMarkdown(m.acc || '');
    bot.innerHTML = '<div class="t3c-av">🎖️</div>';
    bot.appendChild(bubble);
    msgs.appendChild(bot);
    if (m.result) appendDownloadButtons(bubble, m.result);
  }

  // ═══════════════════════════════════════════════
  // UI: cria bolhas no chat sem depender do closure history do chat-pt.js
  // ═══════════════════════════════════════════════
  function runReconInChat(rawTarget) {
    var target = extractHostOrUrl(rawTarget) || rawTarget;
    var msgs = document.getElementById('t3cMsgs');
    if (!msgs) { alert('Chat não está pronto.'); return; }
    // Limpa tela de boas-vindas
    if (msgs.querySelector('.t3c-empty')) msgs.innerHTML = '';

    // Cria bolha do usuário + resposta do bot
    var userDiv = document.createElement('div');
    userDiv.className = 't3c-msg user';
    userDiv.setAttribute('data-t3rv2-msg', '1');
    userDiv.innerHTML = '<div class="t3c-av">🧑‍💻</div><div class="t3c-bubble">' +
      esc(rawTarget) + '</div>';
    msgs.appendChild(userDiv);

    var botDiv = document.createElement('div');
    botDiv.className = 't3c-msg bot';
    botDiv.setAttribute('data-t3rv2-msg', '1');
    var bubbleId = 't3cV2Bubble_' + Math.random().toString(36).slice(2,8);
    botDiv.innerHTML = '<div class="t3c-av">🎖️</div><div class="t3c-bubble" id="' + bubbleId + '"></div>';
    msgs.appendChild(botDiv);
    msgs.scrollTop = msgs.scrollHeight;

    // Salva a entrada no storage (formato legacy)
    saveMessage({ query: rawTarget, target: target, acc: '', result: null, at: new Date().toISOString() });
    // Também grava na conversa ativa (novo formato multi-conversa) se disponível
    if (window.__t3conv) {
      try {
        window.__t3conv.appendMessage({ role: 'user', content: rawTarget, type: 'text', at: new Date().toISOString() });
        window.__t3conv.appendMessage({ role: 'assistant', content: '', type: 'recon', result: null, at: new Date().toISOString() });
      } catch (e) {}
    }
    // Marca as bolhas para o observer do chat-conversations.js não duplicá-las
    userDiv.setAttribute('data-t3conv-msg', '1');
    botDiv.setAttribute('data-t3conv-msg', '1');

    var bubble = document.getElementById(bubbleId);
    var acc = '';
    var lastSave = 0;
    function step(s) {
      acc += s + '\n';
      bubble.innerHTML = renderMarkdown(acc);
      msgs.scrollTop = msgs.scrollHeight;
      // Throttle: salva no localStorage a cada 500ms
      var now = Date.now();
      if (now - lastSave > 500) {
        lastSave = now;
        updateLastMessage({ acc: acc });
        if (window.__t3conv) {
          try { window.__t3conv.updateLastMessage({ content: acc }); } catch (e) {}
        }
      }
    }
    // Preferência: ReAct (loop adaptativo c/ Arsenal completo) > V3 > V2
    var reconFn = (window.__t3react && window.__t3react.fullReconReact) || (window.__t3reconV3 && window.__t3reconV3.fullReconV3) || fullReconV2;
    return reconFn(target, step, rawTarget)
      .then(function (result) {
        var b = document.getElementById(bubbleId);
        if (b) appendDownloadButtons(b, result);
        // Salvamento final
        updateLastMessage({ acc: acc, result: result });
        if (window.__t3conv) {
          try { window.__t3conv.updateLastMessage({ content: acc, result: result }); } catch (e) {}
        }
      })
      .catch(function (e) {
        step('❌ Erro: ' + (e && e.message || e));
        updateLastMessage({ acc: acc, error: String((e && e.message) || e) });
        if (window.__t3conv) {
          try { window.__t3conv.updateLastMessage({ content: acc, error: String((e && e.message) || e) }); } catch (e2) {}
        }
      });
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function renderMarkdown(s) {
    return esc(s)
      .replace(/```\n?([\s\S]*?)```/g, '<pre class="t3c-code">$1</pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.+)$/gm, '<h4 style="margin:8px 0 4px;color:#2fffd2">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 4px;color:#2fffd2">$1</h3>')
      .replace(/^---$/gm, '<hr style="border:0;border-top:1px solid #2a3a48;margin:8px 0">')
      .replace(/^\s{2}- (.+)$/gm, '<div style="margin-left:20px">• $1</div>')
      .replace(/^- (.+)$/gm, '<div style="margin-left:8px">• $1</div>')
      .replace(/\n/g, '<br>');
  }

  // ═══════════════════════════════════════════════
  // Interceptação: URL no input dispara Recon V2 automaticamente
  // ═══════════════════════════════════════════════
  function installInputInterceptor() {
    // Capture: rodamos ANTES dos handlers do chat-pt.js
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || (t.id !== 't3cSend' && !(t.closest && t.closest('#t3cSend')))) return;
      var inp = document.getElementById('t3cInput');
      if (!inp) return;
      var text = (inp.value || '').trim();
      if (!text) return;
      var target = extractHostOrUrl(text);
      if (target && !isChatOnlyIntent(text)) {
        e.stopImmediatePropagation();
        e.preventDefault();
        inp.value = '';
        runReconInChat(text);
      }
    }, true);

    document.addEventListener('keydown', function (e) {
      if (!e.target || e.target.id !== 't3cInput') return;
      if (e.key !== 'Enter' || e.shiftKey) return;
      var text = (e.target.value || '').trim();
      if (!text) return;
      var target = extractHostOrUrl(text);
      if (target && !isChatOnlyIntent(text)) {
        e.stopImmediatePropagation();
        e.preventDefault();
        e.target.value = '';
        runReconInChat(text);
      }
    }, true);
  }

  // ═══════════════════════════════════════════════
  // Botões: Baixar PDF, Baixar Markdown
  // ═══════════════════════════════════════════════
  function appendDownloadButtons(botDiv, reconResult) {
    if (!reconResult || !reconResult.findings) return;
    var wrap = document.createElement('div');
    wrap.style.cssText = 'margin-top:12px;display:flex;gap:8px;flex-wrap:wrap';
    wrap.innerHTML =
      '<button class="t3c-btn t3rv2-dl-pdf" style="background:linear-gradient(135deg,#2563eb,#1e40af);color:#fff;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:700">📄 Baixar PDF</button>' +
      '<button class="t3c-btn t3rv2-dl-md" style="background:rgba(47,255,210,.1);color:#2fffd2;border:1px solid rgba(47,255,210,.35);padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:700">📝 Baixar Markdown</button>' +
      '<button class="t3c-btn t3rv2-copy" style="background:rgba(255,255,255,.05);color:#a8c0cc;border:1px solid rgba(255,255,255,.15);padding:8px 14px;border-radius:8px;cursor:pointer">📋 Copiar</button>';
    botDiv.appendChild(wrap);
    wrap.querySelector('.t3rv2-dl-pdf').addEventListener('click', function () { downloadPdf(reconResult); });
    wrap.querySelector('.t3rv2-dl-md').addEventListener('click', function () { downloadMarkdown(reconResult); });
    wrap.querySelector('.t3rv2-copy').addEventListener('click', function () {
      navigator.clipboard.writeText(buildMarkdown(reconResult)).then(function () {
        wrap.querySelector('.t3rv2-copy').textContent = '✓ Copiado';
      });
    });
  }

  // ═══════════════════════════════════════════════
  // Markdown builder (usado pelo download .md e copy)
  // ═══════════════════════════════════════════════
  function buildMarkdown(r) {
    var out = [];
    out.push('# Dossiê de Cibersegurança — ' + r.host);
    out.push('');
    out.push('> Análise passiva/semi-ativa · ' + new Date(r.at || Date.now()).toLocaleString('pt-BR'));
    out.push('> Motor: T3MP3ST Recon V2 (8 fases · 60 pontos)');
    out.push('');
    var groups = { ALTO: [], 'MÉDIO': [], BAIXO: [], INFO: [] };
    r.findings.forEach(function (f) { if (groups[f.sev]) groups[f.sev].push(f); });
    out.push('## Sumário');
    out.push('');
    out.push('| Severidade | Qtd |');
    out.push('|---|---|');
    out.push('| 🔴 ALTO | ' + groups.ALTO.length + ' |');
    out.push('| 🟠 MÉDIO | ' + groups['MÉDIO'].length + ' |');
    out.push('| 🟡 BAIXO | ' + groups.BAIXO.length + ' |');
    out.push('| 🟢 INFO | ' + groups.INFO.length + ' |');
    out.push('');
    ['ALTO', 'MÉDIO', 'BAIXO', 'INFO'].forEach(function (sev) {
      if (!groups[sev].length) return;
      var icon = { ALTO: '🔴', 'MÉDIO': '🟠', BAIXO: '🟡', INFO: '🟢' }[sev];
      out.push('## ' + icon + ' ' + sev + ' (' + groups[sev].length + ')');
      out.push('');
      groups[sev].forEach(function (f) {
        out.push('- **[' + f.phase + ']** ' + f.msg);
      });
      out.push('');
    });
    return out.join('\n');
  }

  function downloadMarkdown(r) {
    var md = buildMarkdown(r);
    var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, 'dossie_' + r.host + '_' + new Date().toISOString().slice(0,10) + '.md');
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  // ═══════════════════════════════════════════════
  // PDF client-side com jsPDF (lazy load do CDN)
  // ═══════════════════════════════════════════════
  var JSPDF_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
    'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js'
  ];
  function loadJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return JSPDF_URLS.reduce(function (p, url) {
      return p.catch(function () {
        return new Promise(function (resolve, reject) {
          var s = document.createElement('script');
          s.src = url;
          s.onload = function () {
            if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
            else reject(new Error('jsPDF não expôs jspdf.jsPDF'));
          };
          s.onerror = function () { reject(new Error('falha carregar ' + url)); };
          document.head.appendChild(s);
        });
      });
    }, Promise.reject(new Error('start')));
  }

  function downloadPdf(r) {
    // Se o motor V3 gerou o resultado com achados estruturados (com command/response/attackNarrative), usa o PDF V3
    if (window.__t3pdfV3 && r && r.findings && r.findings[0] && r.findings[0].command !== undefined) {
      return window.__t3pdfV3.download(r);
    }
    // Senão, PDF V2 legado (só sumário)
    loadJsPdf().then(function (jsPDF) {
      var doc = new jsPDF({ format: 'a4', unit: 'pt' });
      // Cores do relatório
      var C_PRIMARY = [37, 99, 235];
      var C_DARK = [30, 64, 175];
      var C_TEXT = [17, 24, 39];
      var C_MUTED = [107, 114, 128];
      var C_RED_BG = [254, 226, 226], C_RED_FG = [220, 38, 38];
      var C_ORANGE_BG = [255, 247, 237], C_ORANGE_FG = [234, 88, 12];
      var C_YELLOW_BG = [254, 252, 232], C_YELLOW_FG = [202, 138, 4];
      var C_GREEN_BG = [240, 253, 244], C_GREEN_FG = [22, 163, 74];
      var C_TERM_BG = [31, 41, 55], C_TERM_FG = [229, 231, 235];

      var PAGE_W = doc.internal.pageSize.getWidth();
      var PAGE_H = doc.internal.pageSize.getHeight();
      var MARGIN = 40;

      function sevColors(sev) {
        return { ALTO: [C_RED_BG, C_RED_FG], 'MÉDIO': [C_ORANGE_BG, C_ORANGE_FG],
                 BAIXO: [C_YELLOW_BG, C_YELLOW_FG], INFO: [C_GREEN_BG, C_GREEN_FG] }[sev] || [[220,220,220],[100,100,100]];
      }

      // ─── CAPA ───
      doc.setFillColor.apply(doc, C_DARK);
      doc.rect(0, 0, PAGE_W, 120, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('DOSSIÊ DE CIBERSEGURANÇA', PAGE_W/2, 75, { align: 'center' });

      doc.setTextColor.apply(doc, C_PRIMARY);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(r.host, PAGE_W/2, 210, { align: 'center' });

      doc.setTextColor.apply(doc, C_MUTED);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Motor T3MP3ST Recon V2 · 8 fases · ' + r.findings.length + ' achados', PAGE_W/2, 240, { align: 'center' });
      doc.text(new Date(r.at || Date.now()).toLocaleString('pt-BR'), PAGE_W/2, 258, { align: 'center' });

      // Badge CONFIDENCIAL
      doc.setFillColor.apply(doc, C_RED_FG);
      doc.roundedRect(PAGE_W/2 - 70, 320, 140, 30, 4, 4, 'F');
      doc.setTextColor(255,255,255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('CONFIDENCIAL', PAGE_W/2, 340, { align: 'center' });

      doc.setTextColor.apply(doc, C_MUTED);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Análise passiva/semi-ativa — nenhum payload de ataque foi enviado.', PAGE_W/2, 380, { align: 'center' });

      // ─── SUMÁRIO ───
      doc.addPage();
      var y = MARGIN;

      doc.setTextColor.apply(doc, C_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Sumário Executivo', MARGIN, y);
      y += 24;

      var groups = { ALTO: [], 'MÉDIO': [], BAIXO: [], INFO: [] };
      r.findings.forEach(function (f) { if (groups[f.sev]) groups[f.sev].push(f); });

      doc.setTextColor.apply(doc, C_TEXT);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      var summary = 'Analise executada em ' + new Date(r.at || Date.now()).toLocaleString('pt-BR') +
                    ' contra ' + r.host + '. Cobre 8 fases passivas: HTTP+Headers, DNS+DMARC/SPF, ' +
                    'Shodan InternetDB, Certificate Transparency, common paths, JS bundle secrets, ' +
                    'HTML markers e TLS. Total: ' + r.findings.length + ' achados identificados.';
      var summaryLines = doc.splitTextToSize(summary, PAGE_W - 2*MARGIN);
      doc.text(summaryLines, MARGIN, y);
      y += summaryLines.length * 13 + 15;

      // Placar
      var scoreRows = [
        ['🔴 ALTO', groups.ALTO.length, C_RED_BG],
        ['🟠 MÉDIO', groups['MÉDIO'].length, C_ORANGE_BG],
        ['🟡 BAIXO', groups.BAIXO.length, C_YELLOW_BG],
        ['🟢 INFO', groups.INFO.length, C_GREEN_BG],
      ];
      // header
      doc.setFillColor.apply(doc, C_DARK);
      doc.rect(MARGIN, y, PAGE_W - 2*MARGIN, 22, 'F');
      doc.setTextColor(255,255,255);
      doc.setFont('helvetica','bold');
      doc.setFontSize(10);
      doc.text('Severidade', MARGIN + 10, y + 15);
      doc.text('Qtd', MARGIN + 200, y + 15);
      y += 22;
      scoreRows.forEach(function (row) {
        doc.setFillColor.apply(doc, row[2]);
        doc.rect(MARGIN, y, PAGE_W - 2*MARGIN, 22, 'F');
        doc.setTextColor.apply(doc, C_TEXT);
        doc.setFont('helvetica','normal');
        doc.text(String(row[0]), MARGIN + 10, y + 15);
        doc.setFont('helvetica','bold');
        doc.text(String(row[1]), MARGIN + 200, y + 15);
        y += 22;
      });
      y += 20;

      // ─── ACHADOS DETALHADOS ───
      doc.setTextColor.apply(doc, C_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Achados Detalhados', MARGIN, y);
      y += 20;

      ['ALTO', 'MÉDIO', 'BAIXO', 'INFO'].forEach(function (sev) {
        var arr = groups[sev];
        if (!arr.length) return;
        var cols = sevColors(sev);
        var bg = cols[0], fg = cols[1];

        // Se não cabe, nova página
        if (y > PAGE_H - 120) { doc.addPage(); y = MARGIN; }

        doc.setTextColor.apply(doc, fg);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(sev + ' (' + arr.length + ')', MARGIN, y);
        y += 16;

        arr.forEach(function (f) {
          var text = '[' + f.phase + '] ' + f.msg;
          var lines = doc.splitTextToSize(text, PAGE_W - 2*MARGIN - 20);
          var boxH = lines.length * 12 + 12;
          if (y + boxH > PAGE_H - MARGIN) { doc.addPage(); y = MARGIN; }
          // Card
          doc.setFillColor.apply(doc, bg);
          doc.rect(MARGIN, y, PAGE_W - 2*MARGIN, boxH, 'F');
          // Borda esquerda colorida
          doc.setFillColor.apply(doc, fg);
          doc.rect(MARGIN, y, 4, boxH, 'F');
          // Texto
          doc.setTextColor.apply(doc, C_TEXT);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(lines, MARGIN + 12, y + 14);
          y += boxH + 6;
        });
        y += 10;
      });

      // ─── FOOTER em todas as páginas ───
      var pageCount = doc.internal.getNumberOfPages();
      for (var i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        if (i > 1) {
          doc.setDrawColor.apply(doc, C_PRIMARY);
          doc.setLineWidth(0.5);
          doc.line(MARGIN, PAGE_H - 30, PAGE_W - MARGIN, PAGE_H - 30);
          doc.setTextColor.apply(doc, C_MUTED);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.text('CONFIDENCIAL — ' + r.host, MARGIN, PAGE_H - 18);
          doc.text('Página ' + i + ' de ' + pageCount, PAGE_W - MARGIN, PAGE_H - 18, { align: 'right' });
        }
      }

      var filename = 'dossie_' + r.host.replace(/[^a-z0-9.-]/gi,'_') + '_' + new Date().toISOString().slice(0,10) + '.pdf';
      doc.save(filename);
    }).catch(function (e) {
      alert('❌ Falha ao carregar jsPDF do CDN. Erro: ' + e.message + '\n\nAlternativa: use "Baixar Markdown" e converta manualmente, ou verifique conexão.');
    });
  }

  // ═══════════════════════════════════════════════
  // Boot: injeta CSS, botão e interceptador
  // ═══════════════════════════════════════════════
  function attach() {
    if (!window.__t3chat) { setTimeout(attach, 300); return; }
    window.__t3reconV2 = {
      fullReconV2: fullReconV2, VERSION: '2.3.0',
      downloadPdf: downloadPdf, restore: restoreMessages,
      appendDownloadButtons: appendDownloadButtons,
      runReconInChat: runReconInChat,
      clear: function () { localStorage.removeItem(STORAGE_KEY); location.reload(); }
    };
    injectStyles();
    injectV2Button();
    installInputInterceptor();
    setTimeout(restoreMessages, 500);
    installChatOpenObserver();
    injectClearButton();
  }

  // Restaura mensagens toda vez que a aba Chat vira ativa (o chat-pt.js
  // reseta o DOM ao voltar para page-chat)
  function installChatOpenObserver() {
    var page = document.getElementById('page-chat');
    if (!page) { setTimeout(installChatOpenObserver, 500); return; }
    // Observa quando page-chat vira 'active'
    new MutationObserver(function () {
      if (page.classList.contains('active')) {
        setTimeout(restoreMessages, 100);
      }
    }).observe(page, { attributes: true, attributeFilter: ['class'] });

    // Também escuta cliques na nav "Chat" — o chat-pt.js pode reset antes do observer
    var navChat = document.querySelector('.nav-item[data-page="chat"]');
    if (navChat) {
      navChat.addEventListener('click', function () {
        setTimeout(restoreMessages, 200);
      });
    }
  }

  function injectClearButton() {
    var bar = document.querySelector('#page-chat .t3c-bar');
    if (!bar || bar.querySelector('#t3rv2ClearBtn')) return;
    var btn = document.createElement('button');
    btn.className = 't3c-btn';
    btn.id = 't3rv2ClearBtn';
    btn.title = 'Limpar histórico de recons persistidos (localStorage)';
    btn.textContent = '🧹 Limpar recons';
    btn.style.cssText = 'background:rgba(255,80,80,.08);color:#ff9090;border:1px solid rgba(255,80,80,.3)';
    btn.addEventListener('click', function () {
      if (!confirm('Limpar histórico de recons persistidos?')) return;
      localStorage.removeItem(STORAGE_KEY);
      var msgs = document.getElementById('t3cMsgs');
      if (msgs) msgs.querySelectorAll('[data-t3rv2-msg]').forEach(function (el) { el.remove(); });
    });
    bar.appendChild(btn);
  }

  function injectStyles() {
    if (document.getElementById('t3rv2-styles')) return;
    var s = document.createElement('style');
    s.id = 't3rv2-styles';
    s.textContent = [
      '#page-chat .t3c-bubble pre.t3c-code{background:#1f2937;color:#e5e7eb;padding:10px 12px;border-radius:8px;font-family:Courier,monospace;font-size:11.5px;line-height:1.4;overflow-x:auto;margin:6px 0;white-space:pre-wrap;word-break:break-word}',
      '#page-chat .t3c-bubble h3,#page-chat .t3c-bubble h4{color:#2fffd2}',
      '.t3rv2-dl-pdf:hover{filter:brightness(1.15)}',
      '.t3rv2-dl-md:hover{background:rgba(47,255,210,.2)!important}',
    ].join('\n');
    document.head.appendChild(s);
  }

  function injectV2Button() {
    var bar = document.querySelector('#page-chat .t3c-bar');
    if (!bar || bar.querySelector('#t3cReconV2Btn')) return;
    var btn = document.createElement('button');
    btn.className = 't3c-btn';
    btn.id = 't3cReconV2Btn';
    btn.title = 'Forçar Recon V2 (também dispara automaticamente quando você cola uma URL/domínio)';
    btn.textContent = '🎯 Recon V2';
    btn.addEventListener('click', function () {
      var inp = document.getElementById('t3cInput');
      var raw = (inp && inp.value || '').trim();
      var target = raw || prompt('Alvo (URL ou host):');
      if (!target) return;
      if (inp) inp.value = '';
      runReconInChat(target);
    });
    bar.appendChild(btn);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(attach, 600); });
  else setTimeout(attach, 600);
})();
