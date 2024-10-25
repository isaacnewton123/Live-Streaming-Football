const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

const commentsFile = path.join(__dirname, 'comments.json');
const votesFile = path.join(__dirname, 'votes.json');

let comments = [];
let votes = { team1: 0, draw: 0, team2: 0 };

// Load existing comments and votes
try {
    comments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
    votes = JSON.parse(fs.readFileSync(votesFile, 'utf8'));
} catch (error) {
    console.log('No existing data found. Starting with empty data.');
}

io.on('connection', (socket) => {
    console.log('A user connected');

    // Send existing comments and votes to the newly connected client
    socket.emit('loadComments', comments);
    socket.emit('updateVotes', votes);

    socket.on('newComment', (comment) => {
        const newComment = {
            name: comment.name,
            comment: comment.comment,
            timestamp: Date.now()
        };
        comments.push(newComment);
        io.emit('comment', newComment);

        // Save comments to file
        fs.writeFileSync(commentsFile, JSON.stringify(comments));
    });

    socket.on('vote', (option) => {
        if (['team1', 'draw', 'team2'].includes(option)) {
            votes[option]++;
            io.emit('updateVotes', votes);

            // Save votes to file
            fs.writeFileSync(votesFile, JSON.stringify(votes));
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
