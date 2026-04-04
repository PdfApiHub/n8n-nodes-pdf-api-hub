import { describe, it, expect, afterAll } from 'vitest';
import { postJson, deleteFileByUrl, SAMPLE } from '../helpers/api';

/**
 * Integration tests for Watermark and Sign PDF.
 */

const urlsToCleanup: string[] = [];
afterAll(async () => {
	for (const url of urlsToCleanup) await deleteFileByUrl(url);
});

describe('addWatermark', () => {
	it('should add text watermark → URL output', async () => {
		const { status, data } = await postJson('/v1/watermark', {
			file_url: SAMPLE.PDF,
			text: 'CONFIDENTIAL',
			opacity: 0.15,
			angle: 30,
			output_format: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.watermarked_pdf_url).toBeTruthy();
		if (data.watermarked_pdf_url) urlsToCleanup.push(data.watermarked_pdf_url as string);
	});

	it('should add tiled watermark', async () => {
		const { status, data } = await postJson('/v1/watermark', {
			file_url: SAMPLE.PDF,
			text: 'DRAFT',
			mode: 'tiled',
			opacity: 0.1,
			output_format: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		if (data.watermarked_pdf_url) urlsToCleanup.push(data.watermarked_pdf_url as string);
	});

	it('should support position presets', async () => {
		const { status, data } = await postJson('/v1/watermark', {
			file_url: SAMPLE.PDF,
			text: 'BOTTOM-RIGHT',
			position: 'bottom-right',
			opacity: 0.3,
			angle: 0,
			output_format: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		if (data.watermarked_pdf_url) urlsToCleanup.push(data.watermarked_pdf_url as string);
	});

	it('should support custom color', async () => {
		const { status, data } = await postJson('/v1/watermark', {
			file_url: SAMPLE.PDF,
			text: 'REJECTED',
			color: '#ff0000',
			opacity: 0.3,
			output_format: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		if (data.watermarked_pdf_url) urlsToCleanup.push(data.watermarked_pdf_url as string);
	});
});

describe('signPdf', () => {
	it('should sign a PDF with signature URL → URL output', async () => {
		const { status, data } = await postJson('/v1/sign-pdf', {
			pdf_url: SAMPLE.PDF,
			signature_url: SAMPLE.IMAGE,  // using sample image as "signature"
			output_format: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.signed_pdf_url).toBeTruthy();
		if (data.signed_pdf_url) urlsToCleanup.push(data.signed_pdf_url as string);
	});

	it('should sign specific page with position', async () => {
		const { status, data } = await postJson('/v1/sign-pdf', {
			pdf_url: SAMPLE.PDF,
			signature_url: SAMPLE.IMAGE,
			page: 1,
			position: 'bottom-left',
			output_format: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		if (data.signed_pdf_url) urlsToCleanup.push(data.signed_pdf_url as string);
	});

	it('should sign all pages', async () => {
		const { status, data } = await postJson('/v1/sign-pdf', {
			pdf_url: SAMPLE.PDF,
			signature_url: SAMPLE.IMAGE,
			all_pages: true,
			position: 'center',
			opacity: 0.3,
			output_format: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		if (data.signed_pdf_url) urlsToCleanup.push(data.signed_pdf_url as string);
	});

	it('should return error for missing signature', async () => {
		const { status, data } = await postJson('/v1/sign-pdf', {
			pdf_url: SAMPLE.PDF,
			output_format: 'url',
		});
		expect(status).toBeGreaterThanOrEqual(400);
		expect(data.error).toBeTruthy();
	});
});
