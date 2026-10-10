import json

log_file = "/Users/ittichai/.gemini/antigravity-ide/brain/fe8dc008-0a39-4fba-9cb6-f55ef8614267/.system_generated/logs/transcript.jsonl"
diff_content = []

with open(log_file, "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get("content", "")
            if "diff --git a/src/App.jsx b/src/App.jsx" in content:
                diff_content.append(content)
        except:
            pass

with open("/Users/ittichai/admin-dashboard/diff_log.txt", "w") as f:
    for p in diff_content:
        f.write(p + "\n---\n")
