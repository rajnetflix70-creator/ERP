const ExcelJS = require('c:/Subash/projectAK/backend/node_modules/exceljs');
const fs = require('fs');

async function analyze() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('c:/Subash/projectAK/PROJECT DIV. LIST 04-06-26.xlsx');
  
  console.log('Total Sheets: ' + wb.worksheets.length);
  
  const report = [];
  
  wb.worksheets.forEach(function(ws, idx) {
    const sheetInfo = {
      index: idx + 1,
      name: ws.name,
      rowCount: ws.rowCount,
      columnCount: ws.columnCount,
      headers: [],
      sampleRows: [],
      uniqueValues: {}
    };
    
    // Headers (rows 1-4)
    for (let r = 1; r <= Math.min(4, ws.rowCount); r++) {
      const row = ws.getRow(r);
      const rowVals = [];
      for (let c = 1; c <= ws.columnCount; c++) {
        let v = row.getCell(c).value;
        if (typeof v === 'object' && v !== null) v = v.result || v.text || JSON.stringify(v);
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          rowVals.push('C' + c + ': ' + String(v).trim());
        }
      }
      sheetInfo.headers.push('Row ' + r + ': ' + rowVals.join(' | '));
    }
    
    // Unique values for key columns
    for (let c = 1; c <= ws.columnCount; c++) {
      const set = new Set();
      for (let r = 5; r <= ws.rowCount; r++) {
        let v = ws.getRow(r).getCell(c).value;
        if (typeof v === 'object' && v !== null) v = v.result || v.text || '';
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          set.add(String(v).trim());
        }
      }
      if (set.size > 0 && set.size <= 30) {
        sheetInfo.uniqueValues['Col_' + c] = Array.from(set);
      }
    }
    
    // Sample rows
    for (let r = 5; r <= Math.min(10, ws.rowCount); r++) {
      const row = ws.getRow(r);
      const rowVals = {};
      for (let c = 1; c <= ws.columnCount; c++) {
        let v = row.getCell(c).value;
        if (typeof v === 'object' && v !== null) v = v.result || v.text || '';
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          rowVals['C' + c] = v;
        }
      }
      sheetInfo.sampleRows.push(rowVals);
    }
    
    report.push(sheetInfo);
  });
  
  fs.writeFileSync('c:/Subash/projectAK/scratch/excel_analysis.json', JSON.stringify(report, null, 2), 'utf8');
  console.log('SUCCESS: Analysis written to c:/Subash/projectAK/scratch/excel_analysis.json');
}

analyze().catch(console.error);
