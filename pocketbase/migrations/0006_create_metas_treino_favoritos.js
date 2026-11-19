migrate(
  (app) => {
    // 1. Create metas_treino collection (meta de treino recorrente semanal)
    const metasTreino = new Collection({
      name: 'metas_treino',
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
          name: 'tipo_objetivo',
          type: 'select',
          required: true,
          values: ['minutos', 'calorias'],
          maxSelect: 1,
        },
        {
          name: 'valor_alvo',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'ativa',
          type: 'bool',
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_metas_treino_usuario ON metas_treino (usuario)',
        'CREATE UNIQUE INDEX idx_metas_treino_usuario_ativa ON metas_treino (usuario) WHERE ativa = 1',
      ],
    })
    app.save(metasTreino)

    // 2. Create favoritos collection
    const catalogCollection = app.findCollectionByNameOrId('catalog')
    const favoritos = new Collection({
      name: 'favoritos',
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
          collectionId: catalogCollection.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_favoritos_usuario ON favoritos (usuario)',
        'CREATE UNIQUE INDEX idx_favoritos_usuario_alimento ON favoritos (usuario, alimento)',
      ],
    })
    app.save(favoritos)

    // 3. Grant read access to the AI agent for the new collections
    try {
      $ai.agents.putTools(app, 'nutri-junk-assistant', [
        {
          collection: 'metas_treino',
          perms: { list: true, read: true },
          actAs: 'admin',
          scopeFilter: 'usuario = @request.auth.id',
        },
        {
          collection: 'favoritos',
          perms: { list: true, read: true },
          actAs: 'admin',
          scopeFilter: 'usuario = @request.auth.id',
        },
      ])
    } catch (agentErr) {
      console.log('Note: could not update agent tools in migration 0006:', agentErr)
    }
  },
  (app) => {
    try {
      $ai.agents.deleteTools(app, 'nutri-junk-assistant', ['metas_treino', 'favoritos'])
    } catch (_) {}
    try {
      const favoritos = app.findCollectionByNameOrId('favoritos')
      app.delete(favoritos)
    } catch (_) {}
    try {
      const metasTreino = app.findCollectionByNameOrId('metas_treino')
      app.delete(metasTreino)
    } catch (_) {}
  },
)
