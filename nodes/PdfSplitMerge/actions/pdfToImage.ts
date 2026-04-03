import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'pdf2img_input_type',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the PDF to convert',
		displayOptions: {
			show: {
				operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
			},
		},
	},
{
		displayName: 'PDF URL',
		name: 'pdf2img_url',
		type: 'string',
		default: '',
		description: 'URL of the PDF to convert',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		displayOptions: {
			show: {
				operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
				pdf2img_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Binary Property Name',
		name: 'pdf2img_file_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: {
			show: {
				operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
				pdf2img_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Pages',
		name: 'pdf2img_pages',
		type: 'string',
		default: '1',
		description: 'Page(s) to convert: single number like "1", range like "1-3", or comma list',
		displayOptions: {
			show: {
				operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
			},
		},
	},
{
		displayName: 'DPI',
		name: 'pdf2img_dpi',
		type: 'number',
		default: 150,
		description: 'Output image DPI (72-300)',
		displayOptions: {
			show: {
				operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
			},
		},
	},
{
		displayName: 'Quality',
		name: 'pdf2img_quality',
		type: 'number',
		default: 85,
		description: 'Image quality (1-100)',
		displayOptions: {
			show: {
				operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
			},
		},
	},
{
		displayName: 'Output Format',
		name: 'pdf2img_output',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Base64', value: 'base64' },
			{ name: 'Both', value: 'both' },
			{ name: 'File', value: 'file' },
		],
		default: 'url',
		description: 'Format of the output',
		displayOptions: {
			show: {
				operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
	operation: string,
): Promise<void> {
	const pdf2imgInputType = this.getNodeParameter('pdf2img_input_type', index) as string;
	const pdfUrl = this.getNodeParameter('pdf2img_url', index, '') as string;
	const pages = this.getNodeParameter('pdf2img_pages', index) as string;
	const dpi = this.getNodeParameter('pdf2img_dpi', index) as number;
	const quality = this.getNodeParameter('pdf2img_quality', index) as number;
	const outputFormat = this.getNodeParameter('pdf2img_output', index) as string;

	const imageFormatMap: Record<string, string> = {
		pdfToPng: 'png',
		pdfToWebp: 'webp',
		pdfToJpg: 'jpg',
	};
	const imageFormat = imageFormatMap[operation];

	const body: Record<string, unknown> = {
		pages,
		image_format: imageFormat,
		dpi,
		quality,
		output: outputFormat,
	};
	if (pdf2imgInputType === 'url') {
		body.url = normalizeUrl(pdfUrl);
	}

	if (outputFormat === 'file') {
		const requestOptions =
			pdf2imgInputType === 'file'
				? await createSingleFileMultipart.call(
						this,
						index,
						this.getNodeParameter('pdf2img_file_binary_property', index) as string,
						body as Record<string, string | number | boolean>,
				  )
				: { body, json: true };
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/convert/pdf/image',
				...requestOptions,
				encoding: 'arraybuffer',
				returnFullResponse: true,
			},
		);
		const mimeType = imageFormat === 'png' ? 'image/png' : imageFormat === 'webp' ? 'image/webp' : 'image/jpeg';
		returnData.push(
			await prepareBinaryResponse.call(
				this,
				index,
				responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
				`output.${imageFormat}`,
				mimeType,
			),
		);
	} else {
		const requestOptions =
			pdf2imgInputType === 'file'
				? await createSingleFileMultipart.call(
						this,
						index,
						this.getNodeParameter('pdf2img_file_binary_property', index) as string,
						body as Record<string, string | number | boolean>,
				  )
				: { body, json: true };
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/convert/pdf/image',
				...requestOptions,
				returnFullResponse: pdf2imgInputType === 'file',
			},
		);
		if (pdf2imgInputType === 'file') {
			const responseBody = (responseData as { body?: unknown }).body;
			returnData.push({ json: (responseBody ?? {}) as IDataObject, pairedItem: { item: index } });
		} else {
			returnData.push({ json: responseData as IDataObject, pairedItem: { item: index } });
		}
	}
}
