import React, { useState, useEffect } from "react";
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
  LabelList,
  ReferenceArea,
} from "recharts";

function App() {
  const [dailyResult, setDailyResult] = useState([]);
  const [dailyFile, setDailyFile] = useState(null);

  // ---------------- Upload Daily Excel ----------------
  const uploadDaily = async () => {
    if (!dailyFile) return alert("Please select Daily file!");
    const formData = new FormData();
    formData.append("file", dailyFile);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/daily/upload",
        formData
      );
      setDailyResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error uploading daily file");
    }
  };

  // ---------------- Fetch all Daily Data ----------------
  const fetchDailyData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/daily");
      setDailyResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error fetching daily data");
    }
  };

  // ---------------- Group by Date ----------------
  const chartData = React.useMemo(() => {
    // 1. Group by date
    const grouped = {};
    dailyResult.forEach(d => {
      const dateObj = new Date(d.date);
      const dateStr = dateObj.toDateString(); // normalize to same day
      if (!grouped[dateStr]) grouped[dateStr] = 0;
      grouped[dateStr] += d.totalCost || 0;
    });

    // 2. Convert to array with actual Date object
    return Object.entries(grouped)
      .map(([dateStr, total]) => ({
        date: new Date(dateStr), // ✅ Date object
        total: total / 1000000,  // convert to millions
      }))
      .sort((a, b) => a.date - b.date); // sort by actual date
  }, [dailyResult]);


  const totalInMillion = dailyResult.reduce(
    (acc, curr) => acc + (curr.totalCost || 0),
    0
  ) / 1000000;

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-300 via-pink-200 to-yellow-200 p-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-white shadow-lg p-4 rounded-lg bg-purple-600">
        Daily Excel Processor & Date-wise Chart
      </h1>

      {/* Upload Buttons */}
      <div className="flex flex-col md:flex-row justify-center items-center mb-6 gap-4">
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
        <button
          onClick={fetchDailyData}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Show All Daily Data
        </button>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-4">
            Total Cost per Day (in Millions)
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={time => new Date(time).toLocaleDateString("en-GB")}
                angle={-45}
                textAnchor="end"
                height={60}
              />


              <YAxis
                type="number"
                domain={[0, 12]}
                ticks={[0, 4, 8, 12]}  // ✅ manually defined points
                tickFormatter={v => v.toFixed(1)}
              />

              <Tooltip />
              <Legend />

              {/* Optional color bands */}
              {chartData.length > 0 && (
                <>
                  <ReferenceArea
                    y1={0}
                    y2={4}
                    x1={chartData[0].date.getTime()}
                    x2={chartData[chartData.length - 1].date.getTime()}
                    fill="green"
                    fillOpacity={0.5}
                  />
                  <ReferenceArea
                    y1={4}
                    y2={8}
                    x1={chartData[0].date.getTime()}
                    x2={chartData[chartData.length - 1].date.getTime()}
                    fill="yellow"
                    fillOpacity={0.5}
                  />
                  <ReferenceArea
                    y1={8}
                    y2={12}
                    x1={chartData[0].date.getTime()}
                    x2={chartData[chartData.length - 1].date.getTime()}
                    fill="red"
                    fillOpacity={0.5}
                  />
                </>
              )}


              <Line type="monotone" dataKey="total" stroke="#ff7300" strokeWidth={2}>
                <LabelList dataKey="total" position="top" formatter={val => val.toFixed(2)} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>

          <div className="mt-4 text-right text-xl font-bold text-green-700">
            Total Cost (in Millions): {totalInMillion.toFixed(2)} M
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
