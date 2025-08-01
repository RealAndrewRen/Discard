# Discard

**Discard** is a Discord-powered game where users’ messages are analyzed using OpenAI’s ChatGPT and classified into personality-driven categories like **Controversial**, **Wholesome**, **Intellectual**, and more. Each message becomes a **card** with a power level, and cards battle based on strategic matchups between types with chaotic, hilarious, or oddly philosophical outcomes.

> “Milk before cereal.” — *Controversial card*
>
> “Actually, there’s a study on that…” — *Intellectual card*

---

## How It Works

1. A user sends a message and uses Discard's **Make Card** command.
2. ChatGPT analyzes it and assigns it a **category**:
   - `Controversial`
   - `Helpful`
   - `Intellectual`
   - `Humorous`
   - `Edgy`
   - `Random`
3. A **random power value** is assigned to the message.
4. Cards can be **dueled** against each other using /play, and their types affect the outcome via **bonuses** and **multipliers**.
5. The card with the higher adjusted score wins. In some cases, both lose (or both win).
6. Climb your server's leaderboard!

---

## Categories and Combat Bonuses

Each category comes with unique strengths and weaknesses when battling others. Here's the cheat sheet:

| **Type**        | **Bonuses Against**                                | **Penalties Against**                           |
|------------------|----------------------------------------------------|--------------------------------------------------|
| **Controversial** | ×1.5 vs Intellectual<br>+15 vs Wholesome         | ×0 vs Trolling<br>×0.5 vs Wholesome             |
| **Helpful**       | +2 vs Trolling<br>+1 vs Random                   | ×0 vs Edgy                                      |
| **Intellectual**  | +2 vs Random                                     | ×0.5 vs Trolling                                |
| **Humorous**      | ×2 vs Trolling<br>×1.5 vs Edgy                   | —                                               |
| **Edgy**          | +1 vs Controversial                              | ×0 vs Wholesome                                 |
| **Random**        | +1 vs Edgy                                       | —                                               |

---

## Example Duels

| Card 1         | Card 2         | Outcome                                                                 |
|----------------|----------------|-------------------------------------------------------------------------|
| Controversial  | Controversial  | Nobody wins. Eternal argument ensues.                                   |
| Controversial  | Intellectual   | Intellectual gets +25 for bringing FACTS and LOGIC.                     |
| Controversial  | Wholesome      | Higher value wins; Controversial gets +15 for tearing apart good vibes. |
| Intellectual   | Random         | Random gets ×1.5 for being gloriously unhinged.                         |
| Humorous       | Humorous       | Higher value wins; Comedy battle begins.                                |
| Wholesome      | Wholesome      | Both win; cookies are shared.                                           |

More full matchup logic is hardcoded and deeply chaotic, as it should be.

---

## Tech Stack

- **Node.js**
- **Discord.js**
- **OpenAI GPT-3.5 Turbo**

---

## Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/RealAndrewRen/Discard.git
   cd Discard
   
