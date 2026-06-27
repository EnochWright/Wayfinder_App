// Container board game – game engine (rule enforcement & state mutations)

// ── Bank distribution helpers ─────────────────────────────────────────────────

function distributeCashToBank(state, amount) {
  if (state.modules?.classic) return; // Classic: interest/payments go to supply (just removed)
  const bank = state.bank;
  let remaining = amount;
  let i = 0;
  const limit = remaining * 6 + 9;
  let iter = 0;
  while (remaining > 0 && iter < limit) {
    const idx = i % 3;
    const cashBlocked = bank.cashAuction && bank.cashAuction.lotIdx === idx;
    if (!cashBlocked) {
      bank.cashLots[idx] += 1;
      remaining--;
    }
    i++;
    iter++;
  }
}

function distributeContainersToBank(state, containers) {
  if (state.modules?.classic) return; // Classic: seized containers removed from game
  const bank = state.bank;
  let i = 0;
  for (const item of containers) {
    // item may be a plain color string or a {color, district, lotIdx} bid object
    const color = (typeof item === 'string') ? item : item.color;
    let placed = false;
    let tries = 0;
    while (!placed && tries < 4) {
      const idx = i % 3;
      const blocked = bank.containerAuction && bank.containerAuction.lotIdx === idx;
      if (!blocked) {
        bank.containerLots[idx].push(color);
        placed = true;
      }
      i++;
      tries++;
    }
    // Fallback: place in any non-blocked lot
    if (!placed) {
      for (let j = 0; j < 3; j++) {
        if (!bank.containerAuction || bank.containerAuction.lotIdx !== j) {
          bank.containerLots[j].push(color);
          break;
        }
      }
    }
  }
}

// ── Start of turn processing ──────────────────────────────────────────────────

// Returns { interest, bankWin } describing what happened, mutates state.
function processStartOfTurn(state) {
  const player = currentPlayer(state);
  const result = {
    interest: 0,
    bankInterest: 0,
    playerLoanPayments: [],   // [{lenderName, amount}]
    emergencyLoanTaken: false,
    bankWinType: null, bankWinAmount: 0, truckingCollected: [],
  };

  // Expansion: reset luxury flag
  player.acquiredLuxuryThisTurn = false;

  // Step 1: Pay loan interest — $1 per bank loan to bank, $1 per player loan to lender
  const totalInterest = totalLoans(player);
  if (totalInterest > 0) {
    if (player.cash < totalInterest) {
      // Can't afford interest — auto-take a bank loan to cover
      while (player.cash < totalInterest && totalLoans(player) < MAX_LOANS) {
        player.loans++;
        player.cash += 10;
        result.emergencyLoanTaken = true;
        addLog(state, `${player.name} takes emergency bank loan to pay interest`);
      }
      if (player.cash < totalInterest) {
        defaultOnLoan(state, player.id);
        return result;
      }
    }
    // Pay bank loans interest
    if (player.loans > 0) {
      player.cash -= player.loans;
      distributeCashToBank(state, player.loans);
      result.bankInterest = player.loans;
    }
    // Pay player loans interest to each lender
    for (const loan of (player.playerLoans || [])) {
      player.cash -= 1;
      const lender = state.players[loan.lenderId];
      if (lender) lender.cash += 1;
      result.playerLoanPayments.push({ lenderName: lender ? lender.name : 'Unknown', amount: 1 });
    }
    result.interest = totalInterest;
    addLog(state, `${player.name} pays $${totalInterest} interest`);
  }

  // Step 2: Collect bank auction win (if this player holds the winning bid)
  const bank = state.bank;
  if (bank.containerAuction && bank.containerAuction.bidderId === player.id) {
    const auction = bank.containerAuction;
    const lotContainers = [...bank.containerLots[auction.lotIdx]];
    // Player pays cash bid to bank's cash lots
    distributeCashToBank(state, auction.amount);
    // Player receives containers into holding area
    bank.holdingAreas[player.id].push(...lotContainers);
    bank.containerLots[auction.lotIdx] = [];
    bank.tokensLeft++;
    bank.containerAuction = null;
    state.wonAuctionThisTurn = true;
    result.bankWinType = 'containers';
    result.bankWinAmount = lotContainers.length;
    result.wonContainerColors = lotContainers;
    result.paidAmount = auction.amount;
    addLog(state, `${player.name} wins bank auction: ${lotContainers.length} container(s)`);
  }
  if (bank.cashAuction && bank.cashAuction.bidderId === player.id) {
    const auction = bank.cashAuction;
    const winCash = bank.cashLots[auction.lotIdx];
    // Player pays containers to bank's container lots
    distributeContainersToBank(state, auction.containers);
    // Restore containers from player board (they were "on the tile")
    removeBidContainersFromPlayer(state, player.id, auction);
    // Player receives cash
    player.cash += winCash;
    bank.cashLots[auction.lotIdx] = 0;
    bank.tokensLeft++;
    bank.cashAuction = null;
    state.wonAuctionThisTurn = true;
    result.bankWinType = 'cash';
    result.bankWinAmount = winCash;
    result.paidAmount = auction.containers.length;
    result.bidContainers = auction.containers.map(c => typeof c === 'string' ? c : c.color);
    addLog(state, `${player.name} wins bank auction: $${winCash}`);
  }

  // Expansion: Truck Companies — collect won truck company
  if (bank.truckAuction && bank.truckAuction.bidderId === player.id) {
    const auction = bank.truckAuction;
    distributeCashToBank(state, auction.amount);
    const target = state.players[auction.targetPlayerId];
    // Collect any money sitting in the trucking area — makes winning more enticing
    const fundCollected = target.truckingFund;
    if (fundCollected > 0) {
      player.cash += fundCollected;
      target.truckingFund = 0;
      addLog(state, `${player.name} collects $${fundCollected} from ${target.name}'s trucking area`);
    }
    target.truckCompanyOwner = player.id;
    player.trucksLeft = Math.max(0, player.trucksLeft - 1);
    bank.truckAuction = null;
    bank.tokensLeft++;
    state.wonAuctionThisTurn = true;
    result.truckCompanyWon = auction.targetPlayerId;
    result.truckingFundCollected = fundCollected;
    result.truckBidPaid = auction.amount;
    addLog(state, `${player.name} now owns ${target.name}'s Truck Company (paid $${auction.amount})`);
  }

  return result;
}

function removeBidContainersFromPlayer(state, playerId, auction) {
  const player = state.players[playerId];
  // containers were tracked in auction.containers array: [{color, district, lotIdx}]
  // They were "reserved" – need to remove them from player lots
  for (const item of auction.containers) {
    const lots = item.district === 'factory' ? player.factoryLots : player.harborLots;
    const lot = lots[item.lotIdx];
    const ci = lot.containers.indexOf(item.color);
    if (ci !== -1) lot.containers.splice(ci, 1);
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────

function buildFactory(state, playerId, color) {
  const player = state.players[playerId];
  const cost = nextFactoryCost(player);
  if (cost === null) return err('Already have 4 factories');
  if (player.factories.includes(color)) return err(`Already have a ${color} factory`);
  if (!state.factorySupply[color] || state.factorySupply[color] <= 0) return err('No supply');
  if (player.cash < cost) return err(`Need $${cost}`);

  player.cash -= cost;
  player.factories.push(color);
  state.factorySupply[color]--;
  addLog(state, `${player.name} builds ${COLOR_LABEL[color]} factory ($${cost})`);
  return ok();
}

function buildWarehouse(state, playerId) {
  const player = state.players[playerId];
  const cost = nextWarehouseCost(player);
  if (cost === null) return err('Already have 5 warehouses');
  if (state.warehouseSupply <= 0) return err('No warehouses in supply');
  if (player.cash < cost) return err(`Need $${cost}`);

  player.cash -= cost;
  player.warehouses++;
  state.warehouseSupply--;
  addLog(state, `${player.name} builds warehouse ($${cost})`);
  return ok();
}

// produce: player produces containers and arranges them into factory lots.
// newLots: array of 4 objects {price, containers:[]} representing the desired final state.
// AI passes the fully arranged lots; UI builds them from player input.
function produce(state, playerId, newLots) {
  const player = state.players[playerId];

  if (player.cash < 1) return err('Cannot afford $1 union wages');

  const oldCounts = colorCounts(player.factoryLots);
  const newCounts = colorCounts(newLots);
  const limit = factoryLimit(player);
  const newTotal = sumCounts(newCounts);

  if (newTotal > limit) return err(`Exceeds factory storage limit (${limit})`);

  // Validate: no containers removed
  for (const c of COLORS) {
    if ((newCounts[c] || 0) < (oldCounts[c] || 0)) return err(`Cannot remove existing containers`);
  }

  // Validate: only produce colours matching owned factories, max 1 per type per turn
  const producible = new Set(player.factories);
  for (const c of COLORS) {
    const delta = (newCounts[c] || 0) - (oldCounts[c] || 0);
    if (delta > 0 && !producible.has(c)) return err(`Cannot produce ${COLOR_LABEL[c]}`);
    if (delta > 1) return err(`Can only produce 1 ${COLOR_LABEL[c]} per turn`);
    if (delta > 0 && (state.containerSupply[c] || 0) < delta) return err(`Not enough ${COLOR_LABEL[c]} in supply`);
  }

  // Must produce as many as able (considering supply availability)
  const oldTotal = sumCounts(oldCounts);
  const space = limit - oldTotal;
  const producibleColors = player.factories.filter(c => (state.containerSupply[c] || 0) > 0);
  const maxProduce = Math.min(producibleColors.length, space);
  const produced = newTotal - oldTotal;
  if (produced < maxProduce) {
    return err(`Must produce ${maxProduce} container(s) (${producibleColors.length} factories have supply, ${space} space left)`);
  }

  // Execute
  const rightId = rightOfPlayer(state, playerId);
  player.cash -= 1;
  state.players[rightId].cash += 1;

  for (const c of COLORS) {
    const delta = (newCounts[c] || 0) - (oldCounts[c] || 0);
    if (delta > 0) state.containerSupply[c] -= delta;
  }
  player.factoryLots = newLots.map(l => ({ price: l.price, containers: [...l.containers] }));

  addLog(state, `${player.name} produces ${produced} container(s) (pays $1 to ${state.players[rightId].name})`);
  checkGameEnd(state);
  return ok();
}

// factoryPurchase: buyer buys containers from sellerId's factory lots.
// purchases: [{color, fromLotIdx}] – which containers to buy (and from which lot).
// newHarborLots: desired arrangement of buyer's harbor lots after purchase.
function factoryPurchase(state, buyerId, sellerId, purchases, newHarborLots) {
  const buyer  = state.players[buyerId];
  const seller = state.players[sellerId];
  if (buyerId === sellerId) return err('Cannot buy from your own factory');

  const limit = harborLimit(buyer);
  const currentHarborCount = countHarbor(buyer);
  if (currentHarborCount + purchases.length > limit) return err(`Exceeds harbor storage limit (${limit})`);

  // Validate each purchase
  let totalCost = 0;
  for (const p of purchases) {
    const lot = seller.factoryLots[p.fromLotIdx];
    const idx = lot.containers.indexOf(p.color);
    if (idx === -1) return err(`${COLOR_LABEL[p.color]} not in that lot`);
    totalCost += lot.price;
  }

  // Expansion: Truck Companies freight fee
  // - Self-owned:   no fee
  // - Independent:  $1 sits in buyer's trucking area until someone wins that auction
  // - Owned by A:   $1 goes directly to A's cash
  let freightFee = 0;
  let freightRecipient = null; // null = independent (goes to fund), else playerId
  if (state.modules?.truckCompanies) {
    const owner = buyer.truckCompanyOwner;
    if (owner !== buyerId) {
      freightFee = 1;
      freightRecipient = (owner !== null && state.players[owner]) ? owner : null;
    }
  }

  if (buyer.cash < totalCost + freightFee) {
    return err(`Need $${totalCost + freightFee}${freightFee ? ` (incl. $1 freight fee)` : ''}`);
  }

  // Validate new harbor arrangement
  const existingColors = buyer.harborLots.flatMap(l => l.containers);
  const addedColors = purchases.map(p => p.color);
  const allColors = [...existingColors, ...addedColors].sort();
  const newColors = newHarborLots.flatMap(l => l.containers).sort();
  if (allColors.join(',') !== newColors.join(',')) return err('Harbor arrangement mismatch');

  const newTotal = newColors.length;
  if (newTotal > limit) return err(`Exceeds harbor storage limit (${limit})`);

  // Execute
  buyer.cash -= totalCost + freightFee;
  seller.cash += totalCost;

  if (freightFee > 0) {
    if (freightRecipient !== null) {
      state.players[freightRecipient].cash += freightFee;
      addLog(state, `${buyer.name} pays $1 freight to ${state.players[freightRecipient].name}`);
    } else {
      buyer.truckingFund += freightFee;
      addLog(state, `${buyer.name} places $1 in their trucking area (independent)`);
    }
  }

  for (const p of purchases) {
    const lot = seller.factoryLots[p.fromLotIdx];
    const idx = lot.containers.indexOf(p.color);
    lot.containers.splice(idx, 1);
  }
  buyer.harborLots = newHarborLots.map(l => ({ price: l.price, containers: [...l.containers] }));

  addLog(state, `${buyer.name} buys ${purchases.length} container(s) from ${seller.name}'s factory`);
  return ok();
}

// harborPurchase: buyer buys from the harbor where their ship is docked.
// purchases: [{color, fromLotIdx}]
// newShipContainers: desired ship load after purchase.
function harborPurchase(state, buyerId, purchases, newShipContainers) {
  const buyer = state.players[buyerId];
  const harborOwnerId = buyer.shipLocation;
  if (typeof harborOwnerId !== 'number') return err('Ship not docked at a harbor');

  const seller = state.players[harborOwnerId];

  if (buyer.shipContainers.length + purchases.length > SHIP_CAPACITY) {
    return err(`Ship can only hold ${SHIP_CAPACITY} containers`);
  }

  let totalCost = 0;
  for (const p of purchases) {
    const lot = seller.harborLots[p.fromLotIdx];
    const idx = lot.containers.indexOf(p.color);
    if (idx === -1) return err(`${COLOR_LABEL[p.color]} not in that lot`);
    totalCost += lot.price;
  }
  if (buyer.cash < totalCost) return err(`Need $${totalCost}`);

  // Execute
  buyer.cash -= totalCost;
  seller.cash += totalCost;

  for (const p of purchases) {
    const lot = seller.harborLots[p.fromLotIdx];
    const idx = lot.containers.indexOf(p.color);
    lot.containers.splice(idx, 1);
  }
  buyer.shipContainers = [...newShipContainers];

  addLog(state, `${buyer.name} buys ${purchases.length} container(s) from ${seller.name}'s harbor`);
  return ok();
}

// sail: move player's ship one step.
// destination: 'ocean' | 'island' | 'bank' | <playerId>
// Returns { ok, anchorAction } where anchorAction tells the caller what free action occurred.
function sail(state, playerId, destination) {
  const player = state.players[playerId];
  const loc = player.shipLocation;

  if (destination === 'ocean') {
    if (loc === 'ocean') return err('Already in ocean');
    player.shipLocation = 'ocean';
    addLog(state, `${player.name}'s ship moves to ocean`);
    return ok({ anchorAction: null });
  }

  // Moving from ocean to a destination
  if (loc !== 'ocean') return err('Must move to ocean first');
  if (destination === playerId) return err('Cannot enter your own harbor');

  player.shipLocation = destination;

  if (destination === 'island') {
    addLog(state, `${player.name}'s ship arrives at Container Island`);
    return ok({ anchorAction: 'delivery_auction' });
  }

  if (destination === 'bank') {
    // Load containers from holding area (free action)
    const holding = state.bank.holdingAreas[player.id];
    if (holding.length > 0 && player.shipContainers.length < SHIP_CAPACITY) {
      const canLoad = Math.min(holding.length, SHIP_CAPACITY - player.shipContainers.length);
      const loaded = holding.splice(0, canLoad);
      player.shipContainers.push(...loaded);
      addLog(state, `${player.name} loads ${canLoad} container(s) from bank holding`);
    }
    addLog(state, `${player.name}'s ship docks at Off-Shore Bank`);
    return ok({ anchorAction: 'bank_load' });
  }

  // Harbor of an opponent
  const destPlayer = state.players[destination];
  if (!destPlayer) return err('Invalid destination');
  addLog(state, `${player.name}'s ship docks at ${destPlayer.name}'s harbor`);
  return ok({ anchorAction: 'harbor_buy' });
}

function reprice(state, playerId, district, newLots) {
  const player = state.players[playerId];
  const oldLots = district === 'factory' ? player.factoryLots : player.harborLots;

  const oldColors = oldLots.flatMap(l => l.containers).sort();
  const newColors = newLots.flatMap(l => l.containers).sort();
  if (oldColors.join(',') !== newColors.join(',')) return err('Cannot add or remove containers in reprice');

  if (district === 'factory') {
    player.factoryLots = newLots.map(l => ({ price: l.price, containers: [...l.containers] }));
  } else {
    player.harborLots = newLots.map(l => ({ price: l.price, containers: [...l.containers] }));
  }
  addLog(state, `${player.name} reprices ${district} containers`);
  return ok();
}

// Gold containers count as 1.5 in cash-lot auctions (Luxury Containers expansion).
// containers can be strings or {color, ...} objects.
function bidWeight(containers) {
  return containers.reduce((s, c) => {
    const color = typeof c === 'string' ? c : c.color;
    return s + (color === 'gold' ? 1.5 : 1);
  }, 0);
}

// callBank: start or bid in a bank auction.
// lotType: 'container' (bid cash to win containers) | 'cash' (bid containers to win cash)
// lotIdx: 0|1|2
// For container auctions: cashBid (number)
// For cash auctions: containerBid (array of {color, district, lotIdx})
function callBank(state, playerId, lotType, lotIdx, cashBid, containerBid) {
  if (state.modules?.classic) return { ok: false, error: 'Bank auctions are not used in the Classic Variant.' };
  const player = state.players[playerId];
  const bank = state.bank;

  if (lotType === 'container') {
    const existing = bank.containerAuction;

    if (existing && existing.lotIdx !== lotIdx) return err('Auction on a different lot');
    if (existing && existing.bidderId === playerId) return err('You already have the highest bid');
    if (cashBid === undefined || cashBid <= 0) return err('Invalid bid');
    if (existing && cashBid <= existing.amount) return err(`Must bid more than $${existing.amount}`);
    if (player.cash < cashBid) return err(`Need $${cashBid}`);

    if (!existing) {
      // Start new auction
      if (state.wonAuctionThisTurn) return err('Cannot start an auction on the same turn you won one');
      if (bank.tokensLeft <= 0) return err('No auction tokens available');
      bank.tokensLeft--;
      bank.containerAuction = { lotIdx, bidderId: playerId, amount: cashBid };
      addLog(state, `${player.name} starts container lot auction (bid $${cashBid})`);
    } else {
      // Outbid
      bank.containerAuction = { lotIdx: existing.lotIdx, bidderId: playerId, amount: cashBid };
      addLog(state, `${player.name} outbids to $${cashBid} on container lot ${lotIdx+1}`);
    }
  } else {
    // Cash auction: bid containers to win cash; gold counts as 1.5
    const existing = bank.cashAuction;
    const bidCount = containerBid ? containerBid.length : 0;
    if (bidCount === 0) return err('Must bid at least 1 container');
    const newWeight = bidWeight(containerBid);
    if (existing) {
      const existingWeight = bidWeight(existing.containers);
      if (newWeight <= existingWeight) {
        const wStr = existingWeight % 1 ? existingWeight.toFixed(1) : existingWeight;
        return err(`Must outweigh current bid (${wStr} — gold counts as 1.5)`);
      }
    }

    if (!existing) {
      if (state.wonAuctionThisTurn) return err('Cannot start an auction on the same turn you won one');
      if (bank.tokensLeft <= 0) return err('No auction tokens available');
      bank.tokensLeft--;
      bank.cashAuction = { lotIdx, bidderId: playerId, containers: containerBid };
      addLog(state, `${player.name} starts cash lot auction (bid ${bidCount} container(s), weight ${newWeight})`);
    } else {
      // Return previous bidder's containers
      if (existing.bidderId !== playerId) {
        addLog(state, `${state.players[existing.bidderId].name}'s container bid returned`);
      }
      bank.cashAuction = { lotIdx: existing.lotIdx, bidderId: playerId, containers: containerBid };
      addLog(state, `${player.name} outbids with ${bidCount} container(s) (weight ${newWeight})`);
    }
  }
  return ok();
}

function takeLoan(state, playerId) {
  const player = state.players[playerId];
  if (totalLoans(player) >= MAX_LOANS) return err('Already have 2 loans');
  player.loans++;
  player.cash += 10;
  addLog(state, `${player.name} takes a $10 bank loan`);
  return ok();
}

// loanType: 'bank' or 'player'; loanIdx is index into playerLoans array for player loans.
function repayLoan(state, playerId, loanType = 'bank', loanIdx = 0) {
  const player = state.players[playerId];
  if (loanType === 'player') {
    const loan = (player.playerLoans || [])[loanIdx];
    if (!loan) return err('No such player loan');
    if (player.cash < loan.amount) return err(`Need $${loan.amount} to repay this loan`);
    player.cash -= loan.amount;
    const lender = state.players[loan.lenderId];
    if (lender) lender.cash += loan.amount;
    player.playerLoans.splice(loanIdx, 1);
    addLog(state, `${player.name} repays $${loan.amount} to ${lender?.name || 'player'}`);
  } else {
    if (player.loans === 0) return err('No bank loans outstanding');
    if (player.cash < 10) return err('Need $10 to repay');
    player.loans--;
    player.cash -= 10;
    addLog(state, `${player.name} repays a bank loan`);
  }
  return ok();
}

// Expansion: Player Loans — accept a loan from another player (after incentive auction).
// incentiveAmount: extra cash the lender bids (on top of $10) to win the right to loan.
function acceptPlayerLoan(state, borrowerId, lenderId, incentiveAmount = 0) {
  const borrower = state.players[borrowerId];
  const lender   = state.players[lenderId];
  if (totalLoans(borrower) >= MAX_LOANS) return err('Already at loan limit');
  const loanAmount = 10 + incentiveAmount;
  if (lender.cash < loanAmount) return err(`${lender.name} needs $${loanAmount}`);
  lender.cash -= loanAmount;
  borrower.cash += loanAmount;
  borrower.playerLoans = borrower.playerLoans || [];
  borrower.playerLoans.push({ lenderId, amount: loanAmount });
  addLog(state, `${borrower.name} receives player loan of $${loanAmount} from ${lender.name}`);
  return ok();
}

// Expansion: Truck Companies — start or outbid a truck company auction (cash bids only).
function callTruckAuction(state, playerId, targetPlayerId, cashBid) {
  const player = state.players[playerId];
  const target = state.players[targetPlayerId];
  const bank   = state.bank;

  if (!state.modules?.truckCompanies) return err('Truck Companies module not active');
  if (player.trucksLeft <= 0) return err('No trucks left to place');

  const existing = bank.truckAuction;
  if (existing) {
    // Outbid
    if (existing.targetPlayerId !== targetPlayerId) return err('Another truck auction is in progress');
    if (existing.bidderId === playerId) return err('You already have the highest bid');
    if (cashBid <= existing.amount) return err(`Must bid more than $${existing.amount}`);
    if (player.cash < cashBid) return err(`Need $${cashBid}`);
    bank.truckAuction = { targetPlayerId, bidderId: playerId, amount: cashBid };
    addLog(state, `${player.name} outbids truck auction to $${cashBid}`);
  } else {
    // New auction
    if (state.wonAuctionThisTurn) return err('Cannot start an auction on the same turn you won one');
    if (target.truckCompanyOwner !== null) return err(`${target.name}'s Truck Company is already owned`);
    if (bank.tokensLeft <= 0) return err('No auction tokens available');
    if (player.cash < cashBid || cashBid <= 0) return err('Invalid bid');
    bank.tokensLeft--;
    bank.truckAuction = { targetPlayerId, bidderId: playerId, amount: cashBid };
    addLog(state, `${player.name} starts auction for ${target.name}'s Truck Company (bid $${cashBid})`);
  }
  return ok();
}

// Expansion: Luxury Containers — trade 2 containers for 1 gold (free action, once per turn).
function acquireLuxury(state, playerId, district, returnColors, goldPrice) {
  if (!state.modules?.luxuryContainers) return err('Luxury Containers module not active');
  const player = state.players[playerId];
  if (player.acquiredLuxuryThisTurn) return err('Already acquired a luxury container this turn');
  if ((state.goldSupply || 0) <= 0) return err('No gold containers in supply');
  if (returnColors.length !== 2) return err('Must return exactly 2 containers');

  const lots = district === 'factory' ? player.factoryLots : player.harborLots;
  const targetPrices = district === 'factory' ? [1,2,3,4] : [1,2,3,4,5];
  if (!targetPrices.includes(goldPrice)) return err('Invalid price');

  // Verify containers exist and remove them
  const available = lots.flatMap(l => l.containers);
  const temp = [...available];
  for (const c of returnColors) {
    const i = temp.indexOf(c);
    if (i === -1) return err(`${COLOR_LABEL[c] || c} not found in your ${district} district`);
    temp.splice(i, 1);
  }
  removeFromLots(lots, returnColors);

  // Return containers to supply
  for (const c of returnColors) {
    if (c === 'gold') {
      state.goldSupply = (state.goldSupply || 0) + 1;
    } else {
      state.containerSupply[c] = (state.containerSupply[c] || 0) + 1;
    }
  }

  // Place gold in district at chosen price
  const targetLot = lots.find(l => l.price === goldPrice);
  if (!targetLot) return err('Price lot not found');
  targetLot.containers.push('gold');
  state.goldSupply--;
  player.acquiredLuxuryThisTurn = true;

  addLog(state, `${player.name} acquires Gold luxury container (district: ${district}, $${goldPrice})`);
  checkGameEnd(state);
  return ok();
}

function defaultOnLoan(state, playerId) {
  const player = state.players[playerId];
  // Bank seizes 1 container from: island > ship > bank holding > harbor > factory
  const sources = [
    { name: 'island', arr: player.islandContainers },
    { name: 'ship',   arr: player.shipContainers },
    { name: 'bank holding', arr: state.bank.holdingAreas[player.id] },
    ...player.harborLots.map((l, i) => ({ name: `harbor`, arr: l.containers })),
    ...player.factoryLots.map((l, i) => ({ name: `factory`, arr: l.containers })),
  ];

  for (const src of sources) {
    if (src.arr.length > 0) {
      const seized = src.arr.splice(0, 1)[0];
      distributeContainersToBank(state, [seized]);
      addLog(state, `${player.name} defaults! Bank seizes ${COLOR_LABEL[seized]} from ${src.name}`);
      checkGameEnd(state);
      return;
    }
  }
  addLog(state, `${player.name} defaults but has no containers to seize`);
}

// ── Delivery auction ──────────────────────────────────────────────────────────

function startDeliveryAuction(state, deliveryPlayerId) {
  const player = state.players[deliveryPlayerId];
  const containers = [...player.shipContainers];
  if (containers.length === 0) {
    // No containers: nothing to auction; turn ends
    player.shipContainers = [];
    addLog(state, `${player.name} delivers to island with empty ship`);
    state.deliveryAuction = null;
    return;
  }
  state.deliveryAuction = {
    deliveryPlayerId,
    containers,
    bids: {},         // playerId -> amount
    resolved: false,
  };
  state.phase = 'delivery_auction';
  addLog(state, `${player.name} holds delivery auction (${containers.length} containers)`);
}

// bids: { [playerId]: amount }  – the cash amounts each bidder commits
// forcedWinnerId: set by UI after runoff/deliverer tie-break
function resolveDeliveryAuction(state, bids, delivererBuysOut = false, forcedWinnerId = null) {
  const auction = state.deliveryAuction;
  const deliverer = state.players[auction.deliveryPlayerId];

  // Find highest bid; tie-breaking is handled by UI before this call
  let highBid = 0, winnerId = forcedWinnerId;
  for (const [pid, amount] of Object.entries(bids)) {
    if (Number(pid) === auction.deliveryPlayerId) continue;
    if (amount > highBid) {
      highBid = amount;
      if (!forcedWinnerId) winnerId = Number(pid);
    }
  }
  if (forcedWinnerId !== null) highBid = bids[forcedWinnerId] ?? highBid;

  if (winnerId === null || highBid <= 0 || delivererBuysOut) {
    // Deliverer keeps containers: rejected bids, no bids, or all $0
    if (highBid > 0 && delivererBuysOut) {
      while (deliverer.cash < highBid && totalLoans(deliverer) < MAX_LOANS) {
        deliverer.cash += 10;
        deliverer.loans++;
      }
      deliverer.cash -= highBid;
      distributeCashToBank(state, highBid);
    }
    auction.containers.forEach(c => deliverer.islandContainers.push(c));
    deliverer.shipContainers = [];
    addLog(state, delivererBuysOut
      ? `${deliverer.name} rejects bids, buys out delivery for $${highBid}`
      : `${deliverer.name} keeps containers (no valid bids)`);
  } else {
    // Accepted: winner takes containers, deliverer earns double
    const winner = state.players[winnerId];
    winner.cash -= highBid;
    deliverer.cash += highBid * 2;
    auction.containers.forEach(c => winner.islandContainers.push(c));
    deliverer.shipContainers = [];
    addLog(state, `${winner.name} wins delivery with $${highBid}; ${deliverer.name} earns $${highBid*2}`);
  }

  state.deliveryAuction = null;
  // Turn ends immediately after delivery auction
  advanceTurn(state);
}

// ── Turn management ───────────────────────────────────────────────────────────

function useAction(state) {
  state.actionsLeft--;
  if (state.actionsLeft <= 0) {
    advanceTurn(state);
  }
}

function advanceTurn(state) {
  const nextIdx = nextPlayerIdx(state);
  state.currentPlayerIdx = nextIdx;
  state.actionsLeft = 2;
  state.wonAuctionThisTurn = false;
  if (nextIdx === 0) state.turnNum++;  // only increment when all players have gone (new round)
  state.phase = 'turn_start';
}

// ── Game end ──────────────────────────────────────────────────────────────────

function checkGameEnd(state) {
  const { containerSupply } = state;
  let exhaustedColors = 0;
  for (const c of COLORS) {
    if ((containerSupply[c] || 0) <= 0) exhaustedColors++;
  }
  // Expansion: Luxury Containers — gold exhaustion counts as 1 of the 2 required
  if (state.modules?.luxuryContainers && (state.goldSupply || 0) <= 0) {
    exhaustedColors++;
  }
  if (exhaustedColors >= 2) {
    state.gameOver = true;
    state.phase = 'game_end';
    // If luxury containers active and humans have gold on island, defer scoring
    // so UI can collect gold color choices first (APP_processNextTurn handles this).
    const humanWithGold = state.modules?.luxuryContainers &&
      state.players.some(p => !p.isAI && p.islandContainers.some(c => c === 'gold'));
    if (!humanWithGold) {
      computeFinalScores(state);
    }
  }
}

// Score a given island array for a player, resolving the "discard most common" rule.
// Rules:
//   1. Determine if you have ALL 5 colors (before discarding).
// Returns { score, discardColor, discardCount, remaining, hasAllColors, islandBreakdown }
function scoreIslandContainers(player, island) {
  const card = player.scoringCard;
  const colorCount = {};
  COLORS.forEach(c => { colorCount[c] = 0; });
  island.forEach(c => { if (c !== 'gold') colorCount[c]++; });

  // Check all-colors BEFORE discarding
  const hasAllColors = COLORS.every(c => colorCount[c] > 0);

  // Find discard color — most common
  const maxCount = Math.max(0, ...Object.values(colorCount));
  let discardColor = null;
  const tied = COLORS.filter(c => colorCount[c] === maxCount && maxCount > 0);

  if (tied.length === 1) {
    discardColor = tied[0];
  } else if (tied.includes(card.twoValue)) {
    // Rule: must discard two-value color when it's tied for most common
    discardColor = card.twoValue;
  } else if (tied.length > 1) {
    // Player chooses; for AI/auto pick least face-value color
    let worstVal = Infinity;
    for (const c of tied) {
      const val = card.values[c] || 0;
      if (val < worstVal) { worstVal = val; discardColor = c; }
    }
  }

  const discardCount = discardColor ? colorCount[discardColor] : 0;

  // Score remaining containers and build per-color breakdown
  const remaining = island.filter(c => c !== 'gold' && c !== discardColor);
  let score = 0;
  const islandBreakdown = {};
  for (const c of remaining) {
    const perUnit = (c === card.twoValue) ? (hasAllColors ? 10 : 5) : (card.values[c] || 0);
    score += perUnit;
    if (!islandBreakdown[c]) islandBreakdown[c] = { count: 0, perUnit, subtotal: 0 };
    islandBreakdown[c].count++;
    islandBreakdown[c].subtotal += perUnit;
  }

  return { score, discardColor, discardCount, remaining, hasAllColors, islandBreakdown };
}

// Choose the best color to assign gold containers to for a player.
function chooseBestGoldColor(player, island) {
  const goldCount = island.filter(c => c === 'gold').length;
  if (goldCount === 0) return null;
  const noGold = island.filter(c => c !== 'gold');

  let bestColor = COLORS[0], bestScore = -1;
  for (const color of COLORS) {
    const withGold = [...noGold, ...Array(goldCount).fill(color)];
    const { score } = scoreIslandContainers(player, withGold);
    if (score > bestScore) { bestScore = score; bestColor = color; }
  }
  return bestColor;
}

function computeFinalScores(state) {
  // Resolve any active bank auctions
  resolveEndGameBankAuctions(state);

  // Expansion: Luxury — AIs choose gold color; humans must have chosen already (or auto-pick)
  if (state.modules?.luxuryContainers) {
    for (const player of state.players) {
      if (player.islandContainers.some(c => c === 'gold')) {
        if (!player.goldColor) {
          player.goldColor = chooseBestGoldColor(player, player.islandContainers);
        }
      }
    }
  }

  const scores = state.players.map(player => {
    // Expand gold containers into the chosen color
    const rawIsland = [...player.islandContainers];
    const island = state.modules?.luxuryContainers && player.goldColor
      ? rawIsland.map(c => c === 'gold' ? player.goldColor : c)
      : rawIsland.filter(c => c !== 'gold');

    const { score: islandScore, discardColor, discardCount, remaining: remainingIsland, hasAllColors, islandBreakdown } =
      scoreIslandContainers(player, island);

    // Step 3: Score leftover containers
    const shipCount = player.shipContainers.length;
    const holding = state.bank.holdingAreas[player.id] || [];
    const holdingCount = holding.length;
    const harborCount = player.harborLots.reduce((s, l) => s + l.containers.length, 0);
    const factoryCount = player.factoryLots.reduce((s, l) => s + l.containers.length, 0);
    const leftoverScore = shipCount * 3 + holdingCount * 3 + harborCount * 2;

    // Step 4: Loan penalties — $11 per outstanding bank loan + player loan (repay face value + $1)
    const bankLoans = player.loans || 0;
    const bankLoanPenalty = bankLoans * 11;
    const playerLoanPenalty = (player.playerLoans || []).reduce((s, l) => s + l.amount + 1, 0);
    const loanPenalty = bankLoanPenalty + playerLoanPenalty;

    const total = player.cash + islandScore + leftoverScore - loanPenalty;

    return {
      playerId: player.id,
      name: player.name,
      cash: player.cash,
      islandScore,
      islandBreakdown,
      leftoverScore,
      shipCount,
      holdingCount,
      harborCount,
      factoryCount,
      loanPenalty,
      bankLoans,
      bankLoanPenalty,
      playerLoanPenalty,
      total,
      discardColor,
      discardCount,
      remainingIsland,
      hasAllColors,
      scoringCard: player.scoringCard,
      goldColor: player.goldColor || null,
    };
  });

  state.scores = scores;
  addLog(state, 'Game over – final scoring complete');
}

function resolveEndGameBankAuctions(state) {
  const bank = state.bank;
  if (bank.containerAuction) {
    const a = bank.containerAuction;
    const winner = state.players[a.bidderId];
    bank.holdingAreas[winner.id].push(...bank.containerLots[a.lotIdx]);
    bank.containerLots[a.lotIdx] = [];
    bank.containerAuction = null;
  }
  if (bank.cashAuction) {
    const a = bank.cashAuction;
    const winner = state.players[a.bidderId];
    winner.cash += bank.cashLots[a.lotIdx];
    bank.cashLots[a.lotIdx] = 0;
    removeBidContainersFromPlayer(state, winner.id, a);
    distributeContainersToBank(state, a.containers);
    bank.cashAuction = null;
  }
  // Truck company auction: at game end, highest bidder wins (no further processing needed)
  if (bank.truckAuction) {
    const a = bank.truckAuction;
    const winner = state.players[a.bidderId];
    distributeCashToBank(state, a.amount);
    state.players[a.targetPlayerId].truckCompanyOwner = winner.id;
    winner.trucksLeft = Math.max(0, winner.trucksLeft - 1);
    bank.truckAuction = null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function colorCounts(lots) {
  const counts = {};
  COLORS.forEach(c => { counts[c] = 0; });
  lots.forEach(l => l.containers.forEach(c => { counts[c] = (counts[c] || 0) + 1; }));
  return counts;
}

function sumCounts(counts) {
  return Object.values(counts).reduce((s, v) => s + v, 0);
}

function totalLoans(player) {
  return (player.loans || 0) + (player.playerLoans?.length || 0);
}

// Remove exactly the containers listed (by color string) from an array of lots, one at a time.
function removeFromLots(lots, colors) {
  const remaining = [...colors];
  for (const lot of lots) {
    for (let i = lot.containers.length - 1; i >= 0 && remaining.length > 0; i--) {
      const idx = remaining.indexOf(lot.containers[i]);
      if (idx !== -1) {
        lot.containers.splice(i, 1);
        remaining.splice(idx, 1);
      }
    }
  }
  return remaining.length === 0;
}

function ok(extra) { return { ok: true, ...extra }; }
function err(msg)  { return { ok: false, error: msg }; }
