# Plan d’animation de l’authentification ArchiFact

## Technologie retenue

Le meilleur choix pour cette interface React est **Motion for React** (`motion/react`), déjà présent dans le projet. Il permet de synchroniser les transitions avec l’état React, d’animer les SVG et de respecter `prefers-reduced-motion` sans ajouter de dépendance.

Le CSS/Tailwind reste utilisé pour les transitions simples : couleurs de focus, survols, ombres et états désactivés.

## Séquence de l’écran e-mail

L’animation métier est affichée sur desktop et sur mobile. Le panneau desktop utilise une version large ; le mobile affiche une version compacte au-dessus du formulaire afin de montrer immédiatement la promesse produit sans masquer la connexion.

1. **Entrée de la carte** : fondu + déplacement vertical de 20 px, durée 600 ms, courbe `easeOut`.
2. **Prise de vue** : un personnage tient un smartphone et le déplace légèrement comme s’il photographiait un devis ou une facture.
3. **Résultat rapide** : un éclair animé relie le téléphone au document final, sans ajouter de texte explicatif.
4. **Génération** : la carte de sortie affiche alternativement « Devis généré » et « Facture générée », puis un pictogramme d’envoi rappelle le partage au client.
5. **Ambiance** : deux halos bleus/teal restent discrets et trois points de couleur ont une pulsation décalée.
6. **Saisie e-mail** : le champ passe de gris à bleu, avec anneau de focus accessible.
7. **Flèche d’envoi** : invisible tant que le champ est vide ; apparition par fondu, translation horizontale et légère mise à l’échelle dès qu’un caractère est saisi. Elle reste désactivée jusqu’à la validation du format e-mail.
8. **Chargement** : la flèche devient un spinner sans modifier la hauteur du champ.

## Séquence OTP

1. Le panneau e-mail sort vers la gauche et le panneau OTP entre depuis la droite.
2. Le champ OTP utilise une couleur bleue claire et un contraste élevé pour guider la saisie.
3. Le bouton de validation garde une transition courte au survol et un état de chargement stable.
4. Les erreurs apparaissent en fondu avec un déplacement vertical de 5 px.

## Règles UX et accessibilité

- Les animations ne doivent jamais bloquer l’envoi ou la validation.
- L’apparition de la flèche ne doit pas provoquer de déplacement du champ.
- `prefers-reduced-motion` doit désactiver les mouvements décoratifs continus.
- Les éléments interactifs conservent un focus visible et un libellé accessible.
- Les animations décoratives restent secondaires au formulaire et ne doivent pas dépasser 6 secondes en boucle.

## Évolutions possibles

- Remplacer l’illustration CSS actuelle par un SVG métier animé avec `pathLength` pour dessiner progressivement un devis.
- Ajouter une micro-animation de succès après la validation OTP.
- Instrumenter les durées de chargement et les erreurs d’authentification sans enregistrer l’adresse e-mail.
