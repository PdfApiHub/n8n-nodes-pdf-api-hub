import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { checkApiResponse, parseJsonResponseBody } from '../helpers';

/* ================================================================
 *  Field descriptions – File Management (Upload / List / Delete)
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── Upload File ────────────────────────────────────────────────
	{
		displayName: 'Binary Property Name',
		name: 'file_upload_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the file to upload. Supports any file type (PDF, PNG, DOCX, etc.).',
		displayOptions: { show: { operation: ['uploadFile'] } },
	},
	{
		displayName: 'Custom Filename (Optional)',
		name: 'file_upload_filename',
		type: 'string',
		default: '',
		placeholder: 'my-report.pdf',
		description: 'Override the original filename in storage. Max 120 characters. Leave empty to use the original name.',
		displayOptions: { show: { operation: ['uploadFile'] } },
	},

	// ─── List Files ─────────────────────────────────────────────────
	{
		displayName: 'Limit',
		name: 'file_list_limit',
		type: 'number',
		default: 100,
		typeOptions: { minValue: 1, maxValue: 500 },
		description: 'Maximum number of files to return (1–500). Results are sorted newest first.',
		displayOptions: { show: { operation: ['listFiles'] } },
	},

	// ─── Delete File ────────────────────────────────────────────────
	{
		displayName: 'File URL',
		name: 'file_delete_url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://cdn.pdfapihub.com/pdf/abc123_report.pdf',
		description: 'The URL of the file to delete. You can only delete files uploaded with your own API key.',
		displayOptions: { show: { operation: ['deleteFile'] } },
	},
];

/* ================================================================
 *  Execute handler
 * ================================================================ */

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
	operation: string,
): Promise<void> {
	if (operation === 'uploadFile') {
		await executeUpload.call(this, index, returnData);
	} else if (operation === 'listFiles') {
		await executeList.call(this, index, returnData);
	} else if (operation === 'deleteFile') {
		await executeDelete.call(this, index, returnData);
	}
}

/* ── Upload ────────────────────────────────────────────────────── */

async function executeUpload(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const binaryPropertyName = this.getNodeParameter('file_upload_binary_property', index, 'data') as string;
	const customFilename = this.getNodeParameter('file_upload_filename', index, '') as string;

	const binaryData = this.helpers.assertBinaryData(index, binaryPropertyName);
	const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(index, binaryPropertyName);
	const fileName = customFilename || binaryData.fileName || 'file';
	const contentType = binaryData.mimeType || 'application/octet-stream';

	const boundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
	const parts: Buffer[] = [];

	parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`));
	parts.push(Buffer.from(binaryDataBuffer));
	parts.push(Buffer.from('\r\n'));

	if (customFilename) {
		parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="filename"\r\n\r\n${customFilename}\r\n`));
	}

	parts.push(Buffer.from(`--${boundary}--\r\n`));

	const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
		method: 'POST',
		url: 'https://pdfapihub.com/api/v1/file/upload',
		body: Buffer.concat(parts),
		headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	}) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}

/* ── List ───────────────────────────────────────────────────────── */

async function executeList(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const limit = this.getNodeParameter('file_list_limit', index, 100) as number;

	const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
		method: 'GET',
		url: `https://pdfapihub.com/api/v1/file/list?limit=${limit}`,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	}) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}

/* ── Delete ──────────────────────────────────────────────────────── */

async function executeDelete(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const fileUrl = this.getNodeParameter('file_delete_url', index) as string;

	const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
		method: 'POST',
		url: 'https://pdfapihub.com/api/v1/file/delete',
		body: { url: fileUrl },
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	}) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}
