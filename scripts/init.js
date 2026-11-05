// Chargé dans le <head> pour appliquer le thème et la langue avant l'affichage (évite le flash)
(function () {
    var html = document.documentElement;
    try {
        var theme = localStorage.getItem('cea_theme');
        if (!theme) {
            theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        html.setAttribute('data-theme', theme);

        var langue = localStorage.getItem('cea_langue') || 'fr';
        html.lang = langue;
        html.dir = (langue === 'ar' || langue === 'ur') ? 'rtl' : 'ltr';
    } catch (e) {
        html.setAttribute('data-theme', 'light');
    }
})();
