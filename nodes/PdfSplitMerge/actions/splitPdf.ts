import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart, parseJsonResponseBody } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'split_input_type',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the PDF to split',
		displayOptions: {
			show: {
				operation: ['splitPdf'],
			},
		},
	},
{
		displayName: 'PDF URL',
		name: 'url',
		type: 'string',
		default: '',
		description: 'The PDF URL to split',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		displayOptions: {
			show: {
				operation: ['splitPdf'],
				split_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Binary Property Name',
		name: 'split_file_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: {
			show: {
				operation: ['splitPdf'],
				split_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Split Type',
		name: 'splitType',
		type: 'options',
		options: [
			{
				name: 'Specific Pages',
				value: 'pages',
				description: 'Extract specific pages',
			},
			{
				name: 'Each Page',
				value: 'each',
				description: 'Split PDF into individual pages',
			},
			{
				name: 'Chunks',
				value: 'chunks',
				description: 'Split PDF into multiple chunks',
			},
		],
		default: 'pages',
		description: 'How to split the PDF',
		displayOptions: {
			show: {
				operation: ['splitPdf'],
			},
		},
	},
{
		displayName: 'Pages',
		name: 'pages',
		type: 'string',
		default: '',
		placeholder: '1-3,5',
		description: 'Pages to extract (e.g., "1-3,5" or comma-separated page numbers)',
		displayOptions: {
			show: {
				operation: ['splitPdf'],
				splitType: ['pages'],
			},
		},
	},
{
		displayName: 'Number of Chunks',
		name: 'chunks',
		type: 'number',
		default: 2,
		description: 'Number of chunks to split the PDF into',
		displayOptions: {
			show: {
				operation: ['splitPdf'],
				splitType: ['chunks'],
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
				description: 'Return URLs to the split PDF(s)',
			},
			{
				name: 'File/ZIP',
				value: 'file',
				description: 'Download the split PDF(s) as file or ZIP',
			},
			{
				name: 'Base64',
				value: 'base64',
				description: 'Return the split PDF(s) as Base64-encoded string(s)',
			},
		],
		default: 'url',
		description: 'Whether to return URLs or download files',
		displayOptions: {
			show: {
				operation: ['splitPdf'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const splitInputType = this.getNodeParameter('split_input_type', index) as string;
	const pdfUrl = this.getNodeParameter('url', index, '') as string;
	const splitType = this.getNodeParameter('splitType', index) as string;
	const output = this.getNodeParameter('output', index) as string;

	const body: Record<string, unknown> = { output };
	if (splitInputType === 'url') {
		body.url = normalizeUrl(pdfUrl);
	}

	if (splitType === 'pages') {
		const pages = this.getNodeParameter('pages', index) as string;
		body.pages = pages;
	} else if (splitType === 'each') {
		body.mode = 'each';
	} else if (splitType === 'chunks') {
		const chunks = this.getNodeParameter('chunks', index) as number;
		body.chunks = chunks;
	}

	if (output === 'file') {
		const requestOptions =
			splitInputType === 'file'
				? await createSingleFileMultipart.call(
						this,
						index,
						this.getNodeParameter('split_file_binary_property', index) as string,
						body as Record<string, string | number | boolean>,
				  )
				: { body, json: true };
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/pdf/split',
				...requestOptions,
				encoding: 'arraybuffer',
				returnFullResponse: true,
			},
		);

		returnData.push(
			await prepareBinaryResponse.call(
				this,
				index,
				responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
				'split',
				'application/octet-stream',
			),
		);
	} else {
		const requestOptions =
			splitInputType === 'file'
				? await createSingleFileMultipart.call(
						this,
						index,
						this.getNodeParameter('split_file_binary_property', index) as string,
						body as Record<string, string | number | boolean>,
				  )
				: { body, json: true };
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/pdf/split',
				...requestOptions,
				returnFullResponse: splitInputType === 'file',
			},
		);
		if (splitInputType === 'file') {
			const responseBody = (responseData as { body?: unknown }).body;
			returnData.push(parseJsonResponseBody(responseBody, index));
		} else {
			returnData.push({ json: responseData as IDataObject, pairedItem: { item: index } });
		}
	}
}
