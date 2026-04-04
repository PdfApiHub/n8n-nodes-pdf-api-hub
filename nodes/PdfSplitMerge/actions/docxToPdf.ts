import type { IExecuteFunctions, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart, parseJsonResponseBody, checkApiResponse } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'doc2pdf_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Hosted Link) (Default)', value: 'url', description: 'Returns a downloadable URL — file hosted for 30 days' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns base64-encoded data inside JSON' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the source document for conversion',
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
		description: 'Public URL of the document to convert (DOCX, PPTX, XLSX, ODT, etc.)',
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
		description: 'Base64-encoded content of the source document',
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
		description: 'Name of the binary property containing the document file to convert',
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
			{ name: 'Auto Detect (Default)', value: '', description: 'Automatically detect the file format from the extension or content' },
			{ name: 'DOC', value: 'doc', description: 'Microsoft Word 97-2003' },
			{ name: 'DOCX', value: 'docx', description: 'Microsoft Word 2007+' },
			{ name: 'ODP', value: 'odp', description: 'OpenDocument Presentation' },
			{ name: 'ODS', value: 'ods', description: 'OpenDocument Spreadsheet' },
			{ name: 'ODT', value: 'odt', description: 'OpenDocument Text' },
			{ name: 'PPT', value: 'ppt', description: 'Microsoft PowerPoint 97-2003' },
			{ name: 'PPTX', value: 'pptx', description: 'Microsoft PowerPoint 2007+' },
			{ name: 'RTF', value: 'rtf', description: 'Rich Text Format' },
			{ name: 'TXT', value: 'txt', description: 'Plain Text' },
			{ name: 'XLS', value: 'xls', description: 'Microsoft Excel 97-2003' },
			{ name: 'XLSX', value: 'xlsx', description: 'Microsoft Excel 2007+' },
		],
		default: '',
		description: 'Source file format — recommended when using Base64 input so the API can parse the file correctly',
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
			{ name: 'URL (Hosted Link) (Default)', value: 'url', description: 'Returns a downloadable URL — file hosted for 30 days' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns base64-encoded data inside JSON' },
			{ name: 'Both (URL + Base64)', value: 'both', description: 'Returns both URL and base64 in one response' },
			{ name: 'Binary File (Download)', value: 'file', description: 'Returns raw binary — great for piping into other nodes' },
		],
		default: 'url',
		description: 'How the converted PDF is returned',
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
		description: 'Filename for the output PDF (used when output format is File, URL, or Both)',
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
				url: 'https://pdfapihub.com/api/v1/convert/document/pdf',
				...requestOptions,
				returnFullResponse: true,
				ignoreHttpStatusErrors: true,
			},
		) as { body: unknown; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push(parseJsonResponseBody(responseData.body, index));
	}
}
