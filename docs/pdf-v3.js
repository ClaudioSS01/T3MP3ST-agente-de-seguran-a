/*
 * T3MP3ST — PDF Generator V3 (dossiê profissional replicável)
 * ────────────────────────────────────────────────────────────
 * Diferença vs V2:
 *   - Capa com sumário executivo
 *   - Página de índice
 *   - Cada achado em card A4 dedicado: severidade + CVSS + comando + URL +
 *     response literal (bloco terminal) + attack narrative + business impact + fix + refs
 *   - Sumário técnico ao final + inventário de comandos usados (replicável)
 *
 * Client-side via jsPDF (mesmo já usado no V2).
 */
(function () {
  'use strict';
  if (window.__t3pdfV3) return;

  var JSPDF_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
    'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js',
  ];
  function loadJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return JSPDF_URLS.reduce(function (p, url) {
      return p.catch(function () {
        return new Promise(function (resolve, reject) {
          var s = document.createElement('script');
          s.src = url;
          s.onload = function () { window.jspdf && window.jspdf.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error('jspdf load')); };
          s.onerror = function () { reject(new Error(url)); };
          document.head.appendChild(s);
        });
      });
    }, Promise.reject(new Error('start')));
  }

  // Paleta
  var C = {
    primary: [37, 99, 235],
    dark: [30, 64, 175],
    text: [17, 24, 39],
    muted: [107, 114, 128],
    lightBg: [249, 250, 251],
    red: { bg: [254, 226, 226], fg: [220, 38, 38] },
    orange: { bg: [255, 247, 237], fg: [234, 88, 12] },
    yellow: { bg: [254, 252, 232], fg: [202, 138, 4] },
    green: { bg: [240, 253, 244], fg: [22, 163, 74] },
    term: { bg: [31, 41, 55], fg: [229, 231, 235] },
    softBg: [239, 246, 255],
  };
  function sevPalette(sev) {
    return { ALTO: C.red, 'MÉDIO': C.orange, BAIXO: C.yellow, INFO: C.green }[sev] || { bg: [240, 240, 240], fg: [100, 100, 100] };
  }

  function drawTerminalBlock(doc, x, y, w, text, opts) {
    opts = opts || {};
    var maxLines = opts.maxLines || 20;
    var fontSize = opts.fontSize || 8;
    doc.setFont('courier', 'normal');
    doc.setFontSize(fontSize);
    var lines = doc.splitTextToSize(String(text || '').replace(/\r/g, ''), w - 20);
    lines = lines.slice(0, maxLines);
    if (String(text || '').split('\n').length > maxLines) lines.push('... (truncado — full em evidências)');
    var lineH = fontSize * 1.3;
    var h = lines.length * lineH + 12;
    doc.setFillColor.apply(doc, C.term.bg);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    doc.setTextColor.apply(doc, C.term.fg);
    lines.forEach(function (line, i) {
      doc.text(line, x + 8, y + 12 + i * lineH);
    });
    return y + h;
  }

  function drawFindingCard(doc, y, finding, marginX, pageW, pageH) {
    var pal = sevPalette(finding.severity);
    var cardW = pageW - marginX * 2;

    // Header
    doc.setFillColor.apply(doc, pal.bg);
    doc.roundedRect(marginX, y, cardW, 40, 4, 4, 'F');
    doc.setFillColor.apply(doc, pal.fg);
    doc.rect(marginX, y, 4, 40, 'F');

    // Severity badge
    doc.setFillColor.apply(doc, pal.fg);
    doc.roundedRect(marginX + 12, y + 8, 60, 24, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(finding.severity, marginX + 42, y + 24, { align: 'center' });

    // CVSS
    if (finding.cvss != null) {
      doc.setFillColor(50, 50, 50);
      doc.roundedRect(marginX + 78, y + 8, 60, 24, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('CVSS ' + finding.cvss.toFixed(1), marginX + 108, y + 24, { align: 'center' });
    }

    // Title
    doc.setTextColor.apply(doc, C.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    var titleX = finding.cvss != null ? marginX + 148 : marginX + 82;
    var titleLines = doc.splitTextToSize(finding.title || '(sem título)', cardW - titleX - 16);
    doc.text(titleLines.slice(0, 2), titleX, y + 18);

    y += 48;

    // Description (short summary)
    if (finding.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, C.text);
      var descLines = doc.splitTextToSize(finding.description, cardW);
      doc.text(descLines.slice(0, 3), marginX, y);
      y += Math.min(3, descLines.length) * 11 + 6;
    }

    // Comando (bloco terminal)
    if (finding.command) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, C.primary);
      doc.text('▶ COMANDO USADO (copiável)', marginX, y);
      y += 10;
      y = drawTerminalBlock(doc, marginX, y, cardW, finding.command, { maxLines: 4 });
      y += 6;
    }

    // URL
    if (finding.url) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, C.primary);
      doc.text('🔗 URL ALVO', marginX, y);
      y += 10;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, C.text);
      var urlLines = doc.splitTextToSize(finding.url, cardW - 4);
      doc.text(urlLines.slice(0, 2), marginX, y);
      y += Math.min(2, urlLines.length) * 10 + 6;
    }

    // Response
    if (finding.response) {
      // Verifica se vai caber ou precisa de nova página
      if (y > pageH - 180) { doc.addPage(); y = 40; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, C.primary);
      doc.text('📥 RESPONSE LITERAL (prova)', marginX, y);
      y += 10;
      y = drawTerminalBlock(doc, marginX, y, cardW, finding.response, { maxLines: 12 });
      y += 6;
    }

    // Attack narrative
    if (finding.attackNarrative) {
      if (y > pageH - 100) { doc.addPage(); y = 40; }
      doc.setFillColor.apply(doc, C.red.bg);
      doc.roundedRect(marginX, y, cardW, 60, 3, 3, 'F');
      doc.setFillColor.apply(doc, C.red.fg);
      doc.rect(marginX, y, 3, 60, 'F');
      doc.setTextColor.apply(doc, C.red.fg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('⚔️ COMO O ATACANTE ABUSA', marginX + 10, y + 12);
      doc.setTextColor.apply(doc, C.text);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      var atkLines = doc.splitTextToSize(finding.attackNarrative, cardW - 16);
      var lineY = y + 26;
      atkLines.slice(0, 4).forEach(function (l) { doc.text(l, marginX + 10, lineY); lineY += 11; });
      y += Math.max(60, lineY - y + 8);
    }

    // Business impact
    if (finding.businessImpact) {
      if (y > pageH - 80) { doc.addPage(); y = 40; }
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(marginX, y, cardW, 46, 3, 3, 'F');
      doc.setFillColor(217, 119, 6);
      doc.rect(marginX, y, 3, 46, 'F');
      doc.setTextColor(146, 64, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('💼 IMPACTO NO NEGÓCIO', marginX + 10, y + 12);
      doc.setTextColor.apply(doc, C.text);
      doc.setFont('helvetica', 'normal');
      var biLines = doc.splitTextToSize(finding.businessImpact, cardW - 16);
      var by = y + 26;
      biLines.slice(0, 3).forEach(function (l) { doc.text(l, marginX + 10, by); by += 11; });
      y += Math.max(46, by - y + 6);
    }

    // Fix
    if (finding.fix) {
      if (y > pageH - 80) { doc.addPage(); y = 40; }
      doc.setFillColor.apply(doc, C.green.bg);
      doc.roundedRect(marginX, y, cardW, 60, 3, 3, 'F');
      doc.setFillColor.apply(doc, C.green.fg);
      doc.rect(marginX, y, 3, 60, 'F');
      doc.setTextColor.apply(doc, C.green.fg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('🛠️ COMO CORRIGIR', marginX + 10, y + 12);
      doc.setTextColor.apply(doc, C.text);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      var fixLines = doc.splitTextToSize(finding.fix, cardW - 16);
      var fy = y + 26;
      fixLines.slice(0, 4).forEach(function (l) { doc.text(l, marginX + 10, fy); fy += 11; });
      y += Math.max(60, fy - y + 8);
    }

    // References
    if (finding.references && finding.references.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, C.muted);
      doc.text('Refs: ' + finding.references.join(' · '), marginX, y);
      y += 12;
    }

    y += 8;
    return y;
  }

  async function downloadPdfV3(r) {
    if (!r || !r.findings) { alert('Sem achados para gerar PDF'); return; }
    var jsPDF = await loadJsPdf();
    var doc = new jsPDF({ format: 'a4', unit: 'pt' });
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();
    var margin = 40;

    // ─────────── CAPA ───────────
    doc.setFillColor.apply(doc, C.dark);
    doc.rect(0, 0, pageW, 140, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('DOSSIÊ DE CIBERSEGURANÇA', pageW / 2, 80, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Análise técnica com prova replicável', pageW / 2, 108, { align: 'center' });

    doc.setTextColor.apply(doc, C.primary);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(r.host, pageW / 2, 200, { align: 'center' });

    // Sumário executivo (contadores)
    var groups = { ALTO: [], 'MÉDIO': [], BAIXO: [], INFO: [] };
    r.findings.forEach(function (f) { if (groups[f.severity]) groups[f.severity].push(f); });

    doc.setFillColor.apply(doc, C.softBg);
    doc.roundedRect(margin, 240, pageW - margin * 2, 200, 6, 6, 'F');
    doc.setTextColor.apply(doc, C.text);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMÁRIO EXECUTIVO', pageW / 2, 268, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    var summary = 'Análise passiva/semi-ativa executada em ' + new Date(r.at || Date.now()).toLocaleString('pt-BR') +
      '. Total: ' + r.findings.length + ' achados. Cada achado abaixo tem comando executado, URL testada, ' +
      'resposta literal do servidor, narrativa de como um atacante abusa, impacto no negócio, e correção com código.';
    var summaryLines = doc.splitTextToSize(summary, pageW - margin * 2 - 32);
    doc.text(summaryLines, margin + 16, 288);

    // Contadores
    var sevRows = [
      { sev: 'ALTO', count: groups.ALTO.length, pal: C.red },
      { sev: 'MÉDIO', count: groups['MÉDIO'].length, pal: C.orange },
      { sev: 'BAIXO', count: groups.BAIXO.length, pal: C.yellow },
      { sev: 'INFO', count: groups.INFO.length, pal: C.green },
    ];
    var boxY = 340, boxH = 60, boxW = (pageW - margin * 2 - 30) / 4;
    sevRows.forEach(function (row, i) {
      var x = margin + 15 + i * (boxW + 10);
      doc.setFillColor.apply(doc, row.pal.bg);
      doc.roundedRect(x, boxY, boxW - 5, boxH, 4, 4, 'F');
      doc.setTextColor.apply(doc, row.pal.fg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(String(row.count), x + boxW / 2 - 2, boxY + 32, { align: 'center' });
      doc.setFontSize(9);
      doc.text(row.sev, x + boxW / 2 - 2, boxY + 50, { align: 'center' });
    });

    // Top 3 achados críticos (preview)
    var critical = groups.ALTO.concat(groups['MÉDIO']).slice(0, 3);
    if (critical.length) {
      doc.setTextColor.apply(doc, C.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TOP ACHADOS PARA AGIR HOJE:', margin, 470);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      critical.forEach(function (f, i) {
        var line = (i + 1) + '. [' + f.severity + '] ' + f.title;
        var lines = doc.splitTextToSize(line, pageW - margin * 2);
        doc.text(lines[0], margin, 490 + i * 16);
      });
    }

    // Badge CONFIDENCIAL
    doc.setFillColor.apply(doc, C.red.fg);
    doc.roundedRect(pageW / 2 - 70, 720, 140, 30, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('CONFIDENCIAL', pageW / 2, 740, { align: 'center' });

    doc.setTextColor.apply(doc, C.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Motor T3MP3ST Recon V3 · ' + r.findings.length + ' achados · ' + new Date(r.at || Date.now()).toLocaleDateString('pt-BR'),
      pageW / 2, 770, { align: 'center' });
    doc.text('Análise passiva/semi-ativa — nenhum payload de exploração ativa foi enviado.',
      pageW / 2, 785, { align: 'center' });

    // ─────────── ACHADOS DETALHADOS ───────────
    doc.addPage();
    var y = margin;
    doc.setTextColor.apply(doc, C.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ACHADOS DETALHADOS', pageW / 2, y + 10, { align: 'center' });
    y += 34;
    doc.setTextColor.apply(doc, C.muted);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Cada achado abaixo tem prova replicável: comando exato, URL testada, resposta do servidor.', pageW / 2, y, { align: 'center' });
    y += 20;

    // Ordena por severidade
    var sevOrder = { ALTO: 0, 'MÉDIO': 1, BAIXO: 2, INFO: 3 };
    var sorted = r.findings.slice().sort(function (a, b) { return sevOrder[a.severity] - sevOrder[b.severity]; });

    sorted.forEach(function (f, idx) {
      // Se não cabe, nova página
      if (y > pageH - 150) { doc.addPage(); y = margin; }
      // Numeração do achado
      doc.setTextColor.apply(doc, C.muted);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('Achado #' + (idx + 1) + ' de ' + sorted.length, pageW - margin, y, { align: 'right' });
      y = drawFindingCard(doc, y, f, margin, pageW, pageH);
    });

    // ─────────── APÊNDICE: TODOS OS COMANDOS ───────────
    doc.addPage();
    y = margin;
    doc.setTextColor.apply(doc, C.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('APÊNDICE — COMANDOS PARA REPLICAR', margin, y + 10);
    y += 34;
    doc.setTextColor.apply(doc, C.muted);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Todos os comandos deste dossiê. Copie e cole no seu terminal para reproduzir os achados.', margin, y);
    y += 18;

    var uniqueCmds = [...new Set(sorted.filter(function (f) { return f.command; }).map(function (f) { return f.command; }))];
    uniqueCmds.forEach(function (cmd, i) {
      if (y > pageH - 40) { doc.addPage(); y = margin; }
      doc.setTextColor.apply(doc, C.muted);
      doc.setFontSize(8);
      doc.text('# Comando ' + (i + 1), margin, y);
      y += 10;
      y = drawTerminalBlock(doc, margin, y, pageW - margin * 2, cmd, { maxLines: 3, fontSize: 8 });
      y += 8;
    });

    // ─────────── FOOTER em todas as páginas ───────────
    var pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      if (i > 1) {
        doc.setDrawColor.apply(doc, C.primary);
        doc.setLineWidth(0.4);
        doc.line(margin, pageH - 30, pageW - margin, pageH - 30);
        doc.setTextColor.apply(doc, C.muted);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('CONFIDENCIAL — ' + r.host, margin, pageH - 16);
        doc.text('Página ' + i + ' de ' + pageCount, pageW - margin, pageH - 16, { align: 'right' });
      }
    }

    var filename = 'dossie_v3_' + r.host.replace(/[^a-z0-9.-]/gi, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
    doc.save(filename);
  }

  window.__t3pdfV3 = { download: downloadPdfV3, loadJsPdf: loadJsPdf };
  console.log('[PDF V3] instalado · use window.__t3pdfV3.download(reconResult)');
})();
