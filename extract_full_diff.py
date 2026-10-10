import json

log_file = "/Users/ittichai/.gemini/antigravity-ide/brain/fe8dc008-0a39-4fba-9cb6-f55ef8614267/.system_generated/logs/transcript.jsonl"
diff_output = ""

with open(log_file, "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "ACTION_RESULT":
                content = data.get("content", "")
                if "diff --git a/src/App.jsx b/src/App.jsx" in content or "truncated" in content:
                    # Let's just find the big git diff output
                    if "git diff /Users/ittichai/admin-dashboard/src/App.jsx" in data.get("source", "") or "git diff" in content:
                        diff_output += content + "\n\n"
        except:
            pass

# Also look for the exact tool call result that was large
with open(log_file, "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "ACTION_RESULT":
                content = data.get("content", "")
                if "<truncated" in content and "-                                ฿{finalPrice.toLocaleString()}" in content:
                    diff_output += "\n--- FOUND TRUNCATED DIFF ---\n" + content
        except:
            pass


with open("/Users/ittichai/admin-dashboard/diff_full.txt", "w") as f:
    f.write(diff_output)
