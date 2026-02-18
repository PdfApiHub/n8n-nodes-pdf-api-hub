#!/usr/bin/env node
/**
 * Smoke test: create two minimal PDFs in-memory and POST to PDF API Hub merge endpoint
 * using multipart/form-data with repeated `files` fields (like: curl -F "files=@a.pdf" -F "files=@b.pdf").
 *
 * Usage:
 *   PDF_API_HUB_KEY=... node scripts/smoke-merge-binary.mjs
 *   PDF_API_HUB_KEY=... node scripts/smoke-merge-binary.mjs --out merged.pdf
 */

import { writeFile } from 'node:fs/promises';

function pad10(n) {
	return String(n).padStart(10, '0');
}

function createMinimalPdf(text) {
	// Minimal single-page PDF with Helvetica and one text draw.
	// Generates a correct xref table by computing byte offsets.
	const chunks = [];
	let length = 0;
	const offsets = new Array(6).fill(0);

	const pushAscii = (s) => {
		const b = Buffer.from(s, 'ascii');
		chunks.push(b);
		length += b.length;
	};

	// PDF header + binary comment
	pushAscii('%PDF-1.4\n');
	chunks.push(Buffer.from([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // %âãÏÓ\n
	length += 6;

	offsets[1] = length;
	pushAscii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

	offsets[2] = length;
	pushAscii('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

	offsets[3] = length;
	pushAscii(
		'3 0 obj\n' +
			'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
			'/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\n' +
			'endobj\n',
	);

	const safeText = String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
	const content = `BT\n/F1 24 Tf\n72 720 Td\n(${safeText}) Tj\nET\n`;
	const contentLen = Buffer.byteLength(content, 'ascii');

	offsets[4] = length;
	pushAscii(`4 0 obj\n<< /Length ${contentLen} >>\nstream\n`);
	pushAscii(content);
	pushAscii('endstream\nendobj\n');

	offsets[5] = length;
	pushAscii('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

	const xrefOffset = length;
	pushAscii('xref\n0 6\n');
	pushAscii('0000000000 65535 f \n');
	for (let i = 1; i <= 5; i++) {
		pushAscii(`${pad10(offsets[i])} 00000 n \n`);
	}

	pushAscii('trailer\n<< /Size 6 /Root 1 0 R >>\n');
	pushAscii(`startxref\n${xrefOffset}\n%%EOF\n`);

	return Buffer.concat(chunks);
}

function getArgValue(flag, defaultValue) {
	const idx = process.argv.indexOf(flag);
	if (idx === -1) return defaultValue;
	const val = process.argv[idx + 1];
	if (!val || val.startsWith('--')) return defaultValue;
	return val;
}

async function main() {
	const apiKey = 'pdfapi_98fc4255082545008e752153e9e4ec5e';
	if (!apiKey) {
		console.error('Missing env var PDF_API_HUB_KEY');
		process.exit(2);
	}

	const outPath = getArgValue('--out', 'merged.pdf');

	const pdfA = createMinimalPdf('Hello from in-memory PDF A');
	const pdfB = createMinimalPdf('Hello from in-memory PDF B');

	const form = new FormData();
	form.append('files', new Blob([pdfA], { type: 'application/pdf' }), 'a.pdf');
	form.append('files', new Blob([pdfB], { type: 'application/pdf' }), 'b.pdf');
	form.append('output', 'file');

	const res = await fetch('https://pdfapihub.com/api/v1/pdf/merge', {
		method: 'POST',
		headers: {
			'CLIENT-API-KEY': apiKey,
		},
		body: form,
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		console.error(`HTTP ${res.status} ${res.statusText}`);
		if (text) console.error(text);
		process.exit(1);
	}

	const contentType = res.headers.get('content-type') ?? '';
	const bytes = Buffer.from(await res.arrayBuffer());

	if (!contentType.includes('pdf') && !contentType.includes('zip') && !contentType.includes('octet-stream')) {
		console.warn(`Unexpected content-type: ${contentType}`);
	}

	await writeFile(outPath, bytes);
	console.log(`Wrote ${bytes.length} bytes to ${outPath}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
