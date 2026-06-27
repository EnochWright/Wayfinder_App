// Container board game â€“ UI rendering & interaction

// â”€â”€ Colour pill helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function pill(color, count) {
  const n = count !== undefined ? count : 1;
  const arr = Array.isArray(color) ? color : Array(n).fill(color);
  return arr.map(c =>
    `<span class="container-pill" style="background:${COLOR_HEX[c]}" title="${COLOR_LABEL[c]}"></span>`
  ).join('');
}

function pillPriced(color, price) {
  return `<span class="container-pill-wrap"><span class="container-pill" style="background:${COLOR_HEX[color]}" title="${COLOR_LABEL[color]} $${price}"></span><span class="pill-price">$${price}</span></span>`;
}

function money(n) { return `<span class="money">$${n}</span>`; }

function playerChip(player) {
  return `<span class="player-chip" style="background:${player.cssColor}">${player.name[0]}</span>`;
}

// â”€â”€ Main render dispatch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function render(state) {
  if (state.gameOver) { renderGameEnd(state); return; }

  renderHeader(state);
  renderBank(state);
  renderIsland(state);
  renderOpponents(state);
  renderMyBoard(state);
  renderLog(state);
  renderActionArea(state);
}

// â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderHeader(state) {
  const player = currentPlayer(state);
  const el = document.getElementById('header');
  el.innerHTML = `
    <div class="header-row">
      <div class="header-info">
        <span class="turn-badge">Round ${state.turnNum}</span>
        <span style="color:${player.cssColor};font-weight:700">${player.name}</span>
        <span class="actions-left-badge">${state.actionsLeft} action${state.actionsLeft!==1?'s':''} left</span>
      </div>
      <button class="reset-btn" onclick="confirmReset()">â†º Reset</button>
    </div>
  `;
  window.confirmReset = function() {
    if (confirm('End this game and return to setup?')) {
      document.getElementById('modal').innerHTML = '';
      showSetupScreen();
    }
  };
}

function phaseLabel(phase) {
  const map = {
    turn_start: 'Starting turnâ€¦',
    action_select: '',
    action_build: 'Build',
    action_produce: 'Produce',
    action_factory_buy: 'Factory Purchase',
    action_harbor_buy: 'Harbor Purchase',
    action_sail: 'Sail',
    action_reprice: 'Reprice',
    action_call_bank: 'Call Bank',
    delivery_auction: 'Delivery Auction!',
    game_end: 'Game Over',
  };
  return map[phase] ?? phase;
}

// â”€â”€ Bank distribution helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function describeBankDistribution(bank, amount) {
  const adds = [0, 0, 0];
  let remaining = amount;
  let i = 0;
  const blockedIdx = bank.cashAuction != null ? bank.cashAuction.lotIdx : -1;
  while (remaining > 0 && i < amount * 6 + 9) {
    const idx = i % 3;
    if (idx !== blockedIdx) { adds[idx]++; remaining--; }
    i++;
  }
  const names = ['I', 'II', 'III'];
  const parts = adds.map((a, idx) => a > 0 ? `$${a} â†’ Lot ${names[idx]}` : null).filter(Boolean);
  const skipNote = blockedIdx >= 0 ? ` <em>(Lot ${names[blockedIdx]} skipped â€” auction in progress)</em>` : '';
  return parts.join(', ') + skipNote;
}

function describeBankContainerDistribution(bank, containers) {
  const slots = [[], [], []];
  let i = 0;
  const blockedIdx = bank.containerAuction != null ? bank.containerAuction.lotIdx : -1;
  for (const item of containers) {
    const color = typeof item === 'string' ? item : item.color;
    let placed = false, tries = 0;
    while (!placed && tries < 4) {
      const idx = i % 3;
      if (idx !== blockedIdx) { slots[idx].push(color); placed = true; }
      i++; tries++;
    }
    if (!placed) {
      for (let k = 0; k < 3; k++) { if (k !== blockedIdx) { slots[k].push(color); placed = true; break; } }
    }
    if (!placed) slots[0].push(color);
  }
  const names = ['I', 'II', 'III'];
  const parts = slots.map((cs, idx) => cs.length > 0 ? `${cs.map(c => COLOR_LABEL[c]).join(' + ')} â†’ Lot ${names[idx]}` : null).filter(Boolean);
  const skipNote = blockedIdx >= 0 ? ` <em>(Lot ${names[blockedIdx]} skipped â€” auction in progress)</em>` : '';
  return parts.join('; ') + skipNote;
}

// â”€â”€ Bank board â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderBank(state) {
  const bank = state.bank;
  const el = document.getElementById('bank-board');

  const conLots = bank.containerLots.map((lot, i) => {
    const hasAuction = bank.containerAuction && bank.containerAuction.lotIdx === i;
    const auctionBadge = hasAuction
      ? `<div class="auction-badge">$${bank.containerAuction.amount} bid by ${state.players[bank.containerAuction.bidderId].name}</div>`
      : '';
    const lotSvgs = lot.length > 0
      ? lot.map(c => `<img src="assets/container/svg/container_${c}.svg" class="container-svg-img" alt="${c}">`).join('')
      : '<span class="empty">empty</span>';
    return `<div class="bank-lot ${hasAuction ? 'has-auction' : ''}">
      <div class="lot-label">Containers ${['I','II','III'][i]}</div>
      <div class="lot-contents lot-row">${lotSvgs}${auctionBadge}</div>
    </div>`;
  }).join('');

  const cashLots = bank.cashLots.map((cash, i) => {
    const hasAuction = bank.cashAuction && bank.cashAuction.lotIdx === i;
    const auctionBadge = hasAuction ? (() => {
      const w = bidWeight(bank.cashAuction.containers);
      const wStr = w % 1 ? w.toFixed(1) : w;
      return `<div class="auction-badge">${wStr} bid (${bank.cashAuction.containers.length} containers) by ${state.players[bank.cashAuction.bidderId].name}</div>`;
    })() : '';
    return `<div class="bank-lot ${hasAuction ? 'has-auction' : ''}">
      <div class="lot-label">Cash ${['I','II','III'][i]}</div>
      <div class="lot-contents">${money(cash)}${auctionBadge}</div>
    </div>`;
  }).join('');

  // Holding areas
  const holdingRows = state.players.map(p => {
    const holding = state.bank.holdingAreas[p.id];
    if (holding.length === 0) return '';
    const holdingSvgs = holding.map(c => `<img src="assets/container/svg/container_${c}.svg" class="container-svg-img" alt="${c}">`).join('');
    return `<div class="holding-row">
      <span style="color:${p.cssColor}">${p.name}:</span>
      <div class="lot-row">${holdingSvgs}</div>
    </div>`;
  }).join('');

  const mods = state.modules || {};

  // Expansion: Truck Companies status
  let truckStatusHtml = '';
  if (mods.truckCompanies) {
    const truckRows = state.players.map(p => {
      const owner = p.truckCompanyOwner !== null ? state.players[p.truckCompanyOwner] : null;
      const auctionActive = bank.truckAuction && bank.truckAuction.targetPlayerId === p.id;
      const fundNote = (p.truckingFund > 0) ? ` <span class="truck-fund">$${p.truckingFund}</span>` : '';
      return `<span class="truck-co-status">
        <span style="color:${p.cssColor}">${p.name}:</span>
        ${owner ? `<span class="ai-tag" style="background:${owner.cssColor}">${owner.name}</span>`
                : (auctionActive ? `<span class="ai-tag">$${bank.truckAuction.amount} bid</span>` : 'independent')}
        ${fundNote}
      </span>`;
    }).join('');
    truckStatusHtml = `<div class="truck-cos-row"><strong>Truck Companies:</strong> ${truckRows}</div>`;
    if (bank.truckAuction) {
      const bidder = state.players[bank.truckAuction.bidderId];
      const target = state.players[bank.truckAuction.targetPlayerId];
      truckStatusHtml += `<div class="auction-badge" style="margin-top:4px">
        Truck auction: ${target.name}'s Company â€” $${bank.truckAuction.amount} bid by ${bidder.name}
      </div>`;
    }
  }

  // Expansion: Luxury Containers gold supply
  const goldSupplyHtml = mods.luxuryContainers
    ? `<div class="gold-supply-row">Gold supply: <img src="assets/container/svg/container_gold.svg" class="container-svg-img" alt="gold"> Ã— ${state.goldSupply || 0}</div>`
    : '';

  if (mods.classic) {
    el.innerHTML = `
      <div class="section-title">Bank Loans <span class="classic-badge">Classic Variant</span></div>
      <div class="classic-bank-note">No Off-Shore Bank board. Interest paid to supply.</div>
      ${truckStatusHtml}${goldSupplyHtml}`;
    return;
  }

  el.innerHTML = `
    <div class="section-title">Off-Shore Bank</div>
    <div class="bank-row">${conLots}</div>
    <div class="bank-row">${cashLots}</div>
    ${holdingRows ? `<div class="holding-area">${holdingRows}</div>` : ''}
    <div class="bank-tokens">Tokens left: ${bank.tokensLeft}</div>
    ${truckStatusHtml}
    ${goldSupplyHtml}
  `;
}

// â”€â”€ Island â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderIsland(state) {
  const el = document.getElementById('island-board');
  const areas = state.players.map(p => {
    const containers = p.islandContainers;
    const svgs = containers.length > 0
      ? COLORS.concat(state.modules?.luxuryContainers ? ['gold'] : [])
          .filter(c => containers.includes(c))
          .flatMap(c => containers.filter(x => x === c).map(() =>
            `<img src="assets/container/svg/container_${c}.svg" class="container-svg-img" alt="${c}">`
          )).join('')
      : '<span class="empty">empty</span>';
    return `<div class="island-area">
      <div style="color:${p.cssColor};font-size:0.8em">${p.name}</div>
      <div class="lot-row">${svgs}</div>
    </div>`;
  }).join('');

  // Container supply (including gold if module active)
  const displayColors = (state.modules?.luxuryContainers)
    ? [...COLORS, 'gold']
    : COLORS;
  const supplyRow = displayColors.map(c => {
    const n = c === 'gold' ? (state.goldSupply || 0) : (state.containerSupply[c] || 0);
    return `<div class="supply-item">
      <span class="container-pill" style="background:${COLOR_HEX[c]}"></span>
      <span class="supply-count">${n}</span>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="section-title">Container Island</div>
    <div class="island-areas">${areas}</div>
    <div class="supply-row">Supply: ${supplyRow}</div>
  `;
}

// Returns whichever player is shown on "My Board":
// the current player when they're human, otherwise the first human.
function myBoardPlayer(state) {
  const cp = currentPlayer(state);
  return !cp.isAI ? cp : (state.players.find(p => !p.isAI) || state.players[0]);
}

// â”€â”€ Opponents â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderOpponents(state) {
  const mine = myBoardPlayer(state);
  const el = document.getElementById('opponents');
  const rows = state.players
    .filter(p => p.id !== mine.id)
    .map(p => renderOpponentRow(p, state))
    .join('');

  el.innerHTML = rows;
}

function renderOpponentRow(player, state) {
  const factoryContainerHtml = player.factoryLots
    .flatMap(l => l.containers.map(c => svgPriced(c, l.price)))
    .join('') || '<span class="empty">empty</span>';
  const harborContainerHtml = player.harborLots
    .flatMap(l => l.containers.map(c => svgPriced(c, l.price)))
    .join('') || '<span class="empty">empty</span>';

  const shipLoc = player.shipLocation === 'ocean' ? 'Ocean'
    : player.shipLocation === 'island' ? 'Island'
    : player.shipLocation === 'bank' ? 'Bank'
    : `${state.players[player.shipLocation].name}'s harbor`;

  const shipHtml = buildShipHtml(player, 200);

  const mods = state.modules || {};
  const tLoans = totalLoans(player);
  const truckOwner = mods.truckCompanies && player.truckCompanyOwner !== null
    ? state.players[player.truckCompanyOwner] : null;
  const truckBadge = mods.truckCompanies
    ? (truckOwner
      ? `<span class="loan-badge" style="background:${truckOwner.cssColor}">TC:${truckOwner.name[0]}</span>`
      : `<span class="loan-badge" style="background:#888">TC:indep</span>`)
    : '';

  return `<div class="opponent-row">
    <div class="opp-header">
      <span style="color:${player.cssColor};font-weight:700">${player.name}</span>
      ${player.isAI && !player.name.includes('Automa') ? '<span class="ai-tag">Automa</span>' : ''}
      <span class="opp-cash">$${player.cash}</span>
      ${tLoans > 0 ? `<span class="loan-badge">${tLoans} loan${tLoans>1?'s':''}</span>` : ''}
      ${truckBadge}
    </div>
    <div class="opp-detail">
      <div class="opp-section">
        <span class="opp-section-label">ðŸ­ Factory <small>${countFactory(player)}/${factoryLimit(player)}</small></span>
        <span class="opp-factories">${player.factories.map(c => `<span class="factory-dot" style="background:${COLOR_HEX[c]}"></span>`).join('')}</span>
        <div class="lot-row">${factoryContainerHtml}</div>
      </div>
      <div class="opp-section">
        <span class="opp-section-label">ðŸª Harbor <small>(${player.warehouses}wh)</small></span>
        <div class="lot-row">${harborContainerHtml}</div>
      </div>
      <div class="opp-section">
        <span class="opp-section-label">ðŸš¢ Ship: ${shipLoc}</span>
        ${shipHtml}
      </div>
    </div>
  </div>`;
}

// â”€â”€ Human player's board â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function svgPriced(color, price) {
  return `<span class="container-pill-wrap container-pill-wrap--svg">` +
    `<img src="assets/container/svg/container_${color}.svg" class="container-svg-img" alt="${COLOR_LABEL[color] || color}">` +
    `<span class="pill-price">$${price}</span>` +
    `</span>`;
}

function playerShipColorName(player) {
  return player.name.split(' ')[0].toLowerCase();
}

function buildShipHtml(player, maxWidth) {
  try {
    const colorName = playerShipColorName(player);
    const slotY = [128, 178, 228, 278, 328];
    const containers = player.shipContainers || [];
    const containerImgs = containers.map(function(c, i) {
      var src = 'assets/container/svg/container_' + c + '.svg';
      return '<image href="' + src + '" xlink:href="' + src + '"' +
        ' x="54" y="' + slotY[i] + '" width="92" height="44"' +
        ' preserveAspectRatio="xMidYMid slice"/>';
    }).join('');
    const wrapStyle = maxWidth ? ' style="max-width:' + maxWidth + 'px;margin-left:0;margin-right:auto"' : '';
    return '<div class="player-ship-wrap"' + wrapStyle + '>' +
      '<img src="assets/container/svg/container_ship_' + colorName + '.svg"' +
      ' class="player-ship-svg" alt="ship">' +
      '<svg class="player-ship-overlay" viewBox="0 0 484 200"' +
      ' xmlns="http://www.w3.org/2000/svg"' +
      ' xmlns:xlink="http://www.w3.org/1999/xlink">' +
      '<g transform="translate(484 0) rotate(90)">' +
      containerImgs +
      '</g></svg></div>';
  } catch(e) {
    return '<p style="color:red;font-size:0.8em">ship error: ' + e.message + '</p>';
  }
}

function renderMyBoard(state) {
  const player = myBoardPlayer(state);
  const el = document.getElementById('my-board');

  const factoryContainerHtml = player.factoryLots
    .flatMap(lot => lot.containers.map(c => svgPriced(c, lot.price)))
    .join('') || '<span class="empty">empty</span>';

  const harborContainerHtml = player.harborLots
    .flatMap(lot => lot.containers.map(c => svgPriced(c, lot.price)))
    .join('') || '<span class="empty">empty</span>';

  const shipHtml = buildShipHtml(player);

  const shipLoc = player.shipLocation === 'ocean' ? 'Ocean'
    : player.shipLocation === 'island' ? 'Island'
    : player.shipLocation === 'bank' ? 'Bank'
    : `${state.players[player.shipLocation].name}'s harbor`;

  const factoryCost = nextFactoryCost(player);
  const whCost = nextWarehouseCost(player);

  const holdingContainers = state.bank.holdingAreas[player.id];

  const islandHtml = (() => {
    if (!player.islandContainers.length) return '';
    const grouped = {};
    for (const c of player.islandContainers) grouped[c] = (grouped[c] || 0) + 1;
    const svgs = COLORS.filter(c => grouped[c])
      .map(c => Array(grouped[c]).fill(null).map(() =>
        `<img src="assets/container/svg/container_${c}.svg" class="container-svg-img" alt="${c}">`
      ).join('')).join('');
    return '<div class="ship-area">' +
      '<div class="district-label">Container Island</div>' +
      '<div class="lot-row">' + svgs + '</div>' +
      '</div>';
  })();

  el.innerHTML = `
    <div class="section-title" style="color:${player.cssColor}">${player.name}</div>
    <div class="my-stats">
      <span class="big-money">$${player.cash}</span>
      ${totalLoans(player) > 0 ? `<span class="loan-badge">${totalLoans(player)} loan${totalLoans(player)>1?'s':''}</span>` : ''}
      ${(player.playerLoans || []).map(l => `<span class="loan-badge" style="background:${state.players[l.lenderId]?.cssColor || '#888'}">Owes $${l.amount}</span>`).join('')}
      ${(state.modules?.truckCompanies)
        ? (player.truckCompanyOwner !== null
          ? `<span class="loan-badge" style="background:${state.players[player.truckCompanyOwner]?.cssColor || '#888'}">TC owned by ${state.players[player.truckCompanyOwner]?.name || '?'}</span>`
          : `<span class="loan-badge" style="background:#888">TC: independent</span>`)
        : ''}
      <span class="scoring-hint">Card: <em>${player.scoringCard.label}</em></span>
    </div>

    <div class="district-grid">
      <div class="district">
        <div class="district-label">ðŸ­ Factory District
          <small>${countFactory(player)}/${factoryLimit(player)}</small>
          ${factoryCost ? `<small>(next: $${factoryCost})</small>` : ''}
        </div>
        <div class="factories-row">
          ${player.factories.map(c => `<span class="factory-dot" style="background:${COLOR_HEX[c]}" title="${COLOR_LABEL[c]}"></span>`).join('')}
        </div>
        <div class="lot-row">${factoryContainerHtml}</div>
      </div>

      <div class="district">
        <div class="district-label">ðŸª Harbor District
          <small>${countHarbor(player)}/${harborLimit(player)}</small>
          ${whCost ? `<small>(next: $${whCost})</small>` : ''}
        </div>
        <div class="wh-row"><small>${player.warehouses} warehouse${player.warehouses !== 1 ? 's' : ''}</small></div>
        <div class="lot-row">${harborContainerHtml}</div>
      </div>
    </div>

    <div class="ship-area">
      <div class="district-label">Ship: ${shipLoc}</div>
      ${shipHtml}
    </div>

    ${holdingContainers.length > 0 ? '<div class="ship-area"><div class="district-label">Off-Shore Bank</div><div class="lot-row">' +
      holdingContainers.map(c => `<img src="assets/container/svg/container_${c}.svg" class="container-svg-img" alt="${c}">`).join('') +
      '</div></div>' : ''}

    ${islandHtml}

    <div class="scoring-card-hint">
      <button class="link-btn" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.textContent=this.textContent.includes('â–¶')?'â–¼ Hide my card':'â–¶ View my card (${player.scoringCard.label})'">â–¶ View my card (${player.scoringCard.label})</button>
      <div style="display:none;margin-top:6px">
        ${COLORS.map(c => {
          const card = player.scoringCard;
          const valStr = c === card.twoValue ? '$10/$5' : `$${card.values[c]}`;
          return `${pill([c])} ${valStr}`;
        }).join('  ')}
      </div>
    </div>
  `;
}

// â”€â”€ Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderLog(state) {
  const el = document.getElementById('game-log');
  el.innerHTML = state.log.map(l => `<div class="log-line">${l}</div>`).join('');
}

// â”€â”€ Action area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderActionArea(state) {
  const el = document.getElementById('action-area');
  const isHumanTurn = !currentPlayer(state).isAI;

  if (state.phase === 'delivery_auction') {
    renderDeliveryAuctionUI(state, el);
    return;
  }

  if (!isHumanTurn || state.phase === 'turn_start') {
    el.innerHTML = `<div class="waiting">${currentPlayer(state).name} is thinkingâ€¦</div>`;
    return;
  }

  if (state.phase === 'action_select') {
    renderActionButtons(state, el);
    return;
  }

  // Other phases are handled by modal overlays
  el.innerHTML = '';
}

function renderActionButtons(state, el) {
  const player = currentPlayer(state);
  const mods = state.modules || {};

  const canBuild = nextFactoryCost(player) !== null || nextWarehouseCost(player) !== null;
  const canProduce = player.cash >= 1 && player.factories.length > 0;
  const canFactoryBuy = harborLimit(player) > countHarbor(player);
  const shipDocked = typeof player.shipLocation === 'number';
  const canHarborBuy = shipDocked && player.shipContainers.length < SHIP_CAPACITY;
  const loans = totalLoans(player);
  const canTakeLoan = loans < MAX_LOANS;
  const canRepayBank = (player.loans || 0) > 0 && player.cash >= 10;
  const canRepayPlayer = (player.playerLoans || []).length > 0 && player.cash >= Math.min(...(player.playerLoans || [{ amount: 10 }]).map(l => l.amount));
  const canRepay = canRepayBank || canRepayPlayer;

  // Expansion: Luxury â€” can acquire gold (free action, once per turn)
  const allContainers = [...player.factoryLots, ...player.harborLots].flatMap(l => l.containers);
  const canAcquireLuxury = mods.luxuryContainers && !player.acquiredLuxuryThisTurn
    && (state.goldSupply || 0) > 0 && allContainers.length >= 2;

  const mainBtns = [
    { id:'btn-build',        label:'Build',         disabled: !canBuild },
    { id:'btn-produce',      label:'Produce',       disabled: !canProduce },
    { id:'btn-factory-buy',  label:'Factory Buy',   disabled: !canFactoryBuy },
    { id:'btn-harbor-buy',   label:'Harbor Buy',    disabled: !canHarborBuy },
    { id:'btn-sail',         label:'Sail',          disabled: false },
    { id:'btn-reprice',      label:'Reprice',       disabled: false },
    { id:'btn-call-bank',    label:'Call Bank',     disabled: false, hidden: !!mods.classic },
    { id:'btn-loan',         label:'Take Loan',     disabled: !canTakeLoan },
    { id:'btn-repay',        label:'Repay Loan',    disabled: !canRepay },
  ];

  const luxuryRow = canAcquireLuxury
    ? `<div class="free-action-row">
        <span class="free-action-label">Free action (once per turn):</span>
        <button id="btn-acquire-luxury" class="action-btn free-action-btn">Acquire Gold</button>
        <span class="opp-small">Return 2 containers â†’ 1 gold (in supply: ${state.goldSupply})</span>
      </div>`
    : (mods.luxuryContainers
      ? `<div class="free-action-row opp-small">
          Acquire Gold unavailable â€” ${player.acquiredLuxuryThisTurn ? 'already used this turn' : (state.goldSupply || 0) <= 0 ? 'no gold in supply' : 'need 2 containers to return'}
        </div>`
      : '');

  el.innerHTML = `
    <div class="action-buttons">
      ${mainBtns.filter(b => !b.hidden).map(b => `<button id="${b.id}" class="action-btn" ${b.disabled ? 'disabled' : ''}>${b.label}</button>`).join('')}
    </div>
    ${luxuryRow}
  `;

  document.getElementById('btn-build')?.addEventListener('click', () => showBuildModal(state));
  document.getElementById('btn-produce')?.addEventListener('click', () => showProduceModal(state));
  document.getElementById('btn-factory-buy')?.addEventListener('click', () => showFactoryBuyModal(state));
  document.getElementById('btn-harbor-buy')?.addEventListener('click', () => showHarborBuyModal(state));
  document.getElementById('btn-sail')?.addEventListener('click', () => showSailModal(state));
  document.getElementById('btn-reprice')?.addEventListener('click', () => showRepriceModal(state));
  document.getElementById('btn-call-bank')?.addEventListener('click', () => showCallBankModal(state));
  document.getElementById('btn-loan')?.addEventListener('click', () => showTakeLoanModal(state));
  document.getElementById('btn-repay')?.addEventListener('click', () => showRepayLoanModal(state));
  document.getElementById('btn-acquire-luxury')?.addEventListener('click', () => showAcquireLuxuryModal(state));
}

// â”€â”€ Delivery auction UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderDeliveryAuctionUI(state, el) {
  const auction = state.deliveryAuction;
  const deliverer = state.players[auction.deliveryPlayerId];

  // Human players who still need to submit a bid
  const pendingHumans = state.players.filter(
    p => !p.isAI && p.id !== auction.deliveryPlayerId && auction.bids[p.id] === undefined
  );

  if (pendingHumans.length > 0) {
    // Show bid screen for the next human bidder
    const bidder = pendingHumans[0];
    const classic = !!state.modules?.classic;
    const mustBid = classic && bidder.cash > 0;
    const startBid = mustBid ? 1 : 0;
    window._classicMinBid = classic;
    window._bidderHasCash = bidder.cash > 0;
    window._bidState = state;
    window._bidderId = bidder.id;
    const bluffBtn = mustBid ? '' : `<button class="action-btn secondary" onclick="submitHumanBid(APP_GAME_STATE, ${bidder.id}, true)">Bid $0 (bluff)</button>`;
    const classicNote = mustBid ? `<p class="opp-small" style="margin-top:4px">Classic Variant: minimum bid is $1</p>` : '';
    const canLoan = totalLoans(bidder) < MAX_LOANS;
    const loanBtn = canLoan
      ? `<button class="action-btn secondary" style="margin-bottom:8px" onclick="takeAuctionLoan()">Take Loan (+$10)</button>`
      : '';
    el.innerHTML = `
      <div class="auction-panel">
        <h3>Delivery Auction â€” ${bidder.name}</h3>
        <p><strong>${deliverer.name}</strong> delivers ${pill(auction.containers)} (${auction.containers.length} containers)</p>
        ${loanBtn}
        <p>Enter your secret bid (you have ${money(bidder.cash)}):</p>
        <div class="bid-row">
          <button onclick="adjustBid(-1)">âˆ’</button>
          <span id="bid-display" class="bid-display">${startBid}</span>
          <button onclick="adjustBid(1)">+</button>
          <button onclick="adjustBid(5)">+5</button>
        </div>
        ${classicNote}
        <div class="bid-actions">
          <button class="action-btn" onclick="submitHumanBid(APP_GAME_STATE, ${bidder.id})">Submit Bid $<span id="bid-val">${startBid}</span></button>
          ${bluffBtn}
        </div>
      </div>
    `;
    window._humanBid = startBid;
  } else if (!deliverer.isAI) {
    // Human is delivering; all other humans (if any) have already bid
    el.innerHTML = `
      <div class="auction-panel">
        <h3>Delivery Auction</h3>
        <p><strong>${deliverer.name}</strong> is delivering ${pill(auction.containers)} (${auction.containers.length} containers)</p>
        <p>All bids are in. <button id="btn-resolve-auction" class="action-btn">Reveal &amp; Resolve</button></p>
      </div>
    `;
    document.getElementById('btn-resolve-auction')?.addEventListener('click', () => {
      resolveAuctionWithAI(state, auction.deliveryPlayerId);
    });
  } else {
    // Automa delivered and all humans have bid â€” auto-resolve
    resolveAuctionWithAI(state, auction.deliveryPlayerId);
  }
}

window.takeAuctionLoan = function() {
  const state = window._bidState;
  const bidderId = window._bidderId;
  if (!state || bidderId == null) return;
  const res = takeLoan(state, bidderId);
  if (!res.ok) { alert(res.error); return; }
  render(state); // re-renders bid screen with updated cash + updated loan button
};

window.adjustBid = function(delta) {
  const minBid = (window._classicMinBid && window._bidderHasCash) ? 1 : 0;
  const bidder = window._bidState?.players[window._bidderId];
  const maxBid = bidder ? bidder.cash : Infinity;
  window._humanBid = Math.min(maxBid, Math.max(minBid, (window._humanBid || 0) + delta));
  const el1 = document.getElementById('bid-display');
  const el2 = document.getElementById('bid-val');
  if (el1) el1.textContent = window._humanBid;
  if (el2) el2.textContent = window._humanBid;
};

window.submitHumanBid = function(state, bidderId, bluff = false) {
  const bidder = state.players[bidderId];
  let amount = bluff ? 0 : (window._humanBid || 0);
  if (state.modules?.classic && bidder.cash > 0 && amount < 1) { alert('Classic Variant: you must bid at least $1.'); return; }
  state.deliveryAuction.bids[bidderId] = amount;

  // If more humans still need to bid, re-render to show next bidder
  const pendingHumans = state.players.filter(
    p => !p.isAI && p.id !== state.deliveryAuction.deliveryPlayerId && state.deliveryAuction.bids[p.id] === undefined
  );
  if (pendingHumans.length > 0) {
    render(state);
  } else {
    resolveAuctionWithAI(state, state.deliveryAuction.deliveryPlayerId);
  }
};

function resolveAuctionWithAI(state, deliveryPlayerId) {
  const auction = state.deliveryAuction;
  const bids = { ...auction.bids };

  // Collect non-deliverer AI bids; AI may take loans during bidding
  const aiLoanEvents = [];
  for (const player of state.players) {
    if (player.isAI && player.id !== deliveryPlayerId) {
      const result = aiBidOnDelivery(state, player.id, deliveryPlayerId);
      bids[player.id] = result.bid;
      if (result.loansTaken > 0) aiLoanEvents.push({ player, count: result.loansTaken });
    }
  }

  const continueToReveal = () => {
  // Find highBid
  let highBid = 0;
  for (const [pid, amount] of Object.entries(bids)) {
    if (Number(pid) !== deliveryPlayerId && amount > highBid) highBid = amount;
  }

  const tiedIds = highBid > 0
    ? Object.entries(bids)
        .filter(([pid, amount]) => Number(pid) !== deliveryPlayerId && amount === highBid)
        .map(([pid]) => Number(pid))
    : [];

  // Shared final-step: show payment popup then resolve state
  const proceed = (finalBids, finalWinnerId, delivererBuysOut) => {
    let payAmt = finalWinnerId ? (finalBids[finalWinnerId] ?? highBid) : highBid;
    showDeliveryPaymentPopup(state, deliveryPlayerId, payAmt, finalWinnerId, delivererBuysOut, () => {
      resolveDeliveryAuction(state, finalBids, delivererBuysOut, finalWinnerId);
      APP_STATE.gameState = state;
      render(state);
      if (!state.gameOver) setTimeout(() => APP_processNextTurn(), 300);
    });
  };

  const winnerId = tiedIds.length === 1 ? tiedIds[0] : null;

  showBidReveal(state, bids, deliveryPlayerId, highBid, winnerId, tiedIds, (delivererBuysOut) => {
    if (tiedIds.length >= 2 && !delivererBuysOut) {
      startRunoffAuction(state, bids, deliveryPlayerId, highBid, tiedIds, proceed);
    } else {
      proceed(bids, winnerId, delivererBuysOut);
    }
  });
  }; // end continueToReveal

  // If any AI took loans during bidding, notify the human first
  if (aiLoanEvents.length > 0) {
    const rows = aiLoanEvents.map(({ player, count }) => {
      const times = count === 1 ? 'a loan' : `${count} loans`;
      return `<p><strong>${player.name}</strong> took ${times} while bidding â€” give them <strong>$${count * 10}</strong> from the supply and place <strong>${count} loan card${count > 1 ? 's' : ''}</strong> near their board.</p>`;
    }).join('');
    showModal(`
      <div class="modal-content">
        <h3>Automa Took a Loan</h3>
        ${rows}
        <button class="action-btn" style="margin-top:14px" onclick="closeModal(); continueToReveal_()">âœ“ Done</button>
      </div>
    `);
    window.continueToReveal_ = continueToReveal;
  } else {
    continueToReveal();
  }
}

function showBidReveal(state, bids, deliveryPlayerId, highBid, winnerId, tiedIds, callback) {
  const deliverer = state.players[deliveryPlayerId];
  const hasTie = tiedIds.length >= 2;
  const winner = (!hasTie && winnerId !== null) ? state.players[winnerId] : null;

  const rows = Object.entries(bids).map(([pid, amount]) => {
    const id = Number(pid);
    if (id === deliveryPlayerId) return '';
    const player = state.players[id];
    const isTied = hasTie && tiedIds.includes(id);
    const isWin = !hasTie && id === winnerId;
    const tag = player.isAI && !player.name.includes('Automa') ? ' (Automa)' : '';
    return `<div class="bid-reveal-row${isWin ? ' bid-winner' : ''}${isTied ? ' bid-tied' : ''}">
      <span style="color:${player.cssColor}">${player.name}${tag}</span>: ${money(amount)}${isTied ? ' =' : ''}${isWin ? ' â˜…' : ''}
    </div>`;
  }).join('');

  let resultLine;
  if (hasTie) {
    const names = tiedIds.map(id => state.players[id].name).join(' & ');
    resultLine = `<p class="bid-tie-notice">Tie â€” ${names} both bid ${money(highBid)}. A runoff is required.</p>`;
  } else if (winner) {
    resultLine = `<p class="bid-winner-summary">Highest bid: <span style="color:${winner.cssColor};font-weight:700">${winner.name}</span> â€” ${money(highBid)}</p>`;
  } else {
    resultLine = `<p style="margin-top:20px;color:var(--text-muted)">No bids â€” ${deliverer.name} keeps containers for free.</p>`;
  }

  window._bidRevealCallback = callback;
  window.bidRevealChoice = function(buysOut) {
    document.getElementById('modal').innerHTML = '';
    const cb = window._bidRevealCallback;
    window._bidRevealCallback = null;
    if (cb) cb(buysOut);
  };

  function renderBidReveal() {
    let buttons;
    if (!deliverer.isAI && hasTie) {
      const canAfford = deliverer.cash >= highBid || deliverer.loans < MAX_LOANS;
      const loanBtn = (!deliverer.isAI && deliverer.loans < MAX_LOANS)
        ? `<button class="action-btn secondary" onclick="takeBidRevealLoan()">Take Loan (+$10)</button>` : '';
      buttons = `
        <div class="bid-choice-row">
          <button class="action-btn" onclick="bidRevealChoice(false)">â†’ Proceed to Runoff</button>
          <button class="action-btn secondary" onclick="bidRevealChoice(true)"${!canAfford ? ' disabled title="Cannot afford"' : ''}>âœ— Buy Out â€” keep containers, pay ${money(highBid)}</button>
        </div>
        ${loanBtn}`;
    } else if (!deliverer.isAI && highBid > 0) {
      const canAfford = deliverer.cash >= highBid || deliverer.loans < MAX_LOANS;
      const loanBtn = (deliverer.loans < MAX_LOANS)
        ? `<button class="action-btn secondary" onclick="takeBidRevealLoan()">Take Loan (+$10)</button>` : '';
      buttons = `
        <p style="font-size:0.85em;color:var(--text-muted)">Your cash: ${money(deliverer.cash)}</p>
        <div class="bid-choice-row">
          <button class="action-btn" onclick="bidRevealChoice(false)">âœ“ Accept â€” earn ${money(highBid * 2)}</button>
          <button class="action-btn secondary" onclick="bidRevealChoice(true)"${!canAfford ? ' disabled title="Cannot afford"' : ''}>âœ— Reject â€” keep containers, pay ${money(highBid)}</button>
        </div>
        ${loanBtn}`;
    } else {
      const autoDecide = (deliverer.isAI && highBid > 0)
        ? (hasTie ? false : aiShouldRejectDelivery(state, deliveryPlayerId, highBid))
        : false;
      buttons = `<button class="action-btn" style="margin-top:14px" onclick="bidRevealChoice(${autoDecide})">Continue</button>`;
    }

    document.getElementById('modal').innerHTML = `
      <div class="modal-content">
        <h3>Bids Revealed</h3>
        ${rows}
        ${resultLine}
        ${buttons}
      </div>
    `;
  }

  window.takeBidRevealLoan = function() {
    const res = takeLoan(state, deliveryPlayerId);
    if (!res.ok) { alert(res.error); return; }
    renderBidReveal();
  };

  renderBidReveal();
}

// â”€â”€ Runoff auction (triggered when initial bids tie) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function startRunoffAuction(state, initialBids, deliveryPlayerId, initialHighBid, tiedIds, proceed) {
  const tiedHumans = tiedIds.filter(id => !state.players[id].isAI);
  const runoffBids = {};

  // AI tied players: bid $1â€“$3 extra if they can afford it
  for (const id of tiedIds) {
    if (state.players[id].isAI) {
      const avail = Math.max(0, state.players[id].cash - (initialBids[id] || 0));
      runoffBids[id] = avail >= 1 ? Math.min(3, Math.ceil(Math.random() * 3), avail) : 0;
    }
  }

  _collectRunoffBids(state, tiedHumans, 0, runoffBids, initialBids, deliveryPlayerId, initialHighBid, tiedIds, proceed);
}

function _collectRunoffBids(state, tiedHumans, idx, runoffBids, initialBids, deliveryPlayerId, initialHighBid, tiedIds, proceed) {
  if (idx >= tiedHumans.length) {
    _showRunoffReveal(state, initialBids, runoffBids, deliveryPlayerId, tiedIds, proceed);
    return;
  }

  const bidderId = tiedHumans[idx];
  const player = state.players[bidderId];
  window._runoffBid = 0;

  function renderRunoffModal() {
    const avail = Math.max(0, player.cash - (initialBids[bidderId] || 0));
    window._runoffBid = Math.min(window._runoffBid, avail);
    const loanBtn = player.loans < 2
      ? `<button class="action-btn secondary" onclick="takeRunoffLoan()">Take Loan (+$10)</button>`
      : '';
    document.getElementById('modal').innerHTML = `
      <div class="modal-content">
        <h3>Runoff Auction â€” ${player.name}</h3>
        <p>Tied at ${money(initialHighBid)}. Bid additional hidden cash (can be $0 to pass).</p>
        <p style="color:var(--text-muted);font-size:0.9em">You have ${money(player.cash)} total; ${money(avail)} available to add.</p>
        <div class="bid-row">
          <button onclick="adjustRunoffBid(-1)">âˆ’</button>
          <span id="ro-bid-display" class="bid-display">${window._runoffBid}</span>
          <button onclick="adjustRunoffBid(1)">+</button>
          <button onclick="adjustRunoffBid(5)">+5</button>
        </div>
        <div class="bid-actions">
          <button class="action-btn" onclick="submitRunoffBid()">Submit +$<span id="ro-bid-val">${window._runoffBid}</span></button>
          <button class="action-btn secondary" onclick="window._runoffBid=0;submitRunoffBid()">Pass (+$0)</button>
          ${loanBtn}
        </div>
      </div>
    `;
  }

  window.adjustRunoffBid = function(delta) {
    const avail = Math.max(0, player.cash - (initialBids[bidderId] || 0));
    window._runoffBid = Math.max(0, Math.min(avail, (window._runoffBid || 0) + delta));
    const d = document.getElementById('ro-bid-display');
    const v = document.getElementById('ro-bid-val');
    if (d) d.textContent = window._runoffBid;
    if (v) v.textContent = window._runoffBid;
  };
  window.submitRunoffBid = function() {
    runoffBids[bidderId] = window._runoffBid || 0;
    document.getElementById('modal').innerHTML = '';
    _collectRunoffBids(state, tiedHumans, idx + 1, runoffBids, initialBids, deliveryPlayerId, initialHighBid, tiedIds, proceed);
  };
  window.takeRunoffLoan = function() {
    const res = takeLoan(state, bidderId);
    if (!res.ok) { alert(res.error); return; }
    renderRunoffModal();
  };

  renderRunoffModal();
}

function _showRunoffReveal(state, initialBids, runoffBids, deliveryPlayerId, tiedIds, proceed) {
  const deliverer = state.players[deliveryPlayerId];

  // Build final bids: tied players get initial + runoff; non-tied unchanged
  const finalBids = {};
  for (const [pid, amount] of Object.entries(initialBids)) {
    const id = Number(pid);
    finalBids[id] = tiedIds.includes(id) ? amount + (runoffBids[id] || 0) : amount;
  }

  let newHigh = 0;
  for (const id of tiedIds) if (finalBids[id] > newHigh) newHigh = finalBids[id];
  const newTied = tiedIds.filter(id => finalBids[id] === newHigh);
  const hasTie2 = newTied.length >= 2;
  const newWinnerId = hasTie2 ? null : newTied[0];

  const rows = tiedIds.map(id => {
    const p = state.players[id];
    const ini = initialBids[id] || 0;
    const add = runoffBids[id] || 0;
    const tot = finalBids[id];
    const isWin = id === newWinnerId;
    const still = hasTie2 && newTied.includes(id);
    return `<div class="bid-reveal-row${isWin ? ' bid-winner' : ''}${still ? ' bid-tied' : ''}">
      <span style="color:${p.cssColor}">${p.name}</span>: ${money(ini)} + ${money(add)} = <strong>${money(tot)}</strong>${isWin ? ' â˜…' : ''}${still ? ' =' : ''}
    </div>`;
  }).join('');

  const dismiss = () => { document.getElementById('modal').innerHTML = ''; };

  if (!hasTie2) {
    const winner = state.players[newWinnerId];
    let buttons;
    if (!deliverer.isAI) {
      buttons = `
        <div class="bid-choice-row">
          <button class="action-btn" onclick="window._rrAccept()">âœ“ Accept â€” earn ${money(newHigh * 2)}</button>
          <button class="action-btn secondary" onclick="window._rrReject()">âœ— Buy Out â€” keep containers, pay ${money(newHigh)}</button>
        </div>`;
    } else {
      const auto = aiShouldRejectDelivery(state, deliveryPlayerId, newHigh);
      buttons = `<button class="action-btn" style="margin-top:14px" onclick="window._rrAccept(${auto})">Continue</button>`;
    }
    window._rrAccept = (buysOut = false) => { dismiss(); proceed(finalBids, newWinnerId, buysOut); };
    window._rrReject = () => { dismiss(); proceed(finalBids, newWinnerId, true); };

    document.getElementById('modal').innerHTML = `
      <div class="modal-content">
        <h3>Runoff Revealed</h3>
        ${rows}
        <p class="bid-winner-summary">Winner: <span style="color:${winner.cssColor};font-weight:700">${winner.name}</span> â€” ${money(newHigh)} total</p>
        ${buttons}
      </div>
    `;
  } else {
    // Still tied â€” deliverer decides
    if (deliverer.isAI) {
      const auto = aiShouldRejectDelivery(state, deliveryPlayerId, newHigh);
      if (auto) { proceed(finalBids, null, true); return; }
      proceed(finalBids, newTied[0], false);
      return;
    }
    const names = newTied.map(id => state.players[id].name).join(' & ');
    const pickBtns = newTied.map(id => {
      const p = state.players[id];
      return `<button class="action-btn" style="border-left:4px solid ${p.cssColor};margin:4px 0" onclick="window._rrPick(${id})">${p.name} wins</button>`;
    }).join('');
    window._rrPick = (id) => { dismiss(); proceed(finalBids, id, false); };
    window._rrReject = () => { dismiss(); proceed(finalBids, null, true); };

    document.getElementById('modal').innerHTML = `
      <div class="modal-content">
        <h3>Runoff â€” Still Tied!</h3>
        ${rows}
        <p class="bid-tie-notice">Still tied at ${money(newHigh)} â€” ${names}. You delivered, so you choose the winner or buy out.</p>
        <div style="display:flex;flex-direction:column;gap:4px;margin-top:14px">
          ${pickBtns}
          <button class="action-btn secondary" style="margin-top:8px" onclick="window._rrReject()">Buy Out â€” keep containers, pay ${money(newHigh)}</button>
        </div>
      </div>
    `;
  }
}

function showDeliveryPaymentPopup(state, deliveryPlayerId, highBid, winnerId, delivererBuysOut, callback) {
  const deliverer = state.players[deliveryPlayerId];
  const winner = winnerId !== null ? state.players[winnerId] : null;

  let title, instructions;

  if (!winner || highBid <= 0) {
    title = 'Delivery â€” No Bids';
    instructions = [`No valid bids. Place ${deliverer.isAI ? `<strong>${deliverer.name}'s</strong>` : 'your'} containers on the <strong>Container Island</strong>.`];
  } else if (delivererBuysOut) {
    title = `${deliverer.name} Rejects Bids`;
    const classic = state.modules?.classic;
    const payDest = classic ? 'the supply' : `bank cash lots: ${describeBankDistribution(state.bank, highBid)}`;
    instructions = [
      deliverer.isAI
        ? `Move <strong>${money(highBid)}</strong> from <strong>${deliverer.name}'s pile</strong> â†’ ${payDest}.`
        : `Pay <strong>${money(highBid)}</strong> from your pile â†’ ${payDest}.`,
      `Place the containers on <strong>${deliverer.isAI ? deliverer.name + "'s" : 'your'} island area</strong>.`
    ];
  } else {
    title = `${winner.name} Wins the Delivery!`;
    if (winner.isAI && !deliverer.isAI) {
      instructions = [
        `Move <strong>${money(highBid)}</strong> from <strong>${winner.name}'s pile</strong> â†’ <strong>your pile</strong>.`,
        `Also take <strong>${money(highBid)}</strong> from the bank supply â†’ <strong>your pile</strong>. (You earn ${money(highBid * 2)} total.)`,
        `Place the containers in <strong>${winner.name}'s island area</strong>.`
      ];
    } else if (!winner.isAI && deliverer.isAI) {
      instructions = [
        `Pay <strong>${money(highBid)}</strong> from your pile â†’ <strong>${deliverer.name}'s pile</strong>.`,
        `Also take <strong>${money(highBid)}</strong> from the bank supply â†’ <strong>${deliverer.name}'s pile</strong>. (${deliverer.name} earns ${money(highBid * 2)} total.)`,
        `Place the containers in <strong>your island area</strong>.`
      ];
    } else {
      instructions = [
        winner.isAI
          ? `Move <strong>${money(highBid)}</strong> from <strong>${winner.name}'s pile</strong> â†’ <strong>${deliverer.name}'s pile</strong>.`
          : `<strong>${winner.name}</strong>: pay <strong>${money(highBid)}</strong> â†’ <strong>${deliverer.name}</strong>.`,
        deliverer.isAI
          ? `Take <strong>${money(highBid)}</strong> from bank supply â†’ <strong>${deliverer.name}'s pile</strong>. (${deliverer.name} earns ${money(highBid * 2)} total.)`
          : `<strong>${deliverer.name}</strong>: also collect <strong>${money(highBid)}</strong> from the bank supply.`,
        winner.isAI
          ? `Place containers in <strong>${winner.name}'s island area</strong>.`
          : `<strong>${winner.name}</strong>: take containers to your island area.`
      ];
    }
  }

  window._deliveryPaymentCallback = callback;
  document.getElementById('modal').innerHTML = `
    <div class="modal-content">
      <h3>${title}</h3>
      <div class="win-section">
        ${instructions.map(i => `<p class="win-instruction">${i}</p>`).join('')}
      </div>
      <button class="action-btn" style="margin-top:14px" onclick="deliveryPaymentDone()">âœ“ Done</button>
    </div>
  `;
}
window.deliveryPaymentDone = function() {
  document.getElementById('modal').innerHTML = '';
  const cb = window._deliveryPaymentCallback;
  window._deliveryPaymentCallback = null;
  if (cb) cb();
};

// â”€â”€ Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showModal(html) {
  const modal = document.getElementById('modal');
  modal.innerHTML = `<div class="modal-content">${html}<button class="modal-close" onclick="closeModal()">âœ•</button></div>`;
  modal.querySelector('.modal-content')?.scrollTo(0, 0);
}
window.closeModal = function() {
  document.getElementById('modal').innerHTML = '';
};

function showBuildModal(state) {
  const player = currentPlayer(state);
  const factoryCost = nextFactoryCost(player);
  const whCost = nextWarehouseCost(player);

  const factoryOptions = COLORS
    .filter(c => !player.factories.includes(c) && (state.factorySupply[c] || 0) > 0)
    .map(c => `<button class="color-btn" style="background:${COLOR_HEX[c]}" onclick="buildFactoryChoice('${c}')">${COLOR_LABEL[c]} $${factoryCost}</button>`)
    .join('');

  showModal(`
    <h3>Build</h3>
    ${factoryCost !== null ? `<div><strong>Factory</strong> (have ${player.factories.length}): ${factoryOptions || 'None available'}</div>` : ''}
    ${whCost !== null ? `<div><strong>Warehouse</strong>: <button class="action-btn" onclick="buildWarehouseChoice()">${whCost ? `$${whCost}` : 'Free'}</button></div>` : ''}
  `);

  window.buildFactoryChoice = function(color) {
    const res = buildFactory(state, player.id, color);
    if (!res.ok) { alert(res.error); return; }
    closeModal();
    useAction(state);
    render(state);
    APP_processNextIfAI(state);
  };
  window.buildWarehouseChoice = function() {
    const res = buildWarehouse(state, player.id);
    if (!res.ok) { alert(res.error); return; }
    closeModal();
    useAction(state);
    render(state);
    APP_processNextIfAI(state);
  };
}

function showProduceModal(state) {
  const player = currentPlayer(state);
  const limit = factoryLimit(player);
  const current = countFactory(player);
  const room = limit - current;

  // Colors this player can produce that have supply available (at most 1 per factory type)
  const producibleColors = player.factories.filter(c => (state.containerSupply[c] || 0) > 0);
  const toProduceCount = Math.min(producibleColors.length, room);

  if (toProduceCount === 0) {
    // No room or no supply â€” just reprice
    showRepriceModal(state, 'factory');
    return;
  }

  // If all producible colors fit, produce them all automatically â€” no selection needed
  if (room >= producibleColors.length) {
    showPriceAssignModal(state, 'factory', producibleColors);
    return;
  }

  // Player must choose exactly `room` out of `producibleColors` (max 1 per color)
  const selected = new Set();

  function renderProduceModal() {
    const selCount = selected.size;
    const rows = producibleColors.map(c => {
      const isSel = selected.has(c);
      const canSelect = isSel || selCount < room;
      return `<div class="produce-row">
        ${pill([c])} ${COLOR_LABEL[c]}
        <span class="opp-small">(supply: ${state.containerSupply[c] || 0})</span>
        <button class="action-btn${isSel ? '' : ' secondary'}"
          ${canSelect ? '' : 'disabled'}
          onclick="toggleProduceColor('${c}')">
          ${isSel ? 'Selected' : 'Select'}
        </button>
      </div>`;
    }).join('');

    showModal(`
      <h3>Produce Containers</h3>
      <p>Choose <strong>${room}</strong> color${room !== 1 ? 's' : ''} to produce.
         Pay $1 to ${state.players[rightOfPlayer(state, player.id)].name}.</p>
      <p class="opp-small">Factory is full â€” select which ${room} color${room !== 1 ? 's' : ''} to produce out of ${producibleColors.length} available.</p>
      ${rows}
      <p>Selected: <strong>${selCount} / ${room}</strong></p>
      <button class="action-btn" ${selCount === room ? '' : 'disabled'} onclick="confirmProduceSelection()">
        Confirm &amp; Set Prices
      </button>
    `);
  }

  window.toggleProduceColor = function(color) {
    if (selected.has(color)) {
      selected.delete(color);
    } else if (selected.size < room) {
      selected.add(color);
    }
    renderProduceModal();
  };

  window.confirmProduceSelection = function() {
    if (selected.size !== room) return;
    showPriceAssignModal(state, 'factory', [...selected]);
  };

  renderProduceModal();
}

function showPriceAssignModal(state, district, newContainers) {
  const player = currentPlayer(state);
  const lots = district === 'factory' ? player.factoryLots : player.harborLots;
  const prices = district === 'factory' ? [1,2,3,4] : [2,3,4,5,6];
  const defaultPrice = district === 'factory' ? 2 : 3;

  // Combine existing containers (keep current price) with new ones (default price)
  const existing = lots.flatMap(l => l.containers.map(c => ({ color: c, price: l.price, isNew: false })));
  const incoming = newContainers.map(c => ({ color: c, price: defaultPrice, isNew: true }));
  const allContainers = [...existing, ...incoming];

  window._priceCtx = {
    state, district, allContainers, lots, prices,
    assignments: allContainers.map(c => c.price)
  };

  function renderPriceModal() {
    const ctx = window._priceCtx;
    const districtName = ctx.district === 'factory' ? 'Factory' : 'Harbor';
    const rows = ctx.allContainers.map((c, i) => {
      const btns = ctx.prices.map(p => {
        const sel = ctx.assignments[i] === p;
        return `<button class="price-btn${sel ? ' selected' : ''}" onclick="pricePickBtn(${i},${p})">$${p}${sel ? ' âœ“' : ''}</button>`;
      }).join('');
      const badge = c.isNew ? `<span class="new-badge">NEW</span>` : '';
      return `<div class="price-assign-row">${pill([c.color])} ${COLOR_LABEL[c.color]} ${badge}: ${btns}</div>`;
    }).join('');

    const wageNote = ctx.district === 'factory' ? (() => {
      const rightId = rightOfPlayer(ctx.state, currentPlayer(ctx.state).id);
      const rightPlayer = ctx.state.players[rightId];
      return `<div class="anchor-note">Produce costs <strong>$1</strong> â€” you'll pay <span style="color:${rightPlayer.cssColor};font-weight:700">${rightPlayer.name}</span> after confirming.</div>`;
    })() : '';

    showModal(`
      <h3>Arrange ${districtName}</h3>
      ${wageNote}
      <p>Set the price for every container â€” including existing ones.</p>
      ${rows}
      <button class="action-btn" style="margin-top:12px" onclick="confirmPriceModal()">âœ“ Confirm</button>
    `);
  }

  window.pricePickBtn = function(idx, price) {
    window._priceCtx.assignments[idx] = price;
    renderPriceModal();
  };

  window.confirmPriceModal = function() {
    const ctx = window._priceCtx;
    // Build entirely new lots from assignments (existing containers move too)
    const newLots = ctx.lots.map(l => ({ price: l.price, containers: [] }));
    ctx.allContainers.forEach((c, i) => {
      const lot = newLots.find(l => l.price === ctx.assignments[i]);
      if (lot) lot.containers.push(c.color);
    });

    if (ctx.district === 'factory') {
      const res = produce(ctx.state, currentPlayer(ctx.state).id, newLots);
      if (!res.ok) { alert(res.error); return; }
      // Show who to pay the $1 union wage to before proceeding
      const rightId = rightOfPlayer(ctx.state, currentPlayer(ctx.state).id);
      const rightPlayer = ctx.state.players[rightId];
      useAction(ctx.state);
      render(ctx.state);
      showModal(`
        <div class="modal-content">
          <h3>Pay Union Wages</h3>
          <p>Move <strong>$1</strong> from your cash to <span style="color:${rightPlayer.cssColor};font-weight:700">${rightPlayer.name}</span>.</p>
          <button class="action-btn" style="margin-top:14px" onclick="closeModal(); APP_processNextIfAI(APP_STATE.gameState)">Done â€” Paid</button>
        </div>
      `);
      return;
    }
    closeModal();
    useAction(ctx.state);
    render(ctx.state);
    APP_processNextIfAI(ctx.state);
  };

  renderPriceModal();
}

function updatePriceBtns(assignments, count, prices) {
  for (let i = 0; i < count; i++) {
    prices.forEach(p => {
      const btn = document.getElementById(`pr-${i}-${p}`);
      if (btn) btn.innerHTML = p === assignments[i] ? `<strong>$${p}âœ“</strong>` : `$${p}`;
    });
  }
}

function showFactoryBuyModal(state) {
  const player = currentPlayer(state);
  const others = state.players.filter(p => p.id !== player.id && countFactory(p) > 0);

  if (others.length === 0) { alert('No factories with containers to buy from'); return; }

  const opponentBtns = others.map(p => `
    <button class="action-btn" onclick="selectFactorySeller(${p.id})" style="border-left: 4px solid ${p.cssColor}">
      ${p.name}: ${countFactory(p)} containers
    </button>
  `).join('');

  showModal(`
    <h3>Factory Purchase</h3>
    <p>Buy from which opponent's factory?</p>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
      ${opponentBtns}
    </div>
  `);

  window.selectFactorySeller = function(sellerId) {
    showFactoryBuyFromSeller(state, sellerId);
  };
}

function showFactoryBuyFromSeller(state, sellerId) {
  const player = currentPlayer(state);
  const seller = state.players[sellerId];
  const harborRoom = harborLimit(player) - countHarbor(player);
  let selections = []; // { color, fromLotIdx, price }

  // Expansion: Truck Companies freight fee
  const mods = state.modules || {};
  let freightFee = 0;
  let freightNote = '';
  if (mods.truckCompanies) {
    const owner = player.truckCompanyOwner;
    if (owner === player.id) {
      // Self-owned â€” no fee, no note
    } else if (owner !== null && state.players[owner]) {
      freightFee = 1;
      freightNote = `<div class="anchor-note">Truck Companies: pay <strong>$1</strong> to <strong>${state.players[owner].name}</strong> (they own your trucking company).</div>`;
    } else {
      freightFee = 1;
      freightNote = `<div class="anchor-note">Truck Companies: place <strong>$1</strong> in your trucking area on your board extension (company is independent â€” sits there until someone wins the auction).</div>`;
    }
  }
  const collectNote = '';

  const lotRows = seller.factoryLots.map((lot, li) => {
    if (lot.containers.length === 0) return '';
    return lot.containers.map((c, ci) => `
      <div class="buy-item">
        ${pill([c])} ${COLOR_LABEL[c]} @ ${money(lot.price)}
        <button id="fsel-${li}-${ci}" class="action-btn secondary buy-toggle" onclick="toggleFactorySelect(${li}, ${ci}, '${c}', ${lot.price})">Buy</button>
      </div>
    `).join('');
  }).join('');

  showModal(`
    <h3>Buy from ${seller.name}</h3>
    ${collectNote}
    ${freightNote}
    <p>Harbor room: ${harborRoom}. Your cash: $${player.cash}</p>
    ${lotRows}
    <div id="factory-buy-total">Total: $0${freightFee ? ' + $1 freight' : ''} (0 containers)</div>
    <button class="action-btn" id="btn-confirm-factory-buy" onclick="confirmFactoryBuy(${sellerId})">Buy Selected</button>
    <button class="action-btn secondary" onclick="selectFactorySeller(${sellerId})">â† Back</button>
  `);

  window.toggleFactorySelect = function(lotIdx, conIdx, color, price) {
    const existing = selections.findIndex(s => s.fromLotIdx === lotIdx && s.conIdx === conIdx);
    const btn = document.getElementById(`fsel-${lotIdx}-${conIdx}`);
    if (existing !== -1) {
      selections.splice(existing, 1);
      if (btn) { btn.textContent = 'Buy'; btn.className = 'action-btn secondary buy-toggle'; }
    } else {
      if (selections.length >= harborRoom) {
        alert(`Harbor only has room for ${harborRoom} more container(s)`);
        return;
      }
      selections.push({ color, fromLotIdx: lotIdx, conIdx, price });
      if (btn) { btn.textContent = 'âœ“ Remove'; btn.className = 'action-btn buy-toggle selected-buy'; }
    }
    const containerTotal = selections.reduce((s, p) => s + p.price, 0);
    const grandTotal = containerTotal + (selections.length > 0 ? freightFee : 0);
    document.getElementById('factory-buy-total').textContent =
      `Total: $${grandTotal}${freightFee && selections.length > 0 ? ` (containers $${containerTotal} + $1 freight)` : ''} (${selections.length} containers)`;
  };

  window.confirmFactoryBuy = function(sid) {
    if (selections.length === 0) { alert('Select at least one container'); return; }
    showHarborPriceAfterBuy(state, sid, selections);
  };
}

function showHarborPriceAfterBuy(state, sellerId, purchases) {
  const player = currentPlayer(state);
  const prices = [2,3,4,5,6];

  // Combine existing harbor containers (keep price) with newly purchased ones (default $3)
  const existing = player.harborLots.flatMap(l => l.containers.map(c => ({ color: c, price: l.price, isNew: false })));
  const incoming = purchases.map(p => ({ color: p.color, price: 3, isNew: true, fromLotIdx: p.fromLotIdx }));
  const allContainers = [...existing, ...incoming];

  window._harborPriceCtx = {
    state, sellerId, purchases, allContainers, prices,
    assignments: allContainers.map(c => c.price)
  };

  function renderHarborPriceModal() {
    const ctx = window._harborPriceCtx;
    const rows = ctx.allContainers.map((c, i) => {
      const btns = ctx.prices.map(p => {
        const sel = ctx.assignments[i] === p;
        return `<button class="price-btn${sel ? ' selected' : ''}" onclick="harborPricePickBtn(${i},${p})">$${p}${sel ? ' âœ“' : ''}</button>`;
      }).join('');
      const badge = c.isNew ? `<span class="new-badge">NEW</span>` : '';
      return `<div class="price-assign-row">${pill([c.color])} ${COLOR_LABEL[c.color]} ${badge}: ${btns}</div>`;
    }).join('');

    showModal(`
      <h3>Arrange Harbor</h3>
      <p>Set the price for every container â€” including existing ones.</p>
      ${rows}
      <button class="action-btn" style="margin-top:12px" onclick="confirmHarborBuy(${ctx.sellerId})">âœ“ Confirm</button>
    `);
  }

  window.harborPricePickBtn = function(idx, price) {
    window._harborPriceCtx.assignments[idx] = price;
    renderHarborPriceModal();
  };

  window.confirmHarborBuy = function(sid) {
    const ctx = window._harborPriceCtx;
    // Build entirely new harbor lots from all assignments
    const newHarborLots = player.harborLots.map(l => ({ price: l.price, containers: [] }));
    ctx.allContainers.forEach((c, i) => {
      const lot = newHarborLots.find(l => l.price === ctx.assignments[i]);
      if (lot) lot.containers.push(c.color);
    });
    const purchaseList = ctx.purchases.map(p => ({ color: p.color, fromLotIdx: p.fromLotIdx }));
    const res = factoryPurchase(ctx.state, player.id, sid, purchaseList, newHarborLots);
    if (!res.ok) { alert(res.error); return; }
    useAction(ctx.state);
    render(ctx.state);
    // Show freight fee reminder if applicable
    const owner = player.truckCompanyOwner;
    const mods = ctx.state.modules || {};
    if (mods.truckCompanies && owner !== player.id) {
      if (owner !== null && ctx.state.players[owner]) {
        const ownerPlayer = ctx.state.players[owner];
        showModal(`
          <div class="modal-content">
            <h3>Freight Fee</h3>
            <p>Move <strong>$1</strong> from your cash to <span style="color:${ownerPlayer.cssColor};font-weight:700">${ownerPlayer.name}</span> (they own your trucking company).</p>
            <button class="action-btn" style="margin-top:14px" onclick="closeModal(); APP_processNextIfAI(APP_STATE.gameState)">Done â€” Paid</button>
          </div>
        `);
      } else {
        showModal(`
          <div class="modal-content">
            <h3>Freight Fee</h3>
            <p>Place <strong>$1</strong> in your <strong>trucking area</strong> on your board extension (company is independent).</p>
            <button class="action-btn" style="margin-top:14px" onclick="closeModal(); APP_processNextIfAI(APP_STATE.gameState)">Done</button>
          </div>
        `);
      }
    } else {
      closeModal();
      APP_processNextIfAI(ctx.state);
    }
  };

  renderHarborPriceModal();
}

// freeAnchorAction: true when triggered automatically after sailing to a harbor
// (the sail itself already cost 1 action; buying is a free bonus).
function showHarborBuyModal(state, freeAnchorAction = false) {
  const player = currentPlayer(state);
  const sellerId = player.shipLocation;
  const seller = state.players[sellerId];
  const room = SHIP_CAPACITY - player.shipContainers.length;
  let selections = [];

  const lotRows = seller.harborLots.map((lot, li) => {
    if (lot.containers.length === 0) return '';
    return lot.containers.map((c, ci) => `
      <div class="buy-item">
        ${pill([c])} ${COLOR_LABEL[c]} @ ${money(lot.price)}
        <button id="hsel-${li}-${ci}" class="action-btn secondary buy-toggle" onclick="toggleHarborSelect(${li}, ${ci}, '${c}', ${lot.price})">Buy</button>
      </div>
    `).join('');
  }).join('');

  const anchorNote = freeAnchorAction
    ? `<p class="anchor-note">Anchor action â€” buying here is free (no action cost).</p>`
    : '';
  const skipBtn = freeAnchorAction
    ? `<button class="action-btn secondary" onclick="skipAnchorBuy()">Skip â€” no purchase</button>`
    : '';

  function renderHarborBuyModal() {
    const freshPlayer = currentPlayer(state);
    const totalCost = selections.reduce((s, p) => s + p.price, 0);
    showModal(`
      <h3>Harbor Purchase from ${seller.name}</h3>
      ${anchorNote}
      <p>Ship has room for ${room} more. Your cash: $${freshPlayer.cash}</p>
      ${lotRows || '<p>No containers in harbor.</p>'}
      <div id="harbor-buy-total">Total: $${totalCost} (${selections.length} container${selections.length !== 1 ? 's' : ''})</div>
      <button class="action-btn" id="btn-confirm-harbor" onclick="confirmHarborPurchase()">Buy Selected</button>
      ${freshPlayer.loans < 2 ? `<button class="action-btn secondary" onclick="takeHarborLoan()">Take Loan (+$10)</button>` : ''}
      ${skipBtn}
    `);
  }

  renderHarborBuyModal();

  window.takeHarborLoan = function() {
    const res = takeLoan(state, player.id);
    if (!res.ok) { alert(res.error); return; }
    renderHarborBuyModal();
  };

  window.toggleHarborSelect = function(lotIdx, conIdx, color, price) {
    const existing = selections.findIndex(s => s.fromLotIdx === lotIdx && s.conIdx === conIdx);
    const btn = document.getElementById(`hsel-${lotIdx}-${conIdx}`);
    if (existing !== -1) {
      selections.splice(existing, 1);
      if (btn) { btn.textContent = 'Buy'; btn.className = 'action-btn secondary buy-toggle'; }
    } else {
      if (selections.length >= room) { alert(`Ship only has room for ${room} more`); return; }
      selections.push({ color, fromLotIdx: lotIdx, conIdx, price });
      if (btn) { btn.textContent = 'âœ“ Remove'; btn.className = 'action-btn buy-toggle selected-buy'; }
    }
    const total = selections.reduce((s, p) => s + p.price, 0);
    document.getElementById('harbor-buy-total').textContent = `Total: $${total}`;
  };

  window.confirmHarborPurchase = function() {
    if (selections.length === 0) { alert('Select at least one container, or skip.'); return; }
    const totalCost = selections.reduce((s, p) => s + p.price, 0);
    if (currentPlayer(state).cash < totalCost) { alert(`Need $${totalCost}`); return; }
    const newShip = [...player.shipContainers, ...selections.map(s => s.color)];
    const purchaseList = selections.map(s => ({ color: s.color, fromLotIdx: s.fromLotIdx }));
    const res = harborPurchase(state, player.id, purchaseList, newShip);
    if (!res.ok) { alert(res.error); return; }
    closeModal();
    if (!freeAnchorAction) {
      useAction(state);
    } else if (state.actionsLeft <= 0) {
      advanceTurn(state);
    }
    render(state);
    APP_processNextIfAI(state);
  };

  window.skipAnchorBuy = function() {
    closeModal();
    if (state.actionsLeft <= 0) advanceTurn(state);
    render(state);
    APP_processNextIfAI(state);
  };
}

function showSailModal(state) {
  const player = currentPlayer(state);
  const loc = player.shipLocation;

  const destinations = [];
  if (loc !== 'ocean') {
    destinations.push({ label: 'Move to Ocean', dest: 'ocean' });
  } else {
    destinations.push({ label: 'Container Island', dest: 'island' });
    destinations.push({ label: 'Off-Shore Bank', dest: 'bank' });
    state.players.forEach(p => {
      if (p.id !== player.id) {
        destinations.push({ label: `${p.name}'s Harbor: ${countHarbor(p)} containers`, dest: p.id, cssColor: p.cssColor });
      }
    });
  }

  showModal(`
    <h3>Sail</h3>
    <p>Current: ${loc === 'ocean' ? 'Ocean' : loc === 'island' ? 'Island' : loc === 'bank' ? 'Bank' : `${state.players[loc].name}'s harbor`}</p>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
      ${destinations.map(d => `<button class="action-btn" onclick="chooseSailDest('${d.dest}')" ${d.cssColor ? `style="border-left:4px solid ${d.cssColor}"` : ''}>${d.label}</button>`).join('')}
    </div>
  `);

  window.chooseSailDest = function(dest) {
    const destVal = isNaN(dest) ? dest : Number(dest);
    const res = sail(state, player.id, destVal);
    if (!res.ok) { alert(res.error); return; }
    closeModal();

    if (res.anchorAction === 'delivery_auction') {
      // Delivery always ends the turn; resolveDeliveryAuctionâ†’advanceTurn handles transition.
      // Don't call useAction â€” if this was the last action, useAction would call advanceTurn
      // immediately, overwriting phase='delivery_auction' before render sees it.
      startDeliveryAuction(state, player.id);
      state.actionsLeft = 0;
      state.phase = 'delivery_auction';
      render(state);
    } else if (res.anchorAction === 'harbor_buy') {
      // Deduct the action manually â€” don't call useAction() yet, because if this
      // was the player's last action useAction would call advanceTurn() immediately,
      // moving to the next player before showHarborBuyModal runs (crash on empty harbor).
      // Turn advancement is deferred to after the modal resolves (skip or confirm).
      state.actionsLeft--;
      render(state);
      showHarborBuyModal(state, true); // freeAnchorAction = true
    } else {
      useAction(state);
      render(state);
      APP_processNextIfAI(state);
    }
  };
}

function showRepriceModal(state, forcedDistrict) {
  const player = currentPlayer(state);

  const showDistrict = (district) => {
    const lots = district === 'factory' ? player.factoryLots : player.harborLots;
    const prices = district === 'factory' ? [1,2,3,4] : [2,3,4,5,6];

    // Each container gets its own row â€” even identical colors can have different prices
    const allContainers = lots.flatMap(l => l.containers.map(c => ({ color: c, price: l.price })));

    if (allContainers.length === 0) {
      showModal(`<h3>Reprice ${district === 'factory' ? 'Factory' : 'Harbor'}</h3><p>No containers to reprice.</p>`);
      return;
    }

    window._repriceCtx = {
      state, district, lots, prices, allContainers,
      assignments: allContainers.map(c => c.price)
    };

    function renderRepriceModal() {
      const ctx = window._repriceCtx;
      const districtName = ctx.district === 'factory' ? 'Factory' : 'Harbor';
      const rows = ctx.allContainers.map((c, i) => {
        const btns = ctx.prices.map(p => {
          const sel = ctx.assignments[i] === p;
          return `<button class="price-btn${sel ? ' selected' : ''}" onclick="repricePick(${i},${p})">$${p}${sel ? ' âœ“' : ''}</button>`;
        }).join('');
        return `<div class="price-assign-row">${pill([c.color])} ${COLOR_LABEL[c.color]}: ${btns}</div>`;
      }).join('');

      showModal(`
        <h3>Reprice ${districtName}</h3>
        <p>Set the price for each container individually:</p>
        ${rows}
        <button class="action-btn" style="margin-top:12px" onclick="confirmReprice()">Confirm</button>
      `);
    }

    window.repricePick = function(idx, price) {
      window._repriceCtx.assignments[idx] = price;
      renderRepriceModal();
    };

    window.confirmReprice = function() {
      const ctx = window._repriceCtx;
      const newLots = ctx.lots.map(l => ({ price: l.price, containers: [] }));
      ctx.allContainers.forEach((c, i) => {
        const lot = newLots.find(l => l.price === ctx.assignments[i]);
        if (lot) lot.containers.push(c.color);
      });
      const res = reprice(ctx.state, player.id, ctx.district, newLots);
      if (!res.ok) { alert(res.error); return; }
      closeModal();
      useAction(ctx.state);
      render(ctx.state);
      APP_processNextIfAI(ctx.state);
    };

    renderRepriceModal();
  };

  if (forcedDistrict) {
    showDistrict(forcedDistrict);
    return;
  }

  showModal(`
    <h3>Reprice</h3>
    <button class="action-btn" onclick="showRepriceDistrict('factory')">Factory District</button>
    <button class="action-btn" onclick="showRepriceDistrict('harbor')">Harbor District</button>
  `);
  window.showRepriceDistrict = showDistrict;
}

function showCallBankModal(state) {
  const player = currentPlayer(state);
  const bank = state.bank;
  const canStart = bank.tokensLeft > 0;
  const LOT_ROMAN = ['I','II','III'];

  const conLots = bank.containerLots.map((lot, i) => {
    const hasAuction = bank.containerAuction && bank.containerAuction.lotIdx === i;
    const curBid = hasAuction ? bank.containerAuction.amount : 0;
    const isMine = hasAuction && bank.containerAuction.bidderId === player.id;
    if (lot.length === 0 && !hasAuction) return '';
    return `<div class="bank-bid-item">
      <strong>Container Lot ${LOT_ROMAN[i]}:</strong> ${pill(lot)}
      ${hasAuction ? `<span class="opp-small">(current: $${curBid} by ${state.players[bank.containerAuction.bidderId].name})</span>` : ''}
      ${!isMine && (hasAuction || canStart) ? `
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <input type="number" id="bid-con-${i}" min="${curBid+1}" value="${curBid+1}" style="width:70px;padding:6px;font-size:1em;border-radius:8px;border:1.5px solid #b8cfe0">
          <button class="action-btn" style="padding:8px 14px" onclick="submitCashBid(${i})">Bid Cash</button>
        </div>
      ` : (isMine ? '<span class="ai-tag" style="margin-top:6px;display:inline-block">Your bid</span>' : '')}
    </div>`;
  }).join('');

  const cashLots = bank.cashLots.map((cash, i) => {
    if (cash === 0) return '';
    const hasAuction = bank.cashAuction && bank.cashAuction.lotIdx === i;
    const curWeight = hasAuction ? bidWeight(bank.cashAuction.containers) : 0;
    const curCount = hasAuction ? bank.cashAuction.containers.length : 0;
    const curWStr = curWeight % 1 ? curWeight.toFixed(1) : curWeight;
    const isMine = hasAuction && bank.cashAuction.bidderId === player.id;
    const canBid = !isMine && (hasAuction || canStart);
    const totalContainers = player.factoryLots.reduce((s,l) => s + l.containers.length, 0)
                          + player.harborLots.reduce((s,l) => s + l.containers.length, 0);
    return `<div class="bank-bid-item">
      <strong>Cash Lot ${LOT_ROMAN[i]}:</strong> ${money(cash)}
      ${hasAuction ? `<span class="opp-small">(current: ${curWStr} weight, ${curCount} container${curCount!==1?'s':''} by ${state.players[bank.cashAuction.bidderId].name})</span>` : ''}
      ${canBid
        ? `<button class="action-btn" style="margin-top:8px;padding:8px 14px" onclick="openConBidModal(${i}, ${curWeight})">
            Bid Containers ${hasAuction ? `(must beat ${curWStr})` : '(start auction)'}
           </button>`
        : (isMine
          ? `<span class="ai-tag" style="margin-top:6px;display:inline-block">Your bid: ${curCount} container${curCount!==1?'s':''}</span>`
          : (totalContainers === 0 ? '<span class="opp-small">No containers to bid</span>' : ''))
      }
    </div>`;
  }).join('');

  // Expansion: Truck Companies section
  let truckSection = '';
  if ((state.modules || {}).truckCompanies) {
    const activeTruck = bank.truckAuction;
    const myTrucks = player.trucksLeft;

    // Independent companies (can start new auctions)
    const independent = state.players.filter(p => p.truckCompanyOwner === null);
    // Active truck auction (can outbid)
    let truckAuctionHtml = '';
    if (activeTruck) {
      const targetP = state.players[activeTruck.targetPlayerId];
      const bidderP = state.players[activeTruck.bidderId];
      const isMine = activeTruck.bidderId === player.id;
      const activeFund = targetP.truckingFund || 0;
      truckAuctionHtml = `<div class="bank-bid-item">
        <strong>Truck Auction: ${targetP.name}'s Company</strong>
        <span class="opp-small">(current: $${activeTruck.amount} by ${bidderP.name})</span>
        ${activeFund > 0 ? `<span class="truck-fund">$${activeFund} in area</span>` : ''}
        ${!isMine && myTrucks > 0 ? `
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
            <input type="number" id="truck-outbid" min="${activeTruck.amount + 1}" value="${activeTruck.amount + 1}" style="width:70px;padding:6px;font-size:1em;border-radius:8px;border:1.5px solid #b8cfe0">
            <button class="action-btn" style="padding:8px 14px" onclick="submitTruckBid(${activeTruck.targetPlayerId})">Outbid</button>
          </div>
        ` : (isMine ? '<span class="ai-tag" style="margin-top:6px;display:inline-block">Your bid</span>' : '<span class="opp-small">No trucks left</span>')}
      </div>`;
    }

    const newAuctionHtml = independent
      .map(p => {
        const fund = p.truckingFund || 0;
        const fundBadge = fund > 0 ? ` <span class="truck-fund">$${fund} in area</span>` : '';
        return `<div class="bank-bid-item">
          <strong>${p.name}'s Truck Company</strong>
          <span class="opp-small">(independent)</span>${fundBadge}
          ${!activeTruck && (bank.tokensLeft > 0) && myTrucks > 0 ? `
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
              <input type="number" id="truck-bid-${p.id}" min="1" value="1" style="width:70px;padding:6px;font-size:1em;border-radius:8px;border:1.5px solid #b8cfe0">
              <button class="action-btn" style="padding:8px 14px" onclick="startTruckBid(${p.id})">Bid Cash</button>
            </div>
          ` : (activeTruck ? '<span class="opp-small">Auction in progress</span>' : (myTrucks <= 0 ? '<span class="opp-small">No trucks left</span>' : ''))}
        </div>`;
      }).join('');

    const ownedRows = state.players
      .filter(p => p.truckCompanyOwner !== null)
      .map(p => {
        const ownerName = state.players[p.truckCompanyOwner]?.name || '?';
        return `<div class="opp-small">${p.name}'s Company â†’ owned by ${ownerName}</div>`;
      }).join('');

    truckSection = `
      <div style="margin-top:14px">
        <strong class="section-title" style="font-size:0.9em">Truck Companies</strong>
        <div class="opp-small" style="margin-bottom:6px">Your trucks: ${myTrucks}/3 available</div>
        ${truckAuctionHtml}
        ${newAuctionHtml}
        ${ownedRows ? `<div style="margin-top:6px">${ownedRows}</div>` : ''}
      </div>
    `;
  }

  showModal(`
    <h3>Call Bank</h3>
    <p>Your cash: <strong>$${player.cash}</strong> Â· Tokens left: <strong>${bank.tokensLeft}</strong></p>
    ${conLots ? `<div><strong class="section-title" style="font-size:0.9em">Container Lots</strong>${conLots}</div>` : ''}
    ${cashLots ? `<div style="margin-top:14px"><strong class="section-title" style="font-size:0.9em">Cash Lots</strong>${cashLots}</div>` : ''}
    ${truckSection}
    ${!conLots && !cashLots && !truckSection ? '<p><em>No bank lots available to bid on.</em></p>' : ''}
  `);

  window.submitCashBid = function(lotIdx) {
    const inp = document.getElementById(`bid-con-${lotIdx}`);
    const amount = inp ? Number(inp.value) : 0;
    if (amount <= 0) { alert('Enter a valid bid amount'); return; }
    const res = callBank(state, player.id, 'container', lotIdx, amount);
    if (!res.ok) { alert(res.error); return; }
    closeModal();
    useAction(state);
    render(state);
    APP_processNextIfAI(state);
  };

  window.startTruckBid = function(targetPlayerId) {
    const inp = document.getElementById(`truck-bid-${targetPlayerId}`);
    const amount = inp ? Number(inp.value) : 0;
    if (amount <= 0) { alert('Enter a valid bid amount'); return; }
    const res = callTruckAuction(state, player.id, targetPlayerId, amount);
    if (!res.ok) { alert(res.error); return; }
    closeModal();
    useAction(state);
    render(state);
    APP_processNextIfAI(state);
  };

  window.submitTruckBid = function(targetPlayerId) {
    const inp = document.getElementById('truck-outbid');
    const amount = inp ? Number(inp.value) : 0;
    if (amount <= 0) { alert('Enter a valid bid amount'); return; }
    const res = callTruckAuction(state, player.id, targetPlayerId, amount);
    if (!res.ok) { alert(res.error); return; }
    closeModal();
    useAction(state);
    render(state);
    APP_processNextIfAI(state);
  };

  window.openConBidModal = function(lotIdx, minCount) {
    // Collect all containers from factory and harbor lots
    const allContainers = [];
    player.factoryLots.forEach((lot, li) => {
      lot.containers.forEach((color) => {
        allContainers.push({ color, district: 'factory', lotIdx: li, price: lot.price });
      });
    });
    player.harborLots.forEach((lot, li) => {
      lot.containers.forEach((color) => {
        allContainers.push({ color, district: 'harbor', lotIdx: li, price: lot.price });
      });
    });

    window._conBidCtx = { state, player, cashLotIdx: lotIdx, minWeight: minCount, allContainers, selected: new Set() };
    renderConBidModal();
  };
}

function renderConBidModal() {
  const ctx = window._conBidCtx;
  const { allContainers, selected, minWeight, cashLotIdx, state } = ctx;
  const cashAmt = state.bank.cashLots[cashLotIdx];
  const LOT_ROMAN = ['I','II','III'];
  const selCount = selected.size;
  const selWeight = [...selected].reduce((s, i) => s + (allContainers[i].color === 'gold' ? 1.5 : 1), 0);
  const canConfirm = selWeight > minWeight;
  const selWStr = selWeight % 1 ? selWeight.toFixed(1) : selWeight;
  const minWStr = minWeight % 1 ? minWeight.toFixed(1) : minWeight;
  const hasGold = allContainers.some(c => c.color === 'gold');

  const items = allContainers.length === 0
    ? '<p class="empty">You have no containers to bid.</p>'
    : allContainers.map((item, i) => {
        const isSel = selected.has(i);
        const goldNote = item.color === 'gold' ? ' <span class="opp-small">(counts as 1.5)</span>' : '';
        return `<div class="buy-item">
          ${pill([item.color])} <strong>${COLOR_LABEL[item.color]}</strong>${goldNote}
          <span class="opp-small">${item.district} Â· $${item.price} lot</span>
          <button class="action-btn${isSel ? '' : ' secondary'}" style="padding:7px 14px;font-size:0.9em" onclick="toggleConBid(${i})">
            ${isSel ? 'âœ“ Selected' : 'Select'}
          </button>
        </div>`;
      }).join('');

  showModal(`
    <h3>Bid Containers on Cash Lot ${LOT_ROMAN[cashLotIdx]} (${money(cashAmt)})</h3>
    <p>Must bid weight <strong>above ${minWStr}</strong>${hasGold ? ' â€” gold counts as 1.5' : ''}.
       Selected: <strong>${selWStr}</strong>${canConfirm ? ' âœ“' : ''}</p>
    ${items}
    <button class="action-btn" style="margin-top:14px;width:100%" ${canConfirm ? '' : 'disabled'} onclick="confirmConBid()">
      Bid ${selCount} Container${selCount !== 1 ? 's' : ''} (weight ${selWStr}) for ${money(cashAmt)}
    </button>
  `);
}

window.toggleConBid = function(idx) {
  const ctx = window._conBidCtx;
  if (ctx.selected.has(idx)) ctx.selected.delete(idx);
  else ctx.selected.add(idx);
  renderConBidModal();
};

window.confirmConBid = function() {
  const ctx = window._conBidCtx;
  const { state, player, cashLotIdx, minWeight, allContainers, selected } = ctx;
  const selWeight = [...selected].reduce((s, i) => s + (allContainers[i].color === 'gold' ? 1.5 : 1), 0);
  if (selWeight <= minWeight) {
    const mStr = minWeight % 1 ? minWeight.toFixed(1) : minWeight;
    alert(`Must bid weight above ${mStr} (gold counts as 1.5)`);
    return;
  }
  const containerBid = [...selected].map(i => ({
    color: allContainers[i].color,
    district: allContainers[i].district,
    lotIdx: allContainers[i].lotIdx,
  }));
  const res = callBank(state, player.id, 'cash', cashLotIdx, null, containerBid);
  if (!res.ok) { alert(res.error); return; }
  closeModal();
  useAction(state);
  render(state);
  APP_processNextIfAI(state);
};

// â”€â”€ Expansion: Take Loan modal (with Player Loans flow) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function showTakeLoanModal(state) {
  const player = currentPlayer(state);
  const mods = state.modules || {};

  // Without Player Loans module: just take bank loan
  if (!mods.playerLoans) {
    const res = takeLoan(state, player.id);
    if (!res.ok) { alert(res.error); return; }
    render(state);
    return;
  }

  // Player Loans module: check who can offer
  const offerers = state.players.filter(p =>
    p.id !== player.id && p.cash >= 10 && totalLoans(player) < MAX_LOANS
  );

  if (offerers.length === 0) {
    // No one can offer â€” take bank loan
    const res = takeLoan(state, player.id);
    if (!res.ok) { alert(res.error); return; }
    render(state);
    return;
  }

  // Collect incentive bids from AI opponents; humans enter theirs
  const aiBids = {};
  offerers.forEach(p => {
    if (p.isAI) {
      // AI offers a small incentive based on how much cash they have above $10
      const surplus = p.cash - 10;
      aiBids[p.id] = surplus >= 8 ? 3 : surplus >= 4 ? 1 : 0;
    }
  });

  const humanOfferers = offerers.filter(p => !p.isAI);
  window._loanCtx = { state, player, offerers, humanBids: {}, aiBids };

  if (humanOfferers.length === 0) {
    showLoanIncentiveReveal(state, player, offerers, aiBids, {});
    return;
  }

  // Ask each human offerer for their incentive bid
  showHumanLoanBid(humanOfferers, 0);
}

function showHumanLoanBid(humanOfferers, idx) {
  if (idx >= humanOfferers.length) {
    const ctx = window._loanCtx;
    showLoanIncentiveReveal(ctx.state, ctx.player, ctx.offerers, ctx.aiBids, ctx.humanBids);
    return;
  }
  const offerer = humanOfferers[idx];
  showModal(`
    <h3>${offerer.name} â€” Loan Incentive</h3>
    <p>Would you like to offer a loan to ${window._loanCtx.player.name}?</p>
    <p>You have <strong>$${offerer.cash}</strong>. Offering a loan gives $10 + your incentive bid to the borrower, and they repay you the full amount later.</p>
    <p>Incentive bid (extra cash on top of $10):</p>
    <div class="bid-row">
      <button onclick="adjustLoanBid(-1)">âˆ’</button>
      <span id="loan-bid-display" class="bid-display">0</span>
      <button onclick="adjustLoanBid(1)">+</button>
    </div>
    <div class="bid-actions">
      <button class="action-btn" onclick="submitLoanBid(${offerer.id}, ${idx})">Offer (incentive: $<span id='loan-bid-val'>0</span>)</button>
      <button class="action-btn secondary" onclick="skipLoanBid(${idx})">Decline to offer</button>
    </div>
  `);
  window._loanBidAmount = 0;
  window.adjustLoanBid = function(delta) {
    const max = offerer.cash - 10;
    window._loanBidAmount = Math.max(0, Math.min(max, (window._loanBidAmount || 0) + delta));
    document.getElementById('loan-bid-display').textContent = window._loanBidAmount;
    document.getElementById('loan-bid-val').textContent = window._loanBidAmount;
  };
  window.submitLoanBid = function(offererId, nextIdx) {
    window._loanCtx.humanBids[offererId] = window._loanBidAmount || 0;
    closeModal();
    showHumanLoanBid(humanOfferers, nextIdx + 1);
  };
  window.skipLoanBid = function(nextIdx) {
    closeModal();
    showHumanLoanBid(humanOfferers, nextIdx + 1);
  };
}

function showLoanIncentiveReveal(state, player, offerers, aiBids, humanBids) {
  const allBids = {};
  offerers.forEach(p => {
    const bid = p.isAI ? (aiBids[p.id] || 0) : (humanBids[p.id]);
    if (bid !== undefined) allBids[p.id] = bid;
  });

  // Find highest incentive bidder
  let bestId = null, bestBid = -1;
  for (const [pid, bid] of Object.entries(allBids)) {
    if (bid > bestBid) { bestBid = bid; bestId = Number(pid); }
    else if (bid === bestBid && bestId !== null) {
      // Tie: borrower chooses â€” offer both as options
    }
  }

  // Check if any offers were made
  if (Object.keys(allBids).length === 0) {
    const res = takeLoan(state, player.id);
    if (!res.ok) { alert(res.error); return; }
    render(state); return;
  }

  const rows = offerers
    .filter(p => allBids[p.id] !== undefined)
    .sort((a, b) => (allBids[b.id] || 0) - (allBids[a.id] || 0))
    .map(p => {
      const incentive = allBids[p.id] || 0;
      const total = 10 + incentive;
      const isBest = p.id === bestId;
      return `<div class="bid-reveal-row ${isBest ? 'winner-row' : ''}">
        <span style="color:${p.cssColor}">${p.name}</span>:
        $10 + $${incentive} incentive = <strong>$${total} total</strong>
        ${isBest ? '<span class="ai-tag">Highest</span>' : ''}
        <button class="action-btn" style="margin-left:8px;padding:6px 12px" onclick="acceptLoanFrom(${p.id}, ${incentive})">Accept</button>
      </div>`;
    }).join('');

  showModal(`
    <h3>Loan Offers for ${player.name}</h3>
    <p>Choose an offer to accept, or decline all and take a bank loan instead.</p>
    ${rows}
    <hr>
    <button class="action-btn secondary" onclick="declineAllLoans()">Decline all â€” take bank loan</button>
  `);

  window.acceptLoanFrom = function(lenderId, incentiveAmt) {
    const res = acceptPlayerLoan(state, player.id, lenderId, incentiveAmt);
    if (!res.ok) { alert(res.error); return; }
    closeModal();
    render(state);
  };

  window.declineAllLoans = function() {
    const res = takeLoan(state, player.id);
    if (!res.ok) { alert(res.error); return; }
    closeModal();
    render(state);
  };
}

// â”€â”€ Expansion: Repay Loan modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function showRepayLoanModal(state) {
  const player = currentPlayer(state);
  const mods = state.modules || {};

  // If no player loans module, just repay bank loan
  if (!mods.playerLoans || (player.playerLoans || []).length === 0) {
    const res = repayLoan(state, player.id, 'bank');
    if (!res.ok) { alert(res.error); return; }
    render(state);
    return;
  }

  // Show all loans with repay options
  const bankRows = player.loans > 0 ? Array.from({ length: player.loans }, (_, i) =>
    `<div class="loan-row">Bank loan â€” repay $10
      <button class="action-btn" style="padding:6px 12px" onclick="doRepayLoan('bank', 0)">Repay $10</button>
    </div>`
  ) : [];

  const playerRows = (player.playerLoans || []).map((loan, i) => {
    const lender = state.players[loan.lenderId];
    return `<div class="loan-row">Player loan from ${lender?.name || '?'} â€” owe $${loan.amount}
      ${player.cash >= loan.amount
        ? `<button class="action-btn" style="padding:6px 12px" onclick="doRepayLoan('player', ${i})">Repay $${loan.amount}</button>`
        : `<span class="opp-small">Need $${loan.amount}</span>`}
    </div>`;
  });

  showModal(`
    <h3>Repay Loan</h3>
    <p>Cash: <strong>$${player.cash}</strong></p>
    ${bankRows.join('')}
    ${playerRows.join('')}
  `);

  window.doRepayLoan = function(type, idx) {
    const res = repayLoan(state, player.id, type, idx);
    if (!res.ok) { alert(res.error); return; }
    closeModal();
    render(state);
  };
}

// â”€â”€ Expansion: Acquire Luxury modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function showAcquireLuxuryModal(state) {
  const player = currentPlayer(state);

  // All containers across both districts
  const choices = ['factory', 'harbor'].map(district => {
    const lots = district === 'factory' ? player.factoryLots : player.harborLots;
    const containers = lots.flatMap(l => l.containers.map(c => ({ color: c, price: l.price, district })));
    return { district, containers };
  });

  window._luxuryCtx = { state, player, district: null, returnColors: [], goldPrice: null };

  function renderLuxuryModal() {
    const ctx = window._luxuryCtx;
    const districtBtns = choices.map(d => `
      <button class="action-btn${ctx.district === d.district ? '' : ' secondary'}"
        onclick="setLuxuryDistrict('${d.district}')">
        ${d.district === 'factory' ? 'Factory' : 'Harbor'} (${d.containers.length} containers)
      </button>
    `).join('');

    let containerRows = '', pricePicker = '';
    if (ctx.district) {
      const sel = choices.find(d => d.district === ctx.district);
      const containers = sel?.containers || [];
      containerRows = containers.map((c, i) => {
        const selCount = ctx.returnColors.filter(x => x === `${c.color}:${i}`).length > 0 ? 1 : 0;
        const isSelected = ctx.returnColors.includes(`${c.color}:${i}`);
        return `<div class="buy-item">
          ${pill([c.color])} ${COLOR_LABEL[c.color]} ($${c.price})
          <button class="action-btn${isSelected ? '' : ' secondary'}" onclick="toggleLuxuryReturn('${c.color}:${i}')">
            ${isSelected ? 'Selected' : 'Return'}
          </button>
        </div>`;
      }).join('') || '<p class="empty">No containers in this district.</p>';

      if (ctx.returnColors.length === 2) {
        const prices = ctx.district === 'factory' ? [1,2,3,4] : [1,2,3,4,5];
        pricePicker = `<div style="margin-top:12px">
          <strong>Place gold at price:</strong>
          ${prices.map(p => `<button class="price-btn${ctx.goldPrice === p ? ' selected' : ''}" onclick="setLuxuryPrice(${p})">$${p}${ctx.goldPrice === p ? ' âœ“' : ''}</button>`).join('')}
        </div>`;
      }
    }

    const canConfirm = ctx.district && ctx.returnColors.length === 2 && ctx.goldPrice !== null;
    showModal(`
      <h3>Acquire Gold Luxury Container</h3>
      <p>Return 2 containers from one district â†’ receive 1 gold container in the same district.<br>
      <span class="opp-small">Gold in supply: ${state.goldSupply}</span></p>
      <div style="margin-bottom:10px">${districtBtns}</div>
      ${containerRows}
      ${pricePicker}
      <button class="action-btn" style="margin-top:12px" ${canConfirm ? '' : 'disabled'} onclick="confirmAcquireLuxury()">
        Confirm â€” Acquire Gold
      </button>
    `);
  }

  window.setLuxuryDistrict = function(district) {
    window._luxuryCtx.district = district;
    window._luxuryCtx.returnColors = [];
    window._luxuryCtx.goldPrice = null;
    renderLuxuryModal();
  };

  window.toggleLuxuryReturn = function(key) {
    const ctx = window._luxuryCtx;
    const idx = ctx.returnColors.indexOf(key);
    if (idx !== -1) {
      ctx.returnColors.splice(idx, 1);
    } else if (ctx.returnColors.length < 2) {
      ctx.returnColors.push(key);
    }
    if (ctx.returnColors.length !== 2) ctx.goldPrice = null;
    renderLuxuryModal();
  };

  window.setLuxuryPrice = function(price) {
    window._luxuryCtx.goldPrice = price;
    renderLuxuryModal();
  };

  window.confirmAcquireLuxury = function() {
    const ctx = window._luxuryCtx;
    // Parse the color names from the keyed selection
    const colorNames = ctx.returnColors.map(k => k.split(':')[0]);
    const res = acquireLuxury(state, player.id, ctx.district, colorNames, ctx.goldPrice);
    if (!res.ok) { alert(res.error); return; }
    closeModal();
    render(state);
  };

  renderLuxuryModal();
}

// â”€â”€ Automa instruction modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function showAutomaModal(playerName, steps, onComplete) {
  window._automaCallback = onComplete;

  const stepHtml = steps.map((step, i) => `
    <div class="automa-step">
      <div class="automa-step-title">${i + 1}. ${step.title}</div>
      <ul class="automa-instructions">
        ${step.instructions.map(instr => `<li class="automa-instr">${instr}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  const modal = document.getElementById('modal');
  modal.innerHTML = `
    <div class="modal-content automa-modal">
      <div class="automa-header">
        <span class="automa-name">${playerName}</span>
        <span class="automa-note">Follow these steps on the physical board</span>
      </div>
      ${stepHtml}
      <button class="action-btn automa-done-btn" onclick="automaModalDone()">âœ“ Done â€” Advance Game</button>
    </div>
  `;
}

window.automaModalDone = function() {
  document.getElementById('modal').innerHTML = '';
  const cb = window._automaCallback;
  window._automaCallback = null;
  if (cb) cb();
};

// â”€â”€ Start-of-turn win notifications (human player) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Shows all pending auction results + trucking fund collections as a single modal
function showBankWinModal(startResult, state, onDone) {
  window._bankWinCallback = onDone;

  const sections = [];

  // Emergency loan taken to cover interest
  if (startResult.emergencyLoanTaken) {
    sections.push(`
      <div class="win-section" style="border-color:#e74c3c;background:#fff0f0">
        <div class="win-section-title" style="color:#c0392b">Emergency Loan Taken</div>
        <p class="win-instruction">You couldn't afford interest â€” a bank loan was taken automatically. Take a <strong>loan card</strong> and collect <strong>$10</strong> from the bank supply.</p>
      </div>
    `);
  }

  // Bank loan interest
  if (startResult.bankInterest > 0) {
    sections.push(`
      <div class="win-section" style="border-color:#8e44ad;background:#f8f0ff">
        <div class="win-section-title">Bank Loan Interest â€” $${startResult.bankInterest}</div>
        <p class="win-instruction">Move <strong>$${startResult.bankInterest}</strong> from your cash to the <strong>bank's cash lots</strong> (fill Lot I first, then II, then III).</p>
      </div>
    `);
  }

  // Player loan interest
  if (startResult.playerLoanPayments && startResult.playerLoanPayments.length > 0) {
    const rows = startResult.playerLoanPayments.map(p =>
      `<p class="win-instruction">Move <strong>$1</strong> from your cash to <strong>${p.lenderName}</strong>.</p>`
    ).join('');
    sections.push(`
      <div class="win-section" style="border-color:#8e44ad;background:#f8f0ff">
        <div class="win-section-title">Player Loan Interest</div>
        ${rows}
      </div>
    `);
  }

  // Bank container or cash auction win
  if (startResult.bankWinType === 'containers') {
    const colors = startResult.wonContainerColors;
    const colorList = colors.map(c => `${pill([c])} ${COLOR_LABEL[c]}`).join(', ');
    sections.push(`
      <div class="win-section">
        <div class="win-section-title">Bank Auction â€” ${colors.length} Container${colors.length !== 1 ? 's' : ''} Won!</div>
        <p>Your bid of <strong>$${startResult.paidAmount}</strong> was the highest.</p>
        <p style="margin:8px 0">${colorList}</p>
        <p class="win-instruction">Take these containers from the bank lot â†’ place in <strong>your holding area</strong> on the bank board. Pay <strong>$${startResult.paidAmount}</strong> to bank cash lots: ${describeBankDistribution(state.bank, startResult.paidAmount)}.</p>
      </div>
    `);
  } else if (startResult.bankWinType === 'cash') {
    sections.push(`
      <div class="win-section">
        <div class="win-section-title">Bank Auction â€” $${startResult.bankWinAmount} Cash Won!</div>
        <p>Your container bid was the highest.</p>
        <p class="win-instruction">Take <strong>$${startResult.bankWinAmount}</strong> from the cash lot. Your bid containers go to bank container lots: ${describeBankContainerDistribution(state.bank, startResult.bidContainers || [])}.</p>
      </div>
    `);
  }

  // Truck company auction win
  if (startResult.truckCompanyWon != null && state.modules?.truckCompanies) {
    const target = state.players[startResult.truckCompanyWon];
    const isOwn = startResult.truckCompanyWon === currentPlayer(state).id;
    const fundCollected = startResult.truckingFundCollected || 0;
    const bidPaid = startResult.truckBidPaid || 0;
    sections.push(`
      <div class="win-section">
        <div class="win-section-title">Truck Company Won â€” ${target.name}'s Company!</div>
        <p class="win-instruction">Pay <strong>$${bidPaid}</strong> to the Off-Shore Bank cash lots: ${describeBankDistribution(state.bank, bidPaid)}.</p>
        ${fundCollected > 0 ? `<p class="win-instruction">Take <strong>$${fundCollected}</strong> from <strong>${target.name}'s trucking area</strong> into your hand.</p>` : ''}
        <p class="win-instruction">Place one of your truck tokens on <strong>${target.name}'s board extension</strong>.
        ${isOwn
          ? 'You now own your own company â€” no more $1 freight fees on factory purchases.'
          : `From now on, when <strong>${target.name}</strong> makes a Factory Purchase, collect $1 from them.`}
        </p>
      </div>
    `);
  }

  const hasAuction = startResult.bankWinType || startResult.truckCompanyWon != null;
  const hasLoan = startResult.bankInterest > 0 || (startResult.playerLoanPayments && startResult.playerLoanPayments.length > 0) || startResult.emergencyLoanTaken;
  const title = hasAuction && hasLoan ? 'Turn Start' : hasAuction ? 'Auction Results' : 'Turn Start â€” Interest Due';

  const modal = document.getElementById('modal');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${title}</h3>
      ${sections.join('')}
      <button class="action-btn" style="margin-top:14px" onclick="bankWinModalDone()">âœ“ Got it</button>
    </div>
  `;
}
window.bankWinModalDone = function() {
  document.getElementById('modal').innerHTML = '';
  const cb = window._bankWinCallback;
  window._bankWinCallback = null;
  if (cb) cb();
};

// â”€â”€ Game end screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderGameEnd(state) {
  const el = document.getElementById('container-automa-root');
  const scores = state.scores || [];

  // Sort by total, tiebreaker: most factory containers
  const sorted = [...scores].sort((a, b) =>
    b.total !== a.total ? b.total - a.total : b.factoryCount - a.factoryCount
  );
  const top = sorted[0];
  const winners = sorted.filter(s => s.total === top.total && s.factoryCount === top.factoryCount);
  const shared = winners.length > 1;

  const rows = sorted.map(s => {
    const p = state.players[s.playerId];
    const card = s.scoringCard;
    const isWinner = winners.some(w => w.playerId === s.playerId);

    // Card label
    const cardVals = COLORS.map(c => {
      const valStr = c === card.twoValue ? '$10/$5' : `$${card.values[c]}`;
      return `${pill([c])} ${valStr}`;
    }).join(' ');

    // Step 1: Discard
    const discardHtml = s.discardColor
      ? `<div class="score-step">
           <span class="score-step-label">â‘  Discard</span>
           ${pill([s.discardColor])} <strong>${COLOR_LABEL[s.discardColor]}</strong> Ã—${s.discardCount} â€” $0 each (most common)
         </div>`
      : `<div class="score-step"><span class="score-step-label">â‘  Discard</span> <em>No island containers</em></div>`;

    // Step 2: Island scoring per color
    const bkd = s.islandBreakdown || {};
    const islandColorRows = COLORS.filter(c => bkd[c]).map(c => {
      const b = bkd[c];
      const isTwoVal = c === card.twoValue;
      const note = isTwoVal
        ? `$${b.perUnit}/ea (${s.hasAllColors ? 'all 5 colors âœ“' : 'missing colors'})`
        : `$${b.perUnit}/ea`;
      return `<div class="score-island-row">${pill([c])} <strong>${COLOR_LABEL[c]}</strong> Ã—${b.count} @ ${note} = <strong>$${b.subtotal}</strong></div>`;
    }).join('');
    const islandHtml = `<div class="score-step">
      <span class="score-step-label">â‘¡ Island</span>
      ${islandColorRows || '<em>None scored</em>'}
      <div class="score-step-subtotal">Island total: <strong>$${s.islandScore}</strong></div>
    </div>`;

    // Step 3: Leftover containers
    const leftParts = [];
    if (s.shipCount > 0)    leftParts.push(`Ship Ã—${s.shipCount} @ $3 = $${s.shipCount * 3}`);
    if (s.holdingCount > 0) leftParts.push(`Holding area Ã—${s.holdingCount} @ $3 = $${s.holdingCount * 3}`);
    if (s.harborCount > 0)  leftParts.push(`Harbor Ã—${s.harborCount} @ $2 = $${s.harborCount * 2}`);
    if (s.factoryCount > 0) leftParts.push(`Factory Ã—${s.factoryCount} @ $0`);
    const leftHtml = `<div class="score-step">
      <span class="score-step-label">â‘¢ Leftovers</span>
      ${leftParts.length ? leftParts.map(l => `<div>${l}</div>`).join('') : '<em>None</em>'}
      ${s.leftoverScore > 0 ? `<div class="score-step-subtotal">Leftover total: <strong>$${s.leftoverScore}</strong></div>` : ''}
    </div>`;

    // Step 4: Loans
    const loanParts = [];
    if (s.bankLoans > 0)        loanParts.push(`Bank loans Ã—${s.bankLoans} @ $11 = âˆ’$${s.bankLoans * 11}`);
    if (s.playerLoanPenalty > 0) loanParts.push(`Player loans: âˆ’$${s.playerLoanPenalty}`);
    const loanHtml = s.loanPenalty > 0 ? `<div class="score-step">
      <span class="score-step-label">â‘£ Loans</span>
      ${loanParts.map(l => `<div>${l}</div>`).join('')}
      <div class="score-step-subtotal">Loan penalty: <strong>âˆ’$${s.loanPenalty}</strong></div>
    </div>` : '';

    return `
    <div class="score-row ${isWinner ? 'winner' : ''}">
      <div class="score-row-header">
        <span style="color:${p.cssColor};font-weight:700;font-size:1.1em">${s.name}</span>
        <div class="score-total">$${s.total}</div>
      </div>
      ${isWinner ? `<div class="winner-crown">${shared ? 'ðŸ† Tied victory!' : 'ðŸ† Winner!'}</div>` : ''}
      <div class="score-card-reveal" style="margin:6px 0 4px">Card ${card.label}: ${cardVals}</div>
      <div class="score-cash-line">Cash on hand: <strong>$${s.cash}</strong></div>
      ${discardHtml}
      ${islandHtml}
      ${leftHtml}
      ${loanHtml}
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="end-screen">
      <h2>Game Over</h2>
      <p style="color:var(--text-muted);font-size:0.9em;margin:-10px 0 6px">Tap each section to review, then play again.</p>
      <div class="scores-list">${rows}</div>
      <button class="action-btn" style="margin-top:16px" onclick="location.reload()">Play Again</button>
    </div>
  `;
}
