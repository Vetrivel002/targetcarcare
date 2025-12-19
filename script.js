// 1. DATABASE CONFIGURATION (Update these with your details)
const SUPABASE_URL = 'https://qinjkbgudcuwqsirnivi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbmprYmd1ZGN1d3FzaXJuaXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDMzMzIsImV4cCI6MjA4MTcxOTMzMn0.08bEX7mIvrKPSpKSV9n42fLjGPwU0dpIOMyAm158XNM';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. PRODUCT TABLE LOGIC
function calcRow(el) {
    let row = el.closest('tr');
    let rate = parseFloat(row.querySelector('.p-rate').value) || 0;
    let qty = parseFloat(row.querySelector('.p-qty').value) || 0;
    row.querySelector('.p-total').innerText = (rate * qty).toFixed(2);
    calculateFinal();
}

function addRow() {
    let tbody = document.getElementById('productBody');
    let row = `<tr>
        <td><input type="text" class="p-name"></td>
        <td><input type="number" class="p-rate" value="0" oninput="calcRow(this)"></td>
        <td><input type="number" class="p-qty" value="1" oninput="calcRow(this)"></td>
        <td class="p-total">0.00</td>
        <td><button onclick="this.closest('tr').remove(); calculateFinal();" style="color:red">X</button></td>
    </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
}

function togglePayDetails() {
    let mode = document.getElementById('payMode').value;
    document.getElementById('refGroup').style.display = (mode === 'Cash') ? 'none' : 'block';
}

// 3. INVOICE GENERATION
async function generateInvoice() {
    // Collect Data
    const invNo = "TCC-" + Date.now().toString().slice(-6);
    const date = new Date().toLocaleDateString();
    
    // Fill Invoice Template
    document.getElementById('out-compName').innerText = document.getElementById('compName').value;
    document.getElementById('out-compAddr').innerText = document.getElementById('compAddr').value;
    document.getElementById('out-compContact').innerText = "Ph: " + document.getElementById('compMobile').value;
    document.getElementById('out-invNo').innerText = "Invoice #: " + invNo;
    document.getElementById('out-date').innerText = "Date: " + date;
    
    document.getElementById('out-custName').innerText = document.getElementById('custName').value;
    document.getElementById('out-custAddr').innerText = document.getElementById('custAddr').value;
    document.getElementById('out-custContact').innerText = "Mob: " + document.getElementById('custMobile').value;

    let subtotal = 0;
    let itemsHTML = "";
    document.querySelectorAll('#productBody tr').forEach(row => {
        let name = row.querySelector('.p-name').value;
        let rate = parseFloat(row.querySelector('.p-rate').value);
        let qty = parseFloat(row.querySelector('.p-qty').value);
        if(name) {
            subtotal += (rate * qty);
            itemsHTML += `<tr><td>${name}</td><td>${rate}</td><td>${qty}</td><td>${(rate*qty).toFixed(2)}</td></tr>`;
        }
    });

    let tax = (subtotal * document.getElementById('taxPerc').value) / 100;
    let disc = (subtotal * document.getElementById('discPerc').value) / 100;
    let grand = subtotal + tax - disc + parseFloat(document.getElementById('extraCharges').value);

    document.getElementById('out-items').innerHTML = itemsHTML;
    document.getElementById('out-sub').innerText = subtotal.toFixed(2);
    document.getElementById('out-tax').innerText = tax.toFixed(2);
    document.getElementById('out-disc').innerText = disc.toFixed(2);
    document.getElementById('out-grand').innerText = grand.toFixed(2);
    document.getElementById('out-payMode').innerText = document.getElementById('payMode').value;
    document.getElementById('out-payRef').innerText = document.getElementById('payRef').value;

    // Show Invoice
    document.getElementById('invoice-template').style.display = 'block';
    document.getElementById('downloadBtn').style.display = 'inline-block';

    // 4. SAVE TO SUPABASE
    const { error } = await _supabase.from('invoices').insert([{
        invoice_no: invNo,
        customer_name: document.getElementById('custName').value,
        mobile: document.getElementById('custMobile').value,
        total_amount: grand
    }]);

    if (error) alert("Saved locally but failed to upload to Database.");
    else alert("Invoice Generated & Saved to Cloud!");
}

// 5. DOWNLOAD LOGIC
function downloadJPG() {
    const inv = document.getElementById('invoice-template');
    html2canvas(inv).then(canvas => {
        const link = document.createElement('a');
        link.download = `Invoice_${Date.now()}.jpg`;
        link.href = canvas.toDataURL("image/jpeg");
        link.click();
    });
}

// 6. SEARCH LOGIC
async function findInvoice() {
    const term = document.getElementById('searchVal').value;
    const { data, error } = await _supabase
        .from('invoices')
        .select('*')
        .or(`invoice_no.eq.${term},mobile.eq.${term}`);

    if(data && data.length > 0) {
        let list = data.map(i => `<div>${i.invoice_no} | ${i.customer_name} | ₹${i.total_amount}</div>`).join('');
        document.getElementById('searchResult').innerHTML = list;
    } else {
        document.getElementById('searchResult').innerText = "No record found.";
    }
}
