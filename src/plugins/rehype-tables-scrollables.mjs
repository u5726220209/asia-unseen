import { visit } from 'unist-util-visit';

/**
 * Enveloppe chaque tableau Markdown dans un conteneur qui défile.
 *
 * POURQUOI
 * Les tableaux sont ce que ce site a de plus utile : une grille tarifaire
 * d'opérateur, six bandes de taxi, neuf pays côte à côte. Ils sont aussi la
 * seule chose du contenu dont la largeur ne dépend pas du lecteur mais des
 * données — et 544 px de tableau dans une colonne de 330 px ne rétrécissent
 * pas, ils débordent.
 *
 * Le défaut ne se voit pas sur un écran d'ordinateur, et c'est pour cela qu'il
 * a tenu : trente-cinq tableaux sur vingt-quatre pages, dont toutes les
 * grilles tarifaires. Sur un téléphone étroit, la page entière se met à
 * glisser horizontalement — le texte sort du cadre à chaque paragraphe, et le
 * lecteur croit la page cassée parce qu'elle l'est.
 *
 * COMMENT, ET POURQUOI PAS EN CSS
 * Un `display: block; overflow-x: auto` sur le tableau lui-même aurait suffi
 * en une ligne. Il aurait aussi cessé de le faire se comporter comme un
 * tableau : les colonnes ne s'alignent plus sur leur contenu, et une grille
 * tarifaire dont les colonnes ne s'alignent pas ne vaut plus rien.
 *
 * On enveloppe donc, ce qui laisse le tableau être un tableau et donne le
 * défilement au conteneur. `tabindex` et `role` rendent la zone atteignable au
 * clavier : une zone qui défile et qu'on ne peut pas atteindre sans souris
 * n'est pas consultable pour tout le monde.
 *
 * LA CLASSE EXISTAIT DÉJÀ
 * `.table-wrap` est dans la feuille de style depuis l'ouverture, sous un
 * commentaire qui dit « scroll horizontal propre sur mobile ». Elle n'était
 * appliquée nulle part : le Markdown ne sait pas poser une classe sur un
 * conteneur qu'il ne crée pas. Le `min-w-[34rem]` posé sur les tableaux — les
 * 544 px mesurés — suppose ce conteneur, et l'attendait depuis le premier
 * jour. On ne crée donc pas une seconde classe : on branche celle-ci.
 */
export function rehypeTablesScrollables() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === null) return;
      // Déjà enveloppé — le plugin doit pouvoir repasser sans empiler.
      if (parent.type === 'element' && parent.properties?.dataTableScroll === '') return;

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: {
          'data-table-scroll': '',
          className: ['table-wrap'],
          tabIndex: 0,
          role: 'region',
          'aria-label': 'Tableau, défilement horizontal',
        },
        children: [node],
      };
    });
  };
}
