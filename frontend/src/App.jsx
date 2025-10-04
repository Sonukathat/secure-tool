import React, { useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ReferenceArea,
  LabelList,
} from "recharts";

function App() {
  const [dailyFile, setDailyFile] = useState(null);
  const [dailyResult, setDailyResult] = useState([]);

  // ---------------- Upload Daily Excel ----------------
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

  // ---------------- Fetch All Daily Data ----------------
  const fetchDailyData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/daily");
      setDailyResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error fetching daily data");
    }
  };

  // ---------------- Group Data by Date ----------------
  const dailyTotalsMap = {}; // date => totalCost in millions
  dailyResult.forEach(d => {
    const date = new Date(d.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!dailyTotalsMap[date]) dailyTotalsMap[date] = 0;
    dailyTotalsMap[date] += (d.totalCost || 0) / 1000000; // convert to millions
  });

  const chartData = Object.entries(dailyTotalsMap)
    .map(([date, total]) => ({
      date,
      total: Number(total.toFixed(2)),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalInMillion =
    dailyResult.reduce((acc, curr) => acc + (curr.totalCost || 0), 0) / 1000000;

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-300 via-pink-200 to-yellow-200 p-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-white shadow-lg p-4 rounded-lg bg-purple-600">
        Daily Excel Processor & Chart
      </h1>

      {/* Upload Buttons */}
      <div className="flex flex-col md:flex-row justify-center items-center mb-6 gap-4">
        <input
          type="file"
          onChange={(e) => setDailyFile(e.target.files[0])}
          className="px-4 py-2 rounded border-2 border-purple-400 hover:border-purple-600 transition cursor-pointer"
        />
        <button
          onClick={uploadDaily}
          className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Upload Daily & Calculate
        </button>
        <button
          onClick={fetchDailyData}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Show All Daily Data
        </button>
      </div>

      {/* Table */}
      {dailyResult.length > 0 && (
        <>
          <div className="overflow-x-auto shadow-lg rounded-xl mb-8">
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
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-purple-50" : "bg-pink-50"}
                  >
                    <td className="py-3 px-6">{r.item}</td>
                    <td className="py-3 px-6 font-semibold">{r.unitCost?.toLocaleString()}</td>
                    <td className="py-3 px-6">{r.onHand?.toLocaleString()}</td>
                    <td className="py-3 px-6 font-bold text-green-600">
                      {(r.totalCost / 1000000).toFixed(2)} M
                    </td>
                    <td className="py-3 px-6">
                      {r.date ? new Date(r.date).toLocaleDateString("en-GB") : "-"}
                    </td>
                  </tr>
                ))}

                {/* Date-wise total rows */}
                {Object.entries(dailyTotalsMap)
                  .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                  .map(([dateStr, total], idx) => (
                    <tr key={`total-${idx}`} className="bg-gray-200 font-bold">
                      <td className="py-3 px-6 text-left" colSpan={3}>Total for {dateStr}</td>
                      <td className="py-3 px-6 text-green-700">{total.toFixed(2)} M</td>
                      <td className="py-3 px-6"></td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="mb-8 text-right text-xl font-bold text-green-700">
            Total Cost (in Millions): {totalInMillion.toFixed(2)} M
          </div>

          {/* Chart */}
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-4">
              Total Cost per Day (in Millions)
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                {/* X-axis = dates */}
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />

                {/* Y-axis */}
                <YAxis
                  type="number"
                  domain={[0, 12]}
                  ticks={[0,4,8, 12]}
                  tickFormatter={(v) => v.toFixed(1)}
                  allowDecimals={true}
                  scale="linear"
                  interval={0}
                />

                <Tooltip />
                <Legend />

                {/* Color bands */}
                {chartData.length > 0 && (
                  <>
                    <ReferenceArea y1={0} y2={4} x1={-0.5} x2={chartData.length - 0.5} fill="#228B22" fillOpacity={0.2} />
                    <ReferenceArea y1={4} y2={8} x1={-0.5} x2={chartData.length - 0.5} fill="#FFD700" fillOpacity={0.2} />
                    <ReferenceArea y1={8} y2={12} x1={-0.5} x2={chartData.length - 0.5} fill="#FF4500" fillOpacity={0.2} />
                  </>
                )}

                {/* Line */}
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#ff7300"
                  strokeWidth={2}
                >
                  <LabelList
                    dataKey="total"
                    position="top"
                    formatter={(val) => val.toFixed(2)}
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
