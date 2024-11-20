import {Collection, ImportDeclaration, ImportSpecifier, JSCodeshift} from "jscodeshift";

export function transformI18nImport(j: JSCodeshift, root: Collection) {
  const useI18nImports: Collection<ImportDeclaration> = root.find(j.ImportDeclaration, {
    source: {
        // value: 'vue-property-decorator'
        value: '@/plugins/i18n'
    }
  });

  if (useI18nImports.length > 0) {
    useI18nImports.remove();
    root.find(j.ImportDeclaration).at(-1).insertAfter(
      j.variableDeclaration('const',
          [j.variableDeclarator(
              j.identifier('{ t }'),
              j.callExpression(j.identifier('useI18n'), []))
          ]
      )
  );
  }
}