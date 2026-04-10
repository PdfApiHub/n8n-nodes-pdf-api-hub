import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, checkApiResponse } from '../helpers';

/* ================================================================
 *  Field descriptions – ordered for an intuitive top-to-bottom UX
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── 0. Starter Template (HTML only) ────────────────────────────
	{
		displayName: 'Ready-Made Sample Name or ID',
		name: 'starter_template',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getStarterTemplates' },
		default: '',
		description: 'Pick a ready-made sample to pre-fill HTML, CSS, and dynamic params. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { operation: ['htmlToPdf'] } },
	},

	// ─── 1. Source: HTML (no sample selected) ───────────────────
	{
		displayName: 'HTML Content',
		name: 'html_content',
		type: 'string',
		typeOptions: { rows: 6 },
		default: '',
		placeholder: '<html><body><h1>Hello World</h1></body></html>',
		description: 'Full or partial HTML to render as PDF. Supports {{placeholder}} syntax with Dynamic Params.',
		displayOptions: { show: { operation: ['htmlToPdf'], starter_template: [''] } },
	},

	// ─── 1. Source: HTML (sample selected — loaded from sample) ──────
	{
		displayName: 'HTML Content',
		name: 'template_html_content',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		description: 'HTML loaded from the selected sample. Edit directly or clear to use sample as-is.',
		displayOptions: { hide: { starter_template: [''] }, show: { operation: ['htmlToPdf'] } },
		typeOptions: {
			loadOptionsDependsOn: ['starter_template'],
			resourceMapper: {
				resourceMapperMethod: 'getStarterTemplateHtml',
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
		name: 'css_content',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		placeholder: 'body { font-family: Arial, sans-serif; padding: 32px; }',
		description: 'Optional CSS injected as a &lt;style&gt; tag into the HTML before rendering',
		displayOptions: { show: { operation: ['htmlToPdf'] } },
	},
	{
		displayName: 'Load Google Fonts',
		name: 'font',
		type: 'string',
		default: '',
		placeholder: 'Roboto|Inter',
		description: 'Google Font name(s) to load – use | as separator for multiple fonts (e.g. "Roboto|Open Sans"). The fonts are injected into the page; your HTML/CSS must still reference them via font-family to take effect. <a href="https://pdfapihub.com/request-more-fonts" target="_blank">Request more fonts</a>.',
		displayOptions: { show: { operation: ['htmlToPdf'] } },
	},

	// ─── 1. Source: URL ─────────────────────────────────────────────
	{
		displayName: 'URL',
		name: 'url_to_pdf',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://example.com/',
		description: 'Full URL of the webpage to capture as PDF (https:// is added automatically if omitted)',
		displayOptions: { show: { operation: ['urlToPdf'] } },
	},

	// ─── 2. Output ──────────────────────────────────────────────────
	{
		displayName: 'Output Format',
		name: 'output_format',
		type: 'options',
		options: [
			{
				name: 'URL (Hosted Link) (Default)',
				value: 'url',
				description: 'Returns a downloadable URL – file hosted for 30 days',
			},
			{
				name: 'Base64 (Inline Data)',
				value: 'base64',
				description: 'Returns the PDF as a base64-encoded string inside JSON',
			},
			{
				name: 'Binary File (Download)',
				value: 'file',
				description: 'Returns raw PDF binary – great for piping into other nodes',
			},
		],
		default: 'url',
		description: 'How the generated PDF is returned',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'] } },
	},
	{
		displayName: 'Output Filename',
		name: 'output_filename',
		type: 'string',
		default: 'document.pdf',
		placeholder: 'my-report.pdf',
		description: 'Filename for the generated PDF – .pdf is appended automatically if omitted',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'] } },
	},

	// ─── 3. Page Setup (both) ───────────────────────────────────────
	{
		displayName: 'Paper Size',
		name: 'paper_size',
		type: 'options',
		options: [
			{ name: 'A0', value: 'A0' },
			{ name: 'A1', value: 'A1' },
			{ name: 'A2', value: 'A2' },
			{ name: 'A3', value: 'A3' },
			{ name: 'A4 (Default)', value: 'A4' },
			{ name: 'A5', value: 'A5' },
			{ name: 'A6', value: 'A6' },
			{ name: 'Ledger', value: 'Ledger' },
			{ name: 'Legal', value: 'Legal' },
			{ name: 'Letter', value: 'Letter' },
			{ name: 'Tabloid', value: 'Tabloid' },
		],
		default: 'A4',
		description: 'Paper size of the generated PDF',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'] } },
	},
	{
		displayName: 'Orientation',
		name: 'orientation',
		type: 'options',
		options: [
			{ name: 'Portrait (Default)', value: 'portrait' },
			{ name: 'Landscape', value: 'landscape' },
		],
		default: 'portrait',
		description: 'Page orientation of the generated PDF',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'] } },
	},
	{
		displayName: 'Margins',
		name: 'margin_preset',
		type: 'options',
		options: [
			{ name: 'Custom …', value: 'custom', description: 'Set each side individually' },
			{ name: 'Large', value: 'large', description: '≈ 20 mm on each side' },
			{ name: 'Medium', value: 'medium', description: '≈ 10 mm on each side' },
			{ name: 'None', value: 'none', description: 'Zero margins on all sides' },
			{ name: 'Small (Default)', value: 'small', description: '≈ 5 mm on each side' },
		],
		default: 'small',
		description: 'Quick margin preset – choose "Custom" to specify each side',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'] } },
	},
	{
		displayName: 'Margin Top',
		name: 'margin_top',
		type: 'string',
		default: '10mm',
		placeholder: '12mm',
		description: 'Top margin – supports px, mm, cm, in (e.g. "12mm", "0.5in")',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'], margin_preset: ['custom'] } },
	},
	{
		displayName: 'Margin Right',
		name: 'margin_right',
		type: 'string',
		default: '10mm',
		placeholder: '10mm',
		description: 'Right margin – supports px, mm, cm, in',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'], margin_preset: ['custom'] } },
	},
	{
		displayName: 'Margin Bottom',
		name: 'margin_bottom',
		type: 'string',
		default: '10mm',
		placeholder: '12mm',
		description: 'Bottom margin – supports px, mm, cm, in',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'], margin_preset: ['custom'] } },
	},
	{
		displayName: 'Margin Left',
		name: 'margin_left',
		type: 'string',
		default: '10mm',
		placeholder: '10mm',
		description: 'Left margin – supports px, mm, cm, in',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'], margin_preset: ['custom'] } },
	},

	// ─── 4. URL-specific options ────────────────────────────────────
	{
		displayName: 'Full Page',
		name: 'full_page',
		type: 'boolean',
		default: true,
		description: 'Whether to capture the full scrollable page instead of just the viewport',
		displayOptions: { show: { operation: ['urlToPdf'] } },
	},
	{
		displayName: 'Cookie Accept Text',
		name: 'cookie_accept_text',
		type: 'string',
		default: 'Accept ALL',
		placeholder: 'Accept ALL',
		description: 'Text of the cookie-consent button to auto-click before capture. The browser looks for a button containing this text and clicks it. Change this if the site uses different wording (e.g. "I Agree", "OK", "Got it").',
		displayOptions: { show: { operation: ['urlToPdf'] } },
	},
	{
		displayName: 'Wait Until',
		name: 'wait_until',
		type: 'options',
		options: [
			{ name: 'Fully Loaded (Default)', value: 'load', description: 'All resources (images, CSS, fonts) have finished loading' },
			{ name: 'DOM Ready (Fast)', value: 'domcontentloaded', description: 'HTML is parsed — images & styles may still be loading' },
			{ name: 'Network Quiet (Best for SPAs)', value: 'networkidle', description: 'No network activity for 500 ms — ideal for JS-heavy pages' },
			{ name: 'First Response (Fastest)', value: 'commit', description: 'Capture as soon as the server starts responding' },
		],
		default: 'load',
		description: 'When to consider the page loaded. The browser waits until this condition is met (or timeout is reached) before capturing.',
		displayOptions: { show: { operation: ['urlToPdf'] } },
	},

	// ─── 5. Viewport (both) ─────────────────────────────────────────
	{
		displayName: 'Viewport Size',
		name: 'viewport_preset',
		type: 'options',
		options: [
			{ name: 'Custom …', value: 'custom' },
			{ name: 'Desktop (1920 × 1080)', value: '1920x1080' },
			{ name: 'Laptop (1366 × 768)', value: '1366x768' },
			{ name: 'Large Desktop (2560 × 1440)', value: '2560x1440' },
			{ name: 'Mobile (375 × 812)', value: '375x812' },
			{ name: 'Standard (1280 × 720) (Default)', value: '1280x720' },
			{ name: 'Tablet (768 × 1024)', value: '768x1024' },
		],
		default: '1280x720',
		description: 'Browser viewport dimensions used during rendering – affects how the page is laid out before PDF capture',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'] } },
	},
	{
		displayName: 'Viewport Width (Px)',
		name: 'viewPortWidth',
		type: 'number',
		default: 1280,
		typeOptions: { minValue: 1 },
		description: 'Custom viewport width in pixels',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'], viewport_preset: ['custom'] } },
	},
	{
		displayName: 'Viewport Height (Px)',
		name: 'viewPortHeight',
		type: 'number',
		default: 720,
		typeOptions: { minValue: 1 },
		description: 'Custom viewport height in pixels',
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'], viewport_preset: ['custom'] } },
	},

	// ─── 6a. HTML Dynamic Params (from Starter Template) ───────────
	{
		displayName: 'Dynamic Params (From Sample)',
		name: 'dynamic_params',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		description: 'Placeholders loaded from the selected sample. Fill in values and remove any you don\'t need.',
		displayOptions: { show: { operation: ['htmlToPdf'] } },
		typeOptions: {
			loadOptionsDependsOn: ['starter_template'],
			resourceMapper: {
				resourceMapperMethod: 'getStarterTemplatePlaceholders',
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
		name: 'dynamic_params_manual',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Additional key/value pairs that replace {{placeholders}} in the HTML. Merged with sample params above.',
		displayOptions: { show: { operation: ['htmlToPdf'] } },
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
						description: 'Placeholder key \u2013 without the {{ }} braces',
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

	// ─── 7. Advanced Options (collection) ───────────────────────────
	{
		displayName: 'Advanced Options',
		name: 'advancedOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { operation: ['htmlToPdf', 'urlToPdf'] } },
		options: [
			{
				displayName: 'Display Header & Footer',
				name: 'displayHeaderFooter',
				type: 'boolean',
				default: false,
				description: 'Whether to show the default browser header (title + date) and footer (URL + page number)',
			},
			{
				displayName: 'Max Pages',
				name: 'page_size',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Maximum number of pages to return (0 = unlimited, subject to your plan\'s page limit)',
			},
			{
				displayName: 'Navigation Timeout (Seconds)',
				name: 'wait_till',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 0 },
				description: 'Maximum seconds the browser waits for the page to meet the "Wait Until" condition (URL-to-PDF only). Minimum enforced by the API is 30s. Set to 0 for the default.',
			},
			{
				displayName: 'Prefer CSS Page Size',
				name: 'preferCSSPageSize',
				type: 'boolean',
				default: false,
				description: 'Whether to honour CSS @page size declarations instead of the Paper Size setting above',
			},
			{
				displayName: 'Print Background',
				name: 'print_background',
				type: 'boolean',
				default: true,
				description: 'Whether to render CSS background colours and images in the PDF',
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
	const outputFormat = this.getNodeParameter('output_format', index) as string;
	const outputFilename = this.getNodeParameter('output_filename', index) as string;

	// ── Page setup ──────────────────────────────────────────────────
	const paperSize = this.getNodeParameter('paper_size', index, 'A4') as string;
	const orientation = this.getNodeParameter('orientation', index, 'portrait') as string;
	// URL captures already have their own layout — default to no extra margins.
	// HTML documents benefit from a bit of breathing room → default small.
	const marginDefault = operation === 'urlToPdf' ? 'none' : 'small';
	const marginPreset = this.getNodeParameter('margin_preset', index, marginDefault) as string;

	const body: Record<string, unknown> = {
		output_format: outputFormat,
		output_filename: outputFilename,
		paper_size: paperSize,
		landscape: orientation === 'landscape',
	};

	// ── Margins ─────────────────────────────────────────────────────
	// Only send margin when the field actually exists in the workflow
	// (i.e. the user has interacted with the node after the upgrade).
	// Old workflows had no margin param – don't alter their API behaviour.
	if (marginPreset === 'custom') {
		body.margin = {
			top: this.getNodeParameter('margin_top', index, '10mm') as string,
			right: this.getNodeParameter('margin_right', index, '10mm') as string,
			bottom: this.getNodeParameter('margin_bottom', index, '10mm') as string,
			left: this.getNodeParameter('margin_left', index, '10mm') as string,
		};
	} else if (marginPreset && marginPreset !== 'none') {
		body.margin = marginPreset; // API accepts 'small' | 'medium' | 'large'
	}
	// marginPreset === 'none' → don't send margin key at all (API uses its own default)

	// ── Viewport ────────────────────────────────────────────────────
	// Always read viewPortWidth / viewPortHeight so that values saved by
	// older workflow versions (before the preset dropdown existed) are
	// honoured.  The preset only supplies the *fallback* when no explicit
	// value is stored in the workflow JSON.
	const viewportPreset = this.getNodeParameter('viewport_preset', index, '1280x720') as string;
	const [presetW, presetH] = viewportPreset === 'custom'
		? [1280, 720]
		: viewportPreset.split('x').map(Number);
	body.viewPortWidth = this.getNodeParameter('viewPortWidth', index, presetW) as number;
	body.viewPortHeight = this.getNodeParameter('viewPortHeight', index, presetH) as number;

	// ── Advanced options (collection – may be empty) ────────────────
	const advanced = this.getNodeParameter('advancedOptions', index, {}) as Record<string, unknown>;

	// Navigation timeout: read from advancedOptions first, then try legacy
	// top-level locations (old workflows stored it as 'wait_till' or 'timeout').
	let navTimeoutSec = advanced.wait_till as number | undefined;
	if (navTimeoutSec === undefined) {
		try {
			navTimeoutSec = this.getNodeParameter('wait_till', index) as number;
		} catch {
			try {
				navTimeoutSec = this.getNodeParameter('timeout', index) as number;
			} catch {
				navTimeoutSec = 30;
			}
		}
	}
	// HTTP request timeout = navigation timeout + generous buffer for PDF rendering
	const timeout = (Math.max(navTimeoutSec, 30) + 90) * 1000;

	body.print_background = advanced.print_background !== undefined ? advanced.print_background : true;
	if (advanced.displayHeaderFooter) body.displayHeaderFooter = true;
	if (advanced.preferCSSPageSize) body.preferCSSPageSize = true;
	if (advanced.page_size && (advanced.page_size as number) > 0) {
		body.page_size = advanced.page_size;
	}

	// ── Source-specific fields ──────────────────────────────────────
	if (operation === 'htmlToPdf') {
		let htmlContent = '';

		// When a starter template is selected, use its HTML (resourceMapper override takes priority)
		const starterTemplateId = this.getNodeParameter('starter_template', index, '') as string;
		let userHtml = '';

		if (starterTemplateId) {
			const templateHtmlRaw = this.getNodeParameter('template_html_content', index, {}) as {
				mappingMode?: string;
				value?: Record<string, string> | null;
			};
			userHtml = templateHtmlRaw.value?.html_content ?? '';
		} else {
			userHtml = this.getNodeParameter('html_content', index, '') as string;
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
			} catch { /* template fetch failed, htmlContent stays empty */ }
		}

		body.html_content = htmlContent;

		const cssContent = this.getNodeParameter('css_content', index, '') as string;
		if (cssContent) body.css_content = cssContent;

		const font = this.getNodeParameter('font', index, '') as string;
		if (font) body.font = font;

		// Dynamic params (from resourceMapper + manual fixedCollection)
		const allDynamic: Record<string, string> = {};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dynamicParamsRaw = this.getNodeParameter('dynamic_params', index, {}) as any;
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

		const manualParams = this.getNodeParameter('dynamic_params_manual', index, {}) as {
			params?: Array<{ key?: string; value?: string }>;
		};
		if (manualParams.params?.length) {
			for (const p of manualParams.params) {
				if (p.key) allDynamic[p.key] = p.value ?? '';
			}
		}

		if (Object.keys(allDynamic).length) body.dynamic_params = allDynamic;
	} else {
		// urlToPdf
		body.url = normalizeUrl(this.getNodeParameter('url_to_pdf', index) as string);
		body.full_page = this.getNodeParameter('full_page', index, true) as boolean;
		const cookieText = this.getNodeParameter('cookie_accept_text', index, 'Accept ALL') as string;
		if (cookieText) body.cookie_accept_text = cookieText;
		body.wait_until = this.getNodeParameter('wait_until', index, 'load') as string;
		body.wait_till = navTimeoutSec;
	}

	// ── API call ────────────────────────────────────────────────────
	if (outputFormat === 'file') {
		// binary / pdf / file  →  raw arraybuffer
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/generatePdf',
				body,
				json: true,
				encoding: 'arraybuffer',
				returnFullResponse: true,
				ignoreHttpStatusErrors: true,
				timeout,
			},
		) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

		// Check for error — arraybuffer may contain JSON error body
		if (responseData.statusCode >= 400) {
			let errorBody: unknown;
			try {
				errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8'));
			} catch { errorBody = {}; }
			checkApiResponse(this, responseData.statusCode, errorBody, index);
		}

		returnData.push(
			await prepareBinaryResponse.call(
				this,
				index,
				responseData,
				outputFilename.endsWith('.pdf') ? outputFilename : `${outputFilename}.pdf`,
				'application/pdf',
			),
		);
	} else {
		// url / base64  →  JSON response
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: 'https://pdfapihub.com/api/v1/generatePdf',
				body,
				json: true,
				returnFullResponse: true,
				ignoreHttpStatusErrors: true,
				timeout,
			},
		) as { body: Record<string, unknown>; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push({ json: responseData.body as import('n8n-workflow').IDataObject, pairedItem: { item: index } });
	}
}
