import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart, parseJsonResponseBody, checkApiResponse } from '../helpers';

/* ================================================================
 *  Shared handler for PDF → Excel / CSV / Text / HTML / PowerPoint
 *
 *  All five operations share identical UI and logic — only the
 *  API endpoint and default filename differ.
 * ================================================================ */

const ALL_OPS = ['pdfToXlsx', 'pdfToCsv', 'pdfToTxt', 'pdfToHtml', 'pdfToPptx'] as const;

export const description: INodeProperties[] = [
	// ─── 1. Input ───────────────────────────────────────────────────
	{
		displayName: 'Input Type',
		name: 'pdf2x_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Default)', value: 'url', description: 'Provide a publicly accessible PDF URL' },
			{ name: 'Binary File', value: 'file', description: 'Use a PDF from a previous node\'s binary output' },
		],
		default: 'url',
		description: 'How to provide the PDF to convert',
		displayOptions: { show: { operation: [...ALL_OPS] } },
	},
	{
		displayName: 'PDF URL',
		name: 'pdf2x_url',
		type: 'string',
		default: '',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		description: 'Public URL of the PDF to convert',
		displayOptions: { show: { operation: [...ALL_OPS], pdf2x_input_type: ['url'] } },
	},
	{
		displayName: 'Binary Property Name',
		name: 'pdf2x_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: { show: { operation: [...ALL_OPS], pdf2x_input_type: ['file'] } },
	},

	// ─── 2. Page Selection ──────────────────────────────────────────
	{
		displayName: 'Pages (Optional)',
		name: 'pdf2x_pages',
		type: 'string',
		default: '',
		placeholder: '1-3,5',
		description: 'Which pages to convert. Leave empty for all pages. Supports single pages ("3"), ranges ("1-5"), or mixed ("1,3,5-8").',
		displayOptions: { show: { operation: [...ALL_OPS] } },
	},

	// ─── 3. Output ──────────────────────────────────────────────────
	{
		displayName: 'Output Format',
		name: 'pdf2x_output',
		type: 'options',
		options: [
			{ name: 'URL (Hosted Link) (Default)', value: 'url', description: 'Returns a downloadable URL — file hosted for 30 days' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns the file as a base64-encoded string inside JSON' },
			{ name: 'Binary File (Download)', value: 'file', description: 'Returns raw binary — great for piping into other nodes' },
		],
		default: 'url',
		description: 'How the converted file is returned',
		displayOptions: { show: { operation: [...ALL_OPS] } },
	},
	{
		displayName: 'Output Filename',
		name: 'pdf2x_output_filename',
		type: 'string',
		default: '',
		placeholder: 'converted.xlsx',
		description: 'Custom filename for the output. If empty, a default name is used based on the format.',
		displayOptions: { show: { operation: [...ALL_OPS] } },
	},
];

/* ================================================================
 *  Operation → API config mapping
 * ================================================================ */

const OP_CONFIG: Record<string, { endpoint: string; defaultFilename: string; mimeType: string }> = {
	pdfToXlsx: {
		endpoint: 'https://pdfapihub.com/api/v1/convert/pdf/xlsx',
		defaultFilename: 'converted.xlsx',
		mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	},
	pdfToCsv: {
		endpoint: 'https://pdfapihub.com/api/v1/convert/pdf/csv',
		defaultFilename: 'converted.csv',
		mimeType: 'text/csv',
	},
	pdfToTxt: {
		endpoint: 'https://pdfapihub.com/api/v1/convert/pdf/txt',
		defaultFilename: 'converted.txt',
		mimeType: 'text/plain',
	},
	pdfToHtml: {
		endpoint: 'https://pdfapihub.com/api/v1/convert/pdf/html',
		defaultFilename: 'converted.html',
		mimeType: 'text/html',
	},
	pdfToPptx: {
		endpoint: 'https://pdfapihub.com/api/v1/convert/pdf/pptx',
		defaultFilename: 'converted.pptx',
		mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	},
};

/* ================================================================
 *  Execute handler
 * ================================================================ */

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
	operation: string,
): Promise<void> {
	const config = OP_CONFIG[operation];
	if (!config) throw new Error(`Unknown operation: ${operation}`);

	const inputType = this.getNodeParameter('pdf2x_input_type', index, 'url') as string;
	const outputType = this.getNodeParameter('pdf2x_output', index, 'url') as string;
	const outputFilename = this.getNodeParameter('pdf2x_output_filename', index, '') as string || config.defaultFilename;
	const pages = this.getNodeParameter('pdf2x_pages', index, '') as string;

	const body: Record<string, unknown> = {
		output: outputType,
		output_filename: outputFilename,
	};
	if (inputType === 'url') {
		body.url = normalizeUrl(this.getNodeParameter('pdf2x_url', index, '') as string);
	}
	if (pages) body.pages = pages;

	if (outputType === 'file') {
		const requestOptions = inputType === 'file'
			? await createSingleFileMultipart.call(this, index, this.getNodeParameter('pdf2x_binary_property', index, 'data') as string, body as Record<string, string | number | boolean>)
			: { body, json: true };

		const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
			method: 'POST', url: config.endpoint,
			...requestOptions, encoding: 'arraybuffer', returnFullResponse: true, ignoreHttpStatusErrors: true,
		}) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

		if (responseData.statusCode >= 400) {
			let errorBody: unknown;
			try { errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8')); } catch { errorBody = {}; }
			checkApiResponse(this, responseData.statusCode, errorBody, index);
		}

		returnData.push(await prepareBinaryResponse.call(this, index, responseData, outputFilename, config.mimeType));
	} else {
		const requestOptions = inputType === 'file'
			? await createSingleFileMultipart.call(this, index, this.getNodeParameter('pdf2x_binary_property', index, 'data') as string, body as Record<string, string | number | boolean>)
			: { body, json: true };

		const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
			method: 'POST', url: config.endpoint,
			...requestOptions, returnFullResponse: true, ignoreHttpStatusErrors: true,
		}) as { body: unknown; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push(parseJsonResponseBody(responseData.body, index));
	}
}
