import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, parseJsonResponseBody, checkApiResponse } from '../helpers';

/* ================================================================
 *  Field descriptions – Sign PDF (stamp signature image)
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── 1. PDF Input ───────────────────────────────────────────────
	{
		displayName: 'PDF Input Type',
		name: 'sign_pdf_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Default)', value: 'url', description: 'Provide a publicly accessible PDF URL' },
			{ name: 'Base64', value: 'base64', description: 'Provide base64-encoded PDF content' },
			{ name: 'Binary File', value: 'file', description: 'Use a PDF from a previous node\'s binary output' },
		],
		default: 'url',
		description: 'How to provide the PDF to sign',
		displayOptions: { show: { operation: ['signPdf'] } },
	},
	{
		displayName: 'PDF URL',
		name: 'sign_pdf_url',
		type: 'string',
		default: '',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		description: 'Public URL of the PDF to sign',
		displayOptions: { show: { operation: ['signPdf'], sign_pdf_input_type: ['url'] } },
	},
	{
		displayName: 'Base64 PDF',
		name: 'sign_pdf_base64',
		type: 'string',
		default: '',
		description: 'Base64-encoded PDF content',
		displayOptions: { show: { operation: ['signPdf'], sign_pdf_input_type: ['base64'] } },
	},
	{
		displayName: 'Binary Property Name',
		name: 'sign_pdf_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: { show: { operation: ['signPdf'], sign_pdf_input_type: ['file'] } },
	},

	// ─── 2. Signature Input ─────────────────────────────────────────
	{
		displayName: 'Signature Type',
		name: 'sign_sig_input_type',
		type: 'options',
		options: [
			{ name: 'Image — URL (Default)', value: 'url', description: 'Provide a public URL to a signature image (PNG/JPG/WebP)' },
			{ name: 'Image — Base64', value: 'base64', description: 'Provide a base64-encoded signature image' },
			{ name: 'Type Text as Signature', value: 'text', description: 'Render typed text as a signature (e.g. "John Smith")' },
		],
		default: 'url',
		description: 'Use an image of your signature, or type your name to generate one. <a href="https://pdfapihub.com/free-tools/get-signature-URL" target="_blank">Draw your signature and get a URL →</a>.',
		displayOptions: { show: { operation: ['signPdf'] } },
	},
	{
		displayName: 'Signature Image URL',
		name: 'sign_signature_url',
		type: 'string',
		default: '',
		placeholder: 'https://pdfapihub.com/my-signature.png',
		description: 'Public URL to the signature image. Transparent PNGs work best.',
		displayOptions: { show: { operation: ['signPdf'], sign_sig_input_type: ['url'] } },
	},
	{
		displayName: 'Signature Image (Base64)',
		name: 'sign_signature_base64',
		type: 'string',
		default: '',
		description: 'Base64-encoded signature image (PNG/JPG/WebP)',
		displayOptions: { show: { operation: ['signPdf'], sign_sig_input_type: ['base64'] } },
	},
	{
		displayName: 'Signature Text',
		name: 'sign_text',
		type: 'string',
		default: '',
		placeholder: 'John Smith',
		description: 'Type your name or text — it will be rendered as a signature on the PDF',
		displayOptions: { show: { operation: ['signPdf'], sign_sig_input_type: ['text'] } },
	},
	{
		displayName: 'Text Color',
		name: 'sign_color',
		type: 'color',
		default: '#000000',
		description: 'Color of the text signature (e.g. dark blue #1a0dab for a pen-like look)',
		displayOptions: { show: { operation: ['signPdf'], sign_sig_input_type: ['text'] } },
	},
	{
		displayName: 'Font Size',
		name: 'sign_font_size',
		type: 'number',
		default: 48,
		typeOptions: { minValue: 1 },
		description: 'Font size for the text signature in points',
		displayOptions: { show: { operation: ['signPdf'], sign_sig_input_type: ['text'] } },
	},
	{
		displayName: 'Add Date Below Signature',
		name: 'sign_date_stamp',
		type: 'boolean',
		default: false,
		description: 'Whether to add the current date (UTC) below the signature text',
		displayOptions: { show: { operation: ['signPdf'], sign_sig_input_type: ['text'] } },
	},

	// ─── 3. Placement ───────────────────────────────────────────────
	{
		displayName: 'Page to Sign',
		name: 'sign_page',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Which page to place the signature on (1 = first page, 2 = second, etc.). Leave as 0 to sign the last page — most common for contracts.',
		displayOptions: { show: { operation: ['signPdf'], sign_all_pages: [false] } },
	},
	{
		displayName: 'Sign All Pages',
		name: 'sign_all_pages',
		type: 'boolean',
		default: true,
		description: 'Whether to stamp the signature on every page instead of just one',
		displayOptions: { show: { operation: ['signPdf'] } },
	},
	{
		displayName: 'Position',
		name: 'sign_position',
		type: 'options',
		options: [
			{ name: 'Bottom Center', value: 'bottom-center' },
			{ name: 'Bottom Left', value: 'bottom-left' },
			{ name: 'Bottom Right (Default)', value: 'bottom-right' },
			{ name: 'Center', value: 'center' },
			{ name: 'Custom (X/Y) …', value: 'custom' },
			{ name: 'Top Center', value: 'top-center' },
			{ name: 'Top Left', value: 'top-left' },
			{ name: 'Top Right', value: 'top-right' },
		],
		default: 'bottom-right',
		description: 'Where to place the signature — choose "Custom" to set exact X/Y coordinates',
		displayOptions: { show: { operation: ['signPdf'] } },
	},
	{
		displayName: 'X Position (Points)',
		name: 'sign_x',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Left edge of the signature in PDF points (72 points = 1 inch)',
		displayOptions: { show: { operation: ['signPdf'], sign_position: ['custom'] } },
	},
	{
		displayName: 'Y Position (Points)',
		name: 'sign_y',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Bottom edge of the signature in PDF points (0 = bottom of page)',
		displayOptions: { show: { operation: ['signPdf'], sign_position: ['custom'] } },
	},

	// ─── 4. Output ──────────────────────────────────────────────────
	{
		displayName: 'Output Format',
		name: 'sign_output_format',
		type: 'options',
		options: [
			{ name: 'Binary File (Download) (Default)', value: 'file', description: 'Returns raw PDF binary' },
			{ name: 'URL (Hosted Link)', value: 'url', description: 'Returns a downloadable URL — hosted for 30 days' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns base64-encoded PDF in JSON' },
		],
		default: 'file',
		description: 'How the signed PDF is returned',
		displayOptions: { show: { operation: ['signPdf'] } },
	},

	// ─── 5. Advanced Options ────────────────────────────────────────
	{
		displayName: 'Advanced Options',
		name: 'signAdvancedOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { operation: ['signPdf'] } },
		options: [
			{
				displayName: 'Opacity',
				name: 'opacity',
				type: 'number',
				default: 1.0,
				typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
				description: 'Signature opacity. 1.0 = fully opaque (default). Use lower values for stamp-style overlays.',
			},
			{
				displayName: 'Signature Height',
				name: 'height',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Height of the signature in PDF points. 0 = proportional to width.',
			},
			{
				displayName: 'Signature Width',
				name: 'width',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Width of the signature in PDF points. 0 = auto (28% of page width).',
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
	const pdfInputType = this.getNodeParameter('sign_pdf_input_type', index) as string;
	const sigInputType = this.getNodeParameter('sign_sig_input_type', index) as string;
	const page = this.getNodeParameter('sign_page', index, 0) as number;
	const allPages = this.getNodeParameter('sign_all_pages', index, false) as boolean;
	const position = this.getNodeParameter('sign_position', index, 'bottom-right') as string;
	const outputFormat = this.getNodeParameter('sign_output_format', index, 'file') as string;

	const advanced = this.getNodeParameter('signAdvancedOptions', index, {}) as Record<string, unknown>;

	const body: Record<string, unknown> = {
		output_format: outputFormat,
	};

	// Only send position preset to API (not 'custom')
	if (position !== 'custom') body.position = position;

	// PDF input
	if (pdfInputType === 'url') {
		body.pdf_url = normalizeUrl(this.getNodeParameter('sign_pdf_url', index, '') as string);
	} else if (pdfInputType === 'base64') {
		body.base64_pdf = this.getNodeParameter('sign_pdf_base64', index, '') as string;
	}

	// Signature input
	if (sigInputType === 'url') {
		body.signature_url = this.getNodeParameter('sign_signature_url', index, '') as string;
	} else if (sigInputType === 'base64') {
		body.base64_signature = this.getNodeParameter('sign_signature_base64', index, '') as string;
	} else {
		// Text signature
		body.sign_text = this.getNodeParameter('sign_text', index, '') as string;
		const signColor = this.getNodeParameter('sign_color', index, '#000000') as string;
		if (signColor && signColor !== '#000000') body.sign_color = signColor;
		const fontSize = this.getNodeParameter('sign_font_size', index, 48) as number;
		if (fontSize !== 48) body.font_size = fontSize;
		const dateStamp = this.getNodeParameter('sign_date_stamp', index, false) as boolean;
		if (dateStamp) body.date_stamp = true;
	}

	// Page
	if (allPages) {
		body.all_pages = true;
	} else if (page > 0) {
		body.page = page;
	}

	// Position — custom X/Y or preset
	if (position === 'custom') {
		const x = this.getNodeParameter('sign_x', index, 0) as number;
		const y = this.getNodeParameter('sign_y', index, 0) as number;
		if (x > 0) body.x = x;
		if (y > 0) body.y = y;
	}

	// Advanced options
	if (advanced.width && (advanced.width as number) > 0) body.width = advanced.width;
	if (advanced.height && (advanced.height as number) > 0) body.height = advanced.height;
	if (advanced.opacity !== undefined && (advanced.opacity as number) < 1) body.opacity = advanced.opacity;

	// ── API call (JSON only — multipart for binary PDF input) ──────
	if (pdfInputType === 'file') {
		// Multipart with PDF file + signature URL/base64
		const binaryPropertyName = this.getNodeParameter('sign_pdf_binary_property', index, 'data') as string;
		const binaryData = this.helpers.assertBinaryData(index, binaryPropertyName);
		const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(index, binaryPropertyName);
		const fileName = binaryData.fileName ?? 'document.pdf';
		const contentType = binaryData.mimeType ?? 'application/pdf';

		const boundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
		const parts: Buffer[] = [];

		parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`));
		parts.push(Buffer.from(binaryDataBuffer));
		parts.push(Buffer.from('\r\n'));

		// Add all body fields as form fields
		for (const [key, val] of Object.entries(body)) {
			if (val === undefined || val === '' || key === 'base64_pdf' || key === 'pdf_url') continue;
			parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`));
		}
		parts.push(Buffer.from(`--${boundary}--\r\n`));

		if (outputFormat === 'file') {
			const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
				method: 'POST', url: 'https://pdfapihub.com/api/v1/sign-pdf',
				body: Buffer.concat(parts), headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
				encoding: 'arraybuffer', returnFullResponse: true, ignoreHttpStatusErrors: true,
			}) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

			if (responseData.statusCode >= 400) {
				let errorBody: unknown;
				try { errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8')); } catch { errorBody = {}; }
				checkApiResponse(this, responseData.statusCode, errorBody, index);
			}
			returnData.push(await prepareBinaryResponse.call(this, index, responseData, 'signed.pdf', 'application/pdf'));
		} else {
			const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
				method: 'POST', url: 'https://pdfapihub.com/api/v1/sign-pdf',
				body: Buffer.concat(parts), headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
				returnFullResponse: true, ignoreHttpStatusErrors: true,
			}) as { body: unknown; statusCode: number };

			checkApiResponse(this, responseData.statusCode, responseData.body, index);
			returnData.push(parseJsonResponseBody(responseData.body, index));
		}
	} else {
		// JSON body
		if (outputFormat === 'file') {
			const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
				method: 'POST', url: 'https://pdfapihub.com/api/v1/sign-pdf',
				body, json: true, encoding: 'arraybuffer', returnFullResponse: true, ignoreHttpStatusErrors: true,
			}) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

			if (responseData.statusCode >= 400) {
				let errorBody: unknown;
				try { errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8')); } catch { errorBody = {}; }
				checkApiResponse(this, responseData.statusCode, errorBody, index);
			}
			returnData.push(await prepareBinaryResponse.call(this, index, responseData, 'signed.pdf', 'application/pdf'));
		} else {
			const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
				method: 'POST', url: 'https://pdfapihub.com/api/v1/sign-pdf',
				body, json: true, returnFullResponse: true, ignoreHttpStatusErrors: true,
			}) as { body: unknown; statusCode: number };

			checkApiResponse(this, responseData.statusCode, responseData.body, index);
			returnData.push(parseJsonResponseBody(responseData.body, index));
		}
	}
}
