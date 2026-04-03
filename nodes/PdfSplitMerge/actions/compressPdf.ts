import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Input Type',
		name: 'compress_input_type',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the PDF to compress',
		displayOptions: {
			show: {
				operation: ['compressPdf'],
			},
		},
	},
{
		displayName: 'PDF URL',
		name: 'compress_url',
		type: 'string',
		default: '',
		description: 'URL of the PDF to compress',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		displayOptions: {
			show: {
				operation: ['compressPdf'],
				compress_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Binary Property Name',
		name: 'compress_file_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: {
			show: {
				operation: ['compressPdf'],
				compress_input_type: ['file'],
			},
		},
	},
{
		displayName: 'Compression Level',
		name: 'compression',
		type: 'options',
		options: [
			{ name: 'Low', value: 'low' },
			{ name: 'Medium', value: 'medium' },
			{ name: 'High', value: 'high' },
			{ name: 'Max', value: 'max' },
		],
		default: 'high',
		description: 'Compression strength (higher is more aggressive)',
		displayOptions: {
			show: {
				operation: ['compressPdf'],
			},
		},
	},
{
		displayName: 'Output Type',
		name: 'compress_output',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'File', value: 'file' },
			{ name: 'Base64', value: 'base64' },
		],
		default: 'file',
		description: 'Format of the compressed PDF output',
		displayOptions: {
			show: {
				operation: ['compressPdf'],
			},
		},
	},
{
		displayName: 'Output Filename',
		name: 'compress_output_name',
		type: 'string',
		default: 'compressed.pdf',
		description: 'Custom name for the output file',
		displayOptions: {
			show: {
				operation: ['compressPdf'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const compressInputType = this.getNodeParameter('compress_input_type', index) as string;
	const pdfUrl = this.getNodeParameter('compress_url', index, '') as string;
	const compression = this.getNodeParameter('compression', index) as string;
	const outputType = this.getNodeParameter('compress_output', index) as string;
	const outputName = this.getNodeParameter('compress_output_name', index) as string;

	const body: Record<string, unknown> = {
		compression,
		output: outputType,
		output_name: outputName,
	};
	if (compressInputType === 'url') {
		body.url = normalizeUrl(pdfUrl);
	}

	if (outputType === 'file') {
		const requestOptions =
			compressInputType === 'file'
				? await createSingleFileMultipart.call(
						this,
						index,
						this.getNodeParameter('compress_file_binary_property', index) as string,
						body as Record<string, string | number | boolean>,
				  )
				: { body, json: true };
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/compressPdf',
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
			compressInputType === 'file'
				? await createSingleFileMultipart.call(
						this,
						index,
						this.getNodeParameter('compress_file_binary_property', index) as string,
						body as Record<string, string | number | boolean>,
				  )
				: { body, json: true };
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/compressPdf',
				...requestOptions,
				returnFullResponse: compressInputType === 'file',
			},
		);
		if (compressInputType === 'file') {
			const responseBody = (responseData as { body?: unknown }).body;
			returnData.push({ json: (responseBody ?? {}) as IDataObject, pairedItem: { item: index } });
		} else {
			returnData.push({ json: responseData as IDataObject, pairedItem: { item: index } });
		}
	}
}
