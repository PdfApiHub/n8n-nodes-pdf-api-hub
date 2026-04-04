import { describe, it, expect } from 'vitest';
import { postJson, SAMPLE } from '../helpers/api';

/**
 * Integration tests for PDF OCR and Image OCR.
 */

describe('pdfOcrParse', () => {
	it('should OCR a PDF page → JSON', async () => {
		const { status, data } = await postJson('/v1/pdf/ocr/parse', {
			url: SAMPLE.OCR_PDF,
			pages: '1',
			lang: 'eng',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.full_text || data.pages).toBeTruthy();
	});

	it('should OCR with detail: words', async () => {
		const { status, data } = await postJson('/v1/pdf/ocr/parse', {
			url: SAMPLE.OCR_PDF,
			pages: '1',
			detail: 'words',
			dpi: 200,
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should support char_whitelist (digits only)', async () => {
		const { status, data } = await postJson('/v1/pdf/ocr/parse', {
			url: SAMPLE.OCR_PDF,
			pages: '1',
			char_whitelist: '0123456789.$,-',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should support output_format: text (plain text)', async () => {
		const res = await fetch('https://pdfapihub.com/api/v1/pdf/ocr/parse', {
			method: 'POST',
			headers: { 'CLIENT-API-KEY': process.env.PDF_API_KEY!, 'Content-Type': 'application/json' },
			body: JSON.stringify({ url: SAMPLE.OCR_PDF, pages: '1', output_format: 'text' }),
		});
		expect(res.status).toBe(200);
		const text = await res.text();
		expect(text.length).toBeGreaterThan(0);
	});

	it('should support high DPI (300)', async () => {
		const { status, data } = await postJson('/v1/pdf/ocr/parse', {
			url: SAMPLE.OCR_PDF,
			pages: '1',
			dpi: 300,
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should support multiple pages', async () => {
		const { status, data } = await postJson('/v1/pdf/ocr/parse', {
			url: SAMPLE.OCR_PDF,
			pages: 'all',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});
});

describe('imageOcrParse', () => {
	it('should OCR an image → JSON', async () => {
		const { status, data } = await postJson('/v1/image/ocr/parse', {
			image_url: SAMPLE.IMAGE,
			lang: 'eng',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.text).toBeTruthy();
		expect(typeof data.confidence).toBe('number');
	});

	it('should support preprocessing: grayscale + sharpen', async () => {
		const { status, data } = await postJson('/v1/image/ocr/parse', {
			image_url: SAMPLE.IMAGE,
			grayscale: true,
			sharpen: true,
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should support detail: words with bounding boxes', async () => {
		const { status, data } = await postJson('/v1/image/ocr/parse', {
			image_url: SAMPLE.IMAGE,
			detail: 'words',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		// words array should be present
		expect(data.words || data.text).toBeTruthy();
	});

	it('should support resize preprocessing', async () => {
		const { status, data } = await postJson('/v1/image/ocr/parse', {
			image_url: SAMPLE.IMAGE,
			resize: 2.0,
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should support threshold preprocessing', async () => {
		const { status, data } = await postJson('/v1/image/ocr/parse', {
			image_url: SAMPLE.IMAGE,
			grayscale: true,
			threshold: 128,
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should return error for missing image', async () => {
		const { status, data } = await postJson('/v1/image/ocr/parse', {});
		expect(status).toBeGreaterThanOrEqual(400);
		expect(data.error).toBeTruthy();
	});
});
