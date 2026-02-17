// ===== Portfolio Tracker App =====
// Uses localStorage for persistence and local Python server for Yahoo Finance price fetching.

(() => {
    'use strict';

    // ===== Constants =====
    const STORAGE_KEY = 'portfolio_data';
    const API_BASE = '/api';

    // ===== DOM References =====
    const $ = (sel) => document.querySelector(sel);
    const portfolioBody = $('#portfolioBody');
    const emptyState = $('#emptyState');
    const searchInput = $('#searchInput');
    const addBtn = $('#addBtn');
    const refreshAllBtn = $('#refreshAllBtn');
    const toastContainer = $('#toastContainer');

    // Form inputs
    const inputSymbol = $('#inputSymbol');
    const inputLot = $('#inputLot');
    const inputCost = $('#inputCost');
    const inputNote = $('#inputNote');

    // Summary elements
    const elTotalCost = $('#totalCost');
    const elTotalValue = $('#totalValue');
    const elTotalPL = $('#totalPL');
    const elTotalPLPercent = $('#totalPLPercent');

    // ===== Data =====
    let portfolio = loadData();

    // ===== Init =====
    renderAll();
    // Fetch prices on load
    setTimeout(() => refreshAllPrices(), 500);

    // ===== Event Listeners =====
    addBtn.addEventListener('click', addStock);

    // Enter key on form inputs
    [inputSymbol, inputLot, inputCost, inputNote].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addStock();
        });
    });

    searchInput.addEventListener('input', () => {
        renderTable();
    });

    refreshAllBtn.addEventListener('click', () => {
        refreshAllBtn.classList.add('spinning');
        refreshAllPrices().finally(() => {
            setTimeout(() => refreshAllBtn.classList.remove('spinning'), 400);
        });
    });

    // ===== Functions =====

    function loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    }

    function addStock() {
        const symbol = inputSymbol.value.trim().toUpperCase();
        const lot = parseFloat(inputLot.value);
        const cost = parseFloat(inputCost.value);
        const note = inputNote.value.trim();

        if (!symbol) {
            showToast('Sembol giriniz', 'error');
            inputSymbol.focus();
            return;
        }
        if (isNaN(lot) || lot <= 0) {
            showToast('Geçerli bir lot sayısı giriniz', 'error');
            inputLot.focus();
            return;
        }
        if (isNaN(cost) || cost <= 0) {
            showToast('Geçerli bir maliyet giriniz', 'error');
            inputCost.focus();
            return;
        }

        const item = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            symbol,
            lot,
            cost,
            currentPrice: null,
            note,
            addedAt: new Date().toISOString(),
        };

        portfolio.push(item);
        saveData();
        renderAll();

        // Clear form
        inputSymbol.value = '';
        inputLot.value = '';
        inputCost.value = '';
        inputNote.value = '';
        inputSymbol.focus();

        showToast(`${symbol} portföye eklendi`, 'success');

        // Fetch price for the new item
        fetchPrice(item.id);
    }

    function deleteStock(id) {
        const idx = portfolio.findIndex(s => s.id === id);
        if (idx === -1) return;

        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.style.animation = 'rowOut 0.3s ease-in forwards';
            row.addEventListener('animationend', () => {
                portfolio.splice(idx, 1);
                saveData();
                renderAll();
            });
        } else {
            portfolio.splice(idx, 1);
            saveData();
            renderAll();
        }

        showToast(`${portfolio[idx]?.symbol || 'Hisse'} silindi`, 'info');
    }

    function updateField(id, field, value) {
        const item = portfolio.find(s => s.id === id);
        if (!item) return;

        if (field === 'lot' || field === 'cost' || field === 'currentPrice') {
            const num = parseFloat(value.replace(',', '.'));
            if (isNaN(num) || num < 0) return;
            item[field] = num;
        } else if (field === 'symbol') {
            item[field] = value.trim().toUpperCase();
        } else {
            item[field] = value.trim();
        }

        saveData();
        updateSummary();
        // Re-render just the PL cells for that row
        updateRowPL(id);
    }

    // ===== Rendering =====

    function renderAll() {
        renderTable();
        updateSummary();
    }

    function renderTable() {
        const filter = searchInput.value.trim().toUpperCase();

        const filtered = filter
            ? portfolio.filter(s => s.symbol.includes(filter) || (s.note && s.note.toUpperCase().includes(filter)))
            : portfolio;

        portfolioBody.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.classList.add('visible');
            document.querySelector('table thead').style.display = portfolio.length === 0 ? 'none' : '';
        } else {
            emptyState.classList.remove('visible');
            document.querySelector('table thead').style.display = '';
        }

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            tr.dataset.id = item.id;

            const plData = calcPL(item);

            tr.innerHTML = `
                <td class="symbol-cell">${esc(item.symbol)}</td>
                <td contenteditable="true" data-field="lot" class="editable-cell">${item.lot}</td>
                <td contenteditable="true" data-field="cost" class="editable-cell">${formatMoney(item.cost)}</td>
                <td contenteditable="true" data-field="currentPrice" class="editable-cell price-cell">
                    ${item.currentPrice !== null ? formatMoney(item.currentPrice) : '<span class="price-loading"></span>'}
                </td>
                <td class="pl-cell">
                    ${plData ? `<span class="pl-badge ${plData.cls}">${plData.arrow} %${plData.percent}</span>` : '—'}
                </td>
                <td class="total-value-cell ${plData ? (plData.cls === 'positive' ? 'pl-positive' : 'pl-negative') : ''}">
                    ${plData ? formatMoney(plData.totalValue) : '—'}
                </td>
                <td contenteditable="true" data-field="note" class="note-cell editable-cell" title="${esc(item.note || '')}">${esc(item.note || '')}</td>
                <td>
                    <div class="row-actions">
                        <button class="row-action-btn refresh" title="Fiyat güncelle" data-action="refresh">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                <path d="M3 3v5h5"/>
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                                <path d="M16 16h5v5"/>
                            </svg>
                        </button>
                        <button class="row-action-btn delete" title="Sil" data-action="delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            </svg>
                        </button>
                    </div>
                </td>
            `;

            // Inline edit handlers
            tr.querySelectorAll('[contenteditable="true"]').forEach(cell => {
                cell.addEventListener('blur', () => {
                    const field = cell.dataset.field;
                    let val = cell.textContent;
                    // Remove ₺ and formatting for numeric fields
                    if (field === 'cost' || field === 'currentPrice') {
                        val = val.replace(/[₺\s.]/g, '').replace(',', '.');
                    }
                    if (field === 'lot') {
                        val = val.replace(/[^\d]/g, '');
                    }
                    updateField(item.id, field, val);
                    // Reformat displayed value
                    if (field === 'cost' || field === 'currentPrice') {
                        const num = parseFloat(val);
                        if (!isNaN(num)) cell.textContent = formatMoney(num);
                    }
                });
                cell.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        cell.blur();
                    }
                });
            });

            // Action buttons
            tr.querySelector('[data-action="delete"]').addEventListener('click', () => deleteStock(item.id));
            tr.querySelector('[data-action="refresh"]').addEventListener('click', (e) => {
                const btn = e.currentTarget;
                btn.classList.add('spinning');
                fetchPrice(item.id).finally(() => {
                    setTimeout(() => btn.classList.remove('spinning'), 400);
                });
            });

            portfolioBody.appendChild(tr);
        });
    }

    function updateRowPL(id) {
        const item = portfolio.find(s => s.id === id);
        if (!item) return;
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (!row) return;

        const plData = calcPL(item);
        const plCell = row.querySelector('.pl-cell');
        const tvCell = row.querySelector('.total-value-cell');

        if (plData) {
            plCell.innerHTML = `<span class="pl-badge ${plData.cls}">${plData.arrow} %${plData.percent}</span>`;
            tvCell.textContent = formatMoney(plData.totalValue);
            tvCell.className = `total-value-cell ${plData.cls === 'positive' ? 'pl-positive' : 'pl-negative'}`;
        } else {
            plCell.innerHTML = '—';
            tvCell.textContent = '—';
            tvCell.className = 'total-value-cell';
        }
    }

    function updateSummary() {
        let totalCost = 0;
        let totalValue = 0;

        portfolio.forEach(item => {
            totalCost += item.lot * item.cost;
            if (item.currentPrice !== null) {
                totalValue += item.lot * item.currentPrice;
            } else {
                totalValue += item.lot * item.cost; // fallback
            }
        });

        const pl = totalValue - totalCost;
        const plPercent = totalCost > 0 ? (pl / totalCost * 100) : 0;

        elTotalCost.textContent = `₺${formatNum(totalCost)}`;
        elTotalValue.textContent = `₺${formatNum(totalValue)}`;

        elTotalPL.textContent = `${pl >= 0 ? '+' : ''}₺${formatNum(pl)}`;
        elTotalPL.className = `card-value ${pl >= 0 ? 'positive' : 'negative'}`;

        elTotalPLPercent.textContent = `${pl >= 0 ? '+' : ''}%${Math.abs(plPercent).toFixed(2).replace('.', ',')}`;
        elTotalPLPercent.className = `card-value ${pl >= 0 ? 'positive' : 'negative'}`;
    }

    // ===== Price Fetching =====

    async function fetchPrice(id) {
        const item = portfolio.find(s => s.id === id);
        if (!item) return;

        try {
            const response = await fetch(`${API_BASE}/price?symbol=${encodeURIComponent(item.symbol)}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (data.price !== undefined) {
                item.currentPrice = data.price;
                saveData();
                // Update just the price cell
                const row = document.querySelector(`tr[data-id="${id}"]`);
                if (row) {
                    const priceCell = row.querySelector('.price-cell');
                    if (priceCell) priceCell.textContent = formatMoney(item.currentPrice);
                    updateRowPL(id);
                }
                updateSummary();
            }
        } catch {
            // If server is not running, show dash
            const row = document.querySelector(`tr[data-id="${id}"]`);
            if (row) {
                const priceCell = row.querySelector('.price-cell');
                if (priceCell && item.currentPrice === null) {
                    priceCell.textContent = '—';
                }
            }
        }
    }

    async function refreshAllPrices() {
        if (portfolio.length === 0) return;

        try {
            // Use batch endpoint for efficiency
            const symbols = portfolio.map(item => item.symbol);
            const response = await fetch(`${API_BASE}/prices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols }),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const results = await response.json();

            portfolio.forEach(item => {
                const result = results[item.symbol];
                if (result && result.price !== undefined) {
                    item.currentPrice = result.price;
                }
            });

            saveData();
            renderAll();
            showToast('Fiyatlar güncellendi', 'success');
        } catch {
            // Fallback: fetch one by one
            const promises = portfolio.map(item => fetchPrice(item.id));
            await Promise.allSettled(promises);
            showToast('Sunucu çalışıyor mu? py server.py', 'error');
        }
    }

    // ===== Helpers =====

    function calcPL(item) {
        if (item.currentPrice === null || item.currentPrice === undefined) return null;
        const diff = item.currentPrice - item.cost;
        const percent = item.cost > 0 ? (diff / item.cost * 100) : 0;
        const totalValue = item.lot * item.currentPrice;
        const isPositive = diff >= 0;
        return {
            diff,
            percent: Math.abs(percent).toFixed(2).replace('.', ','),
            totalValue,
            cls: isPositive ? 'positive' : 'negative',
            arrow: isPositive ? '▲' : '▼',
        };
    }

    function formatMoney(num) {
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    }

    function formatNum(num) {
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    }

    function esc(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ',
        };

        toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${esc(message)}`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease-in forwards';
            toast.addEventListener('animationend', () => toast.remove());
        }, 3000);
    }

})();
