# Shop expansion plan

## Principles
- No real payment code. Items priced in dollars are the existing *pretend* price convention: tapping them (after a confirm) says "Payments are not switched on yet. Nothing was charged." `PAY_LINKS` stays the only hook for a future checkout, and `grantPurchase(id)` is still the function a checkout would call.
- To make the shop actually usable, a free in-game soft currency is added: **Transit Tickets** (`PROF.tix`). Tickets are earned by playing (30 welcome gift, +3 per finished day, +10 per company level, +5 per trophy, +10 per cleared level) and spent on everything small, medium and cosmetic. Dollar-priced items are the "premium" tier: cash/XP/ticket packs, premium bundles, the Head Start Pass and the Ultimate Edition.
- Effects are small. Nothing replaces City Hall; consumables are one-shots, boosters last one game day, permanent perks are a few percent.
- Everything persists in `PROF.shop = {own:{}, inv:{}, bank}` and `PROF.cos` (equipped looks). Cash bought at the home menu is banked in `PROF.shop.bank` and added to the next level start (or Continue).

## Catalogue (smallest to biggest)
| Tier / filter | Items |
|---|---|
| Small: consumables (tickets, stored in `inv`, used from the Items tray) | Coffee Voucher (calms a stop), Umbrella Handout (45 s without storm penalty), Priority Ping (no-cooldown priority), Snack Cart (+20% patience everywhere), Tune-up Kit (fixes broken buses), Road Crew Call (reopens closed roads), Clear Skies (ends storm/fog), Confetti Pop (cosmetic burst), Tip Jar ($600) |
| Small: permanent perks | Spare Tyres (-20% breakdown time), Cup Holders (+4% patience), Ticket Printer (+10% fares), Pocket Map (priority recharges 15% faster), Rain Gear (storms hurt less), Piggy Bank (+$400 start cash every level) |
| Boosts (one game day) | Fare Boost +20%, Patience Tonic +10%, Fuel Saver -15% running cost, Rush Helper +8% bus speed, Double XP, Lucky Day (+50% mission pay) |
| Looks | Bus paints (5 + 5 bundle/seasonal-only), stop sign colours (3), skyline styles (2), bus decals (3), horn sounds (4), music tracks (2), map filters (3), confetti trail (1) |
| Drivers | Training Day (+6 XP to every driver), Hire a Pro, Hire a Veteran, driver hats (cap, top hat, crown) shown on the bus roof |
| Packs (dollar placeholder) | Cash x5 ($3k to $400k), XP x3, Ticket x3, Thank-You (supporter) Pack, Campaign Kit (+$2,500 every level start) |
| Bundles | Ticket bundles: Rider Care Kit, Fix-It Crew, Perfect Day Trio, Paint Box, Sound Check, Driver Day, Golden Fleet; dollar bundles: Starter, City Builder, Mega Mayor; one limited seasonal bundle that matches the real-world season |
| Big | Head Start Pass (existing), Garage Master Key (all Garage looks open), Ultimate Edition |

Bundles show an automatically computed "Save X%" (ticket bundles from component prices, dollar bundles from a stated worth) and a "Best value" badge on the best.

## UI
Card with wallet chips, a sticky horizontal filter bar (All, Small, Boosts, Looks, Drivers, Packs, Bundles, Big), a responsive grid of item cards (2 columns at 390 px). Buying is two taps: first tap arms the button ("Tap again"), the second buys. Looks show Equip / Equipped, perks show Owned, consumables show an owned count and a Use button in game. In game, an Items tray is reachable from the pause menu, the Fleet sheet header and the stop card.

## Wiring
`spawnCitizen` (patience, fares), `busSpeed`, `step` (fuel, umbrella timer), `updCitizens` (umbrella), `startEvent` (tyres, rain gear), `callPriority`, `completeMission`, `addXp`, `loadLevel`/`applySave` (start bonus and cash bank), `ensureBus` (decals, hats), `ensureStop` (sign colour), tower kinds, `musicTick`, `snd('horn')`, CSS filter on the map canvas.
