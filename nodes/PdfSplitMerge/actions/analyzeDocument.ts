import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { checkApiResponse, createSingleFileMultipart, normalizeUrl, parseJsonResponseBody } from '../helpers';

export const description: INodeProperties[] = [
	{
		displayName: 'Input Type',
		name: 'analyze_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Default)', value: 'url', description: 'Provide a publicly accessible PDF URL' },
			{ name: 'Base64', value: 'base64', description: 'Provide a base64-encoded PDF or data URL' },
			{ name: 'Binary File', value: 'file', description: 'Use a PDF file from a previous node' },
		],
		default: 'url',
		description: 'How to provide the PDF for analysis',
		displayOptions: { show: { operation: ['analyzeDocument'] } },
	},
	{
		displayName: 'PDF URL',
		name: 'analyze_url',
		type: 'string',
		default: 'https://pdfapihub.com/sample-pdfinvoice-with-image.pdf',
		description: 'Public URL of the PDF to analyze',
		displayOptions: { show: { operation: ['analyzeDocument'], analyze_input_type: ['url'] } },
	},
	{
		displayName: 'Base64 PDF',
		name: 'analyze_base64_pdf',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		placeholder: 'data:application/pdf;base64,JVBERi0xLjQK...',
		description: 'Base64-encoded PDF in raw base64 or data URL format',
		displayOptions: { show: { operation: ['analyzeDocument'], analyze_input_type: ['base64'] } },
	},
	{
		displayName: 'Binary Property Name',
		name: 'analyze_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: { show: { operation: ['analyzeDocument'], analyze_input_type: ['file'] } },
	},
	{
		displayName: 'Pages',
		name: 'analyze_pages',
		type: 'string',
		default: 'all',
		placeholder: '1-3,5',
		description: 'Pages to analyze: "all", a page, a range, or a mixed selection',
		displayOptions: { show: { operation: ['analyzeDocument'] } },
	},
	{
		displayName: 'Features',
		name: 'analyze_features',
		type: 'multiOptions',
		options: [
			{ name: 'Forms', value: 'FORMS', description: 'Extract key-value pairs and selections' },
			{ name: 'Layout', value: 'LAYOUT', description: 'Extract titles, paragraphs, lists, headers, and footers' },
			{ name: 'Queries', value: 'QUERIES', description: 'Answer questions about English documents' },
			{ name: 'Signatures', value: 'SIGNATURES', description: 'Locate signatures and return confidence' },
			{ name: 'Tables', value: 'TABLES', description: 'Extract cells, rows, spans, and positions' },
		],
		default: ['FORMS', 'TABLES'],
		required: true,
		description: 'Structured information to return. Text is always included.',
		displayOptions: { show: { operation: ['analyzeDocument'] } },
	},
	{
		displayName: 'Queries',
		name: 'analyze_queries',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, maxValue: 15 },
		default: {},
		placeholder: 'Add Query',
		options: [
			{
				displayName: 'Query',
				name: 'values',
				values: [
					{
						displayName: 'Question',
						name: 'text',
						type: 'string',
						default: '',
						required: true,
						placeholder: 'What is the invoice number?',
					},
					{
						displayName: 'Alias',
						name: 'alias',
						type: 'string',
						default: '',
						placeholder: 'invoice_number',
						description: 'Optional stable name for the answer',
					},
				],
			},
		],
		description: 'Questions to answer. AWS Textract supports up to 15 per page and English documents only.',
		displayOptions: { show: { operation: ['analyzeDocument'], analyze_features: ['QUERIES'] } },
	},
	{
		displayName: 'Queries support English documents only. Analysis runs synchronously once per selected PDF page.',
		name: 'analyzeQueriesNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { operation: ['analyzeDocument'], analyze_features: ['QUERIES'] } },
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const inputType = this.getNodeParameter('analyze_input_type', index) as string;
	const features = this.getNodeParameter('analyze_features', index) as string[];
	const queryCollection = this.getNodeParameter('analyze_queries', index, {}) as {
		values?: Array<{ text: string; alias?: string }>;
	};
	const queries = (queryCollection.values ?? []).map((query) => ({
		text: query.text,
		...(query.alias ? { alias: query.alias } : {}),
	}));
	const body: Record<string, unknown> = {
		pages: this.getNodeParameter('analyze_pages', index, 'all') as string,
		features,
	};
	if (features.includes('QUERIES')) body.queries = queries;
	if (inputType === 'url') {
		body.url = normalizeUrl(this.getNodeParameter('analyze_url', index, '') as string);
	} else if (inputType === 'base64') {
		body.base64_pdf = this.getNodeParameter('analyze_base64_pdf', index, '') as string;
	}

	const requestOptions = inputType === 'file'
		? await createSingleFileMultipart.call(
				this,
				index,
				this.getNodeParameter('analyze_binary_property', index) as string,
				{
					pages: body.pages as string,
					features: features.join(','),
					...(queries.length ? { queries: JSON.stringify(queries) } : {}),
				},
			)
		: { body, json: true };

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'pdfapihubApi',
		{
			method: 'POST',
			url: 'https://pdfapihub.com/api/v1/pdf/analyze',
			...requestOptions,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		},
	) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}