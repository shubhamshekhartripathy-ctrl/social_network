const express = require('express');
const cors = require('cors');
const { SocialNetwork } = require('./SocialNetwork');

const app = express();
app.use(cors());
app.use(express.json());

const net = new SocialNetwork();

function seedData(network) {
    console.log('Seeding data into JS Social Network...');
    network.addUser("alice", "Alice Smith");
    network.addUser("bob", "Bob Johnson");
    network.addUser("charlie", "Charlie Brown");
    network.addUser("david", "David Miller");
    network.addUser("eve", "Eve Davis");
    network.addUser("frank", "Frank Wright");
    network.addUser("grace", "Grace Hopper");
    network.addUser("helen", "Helen Keller");

    network.addFriendship("alice", "bob");
    network.addFriendship("alice", "charlie");
    network.addFriendship("bob", "david");
    network.addFriendship("charlie", "david");
    network.addFriendship("bob", "eve");
    network.addFriendship("eve", "frank");
    network.addFriendship("frank", "grace");

    const baseTime = Date.now();
    network.createPostWithTimestamp("alice", "Just joined this new network! So cool", baseTime - 500000);
    network.createPostWithTimestamp("bob", "Hey everyone, Bob here. Node.js rules the world!", baseTime - 400000);
    network.createPostWithTimestamp("charlie", "Beautiful sunny day today. Perfect for code review.", baseTime - 350000);
    network.createPostWithTimestamp("david", "Studying for my algorithms final exam. BFS is neat.", baseTime - 100000);
}

seedData(net);

// REST API Endpoints

app.get('/api/users', (req, res) => {
    try {
        const users = net.getAllUsers();
        const data = users.map(u => ({
            username: u.username,
            displayName: u.displayName,
            friends: Array.from(u.friends)
        }));
        res.json({ type: 'USERS', data });
    } catch (e) {
        res.status(500).json({ error: 'Engine error' });
    }
});

app.get('/api/feed/:username', (req, res) => {
    try {
        const feed = net.getFeed(req.params.username);
        const data = feed.map(p => ({
            id: p.id,
            authorId: p.authorId,
            content: p.content,
            timestamp: p.timestamp
        }));
        res.json({ type: 'FEED', data });
    } catch (e) {
        res.status(500).json({ error: 'Engine error' });
    }
});

app.get('/api/path/:u1/:u2', (req, res) => {
    try {
        const u1 = req.params.u1;
        const u2 = req.params.u2;
        const degrees = net.getDegreesOfSeparation(u1, u2);
        let path = [];
        if (degrees !== -1) {
            path = net.getPathOfSeparation(u1, u2);
        }
        res.json({ type: 'PATH', data: { degrees, path } });
    } catch (e) {
        res.status(500).json({ error: 'Engine error' });
    }
});

app.get('/api/recommendations/:username', (req, res) => {
    try {
        const recs = net.getRecommendations(req.params.username);
        const data = recs.map(r => {
            const u = net.getUser(r[0]);
            return {
                username: r[0],
                mutuals: r[1],
                displayName: u ? u.displayName : ''
            };
        });
        res.json({ type: 'REC', data });
    } catch (e) {
        res.status(500).json({ error: 'Engine error' });
    }
});

app.post('/api/friends', (req, res) => {
    const { u1, u2 } = req.body;
    try {
        const success = net.addFriendship(u1, u2);
        if (success) {
            res.json({ type: 'SUCCESS' });
        } else {
            res.json({ type: 'ERROR', message: 'Could not add friend (already friends or invalid).' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Engine error' });
    }
});

app.post('/api/posts', (req, res) => {
    const { username, content } = req.body;
    try {
        const success = net.createPost(username, content);
        if (success) {
            res.json({ type: 'SUCCESS' });
        } else {
            res.json({ type: 'ERROR', message: 'User not found.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Engine error' });
    }
});

app.post('/api/users', (req, res) => {
    const { username, displayName } = req.body;
    try {
        const success = net.addUser(username, displayName);
        if (success) {
            res.json({ type: 'SUCCESS' });
        } else {
            res.json({ type: 'ERROR', message: 'Username already exists or is invalid.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Engine error' });
    }
});

app.delete('/api/users/:username', (req, res) => {
    try {
        const success = net.removeUser(req.params.username);
        if (success) {
            res.json({ type: 'SUCCESS' });
        } else {
            res.json({ type: 'ERROR', message: 'User not found.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Engine error' });
    }
});

app.delete('/api/friends', (req, res) => {
    const { u1, u2 } = req.body;
    try {
        const success = net.removeFriendship(u1, u2);
        if (success) {
            res.json({ type: 'SUCCESS' });
        } else {
            res.json({ type: 'ERROR', message: 'Could not remove friendship (not friends or user invalid).' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Engine error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Pure JS Backend running on http://localhost:${PORT}`);
});
