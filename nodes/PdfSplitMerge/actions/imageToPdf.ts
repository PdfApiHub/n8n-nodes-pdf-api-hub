import type { IExecuteFunctions, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, parseJsonResponseBody, checkApiResponse } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'img2pdf_input_type',
		type: 'options',
		options: [
			{ name: 'URL(s) (Default)', value: 'url' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns base64-encoded data inside JSON' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the image(s) to convert into a PDF',
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
		description: 'One or more public PNG image URLs to convert (max 100)',
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
		description: 'One or more public WebP image URLs to convert (max 100)',
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
		description: 'One or more public JPEG image URLs to convert (max 100)',
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
		description: 'Base64-encoded image payload(s) — each entry becomes a page in the PDF',
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
		description: 'Names of binary properties containing image files to convert',
		displayOptions: {
			show: {
				operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
				img2pdf_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Page Size',
		name: 'img2pdf_page_size',
		type: 'options',
		options: [
			{ name: 'A3', value: 'A3', description: '297 × 420 mm' },
			{ name: 'A4', value: 'A4', description: '210 × 297 mm' },
			{ name: 'A5', value: 'A5', description: '148 × 210 mm' },
			{ name: 'Legal', value: 'Legal', description: '8.5 × 14 in' },
			{ name: 'Letter', value: 'Letter', description: '8.5 × 11 in' },
			{ name: 'Original (Default)', value: 'original', description: 'Use the native image dimensions' },
			{ name: 'Tabloid', value: 'Tabloid', description: '11 × 17 in' },
		],
		default: 'original',
		description: 'PDF page size — "Original" keeps image dimensions as-is',
		displayOptions: {
			show: {
				operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
			},
		},
	},
{
		displayName: 'Orientation',
		name: 'img2pdf_orientation',
		type: 'options',
		options: [
			{ name: 'Portrait (Default)', value: 'portrait' },
			{ name: 'Landscape', value: 'landscape' },
		],
		default: 'portrait',
		description: 'Page orientation for the output PDF',
		displayOptions: {
			show: {
				operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
			},
			hide: {
				img2pdf_page_size: ['original'],
			},
		},
	},
{
		displayName: 'Fit Mode',
		name: 'img2pdf_fit_mode',
		type: 'options',
		options: [
			{ name: 'Fit (Default)', value: 'fit', description: 'Scale image to fit within the page, preserving aspect ratio' },
			{ name: 'Fill', value: 'fill', description: 'Scale image to fill the page, cropping any overflow' },
			{ name: 'Stretch', value: 'stretch', description: 'Stretch image to exactly fill the page (may distort)' },
			{ name: 'Original', value: 'original', description: 'Keep original image size, center on page' },
		],
		default: 'fit',
		description: 'How the image is placed within each PDF page',
		displayOptions: {
			show: {
				operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
			},
		},
	},
{
		displayName: 'Margin (Points)',
		name: 'img2pdf_margin',
		type: 'number',
		default: 0,
		description: 'Uniform page margin in points (0–200). 72 points = 1 inch.',
		typeOptions: {
			minValue: 0,
			maxValue: 200,
		},
		displayOptions: {
			show: {
				operation: ['pngToPdf', 'webpToPdf', 'jpgToPdf'],
			},
		},
	},
{
		displayName: 'Output Format',
		name: 'img2pdf_output',
		type: 'options',
		options: [
			{ name: 'URL (Hosted Link) (Default)', value: 'url', description: 'Returns a downloadable URL — file hosted for 30 days' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns base64-encoded data inside JSON' },
			{ name: 'Both (URL + Base64)', value: 'both', description: 'Returns both URL and base64 in one response' },
			{ name: 'Binary File (Download)', value: 'file', description: 'Returns raw binary — great for piping into other nodes' },
		],
		default: 'url',
		description: 'How the converted PDF is returned',
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
		description: 'Filename for the output PDF file',
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
	const pageSize = this.getNodeParameter('img2pdf_page_size', index, 'original') as string;
	const fitMode = this.getNodeParameter('img2pdf_fit_mode', index, 'fit') as string;
	const margin = this.getNodeParameter('img2pdf_margin', index, 0) as number;

	let multipartBody: Buffer | undefined;
	let multipartBoundary: string | undefined;
	let body: Record<string, unknown> | undefined;

	/* ── build extra fields map (used by both multipart and JSON paths) ── */
	const extraFields: Record<string, string | number> = {};
	if (pageSize !== 'original') {
		extraFields.page_size = pageSize;
		const orientation = this.getNodeParameter('img2pdf_orientation', index, 'portrait') as string;
		if (orientation !== 'portrait') extraFields.orientation = orientation;
	}
	if (fitMode !== 'fit') extraFields.fit_mode = fitMode;
	if (margin > 0) extraFields.margin = margin;

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

		// standard fields
		for (const [key, val] of Object.entries({ output: outputFormat, output_filename: outputFilename, ...extraFields })) {
			if (val === undefined || val === '') continue;
			parts.push(
				Buffer.from(
					`--${multipartBoundary}\r\n` +
						`Content-Disposition: form-data; name="${key}"\r\n\r\n` +
						`${val}\r\n`,
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
		body = { urls, output: outputFormat, output_filename: outputFilename, ...extraFields };
	} else {
		const base64Images = this.getNodeParameter('img2pdf_base64', index) as string[];
		body = base64Images.length === 1
			? { image_base64: base64Images[0], output: outputFormat, output_filename: outputFilename, ...extraFields }
			: { images_base64: base64Images, output: outputFormat, output_filename: outputFilename, ...extraFields };
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
				ignoreHttpStatusErrors: true,
			},
		) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

		if (responseData.statusCode >= 400) {
			let errorBody: unknown;
			try { errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8')); } catch { errorBody = {}; }
			checkApiResponse(this, responseData.statusCode, errorBody, index);
		}

		returnData.push(
			await prepareBinaryResponse.call(
				this,
				index,
				responseData,
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
				returnFullResponse: true,
				ignoreHttpStatusErrors: true,
			},
		) as { body: unknown; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push(parseJsonResponseBody(responseData.body, index));
	}
}
