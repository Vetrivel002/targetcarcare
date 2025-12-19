// Replace with your keys
const _supabase = supabase.createClient('https://qinjkbgudcuwqsirnivi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbmprYmd1ZGN1d3FzaXJuaXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDMzMzIsImV4cCI6MjA4MTcxOTMzMn0.08bEX7mIvrKPSpKSV9n42fLjGPwU0dpIOMyAm158XNM');

function calculateFinal() {
    let subtotal = 0;
    document.querySelectorAll('#productBody tr').forEach(row => {
        const rate = parseFloat(row.querySelector('.p-rate').value) || 0;
        const qty = parseFloat(row.querySelector('.p-qty').value) || 0;
        const total = rate * qty;
        row.querySelector('.p-total').innerText = total.toFixed(2);
        subtotal += total;
    });

    const taxP = parseFloat(document.getElementById('taxPerc').value) || 0;
    const discP = parseFloat(document.getElementById('discPerc').value) || 0;
    
    const taxAmt = (subtotal * taxP) / 100;
    const discAmt = (subtotal * discP) / 100;
    const grand = subtotal + taxAmt - discAmt;

    document.getElementById('liveGrandTotal').innerText = `₹ ${grand.toLocaleString('en-IN')}`;
    return { subtotal, taxAmt, discAmt, grand };
}

function addRow() {
    const tbody = document.getElementById('productBody');
    const row = `<tr>
        <td><input type="text" class="p-name"></td>
        <td><input type="number" class="p-rate" value="0" oninput="calculateFinal()"></td>
        <td><input type="number" class="p-qty" value="1" oninput="calculateFinal()"></td>
        <td class="p-total" style="text-align:right; font-weight:bold;">0.00</td>
    </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
}

function togglePayDetails() {
    const mode = document.getElementById('payMode').value;
    document.getElementById('refGroup').style.display = (mode === 'Cash') ? 'none' : 'block';
}

async function generateInvoice() {
    const stats = calculateFinal();
    const invNo = "TCC/25/" + Math.floor(1000 + Math.random() * 9000);
    const date = new Date().toLocaleDateString('en-GB');

    // Header Mapping
    document.getElementById('out-compName').innerText = document.getElementById('compName').value;
    document.getElementById('out-compAddr').innerText = document.getElementById('compAddr').value;
    document.getElementById('out-compContact').innerText = "Ph: " + document.getElementById('compMobile').value;
    document.getElementById('out-invNo').innerText = "No: " + invNo;
    document.getElementById('out-date').innerText = "Date: " + date;

    // Customer Mapping
    document.getElementById('out-custName').innerText = document.getElementById('custName').value;
    document.getElementById('out-custVehicle').innerHTML = `<strong>Vehicle:</strong> ${document.getElementById('vName').value} | <strong>Reg:</strong> ${document.getElementById('vNo').value}`;
    document.getElementById('out-custAddr').innerText = document.getElementById('custAddr').value;
    document.getElementById('out-custContact').innerText = "Contact: " + document.getElementById('custMobile').value;
    document.getElementById('out-custGST').innerText = document.getElementById('custGST').value ? "GSTIN: " + document.getElementById('custGST').value : "";

    // Payment Mapping
    document.getElementById('out-payMode').innerText = document.getElementById('payMode').value;
    document.getElementById('out-payRef').innerText = document.getElementById('payRef').value ? "Ref: " + document.getElementById('payRef').value : "";

    // Items Mapping (Pixel Perfect S.No logic)
    let itemsHTML = "";
    document.querySelectorAll('#productBody tr').forEach((row, index) => {
        const name = row.querySelector('.p-name').value;
        const rate = row.querySelector('.p-rate').value;
        const qty = row.querySelector('.p-qty').value;
        const total = row.querySelector('.p-total').innerText;
        if(name) {
            itemsHTML += `<tr>
                <td align="center">${index + 1}</td>
                <td>${name}</td>
                <td align="right">${rate}</td>
                <td align="center">${qty}</td>
                <td align="right">${total}</td>
            </tr>`;
        }
    });

    // Populate Totals
    document.getElementById('out-items').innerHTML = itemsHTML;
    document.getElementById('out-sub').innerText = stats.subtotal.toFixed(2);
    document.getElementById('out-tax').innerText = stats.taxAmt.toFixed(2);
    document.getElementById('out-disc').innerText = stats.discAmt.toFixed(2);
    document.getElementById('out-grand').innerText = stats.grand.toFixed(2);

    // Show & Scroll
    document.getElementById('invoice-template').style.display = 'block';
    document.getElementById('downloadBtn').style.display = 'block';
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    // DB Sync
    await _supabase.from('invoices').insert([{
        invoice_no: invNo,
        customer_name: document.getElementById('custName').value,
        mobile: document.getElementById('custMobile').value,
        total_amount: stats.grand
    }]);
}

function downloadJPG() {
    const target = document.getElementById('invoice-template');
    html2canvas(target, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `TargetCarCare_${Date.now()}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 0.9);
        link.click();
    });
}
