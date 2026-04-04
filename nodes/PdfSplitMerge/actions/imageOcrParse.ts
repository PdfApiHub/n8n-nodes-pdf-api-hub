import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, createSingleFileMultipart, parseJsonResponseBody, checkApiResponse } from '../helpers';

/* ================================================================
 *  Field descriptions – Image OCR
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── 1. Input ───────────────────────────────────────────────────
	{
		displayName: 'Input Type',
		name: 'ocr_image_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Default)', value: 'url', description: 'Provide a publicly accessible image URL' },
			{ name: 'Base64', value: 'base64', description: 'Provide a base64-encoded image (or data URL)' },
			{ name: 'Binary File', value: 'file', description: 'Use an image from a previous node\u0027s binary output' },
		],
		default: 'url',
		description: 'How to provide the image for OCR',
		displayOptions: { show: { operation: ['imageOcrParse'] } },
	},
	{
		displayName: 'Image URL',
		name: 'ocr_image_url',
		type: 'string',
		default: 'https://pdfapihub.com/sample-invoicepage.png',
		placeholder: 'https://pdfapihub.com/sample-invoicepage.png',
		description: 'Public URL of the image to extract text from',
		displayOptions: { show: { operation: ['imageOcrParse'], ocr_image_input_type: ['url'] } },
	},
	{
		displayName: 'Base64 Image',
		name: 'ocr_base64_image',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		placeholder: 'data:image/png;base64,iVBORw0KGgo...',
		description: 'Base64-encoded image — supports raw base64 or data URL format',
		displayOptions: { show: { operation: ['imageOcrParse'], ocr_image_input_type: ['base64'] } },
	},
	{
		displayName: 'Binary Property Name',
		name: 'ocr_image_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the image file',
		displayOptions: { show: { operation: ['imageOcrParse'], ocr_image_input_type: ['file'] } },
	},

	// ─── 2. Advanced Options (Image OCR specific) ───────────────────
	{
		displayName: 'Advanced Options',
		name: 'imageOcrAdvancedOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { operation: ['imageOcrParse'] } },
		options: [
			{
				displayName: 'Binarization Threshold',
				name: 'threshold',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 255 },
				description: 'Convert image to black & white at this threshold (1–255). Pixels above → white, below → black. 0 = disabled. Best with Grayscale enabled.',
			},
			{
				displayName: 'Character Whitelist',
				name: 'char_whitelist',
				type: 'string',
				default: '',
				placeholder: '0123456789.$,-',
				description: 'Restrict OCR to only these characters — great for extracting numbers (e.g. "0123456789.$,-")',
			},
			{
				displayName: 'Grayscale',
				name: 'grayscale',
				type: 'boolean',
				default: false,
				description: 'Whether to convert the image to grayscale before OCR — improves accuracy on colour documents',
			},
			{
				displayName: 'OCR Engine Mode (OEM)',
				name: 'oem',
				type: 'options',
				options: [
					{ name: '3 — Best Available (Default)', value: 3 },
					{ name: '1 — LSTM Neural Net', value: 1 },
					{ name: '0 — Legacy', value: 0 },
				],
				default: 3,
				description: 'Tesseract engine mode. Default (3) auto-selects the best.',
			},
			{
				displayName: 'Page Segmentation Mode (PSM)',
				name: 'psm',
				type: 'options',
				options: [
					{ name: '3 — Fully Automatic (Default)', value: 3 },
					{ name: '4 — Single Column', value: 4 },
					{ name: '6 — Single Block of Text', value: 6 },
					{ name: '7 — Single Text Line', value: 7 },
					{ name: '8 — Single Word', value: 8 },
					{ name: '13 — Raw Line', value: 13 },
				],
				default: 3,
				description: 'How Tesseract segments the page. Change only if default gives poor results.',
			},
			{
				displayName: 'Resize Scale',
				name: 'resize',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 4 },
				description: 'Scale factor to enlarge the image before OCR. 2.0 = double size. 0 = disabled. Max 4×. Useful for low-resolution images.',
			},
			{
				displayName: 'Sharpen',
				name: 'sharpen',
				type: 'boolean',
				default: false,
				description: 'Whether to apply a sharpening filter before OCR — helps with blurry images',
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
	const imageInputType = this.getNodeParameter('ocr_image_input_type', index) as string;
	const lang = this.getNodeParameter('ocr_lang', index, 'eng') as string;
	const detail = this.getNodeParameter('ocr_detail', index, 'text') as string;
	const outputFormat = this.getNodeParameter('ocr_output_format', index, 'json') as string;

	// Advanced options (with backward compat for legacy top-level fields)
	const advanced = this.getNodeParameter('imageOcrAdvancedOptions', index, {}) as Record<string, unknown>;

	let psm = advanced.psm as number | undefined;
	if (psm === undefined) {
		try { psm = this.getNodeParameter('ocr_psm', index) as number; } catch { psm = 3; }
	}

	let oem = advanced.oem as number | undefined;
	if (oem === undefined) {
		try { oem = this.getNodeParameter('ocr_oem', index) as number; } catch { oem = 3; }
	}

	const charWhitelist = (advanced.char_whitelist as string | undefined) ?? '';
	const grayscale = (advanced.grayscale as boolean | undefined) ?? false;
	const sharpen = (advanced.sharpen as boolean | undefined) ?? false;
	const threshold = (advanced.threshold as number | undefined) ?? 0;
	const resize = (advanced.resize as number | undefined) ?? 0;

	const body: Record<string, unknown> = {
		lang,
		psm,
		oem,
		detail,
		output_format: outputFormat,
	};
	if (charWhitelist) body.char_whitelist = charWhitelist;
	if (grayscale) body.grayscale = true;
	if (sharpen) body.sharpen = true;
	if (threshold > 0) body.threshold = threshold;
	if (resize > 0) body.resize = resize;

	if (imageInputType === 'url') {
		const imageUrl = this.getNodeParameter('ocr_image_url', index, '') as string;
		if (imageUrl) body.image_url = normalizeUrl(imageUrl);
	} else if (imageInputType === 'base64') {
		const base64Image = this.getNodeParameter('ocr_base64_image', index, '') as string;
		if (base64Image) body.base64_image = base64Image;
	}

	const requestOptions =
		imageInputType === 'file'
			? await createSingleFileMultipart.call(
					this,
					index,
					this.getNodeParameter('ocr_image_binary_property', index, 'data') as string,
					body as Record<string, string | number | boolean>,
				)
			: { body, json: true };

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'pdfapihubApi',
		{
			method: 'POST',
			url: 'https://pdfapihub.com/api/v1/image/ocr/parse',
			...requestOptions,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		},
	) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}
