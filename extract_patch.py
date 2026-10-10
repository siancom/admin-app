import json

log_file = "/Users/ittichai/.gemini/antigravity-ide/brain/fe8dc008-0a39-4fba-9cb6-f55ef8614267/.system_generated/logs/transcript.jsonl"
patch_lines = []
found_diff = False

with open(log_file, "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get("content", "")
            if "The command completed successfully." in content and "diff --git" in content:
                # This might be the git diff output
                patch_lines.append(content)
        except:
            pass

with open("/Users/ittichai/admin-dashboard/restore.patch", "w") as f:
    for p in patch_lines:
        f.write(p)
