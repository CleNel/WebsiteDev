
The goal of this project was to create a tool to automatically retrieve, preview, and process the **United States Senate Daily Digest** from congress.gov. These documents are only available as PDFs, which makes programmatic access and analysis challenging due to their multi-column layout.

To address this, I built a Python-based pipeline that downloads the daily PDF, generates a visual preview of the document layout, and extracts the text in a structured way by separating the header from the body columns.

The process involved:

- **PDF retrieval:** Implemented an automated downloader using the `requests` library to fetch digests directly from congress.gov.  
- **Layout analysis:** Designed a function to calculate bounding boxes for the header and multiple text columns, with adjustable fractions for flexibility.  
- **Visualization:** Used `matplotlib` to render the first page as an image, overlaying bounding boxes (red for header, blue for columns) for easy verification.  
- **Text extraction:** Applied `pdfplumber` to crop the page into regions, extracting the header first (left-to-right) and then each column in order.  
- **Output management:** Saved both the preview image (`page_preview.png`) and structured text (`_page1_with_header.txt`) alongside the original PDF for reproducibility.  

Results: The script successfully extracts human-readable text from highly structured PDFs, with correct separation between the header and multi-column body. This provides a foundation for building searchable archives, automated analysis pipelines, or database storage of congressional records.

![ezgov Preview 1](projects/ezgov_preview_1.png)
![ezgov Preview 2](projects/ezgov_preview_2.png)
