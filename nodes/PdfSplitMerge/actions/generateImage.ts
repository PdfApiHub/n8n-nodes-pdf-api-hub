import type { IExecuteFunctions, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'URL',
		name: 'image_gen_url',
		type: 'string',
		default: '',
		description: 'The URL of the website to capture as image',
		displayOptions: {
			show: {
				operation: ['urlToImage'],
			},
		},
	},
{
		displayName: 'HTML Content',
		name: 'image_html_content',
		type: 'string',
		default: '',
		description: 'HTML content to render as image',
		displayOptions: {
			show: {
				operation: ['htmlToImage'],
			},
		},
	},
{
		displayName: 'CSS Content',
		name: 'image_css_content',
		type: 'string',
		default: '',
		description: 'CSS to style the HTML',
		displayOptions: {
			show: {
				operation: ['htmlToImage'],
			},
		},
	},
{
		displayName: 'Output Format',
		name: 'image_output_format',
		type: 'options',
		options: [
			{ name: 'URL', value: 'url' },
			{ name: 'Base64', value: 'base64' },
			{ name: 'Both', value: 'both' },
			{ name: 'File', value: 'file' },
		],
		default: 'url',
		description: 'Format of the output image',
		displayOptions: {
			show: {
				operation: ['htmlToImage', 'urlToImage'],
			},
		},
	},
{
		displayName: 'Width',
		name: 'image_width',
		type: 'number',
		default: 1280,
		description: 'Width of the output image in pixels',
		displayOptions: {
			show: {
				operation: ['htmlToImage', 'urlToImage'],
			},
		},
	},
{
		displayName: 'Height',
		name: 'image_height',
		type: 'number',
		default: 720,
		description: 'Height of the output image in pixels',
		displayOptions: {
			show: {
				operation: ['htmlToImage', 'urlToImage'],
			},
		},
	},
{
		displayName: 'Viewport Width',
		name: 'image_viewport_width',
		type: 'number',
		default: 1920,
		description: 'Viewport width for rendering',
		displayOptions: {
			show: {
				operation: ['htmlToImage', 'urlToImage'],
			},
		},
	},
{
		displayName: 'Viewport Height',
		name: 'image_viewport_height',
		type: 'number',
		default: 1080,
		description: 'Viewport height for rendering',
		displayOptions: {
			show: {
				operation: ['htmlToImage', 'urlToImage'],
			},
		},
	},
{
		displayName: 'Device Scale Factor',
		name: 'image_device_scale',
		type: 'number',
		default: 1,
		description: 'Device scale factor for higher resolution (1-3)',
		displayOptions: {
			show: {
				operation: ['htmlToImage', 'urlToImage'],
			},
		},
	},
{
		displayName: 'Quality',
		name: 'image_quality',
		type: 'number',
		default: 80,
		description: 'Image quality (30-100)',
		displayOptions: {
			show: {
				operation: ['htmlToImage', 'urlToImage'],
			},
		},
	},
{
		displayName: 'Full Page',
		name: 'image_full_page',
		type: 'boolean',
		default: false,
		description: 'Whether to capture the full page (for URLs only)',
		displayOptions: {
			show: {
				operation: ['urlToImage'],
			},
		},
	},
{
		displayName: 'Wait Time (Seconds)',
		name: 'image_wait_till',
		type: 'number',
		default: 0,
		description: 'Time to wait in seconds before capturing',
		displayOptions: {
			show: {
				operation: ['urlToImage'],
			},
		},
	},
{
		displayName: 'Wait Until',
		name: 'image_wait_until',
		type: 'options',
		options: [
			{ name: 'Load', value: 'load' },
			{ name: 'DOM Content Loaded', value: 'domcontentloaded' },
			{ name: 'Network Idle', value: 'networkidle' },
		],
		default: 'load',
		description: 'When to consider navigation successful',
		displayOptions: {
			show: {
				operation: ['urlToImage'],
			},
		},
	},
{
		displayName: 'Google Font',
		name: 'image_font',
		type: 'string',
		default: '',
		description: 'Google Font name(s) to include (use | separator for multiple)',
		displayOptions: {
			show: {
				operation: ['htmlToImage'],
			},
		},
	},
{
		displayName: 'Dynamic Params',
		name: 'image_dynamic_params',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		description: 'Dynamic parameters to replace in HTML',
		displayOptions: {
			show: {
				operation: ['htmlToImage'],
			},
		},
		options: [
			{
				name: 'params',
				displayName: 'Params',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						description: 'Placeholder key',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Replacement value',
					},
				],
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
	operation: string,
): Promise<void> {
	const outputFormat = this.getNodeParameter('image_output_format', index) as string;
	const width = this.getNodeParameter('image_width', index) as number;
	const height = this.getNodeParameter('image_height', index) as number;
	const viewportWidth = this.getNodeParameter('image_viewport_width', index) as number;
	const viewportHeight = this.getNodeParameter('image_viewport_height', index) as number;
	const deviceScale = this.getNodeParameter('image_device_scale', index) as number;
	const quality = this.getNodeParameter('image_quality', index) as number;

	const body: Record<string, unknown> = {
		output_format: outputFormat,
		width,
		height,
		viewPortWidth: viewportWidth,
		viewPortHeight: viewportHeight,
		device_scale_factor: deviceScale,
		quality,
	};

	if (operation === 'htmlToImage') {
		body.html_content = this.getNodeParameter('image_html_content', index) as string;
		body.css_content = this.getNodeParameter('image_css_content', index, '') as string;
		const font = this.getNodeParameter('image_font', index, '') as string;
		if (font) body.font = font;

		const dynamicParams = this.getNodeParameter('image_dynamic_params', index, {}) as {
			params?: Array<{ key?: string; value?: string }>;
		};
		if (dynamicParams.params?.length) {
			const mapped: Record<string, string> = {};
			dynamicParams.params
				.filter((p) => (p.key ?? '') !== '')
				.forEach((p) => {
					mapped[p.key as string] = p.value ?? '';
				});
			if (Object.keys(mapped).length) {
				body.dynamic_params = mapped;
			}
		}
	} else {
		body.url = normalizeUrl(this.getNodeParameter('image_gen_url', index) as string);
		body.full_page = this.getNodeParameter('image_full_page', index) as boolean;
		body.wait_till = this.getNodeParameter('image_wait_till', index) as number;
		body.wait_until = this.getNodeParameter('image_wait_until', index) as string;
	}

	if (outputFormat === 'file') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/generateImage',
				body,
				json: true,
				encoding: 'arraybuffer',
				returnFullResponse: true,
			},
		);
		returnData.push(
			await prepareBinaryResponse.call(
				this,
				index,
				responseData as { body: ArrayBuffer; headers?: Record<string, unknown> },
				'image.png',
				'image/png',
			),
		);
	} else {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/generateImage',
				body,
				json: true,
			},
		);
		returnData.push({ json: responseData, pairedItem: { item: index } });
	}
}
