import { describe, it, expect } from 'vitest';
import { postJson, SAMPLE } from '../helpers/api';

/**
 * Integration tests for URL → rendered HTML (Scrape Website).
 */

describe('fetchHtml', () => {
	it('should fetch rendered HTML from a URL', async () => {
		const { status, data } = await postJson('/v1/url-to-html', {
			url: 'https://example.com',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.html).toBeTruthy();
		expect((data.html as string).length).toBeGreaterThan(100);
		expect(data.url).toBe('https://example.com');
	});

	it('should support wait_until: networkidle', async () => {
		const { status, data } = await postJson('/v1/url-to-html', {
			url: 'https://example.com',
			wait_till: 'networkidle',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.html).toBeTruthy();
	});

	it('should support wait_for_selector', async () => {
		const { status, data } = await postJson('/v1/url-to-html', {
			url: 'https://example.com',
			wait_for_selector: 'h1',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should support custom viewport', async () => {
		const { status, data } = await postJson('/v1/url-to-html', {
			url: 'https://example.com',
			viewport_width: 375,
			viewport_height: 812,
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should return error for missing URL', async () => {
		const { status, data } = await postJson('/v1/url-to-html', {});
		expect(status).toBeGreaterThanOrEqual(400);
		expect(data.error).toBeTruthy();
	});

	it('should support wait_until: commit', async () => {
		const { status, data } = await postJson('/v1/url-to-html', {
			url: 'https://example.com',
			wait_till: 'commit',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should support extra delay (wait_for_timeout)', async () => {
		const { status, data } = await postJson('/v1/url-to-html', {
			url: 'https://example.com',
			wait_for_timeout: 1000,
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should support custom user agent', async () => {
		const { status, data } = await postJson('/v1/url-to-html', {
			url: 'https://example.com',
			user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});
});
