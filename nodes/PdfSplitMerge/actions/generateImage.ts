import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, checkApiResponse } from '../helpers';

/* ================================================================
 *  Field descriptions – Generate Image (URL → PNG / HTML → PNG)
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── 0. Starter Template (HTML only) ────────────────────────────
	{
		displayName: 'Ready-Made Sample Name or ID',
		name: 'image_starter_template',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getStarterTemplates' },
		default: '',
		description: 'Pick a ready-made sample to pre-fill HTML, CSS, and dynamic params. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { operation: ['htmlToImage'] } },
	},

	// ─── 1. Source: URL ─────────────────────────────────────────────
	{
		displayName: 'URL',
		name: 'image_gen_url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://example.com/',
		description: 'Full URL of the webpage to screenshot (https:// is added automatically if omitted)',
		displayOptions: { show: { operation: ['urlToImage'] } },
	},

	// ─── 1. Source: HTML (no sample selected) ───────────────────
	{
		displayName: 'HTML Content',
		name: 'image_html_content',
		type: 'string',
		typeOptions: { rows: 6 },
		default: '',
		placeholder: '<div style="padding:40px;background:#4F46E5;color:white"><h1>Hello World</h1></div>',
		description: 'HTML to render as an image. Supports {{placeholder}} syntax with Dynamic Params.',
		displayOptions: { show: { operation: ['htmlToImage'], image_starter_template: [''] } },
	},

	// ─── 1. Source: HTML (sample selected — loaded from sample) ──────
	{
		displayName: 'HTML Content',
		name: 'image_template_html_content',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		description: 'HTML loaded from the selected sample. Edit directly or clear to use sample as-is.',
		displayOptions: { hide: { image_starter_template: [''] }, show: { operation: ['htmlToImage'] } },
		typeOptions: {
			loadOptionsDependsOn: ['image_starter_template'],
			resourceMapper: {
				resourceMapperMethod: 'getStarterTemplateHtmlImage',
				mode: 'add',
				fieldWords: {
					singular: 'field',
					plural: 'fields',
				},
				addAllFields: true,
				multiKeyMatch: false,
				supportAutoMap: false,
			},
		},
	},
	{
		displayName: 'CSS Content (Optional)',
		name: 'image_css_content',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		placeholder: 'h1 { font-size: 48px; color: blue; }',
		description: 'Optional CSS injected after the HTML before rendering',
		displayOptions: { show: { operation: ['htmlToImage'] } },
	},
	{
		displayName: 'Load Google Fonts',
		name: 'image_font',
		type: 'string',
		default: '',
		placeholder: 'Inter|Roboto',
		description: 'Google Font name(s) to load — use | as separator. Your HTML/CSS must reference them via font-family. <a href="https://pdfapihub.com/request-more-fonts" target="_blank">Request more fonts</a>.',
		displayOptions: { show: { operation: ['htmlToImage'] } },
	},

	// ─── 2. Output ──────────────────────────────────────────────────
	{
		displayName: 'Output Format',
		name: 'image_output_format',
		type: 'options',
		options: [
			{ name: 'URL (Hosted Link) (Default)', value: 'url', description: 'Returns a downloadable URL — file hosted for 30 days' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns the PNG as a base64 string inside JSON' },
			{ name: 'Both (URL + Base64)', value: 'both', description: 'Returns both URL and base64 in one response' },
			{ name: 'Binary File (Download)', value: 'file', description: 'Returns raw PNG binary — great for piping into other nodes' },
		],
		default: 'url',
		description: 'How the generated image is returned',
		displayOptions: { show: { operation: ['htmlToImage', 'urlToImage'] } },
	},

	// ─── 3. Image Size (HTML only) ─────────────────────────────────
	{
		displayName: 'Image Width (Px)',
		name: 'image_width',
		type: 'number',
		default: 1280,
		typeOptions: { minValue: 1 },
		description: 'Width of the output image in pixels',
		displayOptions: { show: { operation: ['htmlToImage'] } },
	},
	{
		displayName: 'Image Height (Px)',
		name: 'image_height',
		type: 'number',
		default: 720,
		typeOptions: { minValue: 1 },
		description: 'Height of the output image in pixels',
		displayOptions: { show: { operation: ['htmlToImage'] } },
	},

	// ─── 4. URL-specific options ────────────────────────────────────
	{
		displayName: 'Full Page',
		name: 'image_full_page',
		type: 'boolean',
		default: false,
		description: 'Whether to capture the full scrollable page instead of just the viewport',
		displayOptions: { show: { operation: ['urlToImage'] } },
	},
	{
		displayName: 'Cookie Accept Text',
		name: 'image_cookie_accept_text',
		type: 'string',
		default: 'Accept ALL',
		placeholder: 'Accept All Cookies',
		description: 'Text of the cookie-consent button to auto-click before capture. Change if the site uses different wording (e.g. "I Agree", "Got it").',
		displayOptions: { show: { operation: ['urlToImage'] } },
	},
	{
		displayName: 'Wait Until',
		name: 'image_wait_until',
		type: 'options',
		options: [
			{ name: 'Fully Loaded (Default)', value: 'load', description: 'All resources (images, CSS, fonts) finished loading' },
			{ name: 'DOM Ready (Fast)', value: 'domcontentloaded', description: 'HTML parsed — images may still load' },
			{ name: 'Network Quiet (Best for SPAs)', value: 'networkidle', description: 'No network activity for 500 ms' },
			{ name: 'First Response (Fastest)', value: 'commit', description: 'Proceed on first byte from server' },
		],
		default: 'load',
		description: 'When to consider the page loaded before capturing',
		displayOptions: { show: { operation: ['urlToImage'] } },
	},
	{
		displayName: 'Extra Delay (Ms)',
		name: 'image_wait_for_timeout',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Additional milliseconds to wait after the page loads — useful for animations, lazy content, or JS rendering (0 = no delay)',
		displayOptions: { show: { operation: ['urlToImage'] } },
	},

	// ─── 5. Viewport (both) ─────────────────────────────────────────
	{
		displayName: 'Viewport Size',
		name: 'image_viewport_preset',
		type: 'options',
		options: [
			{ name: 'Custom …', value: 'custom' },
			{ name: 'Desktop (1920 × 1080) (Default)', value: '1920x1080' },
			{ name: 'Laptop (1366 × 768)', value: '1366x768' },
			{ name: 'Large Desktop (2560 × 1440)', value: '2560x1440' },
			{ name: 'Mobile (375 × 812)', value: '375x812' },
			{ name: 'Standard (1280 × 720)', value: '1280x720' },
			{ name: 'Tablet (768 × 1024)', value: '768x1024' },
		],
		default: '1920x1080',
		description: 'Browser viewport dimensions used during rendering',
		displayOptions: { show: { operation: ['htmlToImage', 'urlToImage'] } },
	},
	{
		displayName: 'Viewport Width (Px)',
		name: 'image_viewport_width',
		type: 'number',
		default: 1920,
		typeOptions: { minValue: 1 },
		description: 'Custom viewport width in pixels',
		displayOptions: { show: { operation: ['htmlToImage', 'urlToImage'], image_viewport_preset: ['custom'] } },
	},
	{
		displayName: 'Viewport Height (Px)',
		name: 'image_viewport_height',
		type: 'number',
		default: 1080,
		typeOptions: { minValue: 1 },
		description: 'Custom viewport height in pixels',
		displayOptions: { show: { operation: ['htmlToImage', 'urlToImage'], image_viewport_preset: ['custom'] } },
	},

	// ─── 6a. HTML Dynamic Params (from Starter Template) ───────────
	{
		displayName: 'Dynamic Params (From Sample)',
		name: 'image_dynamic_params',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		description: 'Placeholders loaded from the selected sample. Fill in values and remove any you don\'t need.',
		displayOptions: { show: { operation: ['htmlToImage'] } },
		typeOptions: {
			loadOptionsDependsOn: ['image_starter_template'],
			resourceMapper: {
				resourceMapperMethod: 'getStarterTemplatePlaceholdersImage',
				mode: 'add',
				fieldWords: {
					singular: 'placeholder',
					plural: 'placeholders',
				},
				addAllFields: true,
				multiKeyMatch: false,
				supportAutoMap: false,
			},
		},
	},

	// ─── 6b. HTML Dynamic Params (manual) ──────────────────────────
	{
		displayName: 'Dynamic Params',
		name: 'image_dynamic_params_manual',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Additional key/value pairs that replace {{placeholders}} in the HTML. Merged with sample params above.',
		displayOptions: { show: { operation: ['htmlToImage'] } },
		options: [
			{
				name: 'params',
				displayName: 'Parameter',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						placeholder: 'name',
						description: 'Placeholder key \u2014 without the {{ }} braces',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'John Doe',
						description: 'Replacement value for this placeholder',
					},
				],
			},
		],
	},

	// ─── 7. Advanced Options ────────────────────────────────────────
	{
		displayName: 'Advanced Options',
		name: 'imageAdvancedOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { operation: ['htmlToImage', 'urlToImage'] } },
		options: [
			{
				displayName: 'Device Scale Factor',
				name: 'device_scale_factor',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 3 },
				description: 'Pixel density multiplier. Use 2 for retina-quality screenshots, 3 for ultra-high DPI. Default 1.',
			},
			{
				displayName: 'Quality',
				name: 'quality',
				type: 'number',
				default: 80,
				typeOptions: { minValue: 30, maxValue: 100 },
				description: 'Image quality (30–100). Lower = smaller file size.',
			},
		],
	},
];

/* ================================================================
 *  Execute handler
 * ================================================================ */

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
	operation: string,
): Promise<void> {
	const outputFormat = this.getNodeParameter('image_output_format', index) as string;

	// ── Viewport ────────────────────────────────────────────────────
	const viewportPreset = this.getNodeParameter('image_viewport_preset', index, '1920x1080') as string;
	const [presetW, presetH] = viewportPreset === 'custom'
		? [1920, 1080]
		: viewportPreset.split('x').map(Number);
	const viewportWidth = this.getNodeParameter('image_viewport_width', index, presetW) as number;
	const viewportHeight = this.getNodeParameter('image_viewport_height', index, presetH) as number;

	// ── Advanced options ────────────────────────────────────────────
	const advanced = this.getNodeParameter('imageAdvancedOptions', index, {}) as Record<string, unknown>;

	// Backward compat for legacy top-level fields
	let deviceScale = advanced.device_scale_factor as number | undefined;
	if (deviceScale === undefined) {
		try { deviceScale = this.getNodeParameter('image_device_scale', index) as number; } catch { deviceScale = 1; }
	}
	let quality = advanced.quality as number | undefined;
	if (quality === undefined) {
		try { quality = this.getNodeParameter('image_quality', index) as number; } catch { quality = 80; }
	}

	const body: Record<string, unknown> = {
		output_format: outputFormat,
		viewPortWidth: viewportWidth,
		viewPortHeight: viewportHeight,
		device_scale_factor: deviceScale,
		quality,
	};

	if (operation === 'htmlToImage') {
		let htmlContent = '';

		// When a starter template is selected, use its HTML (resourceMapper override takes priority)
		const starterTemplateId = this.getNodeParameter('image_starter_template', index, '') as string;
		let userHtml = '';

		if (starterTemplateId) {
			const templateHtmlRaw = this.getNodeParameter('image_template_html_content', index, {}) as {
				mappingMode?: string;
				value?: Record<string, string> | null;
			};
			userHtml = templateHtmlRaw.value?.html_content ?? '';
		} else {
			userHtml = this.getNodeParameter('image_html_content', index, '') as string;
		}

		if (userHtml) {
			htmlContent = userHtml;
		} else if (starterTemplateId) {
			try {
				const allTemplates = await this.helpers.httpRequest({
					method: 'GET',
					url: 'https://pdfapihub.com/starter-templates.json',
					json: true,
				}) as Array<{ id: string; html: string }>;
				const tpl = allTemplates.find((t) => t.id === starterTemplateId);
				if (tpl?.html) htmlContent = tpl.html;
			} catch { /* template fetch failed */ }
		}

		body.html_content = htmlContent;
		body.width = this.getNodeParameter('image_width', index, 1280) as number;
		body.height = this.getNodeParameter('image_height', index, 720) as number;

		const cssContent = this.getNodeParameter('image_css_content', index, '') as string;
		if (cssContent) body.css_content = cssContent;

		const font = this.getNodeParameter('image_font', index, '') as string;
		if (font) body.font = font;

		// Dynamic params (from resourceMapper + manual fixedCollection)
		const allDynamic: Record<string, string> = {};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dynamicParamsRaw = this.getNodeParameter('image_dynamic_params', index, {}) as any;
		// New format: resourceMapper { mappingMode, value: { key: val } }
		if (dynamicParamsRaw.value && typeof dynamicParamsRaw.value === 'object') {
			for (const [k, v] of Object.entries(dynamicParamsRaw.value as Record<string, string>)) {
				if (k) allDynamic[k] = v ?? '';
			}
		}
		// Legacy format: fixedCollection { params: [{ key, value }] }
		if (dynamicParamsRaw.params?.length) {
			for (const p of dynamicParamsRaw.params as Array<{ key?: string; value?: string }>) {
				if (p.key) allDynamic[p.key] = p.value ?? '';
			}
		}

		const manualParams = this.getNodeParameter('image_dynamic_params_manual', index, {}) as {
			params?: Array<{ key?: string; value?: string }>;
		};
		if (manualParams.params?.length) {
			for (const p of manualParams.params) {
				if (p.key) allDynamic[p.key] = p.value ?? '';
			}
		}

		if (Object.keys(allDynamic).length) body.dynamic_params = allDynamic;
	} else {
		// urlToImage
		body.url = normalizeUrl(this.getNodeParameter('image_gen_url', index) as string);
		body.full_page = this.getNodeParameter('image_full_page', index, false) as boolean;
		body.wait_until = this.getNodeParameter('image_wait_until', index, 'load') as string;

		const cookieText = this.getNodeParameter('image_cookie_accept_text', index, 'Accept ALL') as string;
		if (cookieText) body.cookie_accept_text = cookieText;

		const waitForTimeout = this.getNodeParameter('image_wait_for_timeout', index, 0) as number;
		if (waitForTimeout > 0) body.wait_for_timeout = waitForTimeout;
	}

	// ── API call ────────────────────────────────────────────────────
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
				ignoreHttpStatusErrors: true,
			},
		) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

		if (responseData.statusCode >= 400) {
			let errorBody: unknown;
			try { errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8')); } catch { errorBody = {}; }
			checkApiResponse(this, responseData.statusCode, errorBody, index);
		}

		returnData.push(
			await prepareBinaryResponse.call(this, index, responseData, 'image.png', 'image/png'),
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
				returnFullResponse: true,
				ignoreHttpStatusErrors: true,
			},
		) as { body: Record<string, unknown>; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push({ json: responseData.body as import('n8n-workflow').IDataObject, pairedItem: { item: index } });
	}
}
