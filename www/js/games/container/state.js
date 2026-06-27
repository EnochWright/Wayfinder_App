// Container board game – state initialisation & helpers

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createPlayer(id, name, isAI, cssColor, startFactory, card) {
  return {
    id, name, isAI, cssColor,
    cash: 20,
    loans: 0,          // bank loan count (0–2)
    playerLoans: [],   // [{lenderId: playerId, amount: number}] — Expansion: Player Loans
    scoringCard: card,

    // Expansion: Truck Companies
    truckCompanyOwner: null,  // playerId who owns THIS player's local truck company (null = independent)
    trucksLeft: 3,             // trucks remaining to place on companies
    truckingFund: 0,           // $1 freight fees accumulating in this player's trucking area

    // Expansion: Luxury Containers
    acquiredLuxuryThisTurn: false,
    goldColor: null,  // color chosen for gold containers at final scoring

    factories: [startFactory],  // colors of built factories
    warehouses: 1,              // count (1–5)

    // Factory lots priced $1–$4
    factoryLots: [1,2,3,4].map(p => ({ price: p, containers: [] })),
    // Harbor lots priced $2–$6
    harborLots:  [2,3,4,5,6].map(p => ({ price: p, containers: [] })),

    // shipLocation: 'ocean' | 'island' | 'bank' | <playerId number>
    shipLocation: 'ocean',
    shipContainers: [],   // max SHIP_CAPACITY (5)
    bankHolding: [],      // containers sitting in player's bank holding area

    // Containers this player holds on Container Island (scored at end)
    islandContainers: [],
  };
}

function initGame(humanCount, aiCount, gameLength = 'standard', modules = {}, playerColors = [], seatOrder = null) {
  const n = humanCount + aiCount;
  if (n < 3 || n > 5) throw new Error('Total players must be 3–5');

  const supplyData = SUPPLY_TABLE[n];
  const baseContainers = supplyData.containers[gameLength];

  // Shuffle scoring cards and factory colours (assigned per seat position)
  const cards = shuffle([...SCORING_CARDS]).slice(0, n);
  const factoryColors = shuffle([...COLORS]).slice(0, n);

  // Assign player token colors: humans get their chosen index (or random), AIs get the rest
  const usedColorIdx = new Set();
  const humanColorIdx = [];
  for (let i = 0; i < humanCount; i++) {
    if (playerColors[i] != null) {
      humanColorIdx.push(playerColors[i]);
      usedColorIdx.add(playerColors[i]);
    } else {
      humanColorIdx.push(null);
    }
  }
  const unclaimedIdx = shuffle([0,1,2,3,4].filter(i => !usedColorIdx.has(i)));
  let ri = 0;
  for (let i = 0; i < humanCount; i++) {
    if (humanColorIdx[i] === null) {
      humanColorIdx[i] = unclaimedIdx[ri++];
      usedColorIdx.add(humanColorIdx[i]);
    }
  }
  const aiColorIdx = [0,1,2,3,4].filter(i => !usedColorIdx.has(i));

  // Build default seat order (humans first, then AIs) if not provided
  if (!seatOrder || seatOrder.length !== n) {
    seatOrder = [];
    for (let i = 0; i < humanCount; i++) seatOrder.push(`h${i}`);
    for (let i = 0; i < aiCount; i++) seatOrder.push(`ai${i}`);
  }

  // Create players in seat order; factory color and scoring card assigned per seat
  const players = seatOrder.map((role, seatIdx) => {
    const isAI = role.startsWith('ai');
    const localIdx = isAI ? parseInt(role.slice(2)) : parseInt(role.slice(1));
    const ci = isAI ? aiColorIdx[localIdx] : humanColorIdx[localIdx];
    const colorName = PLAYER_CSS_NAME[ci];
    const name = isAI ? `${colorName} Automa` : `${colorName} Player`;
    return createPlayer(seatIdx, name, isAI, PLAYER_CSS[ci], factoryColors[seatIdx], cards[seatIdx]);
  });

  // Starting containers: each player gets 1 container of their factory colour in the $2 lot
  players.forEach(p => {
    p.factoryLots[1].containers.push(p.factories[0]);
  });

  // Build container supply
  const containerSupply = {};
  COLORS.forEach(c => { containerSupply[c] = baseContainers; });
  factoryColors.forEach(c => { containerSupply[c]--; }); // taken by players

  // Bank setup: take 1 of each colour, place 2 at lot I, 1 at lot II, return 2 to supply
  const bankPick = shuffle([...COLORS]);
  COLORS.forEach(c => { containerSupply[c]--; }); // bank takes 1 each
  const bankContainerLots = [
    [bankPick[0], bankPick[1]],  // lot I
    [bankPick[2]],               // lot II
    [],                          // lot III
  ];
  containerSupply[bankPick[3]]++;  // return 2
  containerSupply[bankPick[4]]++;

  // Warehouse & factory supply (already took one each for each player)
  let warehouseSupply = supplyData.warehouses - n;
  const factorySupply = {};
  COLORS.forEach(c => {
    factorySupply[c] = supplyData.factories;
  });
  factoryColors.forEach(c => { factorySupply[c]--; });

  return {
    players,
    n,
    humanCount,

    currentPlayerIdx: 0,
    actionsLeft: 2,
    turnNum: 1,
    gameLength,

    // phase controls what the UI shows / allows
    // Possible values:
    //   'turn_start'     – auto-process: pay interest, resolve bank win
    //   'action_select'  – human picking an action
    //   'action_build'   – modal: choose build type/colour
    //   'action_produce' – modal: arrange new containers into price lots
    //   'action_factory_buy' – modal: choose opponent + containers
    //   'action_harbor_buy'  – modal: buy from docked harbor
    //   'action_sail'    – modal: choose destination
    //   'action_reprice' – modal: rearrange containers in one district
    //   'action_call_bank'   – modal: bid on bank auction
    //   'delivery_auction'   – modal: bid on delivery
    //   'game_end'       – scoring screen
    phase: 'turn_start',

    containerSupply,
    warehouseSupply,
    factorySupply,

    modules: {
      classic:          !!modules.classic,
      truckCompanies:   !!modules.truckCompanies,
      luxuryContainers: !!modules.luxuryContainers,
      playerLoans:      !!modules.playerLoans,
    },

    // Expansion: Luxury Containers
    goldSupply: modules.luxuryContainers ? 10 : 0,

    bank: {
      containerLots: bankContainerLots,  // array of 3, each is array of colour strings
      cashLots: [1, 2, 3],              // cash amount in each lot
      // Active auctions: null or { lotIdx, bidderId, amount }
      containerAuction: null,  // players bid CASH to win containers
      cashAuction: null,       // players bid CONTAINERS to win cash
      // Expansion: Truck Companies
      truckAuction: null,      // { targetPlayerId, bidderId, amount } — bid cash to own a truck company
      holdingAreas: Object.fromEntries(players.map(p => [p.id, []])),
      tokensLeft: AUCTION_TOKENS[n],
    },

    // While a delivery is in progress
    deliveryAuction: null,  // { deliveryPlayerId, containers, bids:{id->amount}, resolved }

    pendingAction: null,  // stores partial action info during multi-step UI

    log: [],
    gameOver: false,
    scores: null,
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function factoryLimit(player) { return player.factories.length * 2; }
function harborLimit(player)  { return player.warehouses; }

function countFactory(player) {
  return player.factoryLots.reduce((s, l) => s + l.containers.length, 0);
}
function countHarbor(player) {
  return player.harborLots.reduce((s, l) => s + l.containers.length, 0);
}

function nextFactoryCost(player) {
  const n = player.factories.length;
  return n < MAX_FACTORIES ? FACTORY_COST[n] : null;
}
function nextWarehouseCost(player) {
  const n = player.warehouses;
  return n < MAX_WAREHOUSES ? WAREHOUSE_COST[n] : null;
}

// Player seated to the right (pays union wages)
function rightOfPlayer(state, playerId) {
  return (playerId - 1 + state.n) % state.n;
}

function nextPlayerIdx(state) {
  return (state.currentPlayerIdx + 1) % state.n;
}

function addLog(state, msg) {
  state.log.unshift(`[R${state.turnNum}] ${msg}`);
}

function currentPlayer(state) {
  return state.players[state.currentPlayerIdx];
}
