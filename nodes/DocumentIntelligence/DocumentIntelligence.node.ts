import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class DocumentIntelligence implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF API Hub - Document Intelligence',
		name: 'documentIntelligence',
		icon: { light: 'file:../../icons/pdfhub.light.svg', dark: 'file:../../icons/pdfhub.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Document intelligence operations for images and PDFs',
		defaults: {
			name: 'Document Intelligence',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'pdfapihubApi',
				required: true,
			},
		],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Similarity Check',
						value: 'documentSimilarity',
						description: 'Compare similarity between two images/PDF documents',
						action: 'Compare similarity between two documents',
					},
				],
				default: 'documentSimilarity',
			},
			{
				displayName: 'Input Mode',
				name: 'input_mode',
				type: 'options',
				options: [
					{
						name: 'Binary Files',
						value: 'file',
						description: 'Use two input binary properties',
					},
					{
						name: 'URLs',
						value: 'url',
						description: 'Use two public URLs',
					},
					{
						name: 'Base64',
						value: 'base64',
						description: 'Use two Base64 strings (or data URLs)',
					},
				],
				default: 'url',
				displayOptions: {
					show: {
						operation: ['documentSimilarity'],
					},
				},
			},
			{
				displayName: 'File 1 Binary Property',
				name: 'file1_binary_property',
				type: 'string',
				default: 'data1',
				description: 'Binary property name containing first image/PDF',
				displayOptions: {
					show: {
						operation: ['documentSimilarity'],
						input_mode: ['file'],
					},
				},
			},
			{
				displayName: 'File 2 Binary Property',
				name: 'file2_binary_property',
				type: 'string',
				default: 'data2',
				description: 'Binary property name containing second image/PDF',
				displayOptions: {
					show: {
						operation: ['documentSimilarity'],
						input_mode: ['file'],
					},
				},
			},
			{
				displayName: 'URL 1',
				name: 'url1',
				type: 'string',
				default: 'https://pdfapihub.com/sample-document-similarity-1.jpg',
				description: 'URL of first image/PDF',
				displayOptions: {
					show: {
						operation: ['documentSimilarity'],
						input_mode: ['url'],
					},
				},
			},
			{
				displayName: 'URL 2',
				name: 'url2',
				type: 'string',
				default: 'https://pdfapihub.com/sample-document-similarity-2.jpg',
				description: 'URL of second image/PDF',
				displayOptions: {
					show: {
						operation: ['documentSimilarity'],
						input_mode: ['url'],
					},
				},
			},
			{
				displayName: 'Image/PDF 1 Base64',
				name: 'image1_base64',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Base64 string (or data URL) for first image/PDF',
				displayOptions: {
					show: {
						operation: ['documentSimilarity'],
						input_mode: ['base64'],
					},
				},
			},
			{
				displayName: 'Image/PDF 2 Base64',
				name: 'image2_base64',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Base64 string (or data URL) for second image/PDF',
				displayOptions: {
					show: {
						operation: ['documentSimilarity'],
						input_mode: ['base64'],
					},
				},
			},
			{
				displayName: 'Method',
				name: 'method',
				type: 'options',
				options: [
					{ name: 'Auto', value: 'auto' },
					{ name: 'Feature Match', value: 'feature_match' },
					{ name: 'SSIM', value: 'ssim' },
					{ name: 'PHash', value: 'phash' },
				],
				default: 'auto',
				description: 'Similarity method',
				displayOptions: {
					show: {
						operation: ['documentSimilarity'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const normalizeUrl = (value: string): string => {
			const trimmed = value.trim();
			if (!trimmed) return trimmed;
			if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
			return `https://${trimmed}`;
		};

		const createTwoFileMultipart = async (
			itemIndex: number,
			file1BinaryProperty: string,
			file2BinaryProperty: string,
			method: string,
		) => {
			const boundary = `----n8nFormBoundary${Math.random().toString(36).slice(2)}`;
			const parts: Buffer[] = [];

			const appendFile = async (fieldName: 'file1' | 'file2', binaryPropertyName: string) => {
				const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
				const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
				const fileName = binaryData.fileName ?? `${fieldName}.bin`;
				const contentType = binaryData.mimeType ?? 'application/octet-stream';

				parts.push(
					Buffer.from(
						`--${boundary}\r\n` +
							`Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n` +
							`Content-Type: ${contentType}\r\n\r\n`,
					),
				);
				parts.push(Buffer.from(binaryDataBuffer));
				parts.push(Buffer.from('\r\n'));
			};

			await appendFile('file1', file1BinaryProperty);
			await appendFile('file2', file2BinaryProperty);

			if (method) {
				parts.push(
					Buffer.from(
						`--${boundary}\r\n` +
							'Content-Disposition: form-data; name="method"\r\n\r\n' +
							`${method}\r\n`,
					),
				);
			}

			parts.push(Buffer.from(`--${boundary}--\r\n`));

			return {
				body: Buffer.concat(parts),
				headers: {
					'Content-Type': `multipart/form-data; boundary=${boundary}`,
				},
			};
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				if (operation !== 'documentSimilarity') {
					throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, {
						itemIndex: i,
					});
				}

				const inputMode = this.getNodeParameter('input_mode', i) as string;
				const method = this.getNodeParameter('method', i) as string;

				if (inputMode === 'file') {
					const file1BinaryProperty = this.getNodeParameter('file1_binary_property', i) as string;
					const file2BinaryProperty = this.getNodeParameter('file2_binary_property', i) as string;
					const requestOptions = await createTwoFileMultipart(
						i,
						file1BinaryProperty,
						file2BinaryProperty,
						method,
					);

					const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
						method: 'POST',
						url: 'https://pdfapihub.com/api/v1/document/similarity',
						...requestOptions,
						returnFullResponse: true,
					});

					const responseBody = (responseData as { body?: unknown }).body;
					if (typeof responseBody === 'string') {
						try {
							returnData.push({ json: JSON.parse(responseBody), pairedItem: { item: i } });
						} catch {
							returnData.push({ json: { raw: responseBody }, pairedItem: { item: i } });
						}
					} else if (Buffer.isBuffer(responseBody)) {
						const text = responseBody.toString('utf8');
						try {
							returnData.push({ json: JSON.parse(text), pairedItem: { item: i } });
						} catch {
							returnData.push({ json: { raw: text }, pairedItem: { item: i } });
						}
					} else {
						returnData.push({
							json: (responseBody ?? {}) as IDataObject,
							pairedItem: { item: i },
						});
					}
				} else {
					const body: Record<string, string> = {
						method,
					};

					if (inputMode === 'url') {
						body.url1 = normalizeUrl(this.getNodeParameter('url1', i) as string);
						body.url2 = normalizeUrl(this.getNodeParameter('url2', i) as string);
					} else {
						body.image1_base64 = this.getNodeParameter('image1_base64', i) as string;
						body.image2_base64 = this.getNodeParameter('image2_base64', i) as string;
					}

					const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
						method: 'POST',
						url: 'https://pdfapihub.com/api/v1/document/similarity',
						body,
						json: true,
					});

					returnData.push({ json: responseData as IDataObject, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const message = error instanceof Error ? error.message : 'Unknown error';
					returnData.push({ json: { error: message }, pairedItem: { item: i } });
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
