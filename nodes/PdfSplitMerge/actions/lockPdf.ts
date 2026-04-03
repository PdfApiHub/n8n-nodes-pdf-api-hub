import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'lock_input_type',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the PDF to lock',
		displayOptions: {
			show: {
				operation: ['lockPdf'],
			},
		},
	},
{
		displayName: 'PDF URL',
		name: 'lock_url',
		type: 'string',
		default: '',
		description: 'URL of the PDF to lock',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		displayOptions: {
			show: {
				operation: ['lockPdf'],
				lock_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Binary Property Name',
		name: 'lock_file_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: {
			show: {
				operation: ['lockPdf'],
				lock_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Password',
		name: 'lock_password',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		description: 'Password to set on the PDF',
		displayOptions: {
			show: {
				operation: ['lockPdf'],
			},
		},
	},
{
		displayName: 'Input Password',
		name: 'lock_input_password',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		description: 'Optional password if the input PDF is already encrypted',
		displayOptions: {
			show: {
				operation: ['lockPdf'],
			},
		},
	},
{
		displayName: 'Output Type',
		name: 'lock_output',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'File', value: 'file' },
			{ name: 'Base64', value: 'base64' },
		],
		default: 'file',
		description: 'Format of the locked PDF output',
		displayOptions: {
			show: {
				operation: ['lockPdf'],
			},
		},
	},
{
		displayName: 'Output Filename',
		name: 'lock_output_name',
		type: 'string',
		default: 'locked.pdf',
		description: 'Custom name for the output file',
		displayOptions: {
			show: {
				operation: ['lockPdf'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const lockInputType = this.getNodeParameter('lock_input_type', index) as string;
	const pdfUrl = this.getNodeParameter('lock_url', index, '') as string;
	const password = this.getNodeParameter('lock_password', index) as string;
	const inputPassword = this.getNodeParameter('lock_input_password', index, '') as string;
	const outputType = this.getNodeParameter('lock_output', index) as string;
	const outputName = this.getNodeParameter('lock_output_name', index) as string;

	const body: Record<string, unknown> = {
		password,
		output: outputType,
		output_name: outputName,
	};
	if (lockInputType === 'url') {
		body.url = normalizeUrl(pdfUrl);
	}

	if (inputPassword) {
		body.input_password = inputPassword;
	}

	if (outputType === 'file') {
		const requestOptions =
			lockInputType === 'file'
				? await createSingleFileMultipart.call(
						this,
						index,
						this.getNodeParameter('lock_file_binary_property', index) as string,
						body as Record<string, string | number | boolean>,
				  )
				: { body, json: true };
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/lockPdf',
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
			lockInputType === 'file'
				? await createSingleFileMultipart.call(
						this,
						index,
						this.getNodeParameter('lock_file_binary_property', index) as string,
						body as Record<string, string | number | boolean>,
				  )
				: { body, json: true };
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/lockPdf',
				...requestOptions,
				returnFullResponse: lockInputType === 'file',
			},
		);
		if (lockInputType === 'file') {
			const responseBody = (responseData as { body?: unknown }).body;
			returnData.push({ json: (responseBody ?? {}) as IDataObject, pairedItem: { item: index } });
		} else {
			returnData.push({ json: responseData as IDataObject, pairedItem: { item: index } });
		}
	}
}
