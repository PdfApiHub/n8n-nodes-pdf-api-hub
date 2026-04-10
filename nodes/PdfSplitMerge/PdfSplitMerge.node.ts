import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	ResourceMapperFields,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { executePdfSplitMerge, allActionDescriptions } from './actions';
import { resourceProperty, operationProperties } from './descriptions';

export class PdfSplitMerge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF API Hub',
		name: 'pdfSplitMerge',
		icon: { light: 'file:../../icons/pdfhub.light.svg', dark: 'file:../../icons/pdfhub.dark.svg' },
		group: ['transform'],
		version: 1,
		description:
			'HTML/URL to PDF API, OCR, merge/split/compress PDFs, convert formats, and website screenshots. Complete PDF processing toolkit.',
		defaults: {
			name: 'PDF API Hub',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'pdfapihubApi',
				required: true,
			},
		],
		usableAsTool: true,
		properties: [
			resourceProperty,
			...operationProperties,
			...allActionDescriptions,
		],
	};

	methods = {
		loadOptions: {
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'pdfapihubApi',
					{
						method: 'GET',
						url: 'https://pdfapihub.com/api/v1/templates',
						json: true,
					},
				) as { templates?: Array<{ template_id: string; name?: string }> };

				const templates = responseData.templates ?? [];
				return templates.map((t) => ({
					name: t.name || t.template_id,
					value: t.template_id,
				}));
			},
			async getStarterTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const responseData = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://pdfapihub.com/starter-templates.json',
						json: true,
					}) as Array<{ id: string; title: string; category?: string }>;

					return [
						{ name: '— None —', value: '' },
						...responseData.map((t) => ({
							name: t.category ? `${t.category}: ${t.title}` : t.title,
							value: t.id,
						})),
					];
				} catch {
					return [{ name: '— None —', value: '' }];
				}
			},
		},
		resourceMapping: {
			async getTemplatePlaceholderFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const templateId = this.getCurrentNodeParameter('gen_template_id') as string;
				if (!templateId) return { fields: [] };

				try {
					const responseData = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'pdfapihubApi',
						{
							method: 'GET',
							url: `https://pdfapihub.com/api/v1/templates/${encodeURIComponent(templateId)}`,
							json: true,
						},
					) as {
						html_content?: string;
						default_params?: Record<string, string>;
					};

					const keys = new Set<string>();

					if (responseData.default_params) {
						for (const k of Object.keys(responseData.default_params)) {
							keys.add(k);
						}
					}

					if (responseData.html_content) {
						const patterns = [
							/\{\{@(\w+)\}\}/g,
							/\{\{\$(\w+)\}\}/g,
							/\$\{(\w+)\}/g,
							/\{(\w+)\}/g,
							/%(\w+)%/g,
						];
						for (const pattern of patterns) {
							let match;
							while ((match = pattern.exec(responseData.html_content)) !== null) {
								keys.add(match[1]);
							}
						}
					}

					const defaultParams = responseData.default_params ?? {};
					return {
						fields: Array.from(keys).sort().map((k) => ({
							id: k,
							displayName: k,
							type: 'string' as const,
							required: false,
							defaultMatch: false,
							display: true,
							defaultValue: defaultParams[k] ?? '',
						})),
					};
				} catch {
					return { fields: [] };
				}
			},

			async getStarterTemplatePlaceholders(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const templateId = this.getCurrentNodeParameter('starter_template') as string;
				if (!templateId) return { fields: [] };

				try {
					const allTemplates = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://pdfapihub.com/starter-templates.json',
						json: true,
					}) as Array<{
						id: string;
						html: string;
						fields: Array<{ key: string; label: string; defaultValue: string }>;
					}>;

					const template = allTemplates.find((t) => t.id === templateId);
					if (!template) return { fields: [] };

					return {
						fields: template.fields.map((f) => ({
							id: f.key,
							displayName: f.label || f.key,
							type: 'string' as const,
							required: false,
							defaultMatch: false,
							display: true,
							defaultValue: f.defaultValue ?? '',
						})),
					};
				} catch {
					return { fields: [] };
				}
			},

			async getStarterTemplatePlaceholdersImage(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const templateId = this.getCurrentNodeParameter('image_starter_template') as string;
				if (!templateId) return { fields: [] };

				try {
					const allTemplates = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://pdfapihub.com/starter-templates.json',
						json: true,
					}) as Array<{
						id: string;
						html: string;
						fields: Array<{ key: string; label: string; defaultValue: string }>;
					}>;

					const template = allTemplates.find((t) => t.id === templateId);
					if (!template) return { fields: [] };

					return {
						fields: template.fields.map((f) => ({
							id: f.key,
							displayName: f.label || f.key,
							type: 'string' as const,
							required: false,
							defaultMatch: false,
							display: true,
							defaultValue: f.defaultValue ?? '',
						})),
					};
				} catch {
					return { fields: [] };
				}
			},

			async getStarterTemplateHtml(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const templateId = this.getCurrentNodeParameter('starter_template') as string;
				if (!templateId) return { fields: [] };

				try {
					const allTemplates = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://pdfapihub.com/starter-templates.json',
						json: true,
					}) as Array<{ id: string; html: string }>;

					const template = allTemplates.find((t) => t.id === templateId);
					if (!template) return { fields: [] };

					return {
						fields: [{
							id: 'html_content',
							displayName: 'HTML Content',
							type: 'string' as const,
							required: false,
							defaultMatch: false,
							display: true,
							defaultValue: template.html ?? '',
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						} as any],
					};
				} catch {
					return { fields: [] };
				}
			},

			async getStarterTemplateHtmlImage(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const templateId = this.getCurrentNodeParameter('image_starter_template') as string;
				if (!templateId) return { fields: [] };

				try {
					const allTemplates = await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://pdfapihub.com/starter-templates.json',
						json: true,
					}) as Array<{ id: string; html: string }>;

					const template = allTemplates.find((t) => t.id === templateId);
					if (!template) return { fields: [] };

					return {
						fields: [{
							id: 'html_content',
							displayName: 'HTML Content',
							type: 'string' as const,
							required: false,
							defaultMatch: false,
							display: true,
							defaultValue: template.html ?? '',
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						} as any],
					};
				} catch {
					return { fields: [] };
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return executePdfSplitMerge.call(this);
	}
}
