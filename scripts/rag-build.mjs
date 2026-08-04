#!/usr/bin/env node
/**
 * rag-build.mjs — constrói o índice RAG a partir dos PDFs de livros de segurança.
 *
 * Pipeline:
 *   1. Descobre PDFs em BOOKS_DIR (default: ~/Documents/agentes/ciber segurança/LIVROS HACKERS-.../LIVROS HACKERS)
 *   2. Para cada PDF: extrai texto com pdf-parse
 *   3. Chunca com RecursiveCharacterTextSplitter (512 tokens / 64 overlap)
 *   4. Embeda cada chunk via Ollama /api/embed (nomic-embed-text por default)
 *   5. Salva um arquivo .json.gz por livro em docs/rag-data/
 *   6. Gera um docs/rag-data/_manifest.json com metadados (nome, chunks, tamanho, embedding_dim)
 *
 * Uso:
 *   node scripts/rag-build.mjs                          # todos os PDFs
 *   node scripts/rag-build.mjs --limit 3                # só os 3 primeiros (teste rápido)
 *   node scripts/rag-build.mjs --book "CEH Study Guide" # livro específico
 *   node scripts/rag-build.mjs --model bge-m3           # outro embedder
 *   node scripts/rag-build.mjs --resume                 # pula livros já processados
 *
 * Idempotente: se um livro já tem JSON em docs/rag-data/, pula (a menos que --force).
 */
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { homedir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pdfParseLib = require('pdf-parse');
const PDFParse = pdfParseLib.PDFParse || pdfParseLib.default || pdfParseLib;

// ─── Config ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const next = args[i + 1];
  return (next && !next.startsWith('--')) ? next : true;
};
const BOOKS_DIR = flag('books-dir', 'C:\\Users\\ADM_TI\\Documents\\agentes\\ciber segurança\\LIVROS HACKERS-20260428T155008Z-3-001\\LIVROS HACKERS');
const OUT_DIR = flag('out-dir', 'docs/rag-data');
const MODEL = flag('model', 'nomic-embed-text');
const CHUNK_SIZE = parseInt(flag('chunk-size', '512'), 10);
const CHUNK_OVERLAP = parseInt(flag('chunk-overlap', '64'), 10);
const LIMIT = flag('limit', null);
const BOOK_FILTER = flag('book', null);
const RESUME = flag('resume', true) && !flag('force', false);
const OLLAMA = flag('ollama', 'http://127.0.0.1:11434');

// ─── Log helpers ──────────────────────────────────────────────────────────
const info = (m) => console.log(`  ℹ️  ${m}`);
const ok = (m) => console.log(`  ✅ ${m}`);
const warn = (m) => console.log(`  ⚠️  ${m}`);
const err = (m) => console.log(`  ❌ ${m}`);
const step = (n, total, m) => console.log(`\n[${n}/${total}] ${m}`);

// ─── Chunker: RecursiveCharacterTextSplitter (paridade LangChain) ────────
// Separadores em ordem de preferência: parágrafo → linha → frase → palavra
const SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

// Estimativa grosseira: 1 token ≈ 4 chars (bom para PT+EN)
const CHARS_PER_TOKEN = 4;
const CHUNK_SIZE_CHARS = CHUNK_SIZE * CHARS_PER_TOKEN;
const CHUNK_OVERLAP_CHARS = CHUNK_OVERLAP * CHARS_PER_TOKEN;

function splitBySeparator(text, sep) {
  if (sep === '') return text.split('');
  return text.split(sep).map((s, i, arr) => (i < arr.length - 1 ? s + sep : s));
}

function mergeSplits(splits, sep) {
  const chunks = [];
  let current = '';
  for (const s of splits) {
    if ((current + s).length > CHUNK_SIZE_CHARS && current.length > 0) {
      chunks.push(current);
      // Overlap: mantém últimos CHUNK_OVERLAP_CHARS
      current = current.slice(-CHUNK_OVERLAP_CHARS) + s;
    } else {
      current += s;
    }
  }
  if (current.trim().length > 0) chunks.push(current);
  return chunks;
}

function recursiveSplit(text, separators = SEPARATORS) {
  if (text.length <= CHUNK_SIZE_CHARS) return [text];
  const [sep, ...rest] = separators;
  const splits = splitBySeparator(text, sep);
  // Se ainda tem split muito grande, aplica recursivamente
  const chunks = [];
  let buffer = [];
  let bufLen = 0;
  for (const s of splits) {
    if (s.length > CHUNK_SIZE_CHARS) {
      // flush buffer atual
      if (buffer.length) {
        chunks.push(...mergeSplits(buffer, sep));
        buffer = []; bufLen = 0;
      }
      // recursão com próximo separador
      if (rest.length) chunks.push(...recursiveSplit(s, rest));
      else chunks.push(s.slice(0, CHUNK_SIZE_CHARS));
    } else {
      if (bufLen + s.length > CHUNK_SIZE_CHARS && buffer.length) {
        chunks.push(...mergeSplits(buffer, sep));
        buffer = []; bufLen = 0;
      }
      buffer.push(s);
      bufLen += s.length;
    }
  }
  if (buffer.length) chunks.push(...mergeSplits(buffer, sep));
  return chunks
    .map(c => c.trim())
    .filter(c => c.length >= 50); // descarta chunks muito curtos (footer, header)
}

// ─── Embedding via Ollama ─────────────────────────────────────────────────
async function embed(text) {
  const r = await fetch(`${OLLAMA}/api/embed`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, input: text }),
  });
  if (!r.ok) throw new Error(`embed HTTP ${r.status}`);
  const d = await r.json();
  return d.embeddings[0]; // array de floats
}

async function embedBatch(texts, onProgress) {
  const results = [];
  for (let i = 0; i < texts.length; i++) {
    try {
      const v = await embed(texts[i]);
      results.push(v);
    } catch (e) {
      warn(`embed falhou no chunk ${i}: ${e.message} — usando vetor zero`);
      // Precisa saber a dim: se falhar no primeiro, dá exit
      if (results.length === 0) throw new Error(`Não consegui embedar primeiro chunk: ${e.message}`);
      results.push(new Array(results[0].length).fill(0));
    }
    if (onProgress && (i + 1) % 10 === 0) onProgress(i + 1, texts.length);
  }
  return results;
}

// ─── PDF → texto (pdf-parse v2 usa classe PDFParse) ──────────────────────
async function extractPdf(filepath) {
  const buf = await readFile(filepath);
  const parser = new PDFParse({ data: buf });
  try {
    const data = await parser.getText();
    const pageCount = Array.isArray(data.pages) ? data.pages.length : (data.total || data.pages || 0);
    return { text: data.text || '', pages: pageCount };
  } finally {
    // Libera worker se existir
    if (parser.destroy) try { await parser.destroy(); } catch {}
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n📚 T3MP3ST RAG Builder\n');
  info(`Books dir: ${BOOKS_DIR}`);
  info(`Out dir:   ${OUT_DIR}`);
  info(`Model:     ${MODEL} (via ${OLLAMA})`);
  info(`Chunk:     ${CHUNK_SIZE} tokens (${CHUNK_SIZE_CHARS} chars) / overlap ${CHUNK_OVERLAP}`);

  // Test embed model up
  try {
    const testVec = await embed('teste');
    ok(`Embed model OK — dim ${testVec.length}`);
  } catch (e) {
    err(`Embed model falhou: ${e.message}`);
    err(`Rode: ollama pull ${MODEL}`);
    process.exit(1);
  }

  if (!existsSync(BOOKS_DIR)) { err(`BOOKS_DIR não existe: ${BOOKS_DIR}`); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });

  let pdfs = readdirSync(BOOKS_DIR).filter(f => extname(f).toLowerCase() === '.pdf');
  if (BOOK_FILTER && typeof BOOK_FILTER === 'string') {
    pdfs = pdfs.filter(f => f.toLowerCase().includes(BOOK_FILTER.toLowerCase()));
  }
  if (LIMIT && LIMIT !== true) pdfs = pdfs.slice(0, parseInt(LIMIT, 10));
  info(`${pdfs.length} PDF(s) para processar`);

  const manifest = { model: MODEL, chunkSize: CHUNK_SIZE, chunkOverlap: CHUNK_OVERLAP, books: [], embeddingDim: null, createdAt: new Date().toISOString() };
  const manifestPath = join(OUT_DIR, '_manifest.json');
  const existingManifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
  if (existingManifest && RESUME) {
    manifest.books = existingManifest.books || [];
    manifest.embeddingDim = existingManifest.embeddingDim;
  }

  let totalChunks = 0;
  let totalSize = 0;

  for (let idx = 0; idx < pdfs.length; idx++) {
    const pdfName = pdfs[idx];
    const outName = basename(pdfName, '.pdf').replace(/[^a-z0-9]+/gi, '_').toLowerCase() + '.json.gz';
    const outPath = join(OUT_DIR, outName);
    step(idx + 1, pdfs.length, pdfName);

    if (RESUME && existsSync(outPath) && manifest.books.some(b => b.file === outName)) {
      info(`Já processado (skip via --resume). Delete o arquivo para re-processar.`);
      continue;
    }

    let text, pages;
    try {
      ({ text, pages } = await extractPdf(join(BOOKS_DIR, pdfName)));
      info(`${pages} páginas · ${text.length} chars extraídos`);
    } catch (e) {
      err(`Falha ao extrair PDF: ${e.message}`);
      continue;
    }

    if (text.length < 500) {
      warn(`Texto muito curto (${text.length} chars) — provavelmente PDF de imagem. Skip.`);
      continue;
    }

    const chunks = recursiveSplit(text);
    info(`${chunks.length} chunks (média ${Math.round(text.length / chunks.length)} chars/chunk)`);

    const startEmbed = Date.now();
    const embeddings = await embedBatch(chunks, (done, total) => {
      const pct = Math.round((done / total) * 100);
      const eta = ((Date.now() - startEmbed) / done) * (total - done);
      process.stdout.write(`\r    embedding ${done}/${total} (${pct}%) ETA ${Math.round(eta/1000)}s   `);
    });
    process.stdout.write('\n');
    const embedMs = Date.now() - startEmbed;
    ok(`${chunks.length} embeddings em ${(embedMs/1000).toFixed(1)}s (${(embedMs/chunks.length).toFixed(0)}ms/chunk)`);

    if (!manifest.embeddingDim && embeddings.length) manifest.embeddingDim = embeddings[0].length;

    const doc = {
      source: pdfName,
      pages,
      model: MODEL,
      dim: manifest.embeddingDim,
      chunks: chunks.map((text, i) => ({
        id: i,
        text,
        embedding: embeddings[i],
      })),
    };
    const json = JSON.stringify(doc);
    const gz = gzipSync(json);
    writeFileSync(outPath, gz);
    const sizeMb = (gz.length / 1024 / 1024).toFixed(2);
    ok(`Salvo em ${outPath} (${sizeMb} MB gzipped)`);

    // Atualiza manifest
    manifest.books = manifest.books.filter(b => b.file !== outName);
    manifest.books.push({
      file: outName,
      source: pdfName,
      pages,
      chunks: chunks.length,
      sizeGzMb: parseFloat(sizeMb),
    });
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    totalChunks += chunks.length;
    totalSize += gz.length;
  }

  console.log('\n════════ Resumo ════════');
  console.log(`  Livros processados: ${manifest.books.length}`);
  console.log(`  Chunks totais: ${totalChunks}`);
  console.log(`  Tamanho total: ${(totalSize/1024/1024).toFixed(2)} MB gzipped`);
  console.log(`  Manifest: ${manifestPath}`);
  console.log('');
})();
