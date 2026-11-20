/**
 * Éditions quotidiennes rédigées par la rédaction de LE BRIEF.
 *
 * Chaque article listé ici est inséré automatiquement (une seule fois, repéré
 * par son titre français) dans la table `articles` lors de la première lecture
 * des articles publiés. Pour publier une nouvelle édition, ajouter ses articles
 * au tableau `EDITORIAL_EDITION_ARTICLES`.
 */

export type EditorialCategorySlug =
  | "energie"
  | "petrole-gaz"
  | "renouvelables"
  | "economie"
  | "investissements"
  | "afrique"
  | "moyen-orient"
  | "geopolitique";

export type EditorialEditionArticle = {
  edition: string;
  categorySlug: EditorialCategorySlug;
  titleFr: string;
  excerptFr: string;
  contentFr: string;
  imageUrl: string;
  sourceName: string;
  sourceUrl?: string;
  tags: string;
  metaDescription: string;
  featured: boolean;
  publishedAt: Date;
};

const EDITION_2026_11_20 = "2026-11-20";
const MEDIA_2026_11_20 = "/media/editions/2026-11-20";

// Heures de publication échelonnées pour conserver l'ordre éditorial de l'édition
// (l'article « À la une » est le plus récent).
const at = (time: string) => new Date(`2026-11-20T${time}:00+00:00`);

export const EDITORIAL_EDITION_ARTICLES: EditorialEditionArticle[] = [
  {
    edition: EDITION_2026_11_20,
    categorySlug: "petrole-gaz",
    titleFr:
      "Sénégal - Mauritanie : BP envisagerait de céder sa participation de 56 % et son rôle d'opérateur dans le projet gazier GTA",
    excerptFr:
      "Selon des informations de LE BRIEF, le groupe britannique étudierait la cession de sa participation majoritaire dans Grand Tortue Ahmeyim, tout en conservant la commercialisation des cargaisons de GNL.",
    contentFr: `À LA UNE

BP envisagerait de céder sa participation de 56 % et son rôle d'opérateur dans le projet gazier Grand Tortue Ahmeyim (GTA), partagé entre la Mauritanie et le Sénégal. Selon des informations de LE BRIEF.

Cette éventuelle cession s'inscrirait dans la volonté du groupe britannique de réduire son endettement et de limiter ses dépenses futures. L'expansion de GTA nécessiterait de nouveaux investissements.

BP pourrait toutefois conserver les droits de chargement et de commercialisation de l'ensemble des cargaisons de gaz naturel liquéfié produites sur le site. Le groupe pourrait ainsi céder sa participation et la conduite des opérations tout en maintenant son activité de vente du gaz.

Les premières exportations de GTA ont débuté en avril 2025. BP exploite actuellement le projet aux côtés de Kosmos Energy, de la Société mauritanienne des hydrocarbures (SMH) et de la société sénégalaise PETROSEN.

Une transaction resterait néanmoins complexe : selon LE BRIEF, les acquéreurs potentiels sont peu nombreux et la dimension transfrontalière du projet soulève des sensibilités politiques.`,
    imageUrl: `${MEDIA_2026_11_20}/bp-gta-senegal-mauritanie.jpg`,
    sourceName: "LE BRIEF — informations exclusives",
    tags: "Sénégal, Mauritanie, BP, GTA, GNL, Kosmos Energy, PETROSEN, SMH",
    metaDescription:
      "BP envisagerait de céder sa participation de 56 % et son rôle d'opérateur dans le projet gazier GTA entre le Sénégal et la Mauritanie, selon LE BRIEF.",
    featured: true,
    publishedAt: at("06:00"),
  },
  {
    edition: EDITION_2026_11_20,
    categorySlug: "investissements",
    titleFr:
      "Kenya : un consortium américain remporte le projet stratégique de terres rares de Mrima Hill",
    excerptFr:
      "Nairobi a sélectionné Frontier Minerals pour développer le gisement de terres rares et de niobium de Mrima Hill. Washington prend position sur les minerais critiques africains, mais l'attribution reste contestée.",
    contentFr: `Washington prend position sur les minerais critiques africains avec le projet Mrima Hill.

Le Kenya a sélectionné un consortium américain pour développer le gisement stratégique de Mrima Hill, riche en terres rares et en niobium. Cette décision constitue un nouveau développement dans la compétition internationale pour l'accès aux minerais nécessaires à l'industrie, à l'électronique et aux technologies de défense. L'attribution reste néanmoins contestée par deux candidats concurrents.

Publication : 19 novembre 2026 · Événement : attribution annoncée le 19 novembre · Pays : Kenya

Le gouvernement kényan a sélectionné Frontier Minerals pour développer le gisement de minerais critiques de Mrima Hill, dans le comté de Kwale, au sud-est du pays.

Le consortium rassemble notamment les entreprises américaines ReElement Technologies, American Resources Corporation et Bunker Hill. Il a été retenu à l'issue d'un appel d'offres qui avait initialement présélectionné sept candidats.

Le site contient des terres rares et du niobium, un métal utilisé notamment dans les alliages industriels et les applications aéronautiques. Selon les évaluations préliminaires évoquées par le ministère kényan des Mines, sa valeur potentielle pourrait atteindre plusieurs dizaines de milliards de dollars. Il ne s'agit toutefois pas d'une valorisation indépendante de réserves commercialement exploitables.

Le consortium prévoit de développer des capacités locales de traitement et de raffinage, conformément à la volonté de Nairobi de conserver une plus grande part de la valeur ajoutée des ressources minières.

Cette attribution présente également une dimension géopolitique. Les États-Unis cherchent à diversifier leurs approvisionnements en minerais critiques dans un secteur où la Chine conserve une position dominante dans la transformation industrielle.

Mais plusieurs obstacles demeurent. Frontier devra obtenir les autorisations de prospection et consulter les communautés locales. Mrima Hill se trouve dans une zone forestière considérée comme sacrée par certaines populations.

Deux consortiums concurrents, dont un groupe conduit par l'australien RareX, ont annoncé leur intention de contester la procédure d'attribution. Le gouvernement kényan affirme que le processus a été régulier.

L'attribution ne constitue donc ni un permis définitif d'exploitation ni une décision de construction. Les études techniques, les recours éventuels, les consultations communautaires et le financement devront encore être clarifiés.

Sources : Reuters, 19 novembre 2026 ; Africanews, 19 novembre 2026.`,
    imageUrl: `${MEDIA_2026_11_20}/kenya-mrima-hill-joho.jpg`,
    sourceName: "Reuters ; Africanews",
    tags: "Kenya, Mrima Hill, terres rares, niobium, minerais critiques, Frontier Minerals, États-Unis",
    metaDescription:
      "Le Kenya sélectionne le consortium américain Frontier Minerals pour développer le gisement de terres rares et de niobium de Mrima Hill. L'attribution est contestée.",
    featured: true,
    publishedAt: at("05:50"),
  },
  {
    edition: EDITION_2026_11_20,
    categorySlug: "economie",
    titleFr:
      "Sénégal : le budget rectificatif 2026 entre en vigueur sur fond de tensions autour des subventions énergétiques",
    excerptFr:
      "Le président Bassirou Diomaye Faye a mis en vigueur la loi de finances rectificative 2026 par décret, après un blocage parlementaire. Les subventions énergétiques restent au cœur des débats.",
    contentFr: `Publication : 19 novembre 2026 · Événement : décret du 19 novembre · Pays : Sénégal

Le président sénégalais Bassirou Diomaye Faye a mis en vigueur le projet de loi de finances rectificative pour 2026 par le décret n° 2026-2416 du 19 novembre, après un blocage parlementaire autour du texte.

La décision intervient dans un contexte de fortes discussions sur les arbitrages budgétaires, notamment les investissements publics, les dépenses sociales et les subventions énergétiques.

Les députés opposés au texte ont demandé que les ajustements budgétaires préservent les projets structurants dans les infrastructures, l'industrie, l'hydraulique et les services publics. Ils ont également insisté sur la nécessité de réduire durablement le coût de l'énergie sans transférer des charges supplémentaires aux ménages et aux entreprises.

Dans le secteur énergétique, les débats portent sur les conditions d'une éventuelle diminution des subventions. Les parlementaires concernés souhaitent qu'une telle évolution soit accompagnée d'une réduction de la fiscalité sur les produits pétroliers et d'une amélioration des coûts d'approvisionnement et de production électrique.

Ces questions sont particulièrement importantes alors que le Sénégal cherche à transformer ses ressources pétrolières et gazières en avantages économiques concrets.

Pour les investisseurs, le principal enjeu réside dans la prévisibilité des dépenses publiques et la continuité du financement des infrastructures.

Le décret représente un développement institutionnel nouveau. Il ne permet toutefois pas, à lui seul, de déterminer les montants définitifs alloués à chaque projet énergétique. Une analyse des tableaux budgétaires consolidés reste nécessaire.

Source : Sika Finance, 19 novembre 2026.`,
    imageUrl: `${MEDIA_2026_11_20}/senegal-diomaye-faye-budget.jpg`,
    sourceName: "Sika Finance",
    tags: "Sénégal, loi de finances rectificative, budget 2026, subventions énergétiques, Bassirou Diomaye Faye",
    metaDescription:
      "Le Sénégal met en vigueur par décret sa loi de finances rectificative 2026 après un blocage parlementaire, sur fond de débat sur les subventions énergétiques.",
    featured: false,
    publishedAt: at("05:40"),
  },
  {
    edition: EDITION_2026_11_20,
    categorySlug: "investissements",
    titleFr:
      "Côte d'Ivoire : SIREXE Invest veut transformer les rencontres du secteur extractif en projets financés",
    excerptFr:
      "Le ministre Mamadou Sangafowa-Coulibaly a lancé à Abidjan une plateforme destinée à rapprocher porteurs de projets extractifs et énergétiques et investisseurs. 54 rendez-vous d'affaires sont programmés.",
    contentFr: `Publication : 19 novembre 2026 · Événement : lancement du 19 novembre à Abidjan · Pays : Côte d'Ivoire / Botswana

Le ministre ivoirien des Mines, du Pétrole et de l'Énergie, Mamadou Sangafowa-Coulibaly, a lancé le 19 novembre à Abidjan la plateforme SIREXE Invest, destinée à rapprocher les porteurs de projets extractifs et énergétiques des investisseurs.

Le dispositif est présenté dans le cadre du Salon international des ressources extractives et de l'énergie, avec la participation de représentants du Botswana, pays à l'honneur de cette édition.

Pour cette première phase, 54 rendez-vous d'affaires sont programmés sur trois jours. Ils concernent des projets issus de Côte d'Ivoire et du Botswana.

L'objectif est d'améliorer l'accès aux capitaux et à l'expertise industrielle pour des projets dont les besoins peuvent varier considérablement selon leur maturité : prospection minière, développement de gisements, infrastructures énergétiques, transformation locale ou prestations de services.

La plateforme entend également faciliter le suivi des échanges après le Salon. Les parties sont invitées à formaliser leurs prochaines étapes afin d'éviter que les rencontres d'affaires ne restent sans suite.

Pour les petites et moyennes entreprises, le financement du contenu local représente un enjeu important. L'obtention d'un contrat industriel ne garantit pas toujours la disponibilité de la trésorerie nécessaire à son exécution.

SIREXE Invest pourrait contribuer à rapprocher ces entreprises des banques, fonds d'investissement et partenaires techniques.

Il convient cependant de distinguer les rendez-vous programmés des financements effectivement engagés. Aucun volume global de capitaux levés n'est confirmé à ce stade.

Source : Sika Finance, 19 novembre 2026.`,
    imageUrl: `${MEDIA_2026_11_20}/cote-ivoire-sirexe.jpg`,
    sourceName: "Sika Finance",
    tags: "Côte d'Ivoire, Botswana, SIREXE, SIREXE Invest, mines, contenu local, investissements",
    metaDescription:
      "La Côte d'Ivoire lance SIREXE Invest pour rapprocher porteurs de projets extractifs et énergétiques et investisseurs : 54 rendez-vous d'affaires programmés à Abidjan.",
    featured: false,
    publishedAt: at("05:30"),
  },
  {
    edition: EDITION_2026_11_20,
    categorySlug: "petrole-gaz",
    titleFr:
      "Nigeria : TotalEnergies prépare un forage d'exploration à proximité des installations d'Akpo",
    excerptFr:
      "Le puits Akpo Far East (AFE-1X) doit évaluer de nouvelles cibles en eaux profondes près du champ d'Akpo, où un raccordement aux infrastructures existantes réduirait les coûts en cas de découverte.",
    contentFr: `Publication : 19 novembre 2026 · Date exacte de démarrage du forage : non confirmée · Pays : Nigeria

TotalEnergies prépare le forage d'exploration Akpo Far East, désigné AFE-1X, dans les eaux profondes du Nigeria.

Le puits vise à identifier des ressources supplémentaires à proximité du champ d'Akpo, où des infrastructures pétrolières sont déjà en exploitation, notamment une unité flottante de production, de stockage et de déchargement.

Le programme s'inscrit dans une campagne plus large menée autour des champs Akpo et Egina, avec la participation de Meren Energy.

Le navire de forage Noble BlackRhino a été mobilisé pour cette campagne. Les opérations doivent permettre d'évaluer de nouvelles cibles géologiques et de soutenir le renouvellement des réserves.

L'intérêt industriel d'Akpo Far East réside dans sa proximité avec les installations existantes. En cas de découverte commerciale, un raccordement sous-marin aux infrastructures d'Akpo pourrait réduire les investissements nécessaires par rapport à un développement entièrement autonome.

Cette approche est fréquemment utilisée dans les bassins pétroliers matures pour prolonger la durée de vie des installations et améliorer la rentabilité des ressources voisines.

Le programme ne constitue cependant pas l'annonce d'une découverte. Les résultats du forage devront confirmer la présence d'hydrocarbures, leur quantité et leur potentiel économique.

Ce dossier est distinct de l'accord TotalEnergies/Vaaris déjà publié dans une édition antérieure de LE BRIEF.

Source : African Energy Council, 19 novembre 2026.`,
    imageUrl: `${MEDIA_2026_11_20}/nigeria-fpso-akpo.jpg`,
    sourceName: "African Energy Council",
    tags: "Nigeria, TotalEnergies, Akpo, Akpo Far East, Egina, Meren Energy, forage, offshore",
    metaDescription:
      "TotalEnergies prépare le forage d'exploration Akpo Far East (AFE-1X) en eaux profondes au Nigeria, à proximité des installations du champ d'Akpo.",
    featured: false,
    publishedAt: at("05:20"),
  },
  {
    edition: EDITION_2026_11_20,
    categorySlug: "energie",
    titleFr:
      "Cameroun : un projet de centrale électrique au gaz de 300 MW envisagé autour du port de Douala",
    excerptFr:
      "Le Port autonome de Douala et le groupe chinois CMC sont associés à un accord d'environ un milliard de dollars incluant une centrale à gaz de 300 MW. Financement et calendrier restent à confirmer.",
    contentFr: `Publication : 19 novembre 2026, selon le fil d'actualité consulté · Pays : Cameroun

Le Port autonome de Douala et le groupe chinois CMC sont associés à un accord présenté par Prospect comme portant sur un investissement d'environ un milliard de dollars, comprenant un projet de centrale électrique au gaz de 300 MW.

L'initiative viserait à renforcer les infrastructures énergétiques et industrielles autour de l'un des principaux pôles logistiques du Cameroun.

L'approvisionnement électrique constitue un facteur essentiel pour les activités portuaires, les entreprises de transformation et les installations industrielles situées dans la région de Douala.

Une centrale au gaz de cette capacité pourrait contribuer à diversifier les sources de production électrique et à soutenir les besoins croissants des activités économiques, sous réserve d'un approvisionnement gazier fiable et d'un raccordement adapté au réseau.

L'annonce doit toutefois être appréciée avec prudence. Le montant d'un milliard de dollars ne peut pas être attribué intégralement à la seule centrale sans examen de la ventilation des investissements. Les conditions de financement, le calendrier de réalisation et les modalités contractuelles nécessitent également une confirmation.

À ce stade, l'information porte sur un accord de développement, et non sur une centrale déjà en construction ou une capacité électrique disponible.

Source : Prospect, fil d'actualité du 19 novembre 2026.`,
    imageUrl: `${MEDIA_2026_11_20}/cameroun-douala-cmc-signature.jpg`,
    sourceName: "Prospect",
    tags: "Cameroun, Douala, Port autonome de Douala, CMC, Chine, centrale à gaz, électricité",
    metaDescription:
      "Le Port autonome de Douala et le groupe chinois CMC associés à un accord d'environ 1 milliard de dollars incluant une centrale électrique au gaz de 300 MW.",
    featured: false,
    publishedAt: at("05:10"),
  },
  {
    edition: EDITION_2026_11_20,
    categorySlug: "petrole-gaz",
    titleFr:
      "Libye : Repsol et ses partenaires préparent une campagne sismique en eaux profondes pour 2027",
    excerptFr:
      "Un consortium conduit par Repsol, avec TPAO et MOL, prévoit des études sismiques sur le bloc offshore 22 au deuxième trimestre 2027, nouvelle étape préparatoire de l'exploration offshore libyenne.",
    contentFr: `Publication : 19 novembre 2026, selon le fil consulté · Événement prévu : deuxième trimestre 2027 · Pays : Libye

Un consortium conduit par Repsol, avec la participation de TPAO et de MOL, prévoit de lancer une campagne d'études sismiques en eaux profondes sur le bloc offshore 22 en Libye au deuxième trimestre 2027.

L'annonce marque une nouvelle étape préparatoire dans l'exploration du potentiel pétrolier et gazier offshore libyen.

Les études sismiques permettent d'obtenir des images des structures géologiques situées sous le fond marin. Elles servent à identifier les zones présentant un potentiel en hydrocarbures et à sélectionner d'éventuelles cibles de forage.

Pour la Libye, l'intérêt réside dans la possibilité d'attirer des investissements internationaux et de renouveler ses perspectives de production au-delà des champs déjà exploités.

Le retour de compagnies internationales sur des programmes d'exploration peut également contribuer à mobiliser des prestataires spécialisés dans les services géophysiques, les opérations maritimes et l'ingénierie.

Cependant, une campagne sismique n'est pas un forage d'exploration et ne démontre pas l'existence d'un gisement commercial.

La réalisation effective du programme dépendra des conditions opérationnelles, des autorisations et du calendrier retenu par les partenaires.

Source : Prospect, 19 novembre 2026.`,
    imageUrl: `${MEDIA_2026_11_20}/libye-tpao-sismique.jpg`,
    sourceName: "Prospect",
    tags: "Libye, Repsol, TPAO, MOL, sismique, offshore, exploration, bloc 22",
    metaDescription:
      "Un consortium Repsol-TPAO-MOL prévoit une campagne sismique en eaux profondes sur le bloc offshore 22 en Libye au deuxième trimestre 2027.",
    featured: false,
    publishedAt: at("05:00"),
  },
  {
    edition: EDITION_2026_11_20,
    categorySlug: "petrole-gaz",
    titleFr:
      "Libye : la National Oil Corporation pourrait connaître une importante réorganisation de sa direction",
    excerptFr:
      "Selon une enquête d'Africa Intelligence, un remaniement se prépare au sein de la NOC. Noms, nature des changements et calendrier ne sont pas confirmés à ce stade.",
    contentFr: `Publication : 19 novembre 2026 · Pays : Libye

Une réorganisation importante se prépare au sein de la National Oil Corporation (NOC), la compagnie pétrolière nationale libyenne, selon une enquête publiée le 19 novembre par Africa Intelligence.

La NOC occupe une place centrale dans la gestion de la production pétrolière, des partenariats avec les compagnies internationales et des exportations d'hydrocarbures du pays.

Toute modification majeure de sa gouvernance pourrait avoir des conséquences sur la conduite des projets, les relations contractuelles et les décisions d'investissement.

La Libye cherche à renforcer l'activité de son secteur pétrolier, qui demeure essentiel à ses recettes publiques et à ses ressources en devises.

Dans ce contexte, la stabilité institutionnelle de la compagnie nationale représente un élément important pour les opérateurs internationaux, notamment ceux engagés dans l'exploration et la remise à niveau des infrastructures.

L'enquête signale la perspective d'un remaniement, mais les informations publiques accessibles ne permettent pas de confirmer les noms des dirigeants concernés, la nature exacte des changements ou leur calendrier.

Il serait donc prématuré de présenter cette réorganisation comme une décision déjà exécutée.

Source : Africa Intelligence, rubrique Énergie, 19 novembre 2026.`,
    imageUrl: `${MEDIA_2026_11_20}/libye-noc-siege.jpg`,
    sourceName: "Africa Intelligence",
    tags: "Libye, NOC, National Oil Corporation, gouvernance, pétrole",
    metaDescription:
      "Une importante réorganisation de la direction se préparerait au sein de la National Oil Corporation (NOC) libyenne, selon Africa Intelligence.",
    featured: false,
    publishedAt: at("04:50"),
  },
];
