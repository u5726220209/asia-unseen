# Sources primaires à privilégier

Une source primaire est celle qui **produit** l'information, pas celle qui la relaie. Pour une règle de visa, c'est l'État concerné. Pour un tarif, c'est l'opérateur. Un blog qui cite un blog n'est pas une source.

## Formalités et sécurité

| Pays | Portail officiel |
| --- | --- |
| Tous | https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/ |
| Vietnam | https://evisa.gov.vn/ |
| Cambodge | https://www.evisa.gov.kh/ |
| Laos | https://laoevisa.gov.la/ |
| Indonésie | https://evisa.imigrasi.go.id/ |
| Corée du Sud | https://www.k-eta.go.kr/ |
| Japon | https://www.vjw.digital.go.jp/ et https://www.fr.emb-japan.go.jp/ |
| Philippines | https://etravel.gov.ph/ et https://immigration.gov.ph/ |
| Thaïlande | https://www.mfa.go.th/en/publicservice/visa |
| Chine | http://fr.china-embassy.gov.cn/ et https://bio.visaforchina.cn/ |

## Santé

Institut Pasteur (recommandations vaccinales par destination) et la fiche « santé » de chaque pays sur France Diplomatie. Pour tout ce qui touche au médical, le site **oriente** vers un centre de vaccinations internationales ; il ne donne jamais d'avis médical, de posologie ou de recommandation personnalisée.

## Tarifs et horaires

Toujours le site de l'opérateur : compagnie ferroviaire nationale, compagnie aérienne, gestionnaire du site touristique. Les agrégateurs donnent un ordre de grandeur, pas un tarif officiel.

## Ce qu'il ne faut jamais citer comme source

- Les sites intermédiaires de visa qui achètent de la publicité sur « visa + pays » — ils surfacturent une démarche officielle et leurs informations sont souvent périmées.
- Les forums et les commentaires, pour un fait daté.
- Un autre blog de voyage, même bien classé.
- Le contenu généré par une IA sans source, quelle qu'elle soit.

## Comment citer dans l'article

Pour un guide, remplissez le bloc `sources` du frontmatter — il alimente le bandeau « Informations vérifiées en … » affiché en bas de page :

```yaml
sources:
  - { label: "Portail e-visa officiel du Vietnam", url: "https://evisa.gov.vn/" }
```

Dans le corps du texte, un lien Markdown vers la source primaire suffit. Le plugin de build ajoute automatiquement `rel="noopener noreferrer"` et l'ouverture en nouvel onglet.
