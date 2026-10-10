import json

log_file = "/Users/ittichai/.gemini/antigravity-ide/brain/fe8dc008-0a39-4fba-9cb6-f55ef8614267/.system_generated/logs/transcript.jsonl"
diff_content = []

with open(log_file, "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get("content", "")
            if "git diff /Users/ittichai/admin-dashboard/src/App.jsx" in str(data) or "diff --git" in content:
                # Need to be careful because diffs can be inside tool outputs
                if "diff --git a/src/App.jsx b/src/App.jsx" in content and "--- a/src/App.jsx" in content:
                    diff_content.append(content)
        except Exception as e:
            pass

with open("/Users/ittichai/admin-dashboard/unstaged_diff.patch", "w") as f:
    for p in diff_content:
        f.write(p + "\n===\n")
