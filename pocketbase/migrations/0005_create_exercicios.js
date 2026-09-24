migrate(
  (app) => {
    // 1. Create exercicios collection
    const exercicios = new Collection({
      name: 'exercicios',
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
          name: 'tipo',
          type: 'text',
          required: true,
        },
        {
          name: 'duracao_min',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'intensidade',
          type: 'select',
          required: true,
          values: ['Leve', 'Moderada', 'Intensa'],
          maxSelect: 1,
        },
        {
          name: 'calorias_queimadas',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'data',
          type: 'date',
          required: true,
        },
        {
          name: 'observacao',
          type: 'text',
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_exercicios_usuario ON exercicios (usuario)',
        'CREATE INDEX idx_exercicios_data ON exercicios (data)',
      ],
    })
    app.save(exercicios)

    // 2. Add exercicios tool to AI agent if available
    try {
      $ai.agents.putTools(app, 'nutri-junk-assistant', [
        {
          collection: 'exercicios',
          perms: { list: true, read: true, create: true },
          actAs: 'admin',
          scopeFilter: 'usuario = @request.auth.id',
        },
      ])
    } catch (agentErr) {
      console.log('Note: could not update agent tools in migration 0005:', agentErr)
    }

    // 3. Seed 1-2 realistic sample exercises for William if user exists
    try {
      const william = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
      const today = new Date().toISOString().split('T')[0] + ' 12:00:00.000Z'

      try {
        app.findFirstRecordByData('exercicios', 'usuario', william.id)
      } catch (_) {
        const ex1 = new Record(exercicios)
        ex1.set('usuario', william.id)
        ex1.set('tipo', 'Musculação')
        ex1.set('duracao_min', 45)
        ex1.set('intensidade', 'Moderada')
        ex1.set('calorias_queimadas', 260)
        ex1.set('data', today)
        ex1.set('observacao', 'Treino de membros superiores')
        app.save(ex1)

        const ex2 = new Record(exercicios)
        ex2.set('usuario', william.id)
        ex2.set('tipo', 'Caminhada Rápida')
        ex2.set('duracao_min', 30)
        ex2.set('intensidade', 'Leve')
        ex2.set('calorias_queimadas', 135)
        ex2.set('data', today)
        ex2.set('observacao', 'Volta no parque após almoço')
        app.save(ex2)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      $ai.agents.deleteTools(app, 'nutri-junk-assistant', ['exercicios'])
    } catch (_) {}
    try {
      const col = app.findCollectionByNameOrId('exercicios')
      app.delete(col)
    } catch (_) {}
  },
)
