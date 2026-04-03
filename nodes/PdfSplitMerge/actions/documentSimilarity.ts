import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, createTwoFileMultipart, parseJsonResponseBody } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Mode',
		name: 'doc_similarity_input_mode',
		type: 'options',
		options: [
			{ name: 'URLs', value: 'url', description: 'Use two public URLs' },
			{ name: 'Base64', value: 'base64', description: 'Use two Base64 strings (or data URLs)' },
			{ name: 'Binary Files', value: 'file', description: 'Use two binary input properties' },
		],
		default: 'url',
		description: 'How to provide the two documents',
		displayOptions: {
			show: {
				operation: ['documentSimilarity'],
			},
		},
	},
{
		displayName: 'URL 1',
		name: 'doc_similarity_url1',
		type: 'string',
		default: 'https://pdfapihub.com/sample-document-similarity-1.jpg',
		description: 'URL to first image/PDF',
		displayOptions: {
			show: {
				operation: ['documentSimilarity'],
				doc_similarity_input_mode: ['url'],
			},
		},
	},
{
		displayName: 'URL 2',
		name: 'doc_similarity_url2',
		type: 'string',
		default: 'https://pdfapihub.com/sample-document-similarity-2.jpg',
		description: 'URL to second image/PDF',
		displayOptions: {
			show: {
				operation: ['documentSimilarity'],
				doc_similarity_input_mode: ['url'],
			},
		},
	},
{
		displayName: 'Image/PDF 1 Base64',
		name: 'doc_similarity_base64_1',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'Base64 string (or data URL) for first image/PDF',
		displayOptions: {
			show: {
				operation: ['documentSimilarity'],
				doc_similarity_input_mode: ['base64'],
			},
		},
	},
{
		displayName: 'Image/PDF 2 Base64',
		name: 'doc_similarity_base64_2',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'Base64 string (or data URL) for second image/PDF',
		displayOptions: {
			show: {
				operation: ['documentSimilarity'],
				doc_similarity_input_mode: ['base64'],
			},
		},
	},
{
		displayName: 'File 1 Binary Property',
		name: 'doc_similarity_file1_binary_property',
		type: 'string',
		default: 'data1',
		description: 'Binary property containing first image/PDF file',
		displayOptions: {
			show: {
				operation: ['documentSimilarity'],
				doc_similarity_input_mode: ['file'],
			},
		},
	},
{
		displayName: 'File 2 Binary Property',
		name: 'doc_similarity_file2_binary_property',
		type: 'string',
		default: 'data2',
		description: 'Binary property containing second image/PDF file',
		displayOptions: {
			show: {
				operation: ['documentSimilarity'],
				doc_similarity_input_mode: ['file'],
			},
		},
	},
{
		displayName: 'Method',
		name: 'doc_similarity_method',
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
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const inputMode = this.getNodeParameter('doc_similarity_input_mode', index) as string;
	const method = this.getNodeParameter('doc_similarity_method', index) as string;

	if (inputMode === 'file') {
		const file1BinaryProperty = this.getNodeParameter(
			'doc_similarity_file1_binary_property',
			index,
		) as string;
		const file2BinaryProperty = this.getNodeParameter(
			'doc_similarity_file2_binary_property',
			index,
		) as string;
		const requestOptions = await createTwoFileMultipart.call(
			this,
			index,
			file1BinaryProperty,
			file2BinaryProperty,
			method,
		);

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/document/similarity',
				...requestOptions,
				returnFullResponse: true,
			},
		);

		const responseBody = (responseData as { body?: unknown }).body;
		returnData.push(parseJsonResponseBody(responseBody, index));
	} else {
		const body: Record<string, string> = {
			method,
		};

		if (inputMode === 'url') {
			body.url1 = normalizeUrl(this.getNodeParameter('doc_similarity_url1', index) as string);
			body.url2 = normalizeUrl(this.getNodeParameter('doc_similarity_url2', index) as string);
		} else {
			body.image1_base64 = this.getNodeParameter('doc_similarity_base64_1', index) as string;
			body.image2_base64 = this.getNodeParameter('doc_similarity_base64_2', index) as string;
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/document/similarity',
				body,
				json: true,
			},
		);

		returnData.push({ json: responseData as IDataObject, pairedItem: { item: index } });
	}
}
