def check_file(filename):
    with open(filename) as f:
        text = f.read()
    count = 0
    started = False
    for i, line in enumerate(text.split('\n')):
        if 'export default function App() {' in line:
            started = True
            count = 1
            continue
        if not started:
            continue
        
        for c in line:
            if c == '{': count += 1
            elif c == '}': count -= 1
        
        if count == 0:
            print(f'{filename} Function closed at line {i+1}: {line}')
            break

check_file('old_app.jsx')
check_file('src/App.jsx')
