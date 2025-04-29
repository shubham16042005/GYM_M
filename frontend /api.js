const API_URL = '/api'; // Relative path since frontend and backend are on the same domain
let token = localStorage.getItem('token') || '';

function login(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      token = data.token;
      localStorage.setItem('token', data.token);
      alert('Login successful!');
      showView('home');
      e.target.reset();
    })
    .catch(err => alert(err.message));
}

function fetchMembers() {
  fetch(`${API_URL}/members`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(members => {
      if (members.error) throw new Error(members.error);
      const list = document.getElementById('member-list');
      list.innerHTML = '';
      members.forEach(m => {
        const li = document.createElement('li');
        li.innerHTML = `${m.name} - Age: ${m.age} - Plan: ${m.plan} <button onclick="deleteMember('${m._id}')">Delete</button>`;
        list.appendChild(li);
      });
    })
    .catch(err => alert(err.message));
}

function addMember(e) {
  e.preventDefault();
  const name = document.getElementById('member-name').value;
  const age = document.getElementById('member-age').value;
  const plan = document.getElementById('member-plan').value;
  fetch(`${API_URL}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, age, plan })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      alert('Member added!');
      e.target.reset();
      showView('members');
      fetchMembers();
    })
    .catch(err => alert(err.message));
}

function deleteMember(id) {
  if (confirm('Delete this member?')) {
    fetch(`${API_URL}/members/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        alert('Member deleted!');
        fetchMembers();
      })
      .catch(err => alert(err.message));
  }
}

// Override existing functions
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#login form').onsubmit = login;
  document.querySelector('#add-member form').onsubmit = addMember;
  const originalShowView = showView;
  showView = function(viewId) {
    originalShowView(viewId);
    if (viewId === 'members') fetchMembers();
  };
});
