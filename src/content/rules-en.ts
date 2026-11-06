// Adapted from the Agent Decker rulebook by Manuel Correia (CC BY-NC 4.0).
// Changes: reformatted for screens, notes added where the app automates a step.
// The FAQ summarises docs/rulings.md.
import type { RulesContent } from './types';

export const rulesEn: RulesContent = {
  sections: [
    {
      id: 'overview',
      title: 'Overview',
      blocks: [
        'You’re a secret agent who’s just left spy school and is going to be learning on the field. This is your first mission. Your goal is to locate and rescue a hostage, but first you need to get gear and blend in.',
        'Agent Decker is a solo deckbuilding game: about 20 minutes per mission, 5 missions in the campaign.',
      ],
    },
    {
      id: 'components',
      title: 'Components',
      blocks: [
        { list: ['1 Alarm Card', '8 Starting Cards', '22 Cards in the Obstacle Deck', '23 Cards in the Mission Deck'] },
        'Total: 54 cards. In this app the alarm is tracked for you.',
      ],
    },
    {
      id: 'cards',
      title: 'Types of cards',
      blocks: [
        { h: 'Alarm card' },
        'As you move around the complex you’ll raise suspicion. At first the guards will think it’s just their imagination, but if it reaches the top (50) they’ll go after you. Game over.',
        { h: 'Initial cards' },
        'These cards give you resources, **Stealth** {s} and **Fighting** {f}, which you can use to **interact** with the obstacles.',
        { h: 'Obstacle cards' },
        'These cards have two parts. The bottom half represents the obstacle and the top part is what you’ll get if you disarm it.',
        { img: 'rules/card-anatomy.webp', alt: 'Anatomy of an obstacle card, labelled A1 to A4' },
        {
          defs: [
            ['A1', 'Obstacle name'],
            ['A2', 'Obstacle type: person {person}, location {location}, animal {animal}, electronic {electronic} or door {door}'],
            ['A3', 'The resources required to interact with this obstacle'],
            ['A4', 'How much the alarm goes up if this card leaves the line'],
          ],
        },
        'You can interact with any of the obstacles! To do so, first you spend the cost indicated on the card. It can be Stealth {s}, Fighting {f} or any combination of the two {a}.',
        'No matter which resource you used, when you interact you get to choose whether you disarm or knock out the obstacle:',
        {
          defs: [
            ['Disarm', 'Take the obstacle card out of the line and add it to your play area. It’s a good way to get some gear or better moves.'],
            [
              'Knock out',
              'Turn the card face down and leave it where it was in the line. Knocked-out cards won’t raise the alarm during the Line Scroll, which gives you additional time to complete the mission. When a card is knocked out, ignore its type and effect.',
            ],
          ],
        },
        'Some obstacle cards have effects that activate throughout the turn. They can cause themselves (or other cards) to slide, which forces other cards in the line to adapt to that change.',
        'Example: Patrolling Guard moves faster than the other cards, which means that in the Line Scroll it swaps places with the card to its right.',
        { h: 'Item cards' },
        'They look just like regular obstacle cards, but with a **KEEP** icon on the top. When you disarm an obstacle that has an item, instead of going to the play area you can equip it: place it in the Equip Area.',
        'Some items give you bonuses that work every turn, others can be discarded for an effect. They’re not gone, though! You can equip them when you draw them again.',
        { h: 'Mission cards' },
        'There are two kinds of mission cards: **Mission Goals**, which set your goal for the current mission, and **Mission Obstacles**, which work just like regular obstacles. Mission Goals also have a reward on their top half, which you get when you complete that mission.',
      ],
    },
    {
      id: 'line',
      title: 'The line',
      blocks: [
        'The line represents what you see as you walk through the enemy complex. They see you too, so you need to deal with them before they leave and raise the alarm.',
        { img: 'rules/line.webp', alt: 'The obstacle deck (B1), the line of six cards (B2) and the obstacle discard (B3)', wide: true },
        { defs: [['B1', 'Obstacles deck'], ['B2', 'The line'], ['B3', 'Obstacles discard']] },
        'At the end of the turn you take a step forward, which lets you see more of the complex. Think of it as a conveyor belt: cards leave the line through the right side and new ones refill it from the left.',
        'Some obstacle cards have effects which can change the layout of the line or the behaviour of other cards, so be sure to read them as they appear.',
      ],
    },
    {
      id: 'setup',
      title: 'Setup',
      blocks: [
        'The app does the setup for you. For reference:',
        { img: 'rules/setup.webp', alt: 'Table layout: mission deck and alarm on top, the line, then your deck, discard, play area, hand and equip area', wide: true },
        {
          defs: [
            ['C1', 'Take the mission cards (goals and objectives) and order them alphabetically using the letter on the bottom right corner. This forms the Mission Deck.'],
            ['C2', 'Place the two tokens on the zero (0) spaces of the Alarm Counter.'],
            ['C3', 'Shuffle the Obstacles deck and draw six cards. Place them in a line, starting from the right. Read the cards as you draw them, because some effects may take place. This forms the Line.'],
            ['C4', 'Shuffle your deck and draw four cards. This is your starting hand.'],
          ],
        },
        { h: 'Board areas' },
        { defs: [['D1', 'Obstacles discard'], ['D2', 'Your deck'], ['D3', 'Your discard'], ['D4', 'Play area'], ['D5', 'Equip area']] },
      ],
    },
    {
      id: 'goal',
      title: 'The goal of the game',
      blocks: [
        'The goal of the game is to complete a sequence of missions without alerting the enemy complex. To do so you’ll improve your deck, adding new weapons and skills, while removing unnecessary cards.',
      ],
    },
    {
      id: 'turn',
      title: 'How to play',
      blocks: [
        { h: '1 · Use cards' },
        'Use the cards in your hand to deal with the obstacles on the line. Don’t worry about saving any cards for the next turn because they will be discarded in the Card Refresh phase.',
        'When you play cards you’ll get resources which can be used to interact with the obstacles. Then you have a choice: do you disarm it or knock it out?',
        'When you use or discard a card, it doesn’t go straight to your discard. Instead, it’s placed in the play area.',
        'Initially you can only interact with one obstacle card per turn, but that will change as you progress through the game and your skill set gets better.',
        'When you’ve reached the limit of your interactions per turn, or you don’t want to do anything else this turn, advance to the next phase (**End turn**).',
        { h: '2 · Mission check' },
        'Check if you can fulfil or afford the goal of the mission. If so, you’ve completed it! See Mission progression to set up the next one. If not, advance to the next step.',
        { h: '3 · Line scroll' },
        'Add the last card in the line to the obstacles discard, and raise the alarm counter accordingly. Scroll all the cards in the line to the right.',
        { img: 'rules/scroll.webp', alt: 'After the scroll: the last card is in the obstacle discard and the rest have moved right, leaving empty spaces on the left', wide: true },
        { h: '4 · Card refresh' },
        'Draw new obstacle cards and place them to the left of the current obstacles. There should be six cards in the line. Read and, if necessary, activate the cards as you put them down. This might make you rearrange them.',
        'If you run out of cards to draw, shuffle all of the cards in the discard and use that as the new deck. This is valid both for the obstacles and for your deck. If there aren’t enough obstacles to fill the line, you ran out of time, and it’s game over.',
        'Place all the unused cards from your hand and the cards from the play area in your discard. Draw four new cards for your next turn.',
      ],
    },
    {
      id: 'progression',
      title: 'Mission progression',
      blocks: [
        {
          steps: [
            ['Reward', 'When you complete a mission, you get a reward! The reward is on the mission card itself and goes to your Equip Area. It’s yours, agent, you’ve earned it. Rewards can be permanent resources (usable once a turn) or even new rules!'],
            ['Move forward', 'Add the next mission obstacles to the obstacles discard. If you’ve completed Mission 1 (A), add the next mission obstacles (B).'],
            ['New line', 'Shuffle the obstacles discard, line and obstacles deck together to form the deck for the next mission. Draw six new cards to form the line, and apply any obstacle effects as they appear.'],
            ['Reset the alarm', 'Put the alarm back at zero (0).'],
            ['Shuffle', 'Shuffle all the cards in the play area, your discard and your deck together to form a new deck. Equipped items and New Rules stay on the table for the next mission.'],
            ['Draw', 'Draw four cards from your deck to form your new hand, and you’re ready to go!'],
          ],
        },
      ],
    },
    {
      id: 'score',
      title: 'High score',
      blocks: [
        'The alarm you had when you finished each mission is recorded. When you finish the campaign they are added up for your total score. It represents the total alarm you raised during your campaign, so you want it as low as possible!',
      ],
    },
  ],
  faq: [
    {
      title: 'Alarm and the line',
      items: [
        { q: 'Does disarming an obstacle raise the alarm?', a: 'No. The alarm only goes up when a face-up card leaves the end of the line during the Line Scroll.' },
        {
          q: 'If I disarm the last card in the line, does nothing leave?',
          a: 'No. The rightmost card still in the line always leaves, however far back it is. To keep the alarm still, the last card must be knocked out.',
        },
        {
          q: 'What happens to the gap a disarmed card leaves?',
          a: 'It stays empty until the Line Scroll, when the cards slide right and new cards fill the line from the left. An empty position breaks adjacency: cards on either side of a gap are not adjacent.',
        },
        { q: 'Can I interact with a knocked-out card?', a: 'No. Once a card is knocked out you can’t disarm it later while it’s face down.' },
        { q: 'When exactly do I lose?', a: 'When the alarm reaches 50, or when there aren’t enough obstacles (deck plus discard) to fill the line. Officially the campaign ends there; the app also lets you retry the mission, and marks that in the high scores.' },
      ],
    },
    {
      title: 'Resources and interactions',
      items: [
        { q: 'Can I split my resources between several obstacles?', a: 'Yes. Resources from the cards you play go into a pool for the turn, and you can spread them across your interactions. Each obstacle’s cost is paid separately, and leftovers are lost at the end of the turn.' },
        { q: 'What does an {a} cost mean?', a: 'You can pay it with any mix of Stealth {s} and Fighting {f}.' },
        { q: 'Do I need a specific resource to disarm or to knock out?', a: 'No. Whatever you pay with, you choose to disarm or knock out.' },
        { q: 'Can I use a card I just disarmed?', a: 'Not this turn. It goes to your play area and reaches your deck through your discard pile. KEEP items are the exception: equip them and they work right away.' },
        { q: 'What counts as an interaction?', a: 'Only disarming or knocking out a card in the line yourself. Effects that move or flip cards (like Distraction) don’t count, and neither do cards knocked out by another obstacle’s ability (Flammable Barrel, Clumsy Guard). Completing a mission isn’t an interaction either.' },
        { q: 'What if my deck runs out?', a: 'Shuffle your discard pile to form a new deck and keep drawing. If both are empty, draw what you can. Cards in the play area are never reshuffled in the middle of a turn.' },
      ],
    },
    {
      title: 'Items and rewards',
      items: [
        { q: 'How do Keycard, Chloroform and E.M.P. work?', a: 'From your hand or your Equip Area, put the card in your discard pile to interact with an obstacle of the matching type without paying its cost: Keycard {door}, Chloroform {person}, E.M.P. {electronic}. It still counts as one of your interactions, and Sniper and Hawk restrictions still apply.' },
        { q: 'How do Guard Uniform, Prisoner and the Map work?', a: 'While equipped, each gives its resource once every turn and stays on the table. Guard Uniform and Prisoner can also be played from hand as a normal resource card.' },
        { q: 'Does equipping a card from my hand cost anything?', a: 'No. Equipping is free and isn’t an action.' },
        { q: 'What counts for Gear Up!?', a: 'Every card with KEEP in your Equip Area, including the Map and the Mission Two reward. The Mission Three and Four rewards have no KEEP.' },
      ],
    },
    {
      title: 'Missions',
      items: [
        { q: 'How do I complete a mission that says “Get …”?', a: 'Treat the goal like a cost. At the end of the turn you need those resources still unspent. Resources you used on obstacles don’t count, and you can’t pay a goal over several turns.' },
        { q: 'Where must the Guard Uniform or the Prisoner be?', a: 'In your Equip Area at the moment of the Mission Check. You can disarm and equip it in the same turn you complete the mission.' },
        { q: 'Mission Three: which cards count?', a: 'Only the cards in your hand at the Mission Check. Cards you played don’t count.' },
        { q: 'Mission Five: what exactly do I need?', a: 'All six positions of the line filled with knocked-out cards at the same time.' },
        { q: 'What happens when I complete a mission?', a: 'The turn ends immediately: there is no Line Scroll. Your alarm is recorded, you get the reward, new mission obstacles join the obstacle deck, the alarm resets and all your cards (hand included) are reshuffled. Cards removed from the game stay out.' },
      ],
    },
    {
      title: 'Obstacles',
      items: [
        { q: 'Patrolling Guard', a: 'At the Line Scroll, after the last card leaves and the line slides, it swaps with the card to its right. It also moves one extra position as soon as it enters the line. A Patrolling Guard at the end of the line doesn’t leave early.' },
        { q: 'Guard Dog', a: 'When it appears, if there is a face-up person in the line, it slides toward the nearest one until it’s next to it. It never jumps over its target.' },
        { q: 'Radio Tower', a: 'When it appears, every face-up person slides toward it, from either side, until they’re packed next to it. The cards they pass shift to make room.' },
        { q: 'Inspector', a: 'At every Line Scroll, after the last card leaves and the line slides, the Inspector flips the new last card face up. If that card has a “When … appears” ability, it triggers.' },
        { q: 'Siren', a: 'If it leaves the line face up, every other card in the line goes to the obstacle discard too, but only the Siren raises the alarm. Then a full new line is dealt.' },
        { q: 'Dormitory', a: 'While it’s face up, knocked-out cards stay in their positions during the slide and face-up cards slide past them.' },
        { q: 'Sniper', a: 'You can only interact with it when it’s the only face-up person in the line. Flammable Barrel and Clumsy Guard can’t knock it out either.' },
        { q: 'Hawk', a: 'While it’s face up, you can’t interact with cards that cost only Stealth {s}, not even with a Keycard. Costs of {a} are fine, and other obstacles’ abilities can still knock those cards out.' },
        { q: 'Watchtower', a: 'Cards in the positions next to it cost 2 more of their own resource.' },
        { q: 'Flammable Barrel', a: 'Whenever you interact with it (disarm or knock out), the cards next to it are knocked out. Being flipped by the Inspector doesn’t trigger it.' },
        { q: 'Clumsy Guard', a: 'Pay its cost (one interaction), then you may knock out a card next to it instead of disarming or knocking out the Clumsy Guard. If that card is the Flammable Barrel, the barrel triggers too.' },
      ],
    },
    {
      title: 'Your cards',
      items: [
        { q: 'Flashy Move', a: 'Counts the cards in your discard pile when you play it. Cards played this turn are in the play area, so they don’t count. Round down.' },
        { q: 'Misdirect', a: 'The cards you place in the play area give you {s2} each but no other effect. Misdirect doesn’t count itself.' },
        { q: 'Bin and Burn', a: 'Removed cards are gone for the rest of the campaign. Bin can’t remove itself.' },
        { q: 'Plan Ahead, Foresight and Just the Thing', a: 'If your deck is short when you look at its top cards, your discard pile is shuffled and put under it first. With Plan Ahead, the card you keep goes to your hand.' },
        { q: 'Swap', a: 'Your discard pile becomes your deck without shuffling, oldest card on top, and your old deck becomes your discard pile.' },
        { q: 'Bazooka and Optic Camouflage', a: 'After you use them they go to the obstacle discard, so they can show up in the line again.' },
        { q: 'Save Bullets', a: 'At the end of the turn you keep one unused card in your hand. It counts toward your next hand, so you draw one fewer.' },
      ],
    },
    {
      title: 'This app',
      items: [
        { q: 'Can I undo?', a: 'You can undo actions in the current turn until something reveals hidden information: drawing, shuffling, looking at your deck or a new obstacle entering the line.' },
        { q: 'Is my game saved?', a: 'Yes, after every action, in this browser. Use Export save in the menu to keep a backup file; some browsers delete stored data after a while.' },
      ],
    },
  ],
};
