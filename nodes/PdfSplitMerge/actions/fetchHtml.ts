import type { IExecuteFunctions, INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl } from '../helpers';


export const description: INodeProperties[] = [
{
		displayName: 'URL',
		name: 'html_fetch_url',
		type: 'string',
		default: 'http://example.com/',
		description: 'URL to fetch HTML from',
		displayOptions: {
			show: {
				operation: ['fetchHtml'],
			},
		},
	},
{
		displayName: 'Wait Until',
		name: 'html_wait_till',
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
				operation: ['fetchHtml'],
			},
		},
	},
{
		displayName: 'Timeout (Ms)',
		name: 'html_timeout',
		type: 'number',
		default: 30000,
		description: 'Maximum wait time in milliseconds',
		displayOptions: {
			show: {
				operation: ['fetchHtml'],
			},
		},
	},
{
		displayName: 'Wait For Selector',
		name: 'html_wait_for_selector',
		type: 'string',
		default: '',
		description: 'CSS selector to wait for before returning HTML',
		displayOptions: {
			show: {
				operation: ['fetchHtml'],
			},
		},
	},
{
		displayName: 'Additional Wait (Ms)',
		name: 'html_wait_for_timeout',
		type: 'number',
		default: 0,
		description: 'Additional wait time in milliseconds after page load',
		displayOptions: {
			show: {
				operation: ['fetchHtml'],
			},
		},
	},
{
		displayName: 'Viewport Width',
		name: 'html_viewport_width',
		type: 'number',
		default: 1920,
		displayOptions: {
			show: {
				operation: ['fetchHtml'],
			},
		},
	},
{
		displayName: 'Viewport Height',
		name: 'html_viewport_height',
		type: 'number',
		default: 1080,
		displayOptions: {
			show: {
				operation: ['fetchHtml'],
			},
		},
	},
{
		displayName: 'User Agent',
		name: 'html_user_agent',
		type: 'string',
		default: '',
		description: 'Custom user agent string',
		displayOptions: {
			show: {
				operation: ['fetchHtml'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const url = normalizeUrl(this.getNodeParameter('html_fetch_url', index) as string);
	const waitTill = this.getNodeParameter('html_wait_till', index) as string;
	const timeout = this.getNodeParameter('html_timeout', index) as number;
	const waitForSelector = this.getNodeParameter('html_wait_for_selector', index, '') as string;
	const waitForTimeout = this.getNodeParameter('html_wait_for_timeout', index) as number;
	const viewportWidth = this.getNodeParameter('html_viewport_width', index) as number;
	const viewportHeight = this.getNodeParameter('html_viewport_height', index) as number;
	const userAgent = this.getNodeParameter('html_user_agent', index, '') as string;

	const body: Record<string, unknown> = {
		url,
		wait_till: waitTill,
		timeout,
		wait_for_timeout: waitForTimeout,
		viewport_width: viewportWidth,
		viewport_height: viewportHeight,
	};
	if (waitForSelector) body.wait_for_selector = waitForSelector;
	if (userAgent) body.user_agent = userAgent;

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'pdfapihubApi',
		{
			method: 'POST',
			url: 'https://pdfapihub.com/api/v1/url-to-html',
			body,
			json: true,
		},
	);
	returnData.push({ json: responseData, pairedItem: { item: index } });
}
