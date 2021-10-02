const express = require('express');
const router = express.Router();
const verify = require('../../middleware/verify');
const UserSchema = require('../../models/UserSchema');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');

// @route  GET api/auth
// @desc   Authenticate user & get token
// @access Public

router.get('/', verify, async (req, res) => {
    try {
        const user = await UserSchema.findById(req.user.id).select('-password');
        res.json(user);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Authentication Error');
    }
});

// @route  GET api/user
// @desc   Register Route
// @access Public

router.post('/', [
    check('email', 'please include a vaild email').isEmail(),
    check('password', 'Password is required').exists()
], 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        // See if user exists
        if(!user) {
            res.status(400).json({ errors: [{ msg: 'Invalid Credentials'}] });
        }
        
        // Match Password
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res
                .status(400)
                .json({ errors: [{ msg: 'Invalid Credentials'}] });
        }

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
            // Callback
            if(err) throw err;
            res.json({ token });
        });

    } catch(err) {
        console.error(err.message);
        res.status(500).send('User Registration Error');
    }
});

module.exports = router;