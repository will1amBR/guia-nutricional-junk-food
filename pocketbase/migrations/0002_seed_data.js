migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const catalogCol = app.findCollectionByNameOrId('catalog')
    const perfisCol = app.findCollectionByNameOrId('perfis')
    const registrosCol = app.findCollectionByNameOrId('registros_alimentares')

    // 1. Seed or find user william@korenambiental.com
    let userRecord
    try {
      userRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
    } catch (_) {
      userRecord = new Record(usersCol)
      userRecord.setEmail('william@korenambiental.com')
      userRecord.setPassword('Skip@Pass')
      userRecord.setVerified(true)
      userRecord.set('name', 'William')
      app.save(userRecord)
    }

    // 2. Seed profile for William
    try {
      app.findFirstRecordByData('perfis', 'usuario', userRecord.id)
    } catch (_) {
      const profile = new Record(perfisCol)
      profile.set('usuario', userRecord.id)
      profile.set('dieta_atual', ['Onivora'])
      profile.set('restricoes', [])
      profile.set('condicoes', ['Nenhuma'])
      profile.set('meta_calorias', 2200)
      profile.set('meta_proteina_pct', 25)
      profile.set('meta_carboidrato_pct', 50)
      profile.set('meta_gordura_pct', 25)
      app.save(profile)
    }

    // 3. Seed Catalog items (12 realistic junk foods)
    const items = [
      {
        nome: 'Big Mac',
        categoria: 'Hamburguer',
        estabelecimento: "McDonald's",
        calorias: 540,
        proteina_g: 25,
        carboidrato_g: 28,
        gordura_g: 35,
        gordura_saturada_g: 3,
        gordura_trans_g: 0.5,
        acucar_g: 5,
        sodio_mg: 950,
        fibra_g: 3,
        imagem: 'https://img.usecurling.com/p/800/600?q=burger%20mcdonalds',
      },
      {
        nome: 'Whopper',
        categoria: 'Hamburguer',
        estabelecimento: 'Burger King',
        calorias: 677,
        proteina_g: 28,
        carboidrato_g: 57,
        gordura_g: 38,
        gordura_saturada_g: 12,
        gordura_trans_g: 1,
        acucar_g: 11,
        sodio_mg: 1120,
        fibra_g: 4,
        imagem: 'https://img.usecurling.com/p/800/600?q=whopper%20burger',
      },
      {
        nome: 'Pizza de Calabresa (Fatia)',
        categoria: 'Pizza',
        estabelecimento: 'Pizza Hut',
        calorias: 280,
        proteina_g: 12,
        carboidrato_g: 30,
        gordura_g: 12,
        gordura_saturada_g: 5,
        gordura_trans_g: 0.2,
        acucar_g: 3,
        sodio_mg: 640,
        fibra_g: 2,
        imagem: 'https://img.usecurling.com/p/800/600?q=pepperoni%20pizza%20slice',
      },
      {
        nome: 'Batata Frita Média',
        categoria: 'Fritura',
        estabelecimento: "McDonald's",
        calorias: 365,
        proteina_g: 4,
        carboidrato_g: 48,
        gordura_g: 17,
        gordura_saturada_g: 2.5,
        gordura_trans_g: 0.1,
        acucar_g: 0.5,
        sodio_mg: 260,
        fibra_g: 4,
        imagem: 'https://img.usecurling.com/p/800/600?q=french%20fries',
      },
      {
        nome: 'Sanduíche Frango Teriyaki 15cm',
        categoria: 'Sanduiche',
        estabelecimento: 'Subway',
        calorias: 380,
        proteina_g: 26,
        carboidrato_g: 52,
        gordura_g: 6,
        gordura_saturada_g: 1.5,
        gordura_trans_g: 0,
        acucar_g: 14,
        sodio_mg: 820,
        fibra_g: 4,
        imagem: 'https://img.usecurling.com/p/800/600?q=subway%20sandwich',
      },
      {
        nome: 'Esfiha de Carne',
        categoria: 'Outros',
        estabelecimento: "Habib's",
        calorias: 155,
        proteina_g: 6,
        carboidrato_g: 18,
        gordura_g: 6.5,
        gordura_saturada_g: 2,
        gordura_trans_g: 0,
        acucar_g: 1.5,
        sodio_mg: 320,
        fibra_g: 1,
        imagem: 'https://img.usecurling.com/p/800/600?q=esfiha%20meat%20pastry',
      },
      {
        nome: 'Coxinha de Frango com Catupiry',
        categoria: 'Fritura',
        estabelecimento: "Habib's",
        calorias: 240,
        proteina_g: 8,
        carboidrato_g: 24,
        gordura_g: 12,
        gordura_saturada_g: 4,
        gordura_trans_g: 0.2,
        acucar_g: 1,
        sodio_mg: 480,
        fibra_g: 1.5,
        imagem: 'https://img.usecurling.com/p/800/600?q=coxinha%20croquette',
      },
      {
        nome: 'Milkshake de Ovomaltine 300ml',
        categoria: 'Doce',
        estabelecimento: "Bob's",
        calorias: 490,
        proteina_g: 9,
        carboidrato_g: 82,
        gordura_g: 14,
        gordura_saturada_g: 8,
        gordura_trans_g: 0.4,
        acucar_g: 68,
        sodio_mg: 290,
        fibra_g: 1.5,
        imagem: 'https://img.usecurling.com/p/800/600?q=chocolate%20milkshake',
      },
      {
        nome: 'Frappuccino Caramelo Grande',
        categoria: 'Bebida',
        estabelecimento: 'Starbucks',
        calorias: 420,
        proteina_g: 4,
        carboidrato_g: 66,
        gordura_g: 15,
        gordura_saturada_g: 10,
        gordura_trans_g: 0.3,
        acucar_g: 64,
        sodio_mg: 250,
        fibra_g: 0,
        imagem: 'https://img.usecurling.com/p/800/600?q=caramel%20frappuccino',
      },
      {
        nome: 'Refrigerante Cola Lata 350ml',
        categoria: 'Bebida',
        estabelecimento: "McDonald's",
        calorias: 149,
        proteina_g: 0,
        carboidrato_g: 37,
        gordura_g: 0,
        gordura_saturada_g: 0,
        gordura_trans_g: 0,
        acucar_g: 37,
        sodio_mg: 18,
        fibra_g: 0,
        imagem: 'https://img.usecurling.com/p/800/600?q=cola%20can%20soda',
      },
      {
        nome: 'Prato Picanha Compacta com Fritas',
        categoria: 'Outros',
        estabelecimento: 'Giraffas',
        calorias: 720,
        proteina_g: 42,
        carboidrato_g: 58,
        gordura_g: 34,
        gordura_saturada_g: 11,
        gordura_trans_g: 0.5,
        acucar_g: 2,
        sodio_mg: 1180,
        fibra_g: 5,
        imagem: 'https://img.usecurling.com/p/800/600?q=steak%20plate%20fries',
      },
      {
        nome: 'Açaí na Tigela 300ml com Banana e Granola',
        categoria: 'Doce',
        estabelecimento: 'Giraffas',
        calorias: 390,
        proteina_g: 5,
        carboidrato_g: 72,
        gordura_g: 10,
        gordura_saturada_g: 2.2,
        gordura_trans_g: 0,
        acucar_g: 45,
        sodio_mg: 65,
        fibra_g: 7,
        imagem: 'https://img.usecurling.com/p/800/600?q=acai%20bowl%20fruits',
      },
    ]

    let firstSavedFoodId = null

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        const existing = app.findFirstRecordByData('catalog', 'nome', item.nome)
        if (!firstSavedFoodId) firstSavedFoodId = existing.id
      } catch (_) {
        const record = new Record(catalogCol)
        record.set('nome', item.nome)
        record.set('categoria', item.categoria)
        record.set('estabelecimento', item.estabelecimento)
        record.set('calorias', item.calorias)
        record.set('proteina_g', item.proteina_g)
        record.set('carboidrato_g', item.carboidrato_g)
        record.set('gordura_g', item.gordura_g)
        record.set('gordura_saturada_g', item.gordura_saturada_g)
        record.set('gordura_trans_g', item.gordura_trans_g)
        record.set('acucar_g', item.acucar_g)
        record.set('sodio_mg', item.sodio_mg)
        record.set('fibra_g', item.fibra_g)
        record.set('imagem', item.imagem)
        app.save(record)
        if (!firstSavedFoodId) firstSavedFoodId = record.id
      }
    }

    // 4. Seed sample registros_alimentares for today for William
    const todayStr = new Date().toISOString().split('T')[0] + ' 12:00:00.000Z'
    try {
      const existingLogs = app.findRecordsByFilter(
        'registros_alimentares',
        `usuario = "${userRecord.id}"`,
        '-created',
        1,
        0,
      )
      if (!existingLogs || existingLogs.length === 0) {
        if (firstSavedFoodId) {
          const sampleLog = new Record(registrosCol)
          sampleLog.set('usuario', userRecord.id)
          sampleLog.set('alimento', firstSavedFoodId)
          sampleLog.set('data', todayStr)
          sampleLog.set('refeicao', 'Almoco')
          app.save(sampleLog)
        }
      }
    } catch (_) {}
  },
  (app) => {
    // down logic is optional/handled by dropping collections in 0001
  },
)
