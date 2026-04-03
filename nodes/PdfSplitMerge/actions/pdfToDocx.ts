import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart, parseJsonResponseBody } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'pdf2docx_input_type',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Base64', value: 'base64' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the source PDF',
		displayOptions: {
			show: {
				operation: ['pdfToDocx'],
			},
		},
	},
{
		displayName: 'PDF URL',
		name: 'pdf2docx_url',
		type: 'string',
		default: '',
		description: 'Public URL of the source PDF',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		displayOptions: {
			show: {
				operation: ['pdfToDocx'],
				pdf2docx_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Base64 PDF',
		name: 'pdf2docx_base64_file',
		type: 'string',
		default: '',
		description: 'Base64 encoded PDF',
		displayOptions: {
			show: {
				operation: ['pdfToDocx'],
				pdf2docx_input_type: ['base64'],
			},
		},
	},
{
		displayName: 'Binary Property Name',
		name: 'pdf2docx_file_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the source PDF file',
		displayOptions: {
			show: {
				operation: ['pdfToDocx'],
				pdf2docx_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Output Format',
		name: 'pdf2docx_output',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Base64', value: 'base64' },
			{ name: 'Both', value: 'both' },
			{ name: 'File', value: 'file' },
		],
		default: 'url',
		description: 'Format of the output DOCX',
		displayOptions: {
			show: {
				operation: ['pdfToDocx'],
			},
		},
	},
{
		displayName: 'Output Filename',
		name: 'pdf2docx_output_filename',
		type: 'string',
		default: 'converted.docx',
		description: 'Optional output filename (used for file output)',
		displayOptions: {
			show: {
				operation: ['pdfToDocx'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const inputType = this.getNodeParameter('pdf2docx_input_type', index) as string;
	const outputFormat = this.getNodeParameter('pdf2docx_output', index) as string;
	const outputFilename = this.getNodeParameter('pdf2docx_output_filename', index) as string;

	let requestOptions: Record<string, unknown>;

	if (inputType === 'file') {
		requestOptions = await createSingleFileMultipart.call(
			this,
			index,
			this.getNodeParameter('pdf2docx_file_binary_property', index) as string,
			{
				output: outputFormat,
				output_filename: outputFilename,
			},
		);
	} else {
		const body: Record<string, unknown> = {
			output: outputFormat,
			output_filename: outputFilename,
		};

		if (inputType === 'url') {
			body.url = normalizeUrl(this.getNodeParameter('pdf2docx_url', index) as string);
		} else {
			body.file = this.getNodeParameter('pdf2docx_base64_file', index) as string;
		}

		requestOptions = { body, json: true };
	}

	if (outputFormat === 'file') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/convert/pdf/docx',
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
				outputFilename || 'converted.docx',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			),
		);
	} else {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/convert/pdf/docx',
				...requestOptions,
				returnFullResponse: inputType === 'file',
			},
		);
		if (inputType === 'file') {
			const responseBody = (responseData as { body?: unknown }).body;
			returnData.push(parseJsonResponseBody(responseBody, index));
		} else {
			returnData.push({ json: responseData as IDataObject, pairedItem: { item: index } });
		}
	}
}
