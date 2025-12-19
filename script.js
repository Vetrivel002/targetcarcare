// Initialize Supabase (Use your keys here)
const _supabase = supabase.createClient('https://qinjkbgudcuwqsirnivi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbmprYmd1ZGN1d3FzaXJuaXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDMzMzIsImV4cCI6MjA4MTcxOTMzMn0.08bEX7mIvrKPSpKSV9n42fLjGPwU0dpIOMyAm158XNM');

function calculateFinal() {
    let subtotal = 0;
    
    // Calculate each row and sum subtotal
    document.querySelectorAll('#productBody tr').forEach(row => {
        const rate = parseFloat(row.querySelector('.p-rate').value) || 0;
        const qty = parseFloat(row.querySelector('.p-qty').value) || 0;
        const total = rate * qty;
        row.querySelector('.p-total').innerText = total.toFixed(2);
        subtotal += total;
    });

    // Handle Tax & Discount
    const taxPerc = parseFloat(document.getElementById('taxPerc').value) || 0;
    const discPerc = parseFloat(document.getElementById('discPerc').value) || 0;
    
    const taxAmt = (subtotal * taxPerc) / 100;
    const discAmt = (subtotal * discPerc) / 100;
    const grandTotal = subtotal + taxAmt - discAmt;

    // Update Live UI
    document.getElementById('liveGrandTotal').innerText = `₹ ${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    
    return { subtotal, taxAmt, discAmt, grandTotal };
}

function addRow() {
    const tbody = document.getElementById('productBody');
    const newRow = `<tr>
        <td><input type="text" class="p-name"></td>
        <td><input type="number" class="p-rate" value="0" oninput="calculateFinal()"></td>
        <td><input type="number" class="p-qty" value="1" oninput="calculateFinal()"></td>
        <td class="p-total">0.00</td>
    </tr>`;
    tbody.insertAdjacentHTML('beforeend', newRow);
}

function togglePayDetails() {
    const mode = document.getElementById('payMode').value;
    document.getElementById('refGroup').style.display = (mode === 'Cash') ? 'none' : 'block';
}

async function generateInvoice() {
    const totals = calculateFinal();
    const invNo = "TCC-" + Math.floor(100000 + Math.random() * 900000);
    const date = new Date().toLocaleDateString('en-GB');

    // Populate Invoice Preview
    document.getElementById('out-compName').innerText = document.getElementById('compName').value;
    document.getElementById('out-compAddr').innerText = document.getElementById('compAddr').value;
    document.getElementById('out-compContact').innerText = "Phone: " + document.getElementById('compMobile').value;
    document.getElementById('out-invNo').innerText = "Invoice: " + invNo;
    document.getElementById('out-date').innerText = "Date: " + date;
    
    document.getElementById('out-custName').innerText = document.getElementById('custName').value;
    document.getElementById('out-custContact').innerText = "Mob: " + document.getElementById('custMobile').value;
    document.getElementById('out-custAddr').innerText = "Vehicle/Tax ID: " + document.getElementById('custTax').value;

    let itemsHTML = "";
    document.querySelectorAll('#productBody tr').forEach(row => {
        const name = row.querySelector('.p-name').value;
        const rate = row.querySelector('.p-rate').value;
        const qty = row.querySelector('.p-qty').value;
        const total = row.querySelector('.p-total').innerText;
        if(name) itemsHTML += `<tr><td>${name}</td><td align="right">${rate}</td><td align="center">${qty}</td><td align="right">${total}</td></tr>`;
    });

    document.getElementById('out-items').innerHTML = itemsHTML;
    document.getElementById('out-sub').innerText = "₹ " + totals.subtotal.toFixed(2);
    document.getElementById('out-tax').innerText = "+ ₹ " + totals.taxAmt.toFixed(2);
    document.getElementById('out-grand').innerText = "₹ " + totals.grandTotal.toFixed(2);
    document.getElementById('out-payMode').innerText = document.getElementById('payMode').value;
    document.getElementById('out-payRef').innerText = document.getElementById('payRef').value;

    // UI Updates
    document.getElementById('invoice-template').style.display = 'block';
    document.getElementById('downloadBtn').style.display = 'block';
    window.scrollTo(0, document.body.scrollHeight);

    // Save to Database
    const { error } = await _supabase.from('invoices').insert([{
        invoice_no: invNo,
        customer_name: document.getElementById('custName').value,
        mobile: document.getElementById('custMobile').value,
        total_amount: totals.grandTotal
    }]);
    if(!error) alert("Invoice Data synced to cloud.");
}

function downloadJPG() {
    const inv = document.getElementById('invoice-template');
    html2canvas(inv, { scale: 3 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Invoice_TargetCarCare_${Date.now()}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 1.0);
        link.click();
    });
}
