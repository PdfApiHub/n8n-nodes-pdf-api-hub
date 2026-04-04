import type { INodeProperties } from 'n8n-workflow';

export const resourceProperty: INodeProperties = {
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: '1. HTML / URL to PDF',
				value: 'pdfCreation',
				description: 'Turn any webpage or HTML into a polished PDF',
			},
			{
				name: '2. Sign PDF',
				value: 'watermark',
				description: 'Stamp a signature or watermark onto your PDFs',
			},
			{
				name: '3. Screenshot Website to Image',
				value: 'imageGeneration',
				description: 'Capture any webpage or HTML as a PNG screenshot',
			},
			{
				name: '4. OCR — Read Scanned PDFs & Images',
				value: 'ocrParsing',
				description: 'Extract text from scanned documents and photos using OCR',
			},
			{
				name: '5. Extract PDF Text & Tables',
				value: 'pdfParsing',
				description: 'Pull out text, tables, or structured data from any PDF',
			},
			{
				name: '6. PDF to Excel / CSV / Word / PowerPoint',
				value: 'documentConversion',
				description: 'Convert PDFs into editable formats — Excel, Word, CSV, HTML, PPTX',
			},
			{
				name: '7. Merge / Split PDF',
				value: 'pdfManipulation',
				description: 'Combine multiple PDFs or split one into parts',
			},
			{
				name: '8. Compress PDF',
				value: 'compressResource',
				description: 'Shrink PDF file size without losing quality',
			},
			{
				name: '9. Protect / Unlock PDF',
				value: 'pdfSecurity',
				description: 'Add or remove password protection on PDFs',
			},
			{
				name: '10. Scrape Website HTML',
				value: 'urlToHtml',
				description: 'Fetch the fully-rendered HTML of any page — great for SPAs',
			},
			{
				name: '11. Images to PDF',
				value: 'imageToPdf',
				description: 'Combine JPG, PNG, or WebP images into a single PDF',
			},
			{
				name: '12. PDF to Image',
				value: 'pdfToImage',
				description: 'Render PDF pages as PNG, JPG, or WebP images',
			},
			{
				name: '13. Compare Documents',
				value: 'documentIntelligence',
				description: 'Check how similar two PDFs or images are',
			},
			{
				name: '14. File Management',
				value: 'fileManagement',
				description: 'Upload, list, or delete files in your cloud storage',
			},
			],
		default: 'pdfCreation',
	};

export const operationProperties: INodeProperties[] = [
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['pdfCreation'],
			},
		},
		options: [
			{
				name: 'URL to PDF',
				value: 'urlToPdf',
				description: 'Capture website screenshot to PDF',
				action: 'Capture a screenshot of a website in PDF format',
			},
			{
				name: 'HTML to PDF',
				value: 'htmlToPdf',
				description: 'Generate PDF from HTML/CSS',
				action: 'Convert HTML to PDF',
			},
		],
		default: 'urlToPdf',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['imageGeneration'],
			},
		},
		options: [
			{
				name: 'URL to Image',
				value: 'urlToImage',
				description: 'Capture website screenshot as image',
				action: 'Capture a screenshot of a website as an image',
			},
			{
				name: 'HTML to Image',
				value: 'htmlToImage',
				description: 'Generate image from HTML/CSS',
				action: 'Convert HTML to image',
			},
		],
		default: 'urlToImage',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['ocrParsing'],
			},
		},
		options: [
			{
				name: 'PDF OCR Parse',
				value: 'pdfOcrParse',
				description: 'Parse text from PDFs, including scanned pages',
				action: 'Parse text from scanned PDF images',
			},
			{
				name: 'Image OCR Parse',
				value: 'imageOcrParse',
				description: 'Extract text from image using OCR',
				action: 'Parse text from images',
			},
		],
		default: 'pdfOcrParse',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['imageToPdf'],
			},
		},
		options: [
			{
				name: 'PNG to PDF',
				value: 'pngToPdf',
				description: 'Convert PNG image(s) to PDF',
				action: 'Convert PNG images to PDF',
			},
			{
				name: 'WebP to PDF',
				value: 'webpToPdf',
				description: 'Convert WebP image(s) to PDF',
				action: 'Convert webp images to PDF',
			},
			{
				name: 'JPG to PDF',
				value: 'jpgToPdf',
				description: 'Convert JPG image(s) to PDF',
				action: 'Convert JPG images to PDF',
			},
		],
		default: 'pngToPdf',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['documentConversion'],
			},
		},
		options: [
			{
				name: 'DOCX / Document to PDF',
				value: 'docxToPdf',
				description: 'Convert Office-like documents (DOCX, PPTX, XLSX, etc.) to PDF',
				action: 'Convert a document to PDF',
			},
			{
				name: 'PDF to DOCX',
				value: 'pdfToDocx',
				description: 'Convert PDF to DOCX',
				action: 'Convert a pdf to docx',
			},
			{
				name: 'PDF to Excel (XLSX)',
				value: 'pdfToXlsx',
				description: 'Extract tables and text from PDF into an Excel spreadsheet — one sheet per page',
				action: 'Convert PDF to Excel',
			},
			{
				name: 'PDF to CSV',
				value: 'pdfToCsv',
				description: 'Extract tables and text from PDF into CSV format',
				action: 'Convert PDF to CSV',
			},
			{
				name: 'PDF to Text',
				value: 'pdfToTxt',
				description: 'Extract plain text from all or selected PDF pages',
				action: 'Convert PDF to plain text',
			},
			{
				name: 'PDF to HTML',
				value: 'pdfToHtml',
				description: 'Convert PDF pages to a styled HTML document',
				action: 'Convert PDF to HTML',
			},
			{
				name: 'PDF to PowerPoint (PPTX)',
				value: 'pdfToPptx',
				description: 'Convert each PDF page into a PowerPoint slide',
				action: 'Convert PDF to PowerPoint',
			},
		],
		default: 'docxToPdf',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['documentIntelligence'],
			},
		},
		options: [
			{
				name: 'Similarity Check',
				value: 'documentSimilarity',
				description: 'Compare similarity between two images/PDF documents',
				action: 'Compare similarity between two documents',
			},
		],
		default: 'documentSimilarity',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['pdfToImage'],
			},
		},
		options: [
			{
				name: 'PDF to PNG',
				value: 'pdfToPng',
				description: 'Convert PDF pages to PNG images',
				action: 'Convert PDF to PNG images',
			},
			{
				name: 'PDF to WebP',
				value: 'pdfToWebp',
				description: 'Convert PDF pages to WebP images',
				action: 'Convert pdf to webp images',
			},
			{
				name: 'PDF to JPG',
				value: 'pdfToJpg',
				description: 'Convert PDF pages to JPG images',
				action: 'Convert PDF to JPG images',
			},
		],
		default: 'pdfToPng',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['urlToHtml'],
			},
		},
		options: [
			{
				name: 'Fetch HTML',
				value: 'fetchHtml',
				description: 'Navigate to a URL and return the fully-rendered HTML',
				action: 'Fetch rendered HTML from a URL',
			},
		],
		default: 'fetchHtml',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['watermark'],
			},
		},
		options: [
			{
				name: 'Sign PDF',
				value: 'signPdf',
				description: 'Stamp a signature image onto one or all pages',
				action: 'Sign a PDF with a signature image',
			},
			{
				name: 'Add Watermark',
				value: 'addWatermark',
				description: 'Overlay text or a logo across every page',
				action: 'Add watermark to PDF or image',
			},
		],
		default: 'signPdf',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['pdfManipulation'],
			},
		},
		options: [
			{
				name: 'Merge PDF',
				value: 'mergePdf',
				description: 'Combine multiple PDFs into one document',
				action: 'Merge multiple PDFs into one',
			},
			{
				name: 'Split PDF',
				value: 'splitPdf',
				description: 'Split a PDF into separate pages or chunks',
				action: 'Split a PDF into parts',
			},
			{
				name: 'Compress PDF',
				value: 'compressPdf',
				description: 'Reduce PDF file size — choose from low to max compression',
				action: 'Compress a PDF file',
			},
		],
		default: 'mergePdf',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['compressResource'],
			},
		},
		options: [
			{
				name: 'Compress PDF',
				value: 'compressPdf',
				description: 'Reduce PDF file size — choose from low to max compression',
				action: 'Compress a PDF file',
			},
		],
		default: 'compressPdf',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['pdfSecurity'],
			},
		},
		options: [
			{
				name: 'Lock PDF',
				value: 'lockPdf',
				description: 'Add password protection to a PDF',
				action: 'Password protect a pdf file',
			},
			{
				name: 'Unlock PDF',
				value: 'unlockPdf',
				description: 'Remove password protection from a PDF',
				action: 'Remove password protection from PDF',
			},
		],
		default: 'lockPdf',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['pdfParsing'],
			},
		},
		options: [
			{
				name: 'Extract Text / Parse PDF',
				value: 'parsePdf',
				description: 'Extract text or structured data from a PDF',
				action: 'Parse PDF to JSON',
			},
		],
		default: 'parsePdf',
	},
{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['fileManagement'],
			},
		},
		options: [
			{
				name: 'Upload File',
				value: 'uploadFile',
				description: 'Upload a file to cloud storage — auto-deleted after 30 days',
				action: 'Upload a file',
			},
			{
				name: 'List Files',
				value: 'listFiles',
				description: 'List all files uploaded with your API key',
				action: 'List uploaded files',
			},
			{
				name: 'Delete File',
				value: 'deleteFile',
				description: 'Delete a file from cloud storage by URL',
				action: 'Delete an uploaded file',
			},
		],
		default: 'uploadFile',
	},
];
