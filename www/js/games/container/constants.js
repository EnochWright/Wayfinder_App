// Container board game – constants

const COLORS = ['white', 'yellow', 'green', 'blue', 'red'];

const COLOR_HEX = {
  white:  '#f0ede8',
  yellow: '#f0c040',
  green:  '#4caf50',
  blue:   '#2196f3',
  red:    '#e53935',
};

const COLOR_LABEL = {
  white: 'White', yellow: 'Yellow', green: 'Green', blue: 'Blue', red: 'Red',
  gold: 'Gold',
};

// Expansion: gold luxury container color
COLOR_HEX['gold']  = '#c8860a';  // warm amber-brown, distinct from yellow

// Player token colors (distinct from container colors)
const PLAYER_CSS = ['#e67e22', '#db2777', '#7c3aed', '#1f2937', '#0d9488'];
const PLAYER_CSS_NAME = ['Orange', 'Pink', 'Purple', 'Black', 'Teal'];
const PLAYER_NAMES_DEFAULT = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'];

// Card format: primary color = $10 fixed; twoValue = $10 (all colors) / $5 (missing color)
// values[twoValue] is 0 — overridden by the $10/$5 rule in scoring
const SCORING_CARDS = [
  { id:0, label:'W', values:{white:10, green:0,   red:6,   blue:4,  yellow:2}, twoValue:'green'  },
  { id:1, label:'B', values:{blue:10,  yellow:0,  white:6, green:4, red:2   }, twoValue:'yellow' },
  { id:2, label:'R', values:{red:10,   blue:0,    yellow:6,white:4, green:2 }, twoValue:'blue'   },
  { id:3, label:'Y', values:{yellow:10,white:0,   green:6, red:4,   blue:2  }, twoValue:'white'  },
  { id:4, label:'G', values:{green:10, red:0,     blue:6,  yellow:4,white:2 }, twoValue:'red'    },
];

// Cost to build the Nth factory/warehouse (index = current count before building)
// First is FREE; player always starts with 1 of each
const FACTORY_COST   = [0, 6, 9, 12];       // 1st free, 2nd=$6, 3rd=$9, 4th=$12
const WAREHOUSE_COST = [0, 4, 5, 6, 7];     // 1st free, 2nd=$4, 3rd=$5, 4th=$6, 5th=$7

// Supply table by total player count
const SUPPLY_TABLE = {
  3: { factories:2, warehouses:12, containers:{ short:9,  standard:11, extended:12 } },
  4: { factories:3, warehouses:16, containers:{ short:11, standard:14, extended:16 } },
  5: { factories:4, warehouses:20, containers:{ short:13, standard:17, extended:20 } },
};

// Auction tokens available per player count
const AUCTION_TOKENS = { 3:1, 4:1, 5:2 };

// Ship capacity
const SHIP_CAPACITY = 5;
// Max factories / warehouses per player
const MAX_FACTORIES  = 4;
const MAX_WAREHOUSES = 5;
// Max loans
const MAX_LOANS = 2;
