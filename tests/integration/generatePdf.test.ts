import { describe, it, expect, afterAll } from 'vitest';
import { postJson, postJsonBinary, deleteFileByUrl, SAMPLE } from '../helpers/api';

/**
 * Integration tests for HTML/URL → PDF generation.
 * Tests all output formats and key features.
 */

const urlsToCleanup: string[] = [];

afterAll(async () => {
	for (const url of urlsToCleanup) {
		await deleteFileByUrl(url);
	}
});

describe('generatePdf', () => {
	// ─── HTML to PDF ──────────────────────────────────────────────
	describe('HTML to PDF', () => {
		it('should generate PDF from HTML → URL output', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1>Test</h1><p>Integration test</p>',
				output_format: 'url',
				paper_size: 'A4',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.pdf_url).toBeTruthy();
			expect(typeof data.file_size_bytes).toBe('number');
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should generate PDF from HTML → base64 output', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1>Base64 Test</h1>',
				output_format: 'base64',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.pdf_base64).toBeTruthy();
			expect(typeof data.pdf_base64).toBe('string');
		});

		it('should generate PDF from HTML → file (binary) output', async () => {
			const { status, buffer, contentType } = await postJsonBinary('/v1/generatePdf', {
				html_content: '<h1>Binary Test</h1>',
				output_format: 'file',
			});
			expect(status).toBe(200);
			expect(contentType).toContain('pdf');
			expect(buffer.length).toBeGreaterThan(100);
			// PDF magic bytes
			expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
		});

		it('should support CSS content', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1 class="red">Styled</h1>',
				css_content: '.red { color: red; font-size: 48px; }',
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support dynamic params', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1>Hello {{name}}</h1><p>Date: {{date}}</p>',
				dynamic_params: { name: 'Vitest', date: '2026-04-04' },
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support margins', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1>Margins</h1>',
				margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support landscape orientation', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1>Landscape</h1>',
				landscape: true,
				paper_size: 'A4',
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});
	});

	// ─── URL to PDF ───────────────────────────────────────────────
	describe('URL to PDF', () => {
		it('should capture URL → URL output', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				url: 'https://example.com',
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.pdf_url).toBeTruthy();
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support wait_until: networkidle', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				url: 'https://example.com',
				wait_until: 'networkidle',
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should return binary PDF for file output', async () => {
			const { status, buffer, contentType } = await postJsonBinary('/v1/generatePdf', {
				url: 'https://example.com',
				output_format: 'file',
			});
			expect(status).toBe(200);
			expect(contentType).toContain('pdf');
			expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
		});
	});

	// ─── Error cases ──────────────────────────────────────────────
	describe('Error handling', () => {
		it('should return error for missing input', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				output_format: 'url',
			});
			expect(status).toBeGreaterThanOrEqual(400);
			expect(data.error).toBeTruthy();
		});
	});

	// ─── Paper sizes & page setup ─────────────────────────────────
	describe('Page setup combinations', () => {
		it('should support Letter paper size', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1>Letter</h1>',
				paper_size: 'Letter',
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support A3 paper size with landscape', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1>A3 Landscape</h1>',
				paper_size: 'A3',
				landscape: true,
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support margin presets', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1>Large margins</h1>',
				margin: 'large',
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support print_background: false', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<div style="background:red;padding:20px"><h1>No BG</h1></div>',
				print_background: false,
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support displayHeaderFooter', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1>Header Footer</h1>',
				displayHeaderFooter: true,
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support max page_size limit', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1>Max 1 page</h1>' + '<p>Content</p>'.repeat(100),
				page_size: 1,
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support custom viewport', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1>Custom viewport</h1>',
				viewPortWidth: 1920,
				viewPortHeight: 1080,
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support Google Fonts', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				html_content: '<h1 style="font-family: Roboto">Roboto Font</h1>',
				font: 'Roboto',
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});
	});

	// ─── URL to PDF combinations ──────────────────────────────────
	describe('URL to PDF combinations', () => {
		it('should support base64 output from URL', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				url: 'https://example.com',
				output_format: 'base64',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.pdf_base64).toBeTruthy();
		});

		it('should support cookie_accept_text', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				url: 'https://example.com',
				cookie_accept_text: 'Accept ALL',
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support wait_until: domcontentloaded', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				url: 'https://example.com',
				wait_until: 'domcontentloaded',
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});

		it('should support full_page: false', async () => {
			const { status, data } = await postJson('/v1/generatePdf', {
				url: 'https://example.com',
				full_page: false,
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
		});
	});
});
