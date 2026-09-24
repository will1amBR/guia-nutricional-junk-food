migrate(
  (app) => {
    // 1. catalog collection
    const catalog = new Collection({
      name: 'catalog',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'categoria',
          type: 'select',
          required: true,
          values: ['Hamburguer', 'Pizza', 'Sanduiche', 'Fritura', 'Doce', 'Bebida', 'Outros'],
          maxSelect: 1,
        },
        { name: 'estabelecimento', type: 'text', required: true },
        { name: 'calorias', type: 'number', required: true },
        { name: 'proteina_g', type: 'number' },
        { name: 'carboidrato_g', type: 'number' },
        { name: 'gordura_g', type: 'number' },
        { name: 'gordura_saturada_g', type: 'number' },
        { name: 'gordura_trans_g', type: 'number' },
        { name: 'acucar_g', type: 'number' },
        { name: 'sodio_mg', type: 'number' },
        { name: 'fibra_g', type: 'number' },
        { name: 'imagem', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_catalog_categoria ON catalog (categoria)',
        'CREATE INDEX idx_catalog_calorias ON catalog (calorias)',
        'CREATE INDEX idx_catalog_estabelecimento ON catalog (estabelecimento)',
      ],
    })
    app.save(catalog)

    // 2. perfis collection
    const perfis = new Collection({
      name: 'perfis',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario.id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario.id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && usuario.id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario.id = @request.auth.id",
      fields: [
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'dieta_atual',
          type: 'select',
          values: ['Onivora', 'Vegetariana', 'Vegana', 'LowCarb', 'Cetogenica', 'SemRestricao'],
          maxSelect: 6,
        },
        {
          name: 'restricoes',
          type: 'select',
          values: [
            'SemGluten',
            'SemLactose',
            'SemFrutosDoMar',
            'IntoleranciaLactose',
            'AlergiaAmendoim',
            'AlergiaSoja',
          ],
          maxSelect: 6,
        },
        {
          name: 'condicoes',
          type: 'select',
          values: [
            'Hipertensao',
            'DiabetesTipo1',
            'DiabetesTipo2',
            'ColesterolAlto',
            'DoencaRenal',
            'Obesidade',
            'Nenhuma',
          ],
          maxSelect: 7,
        },
        { name: 'meta_calorias', type: 'number', required: true },
        { name: 'meta_proteina_pct', type: 'number', required: true },
        { name: 'meta_carboidrato_pct', type: 'number', required: true },
        { name: 'meta_gordura_pct', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_perfis_usuario ON perfis (usuario)'],
    })
    app.save(perfis)

    // 3. registros_alimentares collection
    const catalogCol = app.findCollectionByNameOrId('catalog')
    const registros = new Collection({
      name: 'registros_alimentares',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario.id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario.id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && usuario.id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario.id = @request.auth.id",
      fields: [
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'alimento',
          type: 'relation',
          required: true,
          collectionId: catalogCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        {
          name: 'refeicao',
          type: 'select',
          required: true,
          values: ['CafeDaManha', 'LancheDaManha', 'Almoco', 'LancheDaTarde', 'Jantar', 'Ceia'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_registros_usuario ON registros_alimentares (usuario)',
        'CREATE INDEX idx_registros_data ON registros_alimentares (data)',
        'CREATE INDEX idx_registros_refeicao ON registros_alimentares (refeicao)',
      ],
    })
    app.save(registros)
  },
  (app) => {
    try {
      const r = app.findCollectionByNameOrId('registros_alimentares')
      app.delete(r)
    } catch (_) {}
    try {
      const p = app.findCollectionByNameOrId('perfis')
      app.delete(p)
    } catch (_) {}
    try {
      const c = app.findCollectionByNameOrId('catalog')
      app.delete(c)
    } catch (_) {}
  },
)
