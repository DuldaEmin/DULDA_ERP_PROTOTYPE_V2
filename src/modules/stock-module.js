const StockModule = {
    render: (container) => {
        if (!container) return;

        container.innerHTML = `
            <main style="padding:2rem 1.5rem; min-height:420px; display:flex; align-items:flex-start; justify-content:center;">
                <section style="width:min(920px, 100%); background:#ffffffcc; border:1px dashed #94a3b8; border-radius:1rem; padding:3rem 2rem; text-align:center;">
                    <h2 style="margin:0; font-size:2rem; line-height:1.2; color:#334155; font-weight:800;">Sayfa hazirlaniyor</h2>
                    <p style="margin:0.85rem 0 0; font-size:1rem; color:#64748b; font-weight:500;">Bu bolumun alt yapisi temizlendi. Yeni tasarim bu alana eklenecek.</p>
                </section>
            </main>
        `;

        if (window.lucide) window.lucide.createIcons();
    }
};
