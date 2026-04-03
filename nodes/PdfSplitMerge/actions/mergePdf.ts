import type { IExecuteFunctions, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, parseJsonResponseBody } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'merge_input_type',
		type: 'options',
		options: [
			{
				name: 'URL',
				value: 'url',
				description: 'Provide publicly accessible PDF URLs',
			},
			{
				name: 'File (Binary)',
				value: 'file',
				description: 'Upload PDF files from incoming binary data',
			},
		],
		default: 'url',
		description: 'How to provide the PDFs to merge',
		displayOptions: {
			show: {
				operation: ['mergePdf'],
			},
		},
	},
{
		displayName: 'URLs',
		name: 'urls',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		default: [],
		description: 'Array of PDF URLs to merge',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		displayOptions: {
			show: {
				operation: ['mergePdf'],
				merge_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Binary Property Names',
		name: 'merge_files_binary_properties',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		default: ['data'],
		description:
			'One or more binary property names that contain PDFs to merge (for example: "data"). Each entry should point to a PDF binary.',
		displayOptions: {
			show: {
				operation: ['mergePdf'],
				merge_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Output Format',
		name: 'output',
		type: 'options',
		options: [
			{
				name: 'URL',
				value: 'url',
				description: 'Return a URL to the merged PDF',
			},
			{
				name: 'File',
				value: 'file',
				description: 'Download the merged PDF as a file',
			},
			{
				name: 'Base64',
				value: 'base64',
				description: 'Return the merged PDF as a Base64-encoded string',
			},
		],
		default: 'url',
		description: 'Whether to return a URL or download the file',
		displayOptions: {
			show: {
				operation: ['mergePdf'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const output = this.getNodeParameter('output', index) as string;
	const mergeInputType = this.getNodeParameter('merge_input_type', index) as string;

	const isFileInput = mergeInputType === 'file';
	const body = !isFileInput
		? {
				urls: (this.getNodeParameter('urls', index) as string[]).map(normalizeUrl),
				output,
			}
		: undefined;

	let multipartBody: Buffer | undefined;
	let multipartBoundary: string | undefined;
	if (isFileInput) {
		const binaryPropertyNamesParam = this.getNodeParameter(
			'merge_files_binary_properties',
			index,
		) as unknown;

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
			const fileName = binaryData.fileName ?? 'file.pdf';
			const contentType = binaryData.mimeType ?? 'application/pdf';

			parts.push(
				Buffer.from(
					`--${multipartBoundary}\r\n` +
						`Content-Disposition: form-data; name="files"; filename="${fileName}"\r\n` +
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
					`${output}\r\n`,
			),
		);
		parts.push(Buffer.from(`--${multipartBoundary}--\r\n`));

		multipartBody = Buffer.concat(parts);
	}

	if (output === 'file') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/pdf/merge',
				...(isFileInput
					? {
							body: multipartBody as Buffer,
							headers: {
								'Content-Type': `multipart/form-data; boundary=${multipartBoundary}`,
							},
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
				'merged.pdf',
				'application/pdf',
			),
		);
	} else {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/pdf/merge',
				...(isFileInput
					? {
							body: multipartBody as Buffer,
							headers: {
								'Content-Type': `multipart/form-data; boundary=${multipartBoundary}`,
							},
						}
					: { body, json: true }),
				returnFullResponse: true,
			},
		);

		const responseBody = (responseData as { body?: unknown }).body;
		returnData.push(parseJsonResponseBody(responseBody, index));
	}
}
