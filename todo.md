# Project TODO - Le Brief Media

- [x] Database schema: articles table (title, content, category, image, language, featured, publishedAt)
- [x] Database schema: categories table (name translations FR/EN/AR, slug, icon)
- [x] Database schema: events table (title, description, date, location, language)
- [x] Backend tRPC procedures: CRUD articles (create, list, get, update, delete)
- [x] Backend tRPC procedures: list categories
- [x] Backend tRPC procedures: CRUD events
- [x] Internationalization system (FR, EN, AR) with RTL support for Arabic
- [x] Language selector in navigation
- [x] Premium dark theme with black/white/gold/red color palette
- [x] Custom typography (Playfair Display + Inter)
- [x] Homepage hero section with animated logo and slogan
- [x] Breaking news ticker bar
- [x] Featured articles section ("À la une") with main + side layout
- [x] Articles grid and categories section on homepage
- [x] Navigation responsive (mobile hamburger + desktop nav with dropdown)
- [x] All magazine categories in navigation (Énergie, Économie, Investissements, Afrique, Moyen-Orient, etc.)
- [x] Article detail page with editorial layout, share buttons, related articles
- [x] Events/Agenda page with upcoming conferences
- [x] Footer with LinkedIn/Instagram links, newsletter signup, legal mentions
- [x] Admin panel: article creation form (title, content, category, image, language)
- [x] Admin panel: article list with edit/delete
- [x] Admin panel: event management
- [x] WhatsApp floating button
- [x] Smooth animations with Framer Motion
- [x] Mobile-first responsive design
- [x] Admin panel: events CRUD UI (tabs: Articles + Events)
- [x] About page with full company info from media kit
- [x] Newsletter subscriber with language preference (backend + footer form)
- [x] SEO: page title set in index.html
- [x] Hero section: améliorer avec effet glow sur le logo et meilleure visibilité
- [x] Section rubriques: icônes distinctes par catégorie
- [x] Cards articles: effet hover avec bordure dorée
- [x] Section stats: animation de comptage (count-up) avec hover scale
- [x] Système de recherche d'articles (SearchBar intégré en navbar)
- [x] Améliorer les animations d'entrée des sections (stagger)
- [x] Section "Ils nous font confiance" / Partenaires
- [x] Améliorer la page catégorie avec filtres
- [x] Modifier navbar: garder logo seulement en haut
- [x] Supprimer le "LE BRIEF" géant de la hero section - design inspiré Jeune Afrique
- [x] Affiner le design global avec le même style premium

## NOUVELLES TÂCHES MAJEURES

- [x] Tâche 1 : Supprimer slogan horizontal, créer version verticale avec Pétrole & Gaz, Renouvelables, Investissements, Portrait Eco
- [x] Tâche 2 : Supprimer espaces inutiles en haut de "À la Une" et partout sur le site
- [x] Tâche 3 : Enlever "Nos Rubriques" de la page, déplacer au menu, remplacer par articles
- [x] Tâche 4 : Créer section "Kiosque Journal" avec image format A4 du journal
- [x] Tâche 5 : Créer système de publicités (carrousel images/vidéos) avec admin panel pour upload
- [x] Tâche 6 : Créer rubrique magazine PDF téléchargeable avec aperçu, admin upload PDF
- [x] Tâche 7 : Tester tous les boutons et s'assurer qu'ils sont opérationnels
- [x] Tâche 8 : Implémenter newsletter email (RESTEZ INFORMÉ) avec notifications quotidiennes
- [x] Tâche 9 : Animation compteur chronogramme pour les chiffres
- [x] Tâche 10 : Widget prix pétrole/or/bourse en haut du site
- [x] Footer : Ajouter "Développé par BOOST AGENCY" avec lien


## TÂCHES COMPLÉMENTAIRES

- [x] Admin panel : structure avec 4 onglets (Articles, Événements, Publicités, Magazine)
- [x] Backend : routers tRPC pour publicités (CRUD + list)
- [x] Backend : routers tRPC pour magazines (CRUD + list)
- [ ] Admin panel : UI onglet Publicités avec list/create/edit/delete
- [ ] Admin panel : upload image/vidéo pour publicités avec stockage
- [ ] Admin panel : toggle activation/désactivation publicités
- [ ] Admin panel : UI onglet Magazine avec list/create/edit/delete
- [ ] Admin panel : upload PDF + couverture magazine avec stockage
- [ ] Upload d'images pour articles depuis l'admin
- [ ] Intégration email SendGrid/Mailgun
- [ ] Newsletter confirmation email aux abonnés
- [ ] Notification email au propriétaire (owner) pour nouveaux abonnés
- [ ] Envoi quotidien newsletter aux abonnés
- [ ] Tests complets des boutons critiques

## REDESIGN HOMEPAGE - PHASE ACTUELLE

- [x] Supprimer les 4 catégories verticales (Pétrole & Gaz, Renouvelables, Investissements, Portrait Eco)
- [x] Supprimer le texte "Intelligence stratégique pour les décideurs..."
- [x] Supprimer les boutons "Lire les actualités" et "Nos événements"
- [x] Implémenter nouvelle structure professionnelle et journalistique
- [x] Tester et valider sur tous les appareils
- [x] Ajouter sections "Analyses & Perspectives" et "Tendances Marché"
- [x] Mettre à jour les traductions FR/EN/AR

## NOUVELLES DEMANDES - PHASE ACTUELLE

- [x] Ajouter une section professionnelle en haut avant "À la une" (Édition du jour)
- [x] Ajouter 22 articles à la base de données
- [x] Vérifier que tous les articles s'affichent bien encadrés
- [x] Tester la responsivité sur tous les appareils
- [x] Section "Édition du jour" avec badges EN DIRECT et Vérifié
- [x] Tous les articles affichés avec images et descriptions

## AMÉLIORATIONS HOMEPAGE - NOUVELLE PHASE

- [x] Ajouter 30+ articles supplémentaires à la base de données (total 52 articles)
- [x] Afficher TOUS les articles sur la page (section "Analyses & Perspectives")
- [x] Ajouter section prix du pétrole, gaz et or
- [x] Corriger l'affichage des prix sur mobile et desktop (responsive)
- [x] Remplacer le texte vide par section prix des commodités
- [x] Corriger les sections Publicité et Magazine dans l'admin
- [x] Ajouter images à tous les 52 articles
- [x] Tester la page complète sur tous les appareils

## AFFICHAGE COMPLET DES ARTICLES - PHASE ACTUELLE

- [x] Augmenter la limite d'articles affiches de 20 a 1000
- [x] Verifier que TOUS les 54 articles publies avec images s'affichent
- [x] Affichage responsive sur mobile et desktop

## BUG - CHANGEMENT DE LANGUE - RÉSOLU

- [x] Corriger le probleme de changement de langue qui affiche des codes
- [x] Ajouter l'objet 'home' manquant en anglais et arabe dans i18n.ts
- [x] Verifier le composant Navbar pour le selecteur de langue
- [x] Verifier le contexte LanguageContext
- [x] Tester le changement de langue FR/EN/AR
- [x] Vérifier que tout fonctionne correctement en FR, EN et AR
