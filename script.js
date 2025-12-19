const _supabase = supabase.createClient('https://qinjkbgudcuwqsirnivi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbmprYmd1ZGN1d3FzaXJuaXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDMzMzIsImV4cCI6MjA4MTcxOTMzMn0.08bEX7mIvrKPSpKSV9n42fLjGPwU0dpIOMyAm158XNM');

function calculateFinal() {
    let subtotal = 0;
    document.querySelectorAll('#productBody tr').forEach(row => {
        const rate = parseFloat(row.querySelector('.p-rate').value) || 0;
        const qty = parseFloat(row.querySelector('.p-qty').value) || 0;
        const total = rate * qty;
        row.querySelector('.p-total-cell').innerText = total.toFixed(2);
        subtotal += total;
    });

    const taxP = parseFloat(document.getElementById('taxPerc').value) || 0;
    const discP = parseFloat(document.getElementById('discPerc').value) || 0;
    const discF = parseFloat(document.getElementById('discFixed').value) || 0;
    
    const taxAmt = (subtotal * taxP) / 100;
    const discAmt = ((subtotal * discP) / 100) + discF;
    const rawTotal = subtotal + taxAmt - discAmt;

    // --- ROUNDING LOGIC (0.50 PAISA LIMIT) ---
    const finalTotal = Math.round(rawTotal);

    document.getElementById('liveGrand').innerText = `₹ ${finalTotal}`;
    return { subtotal, taxAmt, discAmt, finalTotal };
}

function addRow() {
    const tbody = document.getElementById('productBody');
    tbody.insertAdjacentHTML('beforeend', `<tr>
        <td><input type="text" class="p-name"></td>
        <td><input type="number" class="p-rate" value="0" oninput="calculateFinal()"></td>
        <td><input type="number" class="p-qty" value="1" oninput="calculateFinal()"></td>
        <td class="p-total-cell">0.00</td>
    </tr>`);
}

async function generateInvoice() {
    const stats = calculateFinal();
    const invNo = "TCC-" + Date.now().toString().slice(-5);
    const date = new Date().toLocaleDateString('en-GB');

    // Fill Invoice
    document.getElementById('out-compName').innerText = document.getElementById('compName').value;
    document.getElementById('out-compAddr').innerText = document.getElementById('compAddr').value;
    document.getElementById('out-compContact').innerText = "Ph: " + document.getElementById('compMobile').value;
    document.getElementById('out-invNo').innerText = invNo;
    document.getElementById('out-date').innerText = date;

    document.getElementById('out-custName').innerText = document.getElementById('custName').value;
    document.getElementById('out-vInfo').innerText = `Vehicle: ${document.getElementById('vName').value} (${document.getElementById('vNo').value})`;
    document.getElementById('out-custContact').innerText = "Mob: " + document.getElementById('custMobile').value;
    document.getElementById('out-custGST').innerText = document.getElementById('custGST').value ? "GST: " + document.getElementById('custGST').value : "";
    document.getElementById('out-payMode').innerText = document.getElementById('payMode').value;

    let itemsHTML = "";
    document.querySelectorAll('#productBody tr').forEach((row, i) => {
        const name = row.querySelector('.p-name').value;
        if(name) {
            itemsHTML += `<tr><td align="center">${i+1}</td><td>${name}</td><td align="right">${row.querySelector('.p-rate').value}</td><td align="center">${row.querySelector('.p-qty').value}</td><td align="right">${row.querySelector('.p-total-cell').innerText}</td></tr>`;
        }
    });

    document.getElementById('out-items').innerHTML = itemsHTML;
    document.getElementById('out-sub').innerText = "₹" + stats.subtotal.toFixed(2);
    document.getElementById('out-tax').innerText = "₹" + stats.taxAmt.toFixed(2);
    document.getElementById('out-disc').innerText = "₹" + stats.discAmt.toFixed(2);
    document.getElementById('out-grand').innerText = "₹" + stats.finalTotal;

    // Show, Save & Download
    document.getElementById('invoice-sheet').style.display = 'block';
    
    // Auto-Save to Database
    await _supabase.from('invoices').insert([{
        invoice_no: invNo,
        customer_name: document.getElementById('custName').value,
        mobile: document.getElementById('custMobile').value,
        total_amount: stats.finalTotal
    }]);

    // Download JPG
    setTimeout(() => {
        html2canvas(document.getElementById('invoice-sheet'), { scale: 3 }).then(canvas => {
            const link = document.createElement('a');
            link.download = `Invoice_${invNo}.jpg`;
            link.href = canvas.toDataURL("image/jpeg", 1.0);
            link.click();
        });
    }, 500);
}

async function searchInvoice() {
    const q = document.getElementById('searchQuery').value;
    const { data } = await _supabase.from('invoices').select('*').or(`invoice_no.eq.${q},mobile.eq.${q}`);
    const resDiv = document.getElementById('search-results');
    resDiv.innerHTML = data && data.length ? data.map(i => `<div>${i.invoice_no} | ${i.customer_name} | ₹${i.total_amount}</div>`).join('') : "No record found.";
}
