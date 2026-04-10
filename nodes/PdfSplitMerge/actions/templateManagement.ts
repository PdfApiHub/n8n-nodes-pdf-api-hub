import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { checkApiResponse, parseJsonResponseBody } from '../helpers';

const BASE_URL = 'https://pdfapihub.com/api';

/* ================================================================
 *  Field descriptions – Template Management (CRUD)
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── Create Template ────────────────────────────────────────────
	{
		displayName: 'Template Name',
		name: 'tpl_create_name',
		type: 'string',
		default: 'Untitled',
		placeholder: 'Invoice Template v2',
		description: 'A friendly name for the template',
		displayOptions: { show: { operation: ['createTemplate'] } },
	},
	{
		displayName: 'HTML Content',
		name: 'tpl_create_html',
		type: 'string',
		typeOptions: { rows: 6 },
		default: '',
		required: true,
		placeholder:
			'<h1>Invoice #{{@invoice_number}}</h1><p>Amount: {{@amount}}</p>',
		description:
			'HTML content with optional placeholders ({{@key}}, {{$key}}, ${key}, {key}, %key%)',
		displayOptions: { show: { operation: ['createTemplate'] } },
	},
	{
		displayName: 'CSS Content (Optional)',
		name: 'tpl_create_css',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		placeholder: 'body { font-family: Arial, sans-serif; }',
		description: 'Optional CSS to apply when rendering the template',
		displayOptions: { show: { operation: ['createTemplate'] } },
	},
	{
		displayName: 'Default Params',
		name: 'tpl_create_default_params',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description:
			'Default values for placeholders. Used when dynamic_params does not include a specific key.',
		displayOptions: { show: { operation: ['createTemplate'] } },
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
						placeholder: 'currency',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'USD',
					},
				],
			},
		],
	},
	{
		displayName: 'Metadata',
		name: 'tpl_create_metadata',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description:
			'Default rendering settings (e.g. page_size, orientation, width, height)',
		displayOptions: { show: { operation: ['createTemplate'] } },
		options: [
			{
				name: 'params',
				displayName: 'Setting',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						placeholder: 'page_size',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'A4',
					},
				],
			},
		],
	},

	// ─── Get Template ───────────────────────────────────────────────
	{
		displayName: 'Template Name or ID',
		name: 'tpl_get_id',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getTemplates' },
		default: '',
		required: true,
		description:
			'Select a template to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { operation: ['getTemplate'] } },
	},

	// ─── Update Template ────────────────────────────────────────────
	{
		displayName: 'Template Name or ID',
		name: 'tpl_update_id',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getTemplates' },
		default: '',
		required: true,
		description:
			'Select a template to update. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { operation: ['updateTemplate'] } },
	},
	{
		displayName: 'Update Fields',
		name: 'tpl_update_fields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { operation: ['updateTemplate'] } },
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'New name for the template',
			},
			{
				displayName: 'HTML Content',
				name: 'html_content',
				type: 'string',
				typeOptions: { rows: 6 },
				default: '',
				description: 'Updated HTML content with optional placeholders',
			},
			{
				displayName: 'CSS Content',
				name: 'css_content',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'Updated CSS content',
			},
		],
	},
	{
		displayName: 'Update Default Params',
		name: 'tpl_update_default_params',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Updated default placeholder values (replaces existing default_params entirely)',
		displayOptions: { show: { operation: ['updateTemplate'] } },
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
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Update Metadata',
		name: 'tpl_update_metadata',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Updated rendering metadata (replaces existing metadata entirely)',
		displayOptions: { show: { operation: ['updateTemplate'] } },
		options: [
			{
				name: 'params',
				displayName: 'Setting',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},

	// ─── Delete Template ────────────────────────────────────────────
	{
		displayName: 'Template Name or ID',
		name: 'tpl_delete_id',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getTemplates' },
		default: '',
		required: true,
		description:
			'Select a template to delete. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { operation: ['deleteTemplate'] } },
	},
];

/* ================================================================
 *  Helpers
 * ================================================================ */

function buildParamsObject(
	params: { params?: Array<{ key?: string; value?: string }> },
): Record<string, string> | undefined {
	if (!params?.params?.length) return undefined;
	const mapped: Record<string, string> = {};
	for (const p of params.params) {
		if (p.key) mapped[p.key] = p.value ?? '';
	}
	return Object.keys(mapped).length ? mapped : undefined;
}

/* ================================================================
 *  Execute handler
 * ================================================================ */

export async function execute(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
	operation: string,
): Promise<void> {
	if (operation === 'createTemplate') {
		await executeCreate.call(this, index, returnData);
	} else if (operation === 'listTemplates') {
		await executeList.call(this, index, returnData);
	} else if (operation === 'getTemplate') {
		await executeGet.call(this, index, returnData);
	} else if (operation === 'updateTemplate') {
		await executeUpdate.call(this, index, returnData);
	} else if (operation === 'deleteTemplate') {
		await executeDelete.call(this, index, returnData);
	}
}

/* ── Create ──────────────────────────────────────────────────────── */

async function executeCreate(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const name = this.getNodeParameter('tpl_create_name', index, 'Untitled') as string;
	const htmlContent = this.getNodeParameter('tpl_create_html', index) as string;
	const cssContent = this.getNodeParameter('tpl_create_css', index, '') as string;
	const defaultParamsRaw = this.getNodeParameter('tpl_create_default_params', index, {}) as {
		params?: Array<{ key?: string; value?: string }>;
	};
	const metadataRaw = this.getNodeParameter('tpl_create_metadata', index, {}) as {
		params?: Array<{ key?: string; value?: string }>;
	};

	const body: Record<string, unknown> = {
		name,
		html_content: htmlContent,
	};
	if (cssContent) body.css_content = cssContent;

	const defaultParams = buildParamsObject(defaultParamsRaw);
	if (defaultParams) body.default_params = defaultParams;

	const metadata = buildParamsObject(metadataRaw);
	if (metadata) body.metadata = metadata;

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'pdfapihubApi',
		{
			method: 'POST',
			url: `${BASE_URL}/v1/templates`,
			body,
			json: true,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		},
	) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}

/* ── List ─────────────────────────────────────────────────────────── */

async function executeList(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'pdfapihubApi',
		{
			method: 'GET',
			url: `${BASE_URL}/v1/templates`,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		},
	) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}

/* ── Get ──────────────────────────────────────────────────────────── */

async function executeGet(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const templateId = this.getNodeParameter('tpl_get_id', index) as string;

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'pdfapihubApi',
		{
			method: 'GET',
			url: `${BASE_URL}/v1/templates/${encodeURIComponent(templateId)}`,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		},
	) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}

/* ── Update ───────────────────────────────────────────────────────── */

async function executeUpdate(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const templateId = this.getNodeParameter('tpl_update_id', index) as string;
	const updateFields = this.getNodeParameter('tpl_update_fields', index, {}) as Record<
		string,
		unknown
	>;
	const defaultParamsRaw = this.getNodeParameter('tpl_update_default_params', index, {}) as {
		params?: Array<{ key?: string; value?: string }>;
	};
	const metadataRaw = this.getNodeParameter('tpl_update_metadata', index, {}) as {
		params?: Array<{ key?: string; value?: string }>;
	};

	const body: Record<string, unknown> = {};
	if (updateFields.name) body.name = updateFields.name;
	if (updateFields.html_content) body.html_content = updateFields.html_content;
	if (updateFields.css_content) body.css_content = updateFields.css_content;

	const defaultParams = buildParamsObject(defaultParamsRaw);
	if (defaultParams) body.default_params = defaultParams;

	const metadata = buildParamsObject(metadataRaw);
	if (metadata) body.metadata = metadata;

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'pdfapihubApi',
		{
			method: 'PUT',
			url: `${BASE_URL}/v1/templates/${encodeURIComponent(templateId)}`,
			body,
			json: true,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		},
	) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}

/* ── Delete ───────────────────────────────────────────────────────── */

async function executeDelete(
	this: IExecuteFunctions,
	index: number,
	returnData: INodeExecutionData[],
): Promise<void> {
	const templateId = this.getNodeParameter('tpl_delete_id', index) as string;

	const responseData = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'pdfapihubApi',
		{
			method: 'DELETE',
			url: `${BASE_URL}/v1/templates/${encodeURIComponent(templateId)}`,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		},
	) as { body: unknown; statusCode: number };

	checkApiResponse(this, responseData.statusCode, responseData.body, index);
	returnData.push(parseJsonResponseBody(responseData.body, index));
}
