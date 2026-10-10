with open("fix_pos_features2.py", "r") as f:
    c = f.read()
c = c.replace('cart_start_marker = "        {/* Mobile: View Cart Button */}"', 'cart_start_marker = "        {/* Floating Mobile Cart Button */}"')
with open("fix_pos_features2.py", "w") as f:
    f.write(c)
