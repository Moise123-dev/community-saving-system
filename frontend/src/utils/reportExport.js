import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const fmt = (n) => new Intl.NumberFormat().format(n || 0);
const now = () => new Date().toLocaleString();
const dateStamp = () => new Date().toISOString().slice(0, 10);

/* ─────────────────────────────────────────
   SHARED: PDF header
───────────────────────────────────────── */
function addPdfHeader(doc, title, subtitle = '') {
  // Blue header bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CommSave — Community Saving System', 14, 11);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 20);

  // Reset text color
  doc.setTextColor(30, 41, 59);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 34);
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${now()}`, 210 - 14, 34, { align: 'right' });

  return subtitle ? 40 : 36;
}

/* ─────────────────────────────────────────
   FINANCIAL REPORT
───────────────────────────────────────── */
export function exportFinancialPDF(financial) {
  const doc = new jsPDF();
  let y = addPdfHeader(doc, 'Financial Report');

  // Summary boxes
  const deposits = financial.savingsSummary?.find(s => s._id === 'deposit')?.total || 0;
  const withdrawals = financial.savingsSummary?.find(s => s._id === 'withdrawal')?.total || 0;

  const summaryData = [
    ['Total Deposits', `TZS ${fmt(deposits)}`],
    ['Total Withdrawals', `TZS ${fmt(withdrawals)}`],
    ['Net Savings', `TZS ${fmt(deposits - withdrawals)}`],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Amount']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Savings breakdown
  if (financial.savingsSummary?.length) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Savings Breakdown', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Type', 'Total Amount', 'Transactions']],
      body: financial.savingsSummary.map(s => [
        s._id.charAt(0).toUpperCase() + s._id.slice(1),
        `TZS ${fmt(s.total)}`,
        s.count,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Loans breakdown
  if (financial.loansSummary?.length) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Loans Breakdown', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Status', 'Total Amount', 'Count']],
      body: financial.loansSummary.map(s => [
        s._id.charAt(0).toUpperCase() + s._id.slice(1),
        `TZS ${fmt(s.total)}`,
        s.count,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      margin: { left: 14, right: 14 },
    });
  }

  doc.save(`financial-report-${dateStamp()}.pdf`);
}

export function exportFinancialExcel(financial) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const deposits = financial.savingsSummary?.find(s => s._id === 'deposit')?.total || 0;
  const withdrawals = financial.savingsSummary?.find(s => s._id === 'withdrawal')?.total || 0;

  const summaryRows = [
    ['CommSave — Financial Report'],
    [`Generated: ${now()}`],
    [],
    ['Metric', 'Amount'],
    ['Total Deposits', deposits],
    ['Total Withdrawals', withdrawals],
    ['Net Savings', deposits - withdrawals],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws1['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  // Savings sheet
  if (financial.savingsSummary?.length) {
    const rows = [
      ['Type', 'Total Amount (TZS)', 'Transactions'],
      ...financial.savingsSummary.map(s => [s._id, s.total, s.count]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(rows);
    ws2['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Savings');
  }

  // Monthly trend sheet
  if (financial.monthlyTrend?.length) {
    const rows = [
      ['Month', 'Total Amount (TZS)', 'Transactions'],
      ...financial.monthlyTrend.map(t => [t._id, t.total, t.count]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(rows);
    ws3['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Monthly Trend');
  }

  XLSX.writeFile(wb, `financial-report-${dateStamp()}.xlsx`);
}

/* ─────────────────────────────────────────
   MEMBER REPORT
───────────────────────────────────────── */
export function exportMemberPDF(memberReport) {
  const doc = new jsPDF({ orientation: 'landscape' });
  addPdfHeader(doc, 'Member Financial Report', `Total members: ${memberReport.length}`);

  autoTable(doc, {
    startY: 42,
    head: [['#', 'Name', 'Email', 'Phone', 'Total Savings (TZS)', 'Active Loans', 'Total Loans', 'Unpaid Penalties']],
    body: memberReport.map((r, i) => [
      i + 1,
      r.member.name,
      r.member.email,
      r.member.phone || '—',
      fmt(r.totalSavings),
      r.activeLoans,
      r.totalLoans,
      r.unpaidPenalties,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    didDrawCell: (data) => {
      // Highlight unpaid penalties in red
      if (data.column.index === 7 && data.section === 'body') {
        const val = parseInt(data.cell.text[0]);
        if (val > 0) {
          doc.setTextColor(220, 38, 38);
        }
      }
    },
  });

  doc.save(`member-report-${dateStamp()}.pdf`);
}

export function exportMemberExcel(memberReport) {
  const wb = XLSX.utils.book_new();

  const rows = [
    ['CommSave — Member Financial Report'],
    [`Generated: ${now()}`],
    [],
    ['#', 'Name', 'Email', 'Phone', 'Join Date', 'Total Savings (TZS)', 'Total Loans', 'Active Loans', 'Unpaid Penalties', 'Penalty Amount (TZS)'],
    ...memberReport.map((r, i) => [
      i + 1,
      r.member.name,
      r.member.email,
      r.member.phone || '',
      r.member.joinDate ? new Date(r.member.joinDate).toLocaleDateString() : '',
      r.totalSavings,
      r.totalLoans,
      r.activeLoans,
      r.unpaidPenalties,
      r.totalPenaltyAmount || 0,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 4 }, { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 14 },
    { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Members');
  XLSX.writeFile(wb, `member-report-${dateStamp()}.xlsx`);
}

/* ─────────────────────────────────────────
   LOAN REPORT
───────────────────────────────────────── */
export function exportLoanPDF(loanReport) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const y = addPdfHeader(doc, 'Loan Report', `Total loans: ${loanReport.loans?.length || 0}`);

  // Summary
  const { summary } = loanReport;
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Loans', summary.total],
      ['Pending', summary.pending],
      ['Active', summary.active],
      ['Completed', summary.completed],
      ['Rejected', summary.rejected],
      ['Total Disbursed', `TZS ${fmt(summary.totalDisbursed)}`],
      ['Total Repaid', `TZS ${fmt(summary.totalRepaid)}`],
      ['Outstanding Balance', `TZS ${fmt(summary.totalOutstanding)}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    margin: { left: 14, right: 14 },
    tableWidth: 100,
  });

  const afterSummary = doc.lastAutoTable.finalY + 8;

  // Loan details
  autoTable(doc, {
    startY: afterSummary,
    head: [['#', 'Member', 'Amount (TZS)', 'Interest', 'Total Due', 'Repaid', 'Balance', 'Status', 'Purpose', 'Due Date']],
    body: loanReport.loans?.map((l, i) => [
      i + 1,
      l.member?.name || '—',
      fmt(l.amount),
      `${l.interestRate}%`,
      fmt(l.totalDue),
      fmt(l.amountRepaid),
      fmt(l.balance),
      l.status,
      l.purpose || '—',
      l.dueDate ? new Date(l.dueDate).toLocaleDateString() : '—',
    ]) || [],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`loan-report-${dateStamp()}.pdf`);
}

export function exportLoanExcel(loanReport) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const { summary } = loanReport;
  const summaryRows = [
    ['CommSave — Loan Report'],
    [`Generated: ${now()}`],
    [],
    ['Metric', 'Value'],
    ['Total Loans', summary.total],
    ['Pending', summary.pending],
    ['Active', summary.active],
    ['Completed', summary.completed],
    ['Rejected', summary.rejected],
    ['Total Disbursed (TZS)', summary.totalDisbursed],
    ['Total Repaid (TZS)', summary.totalRepaid],
    ['Outstanding Balance (TZS)', summary.totalOutstanding],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws1['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  // Loans detail sheet
  const detailRows = [
    ['#', 'Member', 'Phone', 'Amount (TZS)', 'Interest Rate', 'Total Due (TZS)', 'Amount Repaid (TZS)', 'Balance (TZS)', 'Status', 'Purpose', 'Request Date', 'Due Date', 'Approved By'],
    ...(loanReport.loans || []).map((l, i) => [
      i + 1,
      l.member?.name || '—',
      l.member?.phone || '—',
      l.amount,
      `${l.interestRate}%`,
      l.totalDue,
      l.amountRepaid,
      l.balance,
      l.status,
      l.purpose || '—',
      l.requestDate ? new Date(l.requestDate).toLocaleDateString() : '—',
      l.dueDate ? new Date(l.dueDate).toLocaleDateString() : '—',
      l.approvedBy?.name || '—',
    ]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
  ws2['!cols'] = [
    { wch: 4 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 12 },
    { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 20 },
    { wch: 14 }, { wch: 14 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Loans');
  XLSX.writeFile(wb, `loan-report-${dateStamp()}.xlsx`);
}

/* ─────────────────────────────────────────
   PRINT — opens browser print dialog
   with a clean printable version
───────────────────────────────────────── */
export function printReport(title, contentId) {
  const content = document.getElementById(contentId);
  if (!content) return;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} — CommSave</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 20px; }
        .print-header { background: #2563eb; color: white; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px; }
        .print-header h1 { font-size: 18px; margin-bottom: 4px; }
        .print-header p { font-size: 11px; opacity: .85; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #2563eb; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
        td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        tr:nth-child(even) td { background: #f8fafc; }
        .stat-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .stat-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; min-width: 160px; }
        .stat-box p { font-size: 10px; color: #64748b; margin-bottom: 4px; }
        .stat-box strong { font-size: 16px; }
        h2 { font-size: 14px; margin: 16px 0 8px; color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 4px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
        .badge-active { background: #f0fdf4; color: #15803d; }
        .badge-inactive { background: #fef2f2; color: #dc2626; }
        .badge-pending { background: #fff7ed; color: #c2410c; }
        @media print {
          body { padding: 10px; }
          button { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>CommSave — Community Saving System</h1>
        <p>${title} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</p>
      </div>
      ${content.innerHTML}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
