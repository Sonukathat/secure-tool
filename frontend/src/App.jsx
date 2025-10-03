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

  // Fetch all daily data
  const fetchDailyData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/daily");
      setDailyResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error fetching daily data");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-300 via-pink-200 to-yellow-200 p-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-white shadow-lg p-4 rounded-lg bg-purple-600">
        Daily Excel Processor
      </h1>

      {/* Daily File Upload */}
      <div className="flex flex-col items-center mb-6 gap-4">
        <label className="cursor-pointer bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition duration-300">
          {dailyFile ? dailyFile.name : "Select Daily Excel File"}
          <input
            type="file"
            onChange={e => setDailyFile(e.target.files[0])}
            className="hidden"
          />
        </label>

        <div className="flex gap-4">
          <button 
            onClick={uploadDaily} 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition duration-300"
          >
            Upload & Calculate
          </button>

          {/* New button to fetch all daily data */}
          <button
            onClick={fetchDailyData}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition duration-300"
          >
            Show All Daily Data
          </button>
        </div>
      </div>

      {/* Result Table */}
      {dailyResult.length > 0 && (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-white shadow-lg rounded-xl overflow-hidden">
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
                  <td className="py-3 px-6">{new Date(r.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
