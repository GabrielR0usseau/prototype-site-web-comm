// Fonction pour injecter le header et le footer
function initLayout(basePath) {
    const headerHTML = `
        <header>
            <div class="logo"><a href="${basePath}/">Citoyens en action</a></div>
            <button class="menu-toggle" id="menu-toggle">☰</button>
            <nav id="nav-menu">
                <ul>
                    <li><a href="${basePath}/">Accueil</a></li>
                    <li><a href="${basePath}/simpliquer/">S'impliquer</a></li>
                    <li><a href="${basePath}/activites/">Activités</a></li>
                    <li><a href="${basePath}/contact/">Contact</a></li>
                    <li><a href="${basePath}/don/" class="btn-don">Faire un don</a></li>
                </ul>
            </nav>
        </header>
    `;

    const footerHTML = `
        <footer>
            <div class="footer-content">
                <p>&copy; 2026 Citoyens en action. Tous droits réservés.</p>
                <p><a href="">Connexion employés (Administration)</a></p>
            </div>
        </footer>
    `;

    // Injection dans le DOM
    const headerContainer = document.getElementById("header-container");
    const footerContainer = document.getElementById("footer-container");
    
    if (headerContainer) headerContainer.innerHTML = headerHTML;
    if (footerContainer) footerContainer.innerHTML = footerHTML;

    // Réinitialisation de l'événement du menu mobile après l'injection
    const menuToggle = document.getElementById("menu-toggle");
    const navMenu = document.querySelector("#nav-menu ul");
    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", () => {
            navMenu.classList.toggle("active");
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Les événements des formulaires restent identiques
    const formBenevole = document.getElementById("form-benevole");
    if (formBenevole) {
        formBenevole.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Merci pour votre intérêt ! Votre candidature a été envoyée.");
            formBenevole.reset();
        });
    }

    const formContact = document.getElementById("form-contact");
    if (formContact) {
        formContact.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Votre message a bien été envoyé.");
            formContact.reset();
        });
    }
});