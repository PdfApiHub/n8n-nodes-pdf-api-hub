import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Extract a human-readable error message from an API error response.
 * n8n's httpRequestWithAuthentication throws generic HTTP errors;
 * this helper digs into the response body to surface the real API message.
 */
export function throwApiError(context: IExecuteFunctions, error: unknown, itemIndex: number): never {
	const err = error as Record<string, unknown>;

	// Try to extract the API's JSON error body
	let apiMessage: string | undefined;
	let responseBody: Record<string, unknown> | undefined;

	// n8n attaches the response in different places depending on version
	const candidates = [
		err.response,
		err.cause,
		(err.cause as Record<string, unknown>)?.response,
	];

	for (const candidate of candidates) {
		if (!candidate || typeof candidate !== 'object') continue;
		const c = candidate as Record<string, unknown>;

		// Try body.error (string)
		const body = c.body ?? c.data;
		if (body && typeof body === 'object') {
			const b = body as Record<string, unknown>;
			if (typeof b.error === 'string') {
				apiMessage = b.error;
				responseBody = b;
				break;
			}
		}
		if (typeof body === 'string') {
			try {
				const parsed = JSON.parse(body) as Record<string, unknown>;
				if (typeof parsed.error === 'string') {
					apiMessage = parsed.error;
					responseBody = parsed;
					break;
				}
			} catch { /* not JSON */ }
		}
	}

	// Also check if the error itself has a description or message with JSON
	if (!apiMessage && typeof err.message === 'string') {
		try {
			const parsed = JSON.parse(err.message) as Record<string, unknown>;
			if (typeof parsed.error === 'string') {
				apiMessage = parsed.error;
				responseBody = parsed;
			}
		} catch { /* not JSON */ }
	}

	const message = apiMessage
		?? (error instanceof Error ? error.message : 'Unknown API error');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	throw new NodeApiError(context.getNode(), (responseBody ?? { error: message }) as any, {
		message,
		itemIndex,
	});
}

/**
 * Normalize a URL string – add https:// if no protocol present.
 */
export function normalizeUrl(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return trimmed;
	}
	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		return trimmed;
	}
	return `https://${trimmed}`;
}

/**
 * Build a binary response item from an API response with ArrayBuffer body.
 */
export async function prepareBinaryResponse(
	this: IExecuteFunctions,
	itemIndex: number,
	responseData: { body: ArrayBuffer; headers?: Record<string, unknown> },
	fallbackFileName: string,
	fallbackMimeType: string,
): Promise<INodeExecutionData> {
	const headers = responseData.headers ?? {};
	const contentTypeHeader =
		(typeof headers['content-type'] === 'string' ? headers['content-type'] : undefined) ??
		(typeof headers['Content-Type'] === 'string' ? headers['Content-Type'] : undefined);

	const contentType = contentTypeHeader?.split(';')[0]?.trim() || fallbackMimeType;
	let fileName = fallbackFileName;

	if (!fileName) {
		fileName = 'output';
	}

	if (!fileName.includes('.') && contentType.includes('/')) {
		const ext = contentType.includes('pdf')
			? 'pdf'
			: contentType.includes('zip')
				? 'zip'
				: 'bin';
		fileName = `${fileName}.${ext}`;
	}

	const binaryData = await this.helpers.prepareBinaryData(
		Buffer.from(responseData.body),
		fileName,
		contentType,
	);

	return {
		json: { success: true },
		binary: { data: binaryData },
		pairedItem: { item: itemIndex },
	};
}

/**
 * Build multipart/form-data payload with a single file + extra fields.
 */
export async function createSingleFileMultipart(
	this: IExecuteFunctions,
	itemIndex: number,
	binaryPropertyName: string,
	fields: Record<string, string | number | boolean>,
) {
	const boundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
	const fileName = binaryData.fileName ?? 'file.pdf';
	const contentType = binaryData.mimeType ?? 'application/pdf';

	const parts: Buffer[] = [];
	parts.push(
		Buffer.from(
			`--${boundary}\r\n` +
				`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
				`Content-Type: ${contentType}\r\n\r\n`,
		),
	);
	parts.push(Buffer.from(binaryDataBuffer));
	parts.push(Buffer.from('\r\n'));

	for (const [key, value] of Object.entries(fields)) {
		parts.push(
			Buffer.from(
				`--${boundary}\r\n` +
					`Content-Disposition: form-data; name="${key}"\r\n\r\n` +
					`${String(value)}\r\n`,
			),
		);
	}

	parts.push(Buffer.from(`--${boundary}--\r\n`));

	return {
		body: Buffer.concat(parts),
		headers: {
			'Content-Type': `multipart/form-data; boundary=${boundary}`,
		},
	};
}

/**
 * Build multipart/form-data payload with two files + a method field.
 */
export async function createTwoFileMultipart(
	this: IExecuteFunctions,
	itemIndex: number,
	file1BinaryProperty: string,
	file2BinaryProperty: string,
	method: string,
) {
	const boundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
	const parts: Buffer[] = [];

	const appendFile = async (fieldName: 'file1' | 'file2', binaryPropertyName: string) => {
		const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
		const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
		const fileName = binaryData.fileName ?? `${fieldName}.bin`;
		const contentType = binaryData.mimeType ?? 'application/octet-stream';

		parts.push(
			Buffer.from(
				`--${boundary}\r\n` +
					`Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n` +
					`Content-Type: ${contentType}\r\n\r\n`,
			),
		);
		parts.push(Buffer.from(binaryDataBuffer));
		parts.push(Buffer.from('\r\n'));
	};

	await appendFile('file1', file1BinaryProperty);
	await appendFile('file2', file2BinaryProperty);

	if (method) {
		parts.push(
			Buffer.from(
				`--${boundary}\r\n` +
					'Content-Disposition: form-data; name="method"\r\n\r\n' +
					`${method}\r\n`,
			),
		);
	}

	parts.push(Buffer.from(`--${boundary}--\r\n`));

	return {
		body: Buffer.concat(parts),
		headers: {
			'Content-Type': `multipart/form-data; boundary=${boundary}`,
		},
	};
}

/**
 * Parse a response body that may be JSON string, Buffer, or object.
 * Returns an INodeExecutionData item.
 */
export function parseJsonResponseBody(
	responseBody: unknown,
	itemIndex: number,
): INodeExecutionData {
	if (typeof responseBody === 'string') {
		try {
			return { json: JSON.parse(responseBody), pairedItem: { item: itemIndex } };
		} catch {
			return { json: { raw: responseBody }, pairedItem: { item: itemIndex } };
		}
	} else if (Buffer.isBuffer(responseBody)) {
		const text = responseBody.toString('utf8');
		try {
			return { json: JSON.parse(text), pairedItem: { item: itemIndex } };
		} catch {
			return { json: { raw: text }, pairedItem: { item: itemIndex } };
		}
	} else {
		return {
			json: (responseBody ?? {}) as IDataObject,
			pairedItem: { item: itemIndex },
		};
	}
}
