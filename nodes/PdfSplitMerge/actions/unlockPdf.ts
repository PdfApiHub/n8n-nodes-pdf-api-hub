import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart, parseJsonResponseBody, checkApiResponse } from '../helpers';

/* ================================================================
 *  Field descriptions – Unlock (Decrypt) PDF
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── 1. Input ───────────────────────────────────────────────────
	{
		displayName: 'Input Type',
		name: 'unlock_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Default)', value: 'url', description: 'Provide a publicly accessible PDF URL' },
			{ name: 'Binary File', value: 'file', description: 'Use a PDF from a previous node\'s binary output' },
		],
		default: 'url',
		description: 'How to provide the password-protected PDF',
		displayOptions: { show: { operation: ['unlockPdf'] } },
	},
	{
		displayName: 'PDF URL',
		name: 'unlock_url',
		type: 'string',
		default: '',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		description: 'Public URL of the password-protected PDF',
		displayOptions: { show: { operation: ['unlockPdf'], unlock_input_type: ['url'] } },
	},
	{
		displayName: 'Binary Property Name',
		name: 'unlock_file_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the protected PDF file',
		displayOptions: { show: { operation: ['unlockPdf'], unlock_input_type: ['file'] } },
	},

	// ─── 2. Password ────────────────────────────────────────────────
	{
		displayName: 'Password',
		name: 'unlock_password',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		description: 'The password to decrypt and unlock the PDF',
		displayOptions: { show: { operation: ['unlockPdf'] } },
	},

	// ─── 3. Output ──────────────────────────────────────────────────
	{
		displayName: 'Output Format',
		name: 'unlock_output',
		type: 'options',
		options: [
			{ name: 'Binary File (Download) (Default)', value: 'file', description: 'Returns raw PDF binary — great for piping into other nodes' },
			{ name: 'URL (Hosted Link)', value: 'url', description: 'Returns a downloadable URL — file hosted for 30 days' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns the PDF as a base64-encoded string inside JSON' },
		],
		default: 'file',
		description: 'How the unlocked PDF is returned',
		displayOptions: { show: { operation: ['unlockPdf'] } },
	},
	{
		displayName: 'Output Filename',
		name: 'unlock_output_name',
		type: 'string',
		default: 'unlocked.pdf',
		placeholder: 'decrypted-report.pdf',
		description: 'Filename for the unlocked PDF — .pdf is appended automatically if omitted',
		displayOptions: { show: { operation: ['unlockPdf'] } },
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
	const unlockInputType = this.getNodeParameter('unlock_input_type', index) as string;
	const password = this.getNodeParameter('unlock_password', index) as string;
	const outputType = this.getNodeParameter('unlock_output', index) as string;
	const outputName = this.getNodeParameter('unlock_output_name', index, 'unlocked.pdf') as string;

	const body: Record<string, unknown> = {
		password,
		output: outputType,
		output_name: outputName,
	};
	if (unlockInputType === 'url') {
		body.url = normalizeUrl(this.getNodeParameter('unlock_url', index, '') as string);
	}

	const safeName = outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`;

	if (outputType === 'file') {
		const requestOptions = unlockInputType === 'file'
			? await createSingleFileMultipart.call(this, index, this.getNodeParameter('unlock_file_binary_property', index) as string, body as Record<string, string | number | boolean>)
			: { body, json: true };

		const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
			method: 'POST', url: 'https://pdfapihub.com/api/v1/unlockPdf',
			...requestOptions, encoding: 'arraybuffer', returnFullResponse: true, ignoreHttpStatusErrors: true,
		}) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

		if (responseData.statusCode >= 400) {
			let errorBody: unknown;
			try { errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8')); } catch { errorBody = {}; }
			checkApiResponse(this, responseData.statusCode, errorBody, index);
		}
		returnData.push(await prepareBinaryResponse.call(this, index, responseData, safeName, 'application/pdf'));
	} else {
		const requestOptions = unlockInputType === 'file'
			? await createSingleFileMultipart.call(this, index, this.getNodeParameter('unlock_file_binary_property', index) as string, body as Record<string, string | number | boolean>)
			: { body, json: true };

		const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
			method: 'POST', url: 'https://pdfapihub.com/api/v1/unlockPdf',
			...requestOptions, returnFullResponse: true, ignoreHttpStatusErrors: true,
		}) as { body: unknown; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push(parseJsonResponseBody(responseData.body, index));
	}
}
