import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart, parseJsonResponseBody } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'doc2pdf_input_type',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Base64', value: 'base64' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the source document',
		displayOptions: {
			show: {
				operation: ['docxToPdf'],
			},
		},
	},
{
		displayName: 'Document URL',
		name: 'doc2pdf_url',
		type: 'string',
		default: '',
		description: 'Public URL of the source document',
		placeholder: 'https://pdfapihub.com/sample.docx',
		displayOptions: {
			show: {
				operation: ['docxToPdf'],
				doc2pdf_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Base64 File',
		name: 'doc2pdf_base64_file',
		type: 'string',
		default: '',
		description: 'Base64 encoded source document',
		displayOptions: {
			show: {
				operation: ['docxToPdf'],
				doc2pdf_input_type: ['base64'],
			},
		},
	},
{
		displayName: 'Binary Property Name',
		name: 'doc2pdf_file_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the source document file',
		displayOptions: {
			show: {
				operation: ['docxToPdf'],
				doc2pdf_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Input Format',
		name: 'doc2pdf_input_format',
		type: 'options',
		options: [
			{ name: 'Auto Detect', value: '' },
			{ name: 'DOC', value: 'doc' },
			{ name: 'DOCX', value: 'docx' },
			{ name: 'ODP', value: 'odp' },
			{ name: 'ODS', value: 'ods' },
			{ name: 'ODT', value: 'odt' },
			{ name: 'PPT', value: 'ppt' },
			{ name: 'PPTX', value: 'pptx' },
			{ name: 'RTF', value: 'rtf' },
			{ name: 'TXT', value: 'txt' },
			{ name: 'XLS', value: 'xls' },
			{ name: 'XLSX', value: 'xlsx' },
		],
		default: '',
		description: 'Optional source format (recommended for base64 input)',
		displayOptions: {
			show: {
				operation: ['docxToPdf'],
			},
		},
	},
{
		displayName: 'Output Format',
		name: 'doc2pdf_output',
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
				operation: ['docxToPdf'],
			},
		},
	},
{
		displayName: 'Output Filename',
		name: 'doc2pdf_output_filename',
		type: 'string',
		default: 'converted.pdf',
		description: 'Optional output filename (used for file output)',
		displayOptions: {
			show: {
				operation: ['docxToPdf'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const inputType = this.getNodeParameter('doc2pdf_input_type', index) as string;
	const outputFormat = this.getNodeParameter('doc2pdf_output', index) as string;
	const outputFilename = this.getNodeParameter('doc2pdf_output_filename', index) as string;
	const inputFormat = this.getNodeParameter('doc2pdf_input_format', index, '') as string;

	let requestOptions: Record<string, unknown>;

	if (inputType === 'file') {
		const fields: Record<string, string | number | boolean> = {
			output: outputFormat,
			output_filename: outputFilename,
		};
		if (inputFormat) {
			fields.input_format = inputFormat;
		}

		requestOptions = await createSingleFileMultipart.call(
			this,
			index,
			this.getNodeParameter('doc2pdf_file_binary_property', index) as string,
			fields,
		);
	} else {
		const body: Record<string, unknown> = {
			output: outputFormat,
			output_filename: outputFilename,
		};

		if (inputType === 'url') {
			body.url = normalizeUrl(this.getNodeParameter('doc2pdf_url', index) as string);
		} else {
			body.file = this.getNodeParameter('doc2pdf_base64_file', index) as string;
		}

		if (inputFormat) {
			body.input_format = inputFormat;
		}

		requestOptions = { body, json: true };
	}

	if (outputFormat === 'file') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/convert/document/pdf',
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
				url: 'https://pdfapihub.com/api/v1/convert/document/pdf',
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
