import React, { useState } from "react";
import axios from "axios";

function App() {
  const [dailyFile, setDailyFile] = useState(null);
  const [dailyResult, setDailyResult] = useState([]);

  // Upload Daily Excel & calculate
  const uploadDaily = async () => {
    if (!dailyFile) return alert("Please select Daily file!");
    const formData = new FormData();
    formData.append("file", dailyFile);

    try {
      const res = await axios.post("http://localhost:5000/api/daily/upload", formData);
      setDailyResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error uploading daily file");
    }
  };

  // Calculate total in millions
  const totalInMillion = (dailyResult.reduce((acc, curr) => acc + curr.totalCost, 0) / 1000000).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-300 via-pink-200 to-yellow-200 p-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-white shadow-lg p-4 rounded-lg bg-purple-600">
        Daily Excel Processor
      </h1>

      {/* Daily File Upload */}
      <div className="flex flex-col md:flex-row justify-center items-center mb-8 gap-4">
        <input 
          type="file" 
          onChange={e => setDailyFile(e.target.files[0])} 
          className="px-4 py-2 rounded border-2 border-purple-400 hover:border-purple-600 transition cursor-pointer"
        />
        <button 
          onClick={uploadDaily} 
          className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Upload Daily & Calculate
        </button>
      </div>

      {/* Result Table */}
      {dailyResult.length > 0 && (
        <>
          <div className="overflow-x-auto shadow-lg rounded-xl">
            <table className="min-w-full bg-white rounded-xl overflow-hidden">
              <thead className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <tr>
                  <th className="py-3 px-6 text-left">Item</th>
                  <th className="py-3 px-6 text-left">Unit Cost</th>
                  <th className="py-3 px-6 text-left">On-hand</th>
                  <th className="py-3 px-6 text-left">Total Cost</th>
                  <th className="py-3 px-6 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {dailyResult.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-purple-50" : "bg-pink-50"}>
                    <td className="py-3 px-6">{r.item}</td>
                    <td className="py-3 px-6 font-semibold">{r.unitCost}</td>
                    <td className="py-3 px-6">{r.onHand}</td>
                    <td className="py-3 px-6 font-bold text-green-600">{r.totalCost}</td>
                    <td className="py-3 px-6">{r.date ? new Date(r.date).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total in Millions */}
          <div className="mt-4 text-right text-xl font-bold text-green-700">
            Total Cost (in Millions): {totalInMillion} M
          </div>
        </>
      )}
    </div>
  );
}

export default App;
