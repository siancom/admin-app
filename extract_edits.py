import json

log_file = "/Users/ittichai/.gemini/antigravity-ide/brain/fe8dc008-0a39-4fba-9cb6-f55ef8614267/.system_generated/logs/transcript.jsonl"
app_jsx_edits = []

with open(log_file, "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for call in tool_calls:
                name = call.get("function", {}).get("name")
                if name in ["multi_replace_file_content", "replace_file_content", "write_to_file"]:
                    args = call.get("function", {}).get("arguments", "{}")
                    try:
                        args_json = json.loads(args)
                        if "App.jsx" in args_json.get("TargetFile", ""):
                            app_jsx_edits.append(args_json)
                    except:
                        pass
        except Exception as e:
            pass

with open("/Users/ittichai/admin-dashboard/app_edits.json", "w") as f:
    json.dump(app_jsx_edits, f, indent=2)
