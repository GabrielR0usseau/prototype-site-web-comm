/* =========================================================
   Citoyens en action — script principal
   - Injection du header / footer
   - Mode sombre
   - Traduction (10 langues)
   - « Base de données » locale (localStorage) partagée avec l'admin
   - Barre de progression des dons, calendrier, historique, témoignages
   - Formulaires et sondages
   ========================================================= */

const LANGUES = [
    { code: 'fr', nom: 'Français', locale: 'fr-CA' },
    { code: 'en', nom: 'English', locale: 'en-CA' },
    { code: 'zh', nom: '中文', locale: 'zh-CN' },
    { code: 'hi', nom: 'हिन्दी', locale: 'hi-IN' },
    { code: 'es', nom: 'Español', locale: 'es-ES' },
    { code: 'ar', nom: 'العربية', locale: 'ar', rtl: true },
    { code: 'bn', nom: 'বাংলা', locale: 'bn-BD' },
    { code: 'pt', nom: 'Português', locale: 'pt-BR' },
    { code: 'ru', nom: 'Русский', locale: 'ru-RU' },
    { code: 'ur', nom: 'اردو', locale: 'ur-PK', rtl: true }
];

window.I18N = window.I18N || {};

const App = {
    base: '.',
    langue: 'fr',
    pret: false,
    rendus: []
};

/* ---------------------------------------------------------
   « Base de données » locale (démo) — partagée avec /admin
   --------------------------------------------------------- */
const DEFAUTS = {
    dons: { objectif: 50000, amasse: 32500, donateurs: 214 },
    evenements: [
        { id: 'ev1', cle: 'ev1', date: '2026-09-20', heure: '09:00', titre: 'Corvée de nettoyage du parc Michel-Chartrand', lieu: 'Parc Michel-Chartrand, Longueuil', description: 'Plus de 80 bénévoles ont ramassé 350 kg de déchets en une matinée.' },
        { id: 'ev2', cle: 'ev2', date: '2026-10-18', heure: '13:00', titre: "Foire de l'engagement 2026", lieu: 'Centre culturel de Longueuil', description: '32 organismes et 600 visiteurs réunis pour créer des jumelages bénévoles.' },
        { id: 'ev3', cle: 'ev3', date: '2026-11-15', heure: '10:00', titre: "Collecte de denrées pour l'hiver", lieu: '945 Ch. de Chambly, Longueuil', description: 'Aidez-nous à trier et distribuer les denrées aux familles de la région.' },
        { id: 'ev4', cle: 'ev4', date: '2026-11-28', heure: '18:30', titre: 'Atelier : s’impliquer dans sa municipalité', lieu: 'Bibliothèque Raymond-Lévesque', description: 'Comprendre le conseil municipal et faire entendre sa voix.' },
        { id: 'ev5', cle: 'ev5', date: '2026-12-06', heure: '09:00', titre: 'Grande guignolée de la Montérégie', lieu: 'Plusieurs points de collecte', description: 'La collecte annuelle de fonds et de denrées pour les fêtes.' },
        { id: 'ev6', cle: 'ev6', date: '2027-01-17', heure: '14:00', titre: 'Café-rencontre des nouveaux arrivants', lieu: '945 Ch. de Chambly, Longueuil', description: 'Un moment chaleureux pour tisser des liens et découvrir la région.' },
        { id: 'ev7', cle: 'ev7', date: '2027-02-14', heure: '13:30', titre: 'Tricot solidaire pour les aînés', lieu: 'Résidence Les Jardins du Fleuve', description: 'Tricotons ensemble des tuques et foulards pour les personnes aînées.' }
    ],
    temoignages: [
        { id: 't1', cle: 'tem1', nom: 'Sophie Lapointe', role: 'Bénévole depuis 2021', texte: "Je suis arrivée à Longueuil sans connaître personne. Grâce à Citoyens en action, j'ai trouvé une deuxième famille et un vrai sentiment d'appartenance." },
        { id: 't2', cle: 'tem2', nom: 'Gilles Bérubé', role: 'Retraité et mentor', texte: "Partager mes 35 ans d'expérience en menuiserie avec des jeunes, c'est ma plus belle retraite. Chaque atelier me donne autant qu'aux participants." },
        { id: 't3', cle: 'tem3', nom: 'Yasmine Benali', role: 'Étudiante au cégep', texte: "Le bénévolat mensuel m'a permis de développer mon leadership et de découvrir ma future carrière en intervention communautaire." }
    ],
    contenu: {},
    roles: [
        { id: 'super_admin', cle: 'role.super_admin', nom: 'Super-admin', verrouille: true, permissions: { calendrier: true, contenu: true, temoignages: true, reponses: true } },
        { id: 'gestionnaire', cle: 'role.gestionnaire', nom: 'Gestionnaire', permissions: { calendrier: true, contenu: true, temoignages: false, reponses: true } },
        { id: 'communications', cle: 'role.communications', nom: 'Communications', permissions: { calendrier: false, contenu: true, temoignages: true, reponses: false } },
        { id: 'employe', cle: 'role.employe', nom: 'Employé', permissions: { calendrier: false, contenu: false, temoignages: false, reponses: false } }
    ],
    employes: [
        { id: 'e1', nom: 'Marie-Claude Tremblay', courriel: 'mc.tremblay@citoyensenaction.org', poste: 'Directrice générale', role: 'super_admin' },
        { id: 'e2', nom: 'Olivier Lavoie', courriel: 'o.lavoie@citoyensenaction.org', poste: 'Coordonnateur des activités', role: 'gestionnaire' },
        { id: 'e3', nom: 'Léa Morin', courriel: 'l.morin@citoyensenaction.org', poste: 'Agente de communication', role: 'communications' },
        { id: 'e4', nom: 'Karim Haddad', courriel: 'k.haddad@citoyensenaction.org', poste: 'Intervenant communautaire', role: 'employe' }
    ],
    messages: [],
    demandes: [],
    satisfaction: [],
    benevoles: [],
    infolettre: [],
    sondage_eclair: { jardin: 18, ateliers: 25, sport: 11, culture: 14, aines: 9 }
};

const Store = {
    get(cle) {
        try {
            const brut = localStorage.getItem('cea_' + cle);
            if (brut !== null) return JSON.parse(brut);
        } catch (e) { /* stockage indisponible */ }
        return JSON.parse(JSON.stringify(DEFAUTS[cle] ?? null));
    },
    set(cle, valeur) {
        try { localStorage.setItem('cea_' + cle, JSON.stringify(valeur)); } catch (e) { /* ignoré */ }
    },
    ajouter(cle, entree) {
        const liste = Store.get(cle) || [];
        liste.push({ ...entree, date_envoi: new Date().toISOString() });
        Store.set(cle, liste);
    },
    reinitialiser() {
        Object.keys(DEFAUTS).forEach(k => {
            try { localStorage.removeItem('cea_' + k); } catch (e) { /* ignoré */ }
        });
    }
};

const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------------------------------------------------------
   Traduction
   --------------------------------------------------------- */
function chercherTraduction(cle) {
    const dict = window.I18N[App.langue];
    if (dict && dict[cle] !== undefined) return dict[cle];
    if (window.I18N.fr && window.I18N.fr[cle] !== undefined) return window.I18N.fr[cle];
    return undefined;
}

function t(cle, vars, defaut) {
    let texte = chercherTraduction(cle);
    if (texte === undefined) texte = defaut !== undefined ? defaut : cle;
    if (vars) texte = texte.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return texte;
}

// Texte d'un élément de données (événement, témoignage, rôle) : traduit si non modifié par l'admin
function texteDonnee(item, champ, prefixe) {
    if (item.cle) {
        const v = chercherTraduction((prefixe || '') + item.cle + '.' + champ);
        if (v !== undefined) return v;
    }
    return item[champ] || '';
}

function locale() {
    return (LANGUES.find(l => l.code === App.langue) || LANGUES[0]).locale;
}

function formatArgent(n) {
    return new Intl.NumberFormat(locale(), { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
}

function formatNombre(n) {
    return new Intl.NumberFormat(locale()).format(n);
}

function chargerScript(src) {
    return new Promise(resoudre => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resoudre;
        s.onerror = resoudre;
        document.head.appendChild(s);
    });
}

async function chargerLangue(code) {
    if (window.I18N[code]) return;
    await chargerScript(`${App.base}/scripts/i18n/${code}.js`);
}

async function changerLangue(code) {
    if (!LANGUES.some(l => l.code === code)) code = 'fr';
    await Promise.all([chargerLangue('fr'), chargerLangue(code)]);
    App.langue = code;
    try { localStorage.setItem('cea_langue', code); } catch (e) { /* ignoré */ }
    const info = LANGUES.find(l => l.code === code);
    document.documentElement.lang = code;
    document.documentElement.dir = info.rtl ? 'rtl' : 'ltr';
    const select = document.getElementById('lang-select');
    if (select) select.value = code;
    appliquerTraductions();
}

function appliquerTraductions(racine = document) {
    racine.querySelectorAll('[data-i18n]').forEach(el => {
        const v = chercherTraduction(el.dataset.i18n);
        if (v !== undefined) el.textContent = v;
    });
    racine.querySelectorAll('[data-i18n-html]').forEach(el => {
        const v = chercherTraduction(el.dataset.i18nHtml);
        if (v !== undefined) el.innerHTML = v;
    });
    racine.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const v = chercherTraduction(el.dataset.i18nPh);
        if (v !== undefined) {
            el.placeholder = v;
            if (!el.labels.length && (!el.hasAttribute('aria-label') || el.dataset.ariaLabelFromPlaceholder === 'true')) {
                el.setAttribute('aria-label', v);
                el.dataset.ariaLabelFromPlaceholder = 'true';
            }
        }
    });
    racine.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const v = chercherTraduction(el.dataset.i18nAria);
        if (v !== undefined) { el.setAttribute('aria-label', v); el.title = v; }
    });

    // Contenu personnalisé par l'administration (remplace le texte dans toutes les langues)
    const contenu = Store.get('contenu') || {};
    racine.querySelectorAll('[data-contenu]').forEach(el => {
        const v = contenu[el.dataset.contenu];
        if (v) el.textContent = v;
    });

    majBoutonTheme();
    App.pret = true;
    App.rendus.forEach(fn => fn());
}

// Enregistre une fonction de rendu, rappelée à chaque changement de langue
function surRendu(fn) {
    App.rendus.push(fn);
    if (App.pret) fn();
}

/* ---------------------------------------------------------
   Mode sombre
   --------------------------------------------------------- */
function themeActuel() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function basculerTheme() {
    const nouveau = themeActuel() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nouveau);
    try { localStorage.setItem('cea_theme', nouveau); } catch (e) { /* ignoré */ }
    majBoutonTheme();
}

function majBoutonTheme() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const sombre = themeActuel() === 'dark';
    btn.textContent = sombre ? '☀️' : '🌙';
    const libelle = t(sombre ? 'theme.clair' : 'theme.sombre');
    btn.setAttribute('aria-label', libelle);
    btn.title = libelle;
}

/* ---------------------------------------------------------
   Notifications (remplace alert)
   --------------------------------------------------------- */
function notifier(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(notifier._minuterie);
    notifier._minuterie = setTimeout(() => toast.classList.remove('visible'), 3800);
}

function echapper(texte) {
    return String(texte ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------------------------------------------------------
   Header & footer
   --------------------------------------------------------- */
function initLayout(basePath) {
    App.base = basePath;

    const optionsLangues = LANGUES.map(l => `<option value="${l.code}">${l.nom}</option>`).join('');

    const headerHTML = `
        <header>
            <div class="logo">
                <a href="${basePath}/">
                    <img src="${basePath}/assets/logo.svg" alt="" width="46" height="46">
                    <span class="logo-texte">Citoyens en action<small data-i18n="logo.slogan">Montérégie · depuis 2017</small></span>
                </a>
            </div>
            <div class="header-tools">
                <select id="lang-select" class="lang-select" data-i18n-aria="langue.choisir">${optionsLangues}</select>
                <button type="button" id="theme-toggle" class="tool-btn">🌙</button>
                <button type="button" class="menu-toggle" id="menu-toggle" aria-controls="nav-links" aria-expanded="false" data-i18n-aria="nav.menu">☰</button>
            </div>
            <nav id="nav-menu">
                <ul id="nav-links">
                    <li><a href="${basePath}/" data-i18n="nav.accueil">Accueil</a></li>
                    <li><a href="${basePath}/simpliquer/" data-i18n="nav.impliquer">S'impliquer</a></li>
                    <li><a href="${basePath}/activites/" data-i18n="nav.activites">Activités</a></li>
                    <li><a href="${basePath}/faq/" data-i18n="nav.faq">Q &amp; R</a></li>
                    <li><a href="${basePath}/contact/" data-i18n="nav.contact">Contact</a></li>
                    <li><a href="${basePath}/don/" class="btn-don" data-i18n="nav.don">Faire un don</a></li>
                </ul>
            </nav>
        </header>
    `;

    const footerHTML = `
        <footer>
            <div class="footer-content">
                <div class="footer-grille">
                    <div>
                        <h3>Citoyens en action</h3>
                        <p data-i18n="footer.apropos">Favoriser l'engagement citoyen, l'entraide et la participation active à la vie communautaire en Montérégie.</p>
                    </div>
                    <div>
                        <h4 data-i18n="footer.liens">Liens rapides</h4>
                        <ul>
                            <li><a href="${basePath}/" data-i18n="nav.accueil">Accueil</a></li>
                            <li><a href="${basePath}/simpliquer/" data-i18n="footer.lien_impliquer">S'impliquer &amp; Bénévolat</a></li>
                            <li><a href="${basePath}/activites/" data-i18n="footer.lien_activites">Activités et initiatives</a></li>
                            <li><a href="${basePath}/faq/" data-i18n="footer.lien_faq">Questions fréquentes</a></li>
                            <li><a href="${basePath}/don/" data-i18n="nav.don">Faire un don</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 data-i18n="footer.partenaires">Partenaires de confiance</h4>
                        <div class="footer-partenaires">
                            <span data-i18n="partenaire.mcc">Ministère de la Culture et des Communications du Québec</span>
                            <span data-i18n="partenaire.aped">L'APED</span>
                            <span data-i18n="partenaire.cpd">Club des petits déjeuners</span>
                        </div>
                    </div>
                    <div>
                        <h4 data-i18n="footer.nous_joindre">Nous joindre</h4>
                        <ul>
                            <li>945 Ch. de Chambly, Longueuil</li>
                            <li><a href="${basePath}/contact/" data-i18n="footer.formulaires">Formulaires et sondages</a></li>
                            <li><a href="${basePath}/admin/" data-i18n="footer.employes">🔒 Accès employés</a></li>
                        </ul>
                    </div>
                </div>
                <div class="footer-bas">
                    <p>&copy; 2026 Citoyens en action. <span data-i18n="footer.droits">Tous droits réservés.</span></p>
                    <a class="credit-citegab" href="${basePath}/" title="CitéGab">
                        <img src="${basePath}/assets/citegab.svg" alt="" width="30" height="30">
                        <span><span data-i18n="footer.realise">Site réalisé par</span> <strong>CitéGab</strong></span>
                    </a>
                </div>
            </div>
        </footer>
    `;

    const headerContainer = document.getElementById('header-container');
    const footerContainer = document.getElementById('footer-container');
    if (headerContainer) headerContainer.innerHTML = headerHTML;
    if (footerContainer) footerContainer.innerHTML = footerHTML;

    // Favicon
    if (!document.querySelector('link[rel="icon"]')) {
        const icone = document.createElement('link');
        icone.rel = 'icon';
        icone.type = 'image/svg+xml';
        icone.href = `${basePath}/assets/logo.svg`;
        document.head.appendChild(icone);
    }

    // Menu mobile
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('#nav-menu ul');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const ouvert = navMenu.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', String(ouvert));
        });
    }

    // Thème
    const btnTheme = document.getElementById('theme-toggle');
    if (btnTheme) btnTheme.addEventListener('click', basculerTheme);
    majBoutonTheme();

    // Langue
    const select = document.getElementById('lang-select');
    let langue = 'fr';
    try { langue = localStorage.getItem('cea_langue') || 'fr'; } catch (e) { /* ignoré */ }
    if (select) {
        select.value = langue;
        select.addEventListener('change', () => changerLangue(select.value));
    }
    changerLangue(langue);
}

/* ---------------------------------------------------------
   Barre de progression des dons
   --------------------------------------------------------- */
function rendreProgressionDons() {
    const d = Store.get('dons');
    const pct = Math.min(100, Math.round((d.amasse / d.objectif) * 100));
    const reste = Math.max(0, d.objectif - d.amasse);

    document.querySelectorAll('[data-dons]').forEach(el => {
        switch (el.dataset.dons) {
            case 'amasse': el.textContent = formatArgent(d.amasse); break;
            case 'objectif': el.textContent = formatArgent(d.objectif); break;
            case 'pourcent': el.textContent = t('dons.pourcent', { n: formatNombre(pct) }); break;
            case 'donateurs': el.textContent = t('dons.donateurs', { n: formatNombre(d.donateurs) }); break;
            case 'reste': el.textContent = reste > 0 ? t('dons.reste', { montant: formatArgent(reste) }) : t('dons.atteint'); break;
            case 'jalon-0': el.textContent = formatArgent(0); break;
            case 'jalon-50': el.textContent = formatArgent(d.objectif / 2); break;
            case 'jalon-100': el.textContent = formatArgent(d.objectif); break;
        }
    });

    // Laisse le navigateur peindre la largeur 0 avant d'animer
    requestAnimationFrame(() => requestAnimationFrame(() => {
        document.querySelectorAll('[data-dons-barre]').forEach(b => {
            b.style.width = pct + '%';
            b.parentElement.setAttribute('aria-valuenow', pct);
        });
        document.querySelectorAll('[data-dons-barre-verticale]').forEach(b => { b.style.height = pct + '%'; });
    }));
}

function ajouterDon(montant) {
    const d = Store.get('dons');
    d.amasse += montant;
    d.donateurs += 1;
    Store.set('dons', d);
    rendreProgressionDons();
}

/* ---------------------------------------------------------
   Calendrier, historique, témoignages
   --------------------------------------------------------- */
function aujourdhui() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function htmlEvenement(ev) {
    const date = new Date(ev.date + 'T12:00:00');
    const jour = new Intl.DateTimeFormat(locale(), { day: 'numeric' }).format(date);
    const mois = new Intl.DateTimeFormat(locale(), { month: 'short' }).format(date);
    const annee = date.getFullYear();
    const heure = ev.heure ? new Intl.DateTimeFormat(locale(), { hour: 'numeric', minute: '2-digit' }).format(new Date(ev.date + 'T' + ev.heure)) : '';
    return `
        <article class="evenement">
            <div class="date-badge"><span class="jour">${jour}</span><span class="mois">${mois} ${annee}</span></div>
            <div>
                <h3>${echapper(texteDonnee(ev, 'titre'))}</h3>
                <p>${echapper(texteDonnee(ev, 'description'))}</p>
                <div class="lieu">📍 ${echapper(texteDonnee(ev, 'lieu'))}${heure ? ' · 🕒 ' + heure : ''}</div>
            </div>
        </article>`;
}

function rendreCalendrier() {
    const conteneur = document.getElementById('calendrier-container');
    const historique = document.getElementById('historique-recent');
    if (!conteneur && !historique) return;

    const evenements = (Store.get('evenements') || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    const ajd = aujourdhui();

    if (conteneur) {
        const avenir = evenements.filter(e => e.date >= ajd);
        conteneur.innerHTML = avenir.length
            ? avenir.map(htmlEvenement).join('')
            : `<p class="vide">${t('act.aucun')}</p>`;
    }
    if (historique) {
        const passes = evenements.filter(e => e.date < ajd).reverse();
        historique.innerHTML = passes.length
            ? passes.map(htmlEvenement).join('')
            : `<p class="vide">${t('act.aucun_passe')}</p>`;
    }
}

function rendreTemoignages() {
    const conteneur = document.getElementById('temoignages-container');
    if (!conteneur) return;
    const liste = Store.get('temoignages') || [];
    conteneur.innerHTML = liste.map(tm => `
        <article class="carte temoignage">
            <blockquote>${echapper(texteDonnee(tm, 'texte'))}</blockquote>
            <cite>${echapper(tm.nom)}<span>${echapper(texteDonnee(tm, 'role'))}</span></cite>
        </article>`).join('') || `<p class="vide">${t('home.temoignages_vide')}</p>`;
}

/* ---------------------------------------------------------
   Formulaires et sondages
   --------------------------------------------------------- */
function initFormulaires() {
    // Formulaires génériques : data-toast="cle" et data-enregistrer="collection"
    document.querySelectorAll('form[data-toast]').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (form.dataset.enregistrer) {
                const donnees = {};
                new FormData(form).forEach((v, k) => {
                    if (donnees[k] !== undefined) donnees[k] = [].concat(donnees[k], v);
                    else donnees[k] = v;
                });
                Store.ajouter(form.dataset.enregistrer, donnees);
            }
            notifier(t(form.dataset.toast));
            form.reset();
        });
    });

    // Onglets génériques : .onglets[data-groupe] > .onglet[data-cible]
    document.querySelectorAll('.onglets').forEach(groupe => {
        const onglets = groupe.querySelectorAll('.onglet');
        onglets.forEach(onglet => {
            const panneau = document.getElementById(onglet.dataset.cible);
            if (panneau) {
                onglet.id = `onglet-${panneau.id}`;
                onglet.setAttribute('aria-controls', panneau.id);
                panneau.setAttribute('aria-labelledby', onglet.id);
                panneau.tabIndex = 0;
                panneau.hidden = !onglet.classList.contains('active');
            }
            onglet.tabIndex = onglet.getAttribute('aria-selected') === 'true' ? 0 : -1;
            onglet.addEventListener('click', () => {
                onglets.forEach(o => {
                    o.classList.remove('active');
                    o.setAttribute('aria-selected', 'false');
                    o.tabIndex = -1;
                    const p = document.getElementById(o.dataset.cible);
                    if (p) {
                        p.classList.remove('active');
                        p.hidden = true;
                    }
                });
                onglet.classList.add('active');
                onglet.setAttribute('aria-selected', 'true');
                onglet.tabIndex = 0;
                if (panneau) {
                    panneau.classList.add('active');
                    panneau.hidden = false;
                }
                groupe.dispatchEvent(new CustomEvent('onglet', { detail: onglet.dataset.cible }));
            });
            onglet.addEventListener('keydown', event => {
                const index = Array.from(onglets).indexOf(onglet);
                let suivant = index;
                const direction = document.documentElement.dir === 'rtl' ? -1 : 1;
                if (event.key === 'ArrowRight') suivant = (index + direction + onglets.length) % onglets.length;
                else if (event.key === 'ArrowLeft') suivant = (index - direction + onglets.length) % onglets.length;
                else if (event.key === 'Home') suivant = 0;
                else if (event.key === 'End') suivant = onglets.length - 1;
                else return;

                event.preventDefault();
                onglets[suivant].focus();
                onglets[suivant].click();
            });
        });
    });

    // Sondage éclair avec résultats en direct
    const sondage = document.getElementById('form-sondage-eclair');
    if (sondage) {
        sondage.addEventListener('submit', e => {
            e.preventDefault();
            const choix = new FormData(sondage).get('activite');
            if (!choix) return;
            const resultats = Store.get('sondage_eclair');
            resultats[choix] = (resultats[choix] || 0) + 1;
            Store.set('sondage_eclair', resultats);
            try { localStorage.setItem('cea_a_vote', '1'); } catch (err) { /* ignoré */ }
            notifier(t('contact.sondage_merci'));
            sondage.reset();
            rendreSondageEclair();
        });
    }
}

function rendreSondageEclair() {
    const conteneur = document.getElementById('resultats-sondage');
    if (!conteneur) return;
    const resultats = Store.get('sondage_eclair');
    const total = Object.values(resultats).reduce((a, b) => a + b, 0) || 1;
    conteneur.innerHTML = Object.entries(resultats)
        .sort((a, b) => b[1] - a[1])
        .map(([cle, n]) => {
            const pct = Math.round((n / total) * 100);
            return `<div class="resultat-ligne">${echapper(t('contact.choix_' + cle))} — ${formatNombre(pct)} %
                <div class="barre"><div class="barre-remplissage" style="width:${pct}%"></div></div></div>`;
        }).join('') + `<p class="aide-demo">${t('contact.total_votes', { n: formatNombre(total) })}</p>`;
}

document.addEventListener('DOMContentLoaded', () => {
    initFormulaires();
    surRendu(rendreProgressionDons);
    surRendu(rendreCalendrier);
    surRendu(rendreTemoignages);
    surRendu(rendreSondageEclair);
});
