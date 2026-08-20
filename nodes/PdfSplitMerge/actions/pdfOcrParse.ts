import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, createSingleFileMultipart, parseJsonResponseBody, checkApiResponse } from '../helpers';

/* ================================================================
 *  Field descriptions – PDF OCR
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── 1. Input ───────────────────────────────────────────────────
	{
		displayName: 'Input Type',
		name: 'ocr_pdf_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Default)', value: 'url', description: 'Provide a publicly accessible PDF URL' },
			{ name: 'Base64', value: 'base64', description: 'Provide a base64-encoded PDF or data URL' },
			{ name: 'Binary File', value: 'file', description: 'Use a PDF file from a previous node\u0027s binary output' },
		],
		default: 'url',
		description: 'How to provide the scanned PDF for OCR',
		displayOptions: { show: { operation: ['pdfOcrParse'] } },
	},
	{
		displayName: 'PDF URL',
		name: 'ocr_pdf_url',
		type: 'string',
		default: 'https://pdfapihub.com/sample-pdfinvoice-with-image.pdf',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		description: 'Public URL of the scanned PDF to extract text from',
		displayOptions: { show: { operation: ['pdfOcrParse'], ocr_pdf_input_type: ['url'] } },
	},
	{
		displayName: 'Base64 PDF',
		name: 'ocr_base64_pdf',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		placeholder: 'data:application/pdf;base64,JVBERi0xLjQK...',
		description: 'Base64-encoded PDF in raw base64 or data URL format',
		displayOptions: { show: { operation: ['pdfOcrParse'], ocr_pdf_input_type: ['base64'] } },
	},
	{
		displayName: 'Binary Property Name',
		name: 'ocr_pdf_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: { show: { operation: ['pdfOcrParse'], ocr_pdf_input_type: ['file'] } },
	},

	// ─── 2. Page Selection ──────────────────────────────────────────
	{
		displayName: 'Pages',
		name: 'ocr_pages',
		type: 'string',
		default: 'all',
		placeholder: '1-3,5',
		description: 'Which pages to OCR. Supports "all", single page ("3"), range ("1-5"), or mixed ("1,3,5-8").',
		displayOptions: { show: { operation: ['pdfOcrParse'] } },
	},
	{
		displayName: 'AWS Textract automatically detects English, French, German, Italian, Portuguese, and Spanish. Language selection is not required.',
		name: 'pdfOcrLanguageNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { operation: ['pdfOcrParse'] } },
	},

	// Shared Image OCR field retained here because action descriptions are combined.
	{
		displayName: 'Language',
		name: 'ocr_lang',
		type: 'options',
		noDataExpression: true,
		typeOptions: { allowCustomValue: true },
		options: [
			{ name: 'English (Default)', value: 'eng' },
			{ name: 'Portuguese', value: 'por' },
			{ name: 'Russian', value: 'rus' },
		],
		default: 'eng',
		placeholder: 'eng+por',
		description: 'OCR language. Pick from the list or type a custom Tesseract code. Use + to combine: "eng+por", "eng+rus". <a href="https://pdfapihub.com/request-more-fonts" target="_blank">Request more languages</a>.',
		displayOptions: { show: { operation: ['imageOcrParse'] } },
	},

	// ─── 3. Detail ──────────────────────────────────────────────────
	{
		displayName: 'Detail Level',
		name: 'ocr_detail',
		type: 'options',
		options: [
			{ name: 'Text Only (Default)', value: 'text', description: 'Plain text with confidence score per page' },
			{ name: 'Words + Bounding Boxes', value: 'words', description: 'Adds per-word positions and confidence — useful for layout analysis' },
		],
		default: 'text',
		description: 'How much detail to return from OCR',
		displayOptions: { show: { operation: ['pdfOcrParse', 'imageOcrParse'] } },
	},
	{
		displayName: 'Response Format',
		name: 'ocr_output_format',
		type: 'options',
		options: [
			{ name: 'JSON (Default)', value: 'json', description: 'Full structured JSON with pages, confidence, and metadata' },
			{ name: 'Plain Text', value: 'text', description: 'Raw text only — no JSON wrapper' },
		],
		default: 'json',
		description: 'Format of the API response',
		displayOptions: { show: { operation: ['imageOcrParse'] } },
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
	const pdfInputType = this.getNodeParameter('ocr_pdf_input_type', index) as string;
	const pdfUrl = this.getNodeParameter('ocr_pdf_url', index, '') as string;
	const pages = this.getNodeParameter('ocr_pages', index, 'all') as string;
	const detail = this.getNodeParameter('ocr_detail', index, 'text') as string;
	const savedParameters = this.getNode().parameters as Record<string, unknown>;
	const getSavedParameter = <T>(name: string): T | undefined => {
		if (!Object.prototype.hasOwnProperty.call(savedParameters, name)) return undefined;
		return this.getNodeParameter(name, index) as T;
	};
	const advanced = getSavedParameter<Record<string, unknown>>('ocrAdvancedOptions') ?? {};
	const lang = getSavedParameter<string>('ocr_lang');
	const outputFormat = getSavedParameter<string>('ocr_output_format');
	const dpi = (advanced.dpi as number | undefined) ?? getSavedParameter<number>('ocr_dpi');
	const psm = (advanced.psm as number | undefined) ?? getSavedParameter<number>('ocr_psm');
	const oem = (advanced.oem as number | undefined) ?? getSavedParameter<number>('ocr_oem');
	const charWhitelist = advanced.char_whitelist as string | undefined;

	const body: Record<string, unknown> = {
		pages,
		detail,
	};
	if (lang !== undefined) body.lang = lang;
	if (dpi !== undefined) body.dpi = dpi;
	if (psm !== undefined) body.psm = psm;
	if (oem !== undefined) body.oem = oem;
	if (outputFormat !== undefined) body.output_format = outputFormat;
	if (charWhitelist) body.char_whitelist = charWhitelist;
	if (pdfInputType === 'url') body.url = normalizeUrl(pdfUrl);
	if (pdfInputType === 'base64') {
		body.base64_pdf = this.getNodeParameter('ocr_base64_pdf', index, '') as string;
	}

	const requestOptions =
		pdfInputType === 'file'
			? await createSingleFileMultipart.call(
					this,
					index,
					this.getNodeParameter('ocr_pdf_binary_property', index) as string,
					body as Record<string, string | number | boolean>,
				)
			: { body, json: true };

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'pdfapihubApi',
		{
			method: 'POST',
			url: 'https://pdfapihub.com/api/v1/pdf/ocr/parse',
			...requestOptions,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		},
	) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}
