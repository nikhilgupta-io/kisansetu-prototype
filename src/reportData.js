/**
 * KisanSetu — Verified Sample Procurement Register & Bank DBT Batch Data
 * Sponsoring Ministry: Ministry of Consumer Affairs, Food & Public Distribution
 * Mandi: Sehore APMC Procurement Centre · Date: 12-09-2026
 */

export const DAILY_PROCUREMENT_REGISTER = [
  {
    token: "A-123",
    farmer_id: "FR-98218",
    name: "Prakash Sharma",
    phone: "+91 98765 43210",
    crop: "Wheat",
    moisture: 11.2,
    net_weight: 30.0,
    rate: 2275,
    total_value: 68250,
    grade: "A",
    j_form: "JF-2026-SEH-0123",
    status: "Completed & Paid",
    time: "08:15 AM",
  },
  {
    token: "A-124",
    farmer_id: "FR-98214",
    name: "Suresh Kumar",
    phone: "+91 98765 43211",
    crop: "Wheat",
    moisture: 11.8,
    net_weight: 45.0,
    rate: 2275,
    total_value: 102375,
    grade: "A",
    j_form: "JF-2026-SEH-0124",
    status: "Completed & Paid",
    time: "09:05 AM",
  },
  {
    token: "A-125",
    farmer_id: "FR-98215",
    name: "Mohan Singh",
    phone: "+91 98765 43212",
    crop: "Paddy",
    moisture: 15.4,
    net_weight: 55.0,
    rate: 2300,
    total_value: 126500,
    grade: "B",
    j_form: "JF-2026-SEH-0125",
    status: "Completed & Paid",
    time: "09:40 AM",
  },
  {
    token: "A-126",
    farmer_id: "FR-98216",
    name: "Ravi Patel",
    phone: "+91 98765 43213",
    crop: "Wheat",
    moisture: 10.9,
    net_weight: 38.0,
    rate: 2275,
    total_value: 86450,
    grade: "A",
    j_form: "JF-2026-SEH-0126",
    status: "Completed & Paid",
    time: "10:15 AM",
  },
  {
    token: "A-127",
    farmer_id: "FR-98213",
    name: "Ram Lal",
    phone: "+91 98765 43214",
    crop: "Wheat",
    moisture: 11.0,
    net_weight: 42.5,
    rate: 2275,
    total_value: 96687.5,
    grade: "A",
    j_form: "JF-2026-SEH-0127",
    status: "Processing at Desk",
    time: "10:30 AM",
  },
  {
    token: "A-128",
    farmer_id: "FR-98217",
    name: "Dinesh Yadav",
    phone: "+91 98765 43215",
    crop: "Soybean",
    moisture: 12.0,
    net_weight: 25.0,
    rate: 4892,
    total_value: 122300,
    grade: "A",
    j_form: "JF-2026-SEH-0128",
    status: "Waiting in Queue",
    time: "11:00 AM",
  },
  {
    token: "A-129",
    farmer_id: "FR-98221",
    name: "Kamlesh Sharma",
    phone: "+91 98765 43216",
    crop: "Mustard",
    moisture: 7.5,
    net_weight: 20.0,
    rate: 5650,
    total_value: 113000,
    grade: "A",
    j_form: "JF-2026-SEH-0129",
    status: "Waiting in Queue",
    time: "11:30 AM",
  },
  {
    token: "A-130",
    farmer_id: "FR-98225",
    name: "Savita Bai",
    phone: "+91 98765 43217",
    crop: "Soybean",
    moisture: 11.5,
    net_weight: 35.0,
    rate: 4892,
    total_value: 171220,
    grade: "A",
    j_form: "JF-2026-SEH-0130",
    status: "Waiting in Queue",
    time: "12:00 PM",
  },
];

export const DBT_PAYMENT_BATCH = [
  {
    sl_no: 1,
    name: "Prakash Sharma",
    farmer_id: "FR-98218",
    aadhaar_ref: "XXXX-XXXX-4812",
    bank: "State Bank of India",
    ifsc: "SBIN0001234",
    account_no: "•••• •••• 5591",
    amount: 68250.0,
    j_form: "JF-2026-SEH-0123",
    pfms_status: "SUCCESS · DBT Credited",
    utr: "SBIN26255019821",
  },
  {
    sl_no: 2,
    name: "Suresh Kumar",
    farmer_id: "FR-98214",
    aadhaar_ref: "XXXX-XXXX-9912",
    bank: "Punjab National Bank",
    ifsc: "PUNB0192300",
    account_no: "•••• •••• 3410",
    amount: 102375.0,
    j_form: "JF-2026-SEH-0124",
    pfms_status: "SUCCESS · DBT Credited",
    utr: "PUNB26255029314",
  },
  {
    sl_no: 3,
    name: "Mohan Singh",
    farmer_id: "FR-98215",
    aadhaar_ref: "XXXX-XXXX-7140",
    bank: "Bank of Baroda",
    ifsc: "BARB0SEHORE",
    account_no: "•••• •••• 8821",
    amount: 126500.0,
    j_form: "JF-2026-SEH-0125",
    pfms_status: "SUCCESS · DBT Credited",
    utr: "BARB26255038102",
  },
  {
    sl_no: 4,
    name: "Ravi Patel",
    farmer_id: "FR-98216",
    aadhaar_ref: "XXXX-XXXX-1932",
    bank: "Madhya Pradesh Gramin Bank",
    ifsc: "CBIN0MPGB01",
    account_no: "•••• •••• 1092",
    amount: 86450.0,
    j_form: "JF-2026-SEH-0126",
    pfms_status: "SUCCESS · DBT Credited",
    utr: "MPGB26255041920",
  },
  {
    sl_no: 5,
    name: "Ram Lal",
    farmer_id: "FR-98213",
    aadhaar_ref: "XXXX-XXXX-3829",
    bank: "State Bank of India",
    ifsc: "SBIN0001234",
    account_no: "•••• •••• 7712",
    amount: 96687.5,
    j_form: "JF-2026-SEH-0127",
    pfms_status: "READY_FOR_DISBURSEMENT · Approved",
    utr: "PENDING_BATCH_02",
  },
];

export function exportProcurementRegisterCSV() {
  const headers = [
    "Token",
    "Farmer ID",
    "Farmer Name",
    "Mobile Number",
    "Crop",
    "Moisture (%)",
    "Net Weight (Quintals)",
    "MSP Rate (INR/Qtl)",
    "Total Payout (INR)",
    "Quality Grade",
    "J-Form Number",
    "Procurement Status",
    "Timestamp",
  ];

  const rows = DAILY_PROCUREMENT_REGISTER.map((r) => [
    r.token,
    r.farmer_id,
    `"${r.name}"`,
    `"${r.phone}"`,
    r.crop,
    r.moisture,
    r.net_weight,
    r.rate,
    r.total_value,
    r.grade,
    r.j_form,
    `"${r.status}"`,
    `"${r.time}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  downloadCSVFile("KisanSetu_Daily_Procurement_Register_2026-09-12.csv", csvContent);
}

export function exportDBTPaymentBatchCSV() {
  const headers = [
    "Batch Sl No",
    "Beneficiary Name",
    "Farmer Reg ID",
    "Aadhaar Reference",
    "Bank Name",
    "IFSC Code",
    "Masked Account No",
    "Net Amount (INR)",
    "J-Form Reference",
    "PFMS Validation Status",
    "Treasury UTR Ref",
  ];

  const rows = DBT_PAYMENT_BATCH.map((r) => [
    r.sl_no,
    `"${r.name}"`,
    r.farmer_id,
    `"${r.aadhaar_ref}"`,
    `"${r.bank}"`,
    r.ifsc,
    `"${r.account_no}"`,
    r.amount,
    r.j_form,
    `"${r.pfms_status}"`,
    r.utr,
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  downloadCSVFile("KisanSetu_DBT_Payment_Batch_PFMS_2026-09-12.csv", csvContent);
}

function downloadCSVFile(filename, content) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
