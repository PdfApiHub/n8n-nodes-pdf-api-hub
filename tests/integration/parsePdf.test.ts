import { describe, it, expect } from 'vitest';
import { postJson, SAMPLE } from '../helpers/api';

/**
 * Integration tests for PDF parsing (text extraction).
 */

describe('parsePdf', () => {
	it('should extract text from PDF → text mode', async () => {
		const { status, data } = await postJson('/v1/pdf/parse', {
			url: SAMPLE.PDF,
			mode: 'text',
			pages: 'all',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.text || data.pages).toBeTruthy();
	});

	it('should extract with layout mode', async () => {
		const { status, data } = await postJson('/v1/pdf/parse', {
			url: SAMPLE.PDF,
			mode: 'layout',
			pages: '1',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should extract tables', async () => {
		const { status, data } = await postJson('/v1/pdf/parse', {
			url: SAMPLE.PDF,
			mode: 'tables',
			pages: '1',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should return error for missing input', async () => {
		const { status, data } = await postJson('/v1/pdf/parse', {
			mode: 'text',
		});
		expect(status).toBeGreaterThanOrEqual(400);
		expect(data.error).toBeTruthy();
	});
});
