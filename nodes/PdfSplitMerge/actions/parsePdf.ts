import type { IExecuteFunctions, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, createSingleFileMultipart, parseJsonResponseBody, checkApiResponse } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'parse_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Default)', value: 'url' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the PDF to parse',
		displayOptions: {
			show: {
				operation: ['parsePdf'],
			},
		},
	},
{
		displayName: 'PDF URL',
		name: 'parse_url',
		type: 'string',
		default: '',
		description: 'URL of the PDF to parse',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		displayOptions: {
			show: {
				operation: ['parsePdf'],
				parse_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Binary Property Name',
		name: 'parse_file_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: {
			show: {
				operation: ['parsePdf'],
				parse_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Parse Mode',
		name: 'parse_mode',
		type: 'options',
		options: [
			{ name: 'Text Only (Default)', value: 'text', description: 'Extract text only' },
			{ name: 'Layout', value: 'layout', description: 'Text + text blocks with bounding boxes' },
			{ name: 'Tables', value: 'tables', description: 'Text + table blocks' },
			{ name: 'Full', value: 'full', description: 'Text + blocks + tables + images' },
		],
		default: 'text',
		description: 'What to extract from the PDF',
		displayOptions: {
			show: {
				operation: ['parsePdf'],
			},
		},
	},
{
		displayName: 'Pages',
		name: 'parse_pages',
		type: 'string',
		default: 'all',
		description: 'Page selection: "all" or a range like "1-3" or single page like "2"',
		displayOptions: {
			show: {
				operation: ['parsePdf'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const parseInputType = this.getNodeParameter('parse_input_type', index) as string;
	const pdfUrl = this.getNodeParameter('parse_url', index, '') as string;
	const mode = this.getNodeParameter('parse_mode', index) as string;
	const pages = this.getNodeParameter('parse_pages', index) as string;

	const body: Record<string, unknown> = { mode, pages };
	if (parseInputType === 'url') {
		body.url = normalizeUrl(pdfUrl);
	}

	const requestOptions =
		parseInputType === 'file'
			? await createSingleFileMultipart.call(
					this,
					index,
					this.getNodeParameter('parse_file_binary_property', index) as string,
					body as Record<string, string | number | boolean>,
			  )
			: { body, json: true };
	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'pdfapihubApi',
		{
			method: 'POST',
			url: 'https://pdfapihub.com/api/v1/pdf/parse',
			...requestOptions,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		},
	) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}
