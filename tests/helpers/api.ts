/**
 * Lightweight HTTP client for integration tests.
 * Calls the real pdfapihub.com API using the key from .env
 */

const BASE_URL = 'https://pdfapihub.com/api';

export function getApiKey(): string {
	const key = process.env.PDF_API_KEY;
	if (!key || key === 'your-api-key-here') {
		throw new Error(
			'PDF_API_KEY not set. Copy .env.example to .env and add your API key.',
		);
	}
	return key;
}

/** Headers sent with every request */
function headers(extra: Record<string, string> = {}): Record<string, string> {
	return {
		'CLIENT-API-KEY': getApiKey(),
		...extra,
	};
}

/** POST JSON to an endpoint, return parsed JSON */
export async function postJson<T = Record<string, unknown>>(
	path: string,
	body: Record<string, unknown>,
): Promise<{ status: number; data: T }> {
	const res = await fetch(`${BASE_URL}${path}`, {
		method: 'POST',
		headers: headers({ 'Content-Type': 'application/json' }),
		body: JSON.stringify(body),
	});
	const text = await res.text();
	let data: T;
	try {
		data = JSON.parse(text) as T;
	} catch {
		data = { raw: text } as unknown as T;
	}
	return { status: res.status, data };
}

/** POST JSON and expect a binary response (arraybuffer) */
export async function postJsonBinary(
	path: string,
	body: Record<string, unknown>,
): Promise<{ status: number; buffer: Buffer; contentType: string }> {
	const res = await fetch(`${BASE_URL}${path}`, {
		method: 'POST',
		headers: headers({ 'Content-Type': 'application/json' }),
		body: JSON.stringify(body),
	});
	const buf = Buffer.from(await res.arrayBuffer());
	return {
		status: res.status,
		buffer: buf,
		contentType: res.headers.get('content-type') ?? '',
	};
}

/** GET request, return parsed JSON */
export async function getJson<T = Record<string, unknown>>(
	path: string,
): Promise<{ status: number; data: T }> {
	const res = await fetch(`${BASE_URL}${path}`, {
		method: 'GET',
		headers: headers(),
	});
	const data = (await res.json()) as T;
	return { status: res.status, data };
}

/** Delete a file by URL (cleanup helper) */
export async function deleteFileByUrl(url: string): Promise<void> {
	try {
		await postJson('/v1/file/delete', { url });
	} catch {
		// best-effort cleanup, don't fail tests
	}
}

/** Shared test sample URLs */
export const SAMPLE = {
	PDF: 'https://pdfapihub.com/sample.pdf',
	PDF2: 'https://pdfapihub.com/sample1.pdf',
	IMAGE: 'https://pdfapihub.com/sample-invoicepage.png',
	DOCX: 'https://pdfapihub.com/sample.docx',
	OCR_PDF: 'https://pdfapihub.com/sample-pdfinvoice-with-image.pdf',
};
