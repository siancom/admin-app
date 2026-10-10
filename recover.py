import json
import re

log_file = "/Users/ittichai/.gemini/antigravity-ide/brain/fe8dc008-0a39-4fba-9cb6-f55ef8614267/.system_generated/logs/transcript.jsonl"
app_jsx_content = {}
with open(log_file, "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "VIEW_FILE" and "App.jsx" in data.get("content", ""):
                # Look for the lines of code in the view file output
                content = data["content"]
                lines = content.split("\n")
                for l in lines:
                    match = re.match(r"^(\d+):\s(.*)", l)
                    if match:
                        line_num = int(match.group(1))
                        line_text = match.group(2)
                        app_jsx_content[line_num] = line_text
        except:
            pass

print(f"Recovered {len(app_jsx_content)} lines from VIEW_FILE.")
if len(app_jsx_content) > 0:
    max_line = max(app_jsx_content.keys())
    print(f"Max line: {max_line}")
