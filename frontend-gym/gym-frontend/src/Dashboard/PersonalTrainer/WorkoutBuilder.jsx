import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell, faPlus, faTrash, faSave, faUser } from '@fortawesome/free-solid-svg-icons';

const predefinedExercises = [
  "Pushups",
  "Squats",
  "Deadlift",
  "Bench Press",
  "Pull-ups",
  "Lunges",
  "Plank",
  "Bicep Curls",
  "Tricep Dips",
  "Leg Press",
  "Shoulder Press",
  "Other"
];

const WorkoutBuilder = () => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([
    { name: '', customName: '', reps: '', sets: '', notes: '' }
  ]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const branchId = user.branchId;

  // Fetch members for assignment
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await axiosInstance.get(`/members/branch/${branchId}`);
        if (res.data.success) {
          setMembers(res.data.items || []);
        }
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };
    if (branchId) fetchMembers();
  }, [branchId]);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', customName: '', reps: '', sets: '', notes: '' }]);
  };

  const handleRemoveExercise = (index) => {
    const updated = exercises.filter((_, i) => i !== index);
    setExercises(updated);
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    if (field === 'name' && value !== 'Other') {
      updated[index].customName = '';
    }
    setExercises(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return alert("Please enter a title for the workout plan.");
    if (!selectedMember) return alert("Please select a member to assign this workout to.");
    
    const formattedExercises = exercises.map(ex => ({
      name: ex.name === 'Other' ? ex.customName : ex.name,
      reps: parseInt(ex.reps) || 0,
      sets: parseInt(ex.sets) || 0,
      notes: ex.notes
    })).filter(ex => ex.name.trim() !== '');

    if (formattedExercises.length === 0) return alert("Please add at least one valid exercise.");

    setLoading(true);
    try {
      // 1. Create Workout Plan
      const payload = {
        title,
        notes,
        branchId,
        createdBy: user.id,
        exercises: formattedExercises
      };
      
      const createRes = await axiosInstance.post('/workout/create', payload);
      const workoutPlanId = createRes.data.data?.id;

      if (!workoutPlanId) throw new Error("Failed to create workout plan.");

      // 2. Assign to member
      await axiosInstance.post('/workout/assign', {
        memberId: selectedMember,
        workoutPlanId
      });

      alert("Workout plan created and assigned successfully!");
      // Reset form
      setTitle('');
      setNotes('');
      setExercises([{ name: '', customName: '', reps: '', sets: '', notes: '' }]);
      setSelectedMember('');
    } catch (err) {
      console.error("Error saving workout:", err);
      alert(err.response?.data?.message || "Failed to save workout plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex align-items-center mb-4">
        <FontAwesomeIcon icon={faDumbbell} className="fs-3 text-primary me-3" />
        <div>
          <h2 className="mb-0 fw-bold text-dark">Workout Builder</h2>
          <p className="text-muted mb-0">Create and assign customized exercise routines.</p>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Plan Details</h5>
              
              <div className="mb-3">
                <label className="form-label fw-semibold">Workout Title <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g., Full Body Strength - Week 1" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">General Notes</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  placeholder="e.g., Rest 60s between sets, focus on form."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <h5 className="fw-bold mb-3">Exercises</h5>
              
              {exercises.map((ex, index) => (
                <div key={index} className="card bg-light border-0 mb-3 rounded-3 position-relative">
                  <div className="card-body p-3">
                    {exercises.length > 1 && (
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2 border-0" 
                        onClick={() => handleRemoveExercise(index)}
                        title="Remove Exercise"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                    
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-muted">Exercise Name</label>
                        <select 
                          className="form-select" 
                          value={ex.name} 
                          onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                        >
                          <option value="">Select Exercise...</option>
                          {predefinedExercises.map((name, i) => (
                            <option key={i} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-muted">Sets</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="e.g., 3" 
                          value={ex.sets}
                          onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                          min="0"
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-muted">Reps</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="e.g., 12" 
                          value={ex.reps}
                          onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                          min="0"
                        />
                      </div>

                      {ex.name === 'Other' && (
                        <div className="col-md-12">
                          <label className="form-label small fw-semibold text-muted">Specify Custom Exercise</label>
                          <input 
                            type="text" 
                            className="form-control border-primary" 
                            placeholder="What type of exercise? Explain." 
                            value={ex.customName}
                            onChange={(e) => handleExerciseChange(index, 'customName', e.target.value)}
                          />
                        </div>
                      )}

                      <div className="col-md-12">
                        <label className="form-label small fw-semibold text-muted">Trainer Notes / Form Tips</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g., Keep back straight" 
                          value={ex.notes}
                          onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                type="button" 
                className="btn btn-outline-primary mt-2" 
                onClick={handleAddExercise}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Another Exercise
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm rounded-4 sticky-top" style={{ top: '20px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 d-flex align-items-center">
                <FontAwesomeIcon icon={faUser} className="me-2 text-primary" /> Assignment
              </h5>
              
              <div className="mb-4">
                <label className="form-label fw-semibold">Assign to Member <span className="text-danger">*</span></label>
                <select 
                  className="form-select" 
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  <option value="">-- Select a Member --</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>{member.fullName} ({member.phone})</option>
                  ))}
                </select>
                <div className="form-text mt-2">
                  The selected member will receive this routine in their "My Workouts" dashboard.
                </div>
              </div>

              <div className="d-grid mt-4">
                <button 
                  className="btn btn-primary btn-lg" 
                  onClick={handleSubmit} 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : (
                    <FontAwesomeIcon icon={faSave} className="me-2" />
                  )}
                  {loading ? 'Saving...' : 'Save & Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutBuilder;
