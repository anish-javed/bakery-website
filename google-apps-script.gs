/**
 * Crumbs & Co. - Google Apps Script (the "brain" between the website and the Google Sheet)
 *
 * HOW TO USE (details are in SETUP-GOOGLE-SHEET.md):
 *   1. In your Google Sheet: Extensions > Apps Script. Paste this whole file.
 *   2. Run the function  setup  once. It builds all the tabs and fills sample products.
 *   3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *   4. Copy the web app link into js/config.js on the website.
 *
 * WHAT IT DOES
 *   doGet  : sends products, cake options and settings to the website (JSON),
 *            and answers "track order" questions (only status + order date).
 *   doPost : receives an order, RECALCULATES every price from the sheet
 *            (it never trusts prices from the browser), saves it in the Orders tab,
 *            emails the owner and sends back the order number.
 */

var TZ = 'Asia/Karachi'; // Pakistan time, used only for DISPLAY. Order times are stored as UTC milliseconds.

var TAB = { PRODUCTS: 'Products', OPTIONS: 'Cake Options', SETTINGS: 'Settings', ORDERS: 'Orders' };

var CATEGORIES = ['Cakes', 'Pastries & Patties', 'Pizzas & Sandwiches', 'Snacks', 'Breads & Rusks', 'Milk & Dairy', 'Juices & Drinks', 'Ice Cream', 'Cookies & Biscuits', 'Birthday Decor'];
var STATUSES = ['Received', 'Baking', 'Out for delivery', 'Ready for pickup', 'Delivered', 'Collected', 'Cancelled'];

var PRODUCT_HEADERS = ['Name', 'Category', 'Price PKR', 'Unit', 'Description', 'Photo URL', 'Available', 'Featured', 'Delivery', 'Popularity'];
var OPTION_HEADERS = ['Type', 'Name', 'Price PKR', 'Pounds', 'What the price means'];
var SETTING_HEADERS = ['Setting', 'Value', 'What it does'];
var ORDER_HEADERS = ['Order No', 'Status', 'Order Time (Pakistan)', 'Customer Name', 'Phone', 'Method', 'Area', 'Address', 'Needed On', 'Time Slot', 'Payment', 'Items', 'Subtotal PKR', 'Delivery Fee PKR', 'Discount PKR', 'Total PKR', 'Notes', 'Order Time (UTC ms)'];
// Column positions in the Orders tab (0 = first column). Please do not move these columns.
var OC = { NO: 0, STATUS: 1, TIME: 2, NAME: 3, PHONE: 4, METHOD: 5, AREA: 6, ADDRESS: 7, DATE: 8, SLOT: 9, PAYMENT: 10, ITEMS: 11, SUB: 12, FEE: 13, DISC: 14, TOTAL: 15, NOTES: 16, MS: 17 };

var BANK = 'Bank transfer / JazzCash';

var SETTING_ROWS = [
  ['Bakery Name', 'Crumbs & Co.', 'Shown on the website and in WhatsApp messages.'],
  ['Phone', '0300 0000000', 'Shown on the website. People can tap it to call.'],
  ['WhatsApp Number', '923000000000', 'Numbers only, with country code, no plus sign. Example: 923001234567'],
  ['Address', 'Main Boulevard, Gulberg III, Lahore', 'Shown on the website and as the pickup address.'],
  ['Opening Hours', 'Mon to Thu: 9 am - 11 pm; Fri to Sun: 9 am - 12 midnight', 'Put a semicolon (;) between lines.'],
  ['Delivery Fee', '250', 'In rupees. Only charged on delivery orders.'],
  ['Online Discount %', '5', 'Taken off the TOTAL bill (items + delivery fee) for orders placed on the website. Type 0 to switch it off.'],
  ['Cake Notice Days', '2', 'How many days ahead a custom cake must be ordered.'],
  ['Accepting Orders', 'Yes', 'Type No to stop taking orders for a while (for example during Eid rush).'],
  ['Cash On Delivery', 'Yes', 'Yes = people can pay cash. No = only bank transfer / JazzCash.'],
  ['Delivery Areas', 'Gulberg, DHA, Johar Town, Model Town, Cantt, Bahria Town, Faisal Town, Wapda Town, Garden Town, Iqbal Town, Samanabad, Township', 'Areas in the checkout list. Put a comma between areas.'],
  ['Time Slots', '10:00 am - 12:00 pm, 12:00 pm - 2:00 pm, 2:00 pm - 4:00 pm, 4:00 pm - 6:00 pm, 6:00 pm - 8:00 pm, 8:00 pm - 10:00 pm', 'Delivery and pickup times. Put a comma between slots. Write am or pm. Customers can also choose "Any time".'],
  ['Bank Name', 'Demo Bank Ltd', 'Shown at checkout when someone pays by bank transfer.'],
  ['Account Title', 'Crumbs and Co.', ''],
  ['Account Number', '0000-0000000000', ''],
  ['IBAN', 'PK00 DEMO 0000 0000 0000 0000', ''],
  ['JazzCash Number', '0300 0000000', ''],
  ['JazzCash Title', 'Crumbs and Co.', ''],
  ['Payment Note', 'After you pay, send the screenshot on WhatsApp. We confirm your payment before we start baking.', 'Shown under the account details at checkout.']
];

var OPTION_ROWS = [
  ['Size', '1 lb', 1600, 1, 'Price of the plain cake in this size.'],
  ['Size', '2 lb', 3000, 2, ''],
  ['Size', '3 lb', 4400, 3, ''],
  ['Size', '4 lb', 5800, 4, ''],
  ['Flavour', 'Vanilla', 0, '', 'Extra price PER POUND on top of the size price.'],
  ['Flavour', 'Chocolate', 200, '', ''],
  ['Flavour', 'Red Velvet', 400, '', ''],
  ['Flavour', 'Strawberry', 200, '', ''],
  ['Flavour', 'Pineapple', 100, '', ''],
  ['Flavour', 'Butterscotch', 200, '', ''],
  ['Flavour', 'Black Forest', 300, '', ''],
  ['Flavour', 'Coffee Walnut', 300, '', ''],
  ['Flavour', 'Lotus Biscoff', 600, '', ''],
  ['Frosting', 'Fresh Cream', 0, '', 'Extra price PER POUND on top of the size price.'],
  ['Frosting', 'Buttercream', 150, '', ''],
  ['Frosting', 'Whipped Cream with Fruit', 250, '', ''],
  ['Frosting', 'Chocolate Ganache', 300, '', ''],
  ['Frosting', 'Cream Cheese', 350, '', ''],
  ['Frosting', 'Fondant', 600, '', '']
];

// name | category | price | unit | description | available | featured | delivery | popularity
var PRODUCT_DATA = `
Chocolate Fudge Cake|Cakes|1800|per lb|Moist chocolate sponge layered with silky fudge ganache.|Yes|No|Yes|92
Black Forest Cake|Cakes|1600|per lb|Cherry, whipped cream and dark chocolate shavings. A Lahore classic.|Yes|No|Yes|88
Red Velvet Cake|Cakes|2000|per lb|Velvety red sponge with tangy cream cheese frosting.|Yes|Yes|Yes|85
Pineapple Fresh Cream Cake|Cakes|1500|per lb|Light vanilla sponge, juicy pineapple and fresh cream.|Yes|No|Yes|70
Vanilla Butterscotch Cake|Cakes|1600|per lb|Vanilla sponge with butterscotch cream and crunchy praline.|Yes|No|Yes|66
Chocolate Truffle Cake|Cakes|2100|per lb|Our signature. Three layers of chocolate, one big smile.|Yes|Yes|Yes|98
Mango Mousse Cake|Cakes|2200|per lb|Silky mango mousse on a soft sponge. Made when mangoes are sweet.|No|No|Yes|60
Coffee Walnut Cake|Cakes|1900|per lb|Coffee sponge, walnut crunch and mocha buttercream.|Yes|No|Yes|45
Lotus Biscoff Cake|Cakes|2600|per lb|Caramel biscuit cream, crushed Biscoff and a golden drizzle.|Yes|Yes|Yes|90
Plain Dry Cake|Cakes|900|per lb|Buttery tea-time cake. Perfect with chai.|Yes|No|Yes|50
Chicken Patty|Pastries & Patties|150|per piece|Flaky pastry filled with spiced chicken. Baked fresh every hour.|Yes|Yes|Yes|95
Chicken Cheese Patty|Pastries & Patties|180|per piece|Our chicken patty with a gooey cheese centre.|Yes|No|Yes|80
Beef Patty|Pastries & Patties|170|per piece|Juicy seasoned beef in golden puff pastry.|Yes|No|Yes|62
Aloo Patty|Pastries & Patties|100|per piece|Crisp pastry with a spicy potato filling.|Yes|No|Yes|55
Vegetable Puff|Pastries & Patties|110|per piece|Buttery puff with garden vegetables.|Yes|No|Yes|40
Chicken Roll|Pastries & Patties|160|per piece|Soft roll with creamy chicken filling.|Yes|No|Yes|58
Chocolate Pastry|Pastries & Patties|220|per piece|A rich chocolate sponge slice with glossy ganache.|Yes|No|Yes|75
Fresh Cream Pastry|Pastries & Patties|200|per piece|Light sponge, fresh cream and a cherry on top.|Yes|No|Yes|68
Almond Croissant|Pastries & Patties|350|per piece|Buttery croissant filled with almond cream and toasted flakes.|Yes|Yes|Yes|72
Cinnamon Roll|Pastries & Patties|300|per piece|Warm swirl of cinnamon sugar with vanilla glaze.|Yes|No|Yes|64
Chicken Tikka Pizza|Pizzas & Sandwiches|950|small 8 inch|Smoky tikka chicken, onions and mozzarella on a hand-stretched base.|Yes|Yes|Yes|94
Fajita Pizza|Pizzas & Sandwiches|1400|medium 10 inch|Fajita chicken, capsicum and olives. Always a favourite.|Yes|No|Yes|89
Pepperoni Feast Pizza|Pizzas & Sandwiches|1900|large 12 inch|Loaded with beef pepperoni and stretchy cheese.|Yes|No|Yes|70
Cheese Lovers Pizza|Pizzas & Sandwiches|1300|medium 10 inch|Three cheeses, nothing else. Pure comfort.|Yes|No|Yes|60
BBQ Chicken Pizza|Pizzas & Sandwiches|1850|large 12 inch|Sweet BBQ sauce, grilled chicken and red onion.|Yes|No|Yes|74
Club Sandwich|Pizzas & Sandwiches|650|per piece|Triple-decker with chicken, egg, cheese and fresh veggies.|Yes|No|Yes|78
Chicken Mayo Sandwich|Pizzas & Sandwiches|400|per piece|Soft bread, shredded chicken and creamy mayo.|Yes|No|Yes|65
Grilled Chicken Sub|Pizzas & Sandwiches|550|per piece|Grilled chicken, lettuce and garlic sauce in a toasted sub.|Yes|No|Yes|52
Veggie Garden Sandwich|Pizzas & Sandwiches|350|per piece|Cucumber, tomato, cheese and green chutney.|Yes|No|Yes|35
Zinger Burger|Pizzas & Sandwiches|550|per piece|Crunchy zinger fillet, spicy mayo and a toasted bun.|Yes|No|Yes|82
Chicken Samosa|Snacks|480|box of 6|Crispy samosas with spiced chicken. Best with chutney.|Yes|Yes|Yes|91
Vegetable Samosa|Snacks|360|box of 6|Classic potato and pea samosas, golden and crunchy.|Yes|No|Yes|60
Chicken Spring Rolls|Snacks|540|box of 6|Crispy rolls with chicken and vegetables.|Yes|No|Yes|63
Chicken Nuggets|Snacks|650|box of 8|Crunchy outside, juicy inside. Served with dip.|Yes|No|Yes|77
Masala Fries|Snacks|280|per portion|Hot fries tossed with our chatpata masala.|Yes|No|Yes|73
Bun Kabab|Snacks|290|per piece|Street-style kabab in a soft bun with chutney.|Yes|No|Yes|57
Cheese Straws|Snacks|320|box of 10|Flaky, cheesy and perfect for sharing.|Yes|No|Yes|38
Pizza Pockets|Snacks|600|box of 4|Little parcels of pizza filling in golden dough.|Yes|No|Yes|48
Mixed Pakora Box|Snacks|450|per box|Crisp onion, potato and spinach pakoras.|Yes|No|Yes|44
Nimko Mix|Snacks|250|per 250 g|Crunchy, salty and spicy tea-time mix.|Yes|No|Yes|30
Milk Bread|Breads & Rusks|220|per loaf|Soft, fluffy, baked fresh every morning.|Yes|Yes|Yes|93
Brown Bread|Breads & Rusks|240|per loaf|Whole wheat and a little honey.|Yes|No|Yes|67
Multigrain Loaf|Breads & Rusks|320|per loaf|Seeds, oats and grains in every slice.|Yes|No|Yes|42
Sourdough Loaf|Breads & Rusks|650|per loaf|Slow-fermented, crackly crust and a tangy crumb.|Yes|No|Yes|46
Garlic Bread|Breads & Rusks|350|per piece|Toasted baguette with garlic butter and herbs.|Yes|No|Yes|61
Burger Buns|Breads & Rusks|240|pack of 6|Soft sesame buns, ready for your grill.|Yes|No|Yes|50
Dinner Rolls|Breads & Rusks|260|pack of 6|Warm and buttery little rolls.|Yes|No|Yes|47
Pita Bread|Breads & Rusks|200|pack of 5|Pillowy pockets for wraps and dips.|Yes|No|Yes|34
Cake Rusk|Breads & Rusks|380|per pack|Crunchy, lightly sweet rusk. Dunk it in chai.|Yes|No|Yes|85
Suji Rusk|Breads & Rusks|300|per pack|Golden semolina rusk with a gentle crunch.|Yes|No|Yes|40
Fresh Milk|Milk & Dairy|250|per litre|Farm-fresh full cream milk, delivered chilled.|Yes|No|Yes|86
Chocolate Milk|Milk & Dairy|120|per 250 ml|Cold chocolate milk the kids ask for.|Yes|No|Yes|55
Strawberry Milk|Milk & Dairy|120|per 250 ml|Pink, sweet and creamy.|Yes|No|Yes|41
Dahi (Yogurt)|Milk & Dairy|190|per 500 g|Thick, set fresh every morning.|Yes|No|Yes|72
Sweet Lassi|Milk & Dairy|160|per glass|Cool and creamy, topped with malai.|Yes|No|Yes|64
Salted Butter|Milk & Dairy|480|per 200 g|Rich, golden and churned in small batches.|Yes|No|Yes|45
Fresh Malai|Milk & Dairy|420|per 250 g|Thick cream for desserts and breakfast.|Yes|No|Yes|39
Paneer|Milk & Dairy|560|per 250 g|Soft, fresh cottage cheese.|Yes|No|Yes|33
Cheese Slices|Milk & Dairy|520|pack of 10|Melty slices for sandwiches and burgers.|Yes|No|Yes|36
Mozzarella Cheese|Milk & Dairy|700|per 200 g|Stretchy shredded cheese for pizza night.|Yes|No|Yes|43
Fresh Orange Juice|Juices & Drinks|350|per glass|Squeezed when you order. No sugar added.|Yes|Yes|Yes|79
Mango Shake|Juices & Drinks|380|per glass|Thick shake of ripe Sindhri mangoes.|Yes|No|Yes|84
Strawberry Shake|Juices & Drinks|400|per glass|Fresh berries, milk and a scoop of ice cream.|Yes|No|Yes|66
Oreo Shake|Juices & Drinks|450|per glass|Cookies and cream, blended thick.|Yes|No|Yes|81
Cold Coffee|Juices & Drinks|420|per glass|Iced coffee with a creamy chocolate swirl.|Yes|No|Yes|76
Mint Margarita|Juices & Drinks|280|per glass|Fresh mint, lemon and ice. Cool as a breeze.|Yes|No|Yes|70
Fresh Lemonade|Juices & Drinks|220|per glass|Sweet and sharp, just like it should be.|Yes|No|Yes|58
Mixed Fruit Juice|Juices & Drinks|520|per litre|Apple, orange and guava with no added colours.|Yes|No|Yes|48
Hot Chocolate|Juices & Drinks|380|per cup|Thick, dark and topped with marshmallows.|Yes|No|Yes|56
Cola Can|Juices & Drinks|140|per can (345 ml)|Ice cold fizz.|Yes|No|Yes|60
Vanilla Ice Cream|Ice Cream|950|per litre|Creamy classic made with real vanilla.|Yes|No|Yes|78
Chocolate Ice Cream|Ice Cream|1000|per litre|Deep dark chocolate with a fudge ripple.|Yes|Yes|Yes|83
Strawberry Ice Cream|Ice Cream|1000|per litre|Made with real strawberries.|Yes|No|Yes|59
Mango Kulfi|Ice Cream|150|per piece|Traditional kulfi on a stick.|Yes|No|Yes|67
Pistachio Kulfi|Ice Cream|220|per piece|Rich, nutty and traditional.|Yes|No|Yes|52
Choc Chip Cone|Ice Cream|200|per piece|Crunchy cone, vanilla scoop and chocolate chips.|Yes|No|Yes|49
Brownie Sundae|Ice Cream|550|per cup|Warm brownie, vanilla ice cream and hot fudge.|Yes|No|Yes|74
Falooda Ice Cream|Ice Cream|480|per glass|Rose syrup, vermicelli, basil seeds and kulfi.|Yes|No|Yes|63
Ice Cream Sandwich|Ice Cream|280|per piece|Two soft cookies and a thick vanilla middle.|No|No|Yes|37
Ice Cream Cake|Ice Cream|2200|per 2 litre|A layered ice cream cake for big celebrations. Pickup only.|Yes|No|No|54
Chocolate Chip Cookies|Cookies & Biscuits|650|box of 6|Big, soft and chewy. Loaded with chocolate.|Yes|Yes|Yes|88
Oatmeal Raisin Cookies|Cookies & Biscuits|600|box of 6|Chewy oats, plump raisins and a hint of cinnamon.|Yes|No|Yes|43
Peanut Butter Cookies|Cookies & Biscuits|640|box of 6|Nutty, crumbly and just sweet enough.|Yes|No|Yes|46
Naan Khatai|Cookies & Biscuits|650|per 500 g|Melt-in-your-mouth ghee biscuits with cardamom.|Yes|No|Yes|80
Zeera Biscuits|Cookies & Biscuits|450|per 500 g|Salty-sweet cumin biscuits for chai time.|Yes|No|Yes|53
Coconut Biscuits|Cookies & Biscuits|520|per 500 g|Crisp and fragrant with desiccated coconut.|Yes|No|Yes|51
Almond Biscotti|Cookies & Biscuits|700|box of 8|Twice-baked and super crunchy.|Yes|No|Yes|32
Butter Shortbread|Cookies & Biscuits|560|box of 8|Pure butter. Tender. Simple.|Yes|No|Yes|35
Double Chocolate Brownie|Cookies & Biscuits|260|per piece|Fudgy centre, crackly top.|Yes|Yes|Yes|87
Macarons|Cookies & Biscuits|1500|box of 6|Delicate French macarons in assorted flavours.|Yes|No|Yes|56
Birthday Candles|Birthday Decor|150|pack of 24|Colourful candles with holders.|Yes|No|Yes|84
Golden Number Candle|Birthday Decor|200|per piece|Shiny gold digit candle. Tell us the number in the notes.|Yes|No|Yes|69
Sparkler Candles|Birthday Decor|250|pack of 6|Fizzing fountain candles for the big moment.|Yes|No|Yes|61
Happy Birthday Topper|Birthday Decor|350|per piece|Glittery gold cake topper.|Yes|No|Yes|57
Balloon Bouquet|Birthday Decor|800|10 balloons|Ten latex balloons in party colours.|Yes|Yes|Yes|65
Birthday Banner|Birthday Decor|450|per piece|Hang it up and let the party begin.|Yes|No|Yes|42
Party Hats|Birthday Decor|300|set of 6|Cone hats with tassels.|Yes|No|Yes|38
Party Poppers|Birthday Decor|400|pack of 6|Confetti poppers. Please aim up.|Yes|No|Yes|31
Cake Knife and Server|Birthday Decor|300|set of 2|Plastic knife and server for neat slices.|Yes|No|Yes|44
Gift Box with Ribbon|Birthday Decor|250|per piece|A pretty box and ribbon for your gift.|Yes|No|Yes|29
`;

// Sample photos from Pexels: product name | Pexels photo ID
var PHOTO_DATA = `
Chocolate Fudge Cake|12118046
Black Forest Cake|8802102
Red Velvet Cake|38774006
Pineapple Fresh Cream Cake|13963474
Vanilla Butterscotch Cake|4161223
Chocolate Truffle Cake|34802628
Mango Mousse Cake|15730548
Coffee Walnut Cake|3734026
Lotus Biscoff Cake|19164207
Plain Dry Cake|36590626
Chicken Patty|17104937
Chicken Cheese Patty|34463146
Beef Patty|37297542
Aloo Patty|5881017
Vegetable Puff|27304312
Chicken Roll|31357500
Chocolate Pastry|11333387
Fresh Cream Pastry|16402066
Almond Croissant|37970772
Cinnamon Roll|5662362
Chicken Tikka Pizza|5639547
Fajita Pizza|29173102
Pepperoni Feast Pizza|31587831
Cheese Lovers Pizza|36178132
BBQ Chicken Pizza|33458051
Club Sandwich|15362507
Chicken Mayo Sandwich|12469931
Grilled Chicken Sub|34593399
Veggie Garden Sandwich|39528128
Zinger Burger|8769141
Chicken Samosa|29037272
Vegetable Samosa|9027521
Chicken Spring Rolls|35407775
Chicken Nuggets|11710530
Masala Fries|29150162
Bun Kabab|4080532
Cheese Straws|31388412
Pizza Pockets|13457628
Mixed Pakora Box|29547418
Nimko Mix|17480807
Milk Bread|8811604
Brown Bread|12284683
Multigrain Loaf|30767682
Sourdough Loaf|8633662
Garlic Bread|37043987
Burger Buns|37229322
Dinner Rolls|32695358
Pita Bread|6419742
Cake Rusk|19993438
Suji Rusk|37439225
Fresh Milk|4578396
Chocolate Milk|4035107
Strawberry Milk|8284685
Dahi (Yogurt)|6823328
Sweet Lassi|18142603
Salted Butter|7966354
Fresh Malai|4686826
Paneer|29631468
Cheese Slices|16015736
Mozzarella Cheese|6605173
Fresh Orange Juice|14510445
Mango Shake|5817621
Strawberry Shake|9450011
Oreo Shake|17429505
Cold Coffee|4869290
Mint Margarita|39536485
Fresh Lemonade|7360957
Mixed Fruit Juice|31822992
Hot Chocolate|35210027
Cola Can|8879622
Chocolate Chip Cookies|40292914
Oatmeal Raisin Cookies|10688029
Peanut Butter Cookies|11325078
Naan Khatai|3370702
Zeera Biscuits|14757523
Coconut Biscuits|30984652
Almond Biscotti|8621806
Butter Shortbread|797761
Double Chocolate Brownie|15106329
Macarons|38876021
Vanilla Ice Cream|16962446
Chocolate Ice Cream|5061214
Strawberry Ice Cream|7518550
Mango Kulfi|12295184
Pistachio Kulfi|11409329
Choc Chip Cone|38987559
Brownie Sundae|36032863
Falooda Ice Cream|18646641
Ice Cream Sandwich|6431575
Ice Cream Cake|31756481
Birthday Candles|11308365
Golden Number Candle|7826349
Sparkler Candles|13640960
Happy Birthday Topper|32397324
Balloon Bouquet|574282
Birthday Banner|7099956
Party Hats|7180255
Party Poppers|8516711
Cake Knife and Server|8791082
Gift Box with Ribbon|13975271
`;

function photoUrl_(id) { return 'https://images.pexels.com/photos/' + id + '/pexels-photo-' + id + '.jpeg?auto=compress&cs=tinysrgb&w=600'; }

// Sample photo link for a product name, or '' when we have none.
var photoMap_ = null;
function photoFor_(name) {
  if (!photoMap_) {
    photoMap_ = {};
    PHOTO_DATA.trim().split('\n').forEach(function (line) {
      var f = line.split('|');
      if (f.length === 2) photoMap_[norm_(f[0])] = f[1].trim();
    });
  }
  var id = photoMap_[norm_(name)];
  return id ? photoUrl_(id) : '';
}

/* ======================================================================
   SETUP  (run this once, from the Apps Script editor)
   ====================================================================== */

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('Crumbs & Co.').addItem('Set up / repair the sheet tabs', 'setup').addToUi();
  } catch (e) { /* not opened from a sheet */ }
}

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupProducts_(ss);
  setupOptions_(ss);
  setupSettings_(ss);
  setupOrders_(ss);

  // remove the empty default tab
  ss.getSheets().forEach(function (sh) {
    if (/^(Sheet1|Sheet 1)$/i.test(sh.getName()) && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
  ss.setActiveSheet(ss.getSheetByName(TAB.PRODUCTS));
  CacheService.getScriptCache().remove('all_v1');
  try {
    SpreadsheetApp.getUi().alert('Done! Your tabs are ready: Products, Cake Options, Settings and Orders.\n\nNext step: Deploy > New deployment > Web app.');
  } catch (e) { /* ignore */ }
}

/**
 * Run this ONCE from the Apps Script editor to add the sample Pexels photos.
 * It fills the Photo URL column ONLY where it is empty. Photos you added yourself are never changed.
 */
function addSamplePhotos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TAB.PRODUCTS);
  var msg;
  if (!sh || sh.getLastRow() < 2) {
    msg = 'The Products tab is empty. Please run setup first.';
  } else {
    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var nameCol = head.indexOf('name'), photoCol = head.indexOf('photo url');
    if (nameCol < 0 || photoCol < 0) {
      msg = 'Could not find the Name and Photo URL columns in the Products tab.';
    } else {
      var rows = sh.getLastRow() - 1;
      var names = sh.getRange(2, nameCol + 1, rows, 1).getValues();
      var photoRange = sh.getRange(2, photoCol + 1, rows, 1);
      var photos = photoRange.getValues();
      var filled = 0;
      for (var i = 0; i < rows; i++) {
        if (String(photos[i][0]).trim() !== '') continue; // already has a photo: leave it alone
        var url = photoFor_(names[i][0]);
        if (url) { photos[i][0] = url; filled++; }
      }
      if (filled) photoRange.setNumberFormat('@').setValues(photos);
      CacheService.getScriptCache().remove('all_v1'); // so the website sees the photos straight away
      msg = 'Done! Added ' + filled + ' photo' + (filled === 1 ? '' : 's') + '. Products that already had a photo were not changed.';
    }
  }
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { console.log(msg); }
}

function getOrCreate_(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }

function ensureRows_(sh, rows) {
  if (sh.getMaxRows() < rows) sh.insertRowsAfter(sh.getMaxRows(), rows - sh.getMaxRows());
}

function writeHeaders_(sh, headers) {
  var r = sh.getRange(1, 1, 1, headers.length);
  r.setValues([headers]).setFontWeight('bold').setFontColor('#fff6e9').setBackground('#4a2c1d').setVerticalAlignment('middle');
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 34);
}

function listRule_(values, allowInvalid) {
  return SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(!!allowInvalid).build();
}

function setupProducts_(ss) {
  var sh = getOrCreate_(ss, TAB.PRODUCTS);
  var fresh = sh.getLastRow() < 2;
  writeHeaders_(sh, PRODUCT_HEADERS);
  if (fresh) {
    var rows = PRODUCT_DATA.trim().split('\n').map(function (line) {
      var f = line.split('|');
      return [f[0], f[1], Number(f[2]), f[3], f[4], photoFor_(f[0]), f[5], f[6], f[7], Number(f[8])];
    });
    sh.getRange(2, 1, rows.length, PRODUCT_HEADERS.length).setValues(rows);
  }
  ensureRows_(sh, 1001);
  sh.getRange(2, 2, 1000, 1).setDataValidation(listRule_(CATEGORIES, true)); // new categories are allowed
  sh.getRange(2, 3, 1000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).setHelpText('Type the price in rupees, numbers only.').build());
  sh.getRange(2, 7, 1000, 3).setDataValidation(listRule_(['Yes', 'No'], false));
  sh.getRange(2, 10, 1000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).setHelpText('A number. Bigger = shown higher when sorted by popular.').build());
  sh.getRange(2, 6, 1000, 1).setNumberFormat('@'); // photo links stay plain text
  var widths = [200, 170, 90, 110, 380, 260, 80, 80, 80, 90];
  widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.getRange(2, 5, 1000, 1).setWrap(true);
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$G2="No"').setBackground('#f9d6d0').setRanges([sh.getRange('A2:J1001')]).build()
  ]);
}

function setupOptions_(ss) {
  var sh = getOrCreate_(ss, TAB.OPTIONS);
  var fresh = sh.getLastRow() < 2;
  writeHeaders_(sh, OPTION_HEADERS);
  if (fresh) sh.getRange(2, 1, OPTION_ROWS.length, OPTION_HEADERS.length).setValues(OPTION_ROWS);
  ensureRows_(sh, 201);
  sh.getRange(2, 1, 200, 1).setDataValidation(listRule_(['Size', 'Flavour', 'Frosting'], false));
  sh.getRange(2, 3, 200, 2).setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build());
  [110, 220, 100, 80, 420].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
}

function setupSettings_(ss) {
  var sh = getOrCreate_(ss, TAB.SETTINGS);
  writeHeaders_(sh, SETTING_HEADERS);
  sh.getRange(2, 2, 200, 1).setNumberFormat('@'); // keep phone numbers like 0300... as typed
  var existing = {};
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) { existing[norm_(r[0])] = true; });
  var add = SETTING_ROWS.filter(function (r) { return !existing[norm_(r[0])]; });
  if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 3).setValues(add); // only adds settings that are missing
  [190, 360, 460].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.getRange(2, 2, 200, 2).setWrap(true);
  var yes = ['Accepting Orders', 'Cash On Delivery'];
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (yes.indexOf(String(vals[i][0]).trim()) > -1) sh.getRange(i + 2, 2).setDataValidation(listRule_(['Yes', 'No'], false));
}

function setupOrders_(ss) {
  var sh = getOrCreate_(ss, TAB.ORDERS);
  writeHeaders_(sh, ORDER_HEADERS);
  ensureRows_(sh, 5001);
  var textCols = [OC.NO, OC.STATUS, OC.TIME, OC.NAME, OC.PHONE, OC.METHOD, OC.AREA, OC.ADDRESS, OC.DATE, OC.SLOT, OC.PAYMENT, OC.ITEMS, OC.NOTES];
  textCols.forEach(function (c) { sh.getRange(2, c + 1, 5000, 1).setNumberFormat('@'); });
  [OC.SUB, OC.FEE, OC.DISC, OC.TOTAL].forEach(function (c) { sh.getRange(2, c + 1, 5000, 1).setNumberFormat('#,##0'); });
  sh.getRange(2, OC.MS + 1, 5000, 1).setNumberFormat('0');
  sh.getRange(2, OC.STATUS + 1, 5000, 1).setDataValidation(listRule_(STATUSES, false)); // the Status dropdown
  var widths = [90, 130, 160, 150, 120, 80, 120, 240, 100, 170, 160, 360, 100, 100, 100, 100, 220, 140];
  widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  var rng = sh.getRange('B2:B5001');
  function rule(text, bg) { return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(text).setBackground(bg).setRanges([rng]).build(); }
  sh.setConditionalFormatRules([rule('Received', '#fff0cf'), rule('Baking', '#fde3c4'), rule('Out for delivery', '#dbeafe'), rule('Ready for pickup', '#dbeafe'), rule('Delivered', '#d9f0dc'), rule('Collected', '#d9f0dc'), rule('Cancelled', '#f9d6d0')]);
  sh.getRange(1, OC.MS + 1).setNote('Time the order arrived, in UTC milliseconds. This is the true time (it never changes with time zones). The Pakistan time next to it is for reading.');
}

/* ======================================================================
   SMALL HELPERS
   ====================================================================== */

function norm_(k) { return String(k == null ? '' : k).toLowerCase().replace(/[^a-z0-9]/g, ''); }
function yes_(v) { return ['yes', 'y', 'true', '1'].indexOf(String(v).trim().toLowerCase()) > -1; }
function num_(v, d) { var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? d : n; }
function digits_(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function safeText_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^[=+\-@]+/, '').slice(0, max);
}
function money_(n) { return 'Rs ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function todayPK_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function addDays_(ymd, n) {
  var p = ymd.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  d.setUTCDate(d.getUTCDate() + n);
  return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd');
}
function validDate_(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  var p = s.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  return d.getUTCFullYear() === +p[0] && d.getUTCMonth() === +p[1] - 1 && d.getUTCDate() === +p[2];
}

// Reads a tab into a list of objects. Keys are the column headings in lower case.
function readTable_(sh) {
  if (!sh) return [];
  var last = sh.getLastRow(), cols = sh.getLastColumn();
  if (last < 2 || cols < 1) return [];
  var vals = sh.getRange(1, 1, last, cols).getValues();
  var head = vals[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var out = [];
  for (var i = 1; i < vals.length; i++) {
    var o = {};
    for (var j = 0; j < head.length; j++) if (head[j]) o[head[j]] = vals[i][j];
    out.push(o);
  }
  return out;
}

/* ======================================================================
   READING THE SHEET
   ====================================================================== */

function getProducts_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var out = [];
  readTable_(ss.getSheetByName(TAB.PRODUCTS)).forEach(function (r, i) {
    var name = String(r['name'] || '').trim();
    if (!name) return;
    out.push({
      name: name,
      category: String(r['category'] || 'Other').trim(),
      price: Math.max(0, num_(r['price pkr'], 0)),
      unit: String(r['unit'] || '').trim(),
      description: String(r['description'] || '').trim(),
      photo: String(r['photo url'] || '').trim(),
      available: yes_(r['available']),
      featured: yes_(r['featured']),
      delivery: (r['delivery'] === undefined || String(r['delivery']).trim() === '') ? true : yes_(r['delivery']),
      popularity: num_(r['popularity'], 0),
      order: i // later rows count as newer
    });
  });
  return out;
}

function getOptions_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var o = { sizes: [], flavours: [], frostings: [] };
  readTable_(ss.getSheetByName(TAB.OPTIONS)).forEach(function (r) {
    var type = String(r['type'] || '').trim().toLowerCase(), name = String(r['name'] || '').trim();
    if (!name) return;
    var price = Math.max(0, num_(r['price pkr'], 0));
    if (type === 'size') {
      var lb = num_(r['pounds'], NaN);
      if (isNaN(lb)) lb = num_(name, 1);
      o.sizes.push({ name: name, price: price, pounds: Math.max(0.5, lb) });
    } else if (type === 'flavour' || type === 'flavor') o.flavours.push({ name: name, extra: price });
    else if (type === 'frosting') o.frostings.push({ name: name, extra: price });
  });
  return o;
}

// The settings exactly as typed in the sheet: { "Delivery Fee": "250", ... }
function getSettingsRaw_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB.SETTINGS), out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
    var k = String(r[0]).trim();
    if (k) out[k] = r[1];
  });
  return out;
}

// Settings with simple names, used by the order code.
function getSettings_() {
  var m = {};
  var raw = getSettingsRaw_();
  Object.keys(raw).forEach(function (k) { m[norm_(k)] = raw[k]; });
  function s(k, d) { var v = m[k]; return v === undefined || String(v).trim() === '' ? d : String(v).trim(); }
  return {
    fee: Math.max(0, num_(s('deliveryfee', '250'), 250)),
    discountPct: Math.min(100, Math.max(0, num_(s('onlinediscount', '5'), 5))),
    noticeDays: Math.max(0, num_(s('cakenoticedays', '2'), 2)),
    accepting: yes_(s('acceptingorders', 'Yes')),
    cod: yes_(s('cashondelivery', 'Yes')),
    slots: s('timeslots', '').split(',').map(function (x) { return x.trim(); }).filter(Boolean),
    name: s('bakeryname', 'Crumbs & Co.')
  };
}

/* ======================================================================
   doGet  -  menu data and order tracking
   ====================================================================== */

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = String(p.action || 'all').toLowerCase();
    if (action === 'products') return json_({ ok: true, products: getProducts_() });
    if (action === 'options') return json_({ ok: true, options: getOptions_() });
    if (action === 'settings') return json_({ ok: true, settings: getSettingsRaw_() });
    if (action === 'track') return json_(trackOrder_(p.order, p.phone));
    if (action === 'all') return ContentService.createTextOutput(getAllCached_()).setMimeType(ContentService.MimeType.JSON);
    return json_({ ok: false, error: 'Unknown request.' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Something went wrong. Please try again.' });
  }
}

// Products + options + settings in one answer, kept for 60 seconds so the site stays quick.
function getAllCached_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('all_v1');
  if (hit) return hit;
  var s = JSON.stringify({ ok: true, products: getProducts_(), options: getOptions_(), settings: getSettingsRaw_(), serverTime: Date.now() });
  try { if (s.length < 90000) cache.put('all_v1', s, 60); } catch (e) { /* too big or cache busy: fine */ }
  return s;
}

/**
 * Track an order. The visitor must give the PHONE number. The order number is optional.
 *   phone only      -> that phone's orders from the last 30 days (newest first): order number, date and status ONLY.
 *   phone + order   -> that one order: status, date and Delivery/Pickup (so the right steps are shown).
 * Names, addresses and items are NEVER returned. Wrong tries are limited per phone number.
 */
function trackOrder_(orderNo, phone) {
  var cache = CacheService.getScriptCache();
  var ph = digits_(phone);
  if (/^92/.test(ph) && ph.length >= 12) ph = '0' + ph.slice(2);
  if (ph.length < 10) return fail_('Please type the phone number you used when ordering.');
  var tail = ph.slice(-10);

  var no = String(orderNo || '').toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 14);
  if (no && no.indexOf('-') === -1) no = no.replace(/^([A-Z]+)(\d+)$/, '$1-$2');

  var key = 'trk_p_' + tail, all = 'trk_all'; // lockout is counted per phone number
  var fails = Number(cache.get(key) || 0), allFails = Number(cache.get(all) || 0);
  if (fails >= 5 || allFails >= 150) return fail_('Too many tries. Please wait 15 minutes, or call us.');

  var found = null, list = [];
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB.ORDERS);
  if (sh && sh.getLastRow() > 1) {
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, ORDER_HEADERS.length).getValues();
    var cutoff = Date.now() - 30 * 24 * 3600 * 1000;
    for (var i = vals.length - 1; i >= 0; i--) { // newest rows are at the bottom
      var r = vals[i];
      if (digits_(r[OC.PHONE]).slice(-10) !== tail) continue;
      var st = String(r[OC.STATUS]).trim(), ms = Number(r[OC.MS]) || null;
      var order = { no: String(r[OC.NO]).trim(), status: STATUSES.indexOf(st) > -1 ? st : 'Received', orderTime: ms };
      if (no) {
        if (order.no.toUpperCase() === no) { order.method = r[OC.METHOD] === 'Pickup' ? 'Pickup' : 'Delivery'; found = order; break; }
      } else if (ms && ms >= cutoff && list.length < 30) {
        list.push(order);
      }
    }
  }

  if (no ? found : list.length) {
    try { cache.remove(key); } catch (e) { /* ignore */ }
    if (no) return { ok: true, mode: 'one', orderNo: found.no, status: found.status, orderTime: found.orderTime, method: found.method };
    return { ok: true, mode: 'list', orders: list };
  }
  try { cache.put(key, String(fails + 1), 900); cache.put(all, String(allFails + 1), 600); } catch (e) { /* ignore */ }
  return fail_(no ? 'We could not find an order with these details. Please check the order number and phone number.'
                  : 'We could not find any orders for this phone number in the last 30 days. Please check the number, or type your order number too.');
}

/* ======================================================================
   doPost  -  place an order
   ====================================================================== */

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '';
    if (!raw || raw.length > 20000) return json_({ ok: false, error: 'Sorry, we could not read your order.' });
    var data;
    try { data = JSON.parse(raw); } catch (x) { return json_({ ok: false, error: 'Sorry, we could not read your order.' }); }
    return json_(placeOrder_(data || {}));
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Sorry, something went wrong on our side. Please try again, or call us.' });
  }
}

function fail_(msg) { return { ok: false, error: msg }; }

function placeOrder_(d) {
  var cache = CacheService.getScriptCache();

  // 1. Spam checks: hidden honeypot field, and a form that was filled in impossibly fast.
  if (String(d.hp || '').trim() !== '' || Number(d.elapsed) < 2000) return fail_('Sorry, we could not place this order. Please try again.');
  var rate = Number(cache.get('ord_rate') || 0);
  if (rate >= 40) return fail_('We are very busy right now. Please try again in a few minutes.');

  var set = getSettings_();
  if (!set.accepting) return fail_('We are not taking online orders right now. Please call us.');

  // 2. Customer details
  var name = safeText_(d.name, 60);
  if (name.length < 2) return fail_('Please type your name.');
  var ph = digits_(d.phone);
  if (/^92/.test(ph) && ph.length === 12) ph = '0' + ph.slice(2);
  if (!/^03\d{9}$/.test(ph)) return fail_('Please type a mobile number like 0300-1234567.');
  var phone = ph.slice(0, 4) + '-' + ph.slice(4);
  var phoneKey = 'ord_p_' + ph;
  if (Number(cache.get(phoneKey) || 0) >= 6) return fail_('Too many orders from this number just now. Please call us.');

  var method = d.method === 'Pickup' ? 'Pickup' : d.method === 'Delivery' ? 'Delivery' : '';
  if (!method) return fail_('Please choose delivery or pickup.');
  var area = '', address = '';
  if (method === 'Delivery') {
    area = safeText_(d.area, 60); address = safeText_(d.address, 250);
    if (!area) return fail_('Please choose your area.');
    if (address.length < 8) return fail_('Please type your full address.');
  }

  var payment = String(d.payment || '');
  if (payment !== BANK && !(payment === 'Cash on Delivery' && set.cod)) return fail_('Please choose how you will pay.');

  // The time slot is optional. When none is chosen we save "Any time".
  var slot = safeText_(d.slot, 40);
  if (!slot || slot.toLowerCase() === 'any time') slot = 'Any time';
  else if (set.slots.length && set.slots.map(function (s) { return s.toLowerCase(); }).indexOf(slot.toLowerCase()) === -1) return fail_('Please choose a time slot from the list, or choose Any time.');
  var date = String(d.date || '');
  if (!validDate_(date)) return fail_('Please pick a date.');
  var today = todayPK_();
  if (date < today) return fail_('That date has passed. Please pick another day.');
  if (date > addDays_(today, 90)) return fail_('Please pick a date within the next 90 days.');

  // 3. Items: look up EVERY price in the sheet. Prices sent by the browser are ignored.
  var items = Array.isArray(d.items) ? d.items : [];
  if (!items.length || items.length > 40) return fail_('Your cart looks empty. Please add something and try again.');
  var products = {};
  getProducts_().forEach(function (p) { var k = p.name.toLowerCase(); if (!products[k]) products[k] = p; });
  var opts = getOptions_();
  function find(list, nm) { nm = String(nm || '').trim().toLowerCase(); return list.filter(function (x) { return x.name.toLowerCase() === nm; })[0]; }

  var lines = [], subtotal = 0, hasCake = false;
  for (var i = 0; i < items.length; i++) {
    var it = items[i] || {};
    var qty = Math.floor(Number(it.qty));
    if (!(qty >= 1 && qty <= 50)) return fail_('Please check the quantities in your cart.');
    var label, unitPrice;
    if (it.cake) {
      var size = find(opts.sizes, it.cake.size), fl = find(opts.flavours, it.cake.flavour), fr = find(opts.frostings, it.cake.frosting);
      if (!size || !fl || !fr) return fail_('One of the cake options is no longer available. Please build your cake again.');
      var msg = safeText_(it.cake.message, 30);
      unitPrice = Math.round(size.price + (fl.extra + fr.extra) * size.pounds);
      label = 'Custom cake: ' + size.name + ', ' + fl.name + ', ' + fr.name + (msg ? ' - message "' + msg + '"' : '');
      hasCake = true;
    } else {
      var p = products[String(it.name || '').trim().toLowerCase()];
      if (!p) return fail_('Sorry, "' + safeText_(it.name, 40) + '" is no longer on our menu. Please remove it from your cart.');
      if (!p.available) return fail_('Sorry, "' + p.name + '" is sold out today. Please remove it from your cart.');
      if (method === 'Delivery' && !p.delivery) return fail_('"' + p.name + '" is pickup only. Please choose pickup or remove it from your cart.');
      unitPrice = p.price;
      label = p.name + (p.unit ? ' (' + p.unit + ')' : '');
    }
    lines.push({ label: label, qty: qty, lineTotal: unitPrice * qty });
    subtotal += unitPrice * qty;
  }
  if (hasCake && date < addDays_(today, set.noticeDays)) return fail_('Custom cakes need at least ' + set.noticeDays + ' day' + (set.noticeDays === 1 ? '' : 's') + ' notice. Please pick a later date.');

  // 4. Totals, worked out here and nowhere else
  var fee = method === 'Delivery' ? set.fee : 0;
  var discount = Math.round((subtotal + fee) * set.discountPct / 100); // the online discount applies to the TOTAL bill: items + delivery fee
  var total = subtotal + fee - discount;
  var notes = safeText_(d.notes, 200);

  // 5. Save the order (one at a time, so two orders can never get the same number)
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var orderNo, nowMs = Date.now();
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(TAB.ORDERS) || (setupOrders_(ss), ss.getSheetByName(TAB.ORDERS));
    var last = sh.getLastRow(), maxNo = 1000;
    if (last > 1) sh.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) { var m = /^CC-(\d+)$/i.exec(String(r[0]).trim()); if (m) maxNo = Math.max(maxNo, Number(m[1])); });
    orderNo = 'CC-' + (maxNo + 1);
    var itemsText = lines.map(function (l) { return l.qty + ' x ' + l.label + ' = ' + money_(l.lineTotal); }).join('\n');
    var row = [orderNo, 'Received', Utilities.formatDate(new Date(nowMs), TZ, 'dd MMM yyyy, hh:mm a'), name, phone, method, area, address, date, slot, payment, itemsText, subtotal, fee, discount, total, notes, nowMs];
    var rng = sh.getRange(last + 1, 1, 1, ORDER_HEADERS.length);
    var fmts = row.map(function (v, c) { return (c >= OC.SUB && c <= OC.TOTAL) ? '#,##0' : c === OC.MS ? '0' : '@'; });
    rng.setNumberFormats([fmts]);
    rng.setValues([row]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  try {
    cache.put('ord_rate', String(rate + 1), 600);
    cache.put(phoneKey, String(Number(cache.get(phoneKey) || 0) + 1), 3600);
  } catch (e) { /* ignore */ }
  CacheService.getScriptCache().remove('all_v1');

  // 6. Email the owner (the account that owns this script; no address is written in the code)
  try {
    var to = Session.getEffectiveUser().getEmail();
    if (to) {
      MailApp.sendEmail({
        to: to,
        name: set.name + ' website',
        subject: 'New order ' + orderNo + ' - ' + money_(total) + ' (' + method + ')',
        body: 'New website order ' + orderNo + '\n\n' +
          'Name: ' + name + '\nPhone: ' + phone + '\nMethod: ' + method + '\n' +
          (method === 'Delivery' ? 'Area: ' + area + '\nAddress: ' + address + '\n' : '') +
          'Needed on: ' + date + ', ' + slot + '\nPayment: ' + payment + '\n\n' +
          lines.map(function (l) { return l.qty + ' x ' + l.label + ' = ' + money_(l.lineTotal); }).join('\n') + '\n\n' +
          'Subtotal: ' + money_(subtotal) + '\nDelivery fee: ' + money_(fee) + '\nOnline discount (' + set.discountPct + '% of items + delivery): -' + money_(discount) + '\nTOTAL: ' + money_(total) + '\n\n' +
          (notes ? 'Notes: ' + notes + '\n\n' : '') +
          (payment === BANK ? 'This customer will pay by bank transfer / JazzCash. Please confirm the payment before baking.\n\n' : '') +
          'Open the Orders tab to change the status: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
      });
    }
  } catch (err) {
    console.warn('Order saved, but the email could not be sent: ' + err); // the order is safe in the sheet
  }

  return { ok: true, orderNo: orderNo, subtotal: subtotal, deliveryFee: fee, discount: discount, total: total, items: lines };
}
