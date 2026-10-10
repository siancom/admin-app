import sys

file_path = "/Users/ittichai/ZCodeProject/admin-dashboard/src/components/POSSystem.jsx"

with open(file_path, "r") as f:
    content = f.read()

# Fix imports
target_import = "import { addDoc, updateDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';"
replacement_import = "import { addDoc, updateDoc, doc, getDocs, query, where, writeBatch, orderBy, limit } from 'firebase/firestore';"
content = content.replace(target_import, replacement_import)

# Add useEffect for float
target_state = "  const [eodData, setEodData] = useState({ actualCash: '', floatCash: '1000', imageBase64: '', submittedBy: '', clockOut: true });"
replacement_state = """  const [eodData, setEodData] = useState({ actualCash: '', floatCash: '1000', imageBase64: '', submittedBy: '', clockOut: true });

  useEffect(() => {
    const fetchLastFloat = async () => {
      try {
        const q = query(getCol('daily_sales'), orderBy("createdAt", "desc"), limit(20));
        const snap = await getDocs(q);
        const branchRec = snap.docs.find(d => d.data().branch === (globalBranch || "สำนักงานใหญ่"));
        if (branchRec && branchRec.data().nextDayFloat !== undefined) {
           setEodData(prev => ({ ...prev, floatCash: branchRec.data().nextDayFloat.toString() }));
        }
      } catch (e) {
        console.error("Fetch last float error", e);
      }
    };
    fetchLastFloat();
  }, [globalBranch]);"""
content = content.replace(target_state, replacement_state)

with open(file_path, "w") as f:
    f.write(content)
print("Updated POSSystem.jsx")
