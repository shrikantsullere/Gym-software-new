import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import * as echarts from 'echarts';

const AssessmentHistory = ({ memberId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axiosInstance.get(`/v1/assessments/member/${memberId}/history`);
        setHistory(res.data.data || []);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };
    if (memberId) fetchHistory();
  }, [memberId]);

  useEffect(() => {
    if (history.length > 0 && chartRef.current) {
      const chart = echarts.init(chartRef.current);
      
      const dates = history.map(item => new Date(item.assessment_date).toLocaleDateString());
      const weights = history.map(item => item.inputs.weight_kg);
      const bodyFats = history.map(item => item.metrics.body_fat_percentage);

      const option = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['Weight (kg)', 'Body Fat %'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dates },
        yAxis: [
          { type: 'value', name: 'Weight', position: 'left' },
          { type: 'value', name: 'Body Fat %', position: 'right' }
        ],
        series: [
          {
            name: 'Weight (kg)',
            type: 'line',
            data: weights,
            yAxisIndex: 0,
            itemStyle: { color: '#0d6efd' },
            areaStyle: { color: 'rgba(13, 110, 253, 0.1)' },
            smooth: true
          },
          {
            name: 'Body Fat %',
            type: 'line',
            data: bodyFats,
            yAxisIndex: 1,
            itemStyle: { color: '#dc3545' },
            areaStyle: { color: 'rgba(220, 53, 69, 0.1)' },
            smooth: true
          }
        ]
      };

      chart.setOption(option);

      const resizeObserver = new ResizeObserver(() => chart.resize());
      resizeObserver.observe(chartRef.current);

      return () => {
        chart.dispose();
        resizeObserver.disconnect();
      };
    }
  }, [history]);

  if (loading) return <div className="text-center py-4"><div className="spinner-border text-secondary" role="status"></div></div>;
  if (history.length === 0) return <div className="alert alert-secondary text-center mt-4">No historical data available yet.</div>;

  return (
    <div className="card shadow-sm border-0 rounded-4 mt-4 mb-5">
      <div className="card-header bg-white border-bottom-0 pt-4 px-4">
        <h5 className="card-title text-secondary fw-bold mb-0">
          <i className="bi bi-graph-up text-primary me-2"></i>Historical Progress
        </h5>
      </div>
      <div className="card-body p-4">
        
        <div ref={chartRef} style={{ width: '100%', height: '350px' }} className="mb-4"></div>
        
        <div className="table-responsive mt-2">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col" className="text-muted text-uppercase" style={{fontSize: '0.8rem'}}>Date</th>
                <th scope="col" className="text-muted text-uppercase" style={{fontSize: '0.8rem'}}>Weight</th>
                <th scope="col" className="text-muted text-uppercase" style={{fontSize: '0.8rem'}}>Body Fat %</th>
                <th scope="col" className="text-muted text-uppercase" style={{fontSize: '0.8rem'}}>Lean Body Mass</th>
                <th scope="col" className="text-muted text-uppercase" style={{fontSize: '0.8rem'}}>Goal</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, idx) => (
                <tr key={idx}>
                  <td className="fw-medium text-dark">{new Date(record.assessment_date).toLocaleDateString()}</td>
                  <td>{record.inputs.weight_kg} kg</td>
                  <td><span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">{record.metrics.body_fat_percentage}%</span></td>
                  <td>{record.metrics.lean_body_mass} kg</td>
                  <td className="text-capitalize text-muted">{record.inputs.fitness_goal.replace('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default AssessmentHistory;
