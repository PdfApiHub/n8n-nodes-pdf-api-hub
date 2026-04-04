import { describe, it, expect, afterAll } from 'vitest';
import { postJson, postJsonBinary, deleteFileByUrl, SAMPLE } from '../helpers/api';

/**
 * Integration tests for Merge & Split PDF.
 */

const urlsToCleanup: string[] = [];
afterAll(async () => {
	for (const url of urlsToCleanup) await deleteFileByUrl(url);
});

describe('mergePdf', () => {
	it('should merge two PDFs by URL → URL output', async () => {
		const { status, data } = await postJson('/v1/pdf/merge', {
			urls: [SAMPLE.PDF, SAMPLE.PDF2],
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.merged_pdf_url).toBeTruthy();
		if (data.merged_pdf_url) urlsToCleanup.push(data.merged_pdf_url as string);
	});

	it('should merge PDFs → base64 output', async () => {
		const { status, data } = await postJson('/v1/pdf/merge', {
			urls: [SAMPLE.PDF, SAMPLE.PDF2],
			output: 'base64',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.merged_pdf_base64).toBeTruthy();
	});

	it('should merge PDFs → file (binary) output', async () => {
		const { status, buffer } = await postJsonBinary('/v1/pdf/merge', {
			urls: [SAMPLE.PDF, SAMPLE.PDF2],
			output: 'file',
		});
		expect(status).toBe(200);
		expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
	});

	it('should return error for no files', async () => {
		const { status, data } = await postJson('/v1/pdf/merge', {
			urls: [],
			output: 'url',
		});
		expect(status).toBeGreaterThanOrEqual(400);
		expect(data.error).toBeTruthy();
	});
});

describe('splitPdf', () => {
	it('should split PDF by pages → URL output', async () => {
		const { status, data } = await postJson('/v1/pdf/split', {
			url: SAMPLE.PDF,
			pages: '1',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		if (data.split_zip_url) urlsToCleanup.push(data.split_zip_url as string);
	});

	it('should split each page → URL output', async () => {
		const { status, data } = await postJson('/v1/pdf/split', {
			url: SAMPLE.PDF,
			mode: 'each',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.count).toBeGreaterThanOrEqual(1);
		if (data.split_zip_url) urlsToCleanup.push(data.split_zip_url as string);
	});

	it('should split into chunks → base64 output', async () => {
		const { status, data } = await postJson('/v1/pdf/split', {
			url: SAMPLE.PDF,
			chunks: 2,
			output: 'base64',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.zip_base64).toBeTruthy();
	});

	it('should return error for missing input', async () => {
		const { status, data } = await postJson('/v1/pdf/split', {
			output: 'url',
		});
		expect(status).toBeGreaterThanOrEqual(400);
		expect(data.error).toBeTruthy();
	});
});
