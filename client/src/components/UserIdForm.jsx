import { useState } from 'react';

function UserIdForm({ onSubmit }) {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }
    
    onSubmit(userId);
  };

  const handleChange = (e) => {
    setError('');
    setUserId(e.target.value);
  };
  
  return (
    <div className="form-container">
      <h2>Enter User ID</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userId">User ID:</label>
          <input 
            type="text" 
            id="userId" 
            value={userId}
            onChange={handleChange}
            placeholder="Enter your user ID"
            autoFocus
          />
          {error && <p className="error">{error}</p>}
        </div>
        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
}

export default UserIdForm;