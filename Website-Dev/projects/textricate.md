
The goal of this project was to build an interactive web app for exploring and extracting text from PDF files. While PDFs are widely used, extracting text from specific regions is often tedious, especially when dealing with complex layouts.  

To address this, I developed a Flask-based application with a front-end powered by Fabric.js that allows users to visually select areas of a PDF and extract their text content. The process involved:

- **Back-end development:** Built with Flask, handling file uploads, preview generation, and text extraction using `pdfplumber`.  
- **Front-end integration:** Implemented a Fabric.js canvas to display PDF previews, allowing interactive drawing and manipulation of bounding boxes.  
- **PDF rendering:** Generated high-resolution image previews of each PDF page to preserve accuracy while selecting regions.  
- **Bounding box handling:** Implemented coordinate mapping so that selections on the preview translate directly to the correct PDF regions.  
- **Extraction pipeline:** Cropped PDF regions according to user-defined boxes and extracted text from those areas with `pdfplumber`.  

**Results:** The final system provides a simple and effective way to upload PDFs, navigate pages, highlight regions of interest, and extract text from those regions. It bridges the gap between raw PDF parsing and an intuitive, user-friendly workflow.  

![PDF Upload & Preview](projects/textricate_preview.png)
