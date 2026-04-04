import { describe, it, expect, afterAll } from 'vitest';
import { postJson, deleteFileByUrl, SAMPLE } from '../helpers/api';

/**
 * Integration tests for Generate Image (HTML → PNG, URL → PNG).
 */

const urlsToCleanup: string[] = [];
afterAll(async () => {
	for (const url of urlsToCleanup) await deleteFileByUrl(url);
});

describe('generateImage', () => {
	describe('HTML to Image', () => {
		it('should render HTML → URL output', async () => {
			const { status, data } = await postJson('/v1/generateImage', {
				html_content: '<h1 style="color:blue">Hello Test</h1>',
				width: 800,
				height: 400,
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.image_url).toBeTruthy();
			if (data.image_url) urlsToCleanup.push(data.image_url as string);
		});

		it('should render HTML → base64 output', async () => {
			const { status, data } = await postJson('/v1/generateImage', {
				html_content: '<p>Base64 image test</p>',
				width: 400,
				height: 200,
				output_format: 'base64',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.image_base64).toBeTruthy();
		});

		it('should support CSS + Google Fonts', async () => {
			const { status, data } = await postJson('/v1/generateImage', {
				html_content: '<h1 class="fancy">Styled</h1>',
				css_content: '.fancy { font-family: Roboto; font-size: 48px; }',
				font: 'Roboto',
				width: 600,
				height: 300,
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.image_url) urlsToCleanup.push(data.image_url as string);
		});

		it('should support both (URL + base64) output', async () => {
			const { status, data } = await postJson('/v1/generateImage', {
				html_content: '<p>Both output test</p>',
				width: 400,
				height: 200,
				output_format: 'both',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.image_url).toBeTruthy();
			expect(data.image_base64).toBeTruthy();
			if (data.image_url) urlsToCleanup.push(data.image_url as string);
		});

		it('should support dynamic params in HTML', async () => {
			const { status, data } = await postJson('/v1/generateImage', {
				html_content: '<h1>Hello {{name}}</h1>',
				dynamic_params: { name: 'Vitest' },
				width: 400,
				height: 200,
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.image_url) urlsToCleanup.push(data.image_url as string);
		});

		it('should support retina (deviceScaleFactor: 2)', async () => {
			const { status, data } = await postJson('/v1/generateImage', {
				html_content: '<h1>Retina</h1>',
				width: 400,
				height: 200,
				deviceScaleFactor: 2,
				quality: 100,
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.image_url) urlsToCleanup.push(data.image_url as string);
		});
	});

	describe('URL to Image', () => {
		it('should screenshot a URL → URL output', async () => {
			const { status, data } = await postJson('/v1/generateImage', {
				url: 'https://example.com',
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.image_url).toBeTruthy();
			if (data.image_url) urlsToCleanup.push(data.image_url as string);
		});

		it('should support full_page screenshot', async () => {
			const { status, data } = await postJson('/v1/generateImage', {
				url: 'https://example.com',
				full_page: true,
				output_format: 'url',
			});
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			if (data.image_url) urlsToCleanup.push(data.image_url as string);
		});
	});
});
