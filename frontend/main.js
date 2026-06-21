const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let users = [];
let currentUser = 'alice'; // Default

// DOM Elements
const usersList = document.getElementById('usersList');
const feedList = document.getElementById('feedList');
const recsList = document.getElementById('recommendationsList');
const pathResult = document.getElementById('pathResult');
const userSelect = document.getElementById('currentUserSelect');
const pathTargetSelect = document.getElementById('pathTargetSelect');
const postInput = document.getElementById('postInput');
const postBtn = document.getElementById('postBtn');
const pathBtn = document.getElementById('pathBtn');
const feedTitle = document.getElementById('feedTitle');
const regUsername = document.getElementById('regUsername');
const regDisplay = document.getElementById('regDisplay');
const registerBtn = document.getElementById('registerBtn');
const deleteUserBtn = document.getElementById('deleteUserBtn');
const globalAddFriendSelect = document.getElementById('globalAddFriendSelect');
const globalAddFriendBtn = document.getElementById('globalAddFriendBtn');

// Initial Load
async function init() {
    await fetchUsers();
    setupEventListeners();
    refreshDashboard();
}

// Fetch all users
async function fetchUsers() {
    try {
        const res = await fetch(`${API_URL}/users`);
        const data = await res.json();
        if (data.type === 'USERS') {
            users = data.data;
            renderUsers();
            populateSelects();
        }
    } catch (e) {
        console.error('Failed to fetch users', e);
    }
}

// Render left sidebar
function renderUsers() {
    usersList.innerHTML = '';
    users.forEach(u => {
        const li = document.createElement('li');
        li.className = 'user-card';
        const isCurrent = u.username === currentUser;
        if (isCurrent) li.style.borderColor = 'var(--accent-color)';
        
        let friendsHtml = u.friends.length === 0 ? '<span class="user-friends">Friends: None</span>' : '<span class="user-friends">Friends:</span> <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">';
        
        if (u.friends.length > 0) {
            u.friends.forEach(f => {
                friendsHtml += `<span style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-size:0.8rem;">
                    @${f}
                    ${isCurrent ? `<button class="unfriend-btn" data-target="${f}" style="background:none;border:none;color:#ef4444;cursor:pointer;margin-left:4px;" title="Unfriend">x</button>` : ''}
                </span>`;
            });
            friendsHtml += '</div>';
        }

        li.innerHTML = `
            <span class="user-name">${u.displayName}</span>
            <span class="user-handle">@${u.username}</span>
            ${friendsHtml}
        `;
        usersList.appendChild(li);
    });

    // Attach unfriend listeners
    document.querySelectorAll('.unfriend-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            await removeFriend(target);
        });
    });
}

function populateSelects() {
    userSelect.innerHTML = '';
    pathTargetSelect.innerHTML = '';
    globalAddFriendSelect.innerHTML = '';
    
    const currentUData = users.find(u => u.username === currentUser);
    const existingFriends = currentUData ? currentUData.friends : [];

    users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.username;
        opt.textContent = `${u.displayName} (@${u.username})`;
        if (u.username === currentUser) opt.selected = true;
        userSelect.appendChild(opt);

        const opt2 = document.createElement('option');
        opt2.value = u.username;
        opt2.textContent = `@${u.username}`;
        pathTargetSelect.appendChild(opt2);
        
        if (u.username !== currentUser && !existingFriends.includes(u.username)) {
            const opt3 = document.createElement('option');
            opt3.value = u.username;
            opt3.textContent = `@${u.username}`;
            globalAddFriendSelect.appendChild(opt3);
        }
    });
    
    if (globalAddFriendSelect.options.length === 0) {
        globalAddFriendSelect.innerHTML = '<option value="">No eligible users</option>';
        globalAddFriendBtn.disabled = true;
    } else {
        globalAddFriendBtn.disabled = false;
    }
}

// Fetch Feed
async function fetchFeed() {
    feedList.innerHTML = '<p style="color:var(--text-muted)">Loading timeline...</p>';
    feedTitle.textContent = `Home Feed for @${currentUser}`;
    try {
        const res = await fetch(`${API_URL}/feed/${currentUser}`);
        const data = await res.json();
        if (data.type === 'FEED') {
            feedList.innerHTML = '';
            if (data.data.length === 0) {
                feedList.innerHTML = '<p style="color:var(--text-muted)">Feed is empty.</p>';
                return;
            }
            data.data.forEach(post => {
                const date = new Date(post.timestamp).toLocaleString();
                const div = document.createElement('div');
                div.className = 'post-card';
                div.innerHTML = `
                    <div class="post-header">
                        <span class="post-author">@${post.authorId}</span>
                        <span class="post-time">${date}</span>
                    </div>
                    <div class="post-content">${post.content}</div>
                `;
                feedList.appendChild(div);
            });
        }
    } catch (e) {
        console.error('Failed to fetch feed', e);
    }
}

// Fetch Recommendations
async function fetchRecommendations() {
    recsList.innerHTML = '<p style="color:var(--text-muted)">Analyzing graph...</p>';
    try {
        const res = await fetch(`${API_URL}/recommendations/${currentUser}`);
        const data = await res.json();
        if (data.type === 'REC') {
            recsList.innerHTML = '';
            if (data.data.length === 0) {
                recsList.innerHTML = '<p style="color:var(--text-muted)">No recommendations available.</p>';
                return;
            }
            data.data.forEach(r => {
                const li = document.createElement('li');
                li.className = 'rec-card';
                li.innerHTML = `
                    <div class="rec-info">
                        <div class="name">${r.displayName}</div>
                        <div class="handle">@${r.username}</div>
                    </div>
                    <div>
                        <span class="rec-score" title="Mutual Friends">${r.mutuals}</span>
                        <button class="add-friend-btn" data-target="${r.username}">+</button>
                    </div>
                `;
                recsList.appendChild(li);
            });

            // Add friend events
            document.querySelectorAll('.add-friend-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const target = e.target.getAttribute('data-target');
                    await addFriend(target);
                });
            });
        }
    } catch (e) {
        console.error('Failed to fetch recs', e);
    }
}

// Add Friend API
async function addFriend(targetUser) {
    try {
        const res = await fetch(`${API_URL}/friends`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ u1: currentUser, u2: targetUser })
        });
        await res.json();
        await fetchUsers(); // Re-fetch graph
        refreshDashboard();
    } catch (e) {
        console.error('Failed to add friend', e);
    }
}

// Remove Friend API
async function removeFriend(targetUser) {
    try {
        const res = await fetch(`${API_URL}/friends`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ u1: currentUser, u2: targetUser })
        });
        await res.json();
        await fetchUsers();
        refreshDashboard();
    } catch (e) {
        console.error('Failed to remove friend', e);
    }
}

// Fetch Path (Degrees of separation)
async function fetchPath() {
    const target = pathTargetSelect.value;
    if (target === currentUser) {
        pathResult.innerHTML = `<span style="color:var(--success)">You are already @${currentUser}!</span>`;
        return;
    }
    
    pathResult.innerHTML = '<span style="color:var(--text-muted)">Computing...</span>';
    try {
        const res = await fetch(`${API_URL}/path/${currentUser}/${target}`);
        const data = await res.json();
        if (data.type === 'PATH') {
            const d = data.data;
            if (d.degrees === -1) {
                pathResult.innerHTML = `<span style="color:var(--text-muted)">No path exists. Disconnected.</span>`;
            } else {
                let html = `<div style="margin-bottom:8px">Degrees: <span style="color:var(--accent-hover);font-weight:bold">${d.degrees}</span></div>`;
                html += d.path.map(u => `<span class="path-node">@${u}</span>`).join('<span class="path-arrow">→</span>');
                pathResult.innerHTML = html;
            }
        }
    } catch (e) {
        console.error('Failed to fetch path', e);
    }
}

// Post Content API
async function submitPost() {
    const text = postInput.value.trim();
    if (!text) return;
    
    try {
        await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser, content: text })
        });
        postInput.value = '';
        fetchFeed(); // Refresh feed immediately
    } catch (e) {
        console.error('Failed to submit post', e);
    }
}

// Register User API
async function registerUser() {
    const un = regUsername.value.trim().replace(/\s/g, '');
    const disp = regDisplay.value.trim();
    if (!un || !disp) return alert('Provide both username and display name');
    
    try {
        const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: un, displayName: disp })
        });
        const data = await res.json();
        if (data.type === 'ERROR') return alert(data.message);
        
        regUsername.value = '';
        regDisplay.value = '';
        await fetchUsers();
        currentUser = un;
        userSelect.value = un;
        renderUsers();
        refreshDashboard();
    } catch (e) {
        console.error('Failed to register', e);
    }
}

// Delete User API
async function deleteUser() {
    if (!confirm(`Are you sure you want to permanently delete @${currentUser} and all their friendships?`)) return;
    try {
        const res = await fetch(`${API_URL}/users/${currentUser}`, {
            method: 'DELETE'
        });
        await res.json();
        await fetchUsers();
        if (users.length > 0) {
            currentUser = users[0].username;
        } else {
            currentUser = '';
            feedList.innerHTML = '';
            recsList.innerHTML = '';
        }
        renderUsers();
        refreshDashboard();
    } catch (e) {
        console.error('Failed to delete', e);
    }
}

function refreshDashboard() {
    if (!currentUser) return;
    fetchFeed();
    fetchRecommendations();
    pathResult.innerHTML = 'Select a user and find path.';
}

function setupEventListeners() {
    userSelect.addEventListener('change', (e) => {
        currentUser = e.target.value;
        renderUsers();
        refreshDashboard();
    });

    postBtn.addEventListener('click', submitPost);
    pathBtn.addEventListener('click', fetchPath);
    registerBtn.addEventListener('click', registerUser);
    deleteUserBtn.addEventListener('click', deleteUser);
    globalAddFriendBtn.addEventListener('click', async () => {
        const target = globalAddFriendSelect.value;
        if (target) {
            await addFriend(target);
        }
    });
}

// Boot
init();
