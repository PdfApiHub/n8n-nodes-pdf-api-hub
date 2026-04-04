import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart, parseJsonResponseBody, checkApiResponse } from '../helpers';

/* ================================================================
 *  Field descriptions – Compress PDF
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── 1. Input ───────────────────────────────────────────────────
	{
		displayName: 'Input Type',
		name: 'compress_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Default)', value: 'url', description: 'Provide a publicly accessible PDF URL' },
			{ name: 'Binary File', value: 'file', description: 'Use a PDF from a previous node\'s binary output' },
		],
		default: 'url',
		description: 'How to provide the PDF to compress',
		displayOptions: { show: { operation: ['compressPdf'] } },
	},
	{
		displayName: 'PDF URL',
		name: 'compress_url',
		type: 'string',
		default: '',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		description: 'Public URL of the PDF to compress',
		displayOptions: { show: { operation: ['compressPdf'], compress_input_type: ['url'] } },
	},
	{
		displayName: 'Binary Property Name',
		name: 'compress_file_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: { show: { operation: ['compressPdf'], compress_input_type: ['file'] } },
	},

	// ─── 2. Compression ─────────────────────────────────────────────
	{
		displayName: 'Compression Level',
		name: 'compression',
		type: 'options',
		options: [
			{ name: 'Low', value: 'low', description: 'Light cleanup — minimal quality loss' },
			{ name: 'Medium', value: 'medium', description: 'Moderate optimization' },
			{ name: 'High (Default)', value: 'high', description: 'Full optimization — best balance of size and quality' },
			{ name: 'Max', value: 'max', description: 'Most aggressive — maximum compression' },
		],
		default: 'high',
		description: 'How aggressively to compress the PDF. Higher = smaller file but may affect quality.',
		displayOptions: { show: { operation: ['compressPdf'] } },
	},

	// ─── 3. Output ──────────────────────────────────────────────────
	{
		displayName: 'Output Format',
		name: 'compress_output',
		type: 'options',
		options: [
			{ name: 'Binary File (Download) (Default)', value: 'file', description: 'Returns raw PDF binary — great for piping into other nodes' },
			{ name: 'URL (Hosted Link)', value: 'url', description: 'Returns a downloadable URL — file hosted for 30 days' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns the PDF as a base64-encoded string inside JSON' },
		],
		default: 'file',
		description: 'How the compressed PDF is returned. URL/Base64 responses include compression statistics (original size, savings, ratio).',
		displayOptions: { show: { operation: ['compressPdf'] } },
	},
	{
		displayName: 'Output Filename',
		name: 'compress_output_name',
		type: 'string',
		default: 'compressed.pdf',
		placeholder: 'optimized-report.pdf',
		description: 'Filename for the compressed PDF — .pdf is appended automatically if omitted',
		displayOptions: { show: { operation: ['compressPdf'] } },
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
	const compressInputType = this.getNodeParameter('compress_input_type', index) as string;
	const compression = this.getNodeParameter('compression', index) as string;
	const outputType = this.getNodeParameter('compress_output', index) as string;
	const outputName = this.getNodeParameter('compress_output_name', index, 'compressed.pdf') as string;

	const body: Record<string, unknown> = {
		compression,
		output: outputType,
		output_name: outputName,
	};
	if (compressInputType === 'url') {
		body.url = normalizeUrl(this.getNodeParameter('compress_url', index, '') as string);
	}

	const safeName = outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`;

	if (outputType === 'file') {
		const requestOptions = compressInputType === 'file'
			? await createSingleFileMultipart.call(this, index, this.getNodeParameter('compress_file_binary_property', index) as string, body as Record<string, string | number | boolean>)
			: { body, json: true };

		const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
			method: 'POST', url: 'https://pdfapihub.com/api/v1/compressPdf',
			...requestOptions, encoding: 'arraybuffer', returnFullResponse: true, ignoreHttpStatusErrors: true,
		}) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

		if (responseData.statusCode >= 400) {
			let errorBody: unknown;
			try { errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8')); } catch { errorBody = {}; }
			checkApiResponse(this, responseData.statusCode, errorBody, index);
		}
		returnData.push(await prepareBinaryResponse.call(this, index, responseData, safeName, 'application/pdf'));
	} else {
		const requestOptions = compressInputType === 'file'
			? await createSingleFileMultipart.call(this, index, this.getNodeParameter('compress_file_binary_property', index) as string, body as Record<string, string | number | boolean>)
			: { body, json: true };

		const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
			method: 'POST', url: 'https://pdfapihub.com/api/v1/compressPdf',
			...requestOptions, returnFullResponse: true, ignoreHttpStatusErrors: true,
		}) as { body: unknown; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push(parseJsonResponseBody(responseData.body, index));
	}
}
