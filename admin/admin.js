/* =========================================================
   Espace employés — rôles, permissions et gestion du site
   (prototype : les données sont conservées dans le localStorage)
   ========================================================= */

const PERMISSIONS = ['calendrier', 'contenu', 'temoignages', 'reponses'];

const CHAMPS_CONTENU = [
    { cle: 'hero_titre', i18n: 'home.hero_titre', type: 'input' },
    { cle: 'hero_texte', i18n: 'home.hero_texte', type: 'textarea' },
    { cle: 'mission_texte', i18n: 'home.mission_texte', type: 'textarea' }
];

const ONGLETS_ADMIN = [
    { id: 'calendrier', icone: '📅', permission: 'calendrier' },
    { id: 'contenu', icone: '📝', permission: 'contenu' },
    { id: 'temoignages', icone: '💬', permission: 'temoignages' },
    { id: 'reponses', icone: '📊', permission: 'reponses' },
    { id: 'equipe', icone: '👥', permission: 'super' }
];

const Admin = { onglet: 'calendrier', editEvenement: null, editTemoignage: null, initialise: false };

/* ---------- Session et permissions ---------- */
function sessionId() {
    try { return sessionStorage.getItem('cea_session'); } catch (e) { return null; }
}

function definirSession(id) {
    try {
        if (id) sessionStorage.setItem('cea_session', id);
        else sessionStorage.removeItem('cea_session');
    } catch (e) { /* ignoré */ }
}

function utilisateur() {
    const id = sessionId();
    return (Store.get('employes') || []).find(e => e.id === id) || null;
}

function roleDe(employe) {
    return (Store.get('roles') || []).find(r => r.id === employe.role) || null;
}

function estSuperAdmin(employe) {
    return !!employe && employe.role === 'super_admin';
}

function peut(employe, permission) {
    if (!employe) return false;
    if (estSuperAdmin(employe)) return true;
    if (permission === 'super') return false;
    const role = roleDe(employe);
    return !!(role && role.permissions && role.permissions[permission]);
}

function nomRole(role) {
    return role ? texteDonnee(role, 'nom') : '—';
}

function dateCourte(iso) {
    try {
        return new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
    } catch (e) { return iso; }
}

/* ---------- Rendu principal ---------- */
function rendreAdmin() {
    const app = document.getElementById('admin-app');
    if (!app) return;
    if (!Admin.initialise) {
        app.addEventListener('click', gererClic);
        app.addEventListener('submit', gererSoumission);
        app.addEventListener('change', gererChangement);
        Admin.initialise = true;
    }

    const u = utilisateur();
    if (!u) {
        app.innerHTML = htmlConnexion();
        return;
    }

    const role = roleDe(u);
    const pastillesPerms = PERMISSIONS.map(p =>
        `<span class="pastille ${peut(u, p) ? '' : 'non'}">${peut(u, p) ? '✓' : '✗'} ${t('perm.' + p)}</span>`
    ).join(' ');

    const onglets = ONGLETS_ADMIN.map(o => {
        const autorise = peut(u, o.permission);
        return `<button type="button" class="onglet ${Admin.onglet === o.id ? 'active' : ''}" data-action="onglet" data-id="${o.id}">
            ${autorise ? o.icone : '🔒'} ${t('admin.onglet_' + o.id)}</button>`;
    }).join('');

    app.innerHTML = `
        <div class="admin-barre">
            <div>
                <span class="qui">👤 ${echapper(u.nom)}</span>
                <span class="pastille ${estSuperAdmin(u) ? 'super' : ''}">${echapper(nomRole(role))}</span>
                <div style="margin-top:0.5rem; display:flex; gap:0.4rem; flex-wrap:wrap;">${pastillesPerms}</div>
            </div>
            <div class="actions">
                <button type="button" class="btn btn-sm btn-ghost" data-action="reinitialiser">${t('admin.reinitialiser')}</button>
                <button type="button" class="btn btn-sm" data-action="deconnexion">${t('admin.deconnexion')}</button>
            </div>
        </div>
        <div class="onglets">${onglets}</div>
        <div id="admin-panneau">${htmlPanneau(u)}</div>
    `;
}

function htmlConnexion() {
    const employes = Store.get('employes') || [];
    const roles = Store.get('roles') || [];
    const options = employes.map(e => {
        const r = roles.find(x => x.id === e.role);
        return `<option value="${e.id}">${echapper(e.nom)} — ${echapper(nomRole(r))}</option>`;
    }).join('');
    return `
        <div class="connexion">
            <form id="form-connexion" style="max-width:100%;">
                <h3 style="margin:0;">${t('admin.connexion_titre')}</h3>
                <label class="champ">${t('admin.employe')}
                    <select name="employe" required>${options}</select>
                </label>
                <label class="champ">${t('admin.mot_de_passe')}
                    <input type="password" name="mdp" required autocomplete="current-password">
                </label>
                <button type="submit">${t('admin.se_connecter')}</button>
                <p class="aide-demo">${t('admin.aide_demo')}</p>
            </form>
        </div>`;
}

function htmlVerrou(cle) {
    return `<div class="admin-panneau verrou"><span class="icone">🔒</span>
        <strong>${t('admin.acces_refuse')}</strong><p style="margin:0.5rem 0 0;">${t(cle)}</p></div>`;
}

function htmlPanneau(u) {
    const onglet = ONGLETS_ADMIN.find(o => o.id === Admin.onglet) || ONGLETS_ADMIN[0];
    if (!peut(u, onglet.permission)) {
        return htmlVerrou(onglet.permission === 'super' ? 'admin.verrou_super' : 'admin.verrou_permission');
    }
    switch (onglet.id) {
        case 'calendrier': return htmlCalendrier();
        case 'contenu': return htmlContenu();
        case 'temoignages': return htmlTemoignages();
        case 'reponses': return htmlReponses();
        case 'equipe': return htmlEquipe(u);
    }
    return '';
}

/* ---------- Calendrier ---------- */
function htmlCalendrier() {
    const evenements = (Store.get('evenements') || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    const edit = evenements.find(e => e.id === Admin.editEvenement);
    const lignes = evenements.map(ev => `
        <tr>
            <td>${echapper(ev.date)} ${echapper(ev.heure || '')}</td>
            <td><strong>${echapper(texteDonnee(ev, 'titre'))}</strong>${ev.date < aujourdhui() ? ` <span class="pastille super">${t('admin.passe')}</span>` : ''}</td>
            <td>${echapper(texteDonnee(ev, 'lieu'))}</td>
            <td><div class="actions">
                <button type="button" class="btn btn-sm btn-ghost" data-action="modifier-evenement" data-id="${ev.id}">${t('admin.modifier')}</button>
                <button type="button" class="btn btn-sm btn-danger" data-action="supprimer-evenement" data-id="${ev.id}">${t('admin.supprimer')}</button>
            </div></td>
        </tr>`).join('');

    const v = champ => edit ? echapper(texteDonnee(edit, champ)) : '';
    return `
        <div class="admin-panneau">
            <h3>${t('admin.cal_titre')}</h3>
            <div class="table-wrap"><table>
                <thead><tr><th>${t('admin.col_date')}</th><th>${t('admin.col_titre')}</th><th>${t('admin.col_lieu')}</th><th>${t('admin.col_actions')}</th></tr></thead>
                <tbody>${lignes || `<tr><td colspan="4" class="vide">${t('act.aucun')}</td></tr>`}</tbody>
            </table></div>
        </div>
        <div class="admin-panneau">
            <h3>${edit ? t('admin.cal_modifier') : t('admin.cal_ajouter')}</h3>
            <form id="form-evenement" class="form-admin">
                <div class="grille-2">
                    <label class="champ">${t('admin.col_date')}<input type="date" name="date" required value="${edit ? echapper(edit.date) : ''}"></label>
                    <label class="champ">${t('admin.heure')}<input type="time" name="heure" value="${edit ? echapper(edit.heure || '') : ''}"></label>
                </div>
                <label class="champ">${t('admin.col_titre')}<input type="text" name="titre" required value="${v('titre')}"></label>
                <label class="champ">${t('admin.col_lieu')}<input type="text" name="lieu" required value="${v('lieu')}"></label>
                <label class="champ">${t('admin.description')}<textarea name="description" rows="3" style="resize:vertical;">${v('description')}</textarea></label>
                <div class="actions">
                    <button type="submit">${t('admin.enregistrer')}</button>
                    ${edit ? `<button type="button" class="btn btn-ghost" data-action="annuler-evenement">${t('admin.annuler')}</button>` : ''}
                </div>
            </form>
        </div>`;
}

/* ---------- Contenu ---------- */
function htmlContenu() {
    const contenu = Store.get('contenu') || {};
    const dons = Store.get('dons');
    const champs = CHAMPS_CONTENU.map(c => {
        const valeur = echapper(contenu[c.cle] || t(c.i18n));
        const saisie = c.type === 'textarea'
            ? `<textarea name="${c.cle}" rows="3" style="resize:vertical;">${valeur}</textarea>`
            : `<input type="text" name="${c.cle}" value="${valeur}">`;
        return `<label class="champ">${t('admin.champ_' + c.cle)}${saisie}</label>`;
    }).join('');
    return `
        <div class="admin-panneau">
            <h3>${t('admin.contenu_titre')}</h3>
            <p class="aide-demo">${t('admin.contenu_aide')}</p>
            <form id="form-contenu" class="form-admin">
                ${champs}
                <h4 style="margin:0.5rem 0 0;">${t('admin.campagne')}</h4>
                <div class="grille-2">
                    <label class="champ">${t('don.objectif')}<input type="number" name="objectif" min="1" required value="${dons.objectif}"></label>
                    <label class="champ">${t('don.amasse')}<input type="number" name="amasse" min="0" required value="${dons.amasse}"></label>
                </div>
                <label class="champ">${t('admin.nb_donateurs')}<input type="number" name="donateurs" min="0" required value="${dons.donateurs}"></label>
                <div class="actions">
                    <button type="submit">${t('admin.enregistrer')}</button>
                    <button type="button" class="btn btn-ghost" data-action="contenu-defaut">${t('admin.contenu_defaut')}</button>
                </div>
            </form>
        </div>`;
}

/* ---------- Témoignages ---------- */
function htmlTemoignages() {
    const liste = Store.get('temoignages') || [];
    const edit = liste.find(x => x.id === Admin.editTemoignage);
    const cartes = liste.map(tm => `
        <article class="carte temoignage" style="padding:2.5rem 1.5rem 1.5rem;">
            <blockquote>${echapper(texteDonnee(tm, 'texte'))}</blockquote>
            <cite>${echapper(tm.nom)}<span>${echapper(texteDonnee(tm, 'role'))}</span></cite>
            <div class="actions" style="margin-top:1rem;">
                <button type="button" class="btn btn-sm btn-ghost" data-action="modifier-temoignage" data-id="${tm.id}">${t('admin.modifier')}</button>
                <button type="button" class="btn btn-sm btn-danger" data-action="supprimer-temoignage" data-id="${tm.id}">${t('admin.supprimer')}</button>
            </div>
        </article>`).join('');
    const v = champ => edit ? echapper(champ === 'nom' ? edit.nom : texteDonnee(edit, champ)) : '';
    return `
        <div class="admin-panneau">
            <h3>${t('admin.tem_titre')}</h3>
            <div class="grid-articles" style="margin-top:1rem;">${cartes || `<p class="vide">${t('home.temoignages_vide')}</p>`}</div>
        </div>
        <div class="admin-panneau">
            <h3>${edit ? t('admin.tem_modifier') : t('admin.tem_ajouter')}</h3>
            <form id="form-temoignage" class="form-admin">
                <div class="grille-2">
                    <label class="champ">${t('admin.nom')}<input type="text" name="nom" required value="${v('nom')}"></label>
                    <label class="champ">${t('admin.tem_role')}<input type="text" name="role" required value="${v('role')}"></label>
                </div>
                <label class="champ">${t('admin.tem_texte')}<textarea name="texte" rows="4" required style="resize:vertical;">${v('texte')}</textarea></label>
                <div class="actions">
                    <button type="submit">${t('admin.enregistrer')}</button>
                    ${edit ? `<button type="button" class="btn btn-ghost" data-action="annuler-temoignage">${t('admin.annuler')}</button>` : ''}
                </div>
            </form>
        </div>`;
}

/* ---------- Réponses aux formulaires et sondages ---------- */
function tableReponses(liste, colonnes) {
    if (!liste.length) return `<p class="vide">${t('admin.aucune_reponse')}</p>`;
    const entete = colonnes.map(c => `<th>${t(c.titre)}</th>`).join('');
    const lignes = liste.slice().reverse().map(r => '<tr>' + colonnes.map(c => {
        let v = r[c.champ];
        if (c.champ === 'date_envoi') v = dateCourte(v);
        if (Array.isArray(v)) v = v.join(', ');
        return `<td>${echapper(v || '—')}</td>`;
    }).join('') + '</tr>').join('');
    return `<div class="table-wrap"><table><thead><tr>${entete}</tr></thead><tbody>${lignes}</tbody></table></div>`;
}

function htmlReponses() {
    const satisfaction = Store.get('satisfaction') || [];
    const moyenne = satisfaction.length
        ? (satisfaction.reduce((s, r) => s + Number(r.note || 0), 0) / satisfaction.length).toFixed(1)
        : '—';
    const eclair = Store.get('sondage_eclair');
    const total = Object.values(eclair).reduce((a, b) => a + b, 0) || 1;
    const barres = Object.entries(eclair).sort((a, b) => b[1] - a[1]).map(([cle, n]) => {
        const pct = Math.round((n / total) * 100);
        return `<div class="resultat-ligne">${echapper(t('contact.choix_' + cle))} — ${n} (${pct} %)
            <div class="barre"><div class="barre-remplissage" style="width:${pct}%"></div></div></div>`;
    }).join('');
    const infolettre = Store.get('infolettre') || [];

    return `
        <div class="admin-panneau">
            <h3>✉️ ${t('admin.rep_messages')}</h3>
            ${tableReponses(Store.get('messages') || [], [
                { champ: 'date_envoi', titre: 'admin.col_date' }, { champ: 'nom', titre: 'admin.nom' },
                { champ: 'courriel', titre: 'admin.courriel' }, { champ: 'sujet', titre: 'admin.sujet' }, { champ: 'message', titre: 'admin.message' }
            ])}
        </div>
        <div class="admin-panneau">
            <h3>📋 ${t('admin.rep_demandes')}</h3>
            ${tableReponses(Store.get('demandes') || [], [
                { champ: 'date_envoi', titre: 'admin.col_date' }, { champ: 'type', titre: 'admin.type' }, { champ: 'nom', titre: 'admin.nom' },
                { champ: 'organisation', titre: 'admin.organisation' }, { champ: 'courriel', titre: 'admin.courriel' }, { champ: 'details', titre: 'admin.details' }
            ])}
        </div>
        <div class="admin-panneau">
            <h3>⭐ ${t('admin.rep_satisfaction')}</h3>
            <p><strong>${t('admin.moyenne', { note: moyenne, n: satisfaction.length })}</strong></p>
            ${tableReponses(satisfaction, [
                { champ: 'date_envoi', titre: 'admin.col_date' }, { champ: 'note', titre: 'admin.note' }, { champ: 'profil', titre: 'admin.profil' },
                { champ: 'aspects', titre: 'admin.aspects' }, { champ: 'recommande', titre: 'admin.recommande' }, { champ: 'commentaire', titre: 'admin.commentaire' }
            ])}
        </div>
        <div class="admin-panneau">
            <h3>📊 ${t('admin.rep_eclair')}</h3>
            <p class="aide-demo">${t('contact.q_eclair')}</p>
            <div class="resultats">${barres}</div>
        </div>
        <div class="admin-panneau">
            <h3>🤝 ${t('admin.rep_benevoles')}</h3>
            ${tableReponses(Store.get('benevoles') || [], [
                { champ: 'date_envoi', titre: 'admin.col_date' }, { champ: 'nom', titre: 'admin.nom' },
                { champ: 'courriel', titre: 'admin.courriel' }, { champ: 'interets', titre: 'admin.interets' }
            ])}
        </div>
        <div class="admin-panneau">
            <h3>📰 ${t('admin.rep_infolettre', { n: infolettre.length })}</h3>
            ${tableReponses(infolettre, [{ champ: 'date_envoi', titre: 'admin.col_date' }, { champ: 'courriel', titre: 'admin.courriel' }])}
        </div>`;
}

/* ---------- Employés, rôles et permissions (super-admin) ---------- */
function htmlEquipe(u) {
    const employes = Store.get('employes') || [];
    const roles = Store.get('roles') || [];

    const optionsRoles = selection => roles.map(r =>
        `<option value="${r.id}" ${r.id === selection ? 'selected' : ''}>${echapper(nomRole(r))}</option>`).join('');

    const lignesEmployes = employes.map(e => `
        <tr>
            <td><strong>${echapper(e.nom)}</strong>${e.id === u.id ? ` <span class="pastille">${t('admin.vous')}</span>` : ''}<br><small>${echapper(e.poste || '')}</small></td>
            <td>${echapper(e.courriel || '')}</td>
            <td><select data-action="role-employe" data-id="${e.id}" aria-label="${t('admin.col_role')}">${optionsRoles(e.role)}</select></td>
            <td>${e.id === u.id ? '' : `<button type="button" class="btn btn-sm btn-danger" data-action="supprimer-employe" data-id="${e.id}">${t('admin.supprimer')}</button>`}</td>
        </tr>`).join('');

    const entetePerms = PERMISSIONS.map(p => `<th class="c">${t('perm.' + p)}</th>`).join('');
    const lignesRoles = roles.map(r => {
        const utilise = employes.filter(e => e.role === r.id).length;
        const cases = PERMISSIONS.map(p => `<td class="c"><input type="checkbox" data-action="permission" data-role="${r.id}" data-perm="${p}"
            ${r.verrouille || (r.permissions && r.permissions[p]) ? 'checked' : ''} ${r.verrouille ? 'disabled' : ''} aria-label="${t('perm.' + p)}"></td>`).join('');
        return `<tr>
            <td><strong>${echapper(nomRole(r))}</strong>${r.verrouille ? ` <span class="pastille super">${t('admin.tous_droits')}</span>` : ''}<br><small>${t('admin.nb_employes', { n: utilise })}</small></td>
            ${cases}
            <td>${r.verrouille || utilise ? '' : `<button type="button" class="btn btn-sm btn-danger" data-action="supprimer-role" data-id="${r.id}">${t('admin.supprimer')}</button>`}</td>
        </tr>`;
    }).join('');

    const casesNouveauRole = PERMISSIONS.map(p =>
        `<label class="choix"><input type="checkbox" name="perm" value="${p}"> ${t('perm.' + p)}</label>`).join('');

    return `
        <div class="admin-panneau">
            <h3>${t('admin.employes_titre')}</h3>
            <div class="table-wrap"><table>
                <thead><tr><th>${t('admin.nom')}</th><th>${t('admin.courriel')}</th><th>${t('admin.col_role')}</th><th>${t('admin.col_actions')}</th></tr></thead>
                <tbody>${lignesEmployes}</tbody>
            </table></div>
            <form id="form-employe" class="form-admin">
                <strong>${t('admin.employe_ajouter')}</strong>
                <div class="grille-2">
                    <label class="champ">${t('admin.nom')}<input type="text" name="nom" required></label>
                    <label class="champ">${t('admin.poste')}<input type="text" name="poste" required></label>
                </div>
                <div class="grille-2">
                    <label class="champ">${t('admin.courriel')}<input type="email" name="courriel" required></label>
                    <label class="champ">${t('admin.col_role')}<select name="role">${optionsRoles('employe')}</select></label>
                </div>
                <div><button type="submit">${t('admin.ajouter')}</button></div>
            </form>
        </div>
        <div class="admin-panneau">
            <h3>${t('admin.roles_titre')}</h3>
            <p class="aide-demo">${t('admin.roles_aide')}</p>
            <div class="table-wrap"><table>
                <thead><tr><th>${t('admin.col_role')}</th>${entetePerms}<th>${t('admin.col_actions')}</th></tr></thead>
                <tbody>${lignesRoles}</tbody>
            </table></div>
            <form id="form-role" class="form-admin">
                <strong>${t('admin.role_ajouter')}</strong>
                <label class="champ">${t('admin.role_nom')}<input type="text" name="nom" required></label>
                <div class="choix-ligne">${casesNouveauRole}</div>
                <div><button type="submit">${t('admin.ajouter')}</button></div>
            </form>
        </div>`;
}

/* ---------- Événements utilisateur ---------- */
function gererClic(e) {
    const cible = e.target.closest('[data-action]');
    if (!cible || cible.tagName === 'SELECT' || cible.type === 'checkbox') return;
    const { action, id } = cible.dataset;
    const u = utilisateur();

    switch (action) {
        case 'onglet':
            Admin.onglet = id;
            Admin.editEvenement = null;
            Admin.editTemoignage = null;
            break;
        case 'deconnexion':
            definirSession(null);
            Admin.onglet = 'calendrier';
            break;
        case 'reinitialiser':
            if (!confirm(t('admin.confirmer_reinit'))) return;
            Store.reinitialiser();
            notifier(t('admin.toast_reinit'));
            break;
        case 'modifier-evenement':
            Admin.editEvenement = id;
            break;
        case 'annuler-evenement':
            Admin.editEvenement = null;
            break;
        case 'supprimer-evenement':
            if (!peut(u, 'calendrier') || !confirm(t('admin.confirmer_suppression'))) return;
            Store.set('evenements', Store.get('evenements').filter(x => x.id !== id));
            notifier(t('admin.toast_supprime'));
            break;
        case 'modifier-temoignage':
            Admin.editTemoignage = id;
            break;
        case 'annuler-temoignage':
            Admin.editTemoignage = null;
            break;
        case 'supprimer-temoignage':
            if (!peut(u, 'temoignages') || !confirm(t('admin.confirmer_suppression'))) return;
            Store.set('temoignages', Store.get('temoignages').filter(x => x.id !== id));
            notifier(t('admin.toast_supprime'));
            break;
        case 'contenu-defaut':
            if (!peut(u, 'contenu')) return;
            Store.set('contenu', {});
            Store.set('dons', JSON.parse(JSON.stringify(DEFAUTS.dons)));
            notifier(t('admin.toast_enregistre'));
            break;
        case 'supprimer-employe':
            if (!estSuperAdmin(u) || id === u.id || !confirm(t('admin.confirmer_suppression'))) return;
            Store.set('employes', Store.get('employes').filter(x => x.id !== id));
            notifier(t('admin.toast_supprime'));
            break;
        case 'supprimer-role': {
            if (!estSuperAdmin(u)) return;
            const roles = Store.get('roles');
            const role = roles.find(r => r.id === id);
            if (!role || role.verrouille || Store.get('employes').some(x => x.role === id)) return;
            Store.set('roles', roles.filter(r => r.id !== id));
            notifier(t('admin.toast_supprime'));
            break;
        }
        default:
            return;
    }
    rendreAdmin();
}

function donneesFormulaire(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function gererSoumission(e) {
    const form = e.target;
    e.preventDefault();
    const u = utilisateur();
    const d = donneesFormulaire(form);

    switch (form.id) {
        case 'form-connexion': {
            if (d.mdp !== 'demo') {
                notifier(t('admin.erreur_mdp'));
                return;
            }
            definirSession(d.employe);
            const connecte = utilisateur();
            Admin.onglet = (ONGLETS_ADMIN.find(o => peut(connecte, o.permission)) || ONGLETS_ADMIN[0]).id;
            notifier(t('admin.bienvenue', { nom: connecte ? connecte.nom : '' }));
            break;
        }
        case 'form-evenement': {
            if (!peut(u, 'calendrier')) return;
            const liste = Store.get('evenements');
            const champs = { date: d.date, heure: d.heure, titre: d.titre.trim(), lieu: d.lieu.trim(), description: d.description.trim() };
            const existant = liste.find(x => x.id === Admin.editEvenement);
            if (existant) {
                Object.assign(existant, champs);
                delete existant.cle; // texte personnalisé : n'utilise plus la traduction
            } else {
                liste.push({ id: uid(), ...champs });
            }
            Store.set('evenements', liste);
            Admin.editEvenement = null;
            notifier(t('admin.toast_enregistre'));
            break;
        }
        case 'form-contenu': {
            if (!peut(u, 'contenu')) return;
            const contenu = {};
            CHAMPS_CONTENU.forEach(c => {
                const v = (d[c.cle] || '').trim();
                if (v && v !== t(c.i18n)) contenu[c.cle] = v; // seulement si modifié
            });
            Store.set('contenu', contenu);
            Store.set('dons', {
                objectif: Math.max(1, Number(d.objectif) || 1),
                amasse: Math.max(0, Number(d.amasse) || 0),
                donateurs: Math.max(0, Number(d.donateurs) || 0)
            });
            notifier(t('admin.toast_enregistre'));
            break;
        }
        case 'form-temoignage': {
            if (!peut(u, 'temoignages')) return;
            const liste = Store.get('temoignages');
            const champs = { nom: d.nom.trim(), role: d.role.trim(), texte: d.texte.trim() };
            const existant = liste.find(x => x.id === Admin.editTemoignage);
            if (existant) {
                Object.assign(existant, champs);
                delete existant.cle;
            } else {
                liste.push({ id: uid(), ...champs });
            }
            Store.set('temoignages', liste);
            Admin.editTemoignage = null;
            notifier(t('admin.toast_enregistre'));
            break;
        }
        case 'form-employe': {
            if (!estSuperAdmin(u)) return;
            const employes = Store.get('employes');
            employes.push({ id: uid(), nom: d.nom.trim(), poste: d.poste.trim(), courriel: d.courriel.trim(), role: d.role });
            Store.set('employes', employes);
            notifier(t('admin.toast_enregistre'));
            break;
        }
        case 'form-role': {
            if (!estSuperAdmin(u)) return;
            const permsChoisies = new FormData(form).getAll('perm');
            const permissions = {};
            PERMISSIONS.forEach(p => { permissions[p] = permsChoisies.includes(p); });
            const roles = Store.get('roles');
            roles.push({ id: 'r_' + uid(), nom: d.nom.trim(), permissions });
            Store.set('roles', roles);
            notifier(t('admin.toast_enregistre'));
            break;
        }
        default:
            return;
    }
    rendreAdmin();
}

function gererChangement(e) {
    const el = e.target;
    const u = utilisateur();
    if (!estSuperAdmin(u)) return;

    if (el.dataset.action === 'role-employe') {
        const employes = Store.get('employes');
        const cible = employes.find(x => x.id === el.dataset.id);
        if (!cible) return;
        const nbSuper = employes.filter(x => x.role === 'super_admin').length;
        if (cible.role === 'super_admin' && el.value !== 'super_admin' && nbSuper <= 1) {
            notifier(t('admin.erreur_dernier_super'));
            el.value = 'super_admin';
            return;
        }
        cible.role = el.value;
        Store.set('employes', employes);
        notifier(t('admin.toast_enregistre'));
        rendreAdmin();
    }

    if (el.dataset.action === 'permission') {
        const roles = Store.get('roles');
        const role = roles.find(r => r.id === el.dataset.role);
        if (!role || role.verrouille) return;
        role.permissions = role.permissions || {};
        role.permissions[el.dataset.perm] = el.checked;
        Store.set('roles', roles);
        notifier(t('admin.toast_enregistre'));
    }
}

document.addEventListener('DOMContentLoaded', () => surRendu(rendreAdmin));
