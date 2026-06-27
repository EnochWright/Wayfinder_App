// Container board game – AI player logic

// ── Main entry: plan + execute full AI turn ───────────────────────────────────
// Returns { steps: [{title, instructions}], triggerDelivery: bool }
function aiTakeTurn(state, aiId) {
  const steps = [];
  let triggerDelivery = false;

  for (let i = 0; i < 2; i++) {
    if (state.actionsLeft <= 0) break;
    if (state.phase === 'delivery_auction') break;
    if (state.gameOver) break;

    const action = aiChooseAction(state, aiId);
    if (!action) break;

    // Generate instructions BEFORE execution (state is still pre-action)
    const desc = aiDescribeAction(state, aiId, action);

    const result = aiExecuteAction(state, aiId, action);
    if (!result) break;

    steps.push(desc);

    if (result.triggerDelivery) {
      triggerDelivery = true;
      break;
    }
  }

  if (steps.length === 0) {
    steps.push({
      title: 'No Actions Available',
      instructions: ['Automa cannot take any valid action — turn passes to the next player.']
    });
  }

  return { steps, triggerDelivery };
}

// ── Action selection ──────────────────────────────────────────────────────────

function aiChooseAction(state, aiId) {
  const scored = scoreActions(state, aiId);
  for (const { action } of scored) {
    if (canExecuteAction(state, aiId, action)) return action;
  }
  return null;
}

function scoreActions(state, aiId) {
  const ai = state.players[aiId];
  const actions = [];

  // ── SAIL to island if ship has containers ────────────────────────────────
  if (ai.shipLocation === 'ocean' && ai.shipContainers.length > 0) {
    const score = ai.shipContainers.length >= 3 ? 90 : 55;
    actions.push({ score, action: { type: 'sail', dest: 'island' } });
  }

  // ── SAIL to bank if holding area has containers to load ──────────────────
  if (ai.shipLocation === 'ocean') {
    const holding = (state.bank.holdingAreas[aiId] || []);
    const shipRoom = SHIP_CAPACITY - ai.shipContainers.length;
    if (holding.length > 0 && shipRoom > 0) {
      // High priority: holding containers are already bought, just need pickup
      const score = holding.length >= 3 ? 85 : 70;
      actions.push({ score, action: { type: 'sail', dest: 'bank' } });
    }
  }

  // ── SAIL to ocean (when docked) ──────────────────────────────────────────
  if (ai.shipLocation !== 'ocean') {
    // Score based on how loaded the ship is – fuller = more urgent to leave
    const n = ai.shipContainers.length;
    const score = n >= 3 ? 80 : n >= 1 ? 50 : 32;
    actions.push({ score, action: { type: 'sail', dest: 'ocean' } });
  }

  // ── HARBOR PURCHASE while docked at an opponent harbor ───────────────────
  if (typeof ai.shipLocation === 'number') {
    const seller = state.players[ai.shipLocation];
    const room = SHIP_CAPACITY - ai.shipContainers.length;
    const canAfford = affordableHarborContainers(seller, ai.cash, room, ai, state.containerSupply).length > 0;
    if (canAfford && room > 0) {
      actions.push({ score: 72, action: { type: 'harbor_buy' } });
    }
  }

  // ── SAIL to the best opponent harbor ─────────────────────────────────────
  if (ai.shipLocation === 'ocean' && ai.shipContainers.length < SHIP_CAPACITY) {
    const bestHarbor = findBestHarbor(state, aiId);
    if (bestHarbor !== null) {
      // Verify AI can afford at least one container there
      const seller = state.players[bestHarbor];
      const cheapest = seller.harborLots
        .filter(l => l.containers.length > 0)
        .reduce((min, l) => Math.min(min, l.price), Infinity);
      if (isFinite(cheapest) && ai.cash >= cheapest) {
        actions.push({ score: 65, action: { type: 'sail', dest: bestHarbor } });
      }
    }
  }

  // ── FACTORY PURCHASE (buy from opponent factories into own harbor) ────────
  const harborRoom = harborLimit(ai) - countHarbor(ai);
  if (harborRoom > 0) {
    const bestFactory = findBestFactoryToBuyFrom(state, aiId);
    if (bestFactory !== null) {
      const seller = state.players[bestFactory];
      const toBuy = affordableFactoryContainers(seller, ai.cash, harborRoom, ai, state.containerSupply);
      if (toBuy.length > 0) {
        // Score based on best deal in the lot: high-value container at low price scores higher
        const cardValue = (c) => { const v = ai.scoringCard.values[c]; return v === 0 ? 6 : (v ?? 4); };
        const bestDeal = Math.max(...toBuy.map(t => cardValue(t.color) - t.price));
        // bestDeal: primary ($10) at $1 → 9, secondary ($6) at $2 → 4, tertiary ($4) at $2 → 2
        const factoryScore = Math.min(72, 48 + bestDeal * 3);
        actions.push({ score: factoryScore, action: { type: 'factory_buy', sellerId: bestFactory } });
      }
    }
  }

  // ── PRODUCE containers into own factory lots ──────────────────────────────
  const factoryRoom = factoryLimit(ai) - countFactory(ai);
  if (factoryRoom > 0 && ai.cash >= 1) {
    const canProduce = ai.factories.some(c => (state.containerSupply[c] || 0) > 0);
    if (canProduce) {
      actions.push({ score: 45, action: { type: 'produce' } });
    }
  }

  // ── BUILD FACTORY ─────────────────────────────────────────────────────────
  const factoryCost = nextFactoryCost(ai);
  if (factoryCost !== null && ai.cash >= factoryCost + 5) {
    const availableColor = COLORS.find(c =>
      !ai.factories.includes(c) && (state.factorySupply[c] || 0) > 0
    );
    if (availableColor) {
      // Two factories is the sweet spot: score highly until there, lower after
      const score = ai.factories.length < 2 ? 62 : 36;
      actions.push({ score, action: { type: 'build_factory', color: availableColor } });
    }
  }

  // ── BUILD WAREHOUSE ───────────────────────────────────────────────────────
  const whCost = nextWarehouseCost(ai);
  if (whCost !== null && ai.cash >= whCost) {
    // Urgently needed when harbor is full — beats produce (45) so AI doesn't loop on producing
    const harborFull = harborRoom <= 0;
    const whScore = harborFull ? 55 : Math.max(20, 44 - ai.warehouses * 6);
    actions.push({ score: whScore, action: { type: 'build_warehouse' } });
  }

  // ── CALL BANK (bid on container lot) ─────────────────────────────────────
  const bankBid = !state.modules?.classic && aiComputeBankBid(state, aiId);
  if (bankBid) {
    let bankScore;
    const cur = state.bank.containerAuction;
    if (cur && cur.bidderId !== aiId) {
      // Outbidding an existing auction: score by how cheap the current bid is.
      // A $1 bid on $20 of containers should beat almost everything.
      const containers = state.bank.containerLots[cur.lotIdx];
      const estValue = containers.reduce((s, c) => s + (ai.scoringCard.values[c] || 4), 0);
      const fraction = estValue > 0 ? cur.amount / estValue : 1;
      bankScore = fraction < 0.15 ? 88 : fraction < 0.30 ? 74 : fraction < 0.50 ? 55 : 35;
    } else {
      // Starting a new auction: score based on lot size and value.
      // Containers at 50% of scoring value is a good deal; scale with lot quality.
      const lotContainers = state.bank.containerLots[bankBid.lotIdx] || [];
      const estValue = lotContainers.reduce((s, c) => s + (ai.scoringCard.values[c] || 4), 0);
      // 1 container → ~52, 2 containers → ~62, 3 containers → ~72 (competes with harbor sail/buy)
      bankScore = Math.min(75, 44 + lotContainers.length * 10 + Math.floor(estValue * 0.5));
    }
    actions.push({ score: bankScore, action: { type: 'call_bank', ...bankBid } });
  }

  // ── CALL BANK (bid containers on cash lot) ────────────────────────────────
  const cashLotBid = !state.modules?.classic && aiComputeCashLotBid(state, aiId);
  if (cashLotBid) {
    const cashValue = state.bank.cashLots[cashLotBid.lotIdx] || 0;
    const containerCost = cashLotBid.containerBid.reduce((s, c) => {
      const v = ai.scoringCard.values[c.color];
      return s + (v === 0 ? 5 : (v ?? 4));
    }, 0);
    const netGain = cashValue - containerCost;
    // netGain of +1 ≈ score 50; +3 ≈ score 58; +5 ≈ score 66
    const cashLotScore = Math.min(72, 46 + netGain * 4);
    actions.push({ score: cashLotScore, action: { type: 'call_bank', ...cashLotBid } });
  }

  // ── TRUCK COMPANY (Expansion) ─────────────────────────────────────────────
  if (state.modules?.truckCompanies && ai.trucksLeft > 0) {
    const activeTruck = state.bank.truckAuction;

    if (activeTruck && activeTruck.bidderId !== aiId) {
      const isOwnCompany = activeTruck.targetPlayerId === aiId;
      const target = state.players[activeTruck.targetPlayerId];
      const fundBonus = (target.truckingFund || 0) * 4;  // accumulated money raises value
      const maxWilling = isOwnCompany ? Math.min(ai.cash - 1, 10) : Math.min(ai.cash - 2, 5 + (target.truckingFund || 0));
      if (maxWilling > activeTruck.amount && ai.cash > activeTruck.amount) {
        const score = (isOwnCompany ? 62 : 35) + fundBonus;
        actions.push({ score, action: { type: 'truck_bid', targetPlayerId: activeTruck.targetPlayerId } });
      }
    } else if (!activeTruck && state.bank.tokensLeft > 0 && ai.cash >= 2 && !state.wonAuctionThisTurn) {
      if (ai.truckCompanyOwner === null) {
        // Own company is independent — bid to secure it (avoids ongoing freight fees)
        const ownFund = ai.truckingFund || 0;
        actions.push({ score: 46 + ownFund * 4, action: { type: 'truck_bid', targetPlayerId: aiId } });
      } else {
        // Own company secured — bid on an opponent's with accumulated fees
        const indep = state.players
          .filter(p => p.id !== aiId && p.truckCompanyOwner === null)
          .sort((a, b) => (b.truckingFund || 0) - (a.truckingFund || 0))[0];
        if (indep) {
          const score = 28 + (indep.truckingFund || 0) * 5;
          actions.push({ score, action: { type: 'truck_bid', targetPlayerId: indep.id } });
        }
      }
    }
  }

  // ── LUXURY CONTAINERS (trade 2 for 1 gold — free action) ────────────────
  const luxuryOpt = state.modules?.luxuryContainers && aiComputeLuxury(state, aiId);
  if (luxuryOpt) {
    // Gold is wild (best color at scoring) — almost always worth trading 2 low-value containers
    const tradedValue = luxuryOpt.returnColors.reduce((s, c) => {
      const v = ai.scoringCard.values[c];
      return s + (v === 0 ? 2 : (v ?? 4));
    }, 0);
    const luxuryScore = Math.max(40, 65 - tradedValue);
    actions.push({ score: luxuryScore, action: { type: 'acquire_luxury', ...luxuryOpt } });
  }

  // ── REPRICE (drop a stuck lot by one price step) ─────────────────────────
  const repriceOpt = aiComputeReprice(state, aiId);
  if (repriceOpt) {
    actions.push({ score: 28, action: repriceOpt });
  }

  // ── TAKE LOAN when cash-strapped ─────────────────────────────────────────
  if (ai.cash <= 3 && totalLoans(ai) < MAX_LOANS) {
    actions.push({ score: 22, action: { type: 'take_loan' } });
  }

  // ── FALLBACK: AI must always have at least one valid action ───────────────
  // Guarantees the "no actions available" message never fires.
  if (ai.shipLocation === 'ocean') {
    // Sail to bank — always executable from ocean, can start auctions there
    if (!actions.some(a => a.action.type === 'sail')) {
      actions.push({ score: 3, action: { type: 'sail', dest: 'bank' } });
    }
  } else {
    // Sail back to ocean — always executable when docked
    if (!actions.some(a => a.action.type === 'sail' && a.action.dest === 'ocean')) {
      actions.push({ score: 3, action: { type: 'sail', dest: 'ocean' } });
    }
  }

  actions.sort((a, b) => b.score - a.score);
  return actions;
}

function canExecuteAction(state, aiId, action) {
  const ai = state.players[aiId];
  switch (action.type) {
    case 'sail':
      if (action.dest === 'ocean')  return ai.shipLocation !== 'ocean';
      if (action.dest === 'island') return ai.shipLocation === 'ocean' && ai.shipContainers.length > 0;
      if (action.dest === 'bank')   return ai.shipLocation === 'ocean';
      if (typeof action.dest === 'number') return ai.shipLocation === 'ocean' && action.dest !== aiId;
      return false;
    case 'harbor_buy':
      return typeof ai.shipLocation === 'number' && ai.shipContainers.length < SHIP_CAPACITY;
    case 'factory_buy': {
      if (harborLimit(ai) <= countHarbor(ai)) return false;
      const seller = state.players[action.sellerId];
      if (!seller) return false;
      return seller.factoryLots.some(l => l.containers.length > 0 && l.price <= ai.cash);
    }
    case 'produce':
      return ai.cash >= 1 && countFactory(ai) < factoryLimit(ai) &&
        ai.factories.some(c => (state.containerSupply[c] || 0) > 0);
    case 'build_factory':
      return nextFactoryCost(ai) !== null && ai.cash >= nextFactoryCost(ai) &&
        COLORS.some(c => !ai.factories.includes(c) && (state.factorySupply[c] || 0) > 0);
    case 'build_warehouse':
      return nextWarehouseCost(ai) !== null && ai.cash >= nextWarehouseCost(ai) && (state.warehouseSupply || 0) > 0;
    case 'call_bank':
      if (action.lotType === 'cash') {
        return (action.containerBid || []).length > 0;
      }
      return action.amount > 0 && ai.cash >= action.amount;
    case 'reprice':
      return (action.newLots || []).some(l => l.containers.length > 0);
    case 'acquire_luxury':
      return state.modules?.luxuryContainers &&
        !ai.acquiredLuxuryThisTurn &&
        (state.goldSupply || 0) > 0 &&
        (action.returnColors || []).length === 2;
    case 'take_loan':
      return totalLoans(ai) < MAX_LOANS;
    case 'truck_bid': {
      if (!state.modules?.truckCompanies || ai.trucksLeft <= 0) return false;
      const active = state.bank.truckAuction;
      if (active) return active.bidderId !== aiId && ai.cash > active.amount;
      return state.bank.tokensLeft > 0 && ai.cash >= 2;
    }
    default:
      return false;
  }
}

// ── Instruction generator (reads state BEFORE mutation) ───────────────────────

function aiDescribeAction(state, aiId, action) {
  const ai = state.players[aiId];
  const LOT_ROMAN = ['I', 'II', 'III'];

  switch (action.type) {

    case 'produce': {
      const rightId = rightOfPlayer(state, aiId);
      const rightName = state.players[rightId].name;
      const room = factoryLimit(ai) - countFactory(ai);
      const producible = ai.factories.filter(c => (state.containerSupply[c] || 0) > 0);
      const toProduce = Math.min(producible.length, room);
      const instrs = [
        `Pay <strong>$1</strong> from Automa's cash to <strong>${rightName}</strong> (seated to Automa's right).`
      ];
      let n = 0;
      for (const color of producible) {
        if (n >= toProduce) break;
        const supply = state.containerSupply[color] ?? 99;
        const lotPrice = supply <= 3 ? 3 : 2;
        const rareNote = supply <= 3 ? ` <em>(scarce — ${supply} left)</em>` : '';
        instrs.push(`Take 1 <strong>${COLOR_LABEL[color]}</strong> from supply → place in Automa's <strong>$${lotPrice} factory lot</strong>.${rareNote}`);
        n++;
      }
      return { title: `Produce ${toProduce} Container${toProduce !== 1 ? 's' : ''}`, instructions: instrs };
    }

    case 'build_factory': {
      const cost = nextFactoryCost(ai);
      return {
        title: `Build ${COLOR_LABEL[action.color]} Factory`,
        instructions: [
          `Take a <strong>${COLOR_LABEL[action.color]}</strong> factory tile from the supply.`,
          `Place it on Automa's board at factory slot <strong>${ai.factories.length + 1}</strong>.`,
          `Pay <strong>$${cost}</strong> from Automa's cash to the supply.`
        ]
      };
    }

    case 'build_warehouse': {
      const cost = nextWarehouseCost(ai);
      return {
        title: 'Build Warehouse',
        instructions: [
          `Take a warehouse tile from the supply.`,
          `Place it on Automa's board at warehouse slot <strong>${ai.warehouses + 1}</strong>.`,
          `Pay <strong>$${cost}</strong> from Automa's cash to the supply.`
        ]
      };
    }

    case 'sail': {
      const dest = action.dest;

      if (dest === 'ocean') {
        return {
          title: 'Sail to Ocean',
          instructions: [`Move Automa's ship token to the <strong>ocean area</strong>.`]
        };
      }

      if (dest === 'island') {
        const count = ai.shipContainers.length;
        return {
          title: 'Sail to Container Island',
          instructions: [
            `Move Automa's ship token to <strong>Container Island</strong>.`,
            `Ship carries <strong>${count}</strong> container${count !== 1 ? 's' : ''}: <strong>${ai.shipContainers.map(c => COLOR_LABEL[c]).join(', ')}</strong>.`,
            `A <strong>Delivery Auction</strong> now begins — all other players secretly bid on these containers.`
          ]
        };
      }

      if (dest === 'bank') {
        const holding = state.bank.holdingAreas[aiId] || [];
        const canLoad = Math.min(holding.length, SHIP_CAPACITY - ai.shipContainers.length);
        const instrs = [`Move Automa's ship token to the <strong>Off-Shore Bank</strong>.`];
        if (canLoad > 0) {
          instrs.push(`Load <strong>${canLoad}</strong> container${canLoad !== 1 ? 's' : ''} from Automa's holding area onto the ship: <strong>${holding.slice(0, canLoad).map(c => COLOR_LABEL[c]).join(', ')}</strong>.`);
        }
        return { title: 'Sail to Off-Shore Bank', instructions: instrs };
      }

      // Sail to opponent harbor (includes anchor purchase preview)
      const harbor = state.players[dest];
      const room = SHIP_CAPACITY - ai.shipContainers.length;
      const toBuyPreview = affordableHarborContainers(harbor, ai.cash, room, ai, state.containerSupply);
      const instrs = [`Move Automa's ship token to <strong>${harbor.name}'s harbor</strong>.`];
      if (toBuyPreview.length > 0) {
        const totalCost = toBuyPreview.reduce((s, p) => s + p.price, 0);
        instrs.push(`Free harbor purchase (anchor action):`);
        toBuyPreview.forEach(p => {
          instrs.push(`Take <strong>${COLOR_LABEL[p.color]}</strong> from ${harbor.name}'s <strong>$${p.price} harbor lot</strong> → load onto Automa's ship. Pay ${harbor.name} <strong>$${p.price}</strong>.`);
        });
        instrs.push(`Total paid to ${harbor.name}: <strong>$${totalCost}</strong>.`);
      } else {
        instrs.push(`(${harbor.name}'s harbor has no affordable containers.)`);
      }
      return { title: `Sail to ${harbor.name}'s Harbor`, instructions: instrs };
    }

    case 'harbor_buy': {
      const sellerId = ai.shipLocation;
      if (typeof sellerId !== 'number') return { title: 'Harbor Purchase', instructions: ['(Ship not docked)'] };
      const seller = state.players[sellerId];
      const room = SHIP_CAPACITY - ai.shipContainers.length;
      const toBuy = affordableHarborContainers(seller, ai.cash, room, ai, state.containerSupply);
      if (toBuy.length === 0) return { title: `Harbor Purchase from ${seller.name}`, instructions: ['No affordable containers.'] };
      const totalCost = toBuy.reduce((s, p) => s + p.price, 0);
      const instrs = [`Buy from <strong>${seller.name}'s harbor</strong>:`];
      toBuy.forEach(p => {
        instrs.push(`Take <strong>${COLOR_LABEL[p.color]}</strong> from $${p.price} lot → load onto Automa's ship. Pay ${seller.name} <strong>$${p.price}</strong>.`);
      });
      if (toBuy.length > 1) instrs.push(`Total to ${seller.name}: <strong>$${totalCost}</strong>.`);
      return { title: `Harbor Purchase from ${seller.name}`, instructions: instrs };
    }

    case 'factory_buy': {
      const seller = state.players[action.sellerId];
      const room = harborLimit(ai) - countHarbor(ai);
      const toBuy = affordableFactoryContainers(seller, ai.cash, room, ai, state.containerSupply);
      if (toBuy.length === 0) return { title: `Factory Purchase from ${seller.name}`, instructions: ['No affordable containers.'] };
      const totalCost = toBuy.reduce((s, p) => s + p.price, 0);
      const instrs = [`Buy from <strong>${seller.name}'s factories</strong>:`];
      toBuy.forEach(p => {
        const supply = state.containerSupply[p.color] ?? 99;
        const markup = supply <= 3 ? 2 : 1;
        const harborPrice = Math.min(6, p.price + markup);
        const rareNote = supply <= 3 ? ` <em>(scarce)</em>` : '';
        instrs.push(`Take <strong>${COLOR_LABEL[p.color]}</strong> from ${seller.name}'s <strong>$${p.price} factory lot</strong> → place in Automa's <strong>$${harborPrice} harbor lot</strong>.${rareNote} Pay ${seller.name} <strong>$${p.price}</strong>.`);
      });
      if (toBuy.length > 1) instrs.push(`Total to ${seller.name}: <strong>$${totalCost}</strong>.`);
      if (state.modules?.truckCompanies) {
        const owner = ai.truckCompanyOwner;
        if (owner === aiId) {
          // no fee
        } else if (owner !== null && state.players[owner]) {
          instrs.push(`Pay <strong>$1 freight</strong> to <strong>${state.players[owner].name}</strong> (they own Automa's trucking company).`);
        } else {
          instrs.push(`Place <strong>$1</strong> in <strong>Automa's trucking area</strong> (board extension). Company is independent — money sits there until someone wins the auction.`);
        }
      }
      return { title: `Factory Purchase from ${seller.name}`, instructions: instrs };
    }

    case 'call_bank': {
      const lotName = LOT_ROMAN[action.lotIdx];
      if (action.lotType === 'cash') {
        const conBid = action.containerBid || [];
        const colors = conBid.map(c => COLOR_LABEL[c.color]).join(', ');
        const isOutbid = !!(state.bank.cashAuction && state.bank.cashAuction.lotIdx === action.lotIdx);
        return {
          title: `Bid ${conBid.length} Container${conBid.length !== 1 ? 's' : ''} on Cash Lot ${lotName}`,
          instructions: [
            isOutbid
              ? `Automa outbids current bid on Cash Lot <strong>${lotName}</strong>.`
              : `Automa uses Call Bank to start auction on Cash Lot <strong>${lotName}</strong>.`,
            `Move <strong>${colors}</strong> from Automa's factory to the <strong>bid tile</strong> on Cash Lot ${lotName}.`,
            `<em>(If Automa wins: containers go to bank lots; Automa takes the cash.)</em>`
          ]
        };
      }
      return {
        title: `Bid $${action.amount} on Container Lot ${lotName}`,
        instructions: [
          `Place the <strong>auction token</strong> on Container Lot <strong>${lotName}</strong> at the Off-Shore Bank (or outbid current bidder).`,
          `Take <strong>$${action.amount}</strong> from Automa's cash and place it on the bid tile.`,
          `<em>(Funds reserved — not spendable until auction resolves at start of next turn.)</em>`
        ]
      };
    }

    case 'acquire_luxury': {
      const districtName = action.district === 'factory' ? 'factory' : 'harbor';
      const returnNames = action.returnColors.map(c => `<strong>${COLOR_LABEL[c]}</strong>`).join(' and ');
      return {
        title: 'Acquire Gold Luxury Container',
        instructions: [
          `Return ${returnNames} from Automa's ${districtName} → place back in supply.`,
          `Take 1 <strong>Gold</strong> container from supply → place in Automa's <strong>$${action.goldPrice} ${districtName} lot</strong>.`,
          `(Free action — no action token used.)`
        ]
      };
    }

    case 'take_loan': {
      const newCount = totalLoans(ai) + 1;
      return {
        title: 'Take Loan',
        instructions: [
          `Take a <strong>loan card</strong> and place it near Automa's board (${newCount} loan${newCount > 1 ? 's' : ''} total).`,
          `Take <strong>$10</strong> from the supply and add it to Automa's cash.`
        ]
      };
    }

    case 'truck_bid': {
      const target = state.players[action.targetPlayerId];
      const isOwn = action.targetPlayerId === aiId;
      const activeTruck = state.bank.truckAuction;
      const bidAmt = activeTruck ? activeTruck.amount + 1 : (isOwn ? 2 : 1);
      return {
        title: `Bid on ${isOwn ? 'Own' : target.name + "'s"} Truck Company`,
        instructions: [
          activeTruck
            ? `Automa outbids the current $${activeTruck.amount} bid — new bid: <strong>$${bidAmt}</strong>.`
            : `Automa uses Call Bank to start auction on <strong>${target.name}'s Truck Company</strong>, bid <strong>$${bidAmt}</strong>.`,
          `Place the truck auction token on <strong>${target.name}'s board extension</strong>.`,
          isOwn
            ? `If Automa wins: it pays no $1 freight fee when buying from factories.`
            : `If Automa wins: collect $1 from ${target.name} every time they Factory Purchase.`
        ]
      };
    }

    case 'reprice': {
      const isFactory = action.district === 'factory';
      const oldLot = (isFactory ? ai.factoryLots : ai.harborLots).find(l => l.price === action.fromPrice);
      const colors = (oldLot?.containers || []).map(c => COLOR_LABEL[c]).join(', ');
      return {
        title: `Reprice ${isFactory ? 'Factory' : 'Harbor'} — $${action.fromPrice} → $${action.toPrice}`,
        instructions: [
          `Move <strong>${colors}</strong> from Automa's <strong>$${action.fromPrice} ${isFactory ? 'factory' : 'harbor'} lot</strong> to the <strong>$${action.toPrice} lot</strong>.`
        ]
      };
    }

    default:
      return { title: action.type, instructions: [] };
  }
}

// ── Action execution (mutates state) ─────────────────────────────────────────

function aiExecuteAction(state, aiId, action) {
  const ai = state.players[aiId];

  switch (action.type) {

    case 'sail': {
      const res = sail(state, aiId, action.dest);
      if (!res.ok) return null;
      if (res.anchorAction === 'delivery_auction') {
        startDeliveryAuction(state, aiId);
        // Do NOT call useAction — turn ends when auction resolves
        return { triggerDelivery: true };
      }
      if (res.anchorAction === 'harbor_buy' && typeof action.dest === 'number') {
        aiDoHarborBuy(state, aiId);
      }
      useAction(state);
      return { triggerDelivery: false };
    }

    case 'harbor_buy': {
      aiDoHarborBuy(state, aiId);
      useAction(state);
      return { triggerDelivery: false };
    }

    case 'factory_buy': {
      const ok = aiDoFactoryBuy(state, aiId, action.sellerId);
      if (!ok) return null;
      useAction(state);
      return { triggerDelivery: false };
    }

    case 'produce': {
      const ok = aiDoProduce(state, aiId);
      if (!ok) return null;
      useAction(state);
      return { triggerDelivery: false };
    }

    case 'build_factory': {
      const res = buildFactory(state, aiId, action.color);
      if (!res.ok) return null;
      useAction(state);
      return { triggerDelivery: false };
    }

    case 'build_warehouse': {
      const res = buildWarehouse(state, aiId);
      if (!res.ok) return null;
      useAction(state);
      return { triggerDelivery: false };
    }

    case 'call_bank': {
      const res = callBank(state, aiId, action.lotType, action.lotIdx, action.amount, action.containerBid);
      if (!res.ok) return null;
      useAction(state);
      return { triggerDelivery: false };
    }

    case 'reprice': {
      const res = reprice(state, aiId, action.district, action.newLots);
      if (!res.ok) return null;
      useAction(state);
      return { triggerDelivery: false };
    }

    case 'acquire_luxury': {
      const res = acquireLuxury(state, aiId, action.district, action.returnColors, action.goldPrice);
      if (!res.ok) return null;
      // Free action — does not consume an action token
      return { triggerDelivery: false };
    }

    case 'take_loan': {
      const res = takeLoan(state, aiId);
      if (!res.ok) return null;
      // Taking a loan does not consume an action
      return { triggerDelivery: false };
    }

    case 'truck_bid': {
      const activeTruck = state.bank.truckAuction;
      const bid = activeTruck ? activeTruck.amount + 1 : (action.targetPlayerId === aiId ? 2 : 1);
      if (ai.cash < bid) return null;
      const res = callTruckAuction(state, aiId, action.targetPlayerId, bid);
      if (!res.ok) return null;
      useAction(state);
      return { triggerDelivery: false };
    }

    default:
      return null;
  }
}

// ── Sub-action helpers ────────────────────────────────────────────────────────

function aiDoProduce(state, aiId) {
  const ai = state.players[aiId];
  const limit = factoryLimit(ai);
  const current = countFactory(ai);
  const room = limit - current;
  const producible = ai.factories.filter(c => (state.containerSupply[c] || 0) > 0);
  const toProduce = Math.min(producible.length, room);
  if (toProduce <= 0 || ai.cash < 1) return false;

  const newLots = ai.factoryLots.map(l => ({ price: l.price, containers: [...l.containers] }));

  let added = 0;
  for (const color of producible) {
    if (added >= toProduce) break;
    const supply = state.containerSupply[color] ?? 99;
    const targetPrice = supply <= 3 ? 3 : 2;
    const targetLot = newLots.find(l => l.price === targetPrice)
      || newLots.find(l => l.price === 2)
      || newLots[1];
    targetLot.containers.push(color);
    added++;
  }

  const res = produce(state, aiId, newLots);
  return res.ok;
}

function aiDoFactoryBuy(state, aiId, sellerId) {
  const ai = state.players[aiId];
  const seller = state.players[sellerId];
  const room = harborLimit(ai) - countHarbor(ai);
  if (room <= 0) return false;

  const toBuy = affordableFactoryContainers(seller, ai.cash, room, ai, state.containerSupply);
  if (toBuy.length === 0) return false;

  const newHarborLots = ai.harborLots.map(l => ({ price: l.price, containers: [...l.containers] }));
  for (const item of toBuy) {
    const supply = state.containerSupply[item.color] ?? 99;
    const markup = supply <= 3 ? 2 : 1;
    const targetPrice = Math.min(6, item.price + markup);
    const targetLot = newHarborLots.find(l => l.price === targetPrice)
      || newHarborLots.find(l => l.price === item.price + 1)
      || newHarborLots[2];
    targetLot.containers.push(item.color);
  }

  const res = factoryPurchase(state, aiId, sellerId, toBuy, newHarborLots);
  return res.ok;
}

function aiDoHarborBuy(state, aiId) {
  const ai = state.players[aiId];
  const sellerId = ai.shipLocation;
  if (typeof sellerId !== 'number') return;

  const seller = state.players[sellerId];
  const room = SHIP_CAPACITY - ai.shipContainers.length;
  if (room <= 0) return;

  // Greedy: buy cheapest first, skip overpriced containers, stop when can't afford next
  const available = seller.harborLots.flatMap((lot, lotIdx) =>
    lot.containers.map(c => ({ color: c, fromLotIdx: lotIdx, price: lot.price }))
  ).filter(item => item.price <= aiHarborMaxPriceForColor(item.color, ai, state.containerSupply))
   .sort((a, b) => a.price - b.price);

  const toBuy = [];
  let totalCost = 0;
  for (const item of available) {
    if (toBuy.length >= room) break;
    if (ai.cash >= totalCost + item.price) {
      toBuy.push(item);
      totalCost += item.price;
    }
  }
  if (toBuy.length === 0) return;

  const newShip = [...ai.shipContainers, ...toBuy.map(p => p.color)];
  const purchaseList = toBuy.map(p => ({ color: p.color, fromLotIdx: p.fromLotIdx }));
  harborPurchase(state, aiId, purchaseList, newShip);
}

// ── Lookup helpers ────────────────────────────────────────────────────────────

// Returns sorted list of containers from a player's harbor that AI can afford,
// up to `room` slots. Pass `ai` and `containerSupply` to apply per-color price caps.
function affordableHarborContainers(player, cash, room, ai, containerSupply) {
  const available = player.harborLots.flatMap((lot, lotIdx) =>
    lot.containers.map(c => ({ color: c, fromLotIdx: lotIdx, price: lot.price }))
  ).filter(item => !ai || item.price <= aiHarborMaxPriceForColor(item.color, ai, containerSupply))
   .sort((a, b) => a.price - b.price);

  const result = [];
  let spent = 0;
  for (const item of available) {
    if (result.length >= room) break;
    if (cash >= spent + item.price) {
      result.push(item);
      spent += item.price;
    }
  }
  return result;
}

// How much AI is willing to pay from a factory for one container of `color`.
// Scales with scoring card value (10/6/4/2/0) and rarity in the supply.
function aiFactoryMaxPriceForColor(color, ai, containerSupply) {
  const raw = ai.scoringCard.values[color];
  // twoValue color has raw=0 but is worth $5-$10 at delivery — treat as mid-high
  const value = raw === 0 ? 6 : (raw ?? 4);
  const supply = containerSupply[color] ?? 99;

  // Base ceiling: primary ($10) → $4, secondary ($6) → $3, tertiary ($4) → $2, low ($2) → $1
  const base = value >= 10 ? 4 : value >= 6 ? 3 : value >= 4 ? 2 : 1;

  // Pay $1 more when the color is scarce (≤3 remaining in supply)
  return Math.min(4, base + (supply <= 3 ? 1 : 0));
}

// Harbor cap: factory cap + $1 (the saved truck fee), capped at $6.
// $10-scoring → $5 ($6 if rare), $6-scoring → $4 ($5 if rare),
// $4-scoring → $3 ($4 if rare), $2-scoring → $2 ($3 if rare)
function aiHarborMaxPriceForColor(color, ai, containerSupply) {
  return Math.min(6, aiFactoryMaxPriceForColor(color, ai, containerSupply) + 1);
}

// Returns sorted list of containers from a player's factory that AI should buy,
// filtered by per-color willingness-to-pay (value + rarity aware), sorted
// best value-per-dollar first so the AI grabs the most valuable containers
// when it can't afford everything.
function affordableFactoryContainers(seller, cash, room, ai, containerSupply) {
  const maxForColor = (color) =>
    ai && containerSupply
      ? aiFactoryMaxPriceForColor(color, ai, containerSupply)
      : 2; // fallback flat cap if called without context

  const cardValue = (color) => {
    if (!ai) return 4;
    const v = ai.scoringCard.values[color];
    return v === 0 ? 6 : (v ?? 4); // treat twoValue (raw 0) as 6
  };

  const available = seller.factoryLots.flatMap((lot, lotIdx) =>
    lot.containers.map(c => ({ color: c, fromLotIdx: lotIdx, price: lot.price }))
  )
  .filter(item => item.price <= maxForColor(item.color))
  .sort((a, b) => {
    // Lower (price × 3 − value) = better deal; prioritises high-value cheap containers
    const scoreA = a.price * 3 - cardValue(a.color);
    const scoreB = b.price * 3 - cardValue(b.color);
    return scoreA - scoreB;
  });

  const result = [];
  let spent = 0;
  for (const item of available) {
    if (result.length >= room) break;
    if (cash >= spent + item.price) {
      result.push(item);
      spent += item.price;
    }
  }
  return result;
}

// The harbor lot the AI uses for factory-purchased containers.
// Always the $3 lot (index 2 in the default [2,3,4,5,6] harbor setup).
function aiHarborTargetLot(ai) {
  return ai.harborLots.find(l => l.price === 3) || ai.harborLots[2];
}

function findBestHarbor(state, aiId) {
  const ai = state.players[aiId];
  let best = null, bestScore = -1;
  for (const player of state.players) {
    if (player.id === aiId) continue;
    const total = countHarbor(player);
    const room = SHIP_CAPACITY - ai.shipContainers.length;
    // Only count containers AI can afford
    const affordable = affordableHarborContainers(player, ai.cash, room, ai, state.containerSupply).length;
    if (affordable > 0 && affordable > bestScore) {
      bestScore = affordable;
      best = player.id;
    }
  }
  return best;
}

function findBestFactoryToBuyFrom(state, aiId) {
  const ai = state.players[aiId];
  const room = harborLimit(ai) - countHarbor(ai);
  let best = null, bestScore = -1;
  for (const player of state.players) {
    if (player.id === aiId) continue;
    const affordable = affordableFactoryContainers(player, ai.cash, room, ai, state.containerSupply).length;
    if (affordable > 0 && affordable > bestScore) {
      bestScore = affordable;
      best = player.id;
    }
  }
  return best;
}

function aiComputeBankBid(state, aiId) {
  const ai = state.players[aiId];
  const bank = state.bank;

  // Outbid existing container auction if profitable — increment by $1 or $2, cap at 70% of value
  if (bank.containerAuction && bank.containerAuction.bidderId !== aiId) {
    const cur = bank.containerAuction;
    const containers = bank.containerLots[cur.lotIdx];
    if (containers.length > 0) {
      const afterColors = new Set([...ai.islandContainers, ...containers]);
      const willHaveAll = afterColors.size === COLORS.length;
      const estValue = containers.reduce((s, c) =>
        s + aiContainerScoringValue(c, ai.scoringCard, willHaveAll), 0);
      const cap = Math.floor(estValue * 0.7);
      if (cur.amount < cap) {
        const increment = Math.random() < 0.5 ? 1 : 2;
        const bid = Math.min(cur.amount + increment, cap);
        if (ai.cash >= bid) {
          return { lotType: 'container', lotIdx: cur.lotIdx, amount: bid };
        }
      }
    }
  }

  // Start a new container auction if we have a token and the lot looks valuable
  if (bank.tokensLeft > 0 && !bank.containerAuction && !state.wonAuctionThisTurn) {
    for (let i = 0; i < 3; i++) {
      const containers = bank.containerLots[i];
      if (containers.length > 0) {
        const afterColors = new Set([...ai.islandContainers, ...containers]);
        const willHaveAll = afterColors.size === COLORS.length;
        const estValue = containers.reduce((s, c) =>
          s + aiContainerScoringValue(c, ai.scoringCard, willHaveAll), 0);
        const bid = Math.max(1, Math.floor(estValue * 0.3));
        if (ai.cash >= bid) {
          return { lotType: 'container', lotIdx: i, amount: bid };
        }
      }
    }
  }

  return null;
}

// ── Luxury Container Acquisition (trade 2 → 1 gold, free action) ─────────────

function aiComputeLuxury(state, aiId) {
  const ai = state.players[aiId];
  if (ai.acquiredLuxuryThisTurn) return null;
  if ((state.goldSupply || 0) <= 0) return null;

  // Collect all non-gold containers with their scoring value from both districts
  const candidates = [];
  for (const lot of ai.factoryLots) {
    for (const color of lot.containers) {
      if (color !== 'gold') {
        const sv = ai.scoringCard.values[color];
        candidates.push({ color, district: 'factory', scoringValue: sv === 0 ? 2 : (sv ?? 4) });
      }
    }
  }
  for (const lot of ai.harborLots) {
    for (const color of lot.containers) {
      if (color !== 'gold') {
        const sv = ai.scoringCard.values[color];
        candidates.push({ color, district: 'harbor', scoringValue: sv === 0 ? 2 : (sv ?? 4) });
      }
    }
  }
  if (candidates.length < 2) return null;

  // Pick the 2 lowest-value containers to return
  candidates.sort((a, b) => a.scoringValue - b.scoringValue);
  const toReturn = candidates.slice(0, 2);
  const returnColors = toReturn.map(c => c.color);

  // Place gold in harbor if it has room, otherwise factory; price at max for that district
  const harborHasRoom = ai.harborLots.some(l => l.containers.length === 0);
  const factoryHasRoom = ai.factoryLots.some(l => l.containers.length === 0);

  let district, goldPrice;
  if (harborHasRoom) {
    district = 'harbor';
    goldPrice = 5; // max valid harbor price per acquireLuxury (1-5)
  } else if (factoryHasRoom) {
    district = 'factory';
    goldPrice = 4;
  } else {
    // Replace the slot freed by returning — pick district of first returned container
    district = toReturn[0].district;
    goldPrice = district === 'harbor' ? 5 : 4;
  }

  return { district, returnColors, goldPrice };
}

// ── Cash Lot Bidding (bid containers → win cash) ─────────────────────────────

function aiSelectContainersForCashBid(ai, count) {
  const candidates = [];
  for (let lotIdx = 0; lotIdx < ai.factoryLots.length; lotIdx++) {
    for (const color of ai.factoryLots[lotIdx].containers) {
      const sv = ai.scoringCard.values[color] === 0 ? 5 : (ai.scoringCard.values[color] ?? 4);
      candidates.push({ color, district: 'factory', lotIdx, scoringValue: sv });
    }
  }
  candidates.sort((a, b) => a.scoringValue - b.scoringValue);
  return candidates.slice(0, count);
}

function aiComputeCashLotBid(state, aiId) {
  const ai = state.players[aiId];
  const bank = state.bank;

  // Outbid existing cash auction if we'd come out ahead
  if (bank.cashAuction && bank.cashAuction.bidderId !== aiId) {
    const cur = bank.cashAuction;
    const cashValue = bank.cashLots[cur.lotIdx] || 0;
    if (cashValue <= 0) return null;
    const existingWeight = bidWeight(cur.containers);
    // Select lowest-value containers until their weight exceeds the existing bid weight
    const allCandidates = aiSelectContainersForCashBid(ai, ai.factoryLots.reduce((s,l) => s + l.containers.length, 0));
    let w = 0;
    const containers = [];
    for (const c of allCandidates) {
      containers.push(c);
      w += (c.color === 'gold' ? 1.5 : 1);
      if (w > existingWeight) break;
    }
    if (w <= existingWeight) return null;
    const containerCost = containers.reduce((s, c) => s + c.scoringValue, 0);
    if (cashValue > containerCost) {
      return { lotType: 'cash', lotIdx: cur.lotIdx, containerBid: containers };
    }
    return null;
  }

  // Start a new cash auction if the gain is clear
  if (bank.tokensLeft > 0 && !bank.cashAuction && !state.wonAuctionThisTurn) {
    let bestLotIdx = -1, bestCash = 0;
    for (let i = 0; i < 3; i++) {
      const cash = bank.cashLots[i] || 0;
      if (cash > bestCash) { bestCash = cash; bestLotIdx = i; }
    }
    if (bestLotIdx === -1 || bestCash === 0) return null;
    const containers = aiSelectContainersForCashBid(ai, 1);
    if (containers.length === 0) return null;
    // Only start if cash lot value is meaningfully above the scoring value being traded away
    if (bestCash >= containers[0].scoringValue * 1.5) {
      return { lotType: 'cash', lotIdx: bestLotIdx, containerBid: containers };
    }
  }

  return null;
}

// ── Reprice (drop overpriced containers one step) ────────────────────────────

function aiComputeReprice(state, aiId) {
  const ai = state.players[aiId];

  // Factory: highest-priced non-empty lot above $2 (minimum we'll sell from)
  const factoryDrop = [...ai.factoryLots]
    .filter(l => l.containers.length > 0 && l.price > 2)
    .sort((a, b) => b.price - a.price)[0];

  if (factoryDrop) {
    const toPrice = factoryDrop.price - 1;
    const newLots = ai.factoryLots.map(l => ({ price: l.price, containers: [...l.containers] }));
    const from = newLots.find(l => l.price === factoryDrop.price);
    const to   = newLots.find(l => l.price === toPrice);
    if (from && to) {
      to.containers.push(...from.containers);
      from.containers = [];
      return { type: 'reprice', district: 'factory', newLots, fromPrice: factoryDrop.price, toPrice };
    }
  }

  // Harbor: highest-priced non-empty lot above $3
  const harborDrop = [...ai.harborLots]
    .filter(l => l.containers.length > 0 && l.price > 3)
    .sort((a, b) => b.price - a.price)[0];

  if (harborDrop) {
    const toPrice = harborDrop.price - 1;
    const newLots = ai.harborLots.map(l => ({ price: l.price, containers: [...l.containers] }));
    const from = newLots.find(l => l.price === harborDrop.price);
    const to   = newLots.find(l => l.price === toPrice);
    if (from && to) {
      to.containers.push(...from.containers);
      from.containers = [];
      return { type: 'reprice', district: 'harbor', newLots, fromPrice: harborDrop.price, toPrice };
    }
  }

  return null;
}

// ── Delivery auction bidding ──────────────────────────────────────────────────

// Value of one container of `color` on `card`, given whether the player will
// have all 5 colors on the island after this delivery.
function aiContainerScoringValue(color, card, willHaveAllColors) {
  if (color === card.twoValue) {
    // twoValue scores $10 each with a complete set, $5 each without
    return willHaveAllColors ? 10 : 5;
  }
  return card.values[color] ?? 4;
}

function aiBidOnDelivery(state, aiId, deliveryPlayerId) {
  const ai = state.players[aiId];
  if (ai.id === deliveryPlayerId) return { bid: 0, loansTaken: 0 };

  const containers = state.deliveryAuction.containers;
  const card = ai.scoringCard;

  const beforeColors  = new Set(ai.islandContainers);
  const afterColors   = new Set([...ai.islandContainers, ...containers]);
  const hadAllColors  = beforeColors.size === COLORS.length;
  const willHaveAll   = afterColors.size  === COLORS.length;

  // Per-container scoring value, using the correct twoValue amount
  let value = containers.reduce((s, c) =>
    s + aiContainerScoringValue(c, card, willHaveAll), 0);

  // Upgrade bonus: if this delivery is what first completes our full set,
  // every twoValue container already on the island jumps from $5 → $10
  if (willHaveAll && !hadAllColors) {
    const existingTwoValue = ai.islandContainers.filter(c => c === card.twoValue).length;
    value += existingTwoValue * 5;
  }

  const bidFraction = 0.55 + Math.random() * 0.15;
  const idealBid = Math.floor(value * bidFraction);

  // Take loans during bidding if containers are valuable and we can't afford our ideal bid
  let loansTaken = 0;
  while (totalLoans(ai) < MAX_LOANS) {
    const buffer = totalLoans(ai) * 3;
    const maxBid = Math.max(0, ai.cash - buffer);
    if (idealBid <= maxBid) break;
    // Only borrow if we'd actually gain meaningful bidding room
    const afterBuffer = (totalLoans(ai) + 1) * 3;
    const afterMax = Math.max(0, ai.cash + 10 - afterBuffer);
    if (afterMax <= maxBid + 2) break;
    takeLoan(state, aiId);
    loansTaken++;
  }

  const buffer = totalLoans(ai) * 3;
  const maxBid = Math.max(0, ai.cash - buffer);
  const bid = Math.min(idealBid, maxBid);
  if (state.modules?.classic && ai.cash > 0) return { bid: Math.max(1, bid), loansTaken };
  return { bid, loansTaken };
}

// Returns true if AI deliverer should reject all bids and keep the containers.
function aiShouldRejectDelivery(state, deliveryPlayerId, highBid) {
  const ai = state.players[deliveryPlayerId];
  const containers = state.deliveryAuction.containers;
  const card = ai.scoringCard;
  const acceptValue = highBid * 2;
  const projected = [...ai.islandContainers, ...containers];
  const allColors = new Set(projected).size === COLORS.length;
  const containerValue = containers.reduce((sum, c) => {
    if (c === card.twoValue) return sum + (allColors ? 10 : 5);
    return sum + (card.values[c] || 4);
  }, 0);
  return (containerValue - highBid) > acceptValue;
}

// ── Utility ───────────────────────────────────────────────────────────────────

function destName(state, dest) {
  if (dest === 'island') return 'Container Island';
  if (dest === 'bank')   return 'Off-Shore Bank';
  if (dest === 'ocean')  return 'the ocean';
  if (typeof dest === 'number') return `${state.players[dest].name}'s harbor`;
  return String(dest);
}
