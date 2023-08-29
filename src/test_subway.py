def sbw_error(msg):
    print(msg)
    return -1

def sbw_price(ftype, size, bread, cheese, veggies, meat):
    TYPE_PRICES = {"Sub": 2, "Salad": 5, "Wrap": 3}
    SIZE_PRICES = {"6-inch": 2, "Footlong": 4}
    BREAD_PRICES = {"Garlic": 0, "Plain": 0, "Wholewheat": 0, "Gluten-Free": 1}
    CHEESE_SURCHARGE = 1
    VEGGIES_PRICES = {"Standard Veggies": 3, "Premium": 4}
    MEAT_PRICES = {
        "Meatball": 3, "MLT": 4, "Standard steak": 4
    }

    total_price = 0

    # Calculate base price based on the sandwich type
    if ftype in TYPE_PRICES:
        total_price += TYPE_PRICES[ftype]
    else:
        return sbw_error("Invalid sandwich type")

    # Add size price and bread price only for "Sub"
    if ftype == "Sub":
        if size in SIZE_PRICES:
            total_price += SIZE_PRICES[size]
        else:
            return sbw_error("Invalid sandwich size")

        if bread in BREAD_PRICES:
            total_price += BREAD_PRICES[bread]
        else:
            return sbw_error("Invalid bread type")

    # Add cheese surcharge
    if cheese == "Yes":
        total_price += CHEESE_SURCHARGE
    elif cheese == "No":
        total_price = total_price
    else:
        return sbw_error("Invalid cheese option")

    # Add veggies price
    if veggies in VEGGIES_PRICES:
        total_price += VEGGIES_PRICES[veggies]
    else:
        return sbw_error("Invalid veggies type")

    # Add meat price
    if meat in MEAT_PRICES and ftype != "Wrap":
        total_price += MEAT_PRICES[meat]
    elif ftype == "Wrap" and meat == "Wagyu Steak":
        total_price += 6
    elif ftype == "Wrap" and meat in MEAT_PRICES:
        total_price += MEAT_PRICES[meat]
    else:
        return sbw_error("Invalid meat type")

    return total_price

# # Example usage
# price = sbw_price("Sub", "6-inch", "Garlic", "Yes", "Standard", "Meatball")
# if price != -1:
#     print(f"Total price: ${price}")