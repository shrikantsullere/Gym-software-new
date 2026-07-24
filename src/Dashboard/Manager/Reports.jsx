import React, { useState } from 'react';
import { 
  BarChart,
  PieChart,
  Download,
  Filter,
  Eye,
  CashCoin,
  CurrencyExchange,
  GraphUp,
  Building,
  Person,
  Calendar,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Envelope,
  Share
} from 'react-bootstrap-icons';

const Reports = () => {
  // State management
  const [activeReport, setActiveReport] = useState('sales');
  const [dateRange, setDateRange] = useState('monthly');
  const [selectedBranch, setSelectedBranch] = useState('all');
  
  // Sample data
  const salesData = {
    totalSales: 125400,
    transactions: 284,
    avgOrderValue: 441,
    topProduct: 'Personal Training Package'
  };
  
  const revenueData = {
    totalRevenue: 189500,
    revenueGrowth: 12.5,
    highestEarningBranch: 'Downtown Branch'
  };
  
  const branches = ['Downtown Branch', 'Westside Branch', 'Uptown Branch', 'Riverside Branch'];
  const products = ['Membership', 'Personal Training', 'Group Classes', 'Yoga Classes', 'Supplements'];
  const staff = ['Sarah Wilson', 'Mike Johnson', 'Lisa Chen', 'Carlos Rodriguez'];
  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer'];
  
  const salesTransactions = [
    { id: 'INV-001', date: '2023-06-15', customer: 'John Doe', product: 'Personal Training', qty: 1, price: 2500, payment: 'Credit Card', staff: 'Sarah Wilson', branch: 'Downtown Branch' },
    { id: 'INV-002', date: '2023-06-15', customer: 'Emma Smith', product: 'Monthly Membership', qty: 1, price: 3500, payment: 'UPI', staff: 'Mike Johnson', branch: 'Westside Branch' },
    { id: 'INV-003', date: '2023-06-14', customer: 'Alex Brown', product: 'Protein Powder', qty: 2, price: 3200, payment: 'Debit Card', staff: 'Lisa Chen', branch: 'Uptown Branch' },
    { id: 'INV-004', date: '2023-06-14', customer: 'Michael Taylor', product: 'Group Classes Pack', qty: 1, price: 1800, payment: 'Cash', staff: 'Carlos Rodriguez', branch: 'Riverside Branch' },
    { id: 'INV-005', date: '2023-06-13', customer: 'Sophia Williams', product: 'Yoga Classes', qty: 1, price: 2200, payment: 'Credit Card', staff: 'Sarah Wilson', branch: 'Downtown Branch' }
  ];
  
  const branchRevenues = [
    { name: 'Downtown Branch', revenue: 78500, expenses: 28500, profit: 50000, contribution: 41.4 },
    { name: 'Westside Branch', revenue: 48200, expenses: 21200, profit: 27000, contribution: 25.4 },
    { name: 'Uptown Branch', revenue: 37800, expenses: 19800, profit: 18000, contribution: 19.9 },
    { name: 'Riverside Branch', revenue: 25000, expenses: 14500, profit: 10500, contribution: 13.3 }
  ];
  
  const revenueSources = [
    { name: 'Memberships', value: 78500, percentage: 41.4 },
    { name: 'Personal Training', value: 48200, percentage: 25.4 },
    { name: 'Group Classes', value: 37800, percentage: 19.9 },
    { name: 'Products', value: 25000, percentage: 13.3 }
  ];

  // Function to render the sales trend chart
  const renderSalesTrendChart = () => {
    return (
      <div style={{ height: '300px', position: 'relative' }}>
        {/* Dummy bar chart using pure CSS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '250px', padding: '0 20px' }}>
          {[60, 85, 70, 45, 75, 90, 65, 80, 95, 70, 85, 100].map((height, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '7%' }}>
              <div 
                style={{ 
                  height: `${height}%`, 
                  width: '100%', 
                  backgroundColor: '#0d6efd',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0b5ed7'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#0d6efd'}
              ></div>
              <div style={{ fontSize: '10px', marginTop: '5px' }}>{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>Monthly Sales Trend</div>
      </div>
    );
  };

  // Function to render the sales by category chart
  const renderSalesByCategoryChart = () => {
    const categories = ['Membership', 'PT', 'Group', 'Yoga', 'Supplements'];
    const values = [40, 25, 20, 10, 5];
    const colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1'];
    
    return (
      <div style={{ height: '300px', position: 'relative' }}>
        <div style={{ display: 'flex', height: '200px', justifyContent: 'center', alignItems: 'center' }}>
          {/* Pie chart using pure CSS */}
          <div style={{ position: 'relative', width: '180px', height: '180px', borderRadius: '50%', background: 'conic-gradient(' +
            `${colors[0]} 0% ${values[0]}%, ` +
            `${colors[1]} 0% ${values[0] + values[1]}%, ` +
            `${colors[2]} 0% ${values[0] + values[1] + values[2]}%, ` +
            `${colors[3]} 0% ${values[0] + values[1] + values[2] + values[3]}%, ` +
            `${colors[4]} 0% ${values[0] + values[1] + values[2] + values[3] + values[4]}%` +
          ')' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
          {categories.map((category, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: colors[index], marginRight: '5px' }}></div>
              <span style={{ fontSize: '12px' }}>{category} ({values[index]}%)</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>Sales by Category</div>
      </div>
    );
  };

  // Function to render the revenue by branch chart
  const renderRevenueByBranchChart = () => {
    const branches = ['Downtown', 'Westside', 'Uptown', 'Riverside'];
    const revenues = [78.5, 48.2, 37.8, 25.0];
    
    return (
      <div style={{ height: '300px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '250px', padding: '0 20px' }}>
          {revenues.map((revenue, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%' }}>
              <div 
                style={{ 
                  height: `${revenue}%`, 
                  width: '60%', 
                  backgroundColor: '#198754',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#146c43'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#198754'}
              ></div>
              <div style={{ fontSize: '10px', marginTop: '5px', textAlign: 'center' }}>{branches[index]}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>Revenue by Branch (in $ thousands)</div>
      </div>
    );
  };

  // Function to render the revenue sources chart
  const renderRevenueSourcesChart = () => {
    const sources = ['Memberships', 'PT', 'Group', 'Products'];
    const values = [41.4, 25.4, 19.9, 13.3];
    const colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545'];
    
    return (
      <div style={{ height: '300px', position: 'relative' }}>
        <div style={{ display: 'flex', height: '200px', justifyContent: 'center', alignItems: 'center' }}>
          {/* Pie chart using pure CSS */}
          <div style={{ position: 'relative', width: '180px', height: '180px', borderRadius: '50%', background: 'conic-gradient(' +
            `${colors[0]} 0% ${values[0]}%, ` +
            `${colors[1]} 0% ${values[0] + values[1]}%, ` +
            `${colors[2]} 0% ${values[0] + values[1] + values[2]}%, ` +
            `${colors[3]} 0% ${values[0] + values[1] + values[2] + values[3]}%` +
          ')' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
          {sources.map((source, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: colors[index], marginRight: '5px' }}></div>
              <span style={{ fontSize: '12px' }}>{source} ({values[index]}%)</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold' }}>Revenue Sources</div>
      </div>
    );
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h1 className="h2 mb-4">Reports & Analytics</h1>
          
          {/* Tabs for Report Types */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeReport === 'sales' ? 'active' : ''}`}
                onClick={() => setActiveReport('sales')}
              >
                <CashCoin className="me-2" /> Sales Report
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeReport === 'revenue' ? 'active' : ''}`}
                onClick={() => setActiveReport('revenue')}
              >
                <CurrencyExchange className="me-2" /> Revenue Report
              </button>
            </li>
          </ul>
          
          {/* Filters Section */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Date Range</label>
                  <select 
                    className="form-select"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                
                <div className="col-md-3">
                  <label className="form-label">Branch</label>
                  <select 
                    className="form-select"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                    <option value="all">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-3">
                  <label className="form-label">
                    {activeReport === 'sales' ? 'Product/Service' : 'Revenue Source'}
                  </label>
                  <select className="form-select">
                    <option value="all">All</option>
                    {products.map(product => (
                      <option key={product} value={product}>{product}</option>
                    ))}
                  </select>
                </div>
                
                {activeReport === 'sales' && (
                  <div className="col-md-3">
                    <label className="form-label">Staff</label>
                    <select className="form-select">
                      <option value="all">All Staff</option>
                      {staff.map(staff => (
                        <option key={staff} value={staff}>{staff}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {activeReport === 'sales' && (
                  <div className="col-md-3">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select">
                      <option value="all">All Methods</option>
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {dateRange === 'custom' && (
                  <>
                    <div className="col-md-3">
                      <label className="form-label">Start Date</label>
                      <input type="date" className="form-control" />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">End Date</label>
                      <input type="date" className="form-control" />
                    </div>
                  </>
                )}
                
                <div className="col-md-3 align-self-end">
                  <button className="btn btn-outline-light w-100" style={{ backgroundColor: '#2f6a87', color: '#fff' }}>
                    <Filter className="me-2" /> Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="row mb-4">
            {activeReport === 'sales' ? (
              <>
                <div className="col-md-3">
                  <div className="card bg-primary bg-opacity-10 text-primary border-0">
                    <div className="card-body">
                      <h6 className="card-title text-dark">Total Sales</h6>
                      <h3 className="card-text">${salesData.totalSales.toLocaleString()}</h3>
                      <div className="d-flex align-items-center text-dark">
                        <ArrowUpRight className="me-1 " />
                        <small>+5.2% from last period</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-success bg-opacity-10 text-success border-0">
                    <div className="card-body">
                      <h6 className="card-title text-dark">Transactions</h6>
                      <h3 className="card-text">{salesData.transactions}</h3>
                      <div className="d-flex align-items-center text-dark">
                        <ArrowUpRight className="me-1" />
                        <small>+8.7% from last period</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-info bg-opacity-10 text-info border-0">
                    <div className="card-body">
                      <h6 className="card-title text-dark">Avg Order Value</h6>
                      <h3 className="card-text">${salesData.avgOrderValue}</h3>
                      <div className="d-flex align-items-center text-dark">
                        <ArrowUpRight className="me-1" />
                        <small>+2.3% from last period</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-warning bg-opacity-10 text-dark">
                    <div className="card-body">
                      <h6 className="card-title ">Top Product</h6>
                      <h5 className="card-text text-warning">{salesData.topProduct}</h5>
                      <div className="d-flex align-items-center">
                        <GraphUp className="me-1" />
                        <small>15% of total sales</small>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="col-md-3">
                  <div className="card bg-primary bg-opacity-10 text-dark">
                    <div className="card-body">
                      <h6 className="card-title">Total Revenue</h6>
                      <h3 className="card-text text-primary">${revenueData.totalRevenue.toLocaleString()}</h3>
                      <div className="d-flex align-items-center">
                        <ArrowUpRight className="me-1" />
                        <small>+{revenueData.revenueGrowth}% from last period</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-success bg-opacity-10 text-dark">
                    <div className="card-body">
                      <h6 className="card-title">Revenue Growth</h6>
                      <h3 className="card-text text-success">+{revenueData.revenueGrowth}%</h3>
                      <div className="d-flex align-items-center">
                        <GraphUp className="me-1" />
                        <small>Industry avg: +8.2%</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-info bg-opacity-10 text-dark">
                    <div className="card-body">
                      <h6 className="card-title">Highest Earning Branch</h6>
                      <h5 className="card-text text-info">{revenueData.highestEarningBranch}</h5>
                      <div className="d-flex align-items-center">
                        <Building className="me-1" />
                        <small>$78,500 revenue</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-warning bg-opacity-10 text-dark">
                    <div className="card-body">
                      <h6 className="card-title">Profit Margin</h6>
                      <h3 className="card-text text-warning">26.4%</h3>
                      <div className="d-flex align-items-center">
                        <ArrowUpRight className="me-1" />
                        <small>+3.2% from last quarter</small>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Charts Section */}
          <div className="row mb-4">
            <div className="col-md-8">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    {activeReport === 'sales' ? 'Sales Trend' : 'Revenue by Branch'}
                  </h5>
                  <div className="dropdown">
                    <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                      Options
                    </button>
                    <ul className="dropdown-menu">
                      <li><a className="dropdown-item" href="#">View Data</a></li>
                      <li><a className="dropdown-item" href="#">Export Chart</a></li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  {activeReport === 'sales' ? renderSalesTrendChart() : renderRevenueByBranchChart()}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    {activeReport === 'sales' ? 'Sales by Category' : 'Revenue Sources'}
                  </h5>
                  <div className="dropdown">
                    <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                      Options
                    </button>
                    <ul className="dropdown-menu">
                      <li><a className="dropdown-item" href="#">View Data</a></li>
                      <li><a className="dropdown-item" href="#">Export Chart</a></li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  {activeReport === 'sales' ? renderSalesByCategoryChart() : renderRevenueSourcesChart()}
                </div>
              </div>
            </div>
          </div>
          
          {/* Data Table */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {activeReport === 'sales' ? 'Sales Transactions' : 'Branch Performance'}
              </h5>
              <div className="d-flex">
                <div className="input-group me-2" style={{width: '250px'}}>
                  <span className="input-group-text"><Search /></span>
                  <input type="text" className="form-control" placeholder="Search..." />
                </div>
                <div className="dropdown me-2">
                  <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <Download className="me-1" /> Export
                  </button>
                  <ul className="dropdown-menu">
                    <li><a className="dropdown-item" href="#">PDF</a></li>
                    <li><a className="dropdown-item" href="#">Excel</a></li>
                    <li><a className="dropdown-item" href="#">CSV</a></li>
                  </ul>
                </div>
                <button className="btn btn-outline-primary">
                  <Envelope className="me-1" /> Email Report
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      {activeReport === 'sales' ? (
                        <>
                          <th>Invoice ID</th>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Product/Service</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Payment Method</th>
                          <th>Staff</th>
                          <th>Branch</th>
                          <th>Actions</th>
                        </>
                      ) : (
                        <>
                          <th>Branch Name</th>
                          <th>Revenue</th>
                          <th>Expenses</th>
                          <th>Net Profit</th>
                          <th>Contribution %</th>
                          <th>Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeReport === 'sales' ? (
                      salesTransactions.map(transaction => (
                        <tr key={transaction.id}>
                          <td>{transaction.id}</td>
                          <td>{transaction.date}</td>
                          <td>{transaction.customer}</td>
                          <td>{transaction.product}</td>
                          <td>{transaction.qty}</td>
                          <td>${transaction.price.toLocaleString()}</td>
                          <td>{transaction.payment}</td>
                          <td>{transaction.staff}</td>
                          <td>{transaction.branch}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" title="View Invoice">
                              <Eye size={14} />
                            </button>
                            <button className="btn btn-sm btn-outline-success" title="Download Invoice">
                              <Download size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      branchRevenues.map(branch => (
                        <tr key={branch.name}>
                          <td>
                            <button 
                              className="btn btn-sm btn-link p-0 text-primary"
                              title="Drill down to branch details"
                            >
                              {branch.name}
                            </button>
                          </td>
                          <td>${branch.revenue.toLocaleString()}</td>
                          <td>${branch.expenses.toLocaleString()}</td>
                          <td>${branch.profit.toLocaleString()}</td>
                          <td>{branch.contribution}%</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" title="View Details">
                              <Eye size={14} />
                            </button>
                            <button className="btn btn-sm btn-outline-success" title="Download Report">
                              <Download size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer d-flex justify-content-between align-items-center">
              <div>Showing 1 to 5 of 120 entries</div>
              <nav>
                <ul className="pagination mb-0">
                  <li className="page-item disabled">
                    <a className="page-link" href="#">Previous</a>
                  </li>
                  <li className="page-item active">
                    <a className="page-link" href="#">1</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">2</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">3</a>
                  </li>
                  <li className="page-item">
                    <a className="page-link" href="#">Next</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;