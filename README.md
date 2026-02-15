![Banner image](images/bannerpdfapihub.png)

# n8n-nodes-pdf-api-hub

An n8n community node for **PDF API Hub** (Get your api key from [https://pdfapihub.com](https://pdfapihub.com)) that can:

- Parse PDFs and extract text/structured data
- Merge and split PDFs
- Compress PDFs
- Lock and unlock password-protected PDFs
- Convert a website URL to a PDF (screenshot)
- Convert HTML/CSS to a PDF

## Table of contents

- [Install](#install)
- [Get your API key (PDF API Hub)](#get-your-api-key-pdf-api-hub)
- [Credentials setup (n8n)](#credentials-setup-n8n)
- [How outputs work (URL vs File vs Base64)](#how-outputs-work-url-vs-file-vs-base64)
- [Operations](#operations)
  - [PDF Parse / Extract Text](#pdf-parse--extract-text)
  - [PDF Merge](#pdf-merge)
  - [PDF Split](#pdf-split)
  - [PDF Compress](#pdf-compress)
  - [PDF Lock](#pdf-lock)
  - [PDF Unlock](#pdf-unlock)
  - [URL to PDF (Website Screenshot)](#url-to-pdf-website-screenshot)
  - [HTML to PDF](#html-to-pdf)
- [Support](#support)

## Install

Follow the official n8n community node install docs:
https://docs.n8n.io/integrations/community-nodes/installation/

In n8n:

1. Go to **Settings → Community Nodes**
2. Click **Install a community node**
3. Enter: `n8n-nodes-pdf-api-hub`
4. Click **Install**

## Get your API key (PDF API Hub)

1. Go to https://pdfapihub.com
2. Sign up / log in
3. Open your dashboard and find the **API Key / API Keys** section
4. Create/copy your API key

If the UI changes, use the official docs as the source of truth:
https://pdfapihub.com/docs

## Credentials setup (n8n)

1. In n8n, go to **Credentials**
2. Create a credential: **PDF API Hub API**
3. Paste your API key
4. Save

This node authenticates by sending:

- Header: `CLIENT-API-KEY: <your-key>`
- Requests are made against: `https://pdfapihub.com/api/v1`

## How outputs work (URL vs File vs Base64)

Many operations offer an output format/type:

- **URL**: the API returns a URL in the JSON response
- **File**: the node downloads the generated PDF/ZIP and returns it as **binary data** in n8n (`binary.data`)
- **Base64**: the API returns base64 in the JSON response

Tip: If you choose **File**, you can pass the binary to nodes like **Write Binary File**, **Google Drive**, **S3**, **Email**, etc.

## Operations

API reference docs:
https://pdfapihub.com/docs

### PDF Parse / Extract Text

- Endpoint: `POST https://pdfapihub.com/api/v1/pdf/parse`
- Node: **Resource** → PDF Parse / Extract Text
- Operation: **Extract Text / Parse PDF**

Parameters:

- **PDF URL**: Publicly accessible PDF URL
- **Parse Mode**: `text` (default), `layout`, `tables`, `full`
- **Pages**: `all` or a range like `1-3`

Returns: JSON (extracted text/structure)

### PDF Merge

- Endpoint: `POST https://pdfapihub.com/api/v1/pdf/merge`
- Node: **Resource** → PDF Merge / Split / Compress
- Operation: **Merge PDF**

Parameters:

- **URLs**: list of PDF URLs (in order)
- **Output Format**: `url` / `file` / `base64`

Returns:

- `url` / `base64`: JSON
- `file`: binary PDF

### PDF Split

- Endpoint: `POST https://pdfapihub.com/api/v1/pdf/split`
- Node: **Resource** → PDF Merge / Split / Compress
- Operation: **Split PDF**

Parameters:

- **PDF URL**: URL of the PDF to split
- **Split Type**:
  - `pages` (extract specific pages)
  - `each` (split every page)
  - `chunks` (split into N chunks)
- **Pages**: e.g. `1-3,5` (only for `pages`)
- **Number of Chunks**: (only for `chunks`)
- **Output Format**: `url` / `file` / `base64`

Returns:

- `url` / `base64`: JSON
- `file`: binary (often a ZIP or PDF, depending on the API response)

### PDF Compress

- Endpoint: `POST https://pdfapihub.com/api/v1/compressPdf`
- Node: **Resource** → PDF Merge / Split / Compress
- Operation: **Compress PDF**

Parameters:

- **PDF URL**
- **Compression Level**: `low` / `medium` / `high` / `max`
- **Output Type**: `url` / `file` / `base64`
- **Output Filename**: used when output is file

Returns:

- `url` / `base64`: JSON
- `file`: binary PDF

### PDF Lock

- Endpoint: `POST https://pdfapihub.com/api/v1/lockPdf`
- Node: **Resource** → PDF Security (Lock / Unlock)
- Operation: **Lock PDF**

Parameters:

- **PDF URL**
- **Password**: password to set
- **Input Password**: optional (if the input PDF is already encrypted)
- **Output Type**: `url` / `file` / `base64`
- **Output Filename**

Returns:

- `url` / `base64`: JSON
- `file`: binary PDF

### PDF Unlock

- Endpoint: `POST https://pdfapihub.com/api/v1/unlockPdf`
- Node: **Resource** → PDF Security (Lock / Unlock)
- Operation: **Unlock PDF**

Parameters:

- **PDF URL**
- **Password**: password to unlock
- **Output Type**: `url` / `file` / `base64`
- **Output Filename**

Returns:

- `url` / `base64`: JSON
- `file`: binary PDF

### URL to PDF (Website Screenshot)

- Endpoint: `POST https://pdfapihub.com/api/v1/generatePdf`
- Node: **Resource** → Website / HTML to PDF
- Operation: **URL to PDF**

Parameters:

- **URL**: website URL to capture
- **Full Page**: capture full page or viewport
- **Wait Till**: delay in ms before capture
- **Viewport Width / Height**
- **Output Format**: `url` / `file`
- **Output Filename**
- **Timeout**: request timeout in seconds

Returns:

- `url`: JSON with a PDF URL
- `file`: binary PDF

### HTML to PDF

- Endpoint: `POST https://pdfapihub.com/api/v1/generatePdf`
- Node: **Resource** → Website / HTML to PDF
- Operation: **HTML to PDF**

Parameters:

- **HTML Content**
- **CSS Content**
- **Dynamic Params**: optional key/value replacements for templating
- **Viewport Width / Height**
- **Output Format**: `url` / `file`
- **Output Filename**
- **Timeout**: request timeout in seconds

Returns:

- `url`: JSON with a PDF URL
- `file`: binary PDF

## Support

- PDF API Hub documentation: https://pdfapihub.com/docs
- Website: https://pdfapihub.com
- Issues/bugs: https://github.com/Pdfapihub/n8n-nodes-pdf-api-hub/issues

## License

[MIT](LICENSE.md)
