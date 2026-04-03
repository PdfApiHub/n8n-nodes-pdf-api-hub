import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'watermark_input_type',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Base64', value: 'base64' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the file to watermark',
		displayOptions: {
			show: {
				operation: ['addWatermark'],
			},
		},
	},
{
		displayName: 'File URL',
		name: 'watermark_url',
		type: 'string',
		default: '',
		description: 'URL of the PDF or image to watermark',
		displayOptions: {
			show: {
				operation: ['addWatermark'],
				watermark_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Base64 File',
		name: 'watermark_base64',
		type: 'string',
		default: '',
		description: 'Base64-encoded file contents',
		displayOptions: {
			show: {
				operation: ['addWatermark'],
				watermark_input_type: ['base64'],
			},
		},
	},
{
		displayName: 'Binary Property Name',
		name: 'watermark_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property name containing the file',
		displayOptions: {
			show: {
				operation: ['addWatermark'],
				watermark_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Watermark Text',
		name: 'watermark_text',
		type: 'string',
		default: 'CONFIDENTIAL',
		description: 'Text to use as watermark',
		displayOptions: {
			show: {
				operation: ['addWatermark'],
			},
		},
	},
{
		displayName: 'Opacity',
		name: 'watermark_opacity',
		type: 'number',
		default: 0.15,
		description: 'Watermark opacity (0.0 to 1.0)',
		displayOptions: {
			show: {
				operation: ['addWatermark'],
			},
		},
	},
{
		displayName: 'Angle',
		name: 'watermark_angle',
		type: 'number',
		default: 30,
		description: 'Rotation angle in degrees',
		displayOptions: {
			show: {
				operation: ['addWatermark'],
			},
		},
	},
{
		displayName: 'Font Size',
		name: 'watermark_font_size',
		type: 'number',
		default: 0,
		description: 'Font size (0 for auto)',
		displayOptions: {
			show: {
				operation: ['addWatermark'],
			},
		},
	},
{
		displayName: 'Output Format',
		name: 'watermark_output',
		type: 'options',
		options: [
			{ name: 'File', value: 'file' },
			{ name: 'URL', value: 'url' },
			{ name: 'Base64', value: 'base64' },
			{ name: 'Both', value: 'both' },
		],
		default: 'file',
		description: 'Format of the watermarked output',
		displayOptions: {
			show: {
				operation: ['addWatermark'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const inputType = this.getNodeParameter('watermark_input_type', index) as string;
	const text = this.getNodeParameter('watermark_text', index) as string;
	const opacity = this.getNodeParameter('watermark_opacity', index) as number;
	const angle = this.getNodeParameter('watermark_angle', index) as number;
	const fontSize = this.getNodeParameter('watermark_font_size', index) as number;
	const outputFormat = this.getNodeParameter('watermark_output', index) as string;

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

		parts.push(
			Buffer.from(
				`--${multipartBoundary}\r\n` +
					`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
					`Content-Type: ${contentType}\r\n\r\n`,
			),
		);
		parts.push(Buffer.from(binaryDataBuffer));
		parts.push(Buffer.from('\r\n'));

		parts.push(
			Buffer.from(
				`--${multipartBoundary}\r\n` +
					'Content-Disposition: form-data; name="text"\r\n\r\n' +
					`${text}\r\n`,
			),
		);
		parts.push(
			Buffer.from(
				`--${multipartBoundary}\r\n` +
					'Content-Disposition: form-data; name="opacity"\r\n\r\n' +
					`${opacity}\r\n`,
			),
		);
		parts.push(
			Buffer.from(
				`--${multipartBoundary}\r\n` +
					'Content-Disposition: form-data; name="angle"\r\n\r\n' +
					`${angle}\r\n`,
			),
		);
		if (fontSize > 0) {
			parts.push(
				Buffer.from(
					`--${multipartBoundary}\r\n` +
						'Content-Disposition: form-data; name="font_size"\r\n\r\n' +
						`${fontSize}\r\n`,
				),
			);
		}
		parts.push(
			Buffer.from(
				`--${multipartBoundary}\r\n` +
					'Content-Disposition: form-data; name="output_format"\r\n\r\n' +
					`${outputFormat}\r\n`,
			),
		);
		parts.push(Buffer.from(`--${multipartBoundary}--\r\n`));
		multipartBody = Buffer.concat(parts);
	} else if (inputType === 'url') {
		const fileUrl = normalizeUrl(this.getNodeParameter('watermark_url', index) as string);
		body = { file_url: fileUrl, text, opacity, angle, output_format: outputFormat };
		if (fontSize > 0) body.font_size = fontSize;
	} else {
		const base64File = this.getNodeParameter('watermark_base64', index) as string;
		body = { base64_file: base64File, text, opacity, angle, output_format: outputFormat };
		if (fontSize > 0) body.font_size = fontSize;
	}

	if (outputFormat === 'file') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/watermark',
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
				'watermarked.pdf',
				'application/pdf',
			),
		);
	} else {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/watermark',
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
