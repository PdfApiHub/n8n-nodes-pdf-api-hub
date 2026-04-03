import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'unlock_input_type',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the PDF to unlock',
		displayOptions: {
			show: {
				operation: ['unlockPdf'],
			},
		},
	},
{
		displayName: 'PDF URL',
		name: 'unlock_url',
		type: 'string',
		default: '',
		description: 'URL of the password-protected PDF to unlock',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		displayOptions: {
			show: {
				operation: ['unlockPdf'],
				unlock_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Binary Property Name',
		name: 'unlock_file_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: {
			show: {
				operation: ['unlockPdf'],
				unlock_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Password',
		name: 'unlock_password',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		description: 'Password to unlock the PDF',
		displayOptions: {
			show: {
				operation: ['unlockPdf'],
			},
		},
	},
{
		displayName: 'Output Type',
		name: 'unlock_output',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'File', value: 'file' },
			{ name: 'Base64', value: 'base64' },
		],
		default: 'file',
		description: 'Format of the unlocked PDF output',
		displayOptions: {
			show: {
				operation: ['unlockPdf'],
			},
		},
	},
{
		displayName: 'Output Filename',
		name: 'unlock_output_name',
		type: 'string',
		default: 'unlocked.pdf',
		description: 'Custom name for the output file',
		displayOptions: {
			show: {
				operation: ['unlockPdf'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const unlockInputType = this.getNodeParameter('unlock_input_type', index) as string;
	const pdfUrl = this.getNodeParameter('unlock_url', index, '') as string;
	const password = this.getNodeParameter('unlock_password', index) as string;
	const outputType = this.getNodeParameter('unlock_output', index) as string;
	const outputName = this.getNodeParameter('unlock_output_name', index) as string;

	const body: Record<string, unknown> = {
		password,
		output: outputType,
		output_name: outputName,
	};
	if (unlockInputType === 'url') {
		body.url = normalizeUrl(pdfUrl);
	}

	if (outputType === 'file') {
		const requestOptions =
			unlockInputType === 'file'
				? await createSingleFileMultipart.call(
						this,
						index,
						this.getNodeParameter('unlock_file_binary_property', index) as string,
						body as Record<string, string | number | boolean>,
				  )
				: { body, json: true };
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/unlockPdf',
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
				outputName,
				'application/pdf',
			),
		);
	} else {
		const requestOptions =
			unlockInputType === 'file'
				? await createSingleFileMultipart.call(
						this,
						index,
						this.getNodeParameter('unlock_file_binary_property', index) as string,
						body as Record<string, string | number | boolean>,
				  )
				: { body, json: true };
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/unlockPdf',
				...requestOptions,
				returnFullResponse: unlockInputType === 'file',
			},
		);
		if (unlockInputType === 'file') {
			const responseBody = (responseData as { body?: unknown }).body;
			returnData.push({ json: (responseBody ?? {}) as IDataObject, pairedItem: { item: index } });
		} else {
			returnData.push({ json: responseData as IDataObject, pairedItem: { item: index } });
		}
	}
}
