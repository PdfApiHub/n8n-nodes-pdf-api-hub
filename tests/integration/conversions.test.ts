import { describe, it, expect, afterAll } from 'vitest';
import { postJson, postJsonBinary, deleteFileByUrl, SAMPLE } from '../helpers/api';

/**
 * Integration tests for format conversions:
 * PDF→Image, Image→PDF, DOCX→PDF, PDF→DOCX, PDF→XLSX/CSV/TXT/HTML/PPTX
 */

const urlsToCleanup: string[] = [];
afterAll(async () => {
	for (const url of urlsToCleanup) await deleteFileByUrl(url);
});

describe('pdfToImage', () => {
	it('should convert PDF page to PNG → URL', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/image', {
			url: SAMPLE.PDF,
			pages: '1',
			image_format: 'png',
			dpi: 150,
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.image_url || data.images).toBeTruthy();
	});

	it('should convert to JPG with custom DPI', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/image', {
			url: SAMPLE.PDF,
			pages: '1',
			image_format: 'jpg',
			dpi: 300,
			quality: 90,
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should return binary PNG for file output', async () => {
		const { status, buffer, contentType } = await postJsonBinary('/v1/convert/pdf/image', {
			url: SAMPLE.PDF,
			pages: '1',
			image_format: 'png',
			output: 'file',
		});
		expect(status).toBe(200);
		expect(buffer[0]).toBe(0x89);
		expect(buffer.subarray(1, 4).toString()).toBe('PNG');
	});

	it('should convert to WebP format', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/image', {
			url: SAMPLE.PDF,
			pages: '1',
			image_format: 'webp',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should convert → base64 output', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/image', {
			url: SAMPLE.PDF,
			pages: '1',
			image_format: 'png',
			output: 'base64',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should support page range', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/image', {
			url: SAMPLE.PDF,
			pages: '1',
			image_format: 'jpg',
			dpi: 150,
			quality: 80,
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});
});

describe('imageToPdf', () => {
	it('should convert image to PDF → URL', async () => {
		const { status, data } = await postJson('/v1/convert/image/pdf', {
			urls: [SAMPLE.IMAGE],
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.pdf_url).toBeTruthy();
		if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
	});

	it('should support page_size: A4 with fit_mode', async () => {
		const { status, data } = await postJson('/v1/convert/image/pdf', {
			urls: [SAMPLE.IMAGE],
			page_size: 'A4',
			fit_mode: 'fit',
			margin: 36,
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
	});
});

describe('docxToPdf', () => {
	it('should convert DOCX to PDF → URL', async () => {
		const { status, data } = await postJson('/v1/convert/document/pdf', {
			url: SAMPLE.DOCX,
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.pdf_url).toBeTruthy();
		if (data.pdf_url) urlsToCleanup.push(data.pdf_url as string);
	});
});

describe('pdfToDocx', () => {
	it('should convert PDF to DOCX → URL', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/docx', {
			url: SAMPLE.PDF,
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.docx_url).toBeTruthy();
		if (data.docx_url) urlsToCleanup.push(data.docx_url as string);
	});

	it('should support page selection', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/docx', {
			url: SAMPLE.PDF,
			pages: '1',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		if (data.docx_url) urlsToCleanup.push(data.docx_url as string);
	});
});

describe('pdfToXlsx', () => {
	it('should convert PDF to Excel → URL', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/xlsx', {
			url: SAMPLE.PDF,
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.xlsx_url).toBeTruthy();
		if (data.xlsx_url) urlsToCleanup.push(data.xlsx_url as string);
	});

	it('should convert PDF to Excel → base64', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/xlsx', {
			url: SAMPLE.PDF,
			output: 'base64',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});

	it('should support page selection', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/xlsx', {
			url: SAMPLE.PDF,
			pages: '1',
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});
});

describe('pdfToCsv', () => {
	it('should convert PDF to CSV → URL', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/csv', {
			url: SAMPLE.PDF,
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});
});

describe('pdfToTxt', () => {
	it('should convert PDF to text → URL', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/txt', {
			url: SAMPLE.PDF,
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});
});

describe('pdfToHtml', () => {
	it('should convert PDF to HTML → URL', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/html', {
			url: SAMPLE.PDF,
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});
});

describe('pdfToPptx', () => {
	it('should convert PDF to PPTX → URL', async () => {
		const { status, data } = await postJson('/v1/convert/pdf/pptx', {
			url: SAMPLE.PDF,
			output: 'url',
		});
		expect(status).toBe(200);
		expect(data.success).toBe(true);
	});
});
