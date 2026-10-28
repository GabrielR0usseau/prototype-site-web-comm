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
            <div class="footer-content" style="max-width: 1200px; margin: 0 auto; width: 100%;">
                
                <!-- Grille principale du footer -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 3rem; text-align: left; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    
                    <!-- Colonne 1 : À propos -->
                    <div>
                        <h3 style="color: white; font-size: 1.5rem; margin-bottom: 0.8rem; font-weight: 800;">Citoyens en action</h3>
                        <p style="font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.6;">
                            Favoriser l'engagement citoyen, l'entraide et la participation active à la vie communautaire en Montérégie.
                        </p>
                    </div>

                    <!-- Colonne 2 : Liens rapides -->
                    <div>
                        <h4 style="color: white; font-size: 1.1rem; margin-bottom: 1rem;">Liens rapides</h4>
                        <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.8rem; margin: 0;">
                            <li><a href="${basePath}/" style="text-decoration: none;">Accueil</a></li>
                            <li><a href="${basePath}/simpliquer/" style="text-decoration: none;">S'impliquer & Bénévolat</a></li>
                            <li><a href="${basePath}/activites/" style="text-decoration: none;">Activités et initiatives</a></li>
                            <li><a href="${basePath}/don/" style="text-decoration: none;">Faire un don</a></li>
                        </ul>
                    </div>
                    
                </div>
                
                <!-- Barre du bas : Copyright et accès employés -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 0.9rem;">
                    <p style="margin: 0;">&copy; 2026 Citoyens en action. Tous droits réservés.</p>
                </div>

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