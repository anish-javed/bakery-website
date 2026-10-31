# Connect your Google Sheet (simple steps)

You do **not** need to write any code. You only copy, paste and click.

When you finish, the website reads your menu from your Google Sheet. If you change a price in the sheet, the website shows the new price within a few minutes. Every order lands in your sheet too.

---

## Part 1: Make the sheet (about 5 minutes)

1. Go to **sheets.google.com** and sign in with the Google account you want to use for the bakery.
2. Click **Blank spreadsheet**.
3. Name it **Crumbs & Co.** (click "Untitled spreadsheet" at the top left).
4. Click **Extensions** in the menu, then **Apps Script**. A new page opens.
5. You will see some code that says `function myFunction()`. **Delete all of it.**
6. Open the file `google-apps-script.gs` from the `bakery-website` folder. Select everything (Ctrl + A) and copy it (Ctrl + C).
7. Go back to the Apps Script page and paste (Ctrl + V).
8. Click the **Save** button (the little disk).

## Part 2: Build the tabs

1. At the top of the Apps Script page there is a drop-down with a function name. Choose **setup**.
2. Click **Run**.
3. Google asks for permission. This is normal because the script needs to read your sheet and send you an email.
   - Click **Review permissions**.
   - Choose your account.
   - If you see "Google hasn't verified this app", click **Advanced**, then **Go to (your project name) (unsafe)**. It is your own script, so this is fine.
   - Click **Allow**.
4. Wait a few seconds. Go back to your sheet. You now have four tabs: **Products**, **Cake Options**, **Settings** and **Orders**, with about 100 sample products.

> Only run **setup** one time. If you run it again later it will not erase your products. It only fixes missing tabs and settings.

## Part 3: Put the sheet on the internet (the "web app")

1. In Apps Script, click **Deploy**, then **New deployment**.
2. Click the little gear next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description:** Crumbs website
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
4. Click **Deploy**.
5. Copy the **Web app URL**. It ends with `/exec`.

## Part 4: Tell the website about your sheet

1. Open the file `bakery-website/js/config.js` in any text editor (Notepad is fine).
2. Find this line:

   ```js
   SCRIPT_URL: "",
   ```
3. Paste your link between the quote marks:

   ```js
   SCRIPT_URL: "https://script.google.com/macros/s/XXXXXXXX/exec",
   ```
4. Save the file and open `index.html`. You should see your menu from the sheet.

Until you paste a link, the website shows a built-in **demo menu**, so you can look around first.

## Part 5: Test an order

1. Add something to the cart and place a test order.
2. You should see a thank-you page with an order number like **CC-1001**.
3. Open your sheet, then the **Orders** tab. Your order is there with Status **Received**.
4. Check your email. You get a message for every order. It goes to the Google account that owns the sheet.
5. Open **Track Order** on the website. Type the same phone number (the order number is optional). You should see your order, and the progress line moves by itself when you change the Status.

---

## Everyday jobs

### Add a new product
1. Open the **Products** tab.
2. Go to the first empty row at the bottom and fill in the columns:

| Column | What to type |
|---|---|
| **Name** | The product name. Keep every name different. |
| **Category** | Pick one from the drop-down. |
| **Price PKR** | Numbers only, like `850`. |
| **Unit** | For example `per lb`, `per piece`, `box of 6`, `per litre`. |
| **Description** | One short, tasty sentence. |
| **Photo URL** | Optional. See "Add a photo" below. |
| **Available** | `Yes` or `No`. |
| **Featured** | `Yes` puts it in "Today's specials". |
| **Delivery** | `Yes` = we can deliver it. `No` = "Pickup only". |
| **Popularity** | A number. Bigger numbers show first when sorted by "Most popular". |

New products at the bottom are also shown under **New arrivals**.

### Change a price
Click the price in the **Price PKR** column, type the new number and press Enter. Done. The website updates within about 5 minutes.

### Mark something as sold out today
Change **Available** to `No`. The website shows **Sold out today** and nobody can add it. Change it back to `Yes` tomorrow.

### Make something "Pickup only"
Change **Delivery** to `No`. If a customer has it in a delivery order, the cart warns them.

### Remove a product
Delete its row. (Or set **Available** to `No` if you will sell it again.)

### Change the discount
1. Open the **Settings** tab.
2. Find **Online Discount %**.
3. Change the number in the Value column. Type `0` to switch the discount off.

The website changes the words everywhere ("Order online, save 5% on your total bill") and the checkout takes it off the bill. The discount is taken off the TOTAL bill: the items plus the delivery fee.

### Change other settings
Everything in the **Settings** tab can be changed: phone number, WhatsApp number, delivery fee, opening hours, delivery areas, time slots, bank and JazzCash details, and more. The third column explains each one.

- **WhatsApp Number:** numbers only, with country code and no plus. For example `923001234567`.
- **Accepting Orders:** type `No` to stop orders for a while (for example during a holiday).

> Everything in the Settings tab is shown to visitors on the website. **Never** type passwords or private information there.

### Change cake sizes, flavours and frostings
Open the **Cake Options** tab.
- **Size** rows: the price is for the plain cake in that size. Write the pounds in the **Pounds** column.
- **Flavour** and **Frosting** rows: the price is an **extra** price **per pound**. Type `0` if it costs nothing extra.

For example: a 2 lb cake costs `3000`. With Red Velvet (extra `400` per lb) and Fondant (extra `600` per lb) it costs 3000 + (400 + 600) × 2 = **5000**.

To add a flavour, add a new row with Type **Flavour**.

### Add a photo
1. Upload your photo anywhere that gives a picture link, like Google Drive, Imgur or your own site.
2. If you use **Google Drive**: right-click the photo, choose **Share**, set it to **Anyone with the link**, and copy the link.
3. Paste the link into the **Photo URL** column for that product.

If a product has no photo, or the link does not work, the website shows a pretty drawing for its category instead.

### Look after orders
1. Open the **Orders** tab. New orders appear at the bottom.
2. Change the **Status** column with the drop-down: **Received**, **Baking**, **Out for delivery**, **Ready for pickup**, **Delivered**, **Collected** or **Cancelled**. (Use **Ready for pickup** and **Collected** for pickup orders.)
3. Customers see the new status on the **Track Order** page.

Please do **not** move or delete the columns in the Orders tab. If you do, the website may stop saving orders.

The order time is saved in two ways. **Order Time (Pakistan)** is easy to read. **Order Time (UTC ms)** is a number that is always correct, whatever time zone anyone is in.

### Payments: confirm and mark Paid
The last column of the **Orders** tab is **Payment Status**. It is filled in by itself:

| Payment Status | When |
|---|---|
| **Pay on delivery** | Delivery order, paying cash |
| **Pay at pickup** | Pickup order, paying cash |
| **Waiting for payment** | Bank transfer / JazzCash (Delivery or Pickup) |
| **Paid** | You set this yourself, after you see the money |

How to confirm a payment:
1. The email says "Check your JazzCash/Easypaisa/bank app for Rs ... from (name / phone)". The customer is **not** asked for a screenshot or a transaction number. The customer only taps **I've paid**, which sends you a WhatsApp message.
2. Open your own JazzCash, Easypaisa or bank app. Look for the money: the right amount, from that name or phone, ideally with the order number as the reason.
3. When you see it, open the **Orders** tab and change **Payment Status** to **Paid** with the drop-down.
4. The customer sees **Payment received ✓** on the Track Order page by itself (within about 30 seconds).

**The rule:** start baking prepaid orders only after **Paid**. Never hand over or send out a prepaid order that is still **Waiting for payment**. (This is true for Delivery and for Pickup.)

For cash orders, collect the money when the order arrives or is picked up. You can change the Payment Status to **Paid** after that if you like.

### Updating an older sheet (one time)
If you already had the Orders tab before this payment feature:
1. Paste the new `google-apps-script.gs` into Apps Script and save.
2. Choose the function **addPaymentColumn** and click **Run**. It adds the Payment Status column at the end and fills old orders (nothing else is changed).
3. **Deploy > Manage deployments**, click the pencil, choose **New version**, and click **Deploy**.
4. Your **Payment Note** in the Settings tab may still say "send the screenshot". Change it to: `After you pay, tap I've paid on the next screen. We confirm your payment before we start baking.`

---

## IMPORTANT: after you change the script

If you ever edit the script code, the website will not see the change until you make a **new version**:

1. Click **Deploy**, then **Manage deployments**.
2. Click the pencil (edit) icon.
3. Under **Version** choose **New version**.
4. Click **Deploy**.

The link stays the same. You do **not** need to change `config.js`.

(Changing products, prices and settings in the sheet does not need this. Only code changes do.)

---

## How your prices stay safe

- The website only sends the **names and quantities** of what a customer wants.
- Your script looks up every price again in **your sheet**, adds the delivery fee, and works out the discount. It ignores any price sent from the browser, so nobody can change a price by editing the web page.
- The order is checked for a real Pakistani phone number, a real date, a real time slot, sold-out items and pickup-only items.
- The **Track Order** page only ever shows the order number, the order date, the status and the payment state (never names, addresses, items, amounts or account details). It needs the phone number; the order number is optional. With only a phone number it lists that phone's orders from the last 30 days. After 5 wrong tries that phone number is locked for 15 minutes.
- A hidden field and a speed check catch spam robots.

## If something goes wrong

| Problem | What to do |
|---|---|
| The website says "Our oven is taking a short break" | Check that the link in `config.js` is correct and ends in `/exec`. Check that **Who has access** is **Anyone**. |
| My changes do not show | Wait 5 minutes (the website keeps a short memory), then refresh the page. |
| I get no order emails | Check your spam folder. Run **setup** again and click **Allow** if Google asks. Orders are still saved in the sheet. |
| Orders do not save | Make sure the Orders tab has not had its columns moved. Run **setup** again to repair headers. |
| A photo does not show | Make sure the link is open to **Anyone with the link**, then paste it again. |

This is a demo website for a made-up bakery. Phone numbers and bank details in the sample data are not real.

---

## Sample photos and updating the script

- Paste the newest **google-apps-script.gs** into Apps Script, then run **setup** once (it is safe: it keeps your data and adds the new Status choices) and run **addSamplePhotos** once. It fills the **Photo URL** column only where it is empty, so photos you added yourself are never changed.
- After pasting new code, always go to **Deploy > Manage deployments > pencil icon > Version: New version > Deploy**. Until you do this, the website keeps using the old script.
- Photos come from [Pexels](https://www.pexels.com).
