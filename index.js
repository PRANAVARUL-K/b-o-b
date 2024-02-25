const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ClientModel = require('./Models/Client')
//const Post = require('./Models/Post');
const jwt = require('jsonwebtoken')
const multer = require('multer');
const cookieparser = require('cookie-parser');
 

const app = express();
app.use(express.json())
app.use(cors())
app.use(cookieparser());

mongoose.connect("mongodb://localhost:27017/client");

app.use(express.static('images'));

app.post('/register', (req,res) => {
    ClientModel.create(req.body)
    .then(client => res.json(client))
    .catch(err => res.json(err))
})

app.post('/login', (req,res) => {
    const {userName, password} = req.body
    ClientModel.findOne({_id: userName})
    .then(user => {
        if(user)
        {
            if(user.password === password)
            {
                const token = user.generateAuthToken();
                res.status(200).send({data: token,message: "Success"});
            }
            else
                res.json("Password or Email is Incorrect")
        }
        else
        {
            res.json("Entered Email Id is not a user")
        }
        
    })
})

app.get('/user/:userId', (req, res) => {
    const userId = req.params.userId;
    ClientModel.findOne({_id: userId})
        .then(user => {
            if (user) {
                res.json(user);
            } else {
                res.status(404).json({message: "User not found"});
            }
        })
        .catch(err => {
            res.status(500).json({message: "Internal server error"});
        });
});

app.get('/search/:username', (req, res) => {
    const username = req.params.username;
    ClientModel.find({ _id: { $regex: username, $options: 'i' } })
        .then(users => {
            res.json(users);
        })
        .catch(err => {
            console.error('Error searching users:', err);
            res.status(500).json({ message: 'Internal server error' });
        });
});

app.get('/users', (req, res) => {
    ClientModel.find({})
        .then(users => {
            res.json(users);
        })
        .catch(err => {
            console.error('Error fetching users:', err);
            res.status(500).json({ message: 'Internal server error' });
        });
});

app.put('/user/update/:userId', (req, res) => {
    const userId = req.params.userId;
    const { email, profileDescription } = req.body;
    
    ClientModel.findByIdAndUpdate(
        userId, 
        { email, profileDescription }, 
        { new: true }
    )
    .then(user => {
        if (user) {
            res.json({ message: "User profile updated successfully", user });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    })
    .catch(err => {
        console.error('Error updating user profile:', err);
        res.status(500).json({ message: 'Internal server error' });
    });
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Uploads folder in the root directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});

// Set up multer middleware
const upload = multer({ storage: storage });

// Define a schema for the Post model
const postSchema = new mongoose.Schema({
    imageUrl: String,
    description: String // Add description field to the schema
});

// Create a model based on the schema
const Post = mongoose.model('Post', postSchema);

// Handle image upload endpoint
app.post("/upload-image", upload.single('image'), async (req, res) => {
    try {
        // Get the image file from the request
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Create a new Post document with the image URL
        const newPost = new Post({
            imageUrl: imageFile.filename // Assuming filename contains the URL of the image
        });

        // Save the new post to the database
        await newPost.save();

        return res.status(200).json({ message: 'Image uploaded successfully', imageUrl: imageFile.filename });
    } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


// Route to fetch all posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.listen(3001, () => {
    console.log('server is running');
})
