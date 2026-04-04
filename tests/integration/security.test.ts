import { describe, it, expect, afterAll } from 'vitest';
import { postJson, postJsonBinary, deleteFileByUrl, SAMPLE } from '../helpers/api';

/**
 * Integration tests for Lock, Unlock, and Compress PDF.
 */

const urlsToCleanup: string[] = [];
afterAll(async () => {
	for (const url of urlsToCleanup) await deleteFileByUrl(url);
});

describe('compressPdf', () => {
	it('should compress a PDF → URL output', async () => {
		const { status, data } = await postJson('/v1/compressPdf', {
			url: SAMPLE.PDF,
			compression: 'high',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		const url = (data.url || data.compressed_pdf_url) as string;
		if (url) urlsToCleanup.push(url);
	});

	it('should compress → binary output', async () => {
		const { status, buffer } = await postJsonBinary('/v1/compressPdf', {
			url: SAMPLE.PDF,
			compression: 'medium',
			output: 'file',
		});
		expect(status).toBe(200);
		expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
	});

	it('should compress → base64 output', async () => {
		const { status, data } = await postJson('/v1/compressPdf', {
			url: SAMPLE.PDF,
			compression: 'high',
			output: 'base64',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.pdf_base64).toBeTruthy();
	});

	it('should support low compression', async () => {
		const { status, data } = await postJson('/v1/compressPdf', {
			url: SAMPLE.PDF,
			compression: 'low',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		const url = (data.url || data.compressed_pdf_url) as string;
		if (url) urlsToCleanup.push(url);
	});

	it('should support max compression', async () => {
		const { status, data } = await postJson('/v1/compressPdf', {
			url: SAMPLE.PDF,
			compression: 'max',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		const url = (data.url || data.compressed_pdf_url) as string;
		if (url) urlsToCleanup.push(url);
	});
});

describe('lockPdf', () => {
	it('should lock a PDF → URL output', async () => {
		const { status, data } = await postJson('/v1/lockPdf', {
			url: SAMPLE.PDF,
			password: 'test123',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		const url = (data.url) as string;
		if (url) urlsToCleanup.push(url);
	});

	it('should lock → binary output', async () => {
		const { status, buffer } = await postJsonBinary('/v1/lockPdf', {
			url: SAMPLE.PDF,
			password: 'test123',
			output: 'file',
		});
		expect(status).toBe(200);
		expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
	});

	it('should return error for missing password', async () => {
		const { status, data } = await postJson('/v1/lockPdf', {
			url: SAMPLE.PDF,
			output: 'url',
		});
		expect(status).toBeGreaterThanOrEqual(400);
		expect(data.error).toBeTruthy();
	});

	it('should lock → base64 output', async () => {
		const { status, data } = await postJson('/v1/lockPdf', {
			url: SAMPLE.PDF,
			password: 'test-b64',
			output: 'base64',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.pdf_base64).toBeTruthy();
	});

	it('should lock with owner password', async () => {
		const { status, data } = await postJson('/v1/lockPdf', {
			url: SAMPLE.PDF,
			password: 'viewer',
			owner_password: 'admin123',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		const url = (data.url) as string;
		if (url) urlsToCleanup.push(url);
	});

	it('should lock with AES-128 encryption', async () => {
		const { status, data } = await postJson('/v1/lockPdf', {
			url: SAMPLE.PDF,
			password: 'aes128test',
			encryption: 'aes128',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		const url = (data.url) as string;
		if (url) urlsToCleanup.push(url);
	});

	it('should lock with permissions (deny copy + modify)', async () => {
		const { status, data } = await postJson('/v1/lockPdf', {
			url: SAMPLE.PDF,
			password: 'permtest',
			owner_password: 'ownerpass',
			permissions: {
				print: true,
				copy: false,
				modify: false,
				annotate: true,
				fill_forms: true,
			},
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		const url = (data.url) as string;
		if (url) urlsToCleanup.push(url);
	});
});

describe('unlockPdf', () => {
	it('should lock then unlock a PDF', async () => {
		// Step 1: Lock
		const lockRes = await postJson('/v1/lockPdf', {
			url: SAMPLE.PDF,
			password: 'unlock-test',
			output: 'url',
		});
		expect(lockRes.status).toBe(200);
		const lockedUrl = lockRes.data.url as string;
		expect(lockedUrl).toBeTruthy();

		// Step 2: Unlock
		const { status, data } = await postJson('/v1/unlockPdf', {
			url: lockedUrl,
			password: 'unlock-test',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);

		// Cleanup
		if (lockedUrl) urlsToCleanup.push(lockedUrl);
		const unlockedUrl = data.url as string;
		if (unlockedUrl) urlsToCleanup.push(unlockedUrl);
	});

	it('should return error for wrong password', async () => {
		// Lock first
		const lockRes = await postJson('/v1/lockPdf', {
			url: SAMPLE.PDF,
			password: 'correct-pass',
			output: 'url',
		});
		const lockedUrl = lockRes.data.url as string;

		// Try unlocking with wrong password
		const { status, data } = await postJson('/v1/unlockPdf', {
			url: lockedUrl,
			password: 'wrong-pass',
			output: 'url',
		});
		expect(status).toBeGreaterThanOrEqual(400);
		expect(data.error).toBeTruthy();

		if (lockedUrl) urlsToCleanup.push(lockedUrl);
	});
});
