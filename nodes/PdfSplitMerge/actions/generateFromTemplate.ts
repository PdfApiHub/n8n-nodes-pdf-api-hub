import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	IDataObject,
} from 'n8n-workflow';
import { checkApiResponse, prepareBinaryResponse } from '../helpers';

const BASE_URL = 'https://pdfapihub.com/api';

/* ================================================================
 *  Field descriptions – Generate PDF / Image from Template
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── Template Selection ─────────────────────────────────────────
	{
		displayName: 'Template Name or ID',
		name: 'gen_template_id',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getTemplates' },
		default: '',
		required: true,
		description:
			'Select a saved template. Create new templates at <a href="https://pdfapihub.com/template-studio" target="_blank">Template Studio</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { operation: ['templateToPdf', 'templateToImage'] } },
	},

	// ─── Output Format ──────────────────────────────────────────────
	{
		displayName: 'Output Format',
		name: 'gen_tpl_output_format',
		type: 'options',
		options: [
			{
				name: 'URL (Hosted Link)',
				value: 'url',
				description: 'Returns a downloadable URL — file hosted for 30 days',
			},
			{
				name: 'Binary File (Download)',
				value: 'file',
				description: 'Returns raw binary — great for piping into other nodes',
			},
		],
		default: 'url',
		description: 'How the generated file is returned',
		displayOptions: { show: { operation: ['templateToPdf', 'templateToImage'] } },
	},

	// ─── Dynamic Params ─────────────────────────────────────────────
	{
		displayName: 'Dynamic Params',
		name: 'gen_tpl_dynamic_params',
		type: 'resourceMapper',
		noDataExpression: true,
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		description:
			"Key/value pairs that replace placeholders in the template. All template placeholders are loaded automatically — fill in values and remove any you don't need.",
		displayOptions: { show: { operation: ['templateToPdf', 'templateToImage'] } },
		typeOptions: {
			loadOptionsDependsOn: ['gen_template_id'],
			resourceMapper: {
				resourceMapperMethod: 'getTemplatePlaceholderFields',
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

	// ─── Custom Dynamic Params (manual) ───────────────────────────
	{
		displayName: 'Custom Dynamic Params',
		name: 'gen_tpl_dynamic_params_manual',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Additional custom key/value pairs. These are merged with the template placeholders above (manual values win on conflict).',
		displayOptions: { show: { operation: ['templateToPdf', 'templateToImage'] } },
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
						placeholder: 'custom_field',
						description: 'Placeholder key \u2014 without the {{ }} braces',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'My Value',
						description: 'Replacement value for this placeholder',
					},
				],
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
	const templateId = this.getNodeParameter('gen_template_id', index) as string;
	const outputFormat = this.getNodeParameter('gen_tpl_output_format', index) as string;

	const body: Record<string, unknown> = {
		template_id: templateId,
		output_format: outputFormat,
	};

	// Dynamic params (from resourceMapper + manual fixedCollection)
	const allDynamic: Record<string, string> = {};

	const dynamicParamsRaw = this.getNodeParameter('gen_tpl_dynamic_params', index, {}) as {
		mappingMode?: string;
		value?: Record<string, string> | null;
	};
	if (dynamicParamsRaw.value && typeof dynamicParamsRaw.value === 'object') {
		for (const [k, v] of Object.entries(dynamicParamsRaw.value)) {
			if (k) allDynamic[k] = v ?? '';
		}
	}

	const manualParams = this.getNodeParameter('gen_tpl_dynamic_params_manual', index, {}) as {
		params?: Array<{ key?: string; value?: string }>;
	};
	if (manualParams.params?.length) {
		for (const p of manualParams.params) {
			if (p.key) allDynamic[p.key] = p.value ?? '';
		}
	}

	if (Object.keys(allDynamic).length) body.dynamic_params = allDynamic;

	const isPdf = operation === 'templateToPdf';
	const endpoint = isPdf
		? `${BASE_URL}/v1/generatePdf`
		: `${BASE_URL}/v1/generateImage`;
	const fallbackFileName = isPdf ? 'template-output.pdf' : 'template-output.png';
	const fallbackMimeType = isPdf ? 'application/pdf' : 'image/png';

	if (outputFormat === 'file') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: endpoint,
				body,
				json: true,
				encoding: 'arraybuffer',
				returnFullResponse: true,
				ignoreHttpStatusErrors: true,
			},
		) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

		if (responseData.statusCode >= 400) {
			let errorBody: unknown;
			try {
				errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8'));
			} catch {
				errorBody = {};
			}
			checkApiResponse(this, responseData.statusCode, errorBody, index);
		}

		returnData.push(
			await prepareBinaryResponse.call(
				this,
				index,
				responseData,
				fallbackFileName,
				fallbackMimeType,
			),
		);
	} else {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfapihubApi',
			{
				method: 'POST',
				url: endpoint,
				body,
				json: true,
				returnFullResponse: true,
				ignoreHttpStatusErrors: true,
			},
		) as { body: Record<string, unknown>; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push({
			json: responseData.body as IDataObject,
			pairedItem: { item: index },
		});
	}
}
