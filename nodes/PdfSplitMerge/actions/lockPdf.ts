import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { normalizeUrl, prepareBinaryResponse, createSingleFileMultipart, parseJsonResponseBody, checkApiResponse } from '../helpers';

/* ================================================================
 *  Field descriptions – Lock (Encrypt) PDF
 * ================================================================ */

export const description: INodeProperties[] = [
	// ─── 1. Input ───────────────────────────────────────────────────
	{
		displayName: 'Input Type',
		name: 'lock_input_type',
		type: 'options',
		options: [
			{ name: 'URL (Default)', value: 'url', description: 'Provide a publicly accessible PDF URL' },
			{ name: 'Binary File', value: 'file', description: 'Use a PDF from a previous node\'s binary output' },
		],
		default: 'url',
		description: 'How to provide the PDF to encrypt',
		displayOptions: { show: { operation: ['lockPdf'] } },
	},
	{
		displayName: 'PDF URL',
		name: 'lock_url',
		type: 'string',
		default: '',
		placeholder: 'https://pdfapihub.com/sample.pdf',
		description: 'Public URL of the PDF to encrypt',
		displayOptions: { show: { operation: ['lockPdf'], lock_input_type: ['url'] } },
	},
	{
		displayName: 'Binary Property Name',
		name: 'lock_file_binary_property',
		type: 'string',
		default: 'data',
		description: 'Binary property containing the PDF file',
		displayOptions: { show: { operation: ['lockPdf'], lock_input_type: ['file'] } },
	},

	// ─── 2. Password ────────────────────────────────────────────────
	{
		displayName: 'Password',
		name: 'lock_password',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		description: 'Password required to open the PDF (user password)',
		displayOptions: { show: { operation: ['lockPdf'] } },
	},

	// ─── 3. Output ──────────────────────────────────────────────────
	{
		displayName: 'Output Format',
		name: 'lock_output',
		type: 'options',
		options: [
			{ name: 'Binary File (Download) (Default)', value: 'file', description: 'Returns raw PDF binary — great for piping into other nodes' },
			{ name: 'URL (Hosted Link)', value: 'url', description: 'Returns a downloadable URL — file hosted for 30 days' },
			{ name: 'Base64 (Inline Data)', value: 'base64', description: 'Returns the PDF as a base64-encoded string inside JSON' },
		],
		default: 'file',
		description: 'How the locked PDF is returned',
		displayOptions: { show: { operation: ['lockPdf'] } },
	},
	{
		displayName: 'Output Filename',
		name: 'lock_output_name',
		type: 'string',
		default: 'locked.pdf',
		placeholder: 'encrypted-contract.pdf',
		description: 'Filename for the locked PDF — .pdf is appended automatically if omitted',
		displayOptions: { show: { operation: ['lockPdf'] } },
	},

	// ─── 4. Advanced Options ────────────────────────────────────────
	{
		displayName: 'Advanced Options',
		name: 'lockAdvancedOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { operation: ['lockPdf'] } },
		options: [
			{
				displayName: 'Allow Annotations',
				name: 'perm_annotate',
				type: 'boolean',
				default: true,
				description: 'Whether users can add comments and annotations',
			},
			{
				displayName: 'Allow Assembling',
				name: 'perm_assemble',
				type: 'boolean',
				default: true,
				description: 'Whether users can insert, rotate, or delete pages',
			},
			{
				displayName: 'Allow Copying',
				name: 'perm_copy',
				type: 'boolean',
				default: true,
				description: 'Whether users can copy text and graphics',
			},
			{
				displayName: 'Allow Extracting',
				name: 'perm_extract',
				type: 'boolean',
				default: true,
				description: 'Whether screen readers and accessibility tools can extract text',
			},
			{
				displayName: 'Allow Filling Forms',
				name: 'perm_fill_forms',
				type: 'boolean',
				default: true,
				description: 'Whether users can fill in form fields',
			},
			{
				displayName: 'Allow High-Res Printing',
				name: 'perm_print_highres',
				type: 'boolean',
				default: true,
				description: 'Whether users can print at full resolution',
			},
			{
				displayName: 'Allow Modifying',
				name: 'perm_modify',
				type: 'boolean',
				default: true,
				description: 'Whether users can edit the document content',
			},
			{
				displayName: 'Allow Printing',
				name: 'perm_print',
				type: 'boolean',
				default: true,
				description: 'Whether users can print the PDF',
			},
			{
				displayName: 'Encryption',
				name: 'encryption',
				type: 'options',
				options: [
					{ name: 'AES-256 (Default, Strongest)', value: 'aes256' },
					{ name: 'AES-128', value: 'aes128' },
					{ name: 'RC4-128 (Legacy Compatibility)', value: 'rc4' },
				],
				default: 'aes256',
				description: 'Encryption algorithm. Use AES-256 unless you need legacy PDF viewer support.',
			},
			{
				displayName: 'Input Password',
				name: 'input_password',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'If the input PDF is already encrypted, provide its password here to decrypt it before re-encrypting',
			},
			{
				displayName: 'Owner Password',
				name: 'owner_password',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Separate password for changing permissions/encryption. If empty, same as the user password.',
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
): Promise<void> {
	const lockInputType = this.getNodeParameter('lock_input_type', index) as string;
	const password = this.getNodeParameter('lock_password', index) as string;
	const outputType = this.getNodeParameter('lock_output', index) as string;
	const outputName = this.getNodeParameter('lock_output_name', index, 'locked.pdf') as string;

	// Advanced options
	const advanced = this.getNodeParameter('lockAdvancedOptions', index, {}) as Record<string, unknown>;

	// Backward compat: old workflows stored input_password as top-level
	let inputPassword = advanced.input_password as string | undefined;
	if (inputPassword === undefined) {
		try { inputPassword = this.getNodeParameter('lock_input_password', index) as string; } catch { inputPassword = ''; }
	}

	const ownerPassword = (advanced.owner_password as string | undefined) ?? '';
	const encryption = (advanced.encryption as string | undefined) ?? 'aes256';

	// Build permissions object — only include if any flag is explicitly set
	const permMap = {
		print: 'perm_print', print_highres: 'perm_print_highres', copy: 'perm_copy',
		modify: 'perm_modify', annotate: 'perm_annotate', fill_forms: 'perm_fill_forms',
		extract: 'perm_extract', assemble: 'perm_assemble',
	} as const;
	const permissions: Record<string, boolean> = {};
	let hasRestrictions = false;
	for (const [apiKey, advKey] of Object.entries(permMap)) {
		const val = advanced[advKey] as boolean | undefined;
		if (val !== undefined) {
			permissions[apiKey] = val;
			if (!val) hasRestrictions = true;
		}
	}

	const body: Record<string, unknown> = {
		password,
		output: outputType,
		output_name: outputName,
	};
	if (lockInputType === 'url') body.url = normalizeUrl(this.getNodeParameter('lock_url', index, '') as string);
	if (inputPassword) body.input_password = inputPassword;
	if (ownerPassword) body.owner_password = ownerPassword;
	if (encryption !== 'aes256') body.encryption = encryption;
	if (hasRestrictions) body.permissions = permissions;

	const safeName = outputName.endsWith('.pdf') ? outputName : `${outputName}.pdf`;

	if (outputType === 'file') {
		const requestOptions = lockInputType === 'file'
			? await createSingleFileMultipart.call(this, index, this.getNodeParameter('lock_file_binary_property', index) as string, body as Record<string, string | number | boolean>)
			: { body, json: true };

		const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
			method: 'POST', url: 'https://pdfapihub.com/api/v1/lockPdf',
			...requestOptions, encoding: 'arraybuffer', returnFullResponse: true, ignoreHttpStatusErrors: true,
		}) as { body: ArrayBuffer; statusCode: number; headers?: Record<string, unknown> };

		if (responseData.statusCode >= 400) {
			let errorBody: unknown;
			try { errorBody = JSON.parse(Buffer.from(responseData.body).toString('utf8')); } catch { errorBody = {}; }
			checkApiResponse(this, responseData.statusCode, errorBody, index);
		}
		returnData.push(await prepareBinaryResponse.call(this, index, responseData, safeName, 'application/pdf'));
	} else {
		const requestOptions = lockInputType === 'file'
			? await createSingleFileMultipart.call(this, index, this.getNodeParameter('lock_file_binary_property', index) as string, body as Record<string, string | number | boolean>)
			: { body, json: true };

		const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'pdfapihubApi', {
			method: 'POST', url: 'https://pdfapihub.com/api/v1/lockPdf',
			...requestOptions, returnFullResponse: true, ignoreHttpStatusErrors: true,
		}) as { body: unknown; statusCode: number };

		checkApiResponse(this, responseData.statusCode, responseData.body, index);
		returnData.push(parseJsonResponseBody(responseData.body, index));
	}
}
