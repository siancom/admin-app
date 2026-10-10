with open("fix_pos_features3.py", "r") as f:
    c = f.read()
c = c.replace('"          </>\\n        )\\n" + cart_end', '"          </>\\n        )}\\n" + cart_end')
with open("fix_pos_features3.py", "w") as f:
    f.write(c)
