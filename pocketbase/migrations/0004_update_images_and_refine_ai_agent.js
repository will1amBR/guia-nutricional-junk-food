migrate(
  (app) => {
    // 1. Ensure catalog collection has 'imageUrl' alias field or ensure both imagem and imageUrl exist
    const catalogCol = app.findCollectionByNameOrId('catalog')
    if (!catalogCol.fields.getByName('imageUrl')) {
      catalogCol.fields.add(
        new TextField({
          name: 'imageUrl',
          required: false,
        }),
      )
      app.save(catalogCol)
    }

    // 2. High quality, mouth-watering images for each fast food / junk food item
    const productImages = {
      'Big Mac':
        'https://img.usecurling.com/p/800/600?q=big%20mac%20burger%20sesame%20bun&color=warm',
      Whopper:
        'https://img.usecurling.com/p/800/600?q=flame%20grilled%20whopper%20burger&color=warm',
      'Whopper Furioso':
        'https://img.usecurling.com/p/800/600?q=spicy%20bacon%20cheeseburger%20jalapeno&color=warm',
      'Whopper Jr.':
        'https://img.usecurling.com/p/800/600?q=single%20cheeseburger%20lettuce%20tomato&color=warm',
      'Quarto de Libra com Queijo':
        'https://img.usecurling.com/p/800/600?q=quarter%20pounder%20melted%20cheeseburger&color=warm',
      'Chicken McNuggets (10 Unidades com Molho Barbecue)':
        'https://img.usecurling.com/p/800/600?q=crispy%20golden%20chicken%20nuggets%20dip&color=warm',
      'Batata Frita Média':
        'https://img.usecurling.com/p/800/600?q=golden%20crispy%20french%20fries%20box&color=warm',
      'Refrigerante Cola Lata 350ml':
        'https://img.usecurling.com/p/800/600?q=ice%20cold%20cola%20soda%20glass&color=cold',
      'Pizza de Calabresa (Fatia)':
        'https://img.usecurling.com/p/800/600?q=pepperoni%20pizza%20melted%20cheese%20slice&color=warm',
      'Pizza Margherita Individual (Massa Pan)':
        'https://img.usecurling.com/p/800/600?q=margherita%20pizza%20basil%20pan%20crust&color=warm',
      'Sanduíche Frango Teriyaki 15cm':
        'https://img.usecurling.com/p/800/600?q=chicken%20teriyaki%20sub%20sandwich%20fresh&color=fresh',
      'Subway Carne Supreme 15cm':
        'https://img.usecurling.com/p/800/600?q=roast%20beef%20sub%20sandwich%20vegetables&color=fresh',
      'Balde de Frango Frito Crispy (2 Pedaços)':
        'https://img.usecurling.com/p/800/600?q=crispy%20fried%20chicken%20drumstick%20kfc&color=warm',
      'Sanduíche Kentucky Chicken Burger':
        'https://img.usecurling.com/p/800/600?q=crispy%20chicken%20breast%20burger%20mayo&color=warm',
      'Yakisoba Tradicional Grande (Box)':
        'https://img.usecurling.com/p/800/600?q=hot%20yakisoba%20noodles%20beef%20vegetables&color=warm',
      'Rolinho Primavera de Queijo (Unidade)':
        'https://img.usecurling.com/p/800/600?q=golden%20spring%20rolls%20crispy&color=warm',
      'Bloomin Onion (Porção 1/4)':
        'https://img.usecurling.com/p/800/600?q=blooming%20fried%20onion%20appetizer%20sauce&color=warm',
      'Ribs on the Barbie (1/2 Costela com Molho Barbecue)':
        'https://img.usecurling.com/p/800/600?q=glazed%20barbecue%20ribs%20smoked&color=warm',
      'Pastel de Carne com Queijo (Feira)':
        'https://img.usecurling.com/p/800/600?q=brazilian%20pastel%20deep%20fried%20golden&color=warm',
      'Caldo de Cana 400ml com Limão':
        'https://img.usecurling.com/p/800/600?q=sugar%20cane%20juice%20ice%20lime&color=fresh',
      'Açaí Tradicional 400ml com Leite Condensado e Paçoca':
        'https://img.usecurling.com/p/800/600?q=acai%20bowl%20banana%20granola%20sweet&color=fresh',
      'Açaí na Tigela 300ml com Banana e Granola':
        'https://img.usecurling.com/p/800/600?q=fresh%20acai%20bowl%20berries%20banana&color=fresh',
      'Esfiha de Carne':
        'https://img.usecurling.com/p/800/600?q=open%20meat%20sfiha%20arabic%20pastry&color=warm',
      'Coxinha de Frango com Catupiry':
        'https://img.usecurling.com/p/800/600?q=brazilian%20coxinha%20chicken%20fritter&color=warm',
      'Milkshake de Ovomaltine 300ml':
        'https://img.usecurling.com/p/800/600?q=creamy%20chocolate%20malt%20milkshake&color=cold',
      'Frappuccino Caramelo Grande':
        'https://img.usecurling.com/p/800/600?q=caramel%20frappuccino%20whipped%20cream&color=cold',
      'Prato Picanha Compacta com Fritas':
        'https://img.usecurling.com/p/800/600?q=grilled%20picanha%20steak%20french%20fries%20rice&color=warm',
    }

    // Update all existing items in catalog with the real appetizing photo
    for (const [nome, imgUrl] of Object.entries(productImages)) {
      try {
        const item = app.findFirstRecordByData('catalog', 'nome', nome)
        item.set('imagem', imgUrl)
        item.set('imageUrl', imgUrl)
        app.save(item)
      } catch (_) {}
    }

    // 3. Update the native AI agent prompt and rules with refined instructions (item 4 of task)
    try {
      $ai.agents.define(app, {
        slug: 'nutri-junk-assistant',
        name: 'Assistente Nutricional de Junk Food',
        description:
          'Especialista em escolhas inteligentes de fast food e doces, adaptadas às metas e registros diários do usuário.',
        systemPrompt:
          'Você é o Assistente Nutricional de Inteligência Artificial do Guia Nutricional de Junk Food. ' +
          'Suas diretrizes fundamentais:\n' +
          '1. TOM & ESTILO: Acolhedor, motivador, empático, direto e em português do Brasil. NUNCA faça discursos moralistas nem julgue o usuário por querer comer fast food ou doces. Respostas CURTAS e PRÁTICAS (máximo de 2 a 3 parágrafos objetivos ou tópicos sucintos). Evite parágrafos longos ou prolixos.\n' +
          '2. PERSONALIZAÇÃO OBRIGATÓRIA: SEMPRE consulte e considere o perfil do usuário (tipo de dieta, restrições alimentares como glúten/lactose, e condições de saúde como Hipertensão, Diabetes ou Colesterol) e o que ele já consumiu hoje no registro alimentar antes de responder.\n' +
          '3. RECOMENDAÇÃO CONCRETA COM NÚMEROS: Ao orientar sobre qualquer produto ou combinação, SEMPRE traga números concretos (calorias, gramas de proteína, gordura e miligramas de sódio do item vs. meta restante do usuário no dia). Exemplo: "O Whopper Jr. tem 340 kcal e 560mg de sódio, cabendo com folga nas suas 750 kcal restantes de hoje".\n' +
          '4. CONDIÇÕES MÉDICAS & DIABETES/HIPERTENSÃO: Se o usuário tiver Hipertensão, alerte com rigor sobre itens com mais de 800-1000mg de sódio e sugira opções com menos sódio. Se tiver Diabetes Tipo 1 ou 2, alerte sobre açúcares simples e carboidratos de alto índice glicêmico (refrigerantes açucarados, milkshakes, açaí carregado no xarope).\n' +
          '5. DISCLAIMER & SEGURANÇA: Sempre que der uma orientação nutricional específica, inclua um disclaimer leve de que suas dicas têm caráter informativo e educacional e não substituem o acompanhamento de um médico ou nutricionista registrado. NUNCA prescreva planos alimentares terapêuticos ou faça diagnósticos médicos — nesses casos, instrua expressamente o usuário a consultar seu profissional de saúde.',
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
                'DIRETRIZES TÉCNICAS DO GUIA JUNK FOOD: ' +
                '1) Sódio seguro: hipertensos devem evitar ultrapassar 1500-2000mg no dia todo. Itens com mais de 1000mg de sódio em uma única porção exigem moderação urgente. ' +
                '2) Açúcar e Diabetes: diabéticos devem priorizar bebidas zero/água e evitar doces com mais de 25g de açúcar rápido. ' +
                '3) Proteína e Saciedade: para praticantes de treino ou emagrecimento, buscar opções com relação calorias/proteína favorável (>25g de proteína). ' +
                '4) Trocas estratégicas: trocar batata frita média por salada ou maçã, refri normal por água/refri zero, ou optar pela versão Jr./fatia única satisfaz a vontade com 50% menos calorias.',
            },
          },
          {
            type: 'faq',
            payload: {
              qa: [
                {
                  question: 'Posso comer pizza hoje à noite?',
                  answer:
                    'Sim! Se você tiver em torno de 500-600 kcal livres na sua meta, 2 fatias de pizza Margherita ou massa fina cabem com tranquilidade. Dica prática: beba 500ml de água para auxiliar na excreção do sódio e prefira refrigerante zero ou água mineral. *Lembre-se: esta sugestão é educativa e não substitui avaliação de seu nutricionista.*',
                },
                {
                  question: 'Estou no Burger King e quero carne, qual escolher?',
                  answer:
                    'Para equilíbrio calórico, o Whopper Jr. entrega 340 kcal e 14g de proteína com apenas 560mg de sódio. Já o Whopper clássico tem 677 kcal e 1120mg de sódio. Se estiver em déficit calórico estrito, vá de Whopper Jr. com água gelada! *Dica informativa, consulte seu médico/nutricionista para planos personalizados.*',
                },
              ],
            },
          },
        ],
      })
    } catch (agentErr) {
      console.log('Error updating agent in migration 0004:', agentErr)
    }
  },
  (app) => {
    // Revert logic
  },
)
