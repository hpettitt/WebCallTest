# Handoff: Daily Telegram brief for Gilles (Bois de Chauff 95)

Written for a fresh local Claude session (aios-workspace) that has a terminal and can reach the VPS.
Contains no secrets. Never put the PrestaShop key or Telegram token in this file or in a repo.

## Goal
Build a daily brief, sent as a Telegram message each morning, for Gilles Lebossé (Bois de Chauff 95, firewood delivery, Île-de-France / Val-d'Oise area). Hugh Pettitt (Niu Paradigm) is building it as a free, documented case study (proposal dated July 2026, Drive file `proposition-gilles-niu-paradigm.pdf`).

Workflow: **develop and test on Hugh's computer, then port to the VPS `launch-lab.online`.** Hugh has the PrestaShop webservice key and access to the Google Sheet already.

## Data sources
1. **PrestaShop webservice (read-only, GET only).** Basic auth: key as username, empty password. Resources: orders, order_details, order_states, customers, products, stock_availables. Use `?output_format=JSON`.
2. **Google Sheet "Livraisons en Cours uniquement"**, ID `1sRSqjvcpw7s007wIbuE8vkbGp-9hfDp5NpCJ0NgkLck`. Read-only. Do not read the `RIB` tab (bank details).
   - Daily tabs named `DD/MM/YY` (e.g. `23/10/26`), plus `J1`–`J11`. Row 1 holds day totals; row 2 is the header; each row below is one delivery.
   - Columns: Cde (order no.), Date Liv., A payer, Nom, Adresse, Contact, Commentaire, Heure (07:00 / 10:00 / 12:00 slots), 33 (stères in 33 cm), 50 (stères in 50 cm), BDC Encaissé, Genti Encaissé, Ref SumUp, Montant.
   - Row 1 of a daily tab, example 23/10/26: 21 deliveries, 96 stères (41 in 33 cm + 55 in 50 cm), 7,850 € collected (3,485 BDC + 4,125 Genti + 240), 1,158 € paid online via SumUp. The 3 collected figures add up to the total.
   - Tab `W`: forward planner (stères per day split 33/50, deliveries per day, average stères per delivery, week-on-week comparison).
   - Cash and cheques collected live only in the sheet, not in PrestaShop.
3. Tabs not yet read: `Dette`, `Remboursements`, `Recl` (claims), `Copie de Retard`. They may hold more useful figures.

## Proposed brief contents (to confirm with Gilles)
1. Today's deliveries: count, stères split 33 cm / 50 cm, breakdown by time slot.
2. Next 5 working days: deliveries and stères per day (from `W`).
3. Cash to collect at delivery today (sum of "A payer").
4. New orders in the last 24 h: count and value (PrestaShop).
5. Exceptions: rescheduled or cancelled deliveries, two-cheque payments, refunds ("A Remboursé").

Leave out: price grid (`Comparatif`), distance/zone tabs, archive tabs.

**Privacy rule:** the brief must not show customer names, full addresses or phone numbers. Counts, towns and totals only.

## Open questions for Gilles (message drafted in French, Hugh is sending it)
- What do the numbers at the top of each daily tab mean (16 %, 1444, 8 136 €)?
- "BDC Encaissé" and "Genti Encaissé": two people collecting payment? What is the 240 € beside them?
- "Stock": logs on the pile, or only wood already committed to orders?
- Which figures does he actually use? Anything to add or remove?
- Delivery time of the brief, who else should receive it, is Telegram installed.

## Sheet issues spotted
- `CDE Moved` has a `#REF!` and a "-135.41 %" in its header row.
- Order 20714 appears twice in `L`.

## Telegram plan
- Test first with Hugh's own bot: create it with @BotFather (`/newbot`), keep the token in an environment variable `TELEGRAM_BOT_TOKEN`, send `/start` to the bot, read `chat_id` from `getUpdates`, test with `sendMessage`.
- No phone number from Gilles is needed. At go-live he opens the bot link and taps Start; read his `chat_id` from `getUpdates` and swap it into the config.
- Status: Hugh was about to create the test bot. Not yet confirmed.

## Environment notes
- This cloud session could not reach the VPS (no DNS or outbound SSH in the sandbox). Local sessions in aios-workspace should.
- VPS OS and installed runtimes: unknown. First step on the VPS: `uname -a; python3 --version; node --version`.
- Language preference (Python or Node): not yet chosen.

## Suggested next steps
1. Hugh creates the test bot and confirms a test message arrives.
2. Check the VPS (SSH, OS, runtimes, outbound HTTPS to api.telegram.org).
3. Write the brief script: read the Sheet and PrestaShop, format the message, send via the Bot API. All secrets from environment variables.
4. Run it from cron on the VPS each morning.
5. Update the figures once Gilles answers the open questions.
