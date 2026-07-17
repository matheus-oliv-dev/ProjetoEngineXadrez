class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('chessLang') || 'pt';
        this.init();
    }

    init() {
        // Setup do botão toggle
        const toggleBtn = document.getElementById('lang-toggle');
        if (toggleBtn) {
            this.updateButtonText(toggleBtn);
            toggleBtn.addEventListener('click', () => {
                this.currentLang = this.currentLang === 'pt' ? 'en' : 'pt';
                localStorage.setItem('chessLang', this.currentLang);
                this.updateButtonText(toggleBtn);
                this.translatePage();
            });
        }
        
        // Traduz logo no início
        this.translatePage();
    }

    updateButtonText(btn) {
        if (this.currentLang === 'pt') {
            btn.innerHTML = "🇺🇸 EN";
        } else {
            btn.innerHTML = "🇧🇷 PT";
        }
    }

    // Método para traduzir textos estáticos no HTML
    translatePage() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[this.currentLang][key]) {
                if (el.tagName === 'P' || el.tagName === 'HEADER') {
                    // Preserva as tags HTML internas como o <strong> do p
                    el.innerHTML = translations[this.currentLang][key];
                } else {
                    el.textContent = translations[this.currentLang][key];
                }
            }
        });
    }

    // Método para pegar uma string dinâmica
    t(key) {
        return translations[this.currentLang][key] || key;
    }
}

// Instancia globalmente para o script.js usar
const i18n = new I18n();
