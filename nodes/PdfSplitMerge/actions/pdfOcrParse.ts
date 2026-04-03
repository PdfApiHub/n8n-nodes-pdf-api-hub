import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, createSingleFileMultipart, parseJsonResponseBody } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'PDF Input Type',
		name: 'ocr_pdf_input_type',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the PDF for OCR',
		displayOptions: {
			show: {
				operation: ['pdfOcrParse'],
			},
		},
	},
{
		displayName: 'PDF URL',
		name: 'ocr_pdf_url',
		type: 'string',
		default: 'https://pdfapihub.com/sample-pdfinvoice-with-image.pdf',
		description: 'URL of the PDF to OCR parse',
		displayOptions: {
			show: {
				operation: ['pdfOcrParse'],
				ocr_pdf_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Binary Property Name',
		name: 'ocr_pdf_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: {
			show: {
				operation: ['pdfOcrParse'],
				ocr_pdf_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Pages',
		name: 'ocr_pages',
		type: 'string',
		default: '1',
		description: 'Page number or "all" (maximum 8 pages)',
		displayOptions: {
			show: {
				operation: ['pdfOcrParse'],
			},
		},
	},
{
		displayName: 'Language',
		name: 'ocr_lang',
		type: 'string',
		default: 'eng',
		description: 'OCR language code(s), for example "eng" or "eng+hin"',
		displayOptions: {
			show: {
				operation: ['pdfOcrParse', 'imageOcrParse'],
			},
		},
	},
{
		displayName: 'DPI',
		name: 'ocr_dpi',
		type: 'number',
		default: 200,
		description: 'Rasterization DPI before OCR (72-400)',
		displayOptions: {
			show: {
				operation: ['pdfOcrParse'],
			},
		},
	},
{
		displayName: 'Page Segmentation Mode (PSM)',
		name: 'ocr_psm',
		type: 'number',
		default: 3,
		description: 'Page segmentation mode (0-13)',
		displayOptions: {
			show: {
				operation: ['pdfOcrParse', 'imageOcrParse'],
			},
		},
	},
{
		displayName: 'OCR Engine Mode (OEM)',
		name: 'ocr_oem',
		type: 'number',
		default: 3,
		description: 'OCR engine mode (0-3)',
		displayOptions: {
			show: {
				operation: ['pdfOcrParse', 'imageOcrParse'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const pdfInputType = this.getNodeParameter('ocr_pdf_input_type', index) as string;
	const pdfUrl = this.getNodeParameter('ocr_pdf_url', index, '') as string;
	const pages = this.getNodeParameter('ocr_pages', index) as string;
	const lang = this.getNodeParameter('ocr_lang', index) as string;
	const dpi = this.getNodeParameter('ocr_dpi', index) as number;
	const psm = this.getNodeParameter('ocr_psm', index) as number;
	const oem = this.getNodeParameter('ocr_oem', index) as number;

	const body: Record<string, unknown> = { pages, lang, dpi, psm, oem };
	if (pdfInputType === 'url') {
		body.url = normalizeUrl(pdfUrl);
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
			returnFullResponse: pdfInputType === 'file',
		},
	);

	if (pdfInputType === 'file') {
		const responseBody = (responseData as { body?: unknown }).body;
		returnData.push(parseJsonResponseBody(responseBody, index));
	} else {
		returnData.push({ json: responseData as IDataObject, pairedItem: { item: index } });
	}
}
