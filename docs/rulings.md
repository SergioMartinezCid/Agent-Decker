# Agent Decker — Digital Edition Rulings

These rulings make the web adaptation behave deterministically. They are
built from, in order of precedence:

1. **Card text** in `AgentDecker_cards_full_art.pdf` (Nov 2016). Card text wins over the rulebook.
2. **Rulebook** `AgentDecker_rules_full_art.pdf` (Sept 2015; the rules text in the 2017 rulebook is the same).
3. **Designer answers** on BoardGameGeek. The designer is Manuel Correia, BGG user `gr9yfox`. Below, `a/N` means `https://boardgamegeek.com/article/N`.
4. The **community FAQ** by `rkonigsberg`, which the designer reviewed.

Status legend: **[D]** designer ruling · **[R]** rulebook or card text · **[P]** our proposal (no authoritative source, or sources conflict).

---

## 1. Components (54 cards)

| Group | Cards |
|---|---|
| Alarm | 1 card (0–49 track) |
| Starting deck (8) | 3× Hide (1 Stealth), 5× Punch (1 Fight) |
| Obstacle deck (22, blue) | 3× Guard, 2× Patrolling Guard, 5× Security Camera, 2× Waste Room, 2× Guard Dog, 2× Yard Door, Motion Sensor Hall, Sentry Gun, Gym Door, Sleeping Guard, Infirmary, Radio Tower |
| Mission deck (23) | Goals: **A** M1 · **C** M2 · **E** M3 · **G** M4 · **I** M5. Mission obstacles: **B** (3, orange) · **D** (4, green) · **F** (5, pink) · **H** (6, purple) |

- **Costs:** Stealth (blue triangle), Fight (red circle), or **Any** (red triangle inside a blue circle), which can be paid with any mix of the two.
- **Obstacle types:** person, location, animal, electronic (lightbulb), door.

## 2. Turn sequence (engine order)

1. **Use cards.** Play cards from your hand, use equipment, and interact with up to *N* obstacles (N = 1, then 2 after Mission 2, then 3 after Mission 4). Playing cards and using effects that aren't interactions is unlimited. The player ends this phase. [R]
2. **Mission check.** If the goal can be met, the mission is completed (§6) and the turn ends immediately. There is no Line Scroll or Card Refresh. [R][D a/19754475]
3. **Line scroll** (§4.3).
4. **Card refresh.** Refill the line (§4.4). Then move your hand and Play Area to your discard pile, except a card saved by *Save Bullets*. Then draw up to your hand size (4, or 5 after Mission 3). [R]

## 3. Resources and interactions

- **Resource pool.** Played cards add their resources to a pool that lasts for the turn. A card's output can be split across several obstacles, and unspent resources are lost at end of turn. [D a/24411865] Each obstacle's cost is paid separately. [D]
- **Interacting** with a face-up obstacle means paying its cost (or using a Keycard-style item), then choosing either:
  - **Disarm:** the card goes to your Play Area, or to the Equip Area if it is a KEEP item. Its top half is *not* usable this turn. [R][D a/20211905]
  - **Knock out:** the card is turned face down and stays in place. It loses its type and ability. [R][D a/18996899]
- Disarming never raises the alarm. The alarm only rises when a face-up card leaves the end of the line. [D a/19786288, a/19725759]
- **Face-down cards can't be interacted with** (no disarming a knocked-out card later). [D a/23913407]
- **Not interactions:** card effects that move or flip line cards (e.g. Distraction), and effects an obstacle triggers on other cards (Flammable Barrel, Clumsy Guard's knock-out). [D a/19754475, a/27041620, a/25688990]
- Drawing from an empty deck: shuffle your discard pile into a new deck and keep drawing. If both are empty, draw what you can. [R][D a/27041620] Cards in the Play Area are never reshuffled mid-turn. [D a/19719921]
- Cards resolve fully, one at a time. You can't play another card in the middle of a draw effect. [D a/27041620]

## 4. The Line

### 4.1 Model
The line is **6 positions**. Cards enter from the left, and position 6 (right) is the exit. Disarming leaves an **empty position**, and that gap stays until the Line Scroll. [R diagram][D a/18944164]

### 4.2 Adjacency
"Adjacent" means the card in the next position on either side. **An empty position breaks adjacency.** [D a/27041620]

### 4.3 Line scroll
1. **Discard:** the **rightmost card in the line**, however far back it is, goes to the obstacles discard. If it is face up, raise the alarm by its value. [D a/21588070]
   - If it is a **face-up Siren**, every other card in the line also goes to the discard, without raising the alarm. [R][D a/19754475]
2. **Slide:** every card moves right as far as it can, keeping its order. While a **face-up Dormitory** is in the line, face-down cards stay where they are and face-up cards slide past them into the free positions. [D a/25945933, worked example `DUUXXX → _DUXXU`]
3. **Scroll abilities**, resolved right to left: [D a/19685897, a/25174595, a/27041620, a/39417290]
   - **Patrolling Guard** swaps with the card immediately to its right, if there is one. A guard at position 6 doesn't leave this turn.
   - **Inspector** flips the last card in the line face up, and that card's "When … appears" ability triggers.
   - *Note:* in one 2021 post the designer said the Inspector acts *before* the discard (a/36998965). His 2015, 2017 and 2022 posts all say *after*, and we follow those.

### 4.4 Refill
Fill the empty positions **right to left**, one card at a time. Resolve each card's arrival ability before drawing the next. [R][D a/21849675]
- If the obstacle deck is empty, shuffle the obstacles discard to form a new deck.
- If there still aren't enough cards to fill the line, you are **out of time** and it's game over. [R][D a/21160741]
- Setup and new-mission lines use the same procedure, starting from an empty line.

### 4.5 Arrival abilities ("when appears")
- **Patrolling Guard:** also moves one extra position right away when it arrives, i.e. swaps with the card to its right if there is one. [D a/21849675]
- **Guard Dog:** if there is a face-up person in the line, the dog slides toward the **nearest** one until adjacent. Coming from the left, it ends on the person's left. It never jumps over its target. [D a/20394868, a/36874313, a/39189298]
- **Radio Tower:** acts like a magnet. Every face-up person slides toward the tower until they are packed next to it, from either side, keeping their order. The cards they pass shift to make room. [D a/19702799, a/20327817]
  - Example: `RT a b c P P → RT P P a b c`

## 5. Items and equipment (KEEP)

- When you disarm a KEEP item, you may put it straight into the **Equip Area**. It can be used that same turn. [R][D a/21991611]
- When you draw a KEEP item, equipping it from your hand is free and isn't an action. [D a/22007333]
- **Keycard / Chloroform / E.M.P.:** usable from hand or from the Equip Area. Put the card **directly into your discard pile** (card text beats the rulebook) to interact with a door / person / electronic **without paying its cost**. This counts as one of your interactions. [D a/38014670, a/19180760, a/23382643] Restrictions such as Sniper and Hawk still apply.
- **Guard Uniform (1 Stealth) / Prisoner (1 Fight):** while equipped, they give that resource once per turn and stay equipped. From hand, you may play them as a normal resource card or equip them. [D a/24284870]
- Equipped cards and mission rewards stay on the table between missions. [R][D a/21189154]
- **KEEP cards** (counted by *Gear Up!*): Keycard, Chloroform, E.M.P., Guard Uniform, Prisoner, plus the Mission 1 reward (Map) and the Mission 2 reward (New Rule, which also has KEEP). The Mission 3 and 4 rewards don't count. [D a/23606679, a/38012088]

## 6. Missions

| Goal | Requirement at Mission Check | Reward |
|---|---|---|
| **M1** | Pay 6 Stealth | **Map**, KEEP: +1 Stealth every turn |
| **M2** | Pay 6 Fight **and** Guard Uniform in the Equip Area | New Rule (KEEP): up to **2** interactions per turn |
| **M3** | 7 cards in hand | New Rule: draw **5** cards per turn |
| **M4** | Pay 18 Any **and** Prisoner in the Equip Area | New Rule: up to **3** interactions per turn |
| **M5** | Exactly 6 cards in the line, all face down | Mission complete: **campaign won** |

- **Paying a goal** works like paying an obstacle cost: it uses resources still unspent this turn, plus cards still in hand and equipped bonuses. It is not an interaction, and you can't pay toward it across several turns. [D a/21174312, a/21269265, a/20211905, a/25945933, a/43428446]
- **Mission 3** counts only the cards in your hand at that moment. [D a/25945933]
- **Mission progression:** [R]
  1. The reward goes to the Equip Area.
  2. Add the next mission obstacles (B/D/F/H) to the obstacles discard.
  3. Shuffle the obstacles discard, line and deck together, then deal a new line.
  4. Record the alarm for scoring, then reset it to 0.
  5. Shuffle your **hand**, Play Area, discard pile and deck into a new deck. Cards removed from the game stay out.
  6. Draw a new hand.

## 7. Alarm, game over, score

- Reaching **50** is game over, checked as soon as the alarm rises. [R][D a/22111316]
- Running **out of obstacles** while filling the line is game over (§4.4).
- **Official rule:** a loss ends the campaign; you start again from Mission 1. [D a/21588070]
- **Score** = the sum of the alarm at each of the 5 mission completions. Lower is better. [R]

## 8. Player cards (top halves)

| Card | Effect |
|---|---|
| Hide / Punch | 1 Stealth / 1 Fight |
| Gun · Machine Gun · Heavy Hand · Auto Rifle | 2 · 3 · 3 · 4 Fight. Heavy Hand is Fight only, per the 2016 card fix. [D a/24177017] |
| Out of Sight · Don't Move | 2 · 3 Stealth |
| Follow | 1 Stealth **and** draw a card. [D a/24177017] |
| Throw a Rock | 1 Fight **or** draw a card (your choice) |
| Interrogate · Superspeed | Draw 2 · draw 3 |
| Flashy Move | Fight = ⌊cards in your discard pile ÷ 2⌋ when played. Cards in the Play Area don't count. [D a/25197331, a/31387123] |
| Misdirect | Move any number of *other* cards from your hand to the Play Area, without their effects. Gain 2 Stealth for each. [D a/36988634, a/43513380] |
| Bin | Remove any number of cards in your hand from the campaign. Bin can't remove itself. [D a/19754475] |
| Burn | Remove up to 2 cards in your discard pile from the campaign. |
| Recall | Take a card from your discard pile into your hand. |
| Gear Up! | Draw 1 card per KEEP card in your Equip Area, up to 3. |
| Plan Ahead | Look at the top 3 cards of your deck. Put 1 into your hand and the rest back on top in any order. [P] |
| Foresight | Look at the top 5 cards of your deck and put them back in any order. [D a/19696710] |
| Just the Thing | Choose any card in your deck, shuffle the rest, and put the chosen card on top. |
| Swap | Swap your deck and your discard pile. The old discard pile is turned face down, oldest card on top, without shuffling. [P] |
| Retrace Steps | Shuffle the obstacles discard into the obstacle deck. |
| Distraction | Move any line card, face up or face down, to the start of the line (leftmost position). Cards it passes shift right. Not an interaction. [D a/19289222, a/19754475] |
| Bazooka · Optic Camouflage | 5 Fight · 4 Stealth. When used, the card goes to the **obstacles discard** instead of yours. |
| Save Bullets | At this turn's Card Refresh, keep 1 unused card in your hand. It **counts toward** your next hand size, so you draw 1 fewer. [D a/39348602] |
| Keycard · Chloroform · E.M.P. · Guard Uniform · Prisoner | See §5 |

> "Look at the top N" with fewer than N cards in your deck: first shuffle your discard pile and place it under the deck, the same as drawing. [P]

## 9. Obstacle abilities (face-up only)

| Obstacle | Ruling |
|---|---|
| Sniper | Can't be interacted with unless it is the only **face-up** person in the line. Also immune to Flammable Barrel and Clumsy Guard knock-outs. [D a/19717268] |
| Hawk | While Hawk is face up, **you** can't interact with cards whose cost is Stealth-only, including via Keycard-style items. Abilities from other obstacles (Barrel, Clumsy Guard) can still knock those cards out. "Any" costs are fine. [D a/19717268, a/27041620] |
| Watchtower | Adjacent cards cost +2 of their own resource type. |
| Flammable Barrel | When you interact with it (disarm or knock out, including through Clumsy Guard), the adjacent cards are knocked out. Being flipped by the Inspector doesn't trigger it. [D a/18990797, a/19754475, a/25688990] |
| Clumsy Guard | Pay its cost (counts as 1 interaction), then you may knock out an adjacent card instead of resolving Clumsy Guard itself. [R][D a/25688990] |
| Siren · Inspector · Dormitory · Patrolling Guard · Guard Dog · Radio Tower | See §4 |

## 10. Digital-edition choices (decided with the project owner)

- **Game over:** the official rule applies, so the campaign ends. The game-over screen also offers **Retry mission**, which restores the exact snapshot from the start of that mission. Campaigns that used retries are flagged in the local high-score table.
- **Undo:** any action this turn can be undone until something reveals hidden information: drawing, shuffling, looking at your deck, or refilling the line. Each of those starts a new undo checkpoint.
- **Inspector:** acts **after** the discard, following the designer's majority and most recent rulings (§4.3).
- **Save Bullets:** the saved card **counts toward** the next hand size (§8).
- **Automation:** the app enforces every rule and resolves all line movement automatically. The player only makes the choices the rules give them.
- **Persistence:** game state is saved to browser storage after every action. Shuffles use a seeded RNG, so a saved game and its retry snapshot can be reproduced exactly.
