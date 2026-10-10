import json

with open("/Users/ittichai/.gemini/antigravity-ide/brain/fe8dc008-0a39-4fba-9cb6-f55ef8614267/.system_generated/logs/transcript.jsonl", "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "PLANNER_RESPONSE":
                for tc in data.get("tool_calls", []):
                    if tc["name"] in ["replace_file_content", "multi_replace_file_content", "write_to_file"]:
                        args = tc.get("args", {})
                        target = args.get("TargetFile", "")
                        if "POSSystem.jsx" in target:
                            print(f"Step {data['step_index']}: {tc['name']} -> {target}")
                            if tc["name"] == "multi_replace_file_content":
                                chunks = json.loads(args.get("ReplacementChunks", "[]"))
                                for i, chunk in enumerate(chunks):
                                    print(f"  Chunk {i}: lines {chunk.get('StartLine')}-{chunk.get('EndLine')}")
                            elif tc["name"] == "replace_file_content":
                                print(f"  Lines {args.get('StartLine')}-{args.get('EndLine')}")
        except:
            pass
