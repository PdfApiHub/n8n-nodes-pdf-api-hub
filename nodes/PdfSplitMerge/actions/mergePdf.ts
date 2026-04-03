import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, parseJsonResponseBody, checkApiResponse } from '../helpers';

/* ================================================================
 *  Field descriptions – Merge PDFs
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── 1. Input ───────────────────────────────────────────────────
	{
		displayName: 'Input Type',
		name: 'merge_input_type',
		type: 'options',
		options: [
			{
				name: 'URL (Default)',
				value: 'url',
				description: 'Provide publicly accessible PDF URLs (Google Drive links supported)',
			},
			{
				name: 'Binary File',
				value: 'file',
				description: 'Use PDF files from a previous node\'s binary output',
			},
		],
		default: 'url',
		description: 'How to provide the PDFs to merge (max 25 files)',
		displayOptions: { show: { operation: ['mergePdf'] } },
	},
	{
		displayName: 'PDF URLs',
		name: 'urls',
		type: 'string',
		typeOptions: { multipleValues: true },
		default: [],
		required: true,
		placeholder: 'https://example.com/invoice.pdf',
		description: 'PDF URLs to merge – they are combined in the order listed. Google Drive share links are auto-converted.',
		displayOptions: { show: { operation: ['mergePdf'], merge_input_type: ['url'] } },
	},
	{
		displayName: 'Binary Property Names',
		name: 'merge_files_binary_properties',
		type: 'string',
		typeOptions: { multipleValues: true },
		default: ['data'],
		description: 'Binary property names containing PDFs to merge (e.g. "data"). Files are combined in the order listed.',
		displayOptions: { show: { operation: ['mergePdf'], merge_input_type: ['file'] } },
	},

	// ─── 2. Output ──────────────────────────────────────────────────
	{
		displayName: 'Output Format',
		name: 'output',
		type: 'options',
		options: [
			{
				name: 'URL (Hosted Link) (Default)',
				value: 'url',
				description: 'Returns a downloadable URL – file hosted for 30 days',
			},
			{
				name: 'Base64 (Inline Data)',
				value: 'base64',
				description: 'Returns the merged PDF as a base64-encoded string inside JSON',
			},
			{
				name: 'Binary File (Download)',
				value: 'file',
				description: 'Returns raw PDF binary – great for piping into other nodes',
			},
		],
		default: 'url',
		description: 'How the merged PDF is returned',
		displayOptions: { show: { operation: ['mergePdf'] } },
	},
	{
		displayName: 'Output Filename',
		name: 'merge_output_filename',
		type: 'string',
		default: 'merged.pdf',
		placeholder: 'combined-report.pdf',
		description: 'Filename for the merged PDF – .pdf is appended automatically if omitted',
		displayOptions: { show: { operation: ['mergePdf'] } },
	},
];

/* ================================================================
 *  Execute handler
 * ================================================================ */

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const output = this.getNodeParameter('output', index) as string;
	const mergeInputType = this.getNodeParameter('merge_input_type', index) as string;
	const outputFilename = this.getNodeParameter('merge_output_filename', index, 'merged.pdf') as string;

	const isFileInput = mergeInputType === 'file';
	const body = !isFileInput
		? {
				urls: (this.getNodeParameter('urls', index) as string[]).map(normalizeUrl),
				output,
				output_filename: outputFilename,
			}
		: undefined;

	let multipartBody: Buffer | undefined;
	let multipartBoundary: string | undefined;
	if (isFileInput) {
		const binaryPropertyNamesParam = this.getNodeParameter(
			'merge_files_binary_properties',
			index,
		) as unknown;

		const binaryPropertyNames = (
			Array.isArray(binaryPropertyNamesParam)
				? binaryPropertyNamesParam
				: [binaryPropertyNamesParam]
		)
			.map((v) => String(v ?? '').trim())
			.filter((v) => v !== '');

		if (!binaryPropertyNames.length) {
			throw new NodeOperationError(
				this.getNode(),
				'Please provide at least one Binary Property Name',
				{ itemIndex: index },
			);
		}

		multipartBoundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
		const parts: Buffer[] = [];

		for (const propertyName of binaryPropertyNames) {
			const binaryData = this.helpers.assertBinaryData(index, propertyName);
			const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(index, propertyName);
			const fileName = binaryData.fileName ?? 'file.pdf';
			const contentType = binaryData.mimeType ?? 'application/pdf';

			parts.push(
				Buffer.from(
					`--${multipartBoundary}\r\n` +
						`Content-Disposition: form-data; name="files"; filename="${fileName}"\r\n` +
						`Content-Type: ${contentType}\r\n\r\n`,
				),
			);
			parts.push(Buffer.from(binaryDataBuffer));
			parts.push(Buffer.from('\r\n'));
		}

		// Append output + output_filename fields
		for (const [key, value] of Object.entries({ output, output_filename: outputFilename })) {
			parts.push(
				Buffer.from(
					`--${multipartBoundary}\r\n` +
						`Content-Disposition: form-data; name="${key}"\r\n\r\n` +
						`${value}\r\n`,
				),
			);
		}
		parts.push(Buffer.from(`--${multipartBoundary}--\r\n`));

		multipartBody = Buffer.concat(parts);
	}

	const safeName = outputFilename.endsWith('.pdf') ? outputFilename : `${outputFilename}.pdf`;

	if (output === 'file') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/pdf/merge',
				...(isFileInput
					? {
							body: multipartBody as Buffer,
							headers: {
								'Content-Type': `multipart/form-data; boundary=${multipartBoundary}`,
							},
						}
					: { body, json: true }),
				encoding: 'arraybuffer',
				returnFullResponse: true,
				ignoreHttpStatusErrors: true,
			},
		) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

		if (responseData.statusCode >= 400) {
			let errorBody: unknown;
			try { errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8')); } catch { errorBody = {}; }
			checkApiResponse(this, responseData.statusCode, errorBody, index);
		}

		returnData.push(
			await prepareBinaryResponse.call(
				this,
				index,
				responseData,
				safeName,
				'application/pdf',
			),
		);
	} else {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/pdf/merge',
				...(isFileInput
					? {
							body: multipartBody as Buffer,
							headers: {
								'Content-Type': `multipart/form-data; boundary=${multipartBoundary}`,
							},
						}
					: { body, json: true }),
				returnFullResponse: true,
				ignoreHttpStatusErrors: true,
			},
		) as { body: unknown; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push(parseJsonResponseBody(responseData.body, index));
	}
}
