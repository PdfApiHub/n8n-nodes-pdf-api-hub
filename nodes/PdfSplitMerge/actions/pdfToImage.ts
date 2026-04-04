import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart, parseJsonResponseBody, checkApiResponse } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'pdf2img_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Hosted Link) (Default)', value: 'url', description: 'Returns a downloadable URL — file hosted for 30 days' },
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
		description: 'Public URL of the PDF file to convert to image(s)',
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
		description: 'Name of the binary property containing the PDF file to convert',
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
		description: 'Page(s) to convert — single number like "1", range like "1-3", or comma-separated list like "1,3,5"',
		placeholder: '1-3,5',
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
		description: 'Output image resolution in dots-per-inch (72–300). Higher values produce sharper but larger images.',
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
		description: 'Image compression quality (1–100). Only affects JPEG and WebP output.',
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
			{ name: 'URL (Hosted Link) (Default)', value: 'url', description: 'Returns a downloadable URL — file hosted for 30 days' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns base64-encoded data inside JSON' },
			{ name: 'Both (URL + Base64)', value: 'both', description: 'Returns both URL and base64 in one response' },
			{ name: 'Binary File (Download)', value: 'file', description: 'Returns raw binary — great for piping into other nodes' },
		],
		default: 'url',
		description: 'How the converted image(s) are returned',
		displayOptions: {
			show: {
				operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
			},
		},
	},
{
		displayName: 'Advanced Options',
		name: 'pdf2img_advanced',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: ['pdfToPng', 'pdfToWebp', 'pdfToJpg'],
			},
		},
		options: [
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 0,
				description: 'Resize the output image to this width in pixels. 0 = keep original size.',
				placeholder: '800',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 0,
				description: 'Resize the output image to this height in pixels. 0 = keep original size.',
				placeholder: '600',
			},
			{
				displayName: 'Background Color',
				name: 'background_color',
				type: 'color',
				default: '',
				description: 'Hex color to use as background for transparent PNGs (e.g. #FFFFFF for white)',
				placeholder: '#FFFFFF',
			},
			{
				displayName: 'Output Filename',
				name: 'output_filename',
				type: 'string',
				default: '',
				description: 'Custom filename for the output image (without extension)',
				placeholder: 'my-page',
			},
		],
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
	const advanced = this.getNodeParameter('pdf2img_advanced', index, {}) as IDataObject;

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

	// Advanced options
	if (advanced.width && (advanced.width as number) > 0) body.width = advanced.width;
	if (advanced.height && (advanced.height as number) > 0) body.height = advanced.height;
	if (advanced.background_color) body.background_color = advanced.background_color;
	if (advanced.output_filename) body.output_filename = advanced.output_filename;

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
				ignoreHttpStatusErrors: true,
			},
		) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

		if (responseData.statusCode >= 400) {
			let errorBody: unknown;
			try { errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8')); } catch { errorBody = {}; }
			checkApiResponse(this, responseData.statusCode, errorBody, index);
		}

		const mimeType = imageFormat === 'png' ? 'image/png' : imageFormat === 'webp' ? 'image/webp' : 'image/jpeg';
		returnData.push(
			await prepareBinaryResponse.call(
				this,
				index,
				responseData,
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
				returnFullResponse: true,
				ignoreHttpStatusErrors: true,
			},
		) as { body: unknown; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push(parseJsonResponseBody(responseData.body, index));
	}
}
