import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaEdit, FaTrashAlt, FaEye } from "react-icons/fa";

const Groups = () => {
  // seed groups
  const [groups, setGroups] = useState([
    { id: 1, name: "Aerobics", total: 1, photo: "" },
    { id: 2, name: "Body Building", total: 3, photo: "" },
    { id: 3, name: "General Training", total: 1, photo: "" },
    { id: 4, name: "Weight Gain", total: 0, photo: "" },
    { id: 5, name: "Weight Loss", total: 1, photo: "" },
    { id: 6, name: "Yoga", total: 1, photo: "" },
  ]);

  // ui state
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);

  // modals
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [selected, setSelected] = useState(null);

  // add form
  const [formName, setFormName] = useState("");
  const [formImage, setFormImage] = useState(null);
  const [preview, setPreview] = useState("");

  // edit form
  const [editName, setEditName] = useState("");
  const [editPreview, setEditPreview] = useState("");

  useEffect(() => {
    if (showAdd || showView || showEdit || showDelete) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => (document.body.style.overflow = "unset");
  }, [showAdd, showView, showEdit, showDelete]);

  // list logic
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let data = groups.filter(
      (g) => g.name.toLowerCase().includes(q) || String(g.total).includes(q)
    );
    data = data.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortAsc ? cmp : -cmp;
    });
    return data;
  }, [groups, search, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  useEffect(() => {
    // keep page valid when search/perPage changes
    setPage(1);
  }, [search, perPage]);

  // helpers
  const placeholder = (name) => (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 4,
        background: "#e9ecef",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        color: "#6c757d",
        border: "1px solid #dee2e6",
      }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );

  const openAdd = () => {
    setFormName("");
    setFormImage(null);
    setPreview("");
    setShowAdd(true);
  };

  const handleImageChange = (e, setPrev, setFile) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPrev(String(reader.result));
    reader.readAsDataURL(f);
  };

  const saveGroup = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Group Name is required");
      return;
    }
    setGroups((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1,
        name: formName.trim(),
        total: 0,
        photo: preview, // store dataURL for demo
      },
    ]);
    setShowAdd(false);
  };

  const openView = (g) => {
    setSelected(g);
    setShowView(true);
  };

  const openEdit = (g) => {
    setSelected(g);
    setEditName(g.name);
    setEditPreview(g.photo || "");
    setShowEdit(true);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    setGroups((prev) =>
      prev.map((g) =>
        g.id === selected.id ? { ...g, name: editName.trim(), photo: editPreview } : g
      )
    );
    setShowEdit(false);
    setSelected(null);
  };

  const openDelete = (g) => {
    setSelected(g);
    setShowDelete(true);
  };

  const confirmDelete = () => {
    setGroups((prev) => prev.filter((g) => g.id !== selected.id));
    setShowDelete(false);
    setSelected(null);
  };

  return (
    <div className="">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0 fw-bold">Group List
        </h4>
      
        <button className="btn  ms-2" onClick={openAdd}  style={{
                          backgroundColor: '#2F6A87',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 20px',
                          fontWeight: '500',
                        }}>
          Add Group
        </button>
      </div>

      {/* Top toolbar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <div className="d-flex align-items-center gap-2">
          <span>Show</span>
          <select
            className="form-select form-select-sm"
            style={{ width: 80 }}
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
          >
            {[5, 10, 15, 20, 25, 30, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>Entries</span>
        </div>

        <div className="input-group" style={{ maxWidth: 280 }}>
          <span className="input-group-text bg-white border">
            <i className="bi bi-search text-muted" />
          </span>
          <input
            className="form-control"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive border rounded">
        <table className="table mb-0 align-middle">
          <thead>
            <tr className="table-light">
              <th style={{ width: 120 }}>Photo</th>
              <th
                role="button"
                onClick={() => setSortAsc((s) => !s)}
                className="user-select-none"
              >
                Group Name{" "}
                <span style={{ color: "#6c63ff" }}>{sortAsc ? "▲" : "▼"}</span>
              </th>
              <th style={{ width: 200 }}>
                <div className="d-flex align-items-center">
                  <span className="me-1">Total Group Members</span>
                  <span className="text-muted">↕</span>
                </div>
              </th>
              <th style={{ width: 220 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {current.map((g) => (
              <tr key={g.id} className="table-row">
                <td>
                  {g.photo ? (
                    <img
                      src={g.photo}
                      alt={g.name}
                      style={{
                        width: 60,
                        height: 40,
                        objectFit: "cover",
                        border: "1px solid #dee2e6",
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    placeholder(g.name)
                  )}
                </td>
                <td>{g.name}</td>
                <td>{g.total}</td>
               <td>
  <div className="d-flex justify-content-center">
    {/* View */}
    <button
      className="btn btn-sm btn-outline-secondary me-1"
      title="View"
      onClick={() => openView(g)}
    >
      <FaEye size={14} />
    </button>

    {/* Edit */}
    <button
      className="btn btn-sm btn-outline-primary me-1"
      title="Edit"
      onClick={() => openEdit(g)}
    >
      <FaEdit size={14} />
    </button>

    {/* Delete */}
    <button
      className="btn btn-sm btn-outline-danger"
      title="Delete"
      onClick={() => openDelete(g)}
    >
      <FaTrashAlt size={14} />
    </button>
  </div>
</td>

              </tr>
            ))}
            {current.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  No groups found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

     {/* footer/pagination */}
<div className="d-flex flex-wrap align-items-center justify-content-between mt-4">
  <small className="text-muted">
    Showing {filtered.length ? (page - 1) * perPage + 1 : 0} to{" "}
    {Math.min(page * perPage, filtered.length)} of {filtered.length} entries
  </small>

  <div className="btn-group">
    <button
      className="btn btn-outline-secondary btn-sm"
      disabled={page === 1}
      onClick={() => setPage((p) => Math.max(1, p - 1))}
    >
      Previous
    </button>

    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i + 1}
        className={`btn btn-sm ${
          page === i + 1 ? "active-page" : "btn-outline-secondary"
        }`}
        onClick={() => setPage(i + 1)}
      >
        {i + 1}
      </button>
    ))}

    <button
      className="btn btn-outline-secondary btn-sm"
      disabled={page === totalPages}
      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
    >
      Next
    </button>
  </div>
</div>



      {/* ADD GROUP MODAL (matches your second image) */}
      {showAdd && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,.5)" }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
            <div className="modal-header d-flex">
  <h5 className="modal-title">
    <span className="me-2">🖼️</span>Add Group
  </h5>
  <div className="d-flex gap-2 ">
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm"
      onClick={() => setShowAdd(false)}
    >
      ☰ Group List
    </button>
    <button
      type="button"
      className="btn-close"
      aria-label="Close"
      onClick={() => setShowAdd(false)}
    />
  </div>
</div>
              <div className="modal-body">
                <form onSubmit={saveGroup}>
                  <div className="mb-3">
                    <label className="form-label">Group Name *</label>
                    <input
                      className="form-control"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Enter group name"
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Group Image</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(e, setPreview, setFormImage)
                      }
                    />
                  </div>

                  <div className="mb-4">
                    {/* preview box like screenshot */}
                    <img
                      src={
                        preview ||
                        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                      }
                      alt="preview"
                      style={{
                        width: 150,
                        height: 80,
                        objectFit: "cover",
                        border: "1px solid #ced4da",
                        borderRadius: 4,
                        background: "#f8f9fa",
                      }}
                    />
                  </div>

                  <button className="btn"  style={{
                          backgroundColor: '#2F6A87',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 20px',
                          fontWeight: '500',
                        }}>Save Group</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showView && selected && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,.5)" }}
          onClick={() => setShowView(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">View Group</h5>
                <button type="button" className="btn-close" onClick={() => setShowView(false)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <p>
                  <strong>Name:</strong> {selected.name}
                </p>
                <p>
                  <strong>Total Members:</strong> {selected.total}
                </p>
                <div>
                  <strong>Photo:</strong>
                  <div className="mt-2">
                    {selected.photo ? (
                      <img
                        src={selected.photo}
                        alt={selected.name}
                        style={{
                          width: 200,
                          height: 120,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #dee2e6",
                        }}
                      />
                    ) : (
                      placeholder(selected.name)
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowView(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEdit && selected && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,.5)" }}
          onClick={() => setShowEdit(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Edit Group</h5>
                <button className="btn-close" onClick={() => setShowEdit(false)} />
              </div>
              <div className="modal-body">
                <form onSubmit={saveEdit}>
                  <div className="mb-3">
                    <label className="form-label">Group Name</label>
                    <input
                      className="form-control"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Group Image</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageChange(e, setEditPreview, () => {})
                      }
                    />
                  </div>
                  <img
                    src={
                      editPreview ||
                      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                    }
                    alt="preview"
                    style={{
                      width: 150,
                      height: 80,
                      objectFit: "cover",
                      border: "1px solid #ced4da",
                      borderRadius: 4,
                      background: "#f8f9fa",
                    }}
                  />
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowEdit(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-info">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDelete && selected && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,.5)" }}
          onClick={() => setShowDelete(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Confirm Deletion</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowDelete(false)}
                />
              </div>
              <div className="modal-body text-center">
                <div className="display-6 text-danger mb-2">
                  <i className="fas fa-exclamation-triangle" />
                </div>
                <p className="mb-0">
                  This will permanently delete <strong>{selected.name}</strong>.
                </p>
                <small className="text-muted">This action cannot be undone.</small>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowDelete(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default  Groups;