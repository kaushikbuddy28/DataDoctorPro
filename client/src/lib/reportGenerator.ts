import { 
  AlignmentType,
  Document, 
  HeadingLevel, 
  Packer, 
  Paragraph, 
  Table, 
  TableCell, 
  TableRow, 
  TextRun,
  WidthType,
  BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import type { ProcessedDataset, DatasetStats } from '../types';

/**
 * Generates a comprehensive data cleaning and analysis report in DOCX format
 */
export async function generateDataReport(dataset: ProcessedDataset): Promise<Blob> {
  // Title page section
  const titleSection = [
    new Paragraph({
      text: "Data Cleaning and Analysis Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: `Dataset: ${dataset.fileName}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Generated on: ${new Date().toLocaleDateString()}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "Data Cleaning and Visualization Platform",
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "This report provides a comprehensive analysis of the uploaded dataset, including data cleaning operations performed, key statistics, and insights derived from the data. The analysis aims to provide actionable recommendations based on the cleaned and processed data.",
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "Business Objective",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "The objective of this analysis is to clean and prepare the dataset for further analysis, identify key patterns and trends, and provide insights that can inform business decision-making.",
      spacing: { after: 400 },
    }),
  ];

  // Data Overview section
  const dataOverviewSection = [
    new Paragraph({
      text: "Data Overview",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `File Information:`,
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    }),
    createInfoTable([
      ["File Name", dataset.fileName],
      ["File Type", dataset.fileType],
      ["File Size", `${(dataset.fileSize / 1024).toFixed(1)} KB`],
      ["Upload Date", new Date(dataset.createdAt).toLocaleDateString()],
      ["Total Rows", dataset.stats.totalRows.toString()],
      ["Total Columns", dataset.stats.totalColumns.toString()]
    ]),
    new Paragraph({
      text: "Assumptions and Limitations:",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      text: "• The data is assumed to be structured with consistent headers and value types.",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "• Outlier detection is performed using the IQR method (1.5 * Interquartile Range).",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "• The cleaning operations are non-destructive to the original data, which is preserved.",
      spacing: { after: 400 },
    }),
  ];

  // Data Cleaning Summary section
  const dataCleaningSummarySection = [
    new Paragraph({
      text: "Data Cleaning Summary",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "The following cleaning operations were performed on the dataset:",
      spacing: { after: 200 },
    }),
  ];
  
  // Add info table as a separate item in the array
  dataCleaningSummarySection.push(
    createInfoTable([
      ["Duplicates Removed", dataset.stats.duplicatesRemoved.toString()],
      ["Null Values Fixed", dataset.stats.nullValuesFixed.toString()],
      ["Outliers Removed", dataset.stats.outlierCount.toString()],
      ["Columns Renamed", dataset.stats.columnsRenamed.length.toString()]
    ])
  );
  
  // Add column header as a separate paragraph
  dataCleaningSummarySection.push(
    new Paragraph({
      text: "Column Renaming Details:",
      heading: HeadingLevel.HEADING_2, 
      spacing: { before: 200, after: 200 },
    })
  );

  // Add column renaming details table if available
  if (dataset.stats.columnsRenamed && dataset.stats.columnsRenamed.length > 0) {
    dataCleaningSummarySection.push(
      createColumnsTable(dataset.stats.columnsRenamed)
    );
  } else {
    dataCleaningSummarySection.push(
      new Paragraph({
        text: "No columns were renamed during the cleaning process.",
        spacing: { after: 400 },
      })
    );
  }

  // Data Type Distribution section
  dataCleaningSummarySection.push(
    new Paragraph({
      text: "Data Type Distribution:",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 },
    })
  );

  if (dataset.stats.dataTypeSummary && Object.keys(dataset.stats.dataTypeSummary).length > 0) {
    const dataTypeRows = Object.entries(dataset.stats.dataTypeSummary).map(
      ([type, count]) => [type, count.toString()]
    );
    dataCleaningSummarySection.push(createInfoTable(dataTypeRows));
  } else {
    dataCleaningSummarySection.push(
      new Paragraph({
        text: "No data type information available.",
        spacing: { after: 400 },
      })
    );
  }

  // Exploratory Data Analysis section
  const edaSection = [
    new Paragraph({
      text: "Exploratory Data Analysis (EDA)",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200, before: 200 },
    }),
    new Paragraph({
      text: "The following analysis was performed on the cleaned dataset to identify patterns and insights:",
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "• Descriptive Statistics: Mean, median, and mode calculations for numeric fields",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "• Distribution Analysis: Outlier detection and handling",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "• Correlation Analysis: Identifying relationships between variables",
      spacing: { after: 400 },
    }),
  ];

  // Key Insights section
  const insightsSection = [
    new Paragraph({
      text: "Key Insights",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200, before: 200 },
    }),
    new Paragraph({
      text: "Based on the analysis of the cleaned dataset, the following key insights were identified:",
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "• The dataset contained " + dataset.stats.duplicatesRemoved + " duplicate records that were removed.",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "• " + dataset.stats.nullValuesFixed + " missing values were identified and fixed using appropriate strategies.",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "• Data types were standardized across the dataset to ensure consistency.",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "• " + dataset.stats.outlierCount + " outliers were identified and handled appropriately.",
      spacing: { after: 400 },
    }),
  ];

  // Recommendations section
  const recommendationsSection = [
    new Paragraph({
      text: "Recommendations",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200, before: 200 },
    }),
    new Paragraph({
      text: "Based on the analysis, the following recommendations are provided:",
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: "• Implement data validation rules to reduce missing values in future data collection.",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "• Consider implementing automated data cleaning pipelines to maintain data quality.",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "• Review the outlier handling methodology to ensure it aligns with business requirements.",
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: "• Standardize column naming conventions across all datasets for consistency.",
      spacing: { after: 400 },
    }),
  ];

  // Conclusion section
  const conclusionSection = [
    new Paragraph({
      text: "Conclusion",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200, before: 200 },
    }),
    new Paragraph({
      text: "This report provides a comprehensive analysis of the dataset, highlighting key insights and recommendations based on the cleaned data. The cleaning process has significantly improved the quality of the dataset, making it suitable for further analysis and decision-making.",
      spacing: { after: 400 },
    }),
  ];

  // Appendix section
  const appendixSection = [
    new Paragraph({
      text: "Appendix",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200, before: 200 },
    }),
    new Paragraph({
      text: "Data Dictionary",
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    }),
  ];

  // Add data dictionary if available
  if (dataset.stats.columnsRenamed && dataset.stats.columnsRenamed.length > 0) {
    appendixSection.push(createColumnsTable(dataset.stats.columnsRenamed));
  } else {
    appendixSection.push(
      new Paragraph({
        text: "No data dictionary available.",
        spacing: { after: 200 },
      })
    );
  }

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...titleSection,
          ...dataOverviewSection,
          ...dataCleaningSummarySection,
          ...edaSection,
          ...insightsSection,
          ...recommendationsSection,
          ...conclusionSection,
          ...appendixSection,
        ],
      },
    ],
  });

  // Generate the document
  return await Packer.toBlob(doc);
}

/**
 * Helper function to create a simple info table
 */
function createInfoTable(rows: string[][]): Table {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: rows.map(
      (row) =>
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 30,
                type: WidthType.PERCENTAGE,
              },
              children: [new Paragraph(row[0])],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
            }),
            new TableCell({
              width: {
                size: 70,
                type: WidthType.PERCENTAGE,
              },
              children: [new Paragraph(row[1])],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
              },
            }),
          ],
        })
    ),
  });
}

/**
 * Helper function to create a columns table
 */
function createColumnsTable(columns: { original: string; cleaned: string; type: string }[]): Table {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: {
              size: 33,
              type: WidthType.PERCENTAGE,
            },
            children: [new Paragraph(new TextRun({ text: "Original Name", bold: true }))],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            width: {
              size: 33,
              type: WidthType.PERCENTAGE,
            },
            children: [new Paragraph(new TextRun({ text: "Cleaned Name", bold: true }))],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            width: {
              size: 33,
              type: WidthType.PERCENTAGE,
            },
            children: [new Paragraph(new TextRun({ text: "Data Type", bold: true }))],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      }),
      ...columns.map(
        (col) =>
          new TableRow({
            children: [
              new TableCell({
                width: {
                  size: 33,
                  type: WidthType.PERCENTAGE,
                },
                children: [new Paragraph(col.original)],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                width: {
                  size: 33,
                  type: WidthType.PERCENTAGE,
                },
                children: [new Paragraph(col.cleaned)],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                width: {
                  size: 33,
                  type: WidthType.PERCENTAGE,
                },
                children: [new Paragraph(col.type)],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          })
      ),
    ],
  });
}

/**
 * Function to download the generated report
 */
export async function downloadReport(dataset: ProcessedDataset): Promise<void> {
  try {
    const blob = await generateDataReport(dataset);
    const filename = `${dataset.fileName.split('.')[0]}_report.docx`;
    saveAs(blob, filename);
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}