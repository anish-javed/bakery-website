/*
  Built-in DEMO data. Used ONLY while SCRIPT_URL in config.js is empty.
  Once you connect your Google Sheet this file is not used at all.
  (Same sample products as the setup() function in google-apps-script.gs.)
*/
(function () {
  var raw = `
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

  var products = raw.trim().split("\n").map(function (line, i) {
    var f = line.split("|");
    return {
      name: f[0], category: f[1], price: Number(f[2]), unit: f[3], description: f[4], photo: "",
      available: f[5] === "Yes", featured: f[6] === "Yes", delivery: f[7] === "Yes",
      popularity: Number(f[8]), order: i
    };
  });

  window.CC_DEMO = {
    products: products,
    options: {
      sizes: [
        { name: "1 lb", price: 1600, pounds: 1 },
        { name: "2 lb", price: 3000, pounds: 2 },
        { name: "3 lb", price: 4400, pounds: 3 },
        { name: "4 lb", price: 5800, pounds: 4 }
      ],
      flavours: [
        { name: "Vanilla", extra: 0 },
        { name: "Chocolate", extra: 200 },
        { name: "Red Velvet", extra: 400 },
        { name: "Strawberry", extra: 200 },
        { name: "Pineapple", extra: 100 },
        { name: "Butterscotch", extra: 200 },
        { name: "Black Forest", extra: 300 },
        { name: "Coffee Walnut", extra: 300 },
        { name: "Lotus Biscoff", extra: 600 }
      ],
      frostings: [
        { name: "Fresh Cream", extra: 0 },
        { name: "Buttercream", extra: 150 },
        { name: "Whipped Cream with Fruit", extra: 250 },
        { name: "Chocolate Ganache", extra: 300 },
        { name: "Cream Cheese", extra: 350 },
        { name: "Fondant", extra: 600 }
      ]
    },
    settings: {
      "Bakery Name": "Crumbs & Co.",
      "Phone": "0300 0000000",
      "WhatsApp Number": "923000000000",
      "Address": "Main Boulevard, Gulberg III, Lahore",
      "Delivery Fee": 250,
      "Online Discount %": 5,
      "Opening Hours": "Mon to Thu: 9 am - 11 pm; Fri to Sun: 9 am - 12 midnight",
      "Cake Notice Days": 2,
      "Accepting Orders": "Yes",
      "Cash On Delivery": "Yes",
      "Delivery Areas": "Gulberg, DHA, Johar Town, Model Town, Cantt, Bahria Town, Faisal Town, Wapda Town, Garden Town, Iqbal Town, Samanabad, Township",
      "Time Slots": "10:00 am - 12:00 pm, 12:00 pm - 2:00 pm, 2:00 pm - 4:00 pm, 4:00 pm - 6:00 pm, 6:00 pm - 8:00 pm, 8:00 pm - 10:00 pm",
      "Bank Name": "Demo Bank Ltd",
      "Account Title": "Crumbs and Co.",
      "Account Number": "0000-0000000000",
      "IBAN": "PK00 DEMO 0000 0000 0000 0000",
      "JazzCash Number": "0300 0000000",
      "JazzCash Title": "Crumbs and Co.",
      "Payment Note": "After you pay, tap I've paid on the next screen. We confirm your payment before we start baking."
    }
  };
})();
