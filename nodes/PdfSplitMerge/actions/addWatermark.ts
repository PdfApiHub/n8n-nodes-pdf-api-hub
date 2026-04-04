import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, parseJsonResponseBody, checkApiResponse } from '../helpers';

/* ================================================================
 *  Field descriptions – Add Watermark (text or image)
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── 1. Input ───────────────────────────────────────────────────
	{
		displayName: 'Input Type',
		name: 'watermark_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Default)', value: 'url', description: 'Provide a public URL to a PDF or image' },
			{ name: 'Base64', value: 'base64', description: 'Provide base64-encoded file content' },
			{ name: 'Binary File', value: 'file', description: 'Use a file from a previous node\'s binary output' },
		],
		default: 'url',
		description: 'How to provide the PDF or image to watermark',
		displayOptions: { show: { operation: ['addWatermark'] } },
	},
	{
		displayName: 'File URL',
		name: 'watermark_url',
		type: 'string',
		default: '',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		description: 'Public URL of the PDF or image to watermark',
		displayOptions: { show: { operation: ['addWatermark'], watermark_input_type: ['url'] } },
	},
	{
		displayName: 'Base64 File',
		name: 'watermark_base64',
		type: 'string',
		default: '',
		description: 'Base64-encoded PDF or image content',
		displayOptions: { show: { operation: ['addWatermark'], watermark_input_type: ['base64'] } },
	},
	{
		displayName: 'Binary Property Name',
		name: 'watermark_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the file to watermark',
		displayOptions: { show: { operation: ['addWatermark'], watermark_input_type: ['file'] } },
	},

	// ─── 2. Watermark Content ───────────────────────────────────────
	{
		displayName: 'Watermark Text',
		name: 'watermark_text',
		type: 'string',
		default: 'CONFIDENTIAL',
		placeholder: 'DRAFT',
		description: 'Text to overlay as watermark. Leave empty if using an image watermark instead.',
		displayOptions: { show: { operation: ['addWatermark'] } },
	},

	// ─── 3. Appearance ──────────────────────────────────────────────
	{
		displayName: 'Opacity',
		name: 'watermark_opacity',
		type: 'number',
		default: 0.15,
		typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
		description: 'Watermark transparency — 0 = invisible, 1 = fully opaque. 0.15 is subtle.',
		displayOptions: { show: { operation: ['addWatermark'] } },
	},
	{
		displayName: 'Angle',
		name: 'watermark_angle',
		type: 'number',
		default: 30,
		description: 'Rotation angle in degrees (counter-clockwise). 0 = horizontal, 45 = diagonal.',
		displayOptions: { show: { operation: ['addWatermark'] } },
	},
	{
		displayName: 'Position',
		name: 'watermark_position',
		type: 'options',
		options: [
			{ name: 'Center (Default)', value: 'center' },
			{ name: 'Top Left', value: 'top-left' },
			{ name: 'Top Center', value: 'top-center' },
			{ name: 'Top Right', value: 'top-right' },
			{ name: 'Bottom Left', value: 'bottom-left' },
			{ name: 'Bottom Center', value: 'bottom-center' },
			{ name: 'Bottom Right', value: 'bottom-right' },
		],
		default: 'center',
		description: 'Where to place the watermark on each page',
		displayOptions: { show: { operation: ['addWatermark'] } },
	},
	{
		displayName: 'Mode',
		name: 'watermark_mode',
		type: 'options',
		options: [
			{ name: 'Single (Default)', value: 'single', description: 'One watermark at the chosen position' },
			{ name: 'Tiled', value: 'tiled', description: 'Repeat diagonally across the entire page' },
		],
		default: 'single',
		description: 'Place one watermark or tile it across the entire page',
		displayOptions: { show: { operation: ['addWatermark'] } },
	},

	// ─── 4. Output ──────────────────────────────────────────────────
	{
		displayName: 'Output Format',
		name: 'watermark_output',
		type: 'options',
		options: [
			{ name: 'Binary File (Download) (Default)', value: 'file', description: 'Returns raw binary — great for piping into other nodes' },
			{ name: 'URL (Hosted Link)', value: 'url', description: 'Returns a downloadable URL — file hosted for 30 days' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns the file as a base64-encoded string inside JSON' },
			{ name: 'Both (URL + Base64)', value: 'both', description: 'Returns both URL and base64 in one response' },
		],
		default: 'file',
		description: 'How the watermarked file is returned',
		displayOptions: { show: { operation: ['addWatermark'] } },
	},

	// ─── 5. Advanced Options ────────────────────────────────────────
	{
		displayName: 'Advanced Options',
		name: 'watermarkAdvancedOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { operation: ['addWatermark'] } },
		options: [
			{
				displayName: 'Text Color',
				name: 'color',
				type: 'string',
				default: '#000000',
				placeholder: '#ff0000',
				description: 'Hex color for the watermark text (e.g. #ff0000 for red). Ignored for image watermarks.',
			},
			{
				displayName: 'Font Size',
				name: 'font_size',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Font size in points. 0 = auto-calculated (10% of page size).',
			},
			{
				displayName: 'Watermark Image URL',
				name: 'watermark_image_url',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/logo.png',
				description: 'URL to a logo/image to overlay instead of text. PNG transparency supported.',
			},
			{
				displayName: 'Watermark Image (Base64)',
				name: 'base64_watermark_image',
				type: 'string',
				default: '',
				description: 'Base64-encoded watermark image (alternative to URL)',
			},
		],
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
	const inputType = this.getNodeParameter('watermark_input_type', index) as string;
	const text = this.getNodeParameter('watermark_text', index, 'CONFIDENTIAL') as string;
	const opacity = this.getNodeParameter('watermark_opacity', index) as number;
	const angle = this.getNodeParameter('watermark_angle', index) as number;
	const position = this.getNodeParameter('watermark_position', index, 'center') as string;
	const mode = this.getNodeParameter('watermark_mode', index, 'single') as string;
	const outputFormat = this.getNodeParameter('watermark_output', index) as string;

	// Advanced options
	const advanced = this.getNodeParameter('watermarkAdvancedOptions', index, {}) as Record<string, unknown>;
	const color = (advanced.color as string | undefined) ?? '#000000';

	// Backward compat for legacy font_size
	let fontSize = advanced.font_size as number | undefined;
	if (fontSize === undefined) {
		try { fontSize = this.getNodeParameter('watermark_font_size', index) as number; } catch { fontSize = 0; }
	}

	const watermarkImageUrl = (advanced.watermark_image_url as string | undefined) ?? '';
	const base64WatermarkImage = (advanced.base64_watermark_image as string | undefined) ?? '';

	let multipartBody: Buffer | undefined;
	let multipartBoundary: string | undefined;
	let body: Record<string, unknown> | undefined;

	if (inputType === 'file') {
		const binaryPropertyName = this.getNodeParameter('watermark_binary_property', index) as string;
		const binaryData = this.helpers.assertBinaryData(index, binaryPropertyName);
		const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(index, binaryPropertyName);
		const fileName = binaryData.fileName ?? 'file.pdf';
		const contentType = binaryData.mimeType ?? 'application/pdf';

		multipartBoundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
		const parts: Buffer[] = [];

		parts.push(Buffer.from(`--${multipartBoundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`));
		parts.push(Buffer.from(binaryDataBuffer));
		parts.push(Buffer.from('\r\n'));

		const formFields: Record<string, string | number> = { text, opacity, angle, position, mode, output_format: outputFormat, color };
		if (fontSize && fontSize > 0) formFields.font_size = fontSize;
		for (const [key, val] of Object.entries(formFields)) {
			parts.push(Buffer.from(`--${multipartBoundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`));
		}
		parts.push(Buffer.from(`--${multipartBoundary}--\r\n`));
		multipartBody = Buffer.concat(parts);
	} else {
		body = { text, opacity, angle, position, mode, output_format: outputFormat, color };
		if (fontSize && fontSize > 0) body.font_size = fontSize;
		if (watermarkImageUrl) body.watermark_image_url = watermarkImageUrl;
		if (base64WatermarkImage) body.base64_watermark_image = base64WatermarkImage;

		if (inputType === 'url') {
			body.file_url = normalizeUrl(this.getNodeParameter('watermark_url', index) as string);
		} else {
			body.base64_file = this.getNodeParameter('watermark_base64', index) as string;
		}
	}

	if (outputFormat === 'file') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
			method: 'POST', url: 'https://pdfapihub.com/api/v1/watermark',
			...(inputType === 'file' ? { body: multipartBody as Buffer, headers: { 'Content-Type': `multipart/form-data; boundary=${multipartBoundary}` } } : { body, json: true }),
			encoding: 'arraybuffer', returnFullResponse: true, ignoreHttpStatusErrors: true,
		}) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

		if (responseData.statusCode >= 400) {
			let errorBody: unknown;
			try { errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8')); } catch { errorBody = {}; }
			checkApiResponse(this, responseData.statusCode, errorBody, index);
		}
		returnData.push(await prepareBinaryResponse.call(this, index, responseData, 'watermarked.pdf', 'application/pdf'));
	} else {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
			method: 'POST', url: 'https://pdfapihub.com/api/v1/watermark',
			...(inputType === 'file' ? { body: multipartBody as Buffer, headers: { 'Content-Type': `multipart/form-data; boundary=${multipartBoundary}` } } : { body, json: true }),
			returnFullResponse: true, ignoreHttpStatusErrors: true,
		}) as { body: unknown; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push(parseJsonResponseBody(responseData.body, index));
	}
}
