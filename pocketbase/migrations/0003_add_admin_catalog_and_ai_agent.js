migrate(
  (app) => {
    // 1. Add is_admin field to users collection
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('is_admin')) {
      usersCol.fields.add(
        new BoolField({
          name: 'is_admin',
          required: false,
        }),
      )
      app.save(usersCol)
    }

    // Ensure william@korenambiental.com is admin
    try {
      const will = app.findAuthRecordByEmail('_pb_users_auth_', 'william@korenambiental.com')
      will.set('is_admin', true)
      app.save(will)
    } catch (_) {}

    // 2. Allow authenticated users who are admin to create, update and delete in catalog
    const catalogCol = app.findCollectionByNameOrId('catalog')
    catalogCol.createRule = "@request.auth.id != '' && @request.auth.is_admin = true"
    catalogCol.updateRule = "@request.auth.id != '' && @request.auth.is_admin = true"
    catalogCol.deleteRule = "@request.auth.id != '' && @request.auth.is_admin = true"
    // Also allow public viewing of catalog so LP and visitors can check foods
    catalogCol.listRule = ''
    catalogCol.viewRule = ''
    app.save(catalogCol)

    // 3. Seed new restaurants & popular Brazilian fast food items
    // (McDonald's, Burger King, KFC, China in Box, Subway, Outback, Pizza Hut, Açaí / Pastel de Feira, Habib's, Bob's, Giraffas, Starbucks)
    const newItems = [
      {
        nome: 'Whopper Furioso',
        categoria: 'Hamburguer',
        estabelecimento: 'Burger King',
        calorias: 840,
        proteina_g: 34,
        carboidrato_g: 62,
        gordura_g: 50,
        gordura_saturada_g: 16,
        gordura_trans_g: 1.2,
        acucar_g: 14,
        sodio_mg: 1450,
        fibra_g: 4,
        imagem: 'https://img.usecurling.com/p/800/600?q=spicy%20burger%20bacon',
      },
      {
        nome: 'Whopper Jr.',
        categoria: 'Hamburguer',
        estabelecimento: 'Burger King',
        calorias: 340,
        proteina_g: 14,
        carboidrato_g: 29,
        gordura_g: 19,
        gordura_saturada_g: 6,
        gordura_trans_g: 0.5,
        acucar_g: 6,
        sodio_mg: 560,
        fibra_g: 2,
        imagem: 'https://img.usecurling.com/p/800/600?q=cheeseburger',
      },
      {
        nome: 'Balde de Frango Frito Crispy (2 Pedaços)',
        categoria: 'Fritura',
        estabelecimento: 'KFC',
        calorias: 520,
        proteina_g: 38,
        carboidrato_g: 22,
        gordura_g: 31,
        gordura_saturada_g: 7,
        gordura_trans_g: 0.2,
        acucar_g: 0,
        sodio_mg: 1100,
        fibra_g: 1,
        imagem: 'https://img.usecurling.com/p/800/600?q=fried%20chicken%20crispy',
      },
      {
        nome: 'Sanduíche Kentucky Chicken Burger',
        categoria: 'Sanduiche',
        estabelecimento: 'KFC',
        calorias: 610,
        proteina_g: 30,
        carboidrato_g: 48,
        gordura_g: 32,
        gordura_saturada_g: 6,
        gordura_trans_g: 0.3,
        acucar_g: 8,
        sodio_mg: 1250,
        fibra_g: 2,
        imagem: 'https://img.usecurling.com/p/800/600?q=chicken%20burger',
      },
      {
        nome: 'Yakisoba Tradicional Grande (Box)',
        categoria: 'Outros',
        estabelecimento: 'China in Box',
        calorias: 780,
        proteina_g: 35,
        carboidrato_g: 96,
        gordura_g: 28,
        gordura_saturada_g: 5,
        gordura_trans_g: 0,
        acucar_g: 12,
        sodio_mg: 1850,
        fibra_g: 6,
        imagem: 'https://img.usecurling.com/p/800/600?q=yakisoba%20noodles',
      },
      {
        nome: 'Rolinho Primavera de Queijo (Unidade)',
        categoria: 'Fritura',
        estabelecimento: 'China in Box',
        calorias: 195,
        proteina_g: 6,
        carboidrato_g: 17,
        gordura_g: 11,
        gordura_saturada_g: 5,
        gordura_trans_g: 0.1,
        acucar_g: 1,
        sodio_mg: 380,
        fibra_g: 1,
        imagem: 'https://img.usecurling.com/p/800/600?q=spring%20roll%20cheese',
      },
      {
        nome: 'Bloomin Onion (Porção 1/4)',
        categoria: 'Fritura',
        estabelecimento: 'Outback',
        calorias: 480,
        proteina_g: 6,
        carboidrato_g: 45,
        gordura_g: 31,
        gordura_saturada_g: 7,
        gordura_trans_g: 0.4,
        acucar_g: 8,
        sodio_mg: 980,
        fibra_g: 4,
        imagem: 'https://img.usecurling.com/p/800/600?q=fried%20onion%20appetizer',
      },
      {
        nome: 'Ribs on the Barbie (1/2 Costela com Molho Barbecue)',
        categoria: 'Outros',
        estabelecimento: 'Outback',
        calorias: 690,
        proteina_g: 44,
        carboidrato_g: 36,
        gordura_g: 40,
        gordura_saturada_g: 14,
        gordura_trans_g: 0.5,
        acucar_g: 26,
        sodio_mg: 1320,
        fibra_g: 1.5,
        imagem: 'https://img.usecurling.com/p/800/600?q=bbq%20ribs',
      },
      {
        nome: 'Pastel de Carne com Queijo (Feira)',
        categoria: 'Fritura',
        estabelecimento: 'Pastelaria e Feira de Rua',
        calorias: 390,
        proteina_g: 13,
        carboidrato_g: 38,
        gordura_g: 21,
        gordura_saturada_g: 7,
        gordura_trans_g: 0.3,
        acucar_g: 2,
        sodio_mg: 620,
        fibra_g: 2,
        imagem: 'https://img.usecurling.com/p/800/600?q=brazilian%20pastel%20fried',
      },
      {
        nome: 'Caldo de Cana 400ml com Limão',
        categoria: 'Bebida',
        estabelecimento: 'Pastelaria e Feira de Rua',
        calorias: 260,
        proteina_g: 0.5,
        carboidrato_g: 65,
        gordura_g: 0,
        gordura_saturada_g: 0,
        gordura_trans_g: 0,
        acucar_g: 62,
        sodio_mg: 15,
        fibra_g: 0,
        imagem: 'https://img.usecurling.com/p/800/600?q=sugarcane%20juice',
      },
      {
        nome: 'Açaí Tradicional 400ml com Leite Condensado e Paçoca',
        categoria: 'Doce',
        estabelecimento: 'Açaí Concept & Lanchonetes',
        calorias: 560,
        proteina_g: 8,
        carboidrato_g: 92,
        gordura_g: 18,
        gordura_saturada_g: 6,
        gordura_trans_g: 0,
        acucar_g: 74,
        sodio_mg: 95,
        fibra_g: 6,
        imagem: 'https://img.usecurling.com/p/800/600?q=acai%20bowl%20granola%20sweet',
      },
      {
        nome: 'Quarto de Libra com Queijo',
        categoria: 'Hamburguer',
        estabelecimento: "McDonald's",
        calorias: 520,
        proteina_g: 30,
        carboidrato_g: 41,
        gordura_g: 26,
        gordura_saturada_g: 12,
        gordura_trans_g: 1,
        acucar_g: 9,
        sodio_mg: 1050,
        fibra_g: 3,
        imagem: 'https://img.usecurling.com/p/800/600?q=quarter%20pounder%20burger',
      },
      {
        nome: 'Chicken McNuggets (10 Unidades com Molho Barbecue)',
        categoria: 'Fritura',
        estabelecimento: "McDonald's",
        calorias: 420,
        proteina_g: 23,
        carboidrato_g: 26,
        gordura_g: 24,
        gordura_saturada_g: 4,
        gordura_trans_g: 0.1,
        acucar_g: 8,
        sodio_mg: 840,
        fibra_g: 1.5,
        imagem: 'https://img.usecurling.com/p/800/600?q=chicken%20nuggets',
      },
      {
        nome: 'Pizza Margherita Individual (Massa Pan)',
        categoria: 'Pizza',
        estabelecimento: 'Pizza Hut',
        calorias: 580,
        proteina_g: 22,
        carboidrato_g: 64,
        gordura_g: 26,
        gordura_saturada_g: 10,
        gordura_trans_g: 0.4,
        acucar_g: 6,
        sodio_mg: 1140,
        fibra_g: 4,
        imagem: 'https://img.usecurling.com/p/800/600?q=margherita%20pizza',
      },
      {
        nome: 'Subway Carne Supreme 15cm',
        categoria: 'Sanduiche',
        estabelecimento: 'Subway',
        calorias: 410,
        proteina_g: 24,
        carboidrato_g: 46,
        gordura_g: 14,
        gordura_saturada_g: 5,
        gordura_trans_g: 0.2,
        acucar_g: 6,
        sodio_mg: 920,
        fibra_g: 5,
        imagem: 'https://img.usecurling.com/p/800/600?q=beef%20subway%20sandwich',
      },
    ]

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i]
      try {
        app.findFirstRecordByData('catalog', 'nome', item.nome)
      } catch (_) {
        const rec = new Record(catalogCol)
        rec.set('nome', item.nome)
        rec.set('categoria', item.categoria)
        rec.set('estabelecimento', item.estabelecimento)
        rec.set('calorias', item.calorias)
        rec.set('proteina_g', item.proteina_g)
        rec.set('carboidrato_g', item.carboidrato_g)
        rec.set('gordura_g', item.gordura_g)
        rec.set('gordura_saturada_g', item.gordura_saturada_g)
        rec.set('gordura_trans_g', item.gordura_trans_g)
        rec.set('acucar_g', item.acucar_g)
        rec.set('sodio_mg', item.sodio_mg)
        rec.set('fibra_g', item.fibra_g)
        rec.set('imagem', item.imagem)
        app.save(rec)
      }
    }

    // 4. Define Skip Cloud native AI agent for Nutritional Junk Food Assistant
    try {
      $ai.agents.define(app, {
        slug: 'nutri-junk-assistant',
        name: 'Assistente Nutricional de Junk Food',
        description:
          'Especialista em orientar escolhas de junk food baseando-se no perfil, metas calóricas/macros e histórico alimentar do usuário.',
        systemPrompt:
          'Você é o Assistente de Inteligência Artificial do Guia Nutricional de Junk Food. ' +
          'Seu papel é responder dúvidas de forma acolhedora, realista, inteligente e baseada em dados nutricionais. ' +
          'Você NUNCA julga o usuário por querer comer fast food ou doces. Em vez disso, seu objetivo é ajudá-lo a fazer a MELHOR escolha possível para o MOMENTO, ' +
          'considerando o perfil dele (dieta atual, restrições como glúten/lactose, condições de saúde como hipertensão ou diabetes, e metas de calorias e macros) ' +
          'e o que ele já consumiu hoje/na semana nos registros alimentares. ' +
          'Se o usuário perguntar por exemplo "Posso comer pizza hoje?" ou "Estou no Burger King e quero um sanduíche de carne, qual escolher? Whopper?", ' +
          'analise as opções disponíveis no catálogo (ou compare opções reais), avalie o impacto calórico, sódio, gorduras e proteínas, ' +
          'e dê orientações práticas (ex: porções recomendadas, substituições de acompanhamento como trocar batata grande por média ou salada, beber água ao invés de refri açucarado). ' +
          'Sempre responda em português brasileiro com tom empático, direto, construtivo e descontraído.',
        tier: 'fast',
        tools: [
          { collection: 'catalog', perms: { list: true, read: true } },
          {
            collection: 'perfis',
            perms: { list: true, read: true },
            actAs: 'admin',
            scopeFilter: 'usuario = @request.auth.id',
          },
          {
            collection: 'registros_alimentares',
            perms: { list: true, read: true },
            actAs: 'admin',
            scopeFilter: 'usuario = @request.auth.id',
          },
        ],
        memory: [
          {
            type: 'text',
            payload: {
              text:
                'Diretrizes nutricionais do app: 1) Equilíbrio sem culpa — flexibilidade calculada. ' +
                '2) Alimentos com mais de 1000mg de sódio devem ter cautela se o usuário tem hipertensão. ' +
                '3) Usuários diabéticos devem monitorar carboidratos simples e açúcares (refrigerantes e sobremesas). ' +
                '4) Para ganho de massa ou saciedade, priorizar itens com alta densidade proteica (>25g de proteína). ' +
                '5) No Burger King: o Whopper tradicional tem ~677 kcal e 28g de proteína; o Whopper Jr. tem ~340 kcal e 14g de proteína; o Whopper Furioso passa de 840 kcal. ' +
                "6) No McDonald's: Quarto de Libra tem 520 kcal e 30g de proteína; Big Mac tem 540 kcal e 25g de proteína.",
            },
          },
          {
            type: 'faq',
            payload: {
              qa: [
                {
                  question: 'Posso comer pizza hoje à noite?',
                  answer:
                    'Depende do seu saldo calórico restante no dia e das suas condições. Se sobram cerca de 600 kcal na sua meta, 2 fatias de pizza fina/margherita cabem perfeitamente. Dica: beba bastante água para balancear o sódio e acompanhe com água ou refri zero.',
                },
                {
                  question:
                    'Estou no Burger King e quero um sanduíche de carne, qual escolher? Whopper?',
                  answer:
                    'O Whopper clássico é uma boa pedida com 28g de proteína e 677 kcal. Se suas calorias do dia estão apertadas, o Whopper Jr. (340 kcal) entrega o mesmo sabor com metade do impacto. Evite a versão Furioso (840 kcal) com molhos pesados e bacon extra se o foco for déficit calórico.',
                },
              ],
            },
          },
        ],
      })
    } catch (err) {
      console.log('Error defining agent in migration:', err)
    }
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'nutri-junk-assistant')
    } catch (_) {}
  },
)
