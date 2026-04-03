import type { IExecuteFunctions, IDataObject, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, createSingleFileMultipart, parseJsonResponseBody } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'Image Input Type',
		name: 'ocr_image_input_type',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Base64', value: 'base64' },
			{ name: 'File (Binary)', value: 'file' },
		],
		default: 'url',
		description: 'How to provide the image',
		displayOptions: {
			show: {
				operation: ['imageOcrParse'],
			},
		},
	},
{
		displayName: 'Image URL',
		name: 'ocr_image_url',
		type: 'string',
		default: 'https://pdfapihub.com/sample-invoicepage.png',
		description: 'URL of the image to OCR parse',
		displayOptions: {
			show: {
				operation: ['imageOcrParse'],
				ocr_image_input_type: ['url'],
			},
		},
	},
{
		displayName: 'Base64 Image',
		name: 'ocr_base64_image',
		type: 'string',
		default: '',
		description: 'Base64 image string (plain or data URL) - alternative to URL',
		displayOptions: {
			show: {
				operation: ['imageOcrParse'],
				ocr_image_input_type: ['base64'],
				},
			},
		},
{
			displayName: 'Binary Property Name',
			name: 'ocr_image_binary_property',
			type: 'string',
			default: 'data',
			description: 'Binary property containing the image file',
			displayOptions: {
				show: {
					operation: ['imageOcrParse'],
					ocr_image_input_type: ['file'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const imageInputType = this.getNodeParameter('ocr_image_input_type', index) as string;
	const imageUrl = this.getNodeParameter('ocr_image_url', index, '') as string;
	const base64Image = this.getNodeParameter('ocr_base64_image', index, '') as string;
	const imageBinaryProperty = this.getNodeParameter('ocr_image_binary_property', index, 'data') as string;
	const lang = this.getNodeParameter('ocr_lang', index) as string;
	const psm = this.getNodeParameter('ocr_psm', index) as number;
	const oem = this.getNodeParameter('ocr_oem', index) as number;

	const body: Record<string, unknown> = { lang, psm, oem };
	if (imageInputType === 'url' && imageUrl) body.image_url = normalizeUrl(imageUrl);
	if (imageInputType === 'base64' && base64Image) body.base64_image = base64Image;

	const requestOptions =
		imageInputType === 'file'
			? await createSingleFileMultipart.call(
					this,
					index,
					imageBinaryProperty,
					body as Record<string, string | number | boolean>,
			  )
			: { body, json: true };

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'pdfapihubApi',
		{
			method: 'POST',
			url: 'https://pdfapihub.com/api/v1/image/ocr/parse',
			...requestOptions,
			returnFullResponse: imageInputType === 'file',
		},
	);

	if (imageInputType === 'file') {
		const responseBody = (responseData as { body?: unknown }).body;
		returnData.push(parseJsonResponseBody(responseBody, index));
	} else {
		returnData.push({ json: responseData as IDataObject, pairedItem: { item: index } });
	}
}
