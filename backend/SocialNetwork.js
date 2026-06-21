class Post {
    constructor(id, authorId, content, timestamp) {
        this.id = id;
        this.authorId = authorId;
        this.content = content;
        this.timestamp = timestamp;
    }
}

class AVLNode {
    constructor(post) {
        this.post = post;
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
    }

    height(node) {
        return node ? node.height : 0;
    }

    getBalance(node) {
        return node ? this.height(node.left) - this.height(node.right) : 0;
    }

    updateHeight(node) {
        if (node) {
            node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
        }
    }

    rightRotate(y) {
        let x = y.left;
        let T2 = x.right;

        x.right = y;
        y.left = T2;

        this.updateHeight(y);
        this.updateHeight(x);

        return x;
    }

    leftRotate(x) {
        let y = x.right;
        let T2 = y.left;

        y.left = x;
        x.right = T2;

        this.updateHeight(x);
        this.updateHeight(y);

        return y;
    }

    isLessThan(a, b) {
        if (a.timestamp !== b.timestamp) {
            return a.timestamp < b.timestamp;
        }
        return a.id < b.id;
    }

    _insert(node, post) {
        if (!node) {
            return new AVLNode(post);
        }

        if (this.isLessThan(post, node.post)) {
            node.left = this._insert(node.left, post);
        } else {
            node.right = this._insert(node.right, post);
        }

        this.updateHeight(node);

        let balance = this.getBalance(node);

        // Left Left Case
        if (balance > 1 && this.isLessThan(post, node.left.post)) {
            return this.rightRotate(node);
        }
        // Right Right Case
        if (balance < -1 && !this.isLessThan(post, node.right.post)) {
            return this.leftRotate(node);
        }
        // Left Right Case
        if (balance > 1 && !this.isLessThan(post, node.left.post)) {
            node.left = this.leftRotate(node.left);
            return this.rightRotate(node);
        }
        // Right Left Case
        if (balance < -1 && this.isLessThan(post, node.right.post)) {
            node.right = this.rightRotate(node.right);
            return this.leftRotate(node);
        }

        return node;
    }

    insert(post) {
        this.root = this._insert(this.root, post);
    }

    _inorder(node, posts) {
        if (node) {
            this._inorder(node.left, posts);
            posts.push(node.post);
            this._inorder(node.right, posts);
        }
    }

    _reverseInorder(node, posts) {
        if (node) {
            this._reverseInorder(node.right, posts);
            posts.push(node.post);
            this._reverseInorder(node.left, posts);
        }
    }

    getChronological() {
        let posts = [];
        this._inorder(this.root, posts);
        return posts;
    }

    getReverseChronological() {
        let posts = [];
        this._reverseInorder(this.root, posts);
        return posts;
    }

    clear() {
        this.root = null;
    }
}

class User {
    constructor(username, displayName) {
        this.username = username;
        this.displayName = displayName;
        this.friends = new Set();
        this.posts = new AVLTree();
    }

    addFriend(friendUsername) {
        if (friendUsername === this.username) return false;
        if (this.friends.has(friendUsername)) return false;
        this.friends.add(friendUsername);
        return true;
    }

    removeFriend(friendUsername) {
        return this.friends.delete(friendUsername);
    }

    addPost(post) {
        this.posts.insert(post);
    }

    getTimeline(reverse = true) {
        return reverse ? this.posts.getReverseChronological() : this.posts.getChronological();
    }
}

class SocialNetwork {
    constructor() {
        this.users = new Map();
        this.postCounter = 0;
    }

    addUser(username, displayName) {
        if (!username || this.users.has(username)) return false;
        this.users.set(username, new User(username, displayName));
        return true;
    }

    removeUser(username) {
        if (!this.users.has(username)) return false;
        const target = this.users.get(username);
        for (const friendUname of target.friends) {
            const f = this.users.get(friendUname);
            if (f) f.removeFriend(username);
        }
        this.users.delete(username);
        return true;
    }

    hasUser(username) {
        return this.users.has(username);
    }

    getUser(username) {
        return this.users.get(username);
    }

    getAllUsers() {
        let allUsers = Array.from(this.users.values());
        allUsers.sort((a, b) => a.username.localeCompare(b.username));
        return allUsers;
    }

    addFriendship(username1, username2) {
        if (username1 === username2) return false;
        const u1 = this.getUser(username1);
        const u2 = this.getUser(username2);
        if (!u1 || !u2) return false;

        const added1 = u1.addFriend(username2);
        const added2 = u2.addFriend(username1);
        return added1 && added2;
    }

    removeFriendship(username1, username2) {
        const u1 = this.getUser(username1);
        const u2 = this.getUser(username2);
        if (!u1 || !u2) return false;

        const removed1 = u1.removeFriend(username2);
        const removed2 = u2.removeFriend(username1);
        return removed1 && removed2;
    }

    getDegreesOfSeparation(startUser, endUser) {
        if (startUser === endUser) return 0;
        if (!this.hasUser(startUser) || !this.hasUser(endUser)) return -1;

        let distance = new Map();
        let q = [];

        distance.set(startUser, 0);
        q.push(startUser);

        let head = 0;
        while (head < q.length) {
            let current = q[head++];
            if (current === endUser) {
                return distance.get(current);
            }

            const u = this.getUser(current);
            if (u) {
                for (const friendUname of u.friends) {
                    if (!distance.has(friendUname)) {
                        distance.set(friendUname, distance.get(current) + 1);
                        q.push(friendUname);
                    }
                }
            }
        }
        return -1;
    }

    getPathOfSeparation(startUser, endUser) {
        let path = [];
        if (!this.hasUser(startUser) || !this.hasUser(endUser)) return path;
        if (startUser === endUser) return [startUser];

        let parent = new Map();
        let q = [];
        let visited = new Set();

        visited.add(startUser);
        q.push(startUser);

        let found = false;
        let head = 0;
        while (head < q.length) {
            let current = q[head++];
            if (current === endUser) {
                found = true;
                break;
            }

            const u = this.getUser(current);
            if (u) {
                for (const friendUname of u.friends) {
                    if (!visited.has(friendUname)) {
                        visited.add(friendUname);
                        parent.set(friendUname, current);
                        q.push(friendUname);
                    }
                }
            }
        }

        if (found) {
            let curr = endUser;
            while (curr !== startUser) {
                path.push(curr);
                curr = parent.get(curr);
            }
            path.push(startUser);
            path.reverse();
        }
        return path;
    }

    getRecommendations(username) {
        const target = this.getUser(username);
        if (!target) return [];

        const targetFriends = target.friends;
        let mutualCounts = new Map();

        for (const friendUname of targetFriends) {
            const f = this.getUser(friendUname);
            if (f) {
                for (const fof of f.friends) {
                    if (fof === username) continue;
                    if (targetFriends.has(fof)) continue;
                    
                    mutualCounts.set(fof, (mutualCounts.get(fof) || 0) + 1);
                }
            }
        }

        let recommendations = Array.from(mutualCounts.entries());
        recommendations.sort((a, b) => {
            if (a[1] !== b[1]) {
                return b[1] - a[1];
            }
            return a[0].localeCompare(b[0]);
        });

        return recommendations;
    }

    getFeed(username) {
        const target = this.getUser(username);
        if (!target) return [];

        let feed = [...target.getTimeline(true)];

        for (const friendUname of target.friends) {
            const f = this.getUser(friendUname);
            if (f) {
                feed.push(...f.getTimeline(true));
            }
        }

        feed.sort((a, b) => {
            if (a.timestamp !== b.timestamp) {
                return b.timestamp - a.timestamp;
            }
            return a.id > b.id ? -1 : (a.id < b.id ? 1 : 0);
        });

        return feed;
    }

    createPost(username, content) {
        const timestamp = Date.now();
        return this.createPostWithTimestamp(username, content, timestamp);
    }

    createPostWithTimestamp(username, content, timestamp) {
        const u = this.getUser(username);
        if (!u) return false;

        this.postCounter++;
        const pid = `post_${username}_${timestamp}_${this.postCounter}`;
        const p = new Post(pid, username, content, timestamp);
        u.addPost(p);
        return true;
    }
}

module.exports = { SocialNetwork, User, Post };
