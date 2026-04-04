import type { INodeProperties } from 'n8n-workflow';

export const resourceProperty: INodeProperties = {
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Capture HTML to PDF',
				value: 'pdfCreation',
				description: 'Capture a website screenshot to PDF or render HTML/CSS to PDF',
			},
			{
				name: 'Scrape Website HTML',
				value: 'urlToHtml',
				description: 'Scrape the fully-rendered HTML of any webpage using a headless browser (great for JS-heavy or SPA pages)',
			},
			{
				name: 'Convert Images to PDF',
				value: 'imageToPdf',
				description: 'Convert images (PNG, WebP, JPG) to PDF',
			},
			{
				name: 'Convert PDF to Image',
				value: 'pdfToImage',
				description: 'Convert PDF pages to images (PNG, WebP)',
			},
			{
				name: 'Create Image From HTML / Website',
				value: 'imageGeneration',
				description: 'Capture a website screenshot to image or render HTML/CSS to image',
			},
			{
				name: 'Document Conversion',
				value: 'documentConversion',
				description: 'Convert DOCX/Office documents to PDF and PDF to DOCX',
			},
			{
				name: 'Document Intelligence',
				value: 'documentIntelligence',
				description: 'Compare similarity between two image/PDF documents',
			},
			{
				name: 'Extract OCR Text (PDF/Image)',
				value: 'ocrParsing',
				description: 'Extract searchable text from scanned PDFs/images',
			},
			{
				name: 'Extract PDF Text / Data',
				value: 'pdfParsing',
				description: 'Extract text or structured data from PDFs',
			},
			{
				name: 'Manage PDF (Merge / Split / Compress)',
				value: 'pdfManipulation',
				description: 'Merge, split, or compress PDF documents',
			},
			{
				name: 'Protect PDF (Lock / Unlock)',
				value: 'pdfSecurity',
				description: 'Lock and unlock password-protected PDFs',
			},
			{
				name: 'Watermark & Sign PDF',
				value: 'watermark',
				description: 'Add text/image watermarks or stamp signatures onto PDFs and images',
			},
			{
				name: 'File Management',
				value: 'fileManagement',
				description: 'Upload, list, and delete files in your cloud storage',
			}
			],
		default: 'pdfParsing',
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
				name: 'Add Watermark',
				value: 'addWatermark',
				description: 'Add text or image watermark to every page of a PDF or image',
				action: 'Add watermark to PDF or image',
			},
			{
				name: 'Sign PDF',
				value: 'signPdf',
				description: 'Stamp a signature image onto one or all pages of a PDF',
				action: 'Sign a PDF with a signature image',
			},
		],
		default: 'addWatermark',
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
				description: 'Merge multiple PDFs into a single PDF',
				action: 'Merge multiple pdfs into a single pdf',
			},
			{
				name: 'Split PDF',
				value: 'splitPdf',
				description: 'Split a PDF into multiple files',
				action: 'Split a PDF into multiple files',
			},
			{
				name: 'Compress PDF',
				value: 'compressPdf',
				description: 'Compress a PDF to reduce file size',
				action: 'Reduce size of pdf file',
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
