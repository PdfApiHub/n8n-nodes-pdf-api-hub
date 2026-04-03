import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'img2pdf_input_type',
		type: 'options',
		options: [
			{ name: 'URL(s)', value: 'url' },
			{ name: 'Base64', value: 'base64' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the image(s)',
		displayOptions: {
			show: {
				operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
			},
		},
	},
{
		displayName: 'Image URLs',
		name: 'img2pdf_urls_png',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		default: [],
		description: 'Array of image URLs to convert (max 100)',
		placeholder: 'https://pdfapihub.com/sample.png',
		displayOptions: {
			show: {
				operation: ['pngToPdf'],
				img2pdf_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Image URLs',
		name: 'img2pdf_urls_webp',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		default: [],
		description: 'Array of image URLs to convert (max 100)',
		placeholder: 'https://pdfapihub.com/sample.webp',
		displayOptions: {
			show: {
				operation: ['webpToPdf'],
				img2pdf_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Image URLs',
		name: 'img2pdf_urls_jpg',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		default: [],
		description: 'Array of image URLs to convert (max 100)',
		placeholder: 'https://pdfapihub.com/sample.jpg',
		displayOptions: {
			show: {
				operation: ['jpgToPdf'],
				img2pdf_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Base64 Image(s)',
		name: 'img2pdf_base64',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		default: [],
		description: 'Base64 image payload(s)',
		displayOptions: {
			show: {
				operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
				img2pdf_input_type: ['base64'],
			},
		},
	},
{
		displayName: 'Binary Property Names',
		name: 'img2pdf_binary_properties',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		default: ['data'],
		description: 'Binary property names containing images to convert',
		displayOptions: {
			show: {
				operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
				img2pdf_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Output Format',
		name: 'img2pdf_output',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Base64', value: 'base64' },
			{ name: 'Both', value: 'both' },
			{ name: 'File', value: 'file' },
		],
		default: 'url',
		description: 'Format of the output PDF',
		displayOptions: {
			show: {
				operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
			},
		},
	},
{
		displayName: 'Output Filename',
		name: 'img2pdf_output_filename',
		type: 'string',
		default: 'converted.pdf',
		description: 'Filename for the output PDF',
		displayOptions: {
			show: {
				operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
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
	const inputType = this.getNodeParameter('img2pdf_input_type', index) as string;
	const outputFormat = this.getNodeParameter('img2pdf_output', index) as string;
	const outputFilename = this.getNodeParameter('img2pdf_output_filename', index) as string;

	let multipartBody: Buffer | undefined;
	let multipartBoundary: string | undefined;
	let body: Record<string, unknown> | undefined;

	if (inputType === 'file') {
		const binaryPropertyNamesParam = this.getNodeParameter('img2pdf_binary_properties', index) as unknown;
		const binaryPropertyNames = (
			Array.isArray(binaryPropertyNamesParam)
				? binaryPropertyNamesParam
				: [binaryPropertyNamesParam]
		)
			.map((v) => String(v ?? '').trim())
			.filter((v) => v !== '');

		if (!binaryPropertyNames.length) {
			throw new NodeOperationError(
				this.getNode(),
				'Please provide at least one Binary Property Name',
				{ itemIndex: index },
			);
		}

		multipartBoundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
		const parts: Buffer[] = [];

		for (const propertyName of binaryPropertyNames) {
			const binaryData = this.helpers.assertBinaryData(index, propertyName);
			const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(index, propertyName);
			const fileName = binaryData.fileName ?? 'image.png';
			const contentType = binaryData.mimeType ?? 'image/png';

			parts.push(
				Buffer.from(
					`--${multipartBoundary}\r\n` +
						`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
						`Content-Type: ${contentType}\r\n\r\n`,
				),
			);
			parts.push(Buffer.from(binaryDataBuffer));
			parts.push(Buffer.from('\r\n'));
		}

		parts.push(
			Buffer.from(
				`--${multipartBoundary}\r\n` +
					'Content-Disposition: form-data; name="output"\r\n\r\n' +
					`${outputFormat}\r\n`,
			),
		);
		if (outputFilename) {
			parts.push(
				Buffer.from(
					`--${multipartBoundary}\r\n` +
						'Content-Disposition: form-data; name="output_filename"\r\n\r\n' +
						`${outputFilename}\r\n`,
				),
			);
		}
		parts.push(Buffer.from(`--${multipartBoundary}--\r\n`));
		multipartBody = Buffer.concat(parts);
	} else if (inputType === 'url') {
		const urls = (
			operation === 'pngToPdf'
				? (this.getNodeParameter('img2pdf_urls_png', index) as string[])
				: operation === 'webpToPdf'
					? (this.getNodeParameter('img2pdf_urls_webp', index) as string[])
					: (this.getNodeParameter('img2pdf_urls_jpg', index) as string[])
		).map(normalizeUrl);
		body = { urls, output: outputFormat, output_filename: outputFilename };
	} else {
		const base64Images = this.getNodeParameter('img2pdf_base64', index) as string[];
		body = base64Images.length === 1
			? { image_base64: base64Images[0], output: outputFormat, output_filename: outputFilename }
			: { images_base64: base64Images, output: outputFormat, output_filename: outputFilename };
	}

	if (outputFormat === 'file') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/convert/image/pdf',
				...(inputType === 'file'
					? {
							body: multipartBody as Buffer,
							headers: { 'Content-Type': `multipart/form-data; boundary=${multipartBoundary}` },
						}
					: { body, json: true }),
				encoding: 'arraybuffer',
				returnFullResponse: true,
			},
		);
		returnData.push(
			await prepareBinaryResponse.call(
				this,
				index,
				responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
				outputFilename || 'converted.pdf',
				'application/pdf',
			),
		);
	} else {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/convert/image/pdf',
				...(inputType === 'file'
					? {
							body: multipartBody as Buffer,
							headers: { 'Content-Type': `multipart/form-data; boundary=${multipartBoundary}` },
						}
					: { body, json: true }),
			},
		);
		returnData.push({ json: responseData as IDataObject, pairedItem: { item: index } });
	}
}
